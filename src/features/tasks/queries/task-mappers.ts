import "server-only";
import { Prisma, TaskStatus } from "@prisma/client";
import { hasAnyPermission, PERMISSIONS } from "@/lib/constants/permissions";
import type { AuthContext } from "@/server/auth/rbac";
import type { TaskBoardCardDto } from "@/features/tasks/types";
import { computeDeadlineHealth } from "@/features/tasks/utils/date-wib";

export const TASK_BOARD_CARD_SELECT = {
  id: true,
  taskCode: true,
  projectId: true,
  title: true,
  description: true,
  taskType: true,
  status: true,
  priority: true,
  position: true,
  version: true,
  requiresReview: true,
  startDate: true,
  startedAt: true,
  firstSubmittedAt: true,
  dueDate: true,
  completedAt: true,
  isOnTime: true,
  revisionCount: true,
  estimatedHours: true,
  actualHours: true,
  tags: true,
  contentItemId: true,
  designBriefId: true,
  createdAt: true,
  updatedAt: true,
  project: {
    select: {
      id: true,
      code: true,
      name: true,
      colorHex: true,
    },
  },
  assignee: {
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
    },
  },
  reporter: {
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
    },
  },
  reviewer: {
    select: {
      id: true,
      fullName: true,
      avatarUrl: true,
    },
  },
  checklists: {
    select: {
      isCompleted: true,
    },
  },
  _count: {
    select: {
      comments: {
        where: { deletedAt: null },
      },
      attachments: {
        where: { deletedAt: null },
      },
    },
  },
} as const satisfies Prisma.TaskSelect;

export type TaskBoardRow = Prisma.TaskGetPayload<{
  select: typeof TASK_BOARD_CARD_SELECT;
}>;

export function mapTaskRowToBoardCardDto(
  row: TaskBoardRow,
  now: Date = new Date()
): TaskBoardCardDto {
  const { isOverdue, deadlineHealth } = computeDeadlineHealth(
    row.status,
    row.dueDate,
    now
  );

  const checklistTotal = row.checklists.length;
  let checklistCompleted = 0;
  for (const item of row.checklists) {
    if (item.isCompleted) checklistCompleted += 1;
  }

  return {
    id: row.id,
    taskCode: row.taskCode,
    projectId: row.projectId,
    project: {
      id: row.project.id,
      code: row.project.code,
      name: row.project.name,
      colorHex: row.project.colorHex,
    },
    title: row.title,
    description: row.description,
    taskType: row.taskType,
    status: row.status,
    priority: row.priority,
    position: row.position,
    version: row.version,
    requiresReview: row.requiresReview,
    assignee: row.assignee
      ? {
          id: row.assignee.id,
          name: row.assignee.fullName,
          fullName: row.assignee.fullName,
          avatarUrl: row.assignee.avatarUrl,
        }
      : null,
    reporter: {
      id: row.reporter.id,
      fullName: row.reporter.fullName,
      avatarUrl: row.reporter.avatarUrl,
    },
    reviewer: row.reviewer
      ? {
          id: row.reviewer.id,
          fullName: row.reviewer.fullName,
          avatarUrl: row.reviewer.avatarUrl,
        }
      : null,
    startDate: row.startDate ? row.startDate.toISOString().slice(0, 10) : null,
    startedAt: row.startedAt ? row.startedAt.toISOString() : null,
    firstSubmittedAt: row.firstSubmittedAt
      ? row.firstSubmittedAt.toISOString()
      : null,
    dueDate: row.dueDate ? row.dueDate.toISOString() : null,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    isOnTime: row.isOnTime,
    revisionCount: row.revisionCount,
    estimatedHours:
      row.estimatedHours !== null ? Number(row.estimatedHours) : null,
    actualHours: row.actualHours !== null ? Number(row.actualHours) : null,
    tags: row.tags,
    isOverdue,
    deadlineHealth,
    checklistTotal,
    checklistCompleted,
    commentCount: row._count.comments,
    attachmentCount: row._count.attachments,
    linkedContentItemId: row.contentItemId,
    linkedDesignBriefId: row.designBriefId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function canViewAllProjects(ctx: AuthContext): boolean {
  return hasAnyPermission(
    ctx.permissions,
    [
      PERMISSIONS.TASKS_PROJECT_CREATE,
      PERMISSIONS.TASKS_PROJECT_UPDATE,
      PERMISSIONS.TASKS_ITEM_ASSIGN,
    ],
    ctx.roleCode
  );
}

export function canViewAllTasks(ctx: AuthContext): boolean {
  return hasAnyPermission(
    ctx.permissions,
    [PERMISSIONS.TASKS_ITEM_ASSIGN, PERMISSIONS.TASKS_ITEM_APPROVE],
    ctx.roleCode
  );
}

export function buildTaskScopeWhere(ctx: AuthContext): Prisma.TaskWhereInput {
  if (canViewAllTasks(ctx)) {
    return {
      deletedAt: null,
      project: { deletedAt: null },
    };
  }

  return {
    deletedAt: null,
    project: { deletedAt: null },
    OR: [
      { assigneeId: ctx.userId },
      { reporterId: ctx.userId },
      { reviewerId: ctx.userId },
      { project: { ownerId: ctx.userId } },
      { project: { members: { some: { userId: ctx.userId } } } },
    ],
  };
}

export function createEmptyStatusBreakdown(): Record<TaskStatus, number> {
  return {
    BACKLOG: 0,
    TODO: 0,
    IN_PROGRESS: 0,
    IN_REVIEW: 0,
    REVISION: 0,
    DONE: 0,
    CANCELLED: 0,
  };
}
