import "server-only";
import { Prisma, ProjectStatus, TaskStatus } from "@prisma/client";
import { z } from "zod";
import type { AuthContext } from "@/server/auth/rbac";
import { prisma } from "@/server/db/prisma";
import type {
  AssigneeWorkloadOption,
  ProjectDetailDto,
  ProjectLookupOption,
  ProjectSummaryDto,
} from "@/features/tasks/types";
import {
  canViewAllProjects,
  createEmptyStatusBreakdown,
  mapTaskRowToBoardCardDto,
  TASK_BOARD_CARD_SELECT,
} from "@/features/tasks/queries/task-mappers";

const uuidSchema = z.string().uuid();

export interface ProjectListFilters {
  status?: string | null;
  q?: string | null;
}

/**
 * Fetches active internal team members along with their live active & overdue task counts
 * for workload-aware task assignment dropdowns (FR-A05).
 */
export async function getAssignableUsersWithWorkload(): Promise<
  AssigneeWorkloadOption[]
> {
  const now = new Date();
  const [users, activeTasks] = await Promise.all([
    prisma.user.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      orderBy: [{ fullName: "asc" }],
      select: {
        id: true,
        fullName: true,
        displayName: true,
        avatarUrl: true,
        jobTitle: true,
        isActive: true,
        role: {
          select: { code: true },
        },
      },
    }),
    prisma.task.findMany({
      where: {
        deletedAt: null,
        assigneeId: { not: null },
        status: { notIn: [TaskStatus.DONE, TaskStatus.CANCELLED] },
        project: { deletedAt: null },
      },
      select: {
        assigneeId: true,
        dueDate: true,
      },
    }),
  ]);

  const countsByUser = new Map<string, { active: number; overdue: number }>();
  for (const task of activeTasks) {
    if (!task.assigneeId) continue;
    const entry = countsByUser.get(task.assigneeId) ?? {
      active: 0,
      overdue: 0,
    };
    entry.active += 1;
    if (task.dueDate && task.dueDate.getTime() < now.getTime()) {
      entry.overdue += 1;
    }
    countsByUser.set(task.assigneeId, entry);
  }

  return users.map((user) => {
    const counts = countsByUser.get(user.id) ?? { active: 0, overdue: 0 };
    return {
      id: user.id,
      fullName: user.fullName,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      jobTitle: user.jobTitle,
      roleCode: user.role.code,
      isActive: user.isActive,
      activeTaskCount: counts.active,
      overdueTaskCount: counts.overdue,
    };
  });
}

/**
 * Fetches accessible projects along with task completion & overdue summaries (FR-A01).
 */
export async function getProjectsForUser(
  ctx: AuthContext,
  filters?: ProjectListFilters
): Promise<{
  projects: ProjectSummaryDto[];
  assignableUsers: AssigneeWorkloadOption[];
}> {
  const now = new Date();
  const where: Prisma.ProjectWhereInput = {
    deletedAt: null,
  };

  if (!canViewAllProjects(ctx)) {
    where.OR = [
      { ownerId: ctx.userId },
      { members: { some: { userId: ctx.userId } } },
    ];
  }

  const normalizedStatus = filters?.status?.trim().toUpperCase();
  if (
    normalizedStatus &&
    normalizedStatus !== "ALL" &&
    Object.values(ProjectStatus).includes(normalizedStatus as ProjectStatus)
  ) {
    where.status = normalizedStatus as ProjectStatus;
  } else if (!normalizedStatus) {
    // Default view shows non-archived projects unless explicitly filtered
    where.status = { not: ProjectStatus.ARCHIVED };
  }

  const queryText = filters?.q?.trim();
  if (queryText) {
    where.AND = [
      {
        OR: [
          { name: { contains: queryText, mode: "insensitive" } },
          { code: { contains: queryText, mode: "insensitive" } },
          { description: { contains: queryText, mode: "insensitive" } },
        ],
      },
    ];
  }

  const [rows, assignableUsers] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        status: true,
        colorHex: true,
        ownerId: true,
        startDate: true,
        targetEndDate: true,
        archivedAt: true,
        createdAt: true,
        owner: {
          select: {
            id: true,
            fullName: true,
            avatarUrl: true,
          },
        },
        members: {
          take: 5,
          orderBy: { joinedAt: "asc" },
          select: {
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
        _count: {
          select: { members: true },
        },
      },
    }),
    getAssignableUsersWithWorkload(),
  ]);

  const projectIds = rows.map((r) => r.id);
  const taskStats =
    projectIds.length > 0
      ? await prisma.task.findMany({
          where: {
            projectId: { in: projectIds },
            deletedAt: null,
          },
          select: {
            projectId: true,
            status: true,
            dueDate: true,
          },
        })
      : [];

  const statsMap = new Map<
    string,
    {
      total: number;
      active: number;
      done: number;
      cancelled: number;
      overdue: number;
    }
  >();

  for (const t of taskStats) {
    const agg = statsMap.get(t.projectId) ?? {
      total: 0,
      active: 0,
      done: 0,
      cancelled: 0,
      overdue: 0,
    };
    agg.total += 1;
    if (t.status === TaskStatus.DONE) {
      agg.done += 1;
    } else if (t.status === TaskStatus.CANCELLED) {
      agg.cancelled += 1;
    } else {
      agg.active += 1;
      if (t.dueDate && t.dueDate.getTime() < now.getTime()) {
        agg.overdue += 1;
      }
    }
    statsMap.set(t.projectId, agg);
  }

  const projects: ProjectSummaryDto[] = rows.map((row) => {
    const agg = statsMap.get(row.id) ?? {
      total: 0,
      active: 0,
      done: 0,
      cancelled: 0,
      overdue: 0,
    };
    const denominator = agg.total - agg.cancelled;
    const progressPct =
      denominator > 0 ? Math.round((agg.done / denominator) * 100) : 0;

    return {
      id: row.id,
      code: row.code,
      name: row.name,
      description: row.description,
      status: row.status,
      colorHex: row.colorHex,
      ownerId: row.ownerId,
      owner: row.owner,
      startDate: row.startDate
        ? row.startDate.toISOString().slice(0, 10)
        : null,
      targetEndDate: row.targetEndDate
        ? row.targetEndDate.toISOString().slice(0, 10)
        : null,
      archivedAt: row.archivedAt ? row.archivedAt.toISOString() : null,
      createdAt: row.createdAt.toISOString(),
      totalTasks: agg.total,
      activeTasks: agg.active,
      doneTasks: agg.done,
      cancelledTasks: agg.cancelled,
      overdueTasks: agg.overdue,
      progressPct,
      memberCount: row._count.members,
      membersPreview: row.members.map((m) => m.user),
    };
  });

  return { projects, assignableUsers };
}

/**
 * Fetches full project overview, tasks, overdue breakdown, and members for `/projects/[projectId]`.
 */
export async function getProjectDetailById(
  ctx: AuthContext,
  projectId: string
): Promise<ProjectDetailDto | null> {
  if (!uuidSchema.safeParse(projectId).success) {
    return null;
  }

  const now = new Date();
  const project = await prisma.project.findFirst({
    where: {
      id: projectId,
      deletedAt: null,
    },
    select: {
      id: true,
      code: true,
      name: true,
      description: true,
      status: true,
      colorHex: true,
      ownerId: true,
      startDate: true,
      targetEndDate: true,
      archivedAt: true,
      createdAt: true,
      owner: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true,
        },
      },
      members: {
        orderBy: [{ projectRole: "asc" }, { joinedAt: "asc" }],
        select: {
          id: true,
          userId: true,
          projectRole: true,
          joinedAt: true,
          user: {
            select: {
              fullName: true,
              displayName: true,
              avatarUrl: true,
              jobTitle: true,
              department: true,
              role: { select: { code: true } },
            },
          },
        },
      },
    },
  });

  if (!project) return null;

  const isMember =
    project.ownerId === ctx.userId ||
    project.members.some((m) => m.userId === ctx.userId);
  if (!canViewAllProjects(ctx) && !isMember) {
    return null;
  }

  const taskRows = await prisma.task.findMany({
    where: {
      projectId: project.id,
      deletedAt: null,
    },
    orderBy: [{ dueDate: "asc" }, { position: "asc" }, { createdAt: "desc" }],
    select: TASK_BOARD_CARD_SELECT,
  });

  const tasks = taskRows.map((row) => mapTaskRowToBoardCardDto(row, now));
  const statusBreakdown = createEmptyStatusBreakdown();

  let doneTasks = 0;
  let cancelledTasks = 0;
  let activeTasks = 0;
  const overdueTaskList = [];

  for (const t of tasks) {
    statusBreakdown[t.status] += 1;
    if (t.status === "DONE") {
      doneTasks += 1;
    } else if (t.status === "CANCELLED") {
      cancelledTasks += 1;
    } else {
      activeTasks += 1;
      if (t.isOverdue) {
        overdueTaskList.push(t);
      }
    }
  }

  const denominator = tasks.length - cancelledTasks;
  const progressPct =
    denominator > 0 ? Math.round((doneTasks / denominator) * 100) : 0;

  return {
    id: project.id,
    code: project.code,
    name: project.name,
    description: project.description,
    status: project.status,
    colorHex: project.colorHex,
    ownerId: project.ownerId,
    owner: project.owner,
    startDate: project.startDate
      ? project.startDate.toISOString().slice(0, 10)
      : null,
    targetEndDate: project.targetEndDate
      ? project.targetEndDate.toISOString().slice(0, 10)
      : null,
    archivedAt: project.archivedAt ? project.archivedAt.toISOString() : null,
    createdAt: project.createdAt.toISOString(),
    totalTasks: tasks.length,
    activeTasks,
    doneTasks,
    cancelledTasks,
    overdueTasks: overdueTaskList.length,
    progressPct,
    memberCount: project.members.length,
    membersPreview: project.members.slice(0, 5).map((m) => ({
      id: m.userId,
      fullName: m.user.fullName,
      avatarUrl: m.user.avatarUrl,
    })),
    members: project.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      fullName: m.user.fullName,
      displayName: m.user.displayName,
      avatarUrl: m.user.avatarUrl,
      jobTitle: m.user.jobTitle,
      department: m.user.department,
      roleCode: m.user.role.code,
      projectRole: m.projectRole,
      joinedAt: m.joinedAt.toISOString(),
    })),
    statusBreakdown,
    overdueTaskList,
    tasks,
  };
}

/**
 * Fetches accessible project options & assignable users for task dialogs and filter bars.
 */
export async function getTaskFormOptions(ctx: AuthContext): Promise<{
  projects: ProjectLookupOption[];
  assignees: AssigneeWorkloadOption[];
}> {
  const projectWhere: Prisma.ProjectWhereInput = {
    deletedAt: null,
    status: { not: ProjectStatus.ARCHIVED },
  };

  if (!canViewAllProjects(ctx)) {
    projectWhere.OR = [
      { ownerId: ctx.userId },
      { members: { some: { userId: ctx.userId } } },
    ];
  }

  const [projects, assignees] = await Promise.all([
    prisma.project.findMany({
      where: projectWhere,
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        code: true,
        name: true,
        colorHex: true,
        status: true,
        ownerId: true,
      },
    }),
    getAssignableUsersWithWorkload(),
  ]);

  return { projects, assignees };
}
