import type { KpiMetricSource } from "@prisma/client";
import {
  hasPermission,
  PERMISSIONS,
  type RoleCode,
} from "@/lib/constants/permissions";
import type { AuthContext } from "@/server/auth/rbac";
import { prisma } from "@/server/db/prisma";
import {
  computeUserMonthlyMetrics,
  computeWeightedScoreAndGrade,
  decimalToNumber,
  formatPeriodMonthLabel,
  getUserSixMonthTrend,
  parsePeriodMonthString,
  resolveItemAchievement,
} from "@/features/team-kpi/services/kpi-aggregator.service";
import type {
  AutoMetricsSnapshot,
  EvaluationListRowDTO,
  MonthlyTrendPoint,
  TeamDirectoryMemberDTO,
  UserMonthlyMetricsResult,
  WeightedScoreResult,
} from "@/features/team-kpi/types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUuid(id: string): boolean {
  return UUID_REGEX.test(id);
}

export interface TeamDirectoryData {
  members: TeamDirectoryMemberDTO[];
  departments: string[];
  roles: Array<{ id: string; code: RoleCode; name: string }>;
  canReadWorkload: boolean;
}

export async function getTeamDirectoryData(
  ctx: AuthContext
): Promise<TeamDirectoryData> {
  const canReadWorkload = hasPermission(
    ctx.permissions,
    PERMISSIONS.KPI_PERFORMANCE_READ_TEAM,
    ctx.roleCode
  );

  const [users, roles, projectCounts, activeTasks] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: [{ isActive: "desc" }, { fullName: "asc" }],
      select: {
        id: true,
        fullName: true,
        displayName: true,
        email: true,
        avatarUrl: true,
        jobTitle: true,
        department: true,
        phone: true,
        skills: true,
        employmentStatus: true,
        joinedAt: true,
        isActive: true,
        roleId: true,
        role: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    }),
    prisma.role.findMany({
      orderBy: { code: "asc" },
      select: {
        id: true,
        code: true,
        name: true,
      },
    }),
    prisma.projectMember.groupBy({
      by: ["userId"],
      where: {
        project: {
          deletedAt: null,
          status: { in: ["PLANNING", "ACTIVE"] },
        },
      },
      _count: { projectId: true },
    }),
    canReadWorkload
      ? prisma.task.findMany({
          where: {
            deletedAt: null,
            assigneeId: { not: null },
            status: { in: ["TODO", "IN_PROGRESS", "IN_REVIEW", "REVISION"] },
          },
          select: {
            assigneeId: true,
            dueDate: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const projectCountMap = new Map<string, number>();
  for (const pc of projectCounts) {
    projectCountMap.set(pc.userId, pc._count.projectId);
  }

  const now = new Date();
  const taskCountsMap = new Map<
    string,
    { active: number; overdue: number }
  >();
  if (canReadWorkload) {
    for (const task of activeTasks) {
      if (!task.assigneeId) continue;
      const entry = taskCountsMap.get(task.assigneeId) ?? {
        active: 0,
        overdue: 0,
      };
      entry.active += 1;
      if (task.dueDate && task.dueDate < now) {
        entry.overdue += 1;
      }
      taskCountsMap.set(task.assigneeId, entry);
    }
  }

  const departmentsSet = new Set<string>();
  const members: TeamDirectoryMemberDTO[] = users.map((u) => {
    departmentsSet.add(u.department);
    const counts = taskCountsMap.get(u.id);
    return {
      id: u.id,
      fullName: u.fullName,
      displayName: u.displayName,
      email: u.email,
      avatarUrl: u.avatarUrl,
      jobTitle: u.jobTitle,
      department: u.department,
      phone: u.phone,
      skills: u.skills,
      employmentStatus: u.employmentStatus,
      joinedAt: u.joinedAt ? u.joinedAt.toISOString() : null,
      isActive: u.isActive,
      roleId: u.roleId,
      roleCode: u.role.code as RoleCode,
      roleName: u.role.name,
      activeTasksCount: canReadWorkload ? (counts?.active ?? 0) : null,
      overdueTasksCount: canReadWorkload ? (counts?.overdue ?? 0) : null,
      activeProjectsCount: projectCountMap.get(u.id) ?? 0,
    };
  });

  return {
    members,
    departments: Array.from(departmentsSet).sort((a, b) => a.localeCompare(b)),
    roles: roles.map((r) => ({
      id: r.id,
      code: r.code as RoleCode,
      name: r.name,
    })),
    canReadWorkload,
  };
}

export interface IndividualPerformanceData {
  profile: {
    id: string;
    fullName: string;
    displayName: string | null;
    email: string;
    avatarUrl: string | null;
    jobTitle: string;
    department: string;
    phone: string | null;
    bio: string | null;
    skills: string[];
    employmentStatus: string;
    joinedAt: string | null;
    isActive: boolean;
    roleCode: RoleCode;
    roleName: string;
    managerName: string | null;
  };
  projects: Array<{
    id: string;
    code: string;
    name: string;
    status: string;
    colorHex: string;
    projectRole: string;
  }>;
  period: {
    year: number;
    month: number;
    periodMonth: string;
  };
  metrics: UserMonthlyMetricsResult;
  weightedPreview: WeightedScoreResult;
  isFinalizedSnapshot: boolean;
  sixMonthTrend: MonthlyTrendPoint[];
  kpiTargets: Array<{
    id: string;
    templateName: string;
    metricSource: string;
    unit: string;
    targetValue: number;
    weight: number;
    actualValue: number | null;
    achievementPct: number | null;
  }>;
  evaluationsHistory: EvaluationListRowDTO[];
}

export async function getIndividualProfileAndPerformance(
  ctx: AuthContext,
  targetUserId: string,
  periodRaw?: string
): Promise<
  | { status: "NOT_FOUND" }
  | { status: "FORBIDDEN" }
  | { status: "OK"; data: IndividualPerformanceData }
> {
  if (!isValidUuid(targetUserId)) {
    return { status: "NOT_FOUND" };
  }

  const canViewTeam = hasPermission(
    ctx.permissions,
    PERMISSIONS.KPI_PERFORMANCE_READ_TEAM,
    ctx.roleCode
  );
  const isSelf = ctx.userId === targetUserId;

  if (!canViewTeam && !isSelf) {
    return { status: "FORBIDDEN" };
  }

  const user = await prisma.user.findFirst({
    where: {
      id: targetUserId,
      deletedAt: null,
    },
    select: {
      id: true,
      fullName: true,
      displayName: true,
      email: true,
      avatarUrl: true,
      jobTitle: true,
      department: true,
      phone: true,
      bio: true,
      skills: true,
      employmentStatus: true,
      joinedAt: true,
      isActive: true,
      roleId: true,
      role: { select: { code: true, name: true } },
      manager: { select: { fullName: true } },
      projectMemberships: {
        where: {
          project: { deletedAt: null },
        },
        orderBy: { joinedAt: "desc" },
        select: {
          projectRole: true,
          project: {
            select: {
              id: true,
              code: true,
              name: true,
              status: true,
              colorHex: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return { status: "NOT_FOUND" };
  }

  const { year, month, periodMonth } = parsePeriodMonthString(periodRaw);

  const [
    liveMetrics,
    sixMonthTrend,
    periodAssignments,
    roleTemplates,
    evaluationsRaw,
  ] = await Promise.all([
    computeUserMonthlyMetrics(targetUserId, year, month),
    getUserSixMonthTrend(targetUserId, year, month),
    prisma.kpiAssignment.findMany({
      where: {
        userId: targetUserId,
        periodYear: year,
        periodMonth: month,
      },
      orderBy: { weight: "desc" },
      select: {
        id: true,
        targetValue: true,
        weight: true,
        kpiTemplate: {
          select: {
            name: true,
            metricSource: true,
            unit: true,
          },
        },
      },
    }),
    prisma.kpiTemplate.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [{ applicableRoleId: user.roleId }, { applicableRoleId: null }],
      },
      orderBy: { defaultWeight: "desc" },
      select: {
        id: true,
        name: true,
        applicableRoleId: true,
        metricSource: true,
        unit: true,
        defaultTargetValue: true,
        defaultWeight: true,
      },
    }),
    prisma.monthlyEvaluation.findMany({
      where: { userId: targetUserId },
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
      select: {
        id: true,
        userId: true,
        evaluatorId: true,
        periodYear: true,
        periodMonth: true,
        status: true,
        totalTasksAssigned: true,
        totalTasksCompleted: true,
        tasksCompletedOnTime: true,
        completionRate: true,
        onTimeRate: true,
        avgRevisionCount: true,
        designQualityScore: true,
        weightedKpiScore: true,
        performanceGrade: true,
        autoMetricsSnapshot: true,
        finalizedAt: true,
        updatedAt: true,
        evaluator: { select: { fullName: true } },
        items: {
          orderBy: { weight: "desc" },
          select: {
            id: true,
            indicatorNameSnapshot: true,
            metricSource: true,
            targetValue: true,
            actualValue: true,
            weight: true,
            achievementPct: true,
            kpiTemplate: { select: { unit: true } },
          },
        },
      },
    }),
  ]);

  const currentPeriodEval = evaluationsRaw.find(
    (e) => e.periodYear === year && e.periodMonth === month
  );

  const isFinalizedSnapshot = currentPeriodEval?.status === "FINALIZED";

  // Respect Zero Historical Drift when viewing a FINALIZED period
  let effectiveMetrics = liveMetrics;
  if (isFinalizedSnapshot && currentPeriodEval) {
    const snap = currentPeriodEval.autoMetricsSnapshot as Partial<AutoMetricsSnapshot>;
    const cpvsItem = currentPeriodEval.items.find(
      (item) => item.metricSource === "AUTO_CPVS"
    );
    effectiveMetrics = {
      ...liveMetrics,
      totalTasksAssigned:
        typeof snap.totalAssignedTasks === "number"
          ? snap.totalAssignedTasks
          : currentPeriodEval.totalTasksAssigned,
      totalTasksCompleted:
        typeof snap.completedTasks === "number"
          ? snap.completedTasks
          : currentPeriodEval.totalTasksCompleted,
      tasksCompletedOnTime:
        typeof snap.onTimeCompletedTasks === "number"
          ? snap.onTimeCompletedTasks
          : currentPeriodEval.tasksCompletedOnTime,
      completionRate: decimalToNumber(currentPeriodEval.completionRate),
      onTimeRate: decimalToNumber(currentPeriodEval.onTimeRate),
      designQualityScore: decimalToNumber(currentPeriodEval.designQualityScore),
      avgDesignRevisionCount:
        typeof snap.avgDesignRevisionCount === "number"
          ? snap.avgDesignRevisionCount
          : decimalToNumber(currentPeriodEval.avgRevisionCount),
      firstPassApprovalRate:
        typeof snap.firstPassApprovalRate === "number"
          ? snap.firstPassApprovalRate
          : liveMetrics.firstPassApprovalRate,
      contentDeliveredCount:
        typeof snap.contentDeliveredCount === "number"
          ? snap.contentDeliveredCount
          : (decimalToNumber(cpvsItem?.actualValue) ?? liveMetrics.contentDeliveredCount),
      cpvsTargetValue: cpvsItem
        ? decimalToNumber(cpvsItem.targetValue)
        : liveMetrics.cpvsTargetValue,
      cpvsScore: cpvsItem
        ? decimalToNumber(cpvsItem.achievementPct)
        : liveMetrics.cpvsScore,
      tasksBreakdown: Array.isArray(snap.tasksBreakdown)
        ? snap.tasksBreakdown
        : liveMetrics.tasksBreakdown,
      designBriefsBreakdown: Array.isArray(snap.designBriefsBreakdown)
        ? snap.designBriefsBreakdown
        : liveMetrics.designBriefsBreakdown,
      contentBreakdown: Array.isArray(snap.contentBreakdown)
        ? snap.contentBreakdown
        : liveMetrics.contentBreakdown,
    };
  }

  const specificRoleTemplates = roleTemplates.filter(
    (t) => t.applicableRoleId === user.roleId
  );
  const effectiveTemplates =
    specificRoleTemplates.length > 0 ? specificRoleTemplates : roleTemplates;

  const kpiTargets =
    isFinalizedSnapshot && currentPeriodEval
      ? currentPeriodEval.items.map((item) => ({
          id: item.id,
          templateName: item.indicatorNameSnapshot,
          metricSource: item.metricSource,
          unit: item.kpiTemplate.unit,
          targetValue: decimalToNumber(item.targetValue) ?? 0,
          weight: decimalToNumber(item.weight) ?? 0,
          actualValue: decimalToNumber(item.actualValue),
          achievementPct: decimalToNumber(item.achievementPct),
        }))
      : (periodAssignments.length > 0
          ? periodAssignments.map((a) => ({
              id: a.id,
              templateName: a.kpiTemplate.name,
              metricSource: a.kpiTemplate.metricSource,
              unit: a.kpiTemplate.unit,
              targetValue: decimalToNumber(a.targetValue) ?? 0,
              weight: decimalToNumber(a.weight) ?? 0,
            }))
          : effectiveTemplates.map((t) => ({
              id: t.id,
              templateName: t.name,
              metricSource: t.metricSource,
              unit: t.unit,
              targetValue: decimalToNumber(t.defaultTargetValue) ?? 0,
              weight: decimalToNumber(t.defaultWeight) ?? 0,
            }))
        ).map((item) => {
          const canExposeManual = canViewTeam && currentPeriodEval;
          const matchingManual = canExposeManual
            ? currentPeriodEval.items.find(
                (ei) => ei.metricSource === "MANUAL_SCORE"
              )
            : undefined;
          const resolved = resolveItemAchievement({
            metricSource: item.metricSource as KpiMetricSource,
            metrics: effectiveMetrics,
            targetValue: item.targetValue,
            manualActualValue:
              item.metricSource === "MANUAL_SCORE" && matchingManual
                ? decimalToNumber(matchingManual.actualValue)
                : null,
          });
          return {
            ...item,
            actualValue: resolved.actualValue,
            achievementPct: resolved.achievementPct,
          };
        });

  const weightedPreview =
    isFinalizedSnapshot && currentPeriodEval
      ? {
          activeWeightPercent: kpiTargets.reduce(
            (sum, i) => (i.achievementPct !== null ? sum + i.weight : sum),
            0
          ),
          totalWeightPercent: kpiTargets.reduce((sum, i) => sum + i.weight, 0),
          weightedKpiScore:
            decimalToNumber(currentPeriodEval.weightedKpiScore) ?? 0,
          grade:
            currentPeriodEval.performanceGrade ??
            computeWeightedScoreAndGrade(kpiTargets).grade,
        }
      : computeWeightedScoreAndGrade(kpiTargets);

  const evaluationsHistory: EvaluationListRowDTO[] = evaluationsRaw
    .filter((ev) => canViewTeam || ev.status === "FINALIZED")
    .map((ev) => ({
      id: ev.id,
      userId: ev.userId,
      userName: user.fullName,
      userEmail: user.email,
      userAvatarUrl: user.avatarUrl,
      userDepartment: user.department,
      userJobTitle: user.jobTitle,
      userRole: user.role.code as RoleCode,
      evaluatorId: ev.evaluatorId,
      evaluatorName: ev.evaluator.fullName,
      periodYear: ev.periodYear,
      periodMonth: ev.periodMonth,
      periodMonthLabel: formatPeriodMonthLabel(ev.periodYear, ev.periodMonth),
      status: ev.status,
      completionRate: decimalToNumber(ev.completionRate),
      onTimeRate: decimalToNumber(ev.onTimeRate),
      designQualityScore: decimalToNumber(ev.designQualityScore),
      weightedKpiScore: decimalToNumber(ev.weightedKpiScore),
      performanceGrade: ev.performanceGrade,
      finalizedAt: ev.finalizedAt ? ev.finalizedAt.toISOString() : null,
      updatedAt: ev.updatedAt.toISOString(),
      isMaskedForEmployee: false,
    }));

  return {
    status: "OK",
    data: {
      profile: {
        id: user.id,
        fullName: user.fullName,
        displayName: user.displayName,
        email: user.email,
        avatarUrl: user.avatarUrl,
        jobTitle: user.jobTitle,
        department: user.department,
        phone: user.phone,
        bio: user.bio,
        skills: user.skills,
        employmentStatus: user.employmentStatus,
        joinedAt: user.joinedAt ? user.joinedAt.toISOString() : null,
        isActive: user.isActive,
        roleCode: user.role.code as RoleCode,
        roleName: user.role.name,
        managerName: user.manager?.fullName ?? null,
      },
      projects: user.projectMemberships.map((pm) => ({
        id: pm.project.id,
        code: pm.project.code,
        name: pm.project.name,
        status: pm.project.status,
        colorHex: pm.project.colorHex,
        projectRole: pm.projectRole,
      })),
      period: {
        year,
        month,
        periodMonth,
      },
      metrics: effectiveMetrics,
      weightedPreview,
      isFinalizedSnapshot,
      sixMonthTrend,
      kpiTargets,
      evaluationsHistory,
    },
  };
}
