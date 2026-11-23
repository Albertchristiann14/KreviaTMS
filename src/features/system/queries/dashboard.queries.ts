import { cache } from "react";
import {
  ContentStatus,
  DesignSubmissionStatus,
  EvaluationStatus,
  NotificationType,
  ProjectStatus,
  TaskStatus,
} from "@prisma/client";
import type { AuthContext } from "@/server/auth/rbac";
import { prisma } from "@/server/db/prisma";
import type {
  AuditModule,
  NotificationFeedItemDTO,
  OverviewDashboardData,
} from "@/features/system/types";

const OPEN_TASK_STATUSES: TaskStatus[] = [
  TaskStatus.BACKLOG,
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.REVISION,
];

const UPCOMING_CONTENT_STATUSES: ContentStatus[] = [
  ContentStatus.PLANNING,
  ContentStatus.IN_DESIGN,
  ContentStatus.DESIGN_REVIEW,
  ContentStatus.DESIGN_REVISION,
  ContentStatus.READY_TO_PUBLISH,
  ContentStatus.SCHEDULED,
];

function mapNotificationTypeToModule(type: NotificationType): AuditModule {
  if (type.startsWith("TASK_")) return "TASKS";
  if (type.startsWith("KPI_")) return "TEAM_KPI";
  if (type.startsWith("CONTENT_") || type.startsWith("DESIGN_")) {
    return "SOCIAL_DESIGN";
  }
  return "SYSTEM";
}

export const getUnreadNotificationCount = cache(
  async (userId: string): Promise<number> => {
    try {
      return await prisma.notification.count({
        where: {
          recipientId: userId,
          isRead: false,
        },
      });
    } catch {
      return 0;
    }
  }
);

export async function getNotificationsForUser(userId: string): Promise<{
  items: NotificationFeedItemDTO[];
  unreadCount: number;
}> {
  const [unreadCount, rows] = await Promise.all([
    prisma.notification.count({
      where: {
        recipientId: userId,
        isRead: false,
      },
    }),
    prisma.notification.findMany({
      where: {
        recipientId: userId,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        entityType: true,
        entityId: true,
        actionUrl: true,
        isRead: true,
        readAt: true,
        createdAt: true,
        actor: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
      },
    }),
  ]);

  return {
    unreadCount,
    items: rows.map((row) => ({
      id: row.id,
      type: row.type,
      moduleCategory: mapNotificationTypeToModule(row.type),
      title: row.title,
      message: row.message,
      entityType: row.entityType,
      entityId: row.entityId,
      actionUrl: row.actionUrl ?? "/notifications",
      isRead: row.isRead,
      readAt: row.readAt ? row.readAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      actor: row.actor,
    })),
  };
}

export async function getOverviewDashboardData(
  ctx: AuthContext
): Promise<OverviewDashboardData> {
  const now = new Date();
  const dueSoonCutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  const monthStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)
  );

  const isLeaderOrPm =
    ctx.roleCode === "SUPER_ADMIN" || ctx.roleCode === "PROJECT_MANAGER";

  const [
    userTasksRaw,
    activeProjectsRaw,
    upcomingContentRaw,
    designQueueRaw,
    recentAnnouncementsRaw,
    unreadNotificationCount,
    managementSnapshot,
  ] = await Promise.all([
    prisma.task.findMany({
      where: {
        assigneeId: ctx.userId,
        deletedAt: null,
        OR: [
          { status: { in: OPEN_TASK_STATUSES } },
          { status: TaskStatus.DONE, completedAt: { gte: monthStart } },
        ],
      },
      orderBy: [{ dueDate: "asc" }, { priority: "desc" }, { createdAt: "desc" }],
      select: {
        id: true,
        taskCode: true,
        title: true,
        status: true,
        priority: true,
        taskType: true,
        dueDate: true,
        completedAt: true,
        project: {
          select: {
            id: true,
            code: true,
            name: true,
            colorHex: true,
          },
        },
      },
    }),
    prisma.project.findMany({
      where: {
        deletedAt: null,
        status: ProjectStatus.ACTIVE,
        ...(isLeaderOrPm
          ? {}
          : {
              OR: [
                { ownerId: ctx.userId },
                { members: { some: { userId: ctx.userId } } },
                { tasks: { some: { assigneeId: ctx.userId, deletedAt: null } } },
              ],
            }),
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 5,
      select: {
        id: true,
        code: true,
        name: true,
        colorHex: true,
        status: true,
        targetEndDate: true,
        tasks: {
          where: {
            deletedAt: null,
            status: { not: TaskStatus.CANCELLED },
          },
          select: {
            status: true,
          },
        },
      },
    }),
    prisma.contentItem.findMany({
      where: {
        deletedAt: null,
        status: { in: UPCOMING_CONTENT_STATUSES },
      },
      orderBy: [{ plannedPublishAt: "asc" }, { createdAt: "desc" }],
      take: 6,
      select: {
        id: true,
        title: true,
        platform: true,
        contentFormat: true,
        status: true,
        plannedPublishAt: true,
        creator: {
          select: { fullName: true },
        },
        project: {
          select: { name: true },
        },
      },
    }),
    prisma.designBrief.findMany({
      where: {
        deletedAt: null,
        ...(isLeaderOrPm
          ? { status: DesignSubmissionStatus.SUBMITTED }
          : ctx.roleCode === "DESIGNER"
            ? {
                assignedDesignerId: ctx.userId,
                status: {
                  in: [
                    DesignSubmissionStatus.PENDING_BRIEF,
                    DesignSubmissionStatus.IN_PROGRESS,
                    DesignSubmissionStatus.REVISION_REQUESTED,
                    DesignSubmissionStatus.SUBMITTED,
                  ],
                },
              }
            : {
                OR: [
                  { requestedBy: ctx.userId },
                  { contentItem: { creatorId: ctx.userId } },
                ],
                status: { not: DesignSubmissionStatus.APPROVED },
              }),
      },
      orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
      take: 5,
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        currentVersion: true,
        revisionCount: true,
        project: { select: { name: true } },
        assignedDesigner: { select: { fullName: true } },
        requester: { select: { fullName: true } },
      },
    }),
    prisma.announcement.findMany({
      where: {
        deletedAt: null,
        publishedAt: { lte: now },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        AND: [
          {
            OR: [
              { targetRoleIds: { isEmpty: true } },
              { targetRoleIds: { has: ctx.roleId } },
            ],
          },
        ],
      },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      take: 4,
      select: {
        id: true,
        title: true,
        content: true,
        priority: true,
        isPinned: true,
        publishedAt: true,
        expiresAt: true,
        author: { select: { fullName: true } },
        reads: {
          where: { userId: ctx.userId },
          select: { userId: true },
        },
      },
    }),
    prisma.notification.count({
      where: {
        recipientId: ctx.userId,
        isRead: false,
      },
    }),
    isLeaderOrPm
      ? Promise.all([
          prisma.user.count({
            where: { deletedAt: null, isActive: true },
          }),
          prisma.designBrief.count({
            where: {
              deletedAt: null,
              status: DesignSubmissionStatus.SUBMITTED,
            },
          }),
          prisma.monthlyEvaluation.count({
            where: {
              status: {
                in: [EvaluationStatus.SUBMITTED, EvaluationStatus.REVIEWED],
              },
            },
          }),
          prisma.task.count({
            where: {
              deletedAt: null,
              status: { in: OPEN_TASK_STATUSES },
              dueDate: { lt: now },
            },
          }),
        ]).then(
          ([
            activeTeamCount,
            pendingDesignReviewsCount,
            pendingEvaluationsCount,
            teamOverdueTasksCount,
          ]) => ({
            activeTeamCount,
            pendingDesignReviewsCount,
            pendingEvaluationsCount,
            teamOverdueTasksCount,
          })
        )
      : Promise.resolve(null),
  ]);

  const openUserTasks = userTasksRaw.filter((t) => t.status !== TaskStatus.DONE);
  const openCount = openUserTasks.length;
  const dueSoonCount = openUserTasks.filter(
    (t) =>
      t.dueDate !== null &&
      t.dueDate.getTime() >= now.getTime() &&
      t.dueDate.getTime() <= dueSoonCutoff.getTime()
  ).length;
  const overdueCount = openUserTasks.filter(
    (t) => t.dueDate !== null && t.dueDate.getTime() < now.getTime()
  ).length;
  const completedThisMonthCount = userTasksRaw.filter(
    (t) =>
      t.status === TaskStatus.DONE &&
      t.completedAt !== null &&
      t.completedAt.getTime() >= monthStart.getTime()
  ).length;

  const myTasks = openUserTasks.slice(0, 8).map((t) => ({
    id: t.id,
    taskCode: t.taskCode,
    title: t.title,
    status: t.status,
    priority: t.priority,
    taskType: t.taskType,
    dueDate: t.dueDate ? t.dueDate.toISOString() : null,
    isOverdue: Boolean(t.dueDate && t.dueDate.getTime() < now.getTime()),
    project: t.project,
  }));

  const activeProjects = activeProjectsRaw.map((p) => {
    const totalTasks = p.tasks.length;
    const doneTasks = p.tasks.filter((t) => t.status === TaskStatus.DONE).length;
    const progressPct =
      totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    return {
      id: p.id,
      code: p.code,
      name: p.name,
      colorHex: p.colorHex,
      status: p.status,
      totalTasks,
      doneTasks,
      progressPct,
      targetEndDate: p.targetEndDate ? p.targetEndDate.toISOString() : null,
    };
  });

  const upcomingContent = upcomingContentRaw.map((c) => ({
    id: c.id,
    title: c.title,
    platform: c.platform,
    contentFormat: c.contentFormat,
    status: c.status,
    plannedPublishAt: c.plannedPublishAt
      ? c.plannedPublishAt.toISOString()
      : null,
    creatorName: c.creator.fullName,
    projectName: c.project.name,
  }));

  const designQueue = designQueueRaw.map((d) => ({
    id: d.id,
    title: d.title,
    status: d.status,
    dueDate: d.dueDate ? d.dueDate.toISOString() : null,
    currentVersion: d.currentVersion,
    revisionCount: d.revisionCount,
    projectName: d.project.name,
    designerName: d.assignedDesigner?.fullName ?? null,
    requesterName: d.requester.fullName,
  }));

  const recentAnnouncements = recentAnnouncementsRaw.map((a) => ({
    id: a.id,
    title: a.title,
    content: a.content,
    priority: a.priority,
    isPinned: a.isPinned,
    publishedAt: a.publishedAt.toISOString(),
    expiresAt: a.expiresAt ? a.expiresAt.toISOString() : null,
    authorName: a.author.fullName,
    isRead: a.reads.length > 0,
  }));

  return {
    taskSummary: {
      openCount,
      dueSoonCount,
      overdueCount,
      completedThisMonthCount,
    },
    myTasks,
    activeProjects,
    upcomingContent,
    designQueue,
    recentAnnouncements,
    unreadNotificationCount,
    managementSnapshot,
  };
}
