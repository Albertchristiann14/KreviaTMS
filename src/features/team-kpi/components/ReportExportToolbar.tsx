"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  FileSpreadsheet,
  Loader2,
  Lock,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import type { KpiDashboardFilterOptions } from "@/features/team-kpi/queries/kpi.queries";
import type {
  KpiGrade,
  TeamPerformanceOverviewDTO,
} from "@/features/team-kpi/types";
import {
  buildPeriodSelectOptions,
  formatKpiPercent,
  formatKpiScore,
  formatPeriodLabelId,
  formatWibDateTime,
  getInitials,
  ROLE_DISPLAY_META,
} from "@/features/team-kpi/utils/kpi-ui";
import { cn } from "@/lib/utils";

export interface ReportExportToolbarProps {
  overview: TeamPerformanceOverviewDTO;
  filterOptions: KpiDashboardFilterOptions;
  exporterName: string;
}

const GRADE_PILL_STYLE: Record<KpiGrade, string> = {
  A: "border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
  B: "border-blue-500/30 bg-blue-500/12 text-blue-700 dark:text-blue-300",
  C: "border-amber-500/30 bg-amber-500/12 text-amber-700 dark:text-amber-300",
  D: "border-rose-500/30 bg-rose-500/12 text-rose-700 dark:text-rose-300",
};

export function ReportExportToolbar({
  overview,
  filterOptions,
  exporterName,
}: ReportExportToolbarProps) {
  const router = useRouter();
  const [department, setDepartment] = useState<string>(
    overview.filters.department ?? "ALL"
  );
  const [projectId, setProjectId] = useState<string>(
    overview.filters.projectId ?? "ALL"
  );
  const [exportingScope, setExportingScope] = useState<
    "team" | "tasks" | null
  >(null);

  const periodOptions = useMemo(
    () =>
      buildPeriodSelectOptions(
        overview.period.year,
        overview.period.month,
        12,
        1
      ),
    [overview.period.year, overview.period.month]
  );

  const periodSelectItems = useMemo<Record<string, string>>(
    () => Object.fromEntries(periodOptions.map((opt) => [opt.value, opt.label])),
    [periodOptions]
  );

  const deptSelectItems = useMemo<Record<string, string>>(
    () => ({
      ALL: "Semua Divisi",
      ...Object.fromEntries(filterOptions.departments.map((d) => [d, d])),
    }),
    [filterOptions.departments]
  );

  const projectSelectItems = useMemo<Record<string, string>>(
    () => ({
      ALL: "Semua Proyek",
      ...Object.fromEntries(
        filterOptions.projects.map((p) => [p.id, `${p.code} — ${p.name}`])
      ),
    }),
    [filterOptions.projects]
  );

  const applyServerFilters = (
    nextPeriod: string,
    nextDept: string,
    nextProject: string
  ) => {
    const params = new URLSearchParams({ period: nextPeriod });
    if (nextDept && nextDept !== "ALL") params.set("department", nextDept);
    if (nextProject && nextProject !== "ALL")
      params.set("projectId", nextProject);
    router.push(`/kpi/reports?${params.toString()}`);
  };

  const buildExportUrl = (scope: "team" | "tasks") => {
    const params = new URLSearchParams({
      period: overview.period.periodMonth,
      scope,
    });
    if (department !== "ALL") params.set("department", department);
    if (projectId !== "ALL") params.set("projectId", projectId);
    return `/api/kpi/reports/export?${params.toString()}`;
  };

  const handleExportCsv = async (scope: "team" | "tasks") => {
    if (exportingScope !== null) return;
    setExportingScope(scope);
    try {
      const res = await fetch(buildExportUrl(scope), {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        toast.error(
          errBody?.error?.message ?? "Gagal mengekspor laporan CSV."
        );
        return;
      }

      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filenameMatch = /filename="([^"]+)"/.exec(disposition);
      const fallbackName =
        scope === "tasks"
          ? `ktms-task-execution-report-${overview.period.periodMonth}.csv`
          : `ktms-team-kpi-summary-${overview.period.periodMonth}.csv`;
      const filename = filenameMatch?.[1] ?? fallbackName;

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(objectUrl);

      toast.success(`Laporan ${filename} diunduh.`);
    } catch {
      toast.error("Gagal mengunduh laporan CSV.");
    } finally {
      setExportingScope(null);
    }
  };

  const generatedAtText = formatWibDateTime(new Date().toISOString());

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          aside, header, [data-print-hide="true"] {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
        }
      `}</style>

      {/* Filter & Export Strip */}
      <div
        className="flex flex-col justify-between gap-3 rounded-xl border border-border/70 bg-card/80 p-3 lg:flex-row lg:items-center print:hidden"
        data-print-hide="true"
      >
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={overview.period.periodMonth}
            items={periodSelectItems}
            onValueChange={(val) => {
              if (val) applyServerFilters(val, department, projectId);
            }}
          >
            <SelectTrigger
              className="w-48 min-w-0 overflow-hidden bg-background *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate"
              aria-label="Pilih periode laporan"
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

          <Select
            value={department}
            items={deptSelectItems}
            onValueChange={(val) => {
              if (!val) return;
              setDepartment(val);
              applyServerFilters(
                overview.period.periodMonth,
                val,
                projectId
              );
            }}
          >
            <SelectTrigger
              className="w-40 min-w-0 overflow-hidden bg-background *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate"
              aria-label="Filter divisi"
            >
              <SelectValue placeholder="Semua Divisi" className="block min-w-0 truncate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Divisi</SelectItem>
              {filterOptions.departments.map((dept) => (
                <SelectItem key={dept} value={dept}>
                  {dept}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={projectId}
            items={projectSelectItems}
            onValueChange={(val) => {
              if (!val) return;
              setProjectId(val);
              applyServerFilters(
                overview.period.periodMonth,
                department,
                val
              );
            }}
          >
            <SelectTrigger
              className="w-48 min-w-0 overflow-hidden bg-background *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate"
              aria-label="Filter proyek"
            >
              <SelectValue placeholder="Semua Proyek" className="block min-w-0 truncate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Proyek</SelectItem>
              {filterOptions.projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="truncate">
                    {p.code} — {p.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            disabled={exportingScope !== null}
            onClick={() => void handleExportCsv("team")}
            className="gap-1.5"
          >
            {exportingScope === "team" ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="size-3.5" aria-hidden="true" />
            )}
            <span>Team CSV</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={exportingScope !== null}
            onClick={() => void handleExportCsv("tasks")}
            className="gap-1.5"
          >
            {exportingScope === "tasks" ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <FileSpreadsheet className="size-3.5" aria-hidden="true" />
            )}
            <span>Task CSV</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5"
          >
            <Printer className="size-3.5" aria-hidden="true" />
            <span>Cetak PDF</span>
          </Button>
        </div>
      </div>

      {/* Executive Report Document Sheet */}
      <Card className="overflow-hidden border-border/70 print:border-0 print:shadow-none print:ring-0">
        <CardHeader className="border-b border-border/60 bg-muted/20 pb-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <p className="text-[11px] font-semibold tracking-widest text-primary uppercase">
                Krevia Digital · Performance Report
              </p>
              <CardTitle className="mt-1 text-xl font-semibold tracking-tight">
                {formatPeriodLabelId(
                  overview.period.year,
                  overview.period.month
                )}
              </CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                {department === "ALL" ? "Semua Divisi" : department} ·{" "}
                {projectId === "ALL"
                  ? "Semua Proyek"
                  : (filterOptions.projects.find((p) => p.id === projectId)
                      ?.name ?? projectId)}
              </p>
            </div>

            <div className="text-left font-mono text-[11px] text-muted-foreground sm:text-right">
              <p>{generatedAtText}</p>
              <p>Oleh {exporterName}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 pt-5">
          {/* Executive Metrics Strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-border/60 bg-muted/25 p-3.5">
              <p className="text-[11px] font-medium text-muted-foreground">
                Avg TCR
              </p>
              <p className="mt-1 font-mono text-xl font-bold tabular-nums">
                {formatKpiPercent(overview.summary.avgTcr)}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/25 p-3.5">
              <p className="text-[11px] font-medium text-muted-foreground">
                Avg OTDR
              </p>
              <p className="mt-1 font-mono text-xl font-bold tabular-nums">
                {formatKpiPercent(overview.summary.avgOtdr)}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/25 p-3.5">
              <p className="text-[11px] font-medium text-muted-foreground">
                Avg DQS
              </p>
              <p className="mt-1 font-mono text-xl font-bold tabular-nums">
                {formatKpiScore(overview.summary.avgDqs)}
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/25 p-3.5">
              <p className="text-[11px] font-medium text-muted-foreground">
                Finalized
              </p>
              <p className="mt-1 font-mono text-xl font-bold tabular-nums">
                {overview.summary.finalizedEvaluationsCount} /{" "}
                {overview.summary.totalActiveMembers}
              </p>
            </div>
          </div>

          {overview.leaderboard.length === 0 ? (
            <EmptyState
              title="Belum ada data performa pada filter ini"
              className="py-10"
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border/60">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Anggota</TableHead>
                    <TableHead>Peran &amp; Divisi</TableHead>
                    <TableHead>Tasks</TableHead>
                    <TableHead>TCR</TableHead>
                    <TableHead>OTDR</TableHead>
                    <TableHead>DQS / CPVS</TableHead>
                    <TableHead>Skor &amp; Grade</TableHead>
                    <TableHead>Evaluasi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overview.leaderboard.map((row) => (
                    <TableRow key={row.userId}>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar size="sm" className="print:hidden">
                            {row.avatarUrl ? (
                              <AvatarImage
                                src={row.avatarUrl}
                                alt={row.fullName}
                              />
                            ) : null}
                            <AvatarFallback className="text-[10px] font-semibold">
                              {getInitials(row.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-foreground">
                              {row.fullName}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {row.jobTitle}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <p className="font-medium">
                          {ROLE_DISPLAY_META[row.roleCode]?.label ?? row.roleCode}
                        </p>
                        <p className="text-muted-foreground">{row.department}</p>
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {row.tasksCompleted}/{row.tasksAssigned}
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {formatKpiPercent(row.tcr)}
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {formatKpiPercent(row.otdr)}
                      </TableCell>
                      <TableCell className="font-mono text-xs tabular-nums">
                        {row.dqs !== null
                          ? `DQS ${formatKpiScore(row.dqs)}`
                          : row.cpvs !== null
                            ? `CPVS ${formatKpiPercent(row.cpvs)}`
                            : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="font-bold tabular-nums">
                            {row.weightedKpiScore.toFixed(2)}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "px-1.5 text-[10px] font-bold",
                              GRADE_PILL_STYLE[row.grade]
                            )}
                          >
                            {row.grade}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {row.evaluationStatus ? (
                          <div className="inline-flex items-center gap-1">
                            <StatusBadge
                              domain="evaluation"
                              value={row.evaluationStatus}
                            />
                            {row.isFinalizedSnapshot ? (
                              <Lock className="size-3 text-emerald-600" />
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            Live
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
