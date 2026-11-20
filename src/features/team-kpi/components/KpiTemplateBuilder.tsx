"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Edit3,
  Loader2,
  Lock,
  Plus,
  Save,
  Search,
  SlidersHorizontal,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  assignKpiMonthlyAction,
  clonePreviousMonthAssignmentsAction,
  toggleKpiTemplateActiveAction,
  upsertKpiTemplateAction,
} from "@/features/team-kpi/actions/kpi-template.actions";
import type { KpiTemplatesBuilderData } from "@/features/team-kpi/queries/kpi.queries";
import {
  KPI_CATEGORY_VALUES,
  KPI_METRIC_SOURCE_VALUES,
  KPI_UNIT_VALUES,
} from "@/features/team-kpi/schemas/kpi-template.schema";
import type { KpiTemplateDTO } from "@/features/team-kpi/types";
import {
  buildPeriodSelectOptions,
  getInitials,
  KPI_CATEGORY_LABELS,
  KPI_UNIT_LABELS,
  METRIC_SOURCE_META,
  ROLE_DISPLAY_META,
} from "@/features/team-kpi/utils/kpi-ui";
import { cn } from "@/lib/utils";

export interface KpiTemplateBuilderProps {
  data: KpiTemplatesBuilderData;
  canManageTemplates: boolean;
  canManageAssignments: boolean;
}

interface DraftAssignmentItem {
  kpiTemplateId: string;
  targetValue: string;
  weight: string;
}

function buildInitialItemsForUser(
  data: KpiTemplatesBuilderData,
  uid: string
): DraftAssignmentItem[] {
  if (!uid) return [];
  const existing = data.assignmentsByUser[uid] ?? [];
  if (existing.length > 0) {
    return existing.map((a) => ({
      kpiTemplateId: a.kpiTemplateId,
      targetValue: String(a.targetValue),
      weight: String(a.weight),
    }));
  }
  const targetUser = data.users.find((u) => u.id === uid);
  if (!targetUser) return [];
  const defaults = data.templates.filter(
    (t) =>
      t.isActive &&
      (t.applicableRoleId === targetUser.roleId || t.applicableRoleId === null)
  );
  return defaults.map((t) => ({
    kpiTemplateId: t.id,
    targetValue: String(t.defaultTargetValue),
    weight: String(t.defaultWeight),
  }));
}

interface TemplateFormState {
  id?: string;
  code: string;
  name: string;
  description: string;
  category: (typeof KPI_CATEGORY_VALUES)[number];
  applicableRoleId: string;
  metricSource: (typeof KPI_METRIC_SOURCE_VALUES)[number];
  unit: (typeof KPI_UNIT_VALUES)[number];
  defaultTargetValue: string;
  defaultWeight: string;
  isActive: boolean;
}

const DEFAULT_TEMPLATE_FORM: TemplateFormState = {
  code: "",
  name: "",
  description: "",
  category: "DELIVERY",
  applicableRoleId: "ALL",
  metricSource: "MANUAL_SCORE",
  unit: "SCORE_100",
  defaultTargetValue: "85",
  defaultWeight: "20",
  isActive: true,
};

export function KpiTemplateBuilder({
  data,
  canManageTemplates,
  canManageAssignments,
}: KpiTemplateBuilderProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Master Template Modal State
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState<TemplateFormState>(
    DEFAULT_TEMPLATE_FORM
  );
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [memberSearch, setMemberSearch] = useState<string>("");

  // Assignment Builder State
  const [selectedUserId, setSelectedUserId] = useState<string>(
    () => data.users[0]?.id ?? ""
  );
  const [localEditsByKey, setLocalEditsByKey] = useState<
    Record<string, DraftAssignmentItem[]>
  >({});
  const [addTemplateId, setAddTemplateId] = useState<string>("");

  const activeUserId = useMemo(() => {
    if (selectedUserId && data.users.some((u) => u.id === selectedUserId)) {
      return selectedUserId;
    }
    return data.users[0]?.id ?? "";
  }, [data.users, selectedUserId]);

  const filteredUsers = useMemo(() => {
    const q = memberSearch.trim().toLowerCase();
    if (!q) return data.users;
    return data.users.filter((u) =>
      `${u.fullName} ${u.department} ${u.roleCode}`.toLowerCase().includes(q)
    );
  }, [data.users, memberSearch]);

  const editKey = `${data.period.periodMonth}:${activeUserId}`;

  const draftItems = useMemo(
    () =>
      localEditsByKey[editKey] ?? buildInitialItemsForUser(data, activeUserId),
    [localEditsByKey, editKey, data, activeUserId]
  );

  const updateDraftItems = (
    updater:
      | DraftAssignmentItem[]
      | ((prev: DraftAssignmentItem[]) => DraftAssignmentItem[])
  ) => {
    setLocalEditsByKey((prev) => {
      const current =
        prev[editKey] ?? buildInitialItemsForUser(data, activeUserId);
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...prev, [editKey]: next };
    });
  };

  const periodOptions = useMemo(
    () => buildPeriodSelectOptions(data.period.year, data.period.month, 6, 3),
    [data.period.year, data.period.month]
  );

  const periodSelectItems = useMemo<Record<string, string>>(
    () => Object.fromEntries(periodOptions.map((opt) => [opt.value, opt.label])),
    [periodOptions]
  );

  const selectedUser = useMemo(
    () => data.users.find((u) => u.id === activeUserId) ?? null,
    [data.users, activeUserId]
  );

  const templateMap = useMemo(() => {
    const map = new Map<string, KpiTemplateDTO>();
    for (const tpl of data.templates) {
      map.set(tpl.id, tpl);
    }
    return map;
  }, [data.templates]);

  const filteredTemplates = useMemo(() => {
    if (roleFilter === "ALL") return data.templates;
    if (roleFilter === "GLOBAL") {
      return data.templates.filter((t) => t.applicableRoleId === null);
    }
    return data.templates.filter((t) => t.applicableRoleCode === roleFilter);
  }, [data.templates, roleFilter]);

  const totalWeightCents = useMemo(
    () =>
      draftItems.reduce((sum, item) => {
        const trimmed = item.weight.trim();
        const parsed = trimmed === "" ? 0 : Number(trimmed);
        const safe = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
        return sum + Math.round(safe * 100);
      }, 0),
    [draftItems]
  );
  const totalWeight = totalWeightCents / 100;
  const isWeightValid = totalWeightCents === 10000 && draftItems.length > 0;

  const availableTemplatesToAdd = useMemo(() => {
    const used = new Set(draftItems.map((i) => i.kpiTemplateId));
    return data.templates.filter((t) => t.isActive && !used.has(t.id));
  }, [data.templates, draftItems]);

  const addTemplateSelectItems = useMemo<Record<string, string>>(
    () =>
      Object.fromEntries(
        availableTemplatesToAdd.map((t) => [
          t.id,
          `${t.name} · ${METRIC_SOURCE_META[t.metricSource]?.isAuto ? "Sistem" : "Manual"}`,
        ])
      ),
    [availableTemplatesToAdd]
  );

  const roleFilterSelectItems = useMemo<Record<string, string>>(
    () => ({
      ALL: "Semua Peran",
      GLOBAL: "Semua Peran (Global)",
      ...Object.fromEntries(
        data.roles.map((r) => [r.code, ROLE_DISPLAY_META[r.code]?.label ?? r.name])
      ),
    }),
    [data.roles]
  );

  const modalRoleSelectItems = useMemo<Record<string, string>>(
    () => ({
      ALL: "Semua Peran (Global)",
      ...Object.fromEntries(
        data.roles.map((r) => [r.id, ROLE_DISPLAY_META[r.code]?.label ?? r.name])
      ),
    }),
    [data.roles]
  );

  const metricSourceSelectItems = useMemo<Record<string, string>>(
    () =>
      Object.fromEntries(
        KPI_METRIC_SOURCE_VALUES.map((src) => [
          src,
          METRIC_SOURCE_META[src]?.label ?? src,
        ])
      ),
    []
  );

  const categorySelectItems = useMemo<Record<string, string>>(
    () =>
      Object.fromEntries(
        KPI_CATEGORY_VALUES.map((cat) => [cat, KPI_CATEGORY_LABELS[cat]])
      ),
    []
  );

  const unitSelectItems = useMemo<Record<string, string>>(
    () =>
      Object.fromEntries(
        KPI_UNIT_VALUES.map((u) => [u, KPI_UNIT_LABELS[u]])
      ),
    []
  );

  const handleSelectUser = (uid: string) => {
    setSelectedUserId(uid);
    setAddTemplateId("");
  };

  const handleLoadRoleDefaults = () => {
    if (!selectedUser) return;
    const roleDefaults = data.templates.filter(
      (t) => t.isActive && t.applicableRoleId === selectedUser.roleId
    );
    const source =
      roleDefaults.length > 0
        ? roleDefaults
        : data.templates.filter((t) => t.isActive && t.applicableRoleId === null);

    updateDraftItems(
      source.map((t) => ({
        kpiTemplateId: t.id,
        targetValue: String(t.defaultTargetValue),
        weight: String(t.defaultWeight),
      }))
    );
    toast.info("Bobot default peran dimuat.");
  };

  const handleSaveAssignments = () => {
    if (!selectedUser || !canManageAssignments) return;
    for (const item of draftItems) {
      const tpl = templateMap.get(item.kpiTemplateId);
      const label = tpl?.name ?? item.kpiTemplateId;
      const targetRaw = item.targetValue.trim();
      const targetNum = Number(targetRaw);
      if (targetRaw === "" || !Number.isFinite(targetNum) || targetNum < 0) {
        toast.error(`Nilai target '${label}' harus ≥ 0.`);
        return;
      }
      const weightRaw = item.weight.trim();
      const weightNum = Number(weightRaw);
      if (weightRaw === "" || !Number.isFinite(weightNum) || weightNum <= 0) {
        toast.error(`Bobot '${label}' harus > 0%.`);
        return;
      }
    }

    if (!isWeightValid) {
      toast.error(`Total bobot wajib 100% (saat ini ${totalWeight}%).`);
      return;
    }

    startTransition(async () => {
      const res = await assignKpiMonthlyAction({
        userId: selectedUser.id,
        periodYear: data.period.year,
        periodMonth: data.period.month,
        items: draftItems.map((item) => ({
          kpiTemplateId: item.kpiTemplateId,
          targetValue: Number(item.targetValue),
          weight: Number(item.weight),
        })),
      });

      if (!res.success) {
        toast.error(res.error.message);
        return;
      }

      toast.success(res.message ?? "Assignment KPI disimpan.");
      router.refresh();
    });
  };

  const handleClonePreviousMonth = (onlySelectedUser: boolean) => {
    if (!canManageAssignments) return;
    startTransition(async () => {
      const res = await clonePreviousMonthAssignmentsAction({
        targetYear: data.period.year,
        targetMonth: data.period.month,
        userId: onlySelectedUser ? activeUserId : null,
        overwriteExisting: false,
      });

      if (!res.success) {
        toast.error(res.error.message);
        return;
      }

      setLocalEditsByKey((prev) => {
        if (!onlySelectedUser) {
          const next: Record<string, DraftAssignmentItem[]> = {};
          for (const [k, v] of Object.entries(prev)) {
            if (!k.startsWith(`${data.period.periodMonth}:`)) {
              next[k] = v;
            }
          }
          return next;
        }
        const next = { ...prev };
        delete next[editKey];
        return next;
      });

      toast.success(res.message ?? "Assignment bulan lalu disalin.");
      router.refresh();
    });
  };

  const openNewTemplateDialog = () => {
    setTemplateForm(DEFAULT_TEMPLATE_FORM);
    setTemplateDialogOpen(true);
  };

  const openEditTemplateDialog = (tpl: KpiTemplateDTO) => {
    setTemplateForm({
      id: tpl.id,
      code: tpl.code,
      name: tpl.name,
      description: tpl.description ?? "",
      category: tpl.category,
      applicableRoleId: tpl.applicableRoleId ?? "ALL",
      metricSource: tpl.metricSource,
      unit: tpl.unit,
      defaultTargetValue: String(tpl.defaultTargetValue),
      defaultWeight: String(tpl.defaultWeight),
      isActive: tpl.isActive,
    });
    setTemplateDialogOpen(true);
  };

  const handleSaveTemplate = () => {
    const targetRaw = templateForm.defaultTargetValue.trim();
    const targetNum = Number(targetRaw);
    if (targetRaw === "" || !Number.isFinite(targetNum) || targetNum < 0) {
      toast.error("Target default wajib angka ≥ 0.");
      return;
    }
    const weightRaw = templateForm.defaultWeight.trim();
    const weightNum = Number(weightRaw);
    if (weightRaw === "" || !Number.isFinite(weightNum) || weightNum <= 0) {
      toast.error("Bobot default wajib angka > 0.");
      return;
    }

    startTransition(async () => {
      const res = await upsertKpiTemplateAction({
        ...(templateForm.id ? { id: templateForm.id } : {}),
        code: templateForm.code,
        name: templateForm.name,
        description: templateForm.description || null,
        category: templateForm.category,
        applicableRoleId:
          templateForm.applicableRoleId === "ALL"
            ? null
            : templateForm.applicableRoleId,
        metricSource: templateForm.metricSource,
        unit: templateForm.unit,
        defaultTargetValue: targetNum,
        defaultWeight: weightNum,
        isHigherBetter: true,
        isActive: templateForm.isActive,
      });

      if (!res.success) {
        toast.error(res.error.message);
        return;
      }

      toast.success(res.message ?? "Template KPI tersimpan.");
      setTemplateDialogOpen(false);
      router.refresh();
    });
  };

  const handleToggleTemplateActive = (tpl: KpiTemplateDTO) => {
    startTransition(async () => {
      const res = await toggleKpiTemplateActiveAction({
        templateId: tpl.id,
        isActive: !tpl.isActive,
      });

      if (!res.success) {
        toast.error(res.error.message);
        return;
      }

      toast.success(res.message ?? "Status template diperbarui.");
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="assignments">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <TabsList>
            <TabsTrigger value="assignments">
              Penetapan Bulanan ({data.period.periodMonth})
            </TabsTrigger>
            <TabsTrigger value="templates">
              Master Template ({data.templates.length})
            </TabsTrigger>
          </TabsList>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={data.period.periodMonth}
              items={periodSelectItems}
              onValueChange={(val) => {
                if (val) {
                  router.push(`/kpi/templates?period=${val}`);
                }
              }}
            >
              <SelectTrigger
                className="w-48 min-w-0 overflow-hidden bg-card *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate"
                aria-label="Pilih periode assignment"
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

            {canManageAssignments ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending || data.prevMonthAssignmentsCount === 0}
                onClick={() => handleClonePreviousMonth(false)}
                className="gap-1.5"
              >
                {isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                <span>Clone {data.period.prevPeriodMonth}</span>
              </Button>
            ) : null}
          </div>
        </div>

        {/* TAB 1: Monthly KPI Assignments */}
        <TabsContent value="assignments" className="mt-4 space-y-4">
          <div className="grid gap-4 lg:grid-cols-12">
            {/* Team Members Sidebar */}
            <Card className="lg:col-span-4">
              <CardHeader className="space-y-2.5 pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">
                    Anggota Tim ({data.users.length})
                  </CardTitle>
                </div>
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Cari nama atau peran..."
                    className="h-8 bg-background pl-8 text-xs"
                  />
                </div>
              </CardHeader>
              <CardContent className="max-h-[520px] space-y-1.5 overflow-y-auto">
                {filteredUsers.map((u) => {
                  const isSelected = u.id === activeUserId;
                  const configured100 =
                    Math.round(u.totalAssignedWeight * 100) === 10000;
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectUser(u.id)}
                      className={cn(
                        "flex w-full items-center justify-between gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all",
                        isSelected
                          ? "border-primary/50 bg-primary/8 ring-1 ring-primary/20"
                          : "border-border/60 bg-background/40 hover:border-border hover:bg-muted/40"
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <Avatar size="sm" className="shrink-0">
                          <AvatarFallback className="text-[11px] font-semibold">
                            {getInitials(u.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {u.fullName}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {ROLE_DISPLAY_META[u.roleCode]?.label ?? u.roleCode}{" "}
                            · {u.department}
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {u.isFinalizedForPeriod ? (
                          <Badge
                            variant="outline"
                            className="gap-1 border-emerald-500/25 bg-emerald-500/10 text-[10px] text-emerald-700 dark:text-emerald-300"
                          >
                            <Lock className="size-2.5" />
                            Final
                          </Badge>
                        ) : configured100 ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/25 bg-emerald-500/10 font-mono text-[10px] text-emerald-700 dark:text-emerald-300"
                          >
                            100%
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-amber-500/25 bg-amber-500/10 font-mono text-[10px] text-amber-700 dark:text-amber-300"
                          >
                            {u.totalAssignedWeight}%
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Assignment Weight Builder */}
            <Card className="lg:col-span-8">
              <CardHeader className="pb-3">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <CardTitle className="text-base font-semibold">
                    {selectedUser
                      ? `Target & Bobot · ${selectedUser.fullName}`
                      : "Pilih Anggota"}
                  </CardTitle>

                  {selectedUser && canManageAssignments ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={
                          isPending || selectedUser.isFinalizedForPeriod
                        }
                        onClick={handleLoadRoleDefaults}
                        className="gap-1.5"
                      >
                        <Sparkles className="size-3.5" />
                        <span>Default Peran</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={
                          isPending ||
                          selectedUser.isFinalizedForPeriod ||
                          data.prevMonthAssignmentsCount === 0
                        }
                        onClick={() => handleClonePreviousMonth(true)}
                        className="gap-1.5"
                      >
                        <Copy className="size-3.5" />
                        <span>Salin Bulan Lalu</span>
                      </Button>
                    </div>
                  ) : null}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {!selectedUser ? (
                  <EmptyState
                    icon={SlidersHorizontal}
                    title="Pilih anggota di sebelah kiri"
                    className="py-10"
                  />
                ) : (
                  <>
                    {selectedUser.isFinalizedForPeriod ? (
                      <div className="flex items-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-xs text-emerald-700 dark:text-emerald-300">
                        <Lock className="size-4 shrink-0" />
                        <span>
                          Periode {data.period.periodMonth} berstatus FINALIZED
                          (terkunci).
                        </span>
                      </div>
                    ) : null}

                    {/* Live 100% Weight Meter */}
                    <div
                      className={cn(
                        "rounded-xl border p-3.5 transition-colors",
                        isWeightValid
                          ? "border-emerald-500/25 bg-emerald-500/8"
                          : "border-amber-500/25 bg-amber-500/8"
                      )}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="flex items-center gap-1.5">
                          {isWeightValid ? (
                            <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                          )}
                          <span>Total Bobot</span>
                        </span>
                        <span
                          className={cn(
                            "font-mono text-sm font-bold tabular-nums",
                            isWeightValid
                              ? "text-emerald-700 dark:text-emerald-300"
                              : "text-amber-700 dark:text-amber-300"
                          )}
                        >
                          {totalWeight.toFixed(0)}% / 100%
                        </span>
                      </div>
                      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-background/80 ring-1 ring-border/40">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-200",
                            isWeightValid
                              ? "bg-emerald-500"
                              : totalWeight > 100
                                ? "bg-rose-500"
                                : "bg-amber-500"
                          )}
                          style={{
                            width: `${Math.min(100, Math.max(0, totalWeight))}%`,
                          }}
                        />
                      </div>
                      {!isWeightValid ? (
                        <p className="mt-1.5 font-mono text-[11px] text-amber-700 dark:text-amber-300">
                          Selisih: {(100 - totalWeight).toFixed(2)}%
                        </p>
                      ) : null}
                    </div>

                    {/* Items Editor Table */}
                    {draftItems.length === 0 ? (
                      <EmptyState
                        title="Belum ada indikator"
                        description="Muat Default Peran atau tambahkan template di bawah."
                        className="py-6"
                      />
                    ) : (
                      <div className="overflow-hidden rounded-xl border border-border/60">
                        <Table>
                          <TableHeader className="bg-muted/40">
                            <TableRow className="hover:bg-transparent">
                              <TableHead>Indikator</TableHead>
                              <TableHead>Sumber</TableHead>
                              <TableHead className="w-36">Target</TableHead>
                              <TableHead className="w-28">Bobot (%)</TableHead>
                              <TableHead className="w-12" />
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {draftItems.map((item, idx) => {
                              const tpl = templateMap.get(item.kpiTemplateId);
                              const unitLabel = tpl
                                ? KPI_UNIT_LABELS[tpl.unit]
                                : "";
                              const srcMeta = tpl
                                ? METRIC_SOURCE_META[tpl.metricSource]
                                : null;

                              return (
                                <TableRow key={item.kpiTemplateId}>
                                  <TableCell>
                                    <div className="space-y-0.5">
                                      <p className="text-sm font-medium text-foreground">
                                        {tpl?.name ?? item.kpiTemplateId}
                                      </p>
                                      <p className="font-mono text-[11px] text-muted-foreground">
                                        {tpl?.code}
                                      </p>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        "font-mono text-[10px]",
                                        srcMeta?.badgeClass
                                      )}
                                    >
                                      {srcMeta ? (srcMeta.isAuto ? "Sistem" : "Manual") : (tpl?.metricSource ?? "-")}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1.5">
                                      <Input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        disabled={
                                          !canManageAssignments ||
                                          selectedUser.isFinalizedForPeriod
                                        }
                                        value={item.targetValue}
                                        onChange={(e) => {
                                          const rawValue = e.target.value;
                                          updateDraftItems((prev) =>
                                            prev.map((row, rIdx) =>
                                              rIdx === idx
                                                ? {
                                                    ...row,
                                                    targetValue: rawValue,
                                                  }
                                                : row
                                            )
                                          );
                                        }}
                                        className="h-8 font-mono text-xs tabular-nums"
                                      />
                                      <span className="shrink-0 text-[11px] text-muted-foreground">
                                        {unitLabel}
                                      </span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Input
                                      type="number"
                                      min={0.01}
                                      max={100}
                                      step="0.5"
                                      disabled={
                                        !canManageAssignments ||
                                        selectedUser.isFinalizedForPeriod
                                      }
                                      value={item.weight}
                                      onChange={(e) => {
                                        const rawValue = e.target.value;
                                        updateDraftItems((prev) =>
                                          prev.map((row, rIdx) =>
                                            rIdx === idx
                                              ? {
                                                  ...row,
                                                  weight: rawValue,
                                                }
                                              : row
                                          )
                                        );
                                      }}
                                      className="h-8 font-mono text-xs tabular-nums"
                                    />
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon-sm"
                                      disabled={
                                        !canManageAssignments ||
                                        selectedUser.isFinalizedForPeriod
                                      }
                                      onClick={() =>
                                        updateDraftItems((prev) =>
                                          prev.filter((_, rIdx) => rIdx !== idx)
                                        )
                                      }
                                      aria-label="Hapus indikator"
                                    >
                                      <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}

                    {/* Add Indicator Row + Save Action */}
                    {canManageAssignments &&
                    !selectedUser.isFinalizedForPeriod ? (
                      <div className="flex flex-col justify-between gap-3 border-t border-border/60 pt-3 sm:flex-row sm:items-center">
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <Select
                            value={addTemplateId || null}
                            items={addTemplateSelectItems}
                            onValueChange={(val) => {
                              setAddTemplateId(val ?? "");
                            }}
                          >
                            <SelectTrigger
                              className="w-full max-w-xs min-w-0 overflow-hidden bg-card *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate"
                              aria-label="Tambah indikator KPI"
                            >
                              <SelectValue placeholder="Tambah indikator..." className="block min-w-0 truncate" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableTemplatesToAdd.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                  <span className="truncate">
                                    {t.name} · {METRIC_SOURCE_META[t.metricSource]?.isAuto ? "Sistem" : "Manual"}
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={!addTemplateId}
                            onClick={() => {
                              const tpl = templateMap.get(addTemplateId);
                              if (!tpl) return;
                              updateDraftItems((prev) => [
                                ...prev,
                                {
                                  kpiTemplateId: tpl.id,
                                  targetValue: String(tpl.defaultTargetValue),
                                  weight: String(tpl.defaultWeight),
                                },
                              ]);
                              setAddTemplateId("");
                            }}
                            className="gap-1"
                          >
                            <Plus className="size-3.5" />
                            <span>Tambah</span>
                          </Button>
                        </div>

                        <Button
                          type="button"
                          disabled={isPending || !isWeightValid}
                          onClick={handleSaveAssignments}
                          className="gap-1.5"
                        >
                          {isPending ? (
                            <Loader2 className="size-4 animate-spin" />
                          ) : (
                            <Save className="size-4" />
                          )}
                          <span>Simpan</span>
                        </Button>
                      </div>
                    ) : null}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* TAB 2: Master KPI Templates */}
        <TabsContent value="templates" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <CardTitle className="text-base font-semibold">
                  Katalog Indikator KPI
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Select
                    value={roleFilter}
                    items={roleFilterSelectItems}
                    onValueChange={(val) => {
                      if (val) setRoleFilter(val);
                    }}
                  >
                    <SelectTrigger className="w-44 min-w-0 overflow-hidden bg-card *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                      <SelectValue placeholder="Filter peran" className="block min-w-0 truncate" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Semua Peran</SelectItem>
                      <SelectItem value="GLOBAL">
                        Semua Peran (Global)
                      </SelectItem>
                      {data.roles.map((r) => (
                        <SelectItem key={r.id} value={r.code}>
                          {ROLE_DISPLAY_META[r.code]?.label ?? r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {canManageTemplates ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={openNewTemplateDialog}
                      className="gap-1.5"
                    >
                      <Plus className="size-3.5" />
                      <span>Template Baru</span>
                    </Button>
                  ) : null}
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="overflow-hidden rounded-xl border border-border/60">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Kode</TableHead>
                      <TableHead>Indikator</TableHead>
                      <TableHead>Peran</TableHead>
                      <TableHead>Sumber</TableHead>
                      <TableHead>Kategori</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Bobot</TableHead>
                      <TableHead>Status</TableHead>
                      {canManageTemplates ? (
                        <TableHead className="text-right">Aksi</TableHead>
                      ) : null}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.map((tpl) => {
                      const roleMeta = tpl.applicableRoleCode
                        ? ROLE_DISPLAY_META[tpl.applicableRoleCode]
                        : null;
                      const srcMeta = METRIC_SOURCE_META[tpl.metricSource];
                      return (
                        <TableRow key={tpl.id}>
                          <TableCell className="font-mono text-xs font-semibold">
                            {tpl.code}
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-foreground">
                              {tpl.name}
                            </p>
                            {tpl.description ? (
                              <p className="max-w-xs truncate text-xs text-muted-foreground">
                                {tpl.description}
                              </p>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            {roleMeta ? (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "font-mono text-[10px]",
                                  roleMeta.badgeClass
                                )}
                              >
                                {roleMeta.label}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-[10px]">
                                Global
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(
                                "font-mono text-[10px]",
                                srcMeta.badgeClass
                              )}
                            >
                              {srcMeta.isAuto ? "Sistem (Otomatis)" : "Penilaian Manual"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {KPI_CATEGORY_LABELS[tpl.category]}
                          </TableCell>
                          <TableCell className="font-mono text-xs tabular-nums">
                            {tpl.defaultTargetValue} {KPI_UNIT_LABELS[tpl.unit]}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-semibold tabular-nums">
                            {tpl.defaultWeight}%
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                              <span
                                className={cn(
                                  "size-2 rounded-full",
                                  tpl.isActive
                                    ? "bg-emerald-500"
                                    : "bg-slate-400"
                                )}
                              />
                              <span
                                className={
                                  tpl.isActive
                                    ? "text-foreground"
                                    : "text-muted-foreground"
                                }
                              >
                                {tpl.isActive ? "Aktif" : "Nonaktif"}
                              </span>
                            </span>
                          </TableCell>
                          {canManageTemplates ? (
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="xs"
                                  disabled={isPending}
                                  onClick={() => openEditTemplateDialog(tpl)}
                                  className="gap-1"
                                >
                                  <Edit3 className="size-3" />
                                  <span>Ubah</span>
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="xs"
                                  disabled={isPending}
                                  onClick={() =>
                                    handleToggleTemplateActive(tpl)
                                  }
                                  className="text-muted-foreground"
                                >
                                  {tpl.isActive ? "Nonaktifkan" : "Aktifkan"}
                                </Button>
                              </div>
                            </TableCell>
                          ) : null}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upsert KPI Template Modal */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {templateForm.id ? "Edit Template KPI" : "Template KPI Baru"}
            </DialogTitle>
            <DialogDescription>
              Atur sumber kalkulasi, target, dan bobot default indikator.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-1">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="tpl-code">Kode Unik</Label>
                <Input
                  id="tpl-code"
                  placeholder="KPI_CUSTOM_01"
                  value={templateForm.code}
                  onChange={(e) =>
                    setTemplateForm((prev) => ({
                      ...prev,
                      code: e.target.value.toUpperCase(),
                    }))
                  }
                  className="font-mono"
                />
              </div>

              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="tpl-role">Peran Target</Label>
                <Select
                  value={templateForm.applicableRoleId}
                  items={modalRoleSelectItems}
                  onValueChange={(val) => {
                    if (val) {
                      setTemplateForm((prev) => ({
                        ...prev,
                        applicableRoleId: val,
                      }));
                    }
                  }}
                >
                  <SelectTrigger id="tpl-role" className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                    <SelectValue className="block min-w-0 truncate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Semua Peran (Global)</SelectItem>
                    {data.roles.map((r) => (
                      <SelectItem key={r.id} value={r.id}>
                        {ROLE_DISPLAY_META[r.code]?.label ?? r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tpl-name">Nama Indikator</Label>
              <Input
                id="tpl-name"
                placeholder="Ketepatan Pengiriman Desain"
                value={templateForm.name}
                onChange={(e) =>
                  setTemplateForm((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="min-w-0 space-y-1.5">
                <Label>Sumber</Label>
                <Select
                  value={templateForm.metricSource}
                  items={metricSourceSelectItems}
                  onValueChange={(val) => {
                    if (val) {
                      setTemplateForm((prev) => ({
                        ...prev,
                        metricSource:
                          val as (typeof KPI_METRIC_SOURCE_VALUES)[number],
                      }));
                    }
                  }}
                >
                  <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                    <SelectValue className="block min-w-0 truncate" />
                  </SelectTrigger>
                  <SelectContent>
                    {KPI_METRIC_SOURCE_VALUES.map((src) => (
                      <SelectItem key={src} value={src}>
                        <span className="truncate">
                          {METRIC_SOURCE_META[src]?.label ?? src}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-0 space-y-1.5">
                <Label>Kategori</Label>
                <Select
                  value={templateForm.category}
                  items={categorySelectItems}
                  onValueChange={(val) => {
                    if (val) {
                      setTemplateForm((prev) => ({
                        ...prev,
                        category: val as (typeof KPI_CATEGORY_VALUES)[number],
                      }));
                    }
                  }}
                >
                  <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                    <SelectValue className="block min-w-0 truncate" />
                  </SelectTrigger>
                  <SelectContent>
                    {KPI_CATEGORY_VALUES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        <span className="truncate">
                          {KPI_CATEGORY_LABELS[cat]}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-0 space-y-1.5">
                <Label>Satuan</Label>
                <Select
                  value={templateForm.unit}
                  items={unitSelectItems}
                  onValueChange={(val) => {
                    if (val) {
                      setTemplateForm((prev) => ({
                        ...prev,
                        unit: val as (typeof KPI_UNIT_VALUES)[number],
                      }));
                    }
                  }}
                >
                  <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                    <SelectValue className="block min-w-0 truncate" />
                  </SelectTrigger>
                  <SelectContent>
                    {KPI_UNIT_VALUES.map((u) => (
                      <SelectItem key={u} value={u}>
                        {KPI_UNIT_LABELS[u]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="tpl-target">Target Default</Label>
                <Input
                  id="tpl-target"
                  type="number"
                  step="0.01"
                  value={templateForm.defaultTargetValue}
                  onChange={(e) =>
                    setTemplateForm((prev) => ({
                      ...prev,
                      defaultTargetValue: e.target.value,
                    }))
                  }
                  className="font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tpl-weight">Bobot Default (%)</Label>
                <Input
                  id="tpl-weight"
                  type="number"
                  step="0.5"
                  value={templateForm.defaultWeight}
                  onChange={(e) =>
                    setTemplateForm((prev) => ({
                      ...prev,
                      defaultWeight: e.target.value,
                    }))
                  }
                  className="font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tpl-desc">Panduan (Opsional)</Label>
              <Textarea
                id="tpl-desc"
                rows={2}
                placeholder="Catatan singkat indikator..."
                value={templateForm.description}
                onChange={(e) =>
                  setTemplateForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setTemplateDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={handleSaveTemplate}
              className="gap-1.5"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              <span>Simpan</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
