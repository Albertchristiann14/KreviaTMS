import { TaskStatus } from "@prisma/client";
import type { PermissionCode, RoleCode } from "@/lib/constants/permissions";
import { prisma } from "@/server/db/prisma";
import type {
  ActiveTaskBriefDTO,
  RbacMatrixData,
  RoleOptionDTO,
  UsersManagementPageData,
} from "@/features/system/types";

const ROLE_DISPLAY_ORDER: Record<RoleCode, number> = {
  SUPER_ADMIN: 0,
  PROJECT_MANAGER: 1,
  STAFF_CREATOR: 2,
  DESIGNER: 3,
};

const ACTIVE_TASK_STATUSES: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.REVISION,
];

export async function getUsersManagementData(): Promise<UsersManagementPageData> {
  const [users, roles, activeTaskCounts] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: [{ isActive: "desc" }, { fullName: "asc" }],
      select: {
        id: true,
        email: true,
        fullName: true,
        displayName: true,
        avatarUrl: true,
        jobTitle: true,
        department: true,
        phone: true,
        employmentStatus: true,
        isActive: true,
        mustChangePassword: true,
        tokenVersion: true,
        lastLoginAt: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            code: true,
            name: true,
          },
        },
        manager: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    }),
    prisma.role.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        isSystem: true,
      },
    }),
    prisma.task.groupBy({
      by: ["assigneeId"],
      where: {
        deletedAt: null,
        assigneeId: { not: null },
        status: { in: ACTIVE_TASK_STATUSES },
      },
      _count: { _all: true },
    }),
  ]);

  const taskCountMap = new Map<string, number>();
  for (const row of activeTaskCounts) {
    if (row.assigneeId) {
      taskCountMap.set(row.assigneeId, row._count._all);
    }
  }

  const sortedRoles: RoleOptionDTO[] = [...roles]
    .map((r) => ({
      id: r.id,
      code: r.code as RoleCode,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
    }))
    .sort(
      (a, b) =>
        (ROLE_DISPLAY_ORDER[a.code] ?? 99) - (ROLE_DISPLAY_ORDER[b.code] ?? 99)
    );

  const userRows = users.map((u) => ({
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    displayName: u.displayName,
    avatarUrl: u.avatarUrl,
    jobTitle: u.jobTitle,
    department: u.department,
    phone: u.phone,
    employmentStatus: u.employmentStatus,
    isActive: u.isActive,
    mustChangePassword: u.mustChangePassword,
    tokenVersion: u.tokenVersion,
    lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
    createdAt: u.createdAt.toISOString(),
    role: {
      id: u.role.id,
      code: u.role.code as RoleCode,
      name: u.role.name,
    },
    manager: u.manager,
    activeTaskCount: taskCountMap.get(u.id) ?? 0,
  }));

  const managers = userRows
    .filter((u) => u.isActive)
    .map((u) => ({
      id: u.id,
      fullName: u.fullName,
      jobTitle: u.jobTitle,
      roleCode: u.role.code,
    }));

  const activeCount = userRows.filter((u) => u.isActive).length;
  const mustChangePasswordCount = userRows.filter(
    (u) => u.isActive && u.mustChangePassword
  ).length;

  return {
    users: userRows,
    roles: sortedRoles,
    managers,
    summary: {
      total: userRows.length,
      active: activeCount,
      inactive: userRows.length - activeCount,
      mustChangePasswordCount,
    },
  };
}

export async function getActiveTasksForUser(
  userId: string
): Promise<ActiveTaskBriefDTO[]> {
  const tasks = await prisma.task.findMany({
    where: {
      assigneeId: userId,
      deletedAt: null,
      status: { in: ACTIVE_TASK_STATUSES },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
    take: 25,
    select: {
      id: true,
      taskCode: true,
      title: true,
      status: true,
    },
  });

  return tasks;
}

export async function getRbacMatrixData(): Promise<RbacMatrixData> {
  const [roles, permissions, activeUserCounts] = await Promise.all([
    prisma.role.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        isSystem: true,
        rolePermissions: {
          select: {
            permission: {
              select: { code: true },
            },
          },
        },
      },
    }),
    prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { resource: "asc" }, { action: "asc" }],
      select: {
        id: true,
        code: true,
        module: true,
        resource: true,
        action: true,
        description: true,
      },
    }),
    prisma.user.groupBy({
      by: ["roleId"],
      where: { deletedAt: null, isActive: true },
      _count: { _all: true },
    }),
  ]);

  const userCountByRole = new Map<string, number>();
  for (const row of activeUserCounts) {
    userCountByRole.set(row.roleId, row._count._all);
  }

  const sortedRoles = [...roles]
    .map((r) => ({
      id: r.id,
      code: r.code as RoleCode,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      activeUserCount: userCountByRole.get(r.id) ?? 0,
      permissionCodes: r.rolePermissions.map(
        (rp) => rp.permission.code as PermissionCode
      ),
    }))
    .sort(
      (a, b) =>
        (ROLE_DISPLAY_ORDER[a.code] ?? 99) - (ROLE_DISPLAY_ORDER[b.code] ?? 99)
    );

  return {
    roles: sortedRoles,
    permissions: permissions.map((p) => ({
      id: p.id,
      code: p.code as PermissionCode,
      module: p.module,
      resource: p.resource,
      action: p.action,
      description: p.description,
    })),
  };
}
