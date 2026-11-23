"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Award,
  CheckCircle2,
  Loader2,
  Lock,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  createDataTableColumnHelper,
  DataTable,
  type DataTableColumnDef,
} from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteDraftEvaluationAction,
  generateMonthlyEvaluationAction,
} from "@/features/team-kpi/actions/evaluation.actions";
import type { EvaluationsListPageData } from "@/features/team-kpi/queries/kpi.queries";
import type {
  EvaluationListRowDTO,
  EvaluationStatus,
  KpiGrade,
} from "@/features/team-kpi/types";
import {
  buildPeriodSelectOptions,
  formatKpiPercent,
  formatKpiScore,
  getInitials,
  ROLE_DISPLAY_META,
} from "@/features/team-kpi/utils/kpi-ui";
import { cn } from "@/lib/utils";

export interface EvaluationsDirectoryClientProps {
  data: EvaluationsListPageData;
}

type StatusFilter = "ALL" | EvaluationStatus;

const columnHelper = createDataTableColumnHelper<EvaluationListRowDTO>();

const GRADE_PILL_STYLE: Record<KpiGrade, string> = {
  A: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300",
  B: "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-300",
  C: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300",
  D: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-300",
};

const STATUS_PILLS: Array<{
  key: StatusFilter;
  label: string;
  dotClass: string;
}> = [
  { key: "ALL", label: "Semua", dotClass: "bg-slate-600 dark:bg-slate-300" },
  { key: "DRAFT", label: "Draft", dotClass: "bg-slate-500" },
  { key: "SUBMITTED", label: "Submitted", dotClass: "bg-blue-600" },
  { key: "REVIEWED", label: "Reviewed", dotClass: "bg-indigo-600" },
  { key: "FINALIZED", label: "Finalized", dotClass: "bg-emerald-600" },
];

export function EvaluationsDirectoryClient({
  data,
}: EvaluationsDirectoryClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] =
    useState<EvaluationListRowDTO | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");

  const readyToGenerateCandidates = useMemo(
    () =>
      data.eligibleCandidates.filter(
        (c) =>
          !c.hasExistingEvaluation &&
          c.canActorEvaluate &&
          c.hasValidAssignments
      ),
    [data.eligibleCandidates]
  );

  const [selectedUserId, setSelectedUserId] = useState<string>(
    () => readyToGenerateCandidates[0]?.userId ?? "ALL_ELIGIBLE"
  );

  const periodOptions = useMemo(
    () =>
      buildPeriodSelectOptions(
        data.period.year,
        data.period.month,
        12,
        1
      ),
    [data.period.year, data.period.month]
  );

  const periodSelectItems = useMemo<Record<string, string>>(
    () => Object.fromEntries(periodOptions.map((opt) => [opt.value, opt.label])),
    [periodOptions]
  );

  const targetSelectItems = useMemo<Record<string, string>>(
    () => ({
      ALL_ELIGIBLE: `Semua Anggota Siap (${readyToGenerateCandidates.length} orang)`,
      ...Object.fromEntries(
        readyToGenerateCandidates.map((c) => [
          c.userId,
          `${c.fullName} · ${ROLE_DISPLAY_META[c.roleCode]?.label ?? c.roleCode}`,
        ])
      ),
    }),
    [readyToGenerateCandidates]
  );

  const effectiveSelectedUserId = targetSelectItems[selectedUserId]
    ? selectedUserId
    : (readyToGenerateCandidates[0]?.userId ?? "ALL_ELIGIBLE");

  const statusCounts = useMemo(() => {
    const counts = {
      ALL: data.evaluations.length,
      DRAFT: 0,
      SUBMITTED: 0,
      REVIEWED: 0,
      FINALIZED: 0,
    };
    for (const ev of data.evaluations) {
      counts[ev.status] += 1;
    }
    return counts;
  }, [data.evaluations]);

  const filteredEvaluations = useMemo(() => {
    if (statusFilter === "ALL") return data.evaluations;
    return data.evaluations.filter((ev) => ev.status === statusFilter);
  }, [data.evaluations, statusFilter]);

  const handleGenerate = () => {
    startTransition(async () => {
      const isBatch = effectiveSelectedUserId === "ALL_ELIGIBLE";
      const res = await generateMonthlyEvaluationAction({
        ...(isBatch
          ? { generateAll: true }
          : { userId: effectiveSelectedUserId }),
        periodMonth: data.period.periodMonth,
      });

      if (!res.success) {
        toast.error(res.error.message);
        return;
      }

      toast.success(res.message ?? "Draft evaluasi berhasil dibuat.");
      setGenerateDialogOpen(false);
      router.refresh();
    });
  };

  const handleConfirmDeleteDraft = () => {
    if (!deleteTarget) return;
    startTransition(async () => {
      const res = await deleteDraftEvaluationAction({
        evaluationId: deleteTarget.id,
      });

      if (!res.success) {
        toast.error(res.error.message);
        return;
      }

      toast.success(res.message ?? "Draft evaluasi berhasil dihapus.");
      setDeleteTarget(null);
      router.refresh();
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = useMemo<DataTableColumnDef<EvaluationListRowDTO, any>[]>(
    () => [
      columnHelper.accessor("userName", {
        header: "Anggota",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex items-center gap-3 py-0.5">
              <Avatar
                size="sm"
                className="ring-2 ring-slate-200 dark:ring-slate-700"
              >
                {row.userAvatarUrl ? (
                  <AvatarImage src={row.userAvatarUrl} alt={row.userName} />
                ) : null}
                <AvatarFallback className="bg-slate-100 text-[11px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                  {getInitials(row.userName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-900 dark:text-white">
                  {row.userName}
                </p>
                <p className="truncate text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  {row.userDepartment} ·{" "}
                  {ROLE_DISPLAY_META[row.userRole]?.label ?? row.userRole}
                </p>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("periodMonthLabel", {
        header: "Periode",
        cell: (info) => (
          <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
            {info.row.original.periodMonthLabel}
          </span>
        ),
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex items-center gap-1.5">
              <StatusBadge domain="evaluation" value={row.status} />
              {row.isMaskedForEmployee ? (
                <Lock
                  className="size-3.5 text-slate-500 dark:text-slate-400"
                  aria-label="Menunggu finalisasi"
                />
              ) : null}
            </div>
          );
        },
      }),
      columnHelper.accessor("evaluatorName", {
        header: "Evaluator",
        cell: (info) => (
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {info.row.original.evaluatorName}
          </span>
        ),
      }),
      columnHelper.accessor("completionRate", {
        header: "TCR",
        cell: (info) => {
          const row = info.row.original;
          return (
            <span className="font-mono text-xs font-bold tabular-nums text-slate-900 dark:text-white">
              {row.isMaskedForEmployee
                ? "—"
                : formatKpiPercent(row.completionRate)}
            </span>
          );
        },
      }),
      columnHelper.accessor("onTimeRate", {
        header: "OTDR",
        cell: (info) => {
          const row = info.row.original;
          return (
            <span className="font-mono text-xs font-bold tabular-nums text-slate-900 dark:text-white">
              {row.isMaskedForEmployee ? "—" : formatKpiPercent(row.onTimeRate)}
            </span>
          );
        },
      }),
      columnHelper.accessor("weightedKpiScore", {
        header: "Skor & Grade",
        cell: (info) => {
          const row = info.row.original;
          if (row.isMaskedForEmployee) {
            return (
              <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <Lock className="size-3" />
                <span>Terkunci</span>
              </span>
            );
          }
          return (
            <div className="flex items-center gap-2 font-mono">
              <span className="text-sm font-extrabold tabular-nums text-slate-900 dark:text-white">
                {formatKpiScore(row.weightedKpiScore)}
              </span>
              {row.performanceGrade ? (
                <Badge
                  variant="outline"
                  className={cn(
                    "px-2.5 text-[11px] font-extrabold",
                    GRADE_PILL_STYLE[row.performanceGrade]
                  )}
                >
                  Grade {row.performanceGrade}
                </Badge>
              ) : null}
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: (info) => {
          const row = info.row.original;
          if (row.isMaskedForEmployee) {
            return null;
          }
          const canDeleteRow =
            data.canDeleteDraft &&
            row.status === "DRAFT" &&
            (data.isSuperAdmin ||
              (row.userRole !== "PROJECT_MANAGER" &&
                row.userRole !== "SUPER_ADMIN"));
          return (
            <div className="flex items-center justify-end gap-1.5">
              {canDeleteRow ? (
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  disabled={isPending}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteTarget(row);
                  }}
                  className="gap-1 rounded-lg border-rose-200 bg-rose-50/70 font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                >
                  <Trash2 className="size-3.5" />
                  <span>Hapus Draft</span>
                </Button>
              ) : null}
              <Link
                href={`/kpi/evaluations/${row.id}`}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  buttonVariants({ variant: "outline", size: "xs" }),
                  "gap-1 rounded-lg border-slate-200 bg-white font-bold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                )}
              >
                <span>Buka</span>
                <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          );
        },
      }),
    ],
    [data.canDeleteDraft, data.isSuperAdmin, isPending]
  );

  return (
    <div className="space-y-5">
      {/* Sleek Status Filter Pills */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div
          className="inline-flex flex-wrap items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800/80"
          role="tablist"
          aria-label="Filter status evaluasi"
        >
          {STATUS_PILLS.map((pill) => {
            const active = statusFilter === pill.key;
            const count = statusCounts[pill.key];
            return (
              <button
                key={pill.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setStatusFilter(pill.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all",
                  active
                    ? "bg-white font-bold text-slate-900 shadow-xs ring-1 ring-slate-200 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
                    : "font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                )}
              >
                <span className={cn("size-2 rounded-full", pill.dotClass)} />
                <span>{pill.label}</span>
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.2 font-mono text-[10px] font-bold",
                    active
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                      : "bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {data.canManageEvaluations ? (
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={data.period.periodMonth}
              items={periodSelectItems}
              onValueChange={(val) => {
                if (val) router.push(`/kpi/evaluations?period=${val}`);
              }}
            >
              <SelectTrigger
                className="w-48 min-w-0 overflow-hidden rounded-xl border-slate-200 bg-slate-50 font-semibold text-slate-800 *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                aria-label="Pilih periode evaluasi"
              >
                <SelectValue className="block min-w-0 truncate" />
              </SelectTrigger>
              <SelectContent>
                {periodOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              type="button"
              size="sm"
              onClick={() => {
                setSelectedUserId(
                  readyToGenerateCandidates[0]?.userId ?? "ALL_ELIGIBLE"
                );
                setGenerateDialogOpen(true);
              }}
              className="gap-1.5 rounded-xl bg-blue-600 font-bold text-white shadow-sm hover:bg-blue-700"
            >
              <Plus className="size-3.5" />
              <span>Generate Evaluasi</span>
            </Button>
          </div>
        ) : null}
      </div>

      {/* Main Evaluations Table */}
      <DataTable
        columns={columns}
        data={filteredEvaluations}
        searchPlaceholder="Cari nama anggota atau evaluator..."
        pagination={{ pageSize: 12 }}
        className="[&>div:nth-child(2)]:border-slate-200 [&>div:nth-child(2)]:bg-white [&>div:nth-child(2)]:shadow-xs dark:[&>div:nth-child(2)]:border-slate-800 dark:[&>div:nth-child(2)]:bg-slate-900 [&_[data-slot=table-header]]:border-b [&_[data-slot=table-header]]:border-slate-200 [&_[data-slot=table-header]]:bg-slate-50 dark:[&_[data-slot=table-header]]:border-slate-800 dark:[&_[data-slot=table-header]]:bg-slate-800/70 [&_[data-slot=table-head]]:text-xs [&_[data-slot=table-head]]:font-bold [&_[data-slot=table-head]]:text-slate-700 [&_[data-slot=table-head]]:uppercase dark:[&_[data-slot=table-head]]:text-slate-200 [&_[data-slot=table-row]]:border-slate-200 dark:[&_[data-slot=table-row]]:border-slate-800 [&_[data-slot=table-row]:hover]:bg-slate-50/90 dark:[&_[data-slot=table-row]:hover]:bg-slate-800/50"
        onRowClick={(row) => {
          if (!row.isMaskedForEmployee) {
            router.push(`/kpi/evaluations/${row.id}`);
          }
        }}
        emptyState={
          <EmptyState
            icon={Award}
            title="Belum ada evaluasi"
            description={
              data.canManageEvaluations
                ? `Belum ada evaluasi untuk filter ini di periode ${data.period.periodMonth}.`
                : "Rapor evaluasi akan tampil setelah berstatus Finalized."
            }
          />
        }
      />

      {/* Generate Monthly Evaluation Dialog */}
      {data.canManageEvaluations ? (
        <Dialog open={generateDialogOpen} onOpenChange={setGenerateDialogOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="size-4 text-primary" />
                <span>Generate Draft ({data.period.periodMonth})</span>
              </DialogTitle>
              <DialogDescription>
                Menarik target 100% &amp; metrik otomatis (TCR, OTDR, DQS,
                CPVS).
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-1">
              <div className="min-w-0 space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  Target Anggota
                </label>
                <Select
                  value={effectiveSelectedUserId}
                  items={targetSelectItems}
                  onValueChange={(val) => {
                    if (val) setSelectedUserId(val);
                  }}
                >
                  <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                    <SelectValue placeholder="Pilih target..." className="block min-w-0 truncate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL_ELIGIBLE">
                      Semua Anggota Siap ({readyToGenerateCandidates.length}{" "}
                      orang)
                    </SelectItem>
                    {readyToGenerateCandidates.map((c) => (
                      <SelectItem key={c.userId} value={c.userId}>
                        <span className="truncate">
                          {c.fullName} · {ROLE_DISPLAY_META[c.roleCode]?.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-border/70 p-2">
                {data.eligibleCandidates.map((c) => (
                  <div
                    key={c.userId}
                    className="flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs hover:bg-muted/50"
                  >
                    <span className="truncate font-medium text-foreground">
                      {c.fullName}
                    </span>
                    {c.hasExistingEvaluation ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/25 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-300"
                      >
                        Sudah Ada
                      </Badge>
                    ) : !c.canActorEvaluate ? (
                      <span className="truncate text-[10px] text-muted-foreground">
                        {c.blockedReason}
                      </span>
                    ) : !c.hasValidAssignments ? (
                      <Link
                        href={`/kpi/templates?period=${data.period.periodMonth}`}
                        className="text-[10px] font-medium text-amber-600 hover:underline dark:text-amber-400"
                      >
                        Atur Bobot 100% →
                      </Link>
                    ) : (
                      <Badge
                        variant="outline"
                        className="gap-1 border-blue-500/25 bg-blue-500/10 text-[10px] text-blue-700 dark:text-blue-300"
                      >
                        <CheckCircle2 className="size-2.5" />
                        Siap
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => setGenerateDialogOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="button"
                disabled={
                  isPending || readyToGenerateCandidates.length === 0
                }
                onClick={handleGenerate}
                className="gap-1.5"
              >
                {isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Sparkles className="size-4" />
                )}
                <span>Generate Draft</span>
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Hapus Draft Evaluasi?"
        description={`Draft evaluasi KPI untuk ${deleteTarget?.userName ?? ""} periode ${deleteTarget?.periodMonthLabel ?? ""} akan dihapus permanen. Anda dapat melakukan generate ulang jika diperlukan.`}
        confirmLabel="Hapus Draft"
        variant="destructive"
        isLoading={isPending}
        onConfirm={handleConfirmDeleteDraft}
      />
    </div>
  );
}
