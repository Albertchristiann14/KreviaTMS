import type { KpiMetricSource, Prisma } from "@prisma/client";
import type { RoleCode } from "@/lib/constants/permissions";
import { prisma } from "@/server/db/prisma";
import {
  clampScore,
  computeWeightedScoreAndGrade,
  gradeFromScore,
  isValidUuid,
  resolveKpiGrade,
  round2,
  sanitizeOptionalUuid,
} from "@/features/team-kpi/utils/kpi-ui";
import type {
  AutoMetricsSnapshot,
  ContentDeliveryBreakdownItem,
  DesignBriefBreakdownItem,
  MonthlyTrendPoint,
  PeriodWindow,
  TaskBreakdownItem,
  TeamPerformanceOverviewDTO,
  UserMonthlyMetricsResult,
} from "@/features/team-kpi/types";

export {
  clampScore,
  computeWeightedScoreAndGrade,
  gradeFromScore,
  isValidUuid,
  resolveKpiGrade,
  round2,
  sanitizeOptionalUuid,
};

const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

const SHORT_MONTH_NAMES_ID = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
] as const;

type DbClient = Prisma.TransactionClient | typeof prisma;

export function decimalToNumber(
  value: Prisma.Decimal | number | string | null | undefined
): number | null {
  if (value === null || value === undefined) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function formatPeriodMonthLabel(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

export function formatShortMonthLabel(year: number, month: number): string {
  const label = SHORT_MONTH_NAMES_ID[month - 1] ?? String(month);
  return `${label} ${year}`;
}

export function getJakartaCurrentYearMonth(now: Date = new Date()): {
  year: number;
  month: number;
  periodMonth: string;
} {
  const jakartaDate = new Date(now.getTime() + JAKARTA_OFFSET_MS);
  const year = jakartaDate.getUTCFullYear();
  const month = jakartaDate.getUTCMonth() + 1;
  return {
    year,
    month,
    periodMonth: formatPeriodMonthLabel(year, month),
  };
}

export function parsePeriodMonthString(
  raw: string | null | undefined,
  fallbackNow: Date = new Date()
): { year: number; month: number; periodMonth: string } {
  if (raw) {
    const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(raw.trim());
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      if (year >= 2024 && year <= 2100 && month >= 1 && month <= 12) {
        return {
          year,
          month,
          periodMonth: formatPeriodMonthLabel(year, month),
        };
      }
    }
  }
  return getJakartaCurrentYearMonth(fallbackNow);
}

export function getJakartaPeriodWindow(
  year: number,
  month: number
): PeriodWindow {
  const start = new Date(Date.UTC(year, month - 1, 1, -7, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, -7, 0, 0, 0));
  return {
    year,
    month,
    periodMonth: formatPeriodMonthLabel(year, month),
    start,
    end,
  };
}

export function getPreviousYearMonth(
  year: number,
  month: number
): { year: number; month: number; periodMonth: string } {
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  return {
    year: prevYear,
    month: prevMonth,
    periodMonth: formatPeriodMonthLabel(prevYear, prevMonth),
  };
}

export function getTrailingSixPeriods(
  anchorYear: number,
  anchorMonth: number
): Array<{ year: number; month: number; periodMonth: string; label: string }> {
  const periods: Array<{
    year: number;
    month: number;
    periodMonth: string;
    label: string;
  }> = [];

  for (let offset = 5; offset >= 0; offset -= 1) {
    const d = new Date(Date.UTC(anchorYear, anchorMonth - 1 - offset, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    periods.push({
      year: y,
      month: m,
      periodMonth: formatPeriodMonthLabel(y, m),
      label: formatShortMonthLabel(y, m),
    });
  }

  return periods;
}

export function computeAutoCpvsScore(
  delivered: number,
  targetValue: number
): number | null {
  if (!Number.isFinite(targetValue) || targetValue <= 0) {
    return null;
  }
  return Math.min(100, round2((delivered / targetValue) * 100));
}

export function resolveItemAchievement(params: {
  metricSource: KpiMetricSource;
  metrics: Pick<
    UserMonthlyMetricsResult,
    | "completionRate"
    | "onTimeRate"
    | "designQualityScore"
    | "contentDeliveredCount"
  >;
  targetValue: number;
  manualActualValue: number | null;
}): {
  actualValue: number | null;
  achievementPct: number | null;
} {
  switch (params.metricSource) {
    case "AUTO_TCR":
      return {
        actualValue: params.metrics.completionRate,
        achievementPct:
          params.metrics.completionRate !== null
            ? clampScore(params.metrics.completionRate)
            : null,
      };
    case "AUTO_OTDR":
      return {
        actualValue: params.metrics.onTimeRate,
        achievementPct:
          params.metrics.onTimeRate !== null
            ? clampScore(params.metrics.onTimeRate)
            : null,
      };
    case "AUTO_DQS":
      return {
        actualValue: params.metrics.designQualityScore,
        achievementPct:
          params.metrics.designQualityScore !== null
            ? clampScore(params.metrics.designQualityScore)
            : null,
      };
    case "AUTO_CPVS": {
      const delivered = params.metrics.contentDeliveredCount;
      return {
        actualValue: delivered,
        achievementPct: computeAutoCpvsScore(delivered, params.targetValue),
      };
    }
    case "MANUAL_SCORE": {
      if (
        params.manualActualValue === null ||
        params.manualActualValue === undefined ||
        !Number.isFinite(params.manualActualValue)
      ) {
        return { actualValue: null, achievementPct: null };
      }
      const clamped = clampScore(params.manualActualValue);
      return {
        actualValue: clamped,
        achievementPct: clamped,
      };
    }
  }
}

export function buildAutoMetricsSnapshot(
  metrics: UserMonthlyMetricsResult,
  generatedAt: Date = new Date()
): AutoMetricsSnapshot {
  const iso = generatedAt.toISOString();
  return {
    calculatedAt: iso,
    snapshotGeneratedAt: iso,
    periodYear: metrics.period.year,
    periodMonth: metrics.period.month,
    totalAssignedTasks: metrics.totalTasksAssigned,
    completedTasks: metrics.totalTasksCompleted,
    datedCompletedTasks: metrics.completedWithDue,
    onTimeCompletedTasks: metrics.tasksCompletedOnTime,
    taskCompletionRate: metrics.completionRate,
    onTimeDeliveryRate: metrics.onTimeRate,
    avgTaskRevisionCount: metrics.avgTaskRevisionCount,
    designBriefsApproved: metrics.designBriefsApproved,
    designQualityScore: metrics.designQualityScore,
    avgDesignRevisionCount: metrics.avgDesignRevisionCount,
    firstPassApprovalRate: metrics.firstPassApprovalRate,
    contentDeliveredCount: metrics.contentDeliveredCount,
    tasksBreakdown: metrics.tasksBreakdown,
    designBriefsBreakdown: metrics.designBriefsBreakdown,
    contentBreakdown: metrics.contentBreakdown,
  };
}

interface RawTaskRow {
  id: string;
  taskCode: string;
  title: string;
  projectId: string;
  taskType: string;
  status: string;
  priority: string;
  assigneeId: string | null;
  dueDate: Date | null;
  firstSubmittedAt: Date | null;
  completedAt: Date | null;
  revisionCount: number;
  project: { name: string; code: string };
}

interface RawDesignBriefRow {
  id: string;
  title: string;
  projectId: string;
  assignedDesignerId: string | null;
  approvedAt: Date | null;
  revisionCount: number;
  project: { code: string };
}

interface RawContentItemRow {
  id: string;
  title: string;
  platform: string;
  contentFormat: string;
  status: string;
  creatorId: string;
  plannedPublishAt: Date | null;
  publishedAt: Date | null;
}

function taskMatchesWindow(
  task: Pick<RawTaskRow, "dueDate" | "completedAt">,
  start: Date,
  end: Date
): boolean {
  if (task.dueDate !== null) {
    return task.dueDate >= start && task.dueDate < end;
  }
  return (
    task.completedAt !== null &&
    task.completedAt >= start &&
    task.completedAt < end
  );
}

function contentEffectiveTimestamp(
  item: Pick<RawContentItemRow, "publishedAt" | "plannedPublishAt">
): Date | null {
  return item.publishedAt ?? item.plannedPublishAt;
}

function aggregateMetricsFromRows(params: {
  userId: string;
  window: PeriodWindow;
  tasks: ReadonlyArray<RawTaskRow>;
  designBriefs: ReadonlyArray<RawDesignBriefRow>;
  contentItems: ReadonlyArray<RawContentItemRow>;
  cpvsTargetValue: number | null;
}): UserMonthlyMetricsResult {
  const { userId, window, tasks, designBriefs, contentItems, cpvsTargetValue } =
    params;

  const totalTasksAssigned = tasks.length;
  let totalTasksCompleted = 0;
  let completedWithDue = 0;
  let tasksCompletedOnTime = 0;
  let doneRevisionSum = 0;

  const tasksBreakdown: TaskBreakdownItem[] = tasks.map((t) => {
    const isDone = t.status === "DONE";
    let effectiveCompletionTime: Date | null = null;
    let isOnTime: boolean | null = null;

    if (isDone) {
      totalTasksCompleted += 1;
      doneRevisionSum += t.revisionCount;
      effectiveCompletionTime =
        t.revisionCount === 0
          ? (t.firstSubmittedAt ?? t.completedAt)
          : t.completedAt;

      if (t.dueDate !== null) {
        completedWithDue += 1;
        isOnTime =
          effectiveCompletionTime !== null &&
          effectiveCompletionTime.getTime() <= t.dueDate.getTime();
        if (isOnTime) {
          tasksCompletedOnTime += 1;
        }
      }
    }

    return {
      taskId: t.id,
      taskCode: t.taskCode,
      title: t.title,
      projectId: t.projectId,
      projectName: t.project.name,
      projectCode: t.project.code,
      taskType: t.taskType,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate ? t.dueDate.toISOString() : null,
      firstSubmittedAt: t.firstSubmittedAt
        ? t.firstSubmittedAt.toISOString()
        : null,
      completedAt: t.completedAt ? t.completedAt.toISOString() : null,
      effectiveCompletionTime: effectiveCompletionTime
        ? effectiveCompletionTime.toISOString()
        : null,
      isOnTime,
      revisionCount: t.revisionCount,
    };
  });

  const completionRate =
    totalTasksAssigned === 0
      ? null
      : round2((totalTasksCompleted / totalTasksAssigned) * 100);

  const onTimeRate =
    completedWithDue === 0
      ? null
      : round2((tasksCompletedOnTime / completedWithDue) * 100);

  const avgTaskRevisionCount =
    totalTasksCompleted === 0
      ? null
      : round2(doneRevisionSum / totalTasksCompleted);

  const designBriefsApproved = designBriefs.length;
  let briefScoreSum = 0;
  let briefRevisionSum = 0;
  let firstPassCount = 0;

  const designBriefsBreakdown: DesignBriefBreakdownItem[] = designBriefs.map(
    (b) => {
      const briefDqs = Math.max(40, 100 - 15 * b.revisionCount);
      briefScoreSum += briefDqs;
      briefRevisionSum += b.revisionCount;
      if (b.revisionCount === 0) {
        firstPassCount += 1;
      }
      return {
        designBriefId: b.id,
        title: b.title,
        projectId: b.projectId,
        projectCode: b.project.code,
        approvedAt: b.approvedAt ? b.approvedAt.toISOString() : null,
        revisionCount: b.revisionCount,
        briefDqs,
      };
    }
  );

  const designQualityScore =
    designBriefsApproved === 0
      ? null
      : round2(briefScoreSum / designBriefsApproved);

  const avgDesignRevisionCount =
    designBriefsApproved === 0
      ? null
      : round2(briefRevisionSum / designBriefsApproved);

  const firstPassApprovalRate =
    designBriefsApproved === 0
      ? null
      : round2((firstPassCount / designBriefsApproved) * 100);

  const contentDeliveredCount = contentItems.length;
  const contentBreakdown: ContentDeliveryBreakdownItem[] = contentItems.map(
    (c) => {
      const effective = contentEffectiveTimestamp(c);
      return {
        contentItemId: c.id,
        title: c.title,
        platform: c.platform,
        contentFormat: c.contentFormat,
        status: c.status,
        plannedPublishAt: c.plannedPublishAt
          ? c.plannedPublishAt.toISOString()
          : null,
        publishedAt: c.publishedAt ? c.publishedAt.toISOString() : null,
        effectiveDate: effective ? effective.toISOString() : null,
      };
    }
  );

  const cpvsScore =
    cpvsTargetValue !== null && cpvsTargetValue > 0
      ? computeAutoCpvsScore(contentDeliveredCount, cpvsTargetValue)
      : null;

  return {
    userId,
    period: {
      year: window.year,
      month: window.month,
      periodMonth: window.periodMonth,
      startIso: window.start.toISOString(),
      endIso: window.end.toISOString(),
    },
    totalTasksAssigned,
    totalTasksCompleted,
    completedWithDue,
    tasksCompletedOnTime,
    completionRate,
    onTimeRate,
    avgTaskRevisionCount,
    designBriefsApproved,
    designQualityScore,
    avgDesignRevisionCount,
    avgRevisionCount: avgDesignRevisionCount ?? avgTaskRevisionCount,
    firstPassApprovalRate,
    contentDeliveredCount,
    cpvsTargetValue,
    cpvsScore,
    tasksBreakdown,
    designBriefsBreakdown,
    contentBreakdown,
  };
}

async function resolveUserCpvsTarget(
  db: DbClient,
  userId: string,
  year: number,
  month: number
): Promise<number | null> {
  const assignment = await db.kpiAssignment.findFirst({
    where: {
      userId,
      periodYear: year,
      periodMonth: month,
      kpiTemplate: {
        metricSource: "AUTO_CPVS",
        deletedAt: null,
      },
    },
    select: { targetValue: true },
  });

  if (assignment) {
    return decimalToNumber(assignment.targetValue);
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { roleId: true },
  });

  if (!user) return null;

  const fallbackTemplate = await db.kpiTemplate.findFirst({
    where: {
      metricSource: "AUTO_CPVS",
      isActive: true,
      deletedAt: null,
      OR: [{ applicableRoleId: user.roleId }, { applicableRoleId: null }],
    },
    orderBy: { applicableRoleId: "desc" },
    select: { defaultTargetValue: true },
  });

  return fallbackTemplate
    ? decimalToNumber(fallbackTemplate.defaultTargetValue)
    : null;
}

/**
 * Computes canonical monthly operational KPI metrics (AUTO_TCR, AUTO_OTDR, AUTO_DQS, AUTO_CPVS)
 * for a single user in Asia/Jakarta period `[start, end)`.
 */
export async function computeUserMonthlyMetrics(
  userId: string,
  year: number,
  month: number,
  options?: {
    cpvsTargetOverride?: number | null;
    projectId?: string;
    tx?: Prisma.TransactionClient;
  }
): Promise<UserMonthlyMetricsResult> {
  const db: DbClient = options?.tx ?? prisma;
  const window = getJakartaPeriodWindow(year, month);
  const projectFilter = sanitizeOptionalUuid(options?.projectId)
    ? { projectId: sanitizeOptionalUuid(options?.projectId) as string }
    : {};

  const [tasks, designBriefs, contentItems, cpvsTargetResolved] =
    await Promise.all([
      db.task.findMany({
        where: {
          assigneeId: userId,
          deletedAt: null,
          status: { not: "CANCELLED" },
          ...projectFilter,
          OR: [
            { dueDate: { gte: window.start, lt: window.end } },
            {
              dueDate: null,
              completedAt: { gte: window.start, lt: window.end },
            },
          ],
        },
        orderBy: [{ dueDate: "asc" }, { completedAt: "desc" }],
        select: {
          id: true,
          taskCode: true,
          title: true,
          projectId: true,
          taskType: true,
          status: true,
          priority: true,
          assigneeId: true,
          dueDate: true,
          firstSubmittedAt: true,
          completedAt: true,
          revisionCount: true,
          project: {
            select: { name: true, code: true },
          },
        },
      }),
      db.designBrief.findMany({
        where: {
          assignedDesignerId: userId,
          deletedAt: null,
          status: "APPROVED",
          approvedAt: { gte: window.start, lt: window.end },
          ...projectFilter,
        },
        orderBy: { approvedAt: "desc" },
        select: {
          id: true,
          title: true,
          projectId: true,
          assignedDesignerId: true,
          approvedAt: true,
          revisionCount: true,
          project: {
            select: { code: true },
          },
        },
      }),
      db.contentItem.findMany({
        where: {
          creatorId: userId,
          deletedAt: null,
          status: { in: ["SCHEDULED", "PUBLISHED"] },
          ...projectFilter,
          OR: [
            { publishedAt: { gte: window.start, lt: window.end } },
            {
              publishedAt: null,
              plannedPublishAt: { gte: window.start, lt: window.end },
            },
          ],
        },
        orderBy: [{ publishedAt: "desc" }, { plannedPublishAt: "desc" }],
        select: {
          id: true,
          title: true,
          platform: true,
          contentFormat: true,
          status: true,
          creatorId: true,
          plannedPublishAt: true,
          publishedAt: true,
        },
      }),
      options?.cpvsTargetOverride !== undefined
        ? Promise.resolve(options.cpvsTargetOverride)
        : resolveUserCpvsTarget(db, userId, year, month),
    ]);

  return aggregateMetricsFromRows({
    userId,
    window,
    tasks,
    designBriefs,
    contentItems,
    cpvsTargetValue: cpvsTargetResolved,
  });
}

/**
 * Computes a user's 6-month performance trend ending at (anchorYear, anchorMonth)
 * using batched range queries (zero N+1 queries) and respecting FINALIZED snapshots.
 */
export async function getUserSixMonthTrend(
  userId: string,
  anchorYear: number,
  anchorMonth: number
): Promise<MonthlyTrendPoint[]> {
  const periods = getTrailingSixPeriods(anchorYear, anchorMonth);
  const firstPeriod = periods[0];
  const lastPeriod = periods[periods.length - 1];
  if (!firstPeriod || !lastPeriod) return [];

  const rangeStart = getJakartaPeriodWindow(
    firstPeriod.year,
    firstPeriod.month
  ).start;
  const rangeEnd = getJakartaPeriodWindow(lastPeriod.year, lastPeriod.month).end;

  const [user, tasks, designBriefs, contentItems, evaluations, assignments, templates] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, roleId: true },
      }),
      prisma.task.findMany({
        where: {
          assigneeId: userId,
          deletedAt: null,
          status: { not: "CANCELLED" },
          OR: [
            { dueDate: { gte: rangeStart, lt: rangeEnd } },
            {
              dueDate: null,
              completedAt: { gte: rangeStart, lt: rangeEnd },
            },
          ],
        },
        select: {
          id: true,
          taskCode: true,
          title: true,
          projectId: true,
          taskType: true,
          status: true,
          priority: true,
          assigneeId: true,
          dueDate: true,
          firstSubmittedAt: true,
          completedAt: true,
          revisionCount: true,
          project: { select: { name: true, code: true } },
        },
      }),
      prisma.designBrief.findMany({
        where: {
          assignedDesignerId: userId,
          deletedAt: null,
          status: "APPROVED",
          approvedAt: { gte: rangeStart, lt: rangeEnd },
        },
        select: {
          id: true,
          title: true,
          projectId: true,
          assignedDesignerId: true,
          approvedAt: true,
          revisionCount: true,
          project: { select: { code: true } },
        },
      }),
      prisma.contentItem.findMany({
        where: {
          creatorId: userId,
          deletedAt: null,
          status: { in: ["SCHEDULED", "PUBLISHED"] },
          OR: [
            { publishedAt: { gte: rangeStart, lt: rangeEnd } },
            {
              publishedAt: null,
              plannedPublishAt: { gte: rangeStart, lt: rangeEnd },
            },
          ],
        },
        select: {
          id: true,
          title: true,
          platform: true,
          contentFormat: true,
          status: true,
          creatorId: true,
          plannedPublishAt: true,
          publishedAt: true,
        },
      }),
      prisma.monthlyEvaluation.findMany({
        where: {
          userId,
          OR: periods.map((p) => ({
            periodYear: p.year,
            periodMonth: p.month,
          })),
        },
        select: {
          periodYear: true,
          periodMonth: true,
          status: true,
          completionRate: true,
          onTimeRate: true,
          designQualityScore: true,
          weightedKpiScore: true,
          items: {
            select: {
              metricSource: true,
              targetValue: true,
              actualValue: true,
              achievementPct: true,
            },
          },
        },
      }),
      prisma.kpiAssignment.findMany({
        where: {
          userId,
          OR: periods.map((p) => ({
            periodYear: p.year,
            periodMonth: p.month,
          })),
        },
        select: {
          periodYear: true,
          periodMonth: true,
          targetValue: true,
          weight: true,
          kpiTemplate: {
            select: {
              metricSource: true,
            },
          },
        },
      }),
      prisma.kpiTemplate.findMany({
        where: {
          isActive: true,
          deletedAt: null,
        },
        select: {
          applicableRoleId: true,
          metricSource: true,
          defaultTargetValue: true,
          defaultWeight: true,
        },
      }),
    ]);

  const roleTemplates = user
    ? templates.filter((t) => t.applicableRoleId === user.roleId)
    : [];
  const fallbackTemplates =
    roleTemplates.length > 0
      ? roleTemplates
      : templates.filter((t) => t.applicableRoleId === null);

  return periods.map((p) => {
    const window = getJakartaPeriodWindow(p.year, p.month);
    const evalRecord = evaluations.find(
      (e) => e.periodYear === p.year && e.periodMonth === p.month
    );

    if (evalRecord && evalRecord.status === "FINALIZED") {
      const cpvsItem = evalRecord.items.find(
        (item) => item.metricSource === "AUTO_CPVS"
      );
      return {
        periodYear: p.year,
        periodMonth: p.month,
        periodKey: p.periodMonth,
        label: p.label,
        tcr: decimalToNumber(evalRecord.completionRate),
        otdr: decimalToNumber(evalRecord.onTimeRate),
        dqs: decimalToNumber(evalRecord.designQualityScore),
        cpvs: cpvsItem ? decimalToNumber(cpvsItem.achievementPct) : null,
        weightedKpiScore: decimalToNumber(evalRecord.weightedKpiScore),
        isFinalized: true,
      };
    }

    const periodAssignments = assignments.filter(
      (a) => a.periodYear === p.year && a.periodMonth === p.month
    );

    const cpvsAssignment = periodAssignments.find(
      (a) => a.kpiTemplate.metricSource === "AUTO_CPVS"
    );
    const cpvsTemplate = fallbackTemplates.find(
      (t) => t.metricSource === "AUTO_CPVS"
    );
    const cpvsTarget = cpvsAssignment
      ? decimalToNumber(cpvsAssignment.targetValue)
      : cpvsTemplate
        ? decimalToNumber(cpvsTemplate.defaultTargetValue)
        : null;

    const scopedTasks = tasks.filter((t) =>
      taskMatchesWindow(t, window.start, window.end)
    );
    const scopedBriefs = designBriefs.filter(
      (b) =>
        b.approvedAt !== null &&
        b.approvedAt >= window.start &&
        b.approvedAt < window.end
    );
    const scopedContent = contentItems.filter((c) => {
      const ts = contentEffectiveTimestamp(c);
      return ts !== null && ts >= window.start && ts < window.end;
    });

    const liveMetrics = aggregateMetricsFromRows({
      userId,
      window,
      tasks: scopedTasks,
      designBriefs: scopedBriefs,
      contentItems: scopedContent,
      cpvsTargetValue: cpvsTarget,
    });

    const activeSpecItems =
      periodAssignments.length > 0
        ? periodAssignments.map((a) => ({
            metricSource: a.kpiTemplate.metricSource,
            targetValue: decimalToNumber(a.targetValue) ?? 0,
            weight: decimalToNumber(a.weight) ?? 0,
          }))
        : fallbackTemplates.map((t) => ({
            metricSource: t.metricSource,
            targetValue: decimalToNumber(t.defaultTargetValue) ?? 0,
            weight: decimalToNumber(t.defaultWeight) ?? 0,
          }));

    const weightedItems = activeSpecItems.map((spec) => {
      const manualItem = evalRecord?.items.find(
        (ei) => ei.metricSource === "MANUAL_SCORE"
      );
      const resolved = resolveItemAchievement({
        metricSource: spec.metricSource,
        metrics: liveMetrics,
        targetValue: spec.targetValue,
        manualActualValue:
          spec.metricSource === "MANUAL_SCORE" && manualItem
            ? decimalToNumber(manualItem.actualValue)
            : null,
      });
      return {
        weight: spec.weight,
        achievementPct: resolved.achievementPct,
      };
    });

    const hasAnyMetric = weightedItems.some((wi) => wi.achievementPct !== null);
    const computed = computeWeightedScoreAndGrade(weightedItems);

    return {
      periodYear: p.year,
      periodMonth: p.month,
      periodKey: p.periodMonth,
      label: p.label,
      tcr: liveMetrics.completionRate,
      otdr: liveMetrics.onTimeRate,
      dqs: liveMetrics.designQualityScore,
      cpvs: liveMetrics.cpvsScore,
      weightedKpiScore: hasAnyMetric ? computed.weightedKpiScore : null,
      isFinalized: false,
    };
  });
}

function averageNonNull(values: ReadonlyArray<number | null>): number | null {
  let sum = 0;
  let count = 0;
  for (const val of values) {
    if (val !== null && val !== undefined && Number.isFinite(val)) {
      sum += val;
      count += 1;
    }
  }
  return count === 0 ? null : round2(sum / count);
}

/**
 * Aggregates executive Team Performance Dashboard data (summary cards, leaderboard,
 * active workload distribution, and 6-month trend) in batched queries.
 */
export async function getTeamPerformanceOverview(filters: {
  year: number;
  month: number;
  department?: string | null;
  projectId?: string | null;
  roleCode?: string | null;
}): Promise<TeamPerformanceOverviewDTO> {
  const { year, month } = filters;
  const department =
    filters.department && filters.department !== "ALL"
      ? filters.department
      : null;
  const projectId = sanitizeOptionalUuid(filters.projectId) ?? null;
  const roleCode =
    filters.roleCode && filters.roleCode !== "ALL" ? filters.roleCode : null;

  const selectedWindow = getJakartaPeriodWindow(year, month);
  const periods = getTrailingSixPeriods(year, month);
  const trendStart = getJakartaPeriodWindow(
    periods[0]!.year,
    periods[0]!.month
  ).start;
  const trendEnd = selectedWindow.end;
  const now = new Date();

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      deletedAt: null,
      ...(department ? { department } : {}),
      ...(roleCode ? { role: { code: roleCode } } : {}),
      ...(projectId
        ? {
            OR: [
              { projectMemberships: { some: { projectId } } },
              { ownedProjects: { some: { id: projectId, deletedAt: null } } },
            ],
          }
        : {}),
    },
    orderBy: [{ fullName: "asc" }],
    select: {
      id: true,
      fullName: true,
      displayName: true,
      email: true,
      avatarUrl: true,
      jobTitle: true,
      department: true,
      roleId: true,
      role: {
        select: { code: true },
      },
    },
  });

  const userIds = users.map((u) => u.id);
  if (userIds.length === 0) {
    return {
      period: {
        year,
        month,
        periodMonth: selectedWindow.periodMonth,
      },
      filters: { department, projectId },
      summary: {
        avgTcr: null,
        avgOtdr: null,
        totalTasksAssigned: 0,
        totalTasksCompleted: 0,
        totalTasksOverdue: 0,
        avgDqs: null,
        totalContentPublished: 0,
        totalActiveMembers: 0,
        finalizedEvaluationsCount: 0,
      },
      leaderboard: [],
      workloadDistribution: [],
      sixMonthTrend: periods.map((p) => ({
        periodYear: p.year,
        periodMonth: p.month,
        periodKey: p.periodMonth,
        label: p.label,
        tcr: null,
        otdr: null,
        dqs: null,
        cpvs: null,
        weightedKpiScore: null,
        isFinalized: false,
      })),
    };
  }

  const projectWhere = projectId ? { projectId } : {};

  const [
    scopedTasks,
    activeWorkloadTasks,
    approvedBriefs,
    deliveredContents,
    evaluations,
    assignments,
    kpiTemplates,
  ] = await Promise.all([
    prisma.task.findMany({
      where: {
        assigneeId: { in: userIds },
        deletedAt: null,
        status: { not: "CANCELLED" },
        ...projectWhere,
        OR: [
          { dueDate: { gte: trendStart, lt: trendEnd } },
          {
            dueDate: null,
            completedAt: { gte: trendStart, lt: trendEnd },
          },
        ],
      },
      select: {
        id: true,
        taskCode: true,
        title: true,
        projectId: true,
        taskType: true,
        status: true,
        priority: true,
        assigneeId: true,
        dueDate: true,
        firstSubmittedAt: true,
        completedAt: true,
        revisionCount: true,
        project: { select: { name: true, code: true } },
      },
    }),
    prisma.task.findMany({
      where: {
        assigneeId: { in: userIds },
        deletedAt: null,
        status: { in: ["TODO", "IN_PROGRESS", "IN_REVIEW", "REVISION"] },
        ...projectWhere,
      },
      select: {
        id: true,
        assigneeId: true,
        status: true,
        dueDate: true,
      },
    }),
    prisma.designBrief.findMany({
      where: {
        assignedDesignerId: { in: userIds },
        deletedAt: null,
        status: "APPROVED",
        approvedAt: { gte: trendStart, lt: trendEnd },
        ...projectWhere,
      },
      select: {
        id: true,
        title: true,
        projectId: true,
        assignedDesignerId: true,
        approvedAt: true,
        revisionCount: true,
        project: { select: { code: true } },
      },
    }),
    prisma.contentItem.findMany({
      where: {
        creatorId: { in: userIds },
        deletedAt: null,
        status: { in: ["SCHEDULED", "PUBLISHED"] },
        ...projectWhere,
        OR: [
          { publishedAt: { gte: trendStart, lt: trendEnd } },
          {
            publishedAt: null,
            plannedPublishAt: { gte: trendStart, lt: trendEnd },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        platform: true,
        contentFormat: true,
        status: true,
        creatorId: true,
        plannedPublishAt: true,
        publishedAt: true,
      },
    }),
    prisma.monthlyEvaluation.findMany({
      where: {
        userId: { in: userIds },
        OR: periods.map((p) => ({
          periodYear: p.year,
          periodMonth: p.month,
        })),
      },
      select: {
        id: true,
        userId: true,
        periodYear: true,
        periodMonth: true,
        status: true,
        totalTasksAssigned: true,
        totalTasksCompleted: true,
        tasksCompletedOnTime: true,
        completionRate: true,
        onTimeRate: true,
        designQualityScore: true,
        weightedKpiScore: true,
        performanceGrade: true,
        autoMetricsSnapshot: true,
        items: {
          select: {
            metricSource: true,
            targetValue: true,
            actualValue: true,
            weight: true,
            achievementPct: true,
          },
        },
      },
    }),
    prisma.kpiAssignment.findMany({
      where: {
        userId: { in: userIds },
        OR: periods.map((p) => ({
          periodYear: p.year,
          periodMonth: p.month,
        })),
      },
      select: {
        userId: true,
        periodYear: true,
        periodMonth: true,
        targetValue: true,
        weight: true,
        kpiTemplate: {
          select: {
            metricSource: true,
          },
        },
      },
    }),
    prisma.kpiTemplate.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      select: {
        applicableRoleId: true,
        metricSource: true,
        defaultTargetValue: true,
        defaultWeight: true,
      },
    }),
  ]);

  const tasksByUser = new Map<string, RawTaskRow[]>();
  for (const t of scopedTasks) {
    if (!t.assigneeId) continue;
    const list = tasksByUser.get(t.assigneeId) ?? [];
    list.push(t);
    tasksByUser.set(t.assigneeId, list);
  }

  const briefsByUser = new Map<string, RawDesignBriefRow[]>();
  for (const b of approvedBriefs) {
    if (!b.assignedDesignerId) continue;
    const list = briefsByUser.get(b.assignedDesignerId) ?? [];
    list.push(b);
    briefsByUser.set(b.assignedDesignerId, list);
  }

  const contentByUser = new Map<string, RawContentItemRow[]>();
  for (const c of deliveredContents) {
    const list = contentByUser.get(c.creatorId) ?? [];
    list.push(c);
    contentByUser.set(c.creatorId, list);
  }

  const workloadByUser = new Map<
    string,
    {
      todo: number;
      inProgress: number;
      inReview: number;
      revision: number;
      totalActive: number;
      overdue: number;
    }
  >();

  for (const wt of activeWorkloadTasks) {
    if (!wt.assigneeId) continue;
    const entry = workloadByUser.get(wt.assigneeId) ?? {
      todo: 0,
      inProgress: 0,
      inReview: 0,
      revision: 0,
      totalActive: 0,
      overdue: 0,
    };
    entry.totalActive += 1;
    if (wt.status === "TODO") entry.todo += 1;
    else if (wt.status === "IN_PROGRESS") entry.inProgress += 1;
    else if (wt.status === "IN_REVIEW") entry.inReview += 1;
    else if (wt.status === "REVISION") entry.revision += 1;

    if (wt.dueDate && wt.dueDate < now) {
      entry.overdue += 1;
    }
    workloadByUser.set(wt.assigneeId, entry);
  }

  const computeUserPeriodRow = (
    user: (typeof users)[number],
    pYear: number,
    pMonth: number
  ) => {
    const window = getJakartaPeriodWindow(pYear, pMonth);
    const evalRecord = evaluations.find(
      (e) =>
        e.userId === user.id &&
        e.periodYear === pYear &&
        e.periodMonth === pMonth
    );

    if (!projectId && evalRecord && evalRecord.status === "FINALIZED") {
      const snapshot = evalRecord.autoMetricsSnapshot as Partial<AutoMetricsSnapshot>;
      const cpvsItem = evalRecord.items.find(
        (i) => i.metricSource === "AUTO_CPVS"
      );
      const weightedScore = decimalToNumber(evalRecord.weightedKpiScore) ?? 0;
      return {
        tasksAssigned: evalRecord.totalTasksAssigned,
        tasksCompleted: evalRecord.totalTasksCompleted,
        tasksOnTime: evalRecord.tasksCompletedOnTime,
        tcr: decimalToNumber(evalRecord.completionRate),
        otdr: decimalToNumber(evalRecord.onTimeRate),
        dqs: decimalToNumber(evalRecord.designQualityScore),
        cpvs: cpvsItem ? decimalToNumber(cpvsItem.achievementPct) : null,
        contentDeliveredCount:
          typeof snapshot.contentDeliveredCount === "number"
            ? snapshot.contentDeliveredCount
            : (decimalToNumber(cpvsItem?.actualValue) ?? 0),
        weightedKpiScore: weightedScore,
        grade: evalRecord.performanceGrade ?? gradeFromScore(weightedScore),
        evaluationId: evalRecord.id,
        evaluationStatus: evalRecord.status,
        isFinalizedSnapshot: true,
      };
    }

    const userAssignments = assignments.filter(
      (a) =>
        a.userId === user.id &&
        a.periodYear === pYear &&
        a.periodMonth === pMonth
    );

    const roleTemplates = kpiTemplates.filter(
      (t) => t.applicableRoleId === user.roleId
    );
    const fallbackTemplates =
      roleTemplates.length > 0
        ? roleTemplates
        : kpiTemplates.filter((t) => t.applicableRoleId === null);

    const cpvsAssign = userAssignments.find(
      (a) => a.kpiTemplate.metricSource === "AUTO_CPVS"
    );
    const cpvsTpl = fallbackTemplates.find(
      (t) => t.metricSource === "AUTO_CPVS"
    );
    const cpvsTarget = cpvsAssign
      ? decimalToNumber(cpvsAssign.targetValue)
      : cpvsTpl
        ? decimalToNumber(cpvsTpl.defaultTargetValue)
        : null;

    const uTasks = (tasksByUser.get(user.id) ?? []).filter((t) =>
      taskMatchesWindow(t, window.start, window.end)
    );
    const uBriefs = (briefsByUser.get(user.id) ?? []).filter(
      (b) =>
        b.approvedAt !== null &&
        b.approvedAt >= window.start &&
        b.approvedAt < window.end
    );
    const uContent = (contentByUser.get(user.id) ?? []).filter((c) => {
      const ts = contentEffectiveTimestamp(c);
      return ts !== null && ts >= window.start && ts < window.end;
    });

    const live = aggregateMetricsFromRows({
      userId: user.id,
      window,
      tasks: uTasks,
      designBriefs: uBriefs,
      contentItems: uContent,
      cpvsTargetValue: cpvsTarget,
    });

    const activeSpecItems =
      userAssignments.length > 0
        ? userAssignments.map((a) => ({
            metricSource: a.kpiTemplate.metricSource,
            targetValue: decimalToNumber(a.targetValue) ?? 0,
            weight: decimalToNumber(a.weight) ?? 0,
          }))
        : fallbackTemplates.map((t) => ({
            metricSource: t.metricSource,
            targetValue: decimalToNumber(t.defaultTargetValue) ?? 0,
            weight: decimalToNumber(t.defaultWeight) ?? 0,
          }));

    const manualItems =
      evalRecord?.items.filter((i) => i.metricSource === "MANUAL_SCORE") ?? [];
    let manualIdx = 0;

    const weightedItems = activeSpecItems.map((spec) => {
      let manualActual: number | null = null;
      if (spec.metricSource === "MANUAL_SCORE") {
        const match = manualItems[manualIdx];
        manualIdx += 1;
        manualActual = match ? decimalToNumber(match.actualValue) : null;
      }
      const resolved = resolveItemAchievement({
        metricSource: spec.metricSource,
        metrics: live,
        targetValue: spec.targetValue,
        manualActualValue: manualActual,
      });
      return {
        weight: spec.weight,
        achievementPct: resolved.achievementPct,
      };
    });

    const computed = computeWeightedScoreAndGrade(weightedItems);

    return {
      tasksAssigned: live.totalTasksAssigned,
      tasksCompleted: live.totalTasksCompleted,
      tasksOnTime: live.tasksCompletedOnTime,
      tcr: live.completionRate,
      otdr: live.onTimeRate,
      dqs: live.designQualityScore,
      cpvs: live.cpvsScore,
      contentDeliveredCount: live.contentDeliveredCount,
      weightedKpiScore: computed.weightedKpiScore,
      grade: computed.grade,
      evaluationId: evalRecord?.id ?? null,
      evaluationStatus: evalRecord?.status ?? null,
      isFinalizedSnapshot: false,
    };
  };

  const leaderboard = users
    .map((user) => {
      const metrics = computeUserPeriodRow(user, year, month);
      const wl = workloadByUser.get(user.id) ?? {
        todo: 0,
        inProgress: 0,
        inReview: 0,
        revision: 0,
        totalActive: 0,
        overdue: 0,
      };
      return {
        userId: user.id,
        fullName: user.fullName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        jobTitle: user.jobTitle,
        department: user.department,
        roleCode: user.role.code as RoleCode,
        tasksAssigned: metrics.tasksAssigned,
        tasksCompleted: metrics.tasksCompleted,
        tasksOnTime: metrics.tasksOnTime,
        activeTasksCount: wl.totalActive,
        overdueTasksCount: wl.overdue,
        todoCount: wl.todo,
        inProgressCount: wl.inProgress,
        inReviewCount: wl.inReview,
        revisionCount: wl.revision,
        tcr: metrics.tcr,
        otdr: metrics.otdr,
        dqs: metrics.dqs,
        cpvs: metrics.cpvs,
        contentDeliveredCount: metrics.contentDeliveredCount,
        weightedKpiScore: metrics.weightedKpiScore,
        grade: metrics.grade,
        evaluationId: metrics.evaluationId,
        evaluationStatus: metrics.evaluationStatus,
        isFinalizedSnapshot: metrics.isFinalizedSnapshot,
      };
    })
    .sort((a, b) => b.weightedKpiScore - a.weightedKpiScore);

  const workloadDistribution = users.map((user) => {
    const wl = workloadByUser.get(user.id) ?? {
      todo: 0,
      inProgress: 0,
      inReview: 0,
      revision: 0,
      totalActive: 0,
      overdue: 0,
    };
    const firstName = user.displayName ?? user.fullName.split(" ")[0] ?? user.fullName;
    return {
      userId: user.id,
      name: user.fullName,
      shortName: firstName,
      department: user.department,
      todo: wl.todo,
      inProgress: wl.inProgress,
      inReview: wl.inReview,
      revision: wl.revision,
      totalActive: wl.totalActive,
      overdue: wl.overdue,
    };
  });

  const sixMonthTrend: MonthlyTrendPoint[] = periods.map((p) => {
    const rows = users.map((user) =>
      computeUserPeriodRow(user, p.year, p.month)
    );
    const activeScores = rows
      .filter(
        (r) =>
          r.tcr !== null ||
          r.otdr !== null ||
          r.dqs !== null ||
          r.cpvs !== null ||
          r.isFinalizedSnapshot
      )
      .map((r) => r.weightedKpiScore);
    const allFinalized =
      rows.length > 0 && rows.every((r) => r.isFinalizedSnapshot);

    return {
      periodYear: p.year,
      periodMonth: p.month,
      periodKey: p.periodMonth,
      label: p.label,
      tcr: averageNonNull(rows.map((r) => r.tcr)),
      otdr: averageNonNull(rows.map((r) => r.otdr)),
      dqs: averageNonNull(rows.map((r) => r.dqs)),
      cpvs: averageNonNull(rows.map((r) => r.cpvs)),
      weightedKpiScore: averageNonNull(activeScores),
      isFinalized: allFinalized,
    };
  });

  const summary = {
    avgTcr: averageNonNull(leaderboard.map((r) => r.tcr)),
    avgOtdr: averageNonNull(leaderboard.map((r) => r.otdr)),
    totalTasksAssigned: leaderboard.reduce((s, r) => s + r.tasksAssigned, 0),
    totalTasksCompleted: leaderboard.reduce((s, r) => s + r.tasksCompleted, 0),
    totalTasksOverdue: leaderboard.reduce((s, r) => s + r.overdueTasksCount, 0),
    avgDqs: averageNonNull(leaderboard.map((r) => r.dqs)),
    totalContentPublished: leaderboard.reduce(
      (s, r) => s + r.contentDeliveredCount,
      0
    ),
    totalActiveMembers: leaderboard.length,
    finalizedEvaluationsCount: leaderboard.filter(
      (r) => r.evaluationStatus === "FINALIZED"
    ).length,
  };

  return {
    period: {
      year,
      month,
      periodMonth: selectedWindow.periodMonth,
    },
    filters: {
      department,
      projectId,
    },
    summary,
    leaderboard,
    workloadDistribution,
    sixMonthTrend,
  };
}
