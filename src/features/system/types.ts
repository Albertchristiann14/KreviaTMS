import type {
  AnnouncementPriority,
  ContentFormat,
  ContentStatus,
  DesignSubmissionStatus,
  EmploymentStatus,
  NotificationType as PrismaNotificationType,
  ProjectStatus,
  SocialPlatform,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@prisma/client";
import type { PermissionCode, RoleCode } from "@/lib/constants/permissions";

export type NotificationType = PrismaNotificationType;

export type AuditModule = "TASKS" | "TEAM_KPI" | "SOCIAL_DESIGN" | "SYSTEM";

export interface PublishAnnouncementInput {
  title: string;
  bodyMarkdown: string;
  priority: AnnouncementPriority;
  isPinned: boolean;
  targetRoles: RoleCode[];
  expiresAt?: string | null;
}

export interface UnreadNotificationsResponse {
  unreadCount: number;
  items: Array<{
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    actionUrl: string;
    isRead: boolean;
    createdAt: string;
  }>;
}

export interface ActivityLogsQueryResponse {
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  items: Array<{
    id: string;
    actor: { id: string; name: string; role: string } | null;
    module: AuditModule;
    action: string;
    entityType: string;
    entityId: string | null;
    summary: string;
    oldValues: Record<string, unknown> | null;
    newValues: Record<string, unknown> | null;
    ipAddress?: string | null;
    userAgent?: string | null;
    createdAt: string;
  }>;
}

export interface RoleOptionDTO {
  id: string;
  code: RoleCode;
  name: string;
  description: string | null;
  isSystem: boolean;
}

export interface ManagerOptionDTO {
  id: string;
  fullName: string;
  jobTitle: string;
  roleCode: RoleCode;
}

export interface ActiveTaskBriefDTO {
  id: string;
  taskCode: string;
  title: string;
  status: TaskStatus;
}

export interface SystemUserRowDTO {
  id: string;
  email: string;
  fullName: string;
  displayName: string | null;
  avatarUrl: string | null;
  jobTitle: string;
  department: string;
  phone: string | null;
  employmentStatus: EmploymentStatus;
  isActive: boolean;
  mustChangePassword: boolean;
  tokenVersion: number;
  lastLoginAt: string | null;
  createdAt: string;
  role: {
    id: string;
    code: RoleCode;
    name: string;
  };
  manager: {
    id: string;
    fullName: string;
  } | null;
  activeTaskCount: number;
}

export interface UsersManagementPageData {
  users: SystemUserRowDTO[];
  roles: RoleOptionDTO[];
  managers: ManagerOptionDTO[];
  summary: {
    total: number;
    active: number;
    inactive: number;
    mustChangePasswordCount: number;
  };
}

export interface RbacPermissionDTO {
  id: string;
  code: PermissionCode;
  module: string;
  resource: string;
  action: string;
  description: string | null;
}

export interface RbacRoleColumnDTO {
  id: string;
  code: RoleCode;
  name: string;
  description: string | null;
  isSystem: boolean;
  activeUserCount: number;
  permissionCodes: PermissionCode[];
}

export interface RbacMatrixData {
  roles: RbacRoleColumnDTO[];
  permissions: RbacPermissionDTO[];
}

export interface AnnouncementReaderDTO {
  userId: string;
  fullName: string;
  avatarUrl: string | null;
  roleCode: RoleCode;
  readAt: string;
}

export interface AnnouncementUnreadUserDTO {
  userId: string;
  fullName: string;
  roleCode: RoleCode;
}

export interface AnnouncementItemDTO {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  targetRoleIds: string[];
  targetRoleCodes: RoleCode[];
  isPinned: boolean;
  publishedAt: string;
  expiresAt: string | null;
  createdAt: string;
  deletedAt: string | null;
  isExpired: boolean;
  author: {
    id: string;
    fullName: string;
    roleCode: RoleCode;
  };
  readCount: number;
  totalTargetUsers: number;
  isReadByCurrentUser: boolean;
  readers: AnnouncementReaderDTO[];
  unreadUsers: AnnouncementUnreadUserDTO[];
}

export interface AnnouncementsFeedData {
  active: AnnouncementItemDTO[];
  archived: AnnouncementItemDTO[];
  activePinnedCount: number;
  roles: RoleOptionDTO[];
  canManage: boolean;
}

export interface NotificationFeedItemDTO {
  id: string;
  type: NotificationType;
  moduleCategory: AuditModule;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  actionUrl: string;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  actor: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  } | null;
}

export interface ActivityLogActorOptionDTO {
  id: string;
  fullName: string;
  roleCode: RoleCode;
}

export interface ActivityLogRowDTO {
  id: string;
  actor: {
    id: string;
    name: string;
    role: string;
  } | null;
  module: AuditModule;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface ActivityLogsPageResult {
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  items: ActivityLogRowDTO[];
}

export interface OverviewTaskItemDTO {
  id: string;
  taskCode: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  taskType: TaskType;
  dueDate: string | null;
  isOverdue: boolean;
  project: {
    id: string;
    code: string;
    name: string;
    colorHex: string;
  };
}

export interface OverviewProjectProgressDTO {
  id: string;
  code: string;
  name: string;
  colorHex: string;
  status: ProjectStatus;
  totalTasks: number;
  doneTasks: number;
  progressPct: number;
  targetEndDate: string | null;
}

export interface OverviewContentItemDTO {
  id: string;
  title: string;
  platform: SocialPlatform;
  contentFormat: ContentFormat;
  status: ContentStatus;
  plannedPublishAt: string | null;
  creatorName: string;
  projectName: string;
}

export interface OverviewDesignItemDTO {
  id: string;
  title: string;
  status: DesignSubmissionStatus;
  dueDate: string | null;
  currentVersion: number;
  revisionCount: number;
  projectName: string;
  designerName: string | null;
  requesterName: string;
}

export interface OverviewAnnouncementDTO {
  id: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  isPinned: boolean;
  publishedAt: string;
  expiresAt: string | null;
  authorName: string;
  isRead: boolean;
}

export interface OverviewDashboardData {
  taskSummary: {
    openCount: number;
    dueSoonCount: number;
    overdueCount: number;
    completedThisMonthCount: number;
  };
  myTasks: OverviewTaskItemDTO[];
  activeProjects: OverviewProjectProgressDTO[];
  upcomingContent: OverviewContentItemDTO[];
  designQueue: OverviewDesignItemDTO[];
  recentAnnouncements: OverviewAnnouncementDTO[];
  unreadNotificationCount: number;
  managementSnapshot: {
    activeTeamCount: number;
    pendingDesignReviewsCount: number;
    pendingEvaluationsCount: number;
    teamOverdueTasksCount: number;
  } | null;
}
