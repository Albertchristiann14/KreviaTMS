"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowUpRight,
  Award,
  BarChart2,
  CheckCircle2,
  Clock,
  FileCheck2,
  Lock,
  Palette,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useKpiDashboard,
  type KpiDashboardFilters,
} from "@/features/team-kpi/hooks/useKpiDashboard";
import type { KpiDashboardFilterOptions } from "@/features/team-kpi/queries/kpi.queries";
import type {
  KpiGrade,
  TeamLeaderboardRowDTO,
  TeamPerformanceOverviewDTO,
} from "@/features/team-kpi/types";
import {
  buildPeriodSelectOptions,
  formatKpiPercent,
  formatKpiScore,
  getInitials,
  ROLE_DISPLAY_META,
} from "@/features/team-kpi/utils/kpi-ui";
import { cn } from "@/lib/utils";

export interface TeamPerformanceChartsProps {
  initialData: TeamPerformanceOverviewDTO;
  filterOptions: KpiDashboardFilterOptions;
}

const columnHelper = createDataTableColumnHelper<TeamLeaderboardRowDTO>();

const emptySubscribe = () => () => {};

const GRADE_PILL_STYLE: Record<KpiGrade, string> = {
  A: "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300",
  B: "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-300",
  C: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300",
  D: "border-rose-300 bg-rose-50 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-300",
};

const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: "var(--popover)",
  borderColor: "var(--border)",
  borderRadius: "0.75rem",
  fontSize: "12px",
  fontWeight: 600,
  color: "var(--popover-foreground)",
  boxShadow: "0 12px 28px -6px rgba(15, 23, 42, 0.16)",
} as const;

export function TeamPerformanceCharts({
  initialData,
  filterOptions,
}: TeamPerformanceChartsProps) {
  const router = useRouter();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const initialFilters: KpiDashboardFilters = {
    year: initialData.period.year,
    month: initialData.period.month,
    department: initialData.filters.department ?? "ALL",
    projectId: initialData.filters.projectId ?? "ALL",
  };

  const [filters, setFilters] = useState<KpiDashboardFilters>(initialFilters);

  const { data, isFetching, isError, error, refetch } = useKpiDashboard(
    filters,
    initialData,
    initialFilters
  );

  const activeData = data ?? initialData;
  const periodValue = `${filters.year}-${String(filters.month).padStart(2, "0")}`;

  const periodOptions = useMemo(
    () =>
      buildPeriodSelectOptions(
        initialData.period.year,
        initialData.period.month,
        12,
        1
      ),
    [initialData.period.year, initialData.period.month]
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leaderboardColumns = useMemo<DataTableColumnDef<TeamLeaderboardRowDTO, any>[]>(
    () => [
      columnHelper.accessor("fullName", {
        header: "Anggota",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex items-center gap-3 py-0.5">
              <Avatar
                size="sm"
                className="ring-2 ring-slate-200 dark:ring-slate-700"
              >
                {row.avatarUrl ? (
                  <AvatarImage src={row.avatarUrl} alt={row.fullName} />
                ) : null}
                <AvatarFallback className="bg-slate-100 text-[11px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                  {getInitials(row.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-900 dark:text-white">
                  {row.fullName}
                </p>
                <p className="truncate text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  {row.department} ·{" "}
                  {ROLE_DISPLAY_META[row.roleCode]?.label ?? row.roleCode}
                </p>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("tcr", {
        header: "TCR",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="font-mono text-xs tabular-nums">
              <p className="font-extrabold text-slate-900 dark:text-white">
                {formatKpiPercent(row.tcr)}
              </p>
              <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                {row.tasksCompleted}/{row.tasksAssigned} task
              </p>
            </div>
          );
        },
      }),
      columnHelper.accessor("otdr", {
        header: "OTDR",
        cell: (info) => (
          <span className="font-mono text-xs font-extrabold tabular-nums text-slate-900 dark:text-white">
            {formatKpiPercent(info.row.original.otdr)}
          </span>
        ),
      }),
      columnHelper.display({
        id: "qualityOrOutput",
        header: "DQS / CPVS",
        cell: (info) => {
          const row = info.row.original;
          if (row.roleCode === "DESIGNER" || row.dqs !== null) {
            return (
              <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold tabular-nums text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                DQS {formatKpiScore(row.dqs)}
              </span>
            );
          }
          if (row.roleCode === "STAFF_CREATOR" || row.cpvs !== null) {
            return (
              <div className="font-mono text-xs tabular-nums">
                <p className="font-bold text-slate-900 dark:text-white">
                  CPVS {formatKpiPercent(row.cpvs)}
                </p>
                <p className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  {row.contentDeliveredCount} konten
                </p>
              </div>
            );
          }
          return (
            <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
              —
            </span>
          );
        },
      }),
      columnHelper.accessor("activeTasksCount", {
        header: "Beban Aktif",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex items-center gap-1.5">
              <Badge
                variant="secondary"
                className="border border-slate-200 bg-slate-100 font-mono text-[11px] font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {row.activeTasksCount}
              </Badge>
              {row.overdueTasksCount > 0 ? (
                <Badge
                  variant="outline"
                  className="border-rose-300 bg-rose-50 font-mono text-[11px] font-bold text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-300"
                >
                  {row.overdueTasksCount} late
                </Badge>
              ) : null}
            </div>
          );
        },
      }),
      columnHelper.accessor("weightedKpiScore", {
        header: "Skor KPI",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex items-center gap-2 font-mono">
              <span className="text-sm font-extrabold tabular-nums text-slate-900 dark:text-white">
                {row.weightedKpiScore.toFixed(2)}
              </span>
              <Badge
                variant="outline"
                className={cn(
                  "px-2.5 text-[11px] font-extrabold",
                  GRADE_PILL_STYLE[row.grade]
                )}
              >
                Grade {row.grade}
              </Badge>
            </div>
          );
        },
      }),
      columnHelper.accessor("evaluationStatus", {
        header: "Evaluasi",
        cell: (info) => {
          const row = info.row.original;
          if (!row.evaluationStatus) {
            return (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                —
              </span>
            );
          }
          return (
            <div className="flex items-center gap-1.5">
              <StatusBadge domain="evaluation" value={row.evaluationStatus} />
              {row.isFinalizedSnapshot ? (
                <Lock className="size-3.5 text-emerald-600" aria-hidden="true" />
              ) : null}
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "links",
        header: "",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex items-center justify-end gap-1.5">
              <Link
                href={`/team/${row.userId}?period=${periodValue}`}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  buttonVariants({ variant: "outline", size: "xs" }),
                  "gap-1 rounded-lg border-slate-200 bg-white font-bold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                )}
              >
                <span>Profil</span>
                <ArrowUpRight className="size-3" />
              </Link>
              {row.evaluationId ? (
                <Link
                  href={`/kpi/evaluations/${row.evaluationId}`}
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    buttonVariants({ variant: "default", size: "xs" }),
                    "rounded-lg bg-blue-600 font-bold text-white hover:bg-blue-700"
                  )}
                >
                  Rapor
                </Link>
              ) : null}
            </div>
          );
        },
      }),
    ],
    [periodValue]
  );

  return (
    <div className="space-y-6">
      {/* Compact Filter Strip */}
      <div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs lg:flex-row lg:items-center dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2.5">
          <Select
            value={periodValue}
            items={periodSelectItems}
            onValueChange={(val) => {
              if (!val) return;
              const [y, m] = val.split("-");
              setFilters((prev) => ({
                ...prev,
                year: Number(y),
                month: Number(m),
              }));
            }}
          >
            <SelectTrigger
              className="w-48 min-w-0 overflow-hidden rounded-xl border-slate-200 bg-slate-50 font-semibold text-slate-800 *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              aria-label="Filter periode"
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
            value={filters.department}
            items={deptSelectItems}
            onValueChange={(val) => {
              if (val) setFilters((prev) => ({ ...prev, department: val }));
            }}
          >
            <SelectTrigger
              className="w-44 min-w-0 overflow-hidden rounded-xl border-slate-200 bg-slate-50 font-semibold text-slate-800 *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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
            value={filters.projectId}
            items={projectSelectItems}
            onValueChange={(val) => {
              if (val) setFilters((prev) => ({ ...prev, projectId: val }));
            }}
          >
            <SelectTrigger
              className="w-56 min-w-0 overflow-hidden rounded-xl border-slate-200 bg-slate-50 font-semibold text-slate-800 *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
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

        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isFetching}
          onClick={() => void refetch()}
          className="w-fit gap-1.5 rounded-xl border-slate-200 bg-white font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} />
          <span>Refresh</span>
        </Button>
      </div>

      {isError ? (
        <div className="rounded-xl border border-rose-300 bg-rose-50 p-3.5 text-xs font-bold text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-200">
          {(error as Error)?.message ?? "Gagal memuat data performa."}
        </div>
      ) : null}

      {/* 5 Executive Stat Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="rounded-xl border-slate-200 bg-white shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="flex items-start justify-between gap-2 p-4">
            <div className="space-y-1">
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Rata-rata TCR
              </p>
              <p className="font-mono text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {formatKpiPercent(activeData.summary.avgTcr)}
              </p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {activeData.summary.totalTasksCompleted}/
                {activeData.summary.totalTasksAssigned} selesai
              </p>
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-400">
              <CheckCircle2 className="size-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200 bg-white shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="flex items-start justify-between gap-2 p-4">
            <div className="space-y-1">
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Rata-rata OTDR
              </p>
              <p className="font-mono text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {formatKpiPercent(activeData.summary.avgOtdr)}
              </p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Tepat tenggat
              </p>
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-600 dark:border-cyan-500/30 dark:bg-cyan-500/15 dark:text-cyan-400">
              <Clock className="size-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200 bg-white shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="flex items-start justify-between gap-2 p-4">
            <div className="space-y-1">
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Task Overdue
              </p>
              <p
                className={cn(
                  "font-mono text-2xl font-extrabold tabular-nums",
                  activeData.summary.totalTasksOverdue > 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                )}
              >
                {activeData.summary.totalTasksOverdue}
              </p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {activeData.summary.totalActiveMembers} anggota aktif
              </p>
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-400">
              <AlertTriangle className="size-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200 bg-white shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="flex items-start justify-between gap-2 p-4">
            <div className="space-y-1">
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Rata-rata DQS
              </p>
              <p className="font-mono text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {formatKpiScore(activeData.summary.avgDqs)}
              </p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Kualitas desain
              </p>
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-600 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-400">
              <Palette className="size-4.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200 bg-white shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="flex items-start justify-between gap-2 p-4">
            <div className="space-y-1">
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Konten Terjadwal
              </p>
              <p className="font-mono text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {activeData.summary.totalContentPublished}
              </p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {activeData.summary.finalizedEvaluationsCount} rapor final
              </p>
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-400">
              <FileCheck2 className="size-4.5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="rounded-2xl border-slate-200 bg-white shadow-xs lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="border-b border-slate-200/80 pb-3 dark:border-slate-800">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <span className="h-4 w-1 rounded-full bg-blue-600" />
              <BarChart2 className="size-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
              <span>Beban Kerja Aktif</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {activeData.workloadDistribution.length === 0 ? (
              <EmptyState
                title="Belum ada data beban kerja"
                className="py-10"
              />
            ) : (
              <div className="h-72 w-full">
                {mounted ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart
                      data={activeData.workloadDistribution}
                      margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        stroke="var(--border)"
                        strokeOpacity={0.9}
                      />
                      <XAxis
                        dataKey="shortName"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 11,
                          fontWeight: 600,
                          fill: "var(--muted-foreground)",
                        }}
                      />
                      <YAxis
                        allowDecimals={false}
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fontSize: 11,
                          fontWeight: 600,
                          fill: "var(--muted-foreground)",
                        }}
                      />
                      <Tooltip contentStyle={TOOLTIP_CONTENT_STYLE} />
                      <Legend wrapperStyle={{ fontSize: "12px", fontWeight: 600 }} />
                      <Bar
                        dataKey="todo"
                        name="To Do"
                        stackId="workload"
                        fill="#64748b"
                      />
                      <Bar
                        dataKey="inProgress"
                        name="In Progress"
                        stackId="workload"
                        fill="#2563eb"
                      />
                      <Bar
                        dataKey="inReview"
                        name="In Review"
                        stackId="workload"
                        fill="#f59e0b"
                      />
                      <Bar
                        dataKey="revision"
                        name="Revision"
                        stackId="workload"
                        fill="#e11d48"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-full items-center justify-center text-xs font-medium text-slate-500">
                    Memuat grafik...
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 bg-white shadow-xs lg:col-span-6 dark:border-slate-800 dark:bg-slate-900">
          <CardHeader className="border-b border-slate-200/80 pb-3 dark:border-slate-800">
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
              <span className="h-4 w-1 rounded-full bg-emerald-600" />
              <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
              <span>Tren 6 Bulan</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-72 w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <LineChart
                    data={activeData.sixMonthTrend}
                    margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      strokeOpacity={0.9}
                    />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 11,
                        fontWeight: 600,
                        fill: "var(--muted-foreground)",
                      }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{
                        fontSize: 11,
                        fontWeight: 600,
                        fill: "var(--muted-foreground)",
                      }}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_CONTENT_STYLE}
                      formatter={(value, name) => {
                        const formatted =
                          typeof value === "number"
                            ? value.toFixed(2)
                            : value === null || value === undefined
                              ? "N/A"
                              : String(value);
                        return [formatted, String(name ?? "")];
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: "12px", fontWeight: 600 }} />
                    <Line
                      type="monotone"
                      dataKey="tcr"
                      name="Avg TCR"
                      stroke="#2563eb"
                      strokeWidth={2.5}
                      dot={{ r: 3.5 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="otdr"
                      name="Avg OTDR"
                      stroke="#0891b2"
                      strokeWidth={2.5}
                      dot={{ r: 3.5 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="weightedKpiScore"
                      name="KPI Score"
                      stroke="#059669"
                      strokeWidth={3}
                      dot={{ r: 4.5 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs font-medium text-slate-500">
                  Memuat grafik...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Leaderboard */}
      <Card className="rounded-2xl border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="border-b border-slate-200/80 pb-3 dark:border-slate-800">
          <CardTitle className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <span className="h-4 w-1 rounded-full bg-blue-600" />
            <Award className="size-4 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            <span>Leaderboard · {activeData.period.periodMonth}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <DataTable
            columns={leaderboardColumns}
            data={activeData.leaderboard}
            searchPlaceholder="Cari anggota..."
            pagination={{ pageSize: 12 }}
            className="[&>div:nth-child(2)]:border-slate-200 [&>div:nth-child(2)]:bg-white [&>div:nth-child(2)]:shadow-none dark:[&>div:nth-child(2)]:border-slate-800 dark:[&>div:nth-child(2)]:bg-slate-900 [&_[data-slot=table-header]]:border-b [&_[data-slot=table-header]]:border-slate-200 [&_[data-slot=table-header]]:bg-slate-50 dark:[&_[data-slot=table-header]]:border-slate-800 dark:[&_[data-slot=table-header]]:bg-slate-800/70 [&_[data-slot=table-head]]:text-xs [&_[data-slot=table-head]]:font-bold [&_[data-slot=table-head]]:text-slate-700 [&_[data-slot=table-head]]:uppercase dark:[&_[data-slot=table-head]]:text-slate-200 [&_[data-slot=table-row]]:border-slate-200 dark:[&_[data-slot=table-row]]:border-slate-800 [&_[data-slot=table-row]:hover]:bg-slate-50/90 dark:[&_[data-slot=table-row]:hover]:bg-slate-800/50"
            onRowClick={(row) =>
              router.push(`/team/${row.userId}?period=${periodValue}`)
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
