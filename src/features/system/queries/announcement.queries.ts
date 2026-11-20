import { hasPermission, PERMISSIONS, type RoleCode } from "@/lib/constants/permissions";
import type { AuthContext } from "@/server/auth/rbac";
import { prisma } from "@/server/db/prisma";
import type {
  AnnouncementItemDTO,
  AnnouncementsFeedData,
  RoleOptionDTO,
} from "@/features/system/types";

const ROLE_DISPLAY_ORDER: Record<RoleCode, number> = {
  SUPER_ADMIN: 0,
  PROJECT_MANAGER: 1,
  STAFF_CREATOR: 2,
  DESIGNER: 3,
};

export async function getAnnouncementsFeed(
  ctx: AuthContext
): Promise<AnnouncementsFeedData> {
  const now = new Date();
  const canManage = hasPermission(
    ctx.permissions,
    PERMISSIONS.SYSTEM_ANNOUNCEMENT_MANAGE,
    ctx.roleCode
  );

  const [roles, activeUsers, announcements] = await Promise.all([
    prisma.role.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        isSystem: true,
      },
    }),
    prisma.user.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        roleId: true,
        role: {
          select: { code: true },
        },
      },
    }),
    prisma.announcement.findMany({
      where: canManage
        ? {}
        : {
            publishedAt: { lte: now },
            OR: [
              { targetRoleIds: { isEmpty: true } },
              { targetRoleIds: { has: ctx.roleId } },
            ],
          },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      take: 100,
      select: {
        id: true,
        title: true,
        content: true,
        priority: true,
        targetRoleIds: true,
        isPinned: true,
        publishedAt: true,
        expiresAt: true,
        createdAt: true,
        deletedAt: true,
        author: {
          select: {
            id: true,
            fullName: true,
            role: {
              select: { code: true },
            },
          },
        },
        reads: {
          orderBy: { readAt: "desc" },
          select: {
            userId: true,
            readAt: true,
            user: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                role: {
                  select: { code: true },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const roleCodeById = new Map<string, RoleCode>();
  for (const r of roles) {
    roleCodeById.set(r.id, r.code as RoleCode);
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

  const items: AnnouncementItemDTO[] = announcements.map((ann) => {
    const isExpired = Boolean(
      ann.expiresAt && ann.expiresAt.getTime() <= now.getTime()
    );
    const targetRoleSet = new Set(ann.targetRoleIds);
    const targetUsers =
      targetRoleSet.size === 0
        ? activeUsers
        : activeUsers.filter((u) => targetRoleSet.has(u.roleId));

    const readerIdSet = new Set(ann.reads.map((r) => r.userId));
    const unreadUsers = targetUsers
      .filter((u) => !readerIdSet.has(u.id))
      .map((u) => ({
        userId: u.id,
        fullName: u.fullName,
        roleCode: u.role.code as RoleCode,
      }));

    const targetRoleCodes = ann.targetRoleIds
      .map((rid) => roleCodeById.get(rid))
      .filter((code): code is RoleCode => Boolean(code));

    return {
      id: ann.id,
      title: ann.title,
      content: ann.content,
      priority: ann.priority,
      targetRoleIds: ann.targetRoleIds,
      targetRoleCodes,
      isPinned: ann.isPinned,
      publishedAt: ann.publishedAt.toISOString(),
      expiresAt: ann.expiresAt ? ann.expiresAt.toISOString() : null,
      createdAt: ann.createdAt.toISOString(),
      deletedAt: ann.deletedAt ? ann.deletedAt.toISOString() : null,
      isExpired,
      author: {
        id: ann.author.id,
        fullName: ann.author.fullName,
        roleCode: ann.author.role.code as RoleCode,
      },
      readCount: ann.reads.length,
      totalTargetUsers: targetUsers.length,
      isReadByCurrentUser: readerIdSet.has(ctx.userId),
      readers: ann.reads.map((r) => ({
        userId: r.userId,
        fullName: r.user.fullName,
        avatarUrl: r.user.avatarUrl,
        roleCode: r.user.role.code as RoleCode,
        readAt: r.readAt.toISOString(),
      })),
      unreadUsers,
    };
  });

  const active = items.filter((item) => !item.deletedAt && !item.isExpired);
  const archived = items.filter((item) => Boolean(item.deletedAt) || item.isExpired);
  const activePinnedCount = active.filter((item) => item.isPinned).length;

  return {
    active,
    archived,
    activePinnedCount,
    roles: sortedRoles,
    canManage,
  };
}
