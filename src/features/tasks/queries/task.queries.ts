import "server-only";
import { Prisma, TaskPriority, TaskStatus, TaskType } from "@prisma/client";
import { z } from "zod";
import { hasAnyPermission, hasPermission, PERMISSIONS } from "@/lib/constants/permissions";
import type { AuthContext } from "@/server/auth/rbac";
import { prisma } from "@/server/db/prisma";
import {
  KANBAN_COLUMN_STATUSES,
  type CalendarContentOverlayDto,
  type CalendarTaskDto,
  type KanbanBoardResponse,
  type KanbanColumnStatus,
  type MyTasksGroupedData,
  type TaskBoardCardDto,
  type TaskDetailApiResponse,
} from "@/features/tasks/types";
import {
  buildTaskScopeWhere,
  canViewAllTasks,
  mapTaskRowToBoardCardDto,
  TASK_BOARD_CARD_SELECT,
} from "@/features/tasks/queries/task-mappers";
import { computeDeadlineHealth, diffWibDays } from "@/features/tasks/utils/date-wib";

const uuidSchema = z.string().uuid();

export interface TaskFilterParams {
  projectId?: string | null;
  assigneeId?: string | null;
  status?: string | null;
  priority?: string | null;
  taskType?: string | null;
  q?: string | null;
  overdueOnly?: boolean;
  includeCancelled?: boolean;
}

function applyCommonTaskFilters(
  baseWhere: Prisma.TaskWhereInput,
  filters?: TaskFilterParams,
  now: Date = new Date()
): Prisma.TaskWhereInput {
  const andConditions: Prisma.TaskWhereInput[] = [baseWhere];

  if (filters?.projectId && uuidSchema.safeParse(filters.projectId).success) {
    andConditions.push({ projectId: filters.projectId });
  }

  if (filters?.assigneeId) {
    if (filters.assigneeId === "UNASSIGNED") {
      andConditions.push({ assigneeId: null });
    } else if (uuidSchema.safeParse(filters.assigneeId).success) {
      andConditions.push({ assigneeId: filters.assigneeId });
    }
  }

  if (
    filters?.status &&
    filters.status !== "ALL" &&
    Object.values(TaskStatus).includes(filters.status as TaskStatus)
  ) {
    andConditions.push({ status: filters.status as TaskStatus });
  }

  if (
    filters?.priority &&
    filters.priority !== "ALL" &&
    Object.values(TaskPriority).includes(filters.priority as TaskPriority)
  ) {
    andConditions.push({ priority: filters.priority as TaskPriority });
  }

  if (
    filters?.taskType &&
    filters.taskType !== "ALL" &&
    Object.values(TaskType).includes(filters.taskType as TaskType)
  ) {
    andConditions.push({ taskType: filters.taskType as TaskType });
  }

  const search = filters?.q?.trim();
  if (search) {
    andConditions.push({
      OR: [
        { title: { contains: search, mode: "insensitive" } },
        { taskCode: { contains: search, mode: "insensitive" } },
        { project: { name: { contains: search, mode: "insensitive" } } },
        { project: { code: { contains: search, mode: "insensitive" } } },
      ],
    });
  }

  if (filters?.overdueOnly) {
    const dueSoonCutoff = new Date(now.getTime() + 48 * 3_600_000);
    andConditions.push({
      status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
      dueDate: { not: null, lte: dueSoonCutoff },
    });
  }

  return andConditions.length === 1
    ? andConditions[0]!
    : { AND: andConditions };
}

/**
 * Fetches personal tasks (`assigneeId = current_user.id`) grouped by urgency in WIB (FR-A02).
 */
export async function getMyTasksForUser(
  ctx: AuthContext,
  filters?: TaskFilterParams
): Promise<MyTasksGroupedData> {
  const now = new Date();
  const baseWhere: Prisma.TaskWhereInput = {
    deletedAt: null,
    assigneeId: ctx.userId,
    project: { deletedAt: null },
  };

  // Hide CANCELLED unless explicitly requested in filter
  if (filters?.status !== TaskStatus.CANCELLED) {
    baseWhere.status = { not: TaskStatus.CANCELLED };
  }

  const where = applyCommonTaskFilters(baseWhere, filters, now);

  const rows = await prisma.task.findMany({
    where,
    orderBy: [{ dueDate: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
    select: TASK_BOARD_CARD_SELECT,
  });

  const overdue: TaskBoardCardDto[] = [];
  const today: TaskBoardCardDto[] = [];
  const upcoming: TaskBoardCardDto[] = [];
  const later: TaskBoardCardDto[] = [];
  const completed: TaskBoardCardDto[] = [];
  const cancelled: TaskBoardCardDto[] = [];

  const thirtyDaysAgoMs = now.getTime() - 30 * 86_400_000;

  for (const row of rows) {
    const card = mapTaskRowToBoardCardDto(row, now);
    if (row.status === TaskStatus.CANCELLED) {
      cancelled.push(card);
      continue;
    }

    if (row.status === TaskStatus.DONE) {
      const doneTime = row.completedAt?.getTime() ?? row.updatedAt.getTime();
      if (
        filters?.status === TaskStatus.DONE ||
        doneTime >= thirtyDaysAgoMs
      ) {
        completed.push(card);
      }
      continue;
    }

    if (!row.dueDate) {
      later.push(card);
      continue;
    }

    if (row.dueDate.getTime() < now.getTime()) {
      overdue.push(card);
      continue;
    }

    const dayDiff = diffWibDays(row.dueDate, now);
    if (dayDiff <= 0) {
      today.push(card);
    } else if (dayDiff <= 7) {
      upcoming.push(card);
    } else {
      later.push(card);
    }
  }

  return {
    overdue,
    today,
    upcoming,
    later,
    completed,
    cancelled,
    counts: {
      overdue: overdue.length,
      today: today.length,
      upcoming: upcoming.length,
      later: later.length,
      completed: completed.length,
      cancelled: cancelled.length,
      activeTotal:
        overdue.length + today.length + upcoming.length + later.length,
    },
  };
}

/**
 * Fetches Kanban board columns (`BACKLOG` .. `DONE`) sorted by fractional `position` (FR-A03).
 */
export async function getKanbanBoardData(
  ctx: AuthContext,
  filters?: TaskFilterParams
): Promise<KanbanBoardResponse> {
  const now = new Date();
  const scopeWhere = buildTaskScopeWhere(ctx);
  const baseWhere: Prisma.TaskWhereInput = filters?.includeCancelled
    ? scopeWhere
    : {
        AND: [scopeWhere, { status: { not: TaskStatus.CANCELLED } }],
      };

  const where = applyCommonTaskFilters(baseWhere, filters, now);

  const rows = await prisma.task.findMany({
    where,
    orderBy: [{ position: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    select: TASK_BOARD_CARD_SELECT,
  });

  const columns: Record<KanbanColumnStatus, TaskBoardCardDto[]> = {
    BACKLOG: [],
    TODO: [],
    IN_PROGRESS: [],
    IN_REVIEW: [],
    REVISION: [],
    DONE: [],
  };

  for (const row of rows) {
    if (row.status === TaskStatus.CANCELLED) continue;
    const colKey = row.status as KanbanColumnStatus;
    columns[colKey].push(mapTaskRowToBoardCardDto(row, now));
  }

  const counts: Record<KanbanColumnStatus, number> = {
    BACKLOG: columns.BACKLOG.length,
    TODO: columns.TODO.length,
    IN_PROGRESS: columns.IN_PROGRESS.length,
    IN_REVIEW: columns.IN_REVIEW.length,
    REVISION: columns.REVISION.length,
    DONE: columns.DONE.length,
  };

  let totalCount = 0;
  for (const status of KANBAN_COLUMN_STATUSES) {
    totalCount += counts[status];
  }

  return {
    columns,
    counts,
    totalCount,
  };
}

/**
 * Fetches date-range tasks, unscheduled tasks, and optional Content Calendar overlay (FR-A04).
 */
export async function getWorkCalendarTasks(
  ctx: AuthContext,
  filters: TaskFilterParams & {
    from: Date;
    to: Date;
    includeContentOverlay?: boolean;
  }
): Promise<{
  tasks: CalendarTaskDto[];
  unscheduledTasks: CalendarTaskDto[];
  contentOverlays: CalendarContentOverlayDto[];
}> {
  const now = new Date();
  const scopeWhere = buildTaskScopeWhere(ctx);
  const filteredBase = applyCommonTaskFilters(
    {
      AND: [scopeWhere, { status: { not: TaskStatus.CANCELLED } }],
    },
    filters,
    now
  );

  const [scheduledRows, unscheduledRows, contentRows] = await Promise.all([
    prisma.task.findMany({
      where: {
        AND: [
          filteredBase,
          {
            OR: [
              {
                dueDate: {
                  gte: filters.from,
                  lte: filters.to,
                },
              },
              {
                AND: [
                  { startDate: { lte: filters.to } },
                  { dueDate: { gte: filters.from } },
                ],
              },
            ],
          },
        ],
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }],
      select: {
        id: true,
        taskCode: true,
        title: true,
        taskType: true,
        status: true,
        priority: true,
        version: true,
        startDate: true,
        dueDate: true,
        contentItemId: true,
        designBriefId: true,
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
      },
    }),
    prisma.task.findMany({
      where: {
        AND: [
          filteredBase,
          {
            dueDate: null,
            status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
          },
        ],
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 25,
      select: {
        id: true,
        taskCode: true,
        title: true,
        taskType: true,
        status: true,
        priority: true,
        version: true,
        startDate: true,
        dueDate: true,
        contentItemId: true,
        designBriefId: true,
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
      },
    }),
    filters.includeContentOverlay
      ? prisma.contentItem.findMany({
          where: {
            deletedAt: null,
            plannedPublishAt: {
              gte: filters.from,
              lte: filters.to,
            },
            project: { deletedAt: null },
            ...(filters.projectId &&
            uuidSchema.safeParse(filters.projectId).success
              ? { projectId: filters.projectId }
              : {}),
            ...(canViewAllTasks(ctx)
              ? {}
              : {
                  OR: [
                    { creatorId: ctx.userId },
                    { project: { ownerId: ctx.userId } },
                    { project: { members: { some: { userId: ctx.userId } } } },
                  ],
                }),
          },
          orderBy: { plannedPublishAt: "asc" },
          select: {
            id: true,
            title: true,
            platform: true,
            contentFormat: true,
            status: true,
            plannedPublishAt: true,
            creator: { select: { fullName: true } },
            project: { select: { code: true, colorHex: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  const mapCalendarTask = (row: (typeof scheduledRows)[number]): CalendarTaskDto => {
    const { isOverdue, deadlineHealth } = computeDeadlineHealth(
      row.status,
      row.dueDate,
      now
    );

    return {
      id: row.id,
      taskCode: row.taskCode,
      title: row.title,
      taskType: row.taskType,
      status: row.status,
      priority: row.priority,
      version: row.version,
      startDate: row.startDate ? row.startDate.toISOString().slice(0, 10) : null,
      dueDate: row.dueDate ? row.dueDate.toISOString() : null,
      isOverdue,
      deadlineHealth,
      project: row.project,
      assignee: row.assignee,
      linkedContentItemId: row.contentItemId,
      linkedDesignBriefId: row.designBriefId,
    };
  };

  const contentOverlays: CalendarContentOverlayDto[] = [];
  for (const item of contentRows) {
    if (!item.plannedPublishAt) continue;
    contentOverlays.push({
      id: item.id,
      title: item.title,
      platform: item.platform,
      contentFormat: item.contentFormat,
      status: item.status,
      plannedPublishAt: item.plannedPublishAt.toISOString(),
      creatorName: item.creator.fullName,
      projectCode: item.project.code,
      projectColorHex: item.project.colorHex,
    });
  }

  return {
    tasks: scheduledRows.map(mapCalendarTask),
    unscheduledTasks: unscheduledRows.map(mapCalendarTask),
    contentOverlays,
  };
}

/**
 * Fetches full task detail with checklists, comments, attachments, linked Modul C items,
 * and caller-scoped action permissions for `/api/tasks/[taskId]` & `GlobalSlideOverHost`.
 */
export async function getTaskDetailById(
  ctx: AuthContext,
  taskId: string
): Promise<TaskDetailApiResponse | null> {
  if (!uuidSchema.safeParse(taskId).success) {
    return null;
  }

  const now = new Date();
  const row = await prisma.task.findFirst({
    where: {
      id: taskId,
      deletedAt: null,
      project: { deletedAt: null },
    },
    select: {
      ...TASK_BOARD_CARD_SELECT,
      project: {
        select: {
          id: true,
          code: true,
          name: true,
          colorHex: true,
          ownerId: true,
          members: {
            where: { userId: ctx.userId },
            select: { userId: true },
          },
        },
      },
      checklists: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          taskId: true,
          title: true,
          isCompleted: true,
          completedBy: true,
          completedAt: true,
          sortOrder: true,
          completer: {
            select: { fullName: true },
          },
        },
      },
      comments: {
        where: { deletedAt: null },
        orderBy: [{ createdAt: "asc" }],
        select: {
          id: true,
          taskId: true,
          authorId: true,
          parentCommentId: true,
          body: true,
          mentionedUserIds: true,
          createdAt: true,
          updatedAt: true,
          author: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
              jobTitle: true,
            },
          },
        },
      },
      attachments: {
        where: { deletedAt: null },
        orderBy: [{ createdAt: "desc" }],
        select: {
          id: true,
          taskId: true,
          uploadedBy: true,
          sourceType: true,
          fileName: true,
          fileUrl: true,
          storageKey: true,
          mimeType: true,
          fileSizeBytes: true,
          createdAt: true,
          uploader: {
            select: { fullName: true },
          },
        },
      },
      contentItem: {
        select: {
          id: true,
          title: true,
          status: true,
          platform: true,
          contentFormat: true,
          plannedPublishAt: true,
        },
      },
      designBrief: {
        select: {
          id: true,
          title: true,
          status: true,
          revisionCount: true,
          currentVersion: true,
          dueDate: true,
        },
      },
    },
  });

  if (!row) return null;

  const isMemberOrParticipant =
    row.assignee?.id === ctx.userId ||
    row.reporter.id === ctx.userId ||
    row.reviewer?.id === ctx.userId ||
    row.project.ownerId === ctx.userId ||
    row.project.members.length > 0;

  if (!canViewAllTasks(ctx) && !isMemberOrParticipant) {
    return null;
  }

  const baseCard = mapTaskRowToBoardCardDto(
    {
      ...row,
      checklists: row.checklists.map((c) => ({ isCompleted: c.isCompleted })),
    },
    now
  );

  const canAssign = hasPermission(
    ctx.permissions,
    PERMISSIONS.TASKS_ITEM_ASSIGN,
    ctx.roleCode
  );
  const canApprove = hasPermission(
    ctx.permissions,
    PERMISSIONS.TASKS_ITEM_APPROVE,
    ctx.roleCode
  );
  const canUpdateBase = hasPermission(
    ctx.permissions,
    PERMISSIONS.TASKS_ITEM_UPDATE,
    ctx.roleCode
  );
  const isAssigneeOrReporter =
    row.assignee?.id === ctx.userId || row.reporter.id === ctx.userId;
  const canEdit =
    canUpdateBase &&
    (canAssign || canApprove || isAssigneeOrReporter || row.project.ownerId === ctx.userId);
  const canEditDueDate =
    canUpdateBase &&
    (hasAnyPermission(
      ctx.permissions,
      [PERMISSIONS.TASKS_ITEM_ASSIGN, PERMISSIONS.TASKS_ITEM_APPROVE],
      ctx.roleCode
    ) ||
      row.reporter.id === ctx.userId);
  const canDelete = hasPermission(
    ctx.permissions,
    PERMISSIONS.TASKS_ITEM_DELETE,
    ctx.roleCode
  );
  const canComment = hasPermission(
    ctx.permissions,
    PERMISSIONS.TASKS_COMMENT_CREATE,
    ctx.roleCode
  );

  return {
    task: {
      ...baseCard,
      checklists: row.checklists.map((c) => ({
        id: c.id,
        taskId: c.taskId,
        title: c.title,
        isCompleted: c.isCompleted,
        completedBy: c.completedBy,
        completerName: c.completer?.fullName ?? null,
        completedAt: c.completedAt ? c.completedAt.toISOString() : null,
        sortOrder: c.sortOrder,
      })),
      comments: row.comments.map((c) => ({
        id: c.id,
        taskId: c.taskId,
        authorId: c.authorId,
        author: c.author,
        parentCommentId: c.parentCommentId,
        body: c.body,
        mentionedUserIds: c.mentionedUserIds,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        isEdited: c.updatedAt.getTime() - c.createdAt.getTime() > 1500,
      })),
      attachments: row.attachments.map((a) => ({
        id: a.id,
        taskId: a.taskId,
        uploadedBy: a.uploadedBy,
        uploaderName: a.uploader.fullName,
        sourceType: a.sourceType,
        fileName: a.fileName,
        fileUrl: a.fileUrl,
        storageKey: a.storageKey,
        mimeType: a.mimeType,
        fileSizeBytes: a.fileSizeBytes !== null ? Number(a.fileSizeBytes) : null,
        createdAt: a.createdAt.toISOString(),
      })),
      linkedContentItem: row.contentItem
        ? {
            id: row.contentItem.id,
            title: row.contentItem.title,
            status: row.contentItem.status,
            platform: row.contentItem.platform,
            contentFormat: row.contentItem.contentFormat,
            plannedPublishAt: row.contentItem.plannedPublishAt
              ? row.contentItem.plannedPublishAt.toISOString()
              : null,
          }
        : null,
      linkedDesignBrief: row.designBrief
        ? {
            id: row.designBrief.id,
            title: row.designBrief.title,
            status: row.designBrief.status,
            revisionCount: row.designBrief.revisionCount,
            currentVersion: row.designBrief.currentVersion,
            dueDate: row.designBrief.dueDate
              ? row.designBrief.dueDate.toISOString()
              : null,
          }
        : null,
    },
    permissions: {
      canEdit,
      canAssign,
      canApprove,
      canEditDueDate,
      canDelete,
      canComment,
      canToggleChecklist: canEdit,
    },
  };
}
