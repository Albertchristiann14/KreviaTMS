"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Award,
  CalendarClock,
  CheckCircle2,
  Clock,
  FileCheck2,
  FolderKanban,
  Lock,
  Mail,
  Palette,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/shared/EmptyState";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { IndividualPerformanceData } from "@/features/team-kpi/queries/team.queries";
import type { KpiGrade } from "@/features/team-kpi/types";
import {
  buildPeriodSelectOptions,
  formatKpiPercent,
  formatKpiScore,
  formatWibDate,
  formatWibDateTime,
  getInitials,
  KPI_GRADE_META,
  KPI_UNIT_LABELS,
  METRIC_SOURCE_META,
  ROLE_DISPLAY_META,
} from "@/features/team-kpi/utils/kpi-ui";
import { cn } from "@/lib/utils";

export interface IndividualMetricsHeaderProps {
  data: IndividualPerformanceData;
  isSelf: boolean;
}

const emptySubscribe = () => () => {};

const GRADE_HERO_STYLE: Record<
  KpiGrade,
  { pill: string; bar: string; glow: string }
> = {
  A: {
    pill: "border-emerald-500/30 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
    bar: "bg-gradient-to-r from-emerald-500 to-teal-400",
    glow: "shadow-[0_0_24px_-6px_rgba(16,185,129,0.4)]",
  },
  B: {
    pill: "border-blue-500/30 bg-blue-500/12 text-blue-700 dark:text-blue-300",
    bar: "bg-gradient-to-r from-blue-600 to-cyan-400",
    glow: "shadow-[0_0_24px_-6px_rgba(59,130,246,0.4)]",
  },
  C: {
    pill: "border-amber-500/30 bg-amber-500/12 text-amber-700 dark:text-amber-300",
    bar: "bg-gradient-to-r from-amber-500 to-orange-400",
    glow: "shadow-[0_0_24px_-6px_rgba(245,158,11,0.35)]",
  },
  D: {
    pill: "border-rose-500/30 bg-rose-500/12 text-rose-700 dark:text-rose-300",
    bar: "bg-gradient-to-r from-rose-500 to-pink-500",
    glow: "shadow-[0_0_24px_-6px_rgba(244,63,94,0.35)]",
  },
};

const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: "var(--popover)",
  borderColor: "var(--border)",
  borderRadius: "0.75rem",
  fontSize: "12px",
  color: "var(--popover-foreground)",
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.12)",
} as const;

export function IndividualMetricsHeader({
  data,
  isSelf,
}: IndividualMetricsHeaderProps) {
  const router = useRouter();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const periodOptions = useMemo(
    () => buildPeriodSelectOptions(data.period.year, data.period.month, 12, 1),
    [data.period.year, data.period.month]
  );

  const periodSelectItems = useMemo<Record<string, string>>(
    () => Object.fromEntries(periodOptions.map((opt) => [opt.value, opt.label])),
    [periodOptions]
  );

  const roleMeta = ROLE_DISPLAY_META[data.profile.roleCode];
  const gradeMeta = KPI_GRADE_META[data.weightedPreview.grade];
  const heroStyle = GRADE_HERO_STYLE[data.weightedPreview.grade];
  const { metrics } = data;

  const isDesignerRole = data.profile.roleCode === "DESIGNER";
  const isCreatorRole = data.profile.roleCode === "STAFF_CREATOR";

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/team"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-1.5 px-2 text-muted-foreground hover:text-foreground"
          )}
        >
          <ArrowLeft className="size-3.5" />
          <span>Direktori Tim</span>
        </Link>

        <Select
          value={data.period.periodMonth}
          items={periodSelectItems}
          onValueChange={(val) => {
            if (val) {
              router.push(`/team/${data.profile.id}?period=${val}`);
            }
          }}
        >
          <SelectTrigger
            className="w-48 min-w-0 overflow-hidden bg-card *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate"
            aria-label="Pilih periode KPI"
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
      </div>

      {/* Hero Profile + Grade Card */}
      <Card className="overflow-hidden border-border/70">
        <CardContent className="flex flex-col justify-between gap-6 p-5 sm:p-6 lg:flex-row lg:items-center">
          <div className="flex min-w-0 items-start gap-4">
            <Avatar size="lg" className="size-14 shrink-0 ring-2 ring-border/60">
              {data.profile.avatarUrl ? (
                <AvatarImage
                  src={data.profile.avatarUrl}
                  alt={data.profile.fullName}
                />
              ) : null}
              <AvatarFallback className="text-base font-semibold">
                {getInitials(data.profile.fullName)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="break-words text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
                  {data.profile.fullName}
                </h1>
                {isSelf ? (
                  <Badge variant="secondary" className="text-[11px]">
                    Saya
                  </Badge>
                ) : null}
                <Badge
                  variant="outline"
                  className={cn("font-mono text-[11px]", roleMeta?.badgeClass)}
                >
                  {roleMeta?.label ?? data.profile.roleCode}
                </Badge>
                {data.isFinalizedSnapshot ? (
                  <Badge
                    variant="outline"
                    className="gap-1 border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  >
                    <Lock className="size-3" aria-hidden="true" />
                    <span>Finalized</span>
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="gap-1 border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300"
                  >
                    <Sparkles className="size-3" aria-hidden="true" />
                    <span>Live</span>
                  </Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                <span className="font-medium text-foreground/90">
                  {data.profile.jobTitle} · {data.profile.department}
                </span>
                <span className="inline-flex min-w-0 items-center gap-1">
                  <Mail className="size-3 shrink-0" aria-hidden="true" />
                  <span className="truncate">{data.profile.email}</span>
                </span>
                {data.profile.managerName ? (
                  <span>Manager: {data.profile.managerName}</span>
                ) : null}
              </div>

              {data.projects.length > 0 ? (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <FolderKanban
                    className="size-3.5 text-muted-foreground"
                    aria-hidden="true"
                  />
                  {data.projects.map((p) => (
                    <Badge
                      key={p.id}
                      variant="outline"
                      className="gap-1.5 font-mono text-[10px]"
                    >
                      <span
                        className="size-2 rounded-full"
                        style={{ backgroundColor: p.colorHex }}
                      />
                      <span>{p.code}</span>
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          {/* Glowing Grade Hero Box */}
          <div
            className={cn(
              "flex flex-col gap-2.5 rounded-2xl border border-border/70 bg-muted/30 p-4 sm:min-w-[260px]",
              heroStyle.glow
            )}
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase">
                  KPI Score
                </p>
                <p className="font-mono text-3xl font-bold tracking-tight tabular-nums text-foreground">
                  {formatKpiScore(data.weightedPreview.weightedKpiScore)}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Badge
                  variant="outline"
                  className={cn(
                    "px-3 py-1 text-xs font-bold",
                    heroStyle.pill
                  )}
                >
                  {gradeMeta.label}
                </Badge>
                <span className="font-mono text-[10px] text-muted-foreground">
                  Bobot {data.weightedPreview.activeWeightPercent}%
                </span>
              </div>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-background/80 ring-1 ring-border/40">
              <div
                className={cn("h-full rounded-full transition-all", heroStyle.bar)}
                style={{
                  width: `${Math.min(100, Math.max(0, data.weightedPreview.weightedKpiScore))}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Primary KPI Metric Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card size="sm">
          <CardContent className="flex items-start justify-between gap-2 pt-3">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground">
                TCR · Penyelesaian
              </p>
              <p className="font-mono text-2xl font-bold tabular-nums">
                {formatKpiPercent(metrics.completionRate)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {metrics.totalTasksAssigned === 0
                  ? "Belum ada tugas"
                  : `${metrics.totalTasksCompleted}/${metrics.totalTasksAssigned} tugas selesai`}
              </p>
            </div>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="size-4" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardContent className="flex items-start justify-between gap-2 pt-3">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground">
                OTDR · Ketepatan
              </p>
              <p className="font-mono text-2xl font-bold tabular-nums">
                {formatKpiPercent(metrics.onTimeRate)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {metrics.completedWithDue === 0
                  ? "Belum ada task selesai"
                  : `${metrics.tasksCompletedOnTime}/${metrics.completedWithDue} tepat waktu`}
              </p>
            </div>
            <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Clock className="size-4" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        {isDesignerRole || metrics.designBriefsApproved > 0 ? (
          <Card size="sm">
            <CardContent className="flex items-start justify-between gap-2 pt-3">
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-muted-foreground">
                  DQS · Kualitas Desain
                </p>
                <p className="font-mono text-2xl font-bold tabular-nums">
                  {formatKpiScore(metrics.designQualityScore)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {metrics.designBriefsApproved === 0
                    ? "Belum ada brief"
                    : `${metrics.designBriefsApproved} brief · FPAR ${formatKpiPercent(metrics.firstPassApprovalRate)}`}
                </p>
              </div>
              <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
                <Palette className="size-4" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card size="sm">
            <CardContent className="flex items-start justify-between gap-2 pt-3">
              <div className="space-y-1">
                <p className="text-[11px] font-medium text-muted-foreground">
                  CPVS · Output Konten
                </p>
                <p className="font-mono text-2xl font-bold tabular-nums">
                  {isCreatorRole || metrics.cpvsScore !== null
                    ? formatKpiPercent(metrics.cpvsScore)
                    : `${metrics.contentDeliveredCount} Konten`}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {metrics.cpvsTargetValue && metrics.cpvsTargetValue > 0
                    ? `${metrics.contentDeliveredCount}/${metrics.cpvsTargetValue} target konten`
                    : `${metrics.contentDeliveredCount} konten tayang/jadwal`}
                </p>
              </div>
              <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <FileCheck2 className="size-4" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        )}

        <Card size="sm">
          <CardContent className="flex items-start justify-between gap-2 pt-3">
            <div className="space-y-1">
              <p className="text-[11px] font-medium text-muted-foreground">
                Weighted Score
              </p>
              <p className="font-mono text-2xl font-bold tabular-nums">
                {formatKpiScore(data.weightedPreview.weightedKpiScore)}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Bobot aktif {data.weightedPreview.activeWeightPercent}%
              </p>
            </div>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Award className="size-4" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 6-Month Trend + Assigned KPI Targets */}
      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold">
              <TrendingUp className="size-4 text-primary" aria-hidden="true" />
              <span>Tren 6 Bulan</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <LineChart
                    data={data.sixMonthTrend}
                    margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                  >
                    <CartesianGrid
                      vertical={false}
                      strokeDasharray="3 3"
                      stroke="var(--border)"
                      strokeOpacity={0.7}
                    />
                    <XAxis
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
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
                    <Legend wrapperStyle={{ fontSize: "11px" }} />
                    <Line
                      type="monotone"
                      dataKey="tcr"
                      name="TCR (%)"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="otdr"
                      name="OTDR (%)"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      connectNulls
                    />
                    <Line
                      type="monotone"
                      dataKey="weightedKpiScore"
                      name="KPI Score"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      connectNulls
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  Memuat grafik...
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">
              Indikator KPI ({data.period.periodMonth})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {data.kpiTargets.length === 0 ? (
              <EmptyState title="Belum ada target KPI" className="py-8" />
            ) : (
              data.kpiTargets.map((item) => {
                const srcMeta =
                  METRIC_SOURCE_META[
                    item.metricSource as keyof typeof METRIC_SOURCE_META
                  ];
                const unitLabel =
                  KPI_UNIT_LABELS[
                    item.unit as keyof typeof KPI_UNIT_LABELS
                  ] ?? item.unit;
                const pct = Math.min(
                  100,
                  Math.max(0, item.achievementPct ?? 0)
                );

                return (
                  <div
                    key={item.id}
                    className="space-y-2 rounded-xl border border-border/60 bg-background/40 p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {item.templateName}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-mono text-[10px]",
                              srcMeta?.badgeClass
                            )}
                          >
                            {srcMeta?.shortLabel ?? item.metricSource}
                          </Badge>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {item.weight}% · Target {item.targetValue}{" "}
                            {unitLabel}
                          </span>
                        </div>
                      </div>
                      <span className="shrink-0 font-mono text-sm font-bold tabular-nums text-foreground">
                        {item.achievementPct !== null
                          ? `${item.achievementPct.toFixed(1)}%`
                          : "N/A"}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          item.achievementPct === null
                            ? "bg-muted-foreground/30"
                            : item.achievementPct >= 90
                              ? "bg-emerald-500"
                              : item.achievementPct >= 75
                                ? "bg-blue-500"
                                : "bg-amber-500"
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>

      {/* Drill-down Tabs */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Bukti Operasional &amp; Riwayat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tasks">
            <TabsList className="mb-4 flex-wrap">
              <TabsTrigger value="tasks">
                Tasks ({metrics.tasksBreakdown.length})
              </TabsTrigger>
              <TabsTrigger value="designs">
                Design Briefs ({metrics.designBriefsBreakdown.length})
              </TabsTrigger>
              <TabsTrigger value="content">
                Content ({metrics.contentBreakdown.length})
              </TabsTrigger>
              <TabsTrigger value="evaluations">
                Riwayat Evaluasi ({data.evaluationsHistory.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks">
              {metrics.tasksBreakdown.length === 0 ? (
                <EmptyState
                  icon={CalendarClock}
                  title="Belum ada task pada periode ini"
                  className="py-8"
                />
              ) : (
                <div className="overflow-hidden rounded-xl border border-border/60">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Kode</TableHead>
                        <TableHead>Judul</TableHead>
                        <TableHead>Proyek</TableHead>
                        <TableHead>Prioritas</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Selesai</TableHead>
                        <TableHead>Ketepatan</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics.tasksBreakdown.map((t) => (
                        <TableRow key={t.taskId}>
                          <TableCell className="font-mono text-xs font-semibold">
                            {t.taskCode}
                          </TableCell>
                          <TableCell className="max-w-xs truncate font-medium">
                            {t.title}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="font-mono text-[10px]"
                            >
                              {t.projectCode || "Tanpa Proyek"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <PriorityBadge priority={t.priority} />
                          </TableCell>
                          <TableCell>
                            <StatusBadge domain="task" value={t.status} />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatWibDateTime(t.dueDate)}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatWibDateTime(t.effectiveCompletionTime)}
                            {t.revisionCount > 0 ? (
                              <span className="ml-1 text-[10px] text-rose-600">
                                (Rev {t.revisionCount}x)
                              </span>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            {t.isOnTime === true ? (
                              <Badge
                                variant="outline"
                                className="border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                              >
                                Tepat Waktu
                              </Badge>
                            ) : t.isOnTime === false ? (
                              <Badge
                                variant="outline"
                                className="border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                              >
                                Terlambat
                              </Badge>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                —
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="designs">
              {metrics.designBriefsBreakdown.length === 0 ? (
                <EmptyState
                  icon={Palette}
                  title="Belum ada Design Brief disetujui"
                  className="py-8"
                />
              ) : (
                <div className="overflow-hidden rounded-xl border border-border/60">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Judul Brief</TableHead>
                        <TableHead>Proyek</TableHead>
                        <TableHead>Disetujui</TableHead>
                        <TableHead>Revisi</TableHead>
                        <TableHead>DQS</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics.designBriefsBreakdown.map((b) => (
                        <TableRow key={b.designBriefId}>
                          <TableCell className="font-medium">
                            {b.title}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="font-mono text-[10px]"
                            >
                              {b.projectCode}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatWibDateTime(b.approvedAt)}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {b.revisionCount}x
                          </TableCell>
                          <TableCell className="font-mono font-semibold">
                            {b.briefDqs}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="content">
              {metrics.contentBreakdown.length === 0 ? (
                <EmptyState
                  icon={FileCheck2}
                  title="Belum ada konten terjadwal/tayang"
                  className="py-8"
                />
              ) : (
                <div className="overflow-hidden rounded-xl border border-border/60">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Judul Konten</TableHead>
                        <TableHead>Platform</TableHead>
                        <TableHead>Format</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Tanggal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {metrics.contentBreakdown.map((c) => (
                        <TableRow key={c.contentItemId}>
                          <TableCell className="font-medium">
                            {c.title}
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {c.platform}
                          </TableCell>
                          <TableCell className="text-xs">
                            {c.contentFormat}
                          </TableCell>
                          <TableCell>
                            <StatusBadge domain="content" value={c.status} />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatWibDateTime(c.effectiveDate)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="evaluations">
              {data.evaluationsHistory.length === 0 ? (
                <EmptyState
                  icon={Award}
                  title="Belum ada riwayat evaluasi"
                  className="py-8"
                />
              ) : (
                <div className="overflow-hidden rounded-xl border border-border/60">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="hover:bg-transparent">
                        <TableHead>Periode</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Evaluator</TableHead>
                        <TableHead>TCR</TableHead>
                        <TableHead>OTDR</TableHead>
                        <TableHead>Skor &amp; Grade</TableHead>
                        <TableHead>Finalized</TableHead>
                        <TableHead className="text-right" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.evaluationsHistory.map((ev) => (
                        <TableRow key={ev.id}>
                          <TableCell className="font-mono text-xs font-semibold">
                            {ev.periodMonthLabel}
                          </TableCell>
                          <TableCell>
                            <StatusBadge domain="evaluation" value={ev.status} />
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {ev.evaluatorName}
                          </TableCell>
                          <TableCell className="font-mono text-xs tabular-nums">
                            {formatKpiPercent(ev.completionRate)}
                          </TableCell>
                          <TableCell className="font-mono text-xs tabular-nums">
                            {formatKpiPercent(ev.onTimeRate)}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 font-mono">
                              <span className="font-semibold tabular-nums">
                                {formatKpiScore(ev.weightedKpiScore)}
                              </span>
                              {ev.performanceGrade ? (
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "px-1.5 text-[10px] font-bold",
                                    GRADE_HERO_STYLE[ev.performanceGrade].pill
                                  )}
                                >
                                  {ev.performanceGrade}
                                </Badge>
                              ) : null}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {formatWibDate(ev.finalizedAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <Link
                              href={`/kpi/evaluations/${ev.id}`}
                              className={cn(
                                buttonVariants({ variant: "ghost", size: "xs" }),
                                "gap-1 text-muted-foreground hover:text-foreground"
                              )}
                            >
                              <span>Buka</span>
                              <ArrowUpRight
                                className="size-3.5"
                                aria-hidden="true"
                              />
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
