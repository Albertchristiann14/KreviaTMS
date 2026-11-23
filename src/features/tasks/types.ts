import type {
  ContentStatus,
  DesignSubmissionStatus,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@/lib/constants/enums";

export type { TaskPriority, TaskStatus, TaskType };

export const PROJECT_STATUS_VALUES = [
  "PLANNING",
  "ACTIVE",
  "ON_HOLD",
  "COMPLETED",
  "ARCHIVED",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUS_VALUES)[number];

export const PROJECT_MEMBER_ROLE_VALUES = [
  "OWNER",
  "LEAD",
  "MEMBER",
  "VIEWER",
] as const;
export type ProjectMemberRole = (typeof PROJECT_MEMBER_ROLE_VALUES)[number];

export const ASSET_SOURCE_TYPE_VALUES = [
  "UPLOAD",
  "FIGMA",
  "CANVA",
  "GOOGLE_DRIVE",
  "OTHER_LINK",
] as const;
export type AssetSourceType = (typeof ASSET_SOURCE_TYPE_VALUES)[number];

export const KANBAN_COLUMN_STATUSES = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "REVISION",
  "DONE",
] as const satisfies readonly TaskStatus[];
export type KanbanColumnStatus = (typeof KANBAN_COLUMN_STATUSES)[number];

export type DeadlineHealth =
  | "OVERDUE"
  | "DUE_SOON"
  | "ON_TRACK"
  | "NO_DEADLINE"
  | "COMPLETED";

export interface UserAvatarMiniDto {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface AssigneeWorkloadOption {
  id: string;
  fullName: string;
  displayName: string | null;
  avatarUrl: string | null;
  jobTitle: string;
  roleCode: string;
  isActive: boolean;
  activeTaskCount: number;
  overdueTaskCount: number;
}

export interface ProjectLookupOption {
  id: string;
  code: string;
  name: string;
  colorHex: string;
  status: ProjectStatus;
  ownerId: string;
}

export interface ProjectMemberDto {
  id: string;
  userId: string;
  fullName: string;
  displayName: string | null;
  avatarUrl: string | null;
  jobTitle: string;
  department: string;
  roleCode: string;
  projectRole: ProjectMemberRole;
  joinedAt: string;
}

export interface ProjectSummaryDto {
  id: string;
  code: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  colorHex: string;
  ownerId: string;
  owner: UserAvatarMiniDto;
  startDate: string | null;
  targetEndDate: string | null;
  archivedAt: string | null;
  createdAt: string;
  totalTasks: number;
  activeTasks: number;
  doneTasks: number;
  cancelledTasks: number;
  overdueTasks: number;
  progressPct: number;
  memberCount: number;
  membersPreview: UserAvatarMiniDto[];
}

export interface TaskBoardCardDto {
  id: string;
  taskCode: string;
  projectId: string | null;
  project: {
    id: string;
    code: string;
    name: string;
    colorHex: string;
  } | null;
  title: string;
  description: string | null;
  taskType: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  version: number;
  requiresReview: boolean;
  assignee: (UserAvatarMiniDto & { name: string }) | null;
  reporter: UserAvatarMiniDto;
  reviewer: UserAvatarMiniDto | null;
  startDate: string | null;
  startedAt: string | null;
  firstSubmittedAt: string | null;
  dueDate: string | null;
  completedAt: string | null;
  isOnTime: boolean | null;
  revisionCount: number;
  estimatedHours: number | null;
  actualHours: number | null;
  tags: string[];
  isOverdue: boolean;
  deadlineHealth: DeadlineHealth;
  checklistTotal: number;
  checklistCompleted: number;
  commentCount: number;
  attachmentCount: number;
  linkedContentItemId: string | null;
  linkedDesignBriefId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetailDto extends ProjectSummaryDto {
  members: ProjectMemberDto[];
  statusBreakdown: Record<TaskStatus, number>;
  overdueTaskList: TaskBoardCardDto[];
  tasks: TaskBoardCardDto[];
}

export interface TaskChecklistItemDto {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  completedBy: string | null;
  completerName: string | null;
  completedAt: string | null;
  sortOrder: number;
}

export interface TaskCommentDto {
  id: string;
  taskId: string;
  authorId: string;
  author: UserAvatarMiniDto & { jobTitle: string };
  parentCommentId: string | null;
  body: string;
  mentionedUserIds: string[];
  createdAt: string;
  updatedAt: string;
  isEdited: boolean;
}

export interface TaskAttachmentDto {
  id: string;
  taskId: string;
  uploadedBy: string;
  uploaderName: string;
  sourceType: AssetSourceType;
  fileName: string;
  fileUrl: string;
  storageKey: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  createdAt: string;
}

export interface LinkedContentItemSummaryDto {
  id: string;
  title: string;
  status: ContentStatus;
  platform: string;
  contentFormat: string;
  plannedPublishAt: string | null;
}

export interface LinkedDesignBriefSummaryDto {
  id: string;
  title: string;
  status: DesignSubmissionStatus;
  revisionCount: number;
  currentVersion: number;
  dueDate: string | null;
}

export interface TaskDetailDto extends TaskBoardCardDto {
  checklists: TaskChecklistItemDto[];
  comments: TaskCommentDto[];
  attachments: TaskAttachmentDto[];
  linkedContentItem: LinkedContentItemSummaryDto | null;
  linkedDesignBrief: LinkedDesignBriefSummaryDto | null;
}

export interface TaskDetailPermissions {
  canEdit: boolean;
  canAssign: boolean;
  canApprove: boolean;
  canEditDueDate: boolean;
  canDelete: boolean;
  canComment: boolean;
  canToggleChecklist: boolean;
}

export interface TaskDetailApiResponse {
  task: TaskDetailDto;
  permissions: TaskDetailPermissions;
  formOptions?: {
    projects: ProjectLookupOption[];
    assignees: AssigneeWorkloadOption[];
  };
}

export interface KanbanBoardResponse {
  columns: Record<KanbanColumnStatus, TaskBoardCardDto[]>;
  counts: Record<KanbanColumnStatus, number>;
  totalCount: number;
}

export interface MyTasksGroupedData {
  overdue: TaskBoardCardDto[];
  today: TaskBoardCardDto[];
  upcoming: TaskBoardCardDto[];
  later: TaskBoardCardDto[];
  completed: TaskBoardCardDto[];
  cancelled: TaskBoardCardDto[];
  counts: {
    overdue: number;
    today: number;
    upcoming: number;
    later: number;
    completed: number;
    cancelled: number;
    activeTotal: number;
  };
}

export interface CalendarTaskDto {
  id: string;
  taskCode: string;
  title: string;
  taskType: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  version: number;
  startDate: string | null;
  dueDate: string | null;
  isOverdue: boolean;
  deadlineHealth: DeadlineHealth;
  project: {
    id: string;
    code: string;
    name: string;
    colorHex: string;
  } | null;
  assignee: UserAvatarMiniDto | null;
  linkedContentItemId: string | null;
  linkedDesignBriefId: string | null;
}

export interface CalendarContentOverlayDto {
  id: string;
  title: string;
  platform: string;
  contentFormat: string;
  status: ContentStatus;
  plannedPublishAt: string;
  creatorName: string;
  projectCode: string;
  projectColorHex: string;
}

export interface WorkCalendarResponse {
  tasks: CalendarTaskDto[];
  unscheduledTasks: CalendarTaskDto[];
  contentOverlays: CalendarContentOverlayDto[];
  range: {
    from: string;
    to: string;
  };
}
