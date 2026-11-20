import type {
  EmploymentStatus,
  EvaluationStatus,
  KpiCategory,
  KpiGrade,
  KpiMetricSource,
  KpiUnit,
} from "@prisma/client";
import type { RoleCode } from "@/lib/constants/permissions";

export type {
  EmploymentStatus,
  EvaluationStatus,
  KpiCategory,
  KpiGrade,
  KpiMetricSource,
  KpiUnit,
};

export interface PeriodWindow {
  year: number;
  month: number;
  periodMonth: string; // "YYYY-MM"
  start: Date;
  end: Date;
}

export interface TaskBreakdownItem {
  taskId: string;
  taskCode: string;
  title: string;
  projectId: string;
  projectName: string;
  projectCode: string;
  taskType: string;
  status: string;
  priority: string;
  dueDate: string | null;
  firstSubmittedAt: string | null;
  completedAt: string | null;
  effectiveCompletionTime: string | null;
  isOnTime: boolean | null;
  revisionCount: number;
}

export interface DesignBriefBreakdownItem {
  designBriefId: string;
  title: string;
  projectId: string;
  projectCode: string;
  approvedAt: string | null;
  revisionCount: number;
  briefDqs: number; // Math.max(40, 100 - 15 * revisionCount)
}

export interface ContentDeliveryBreakdownItem {
  contentItemId: string;
  title: string;
  platform: string;
  contentFormat: string;
  status: string;
  plannedPublishAt: string | null;
  publishedAt: string | null;
  effectiveDate: string | null;
}

export interface AutoMetricsSnapshot {
  calculatedAt: string;
  snapshotGeneratedAt: string;
  periodYear: number;
  periodMonth: number;
  totalAssignedTasks: number;
  completedTasks: number;
  datedCompletedTasks: number;
  onTimeCompletedTasks: number;
  taskCompletionRate: number | null; // AUTO_TCR
  onTimeDeliveryRate: number | null; // AUTO_OTDR
  avgTaskRevisionCount: number | null;
  designBriefsApproved: number;
  designQualityScore: number | null; // AUTO_DQS
  avgDesignRevisionCount: number | null;
  firstPassApprovalRate: number | null; // FPAR (%)
  contentDeliveredCount: number;
  tasksBreakdown: TaskBreakdownItem[];
  designBriefsBreakdown: DesignBriefBreakdownItem[];
  contentBreakdown: ContentDeliveryBreakdownItem[];
}

export interface UserMonthlyMetricsResult {
  userId: string;
  period: {
    year: number;
    month: number;
    periodMonth: string;
    startIso: string;
    endIso: string;
  };
  totalTasksAssigned: number;
  totalTasksCompleted: number;
  completedWithDue: number;
  tasksCompletedOnTime: number;
  completionRate: number | null; // AUTO_TCR
  onTimeRate: number | null; // AUTO_OTDR
  avgTaskRevisionCount: number | null;
  designBriefsApproved: number;
  designQualityScore: number | null; // AUTO_DQS
  avgDesignRevisionCount: number | null;
  avgRevisionCount: number | null;
  firstPassApprovalRate: number | null; // FPAR
  contentDeliveredCount: number;
  cpvsTargetValue: number | null;
  cpvsScore: number | null; // AUTO_CPVS
  tasksBreakdown: TaskBreakdownItem[];
  designBriefsBreakdown: DesignBriefBreakdownItem[];
  contentBreakdown: ContentDeliveryBreakdownItem[];
}

export interface WeightedScoreResult {
  activeWeightPercent: number;
  totalWeightPercent: number;
  weightedKpiScore: number;
  grade: KpiGrade;
}

export interface MonthlyTrendPoint {
  periodYear: number;
  periodMonth: number;
  periodKey: string; // "YYYY-MM"
  label: string; // e.g. "Nov 2026"
  tcr: number | null;
  otdr: number | null;
  dqs: number | null;
  cpvs: number | null;
  weightedKpiScore: number | null;
  isFinalized: boolean;
}

export interface EvaluationMetricItemDTO {
  id: string;
  kpiAssignmentId: string | null;
  kpiTemplateId: string;
  indicatorName: string;
  metricSource: KpiMetricSource;
  weightPercent: number;
  targetValue: number;
  actualValue: number | null;
  achievementScore: number | null;
  weightedScore: number | null;
  unit: KpiUnit;
  evidenceNotes: string | null;
}

export interface MonthlyEvaluationDTO {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  userJobTitle: string;
  userDepartment: string;
  userRole: RoleCode;
  evaluatorId: string;
  evaluatorName: string;
  periodYear: number;
  periodMonth: number;
  periodMonthLabel: string; // "YYYY-MM"
  status: EvaluationStatus;
  autoMetricsSnapshot: AutoMetricsSnapshot;
  items: EvaluationMetricItemDTO[];
  activeWeightPercent: number;
  weightedKpiScore: number;
  grade: KpiGrade;
  selfAssessmentNotes: string | null;
  evaluatorNotes: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
  finalizedAt: string | null;
  finalizedById: string | null;
  finalizedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TeamDirectoryMemberDTO {
  id: string;
  fullName: string;
  displayName: string | null;
  email: string;
  avatarUrl: string | null;
  jobTitle: string;
  department: string;
  phone: string | null;
  skills: string[];
  employmentStatus: EmploymentStatus;
  joinedAt: string | null;
  isActive: boolean;
  roleId: string;
  roleCode: RoleCode;
  roleName: string;
  activeTasksCount: number | null; // null when viewer lacks kpi:performance:read_team
  overdueTasksCount: number | null;
  activeProjectsCount: number;
}

export interface TeamLeaderboardRowDTO {
  userId: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  jobTitle: string;
  department: string;
  roleCode: RoleCode;
  tasksAssigned: number;
  tasksCompleted: number;
  tasksOnTime: number;
  activeTasksCount: number;
  overdueTasksCount: number;
  todoCount: number;
  inProgressCount: number;
  inReviewCount: number;
  revisionCount: number;
  tcr: number | null;
  otdr: number | null;
  dqs: number | null;
  cpvs: number | null;
  contentDeliveredCount: number;
  weightedKpiScore: number;
  grade: KpiGrade;
  evaluationId: string | null;
  evaluationStatus: EvaluationStatus | null;
  isFinalizedSnapshot: boolean;
}

export interface TeamDashboardSummaryDTO {
  avgTcr: number | null;
  avgOtdr: number | null;
  totalTasksAssigned: number;
  totalTasksCompleted: number;
  totalTasksOverdue: number;
  avgDqs: number | null;
  totalContentPublished: number;
  totalActiveMembers: number;
  finalizedEvaluationsCount: number;
}

export interface WorkloadDistributionPoint {
  userId: string;
  name: string;
  shortName: string;
  department: string;
  todo: number;
  inProgress: number;
  inReview: number;
  revision: number;
  totalActive: number;
  overdue: number;
}

export interface TeamPerformanceOverviewDTO {
  period: {
    year: number;
    month: number;
    periodMonth: string;
  };
  filters: {
    department: string | null;
    projectId: string | null;
  };
  summary: TeamDashboardSummaryDTO;
  leaderboard: TeamLeaderboardRowDTO[];
  workloadDistribution: WorkloadDistributionPoint[];
  sixMonthTrend: MonthlyTrendPoint[];
}

export interface KpiTemplateDTO {
  id: string;
  code: string;
  name: string;
  description: string | null;
  category: KpiCategory;
  applicableRoleId: string | null;
  applicableRoleCode: RoleCode | null;
  applicableRoleName: string | null;
  metricSource: KpiMetricSource;
  unit: KpiUnit;
  defaultTargetValue: number;
  defaultWeight: number;
  isHigherBetter: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KpiAssignmentDTO {
  id: string;
  userId: string;
  kpiTemplateId: string;
  templateCode: string;
  templateName: string;
  metricSource: KpiMetricSource;
  unit: KpiUnit;
  category: KpiCategory;
  periodYear: number;
  periodMonth: number;
  targetValue: number;
  weight: number;
}

export interface EvaluationListRowDTO {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatarUrl: string | null;
  userDepartment: string;
  userJobTitle: string;
  userRole: RoleCode;
  evaluatorId: string;
  evaluatorName: string;
  periodYear: number;
  periodMonth: number;
  periodMonthLabel: string;
  status: EvaluationStatus;
  completionRate: number | null;
  onTimeRate: number | null;
  designQualityScore: number | null;
  weightedKpiScore: number | null;
  performanceGrade: KpiGrade | null;
  finalizedAt: string | null;
  updatedAt: string;
  isMaskedForEmployee: boolean;
}
