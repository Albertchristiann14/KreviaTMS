import type { EvaluationStatus, KpiMetricSource } from "@prisma/client";
import {
  hasAnyPermission,
  hasPermission,
  PERMISSIONS,
  type RoleCode,
} from "@/lib/constants/permissions";
import type { AuthContext } from "@/server/auth/rbac";
import { prisma } from "@/server/db/prisma";
import {
  buildAutoMetricsSnapshot,
  computeUserMonthlyMetrics,
  computeWeightedScoreAndGrade,
  decimalToNumber,
  formatPeriodMonthLabel,
  getPreviousYearMonth,
  getTeamPerformanceOverview,
  parsePeriodMonthString,
  round2,
  sanitizeOptionalUuid,
} from "@/features/team-kpi/services/kpi-aggregator.service";
import { isValidUuid } from "@/features/team-kpi/queries/team.queries";
import type {
  AutoMetricsSnapshot,
  EvaluationListRowDTO,
  KpiAssignmentDTO,
  KpiTemplateDTO,
  MonthlyEvaluationDTO,
  TeamPerformanceOverviewDTO,
} from "@/features/team-kpi/types";

export interface KpiTemplatesBuilderData {
  period: {
    year: number;
    month: number;
    periodMonth: string;
    prevPeriodMonth: string;
  };
  templates: KpiTemplateDTO[];
  roles: Array<{ id: string; code: RoleCode; name: string }>;
  users: Array<{
    id: string;
    fullName: string;
    email: string;
    department: string;
    jobTitle: string;
    roleId: string;
    roleCode: RoleCode;
    roleName: string;
    isFinalizedForPeriod: boolean;
    totalAssignedWeight: number;
    assignmentCount: number;
  }>;
  assignmentsByUser: Record<string, KpiAssignmentDTO[]>;
  prevMonthAssignmentsCount: number;
}

export async function getKpiTemplatesBuilderData(
  periodRaw?: string
): Promise<KpiTemplatesBuilderData> {
  const { year, month, periodMonth } = parsePeriodMonthString(periodRaw);
  const prev = getPreviousYearMonth(year, month);

  const [
    templates,
    roles,
    users,
    assignments,
    prevMonthAssignmentsCount,
    evaluations,
  ] = await Promise.all([
    prisma.kpiTemplate.findMany({
      where: { deletedAt: null },
      orderBy: [
        { isActive: "desc" },
        { applicableRoleId: "asc" },
        { defaultWeight: "desc" },
        { name: "asc" },
      ],
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        category: true,
        applicableRoleId: true,
        metricSource: true,
        unit: true,
        defaultTargetValue: true,
        defaultWeight: true,
        isHigherBetter: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        applicableRole: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    }),
    prisma.role.findMany({
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
    prisma.user.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: [{ fullName: "asc" }],
      select: {
        id: true,
        fullName: true,
        email: true,
        department: true,
        jobTitle: true,
        roleId: true,
        role: { select: { code: true, name: true } },
      },
    }),
    prisma.kpiAssignment.findMany({
      where: {
        periodYear: year,
        periodMonth: month,
      },
      orderBy: { weight: "desc" },
      select: {
        id: true,
        userId: true,
        kpiTemplateId: true,
        periodYear: true,
        periodMonth: true,
        targetValue: true,
        weight: true,
        kpiTemplate: {
          select: {
            code: true,
            name: true,
            metricSource: true,
            unit: true,
            category: true,
          },
        },
      },
    }),
    prisma.kpiAssignment.count({
      where: {
        periodYear: prev.year,
        periodMonth: prev.month,
      },
    }),
    prisma.monthlyEvaluation.findMany({
      where: {
        periodYear: year,
        periodMonth: month,
        status: "FINALIZED",
      },
      select: { userId: true },
    }),
  ]);

  const finalizedUserIds = new Set(evaluations.map((e) => e.userId));
  const assignmentsByUser: Record<string, KpiAssignmentDTO[]> = {};

  for (const a of assignments) {
    const list = assignmentsByUser[a.userId] ?? [];
    list.push({
      id: a.id,
      userId: a.userId,
      kpiTemplateId: a.kpiTemplateId,
      templateCode: a.kpiTemplate.code,
      templateName: a.kpiTemplate.name,
      metricSource: a.kpiTemplate.metricSource,
      unit: a.kpiTemplate.unit,
      category: a.kpiTemplate.category,
      periodYear: a.periodYear,
      periodMonth: a.periodMonth,
      targetValue: decimalToNumber(a.targetValue) ?? 0,
      weight: decimalToNumber(a.weight) ?? 0,
    });
    assignmentsByUser[a.userId] = list;
  }

  return {
    period: {
      year,
      month,
      periodMonth,
      prevPeriodMonth: prev.periodMonth,
    },
    templates: templates.map((t) => ({
      id: t.id,
      code: t.code,
      name: t.name,
      description: t.description,
      category: t.category,
      applicableRoleId: t.applicableRoleId,
      applicableRoleCode: (t.applicableRole?.code as RoleCode) ?? null,
      applicableRoleName: t.applicableRole?.name ?? null,
      metricSource: t.metricSource,
      unit: t.unit,
      defaultTargetValue: decimalToNumber(t.defaultTargetValue) ?? 0,
      defaultWeight: decimalToNumber(t.defaultWeight) ?? 0,
      isHigherBetter: t.isHigherBetter,
      isActive: t.isActive,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
    })),
    roles: roles.map((r) => ({
      id: r.id,
      code: r.code as RoleCode,
      name: r.name,
    })),
    users: users.map((u) => {
      const userAssignments = assignmentsByUser[u.id] ?? [];
      const totalAssignedWeight = round2(
        userAssignments.reduce((acc, item) => acc + item.weight, 0)
      );
      return {
        id: u.id,
        fullName: u.fullName,
        email: u.email,
        department: u.department,
        jobTitle: u.jobTitle,
        roleId: u.roleId,
        roleCode: u.role.code as RoleCode,
        roleName: u.role.name,
        isFinalizedForPeriod: finalizedUserIds.has(u.id),
        totalAssignedWeight,
        assignmentCount: userAssignments.length,
      };
    }),
    assignmentsByUser,
    prevMonthAssignmentsCount,
  };
}

export interface EvaluationsListPageData {
  period: {
    year: number;
    month: number;
    periodMonth: string;
  };
  canManageEvaluations: boolean;
  isSuperAdmin: boolean;
  evaluations: EvaluationListRowDTO[];
  eligibleCandidates: Array<{
    userId: string;
    fullName: string;
    email: string;
    department: string;
    roleCode: RoleCode;
    hasExistingEvaluation: boolean;
    hasValidAssignments: boolean;
    totalAssignedWeight: number;
    canActorEvaluate: boolean;
    blockedReason: string | null;
  }>;
}

export async function getEvaluationsListData(
  ctx: AuthContext,
  periodRaw?: string
): Promise<EvaluationsListPageData> {
  const { year, month, periodMonth } = parsePeriodMonthString(periodRaw);
  const isSuperAdmin = ctx.roleCode === "SUPER_ADMIN";
  const canManageEvaluations = hasAnyPermission(
    ctx.permissions,
    [
      PERMISSIONS.KPI_EVALUATION_CREATE,
      PERMISSIONS.KPI_EVALUATION_REVIEW,
      PERMISSIONS.KPI_EVALUATION_FINALIZE,
    ],
    ctx.roleCode
  );

  if (!canManageEvaluations) {
    // Staff/Designer strictly scoped to own evaluations!
    const ownRows = await prisma.monthlyEvaluation.findMany({
      where: {
        userId: ctx.userId,
      },
      orderBy: [{ periodYear: "desc" }, { periodMonth: "desc" }],
      select: {
        id: true,
        userId: true,
        evaluatorId: true,
        periodYear: true,
        periodMonth: true,
        status: true,
        completionRate: true,
        onTimeRate: true,
        designQualityScore: true,
        weightedKpiScore: true,
        performanceGrade: true,
        finalizedAt: true,
        updatedAt: true,
        user: {
          select: {
            fullName: true,
            email: true,
            avatarUrl: true,
            department: true,
            jobTitle: true,
            role: { select: { code: true } },
          },
        },
        evaluator: { select: { fullName: true } },
      },
    });

    return {
      period: { year, month, periodMonth },
      canManageEvaluations: false,
      isSuperAdmin: false,
      evaluations: ownRows.map((ev) => {
        const isFinalized = ev.status === "FINALIZED";
        return {
          id: ev.id,
          userId: ev.userId,
          userName: ev.user.fullName,
          userEmail: ev.user.email,
          userAvatarUrl: ev.user.avatarUrl,
          userDepartment: ev.user.department,
          userJobTitle: ev.user.jobTitle,
          userRole: ev.user.role.code as RoleCode,
          evaluatorId: ev.evaluatorId,
          evaluatorName: ev.evaluator.fullName,
          periodYear: ev.periodYear,
          periodMonth: ev.periodMonth,
          periodMonthLabel: formatPeriodMonthLabel(
            ev.periodYear,
            ev.periodMonth
          ),
          status: ev.status,
          completionRate: isFinalized
            ? decimalToNumber(ev.completionRate)
            : null,
          onTimeRate: isFinalized ? decimalToNumber(ev.onTimeRate) : null,
          designQualityScore: isFinalized
            ? decimalToNumber(ev.designQualityScore)
            : null,
          weightedKpiScore: isFinalized
            ? decimalToNumber(ev.weightedKpiScore)
            : null,
          performanceGrade: isFinalized ? ev.performanceGrade : null,
          finalizedAt: ev.finalizedAt ? ev.finalizedAt.toISOString() : null,
          updatedAt: ev.updatedAt.toISOString(),
          isMaskedForEmployee: !isFinalized,
        };
      }),
      eligibleCandidates: [],
    };
  }

  const [rows, activeUsers, assignments] = await Promise.all([
    prisma.monthlyEvaluation.findMany({
      where: {
        periodYear: year,
        periodMonth: month,
      },
      orderBy: [{ status: "asc" }, { user: { fullName: "asc" } }],
      select: {
        id: true,
        userId: true,
        evaluatorId: true,
        periodYear: true,
        periodMonth: true,
        status: true,
        completionRate: true,
        onTimeRate: true,
        designQualityScore: true,
        weightedKpiScore: true,
        performanceGrade: true,
        finalizedAt: true,
        updatedAt: true,
        user: {
          select: {
            fullName: true,
            email: true,
            avatarUrl: true,
            department: true,
            jobTitle: true,
            role: { select: { code: true } },
          },
        },
        evaluator: { select: { fullName: true } },
      },
    }),
    prisma.user.findMany({
      where: { isActive: true, deletedAt: null },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        email: true,
        department: true,
        role: { select: { code: true } },
      },
    }),
    prisma.kpiAssignment.findMany({
      where: {
        periodYear: year,
        periodMonth: month,
      },
      select: {
        userId: true,
        weight: true,
      },
    }),
  ]);

  const existingEvalUserIds = new Set(rows.map((r) => r.userId));
  const weightSumByUser = new Map<string, number>();
  for (const a of assignments) {
    const cur = weightSumByUser.get(a.userId) ?? 0;
    weightSumByUser.set(a.userId, round2(cur + (decimalToNumber(a.weight) ?? 0)));
  }

  const evaluations: EvaluationListRowDTO[] = rows.map((ev) => {
    const isSelfUnfinalized =
      ev.userId === ctx.userId && ev.status !== "FINALIZED";
    return {
      id: ev.id,
      userId: ev.userId,
      userName: ev.user.fullName,
      userEmail: ev.user.email,
      userAvatarUrl: ev.user.avatarUrl,
      userDepartment: ev.user.department,
      userJobTitle: ev.user.jobTitle,
      userRole: ev.user.role.code as RoleCode,
      evaluatorId: ev.evaluatorId,
      evaluatorName: ev.evaluator.fullName,
      periodYear: ev.periodYear,
      periodMonth: ev.periodMonth,
      periodMonthLabel: formatPeriodMonthLabel(ev.periodYear, ev.periodMonth),
      status: ev.status,
      completionRate: isSelfUnfinalized
        ? null
        : decimalToNumber(ev.completionRate),
      onTimeRate: isSelfUnfinalized ? null : decimalToNumber(ev.onTimeRate),
      designQualityScore: isSelfUnfinalized
        ? null
        : decimalToNumber(ev.designQualityScore),
      weightedKpiScore: isSelfUnfinalized
        ? null
        : decimalToNumber(ev.weightedKpiScore),
      performanceGrade: isSelfUnfinalized ? null : ev.performanceGrade,
      finalizedAt: ev.finalizedAt ? ev.finalizedAt.toISOString() : null,
      updatedAt: ev.updatedAt.toISOString(),
      isMaskedForEmployee: isSelfUnfinalized,
    };
  });

  const eligibleCandidates = activeUsers.map((u) => {
    const targetRole = u.role.code as RoleCode;
    const totalWeight = weightSumByUser.get(u.id) ?? 0;
    const hasValidAssignments = Math.round(totalWeight * 100) === 10000;
    const hasExisting = existingEvalUserIds.has(u.id);

    let canActorEvaluate = true;
    let blockedReason: string | null = null;

    if (u.id === ctx.userId) {
      canActorEvaluate = false;
      blockedReason = "Larangan self-evaluation (evaluatorId ≠ userId)";
    } else if (
      (targetRole === "PROJECT_MANAGER" || targetRole === "SUPER_ADMIN") &&
      !isSuperAdmin
    ) {
      canActorEvaluate = false;
      blockedReason = "Evaluasi PM/Leadership khusus dilakukan Super Admin";
    } else if (!hasValidAssignments) {
      blockedReason =
        totalWeight === 0
          ? "Belum ada KPI assignment (0%)"
          : `Total bobot KPI belum 100% (${totalWeight}%)`;
    }

    return {
      userId: u.id,
      fullName: u.fullName,
      email: u.email,
      department: u.department,
      roleCode: targetRole,
      hasExistingEvaluation: hasExisting,
      hasValidAssignments,
      totalAssignedWeight: totalWeight,
      canActorEvaluate,
      blockedReason,
    };
  });

  return {
    period: { year, month, periodMonth },
    canManageEvaluations: true,
    isSuperAdmin,
    evaluations,
    eligibleCandidates,
  };
}

export interface EvaluationDetailPermissions {
  canEditScores: boolean;
  canResyncDraft: boolean;
  canSubmit: boolean;
  canMarkReviewed: boolean;
  canReturnToSubmitted: boolean;
  canFinalize: boolean;
  canReopen: boolean;
  isReadOnly: boolean;
}

export async function getEvaluationDetailById(
  ctx: AuthContext,
  evaluationId: string
): Promise<
  | { status: "NOT_FOUND" }
  | { status: "FORBIDDEN"; reason: string }
  | {
      status: "OK";
      evaluation: MonthlyEvaluationDTO;
      permissions: EvaluationDetailPermissions;
    }
> {
  if (!isValidUuid(evaluationId)) {
    return { status: "NOT_FOUND" };
  }

  const record = await prisma.monthlyEvaluation.findUnique({
    where: { id: evaluationId },
    include: {
      user: {
        select: {
          id: true,
          fullName: true,
          email: true,
          avatarUrl: true,
          jobTitle: true,
          department: true,
          role: { select: { code: true } },
        },
      },
      evaluator: { select: { id: true, fullName: true } },
      finalizer: { select: { id: true, fullName: true } },
      items: {
        orderBy: [{ metricSource: "asc" }, { weight: "desc" }],
        include: {
          kpiTemplate: {
            select: { unit: true },
          },
        },
      },
    },
  });

  if (!record) {
    return { status: "NOT_FOUND" };
  }

  const isSelf = record.userId === ctx.userId;
  const isSuperAdmin = ctx.roleCode === "SUPER_ADMIN";
  const evaluateeRole = record.user.role.code as RoleCode;
  const hasReviewPerm = hasPermission(
    ctx.permissions,
    PERMISSIONS.KPI_EVALUATION_REVIEW,
    ctx.roleCode
  );
  const hasFinalizePerm =
    isSuperAdmin &&
    hasPermission(
      ctx.permissions,
      PERMISSIONS.KPI_EVALUATION_FINALIZE,
      ctx.roleCode
    );
  const hasReopenPerm =
    isSuperAdmin &&
    hasPermission(
      ctx.permissions,
      PERMISSIONS.KPI_EVALUATION_REOPEN,
      ctx.roleCode
    );

  // Access check:
  // 1) Self can view ONLY when FINALIZED (never view unfinalized evaluator draft scores of oneself)
  // 2) PM with review perm can view team evaluations (non-PM, non-SuperAdmin, non-self)
  // 3) Super Admin can view all evaluations (except self-unfinalized)
  const canViewAsManager =
    isSuperAdmin ||
    (hasReviewPerm &&
      !isSelf &&
      evaluateeRole !== "PROJECT_MANAGER" &&
      evaluateeRole !== "SUPER_ADMIN");

  if (isSelf && record.status !== "FINALIZED") {
    return {
      status: "FORBIDDEN",
      reason:
        "Evaluasi bulanan masih dalam proses penilaian dan baru dapat dilihat setelah berstatus FINALIZED.",
    };
  }

  if (!isSelf && !canViewAsManager) {
    return {
      status: "FORBIDDEN",
      reason:
        "Anda tidak memiliki izin untuk mengakses dokumen evaluasi anggota tim ini.",
    };
  }

  // Separation of duties for mutations
  const actorAllowedToEvaluateTarget =
    !isSelf &&
    (isSuperAdmin ||
      (hasReviewPerm &&
        evaluateeRole !== "PROJECT_MANAGER" &&
        evaluateeRole !== "SUPER_ADMIN"));

  const isFinalized = record.status === "FINALIZED";

  const canEditScores =
    actorAllowedToEvaluateTarget && !isFinalized && (isSuperAdmin || hasReviewPerm);

  const canResyncDraft =
    actorAllowedToEvaluateTarget && record.status === "DRAFT";

  const canSubmit =
    actorAllowedToEvaluateTarget && record.status === "DRAFT";

  const canMarkReviewed =
    actorAllowedToEvaluateTarget &&
    hasReviewPerm &&
    (record.status === "DRAFT" || record.status === "SUBMITTED");

  const canReturnToSubmitted =
    !isSelf && isSuperAdmin && record.status === "REVIEWED";

  const canFinalize =
    !isSelf && hasFinalizePerm && record.status === "REVIEWED";

  const canReopen = hasReopenPerm && isFinalized;

  const isReadOnly = !canEditScores;

  // Normalize autoMetricsSnapshot JSONB safely
  const rawSnap = (record.autoMetricsSnapshot ?? {}) as Partial<AutoMetricsSnapshot>;
  let snapshot: AutoMetricsSnapshot;

  if (
    typeof rawSnap.snapshotGeneratedAt === "string" &&
    Array.isArray(rawSnap.tasksBreakdown)
  ) {
    snapshot = {
      calculatedAt: rawSnap.calculatedAt ?? rawSnap.snapshotGeneratedAt,
      snapshotGeneratedAt: rawSnap.snapshotGeneratedAt,
      periodYear: rawSnap.periodYear ?? record.periodYear,
      periodMonth: rawSnap.periodMonth ?? record.periodMonth,
      totalAssignedTasks:
        rawSnap.totalAssignedTasks ?? record.totalTasksAssigned,
      completedTasks: rawSnap.completedTasks ?? record.totalTasksCompleted,
      datedCompletedTasks:
        rawSnap.datedCompletedTasks ?? record.totalTasksCompleted,
      onTimeCompletedTasks:
        rawSnap.onTimeCompletedTasks ?? record.tasksCompletedOnTime,
      taskCompletionRate:
        rawSnap.taskCompletionRate !== undefined
          ? rawSnap.taskCompletionRate
          : decimalToNumber(record.completionRate),
      onTimeDeliveryRate:
        rawSnap.onTimeDeliveryRate !== undefined
          ? rawSnap.onTimeDeliveryRate
          : decimalToNumber(record.onTimeRate),
      avgTaskRevisionCount:
        rawSnap.avgTaskRevisionCount !== undefined
          ? rawSnap.avgTaskRevisionCount
          : decimalToNumber(record.avgRevisionCount),
      designBriefsApproved: rawSnap.designBriefsApproved ?? 0,
      designQualityScore:
        rawSnap.designQualityScore !== undefined
          ? rawSnap.designQualityScore
          : decimalToNumber(record.designQualityScore),
      avgDesignRevisionCount:
        rawSnap.avgDesignRevisionCount !== undefined
          ? rawSnap.avgDesignRevisionCount
          : decimalToNumber(record.avgRevisionCount),
      firstPassApprovalRate: rawSnap.firstPassApprovalRate ?? null,
      contentDeliveredCount: rawSnap.contentDeliveredCount ?? 0,
      tasksBreakdown: rawSnap.tasksBreakdown,
      designBriefsBreakdown: Array.isArray(rawSnap.designBriefsBreakdown)
        ? rawSnap.designBriefsBreakdown
        : [],
      contentBreakdown: Array.isArray(rawSnap.contentBreakdown)
        ? rawSnap.contentBreakdown
        : [],
    };
  } else {
    const liveFallback = await computeUserMonthlyMetrics(
      record.userId,
      record.periodYear,
      record.periodMonth
    );
    snapshot = buildAutoMetricsSnapshot(liveFallback);
  }

  const mappedItems = record.items.map((item) => ({
    id: item.id,
    kpiAssignmentId: item.kpiAssignmentId,
    kpiTemplateId: item.kpiTemplateId,
    indicatorName: item.indicatorNameSnapshot,
    metricSource: item.metricSource as KpiMetricSource,
    weightPercent: decimalToNumber(item.weight) ?? 0,
    targetValue: decimalToNumber(item.targetValue) ?? 0,
    actualValue: decimalToNumber(item.actualValue),
    achievementScore: decimalToNumber(item.achievementPct),
    weightedScore: decimalToNumber(item.weightedScore),
    unit: item.kpiTemplate.unit,
    evidenceNotes: item.evidenceNotes,
  }));

  const weightedCalc = computeWeightedScoreAndGrade(
    mappedItems.map((i) => ({
      weight: i.weightPercent,
      achievementPct: i.achievementScore,
    }))
  );

  return {
    status: "OK",
    evaluation: {
      id: record.id,
      userId: record.userId,
      userName: record.user.fullName,
      userEmail: record.user.email,
      userAvatarUrl: record.user.avatarUrl,
      userJobTitle: record.user.jobTitle,
      userDepartment: record.user.department,
      userRole: evaluateeRole,
      evaluatorId: record.evaluatorId,
      evaluatorName: record.evaluator.fullName,
      periodYear: record.periodYear,
      periodMonth: record.periodMonth,
      periodMonthLabel: formatPeriodMonthLabel(
        record.periodYear,
        record.periodMonth
      ),
      status: record.status as EvaluationStatus,
      autoMetricsSnapshot: snapshot,
      items: mappedItems,
      activeWeightPercent: weightedCalc.activeWeightPercent,
      weightedKpiScore:
        decimalToNumber(record.weightedKpiScore) ?? weightedCalc.weightedKpiScore,
      grade: record.performanceGrade ?? weightedCalc.grade,
      selfAssessmentNotes: record.selfAssessmentNotes,
      evaluatorNotes: record.evaluatorNotes,
      submittedAt: record.submittedAt ? record.submittedAt.toISOString() : null,
      reviewedAt: record.reviewedAt ? record.reviewedAt.toISOString() : null,
      finalizedAt: record.finalizedAt ? record.finalizedAt.toISOString() : null,
      finalizedById: record.finalizedBy,
      finalizedByName: record.finalizer?.fullName ?? null,
      createdAt: record.createdAt.toISOString(),
      updatedAt: record.updatedAt.toISOString(),
    },
    permissions: {
      canEditScores,
      canResyncDraft,
      canSubmit,
      canMarkReviewed,
      canReturnToSubmitted,
      canFinalize,
      canReopen,
      isReadOnly,
    },
  };
}

export interface KpiDashboardFilterOptions {
  departments: string[];
  projects: Array<{ id: string; code: string; name: string }>;
  roles: Array<{ code: RoleCode; name: string }>;
}

export async function getKpiDashboardFilterOptions(): Promise<KpiDashboardFilterOptions> {
  const [users, projects, roles] = await Promise.all([
    prisma.user.findMany({
      where: { isActive: true, deletedAt: null },
      distinct: ["department"],
      orderBy: { department: "asc" },
      select: { department: true },
    }),
    prisma.project.findMany({
      where: { deletedAt: null, status: { not: "ARCHIVED" } },
      orderBy: { name: "asc" },
      select: { id: true, code: true, name: true },
    }),
    prisma.role.findMany({
      orderBy: { code: "asc" },
      select: { code: true, name: true },
    }),
  ]);

  return {
    departments: users.map((u) => u.department),
    projects,
    roles: roles.map((r) => ({ code: r.code as RoleCode, name: r.name })),
  };
}

export async function getInitialTeamDashboardData(
  periodRaw?: string,
  department?: string,
  projectId?: string
): Promise<{
  overview: TeamPerformanceOverviewDTO;
  filterOptions: KpiDashboardFilterOptions;
}> {
  const { year, month } = parsePeriodMonthString(periodRaw);
  const [overview, filterOptions] = await Promise.all([
    getTeamPerformanceOverview({
      year,
      month,
      department: department ?? null,
      projectId: sanitizeOptionalUuid(projectId) ?? null,
    }),
    getKpiDashboardFilterOptions(),
  ]);

  return { overview, filterOptions };
}
