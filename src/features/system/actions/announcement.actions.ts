"use server";

import { revalidatePath } from "next/cache";
import { NotificationType } from "@prisma/client";
import { PERMISSIONS, ROLE_CODES } from "@/lib/constants/permissions";
import { createProtectedAction } from "@/server/actions/safe-action";
import { prisma } from "@/server/db/prisma";
import { executeAuditedMutation } from "@/server/services/audit-logger";
import { DomainError } from "@/types/action-result";
import {
  archiveAnnouncementSchema,
  markAnnouncementReadSchema,
  publishAnnouncementSchema,
  togglePinAnnouncementSchema,
} from "@/features/system/schemas/announcement.schema";

const MAX_ACTIVE_PINNED_ANNOUNCEMENTS = 3;

export const publishAnnouncementAction = createProtectedAction({
  permission: PERMISSIONS.SYSTEM_ANNOUNCEMENT_MANAGE,
  schema: publishAnnouncementSchema,
  handler: async ({ ctx, input }) => {
    const now = new Date();
    const publishedAt = input.publishedAt
      ? new Date(input.publishedAt)
      : now;
    const expiresAt =
      input.expiresAt && input.expiresAt.trim() !== ""
        ? new Date(input.expiresAt)
        : null;

    // Resolve target role IDs: empty array means broadcast to ALL roles
    const uniqueRoleCodes = Array.from(new Set(input.targetRoleCodes));
    const broadcastToAll =
      uniqueRoleCodes.length === 0 ||
      uniqueRoleCodes.length === ROLE_CODES.length;

    const targetRoles = broadcastToAll
      ? []
      : await prisma.role.findMany({
          where: { code: { in: uniqueRoleCodes } },
          select: { id: true, code: true },
        });

    const targetRoleIds = targetRoles.map((r) => r.id);

    const recipientUsers = await prisma.user.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        ...(targetRoleIds.length > 0
          ? { roleId: { in: targetRoleIds } }
          : {}),
      },
      select: { id: true },
    });

    const created = await executeAuditedMutation(ctx, async (tx) => {
      if (input.isPinned) {
        const activePinnedCount = await tx.announcement.count({
          where: {
            isPinned: true,
            deletedAt: null,
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        });

        if (activePinnedCount >= MAX_ACTIVE_PINNED_ANNOUNCEMENTS) {
          throw new DomainError(
            "CONFLICT",
            `Maksimal ${MAX_ACTIVE_PINNED_ANNOUNCEMENTS} pengumuman aktif dapat di-pin secara bersamaan. Lepas pin pengumuman lain terlebih dahulu.`,
            {
              isPinned: [
                `Batas maksimal ${MAX_ACTIVE_PINNED_ANNOUNCEMENTS} pinned announcement tercapai.`,
              ],
            }
          );
        }
      }

      const announcement = await tx.announcement.create({
        data: {
          authorId: ctx.userId,
          title: input.title,
          content: input.content,
          priority: input.priority,
          targetRoleIds,
          isPinned: input.isPinned,
          publishedAt,
          expiresAt,
        },
        select: {
          id: true,
          title: true,
          priority: true,
          isPinned: true,
          publishedAt: true,
          expiresAt: true,
        },
      });

      // Author automatically counts as having read their own announcement
      await tx.announcementRead.upsert({
        where: {
          announcementId_userId: {
            announcementId: announcement.id,
            userId: ctx.userId,
          },
        },
        update: {},
        create: {
          announcementId: announcement.id,
          userId: ctx.userId,
        },
      });

      return {
        result: announcement,
        audit: {
          module: "SYSTEM" as const,
          action: "system:announcement:published",
          entityType: "ANNOUNCEMENT",
          entityId: announcement.id,
          summary: `${ctx.fullName} mempublikasikan pengumuman "${announcement.title}" (${announcement.priority})`,
          newValues: {
            title: announcement.title,
            priority: announcement.priority,
            isPinned: announcement.isPinned,
            targetRoles: broadcastToAll ? ["ALL"] : uniqueRoleCodes,
            publishedAt: announcement.publishedAt.toISOString(),
            expiresAt: announcement.expiresAt?.toISOString() ?? null,
          },
        },
        notifications: recipientUsers.map((u) => ({
          recipientId: u.id,
          type: NotificationType.ANNOUNCEMENT_PUBLISHED,
          title: `Pengumuman [${announcement.priority}]: ${announcement.title}`,
          message: `Dipublikasikan oleh ${ctx.fullName}.`,
          actionUrl: "/announcements",
          metadata: {
            priority: announcement.priority,
            isPinned: announcement.isPinned,
          },
        })),
      };
    });

    revalidatePath("/announcements");
    revalidatePath("/", "layout");

    return {
      data: {
        id: created.id,
        title: created.title,
        isPinned: created.isPinned,
      },
      message: `Pengumuman "${created.title}" berhasil dipublikasikan ke ${recipientUsers.length} anggota tim.`,
    };
  },
});

export const togglePinAnnouncementAction = createProtectedAction({
  permission: PERMISSIONS.SYSTEM_ANNOUNCEMENT_MANAGE,
  schema: togglePinAnnouncementSchema,
  handler: async ({ ctx, input }) => {
    const now = new Date();
    const existing = await prisma.announcement.findFirst({
      where: {
        id: input.announcementId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        isPinned: true,
        expiresAt: true,
      },
    });

    if (!existing) {
      throw new DomainError("NOT_FOUND", "Pengumuman tidak ditemukan.");
    }

    if (existing.expiresAt && existing.expiresAt.getTime() <= now.getTime()) {
      throw new DomainError(
        "INVALID_STATE_TRANSITION",
        "Pengumuman yang sudah kedaluwarsa tidak dapat diubah status pin-nya."
      );
    }

    const updated = await executeAuditedMutation(ctx, async (tx) => {
      if (input.isPinned && !existing.isPinned) {
        const activePinnedCount = await tx.announcement.count({
          where: {
            isPinned: true,
            deletedAt: null,
            id: { not: existing.id },
            OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
          },
        });

        if (activePinnedCount >= MAX_ACTIVE_PINNED_ANNOUNCEMENTS) {
          throw new DomainError(
            "CONFLICT",
            `Maksimal ${MAX_ACTIVE_PINNED_ANNOUNCEMENTS} pengumuman aktif dapat di-pin secara bersamaan.`
          );
        }
      }

      const row = await tx.announcement.update({
        where: { id: existing.id },
        data: { isPinned: input.isPinned },
        select: { id: true, isPinned: true },
      });

      return {
        result: row,
        audit: {
          module: "SYSTEM" as const,
          action: "system:announcement:pin_toggled",
          entityType: "ANNOUNCEMENT",
          entityId: existing.id,
          summary: `${ctx.fullName} ${input.isPinned ? "menyematkan (pin)" : "melepas pin"} pengumuman "${existing.title}"`,
          oldValues: { isPinned: existing.isPinned },
          newValues: { isPinned: input.isPinned },
        },
      };
    });

    revalidatePath("/announcements");
    revalidatePath("/", "layout");

    return {
      data: updated,
      message: input.isPinned
        ? "Pengumuman disematkan ke banner atas."
        : "Sematkan (pin) pengumuman dilepas.",
    };
  },
});

export const markAnnouncementReadAction = createProtectedAction({
  permission: PERMISSIONS.SYSTEM_ANNOUNCEMENT_READ,
  schema: markAnnouncementReadSchema,
  handler: async ({ ctx, input }) => {
    const existing = await prisma.announcement.findFirst({
      where: {
        id: input.announcementId,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!existing) {
      throw new DomainError("NOT_FOUND", "Pengumuman tidak ditemukan.");
    }

    const record = await prisma.announcementRead.upsert({
      where: {
        announcementId_userId: {
          announcementId: existing.id,
          userId: ctx.userId,
        },
      },
      update: {},
      create: {
        announcementId: existing.id,
        userId: ctx.userId,
      },
      select: {
        announcementId: true,
        userId: true,
        readAt: true,
      },
    });

    revalidatePath("/announcements");
    revalidatePath("/");

    return {
      data: {
        announcementId: record.announcementId,
        readAt: record.readAt.toISOString(),
      },
      message: "Pengumuman ditandai sudah dibaca.",
    };
  },
});

export const archiveAnnouncementAction = createProtectedAction({
  permission: PERMISSIONS.SYSTEM_ANNOUNCEMENT_MANAGE,
  schema: archiveAnnouncementSchema,
  handler: async ({ ctx, input }) => {
    const existing = await prisma.announcement.findFirst({
      where: {
        id: input.announcementId,
        deletedAt: null,
      },
      select: {
        id: true,
        title: true,
        isPinned: true,
      },
    });

    if (!existing) {
      throw new DomainError(
        "NOT_FOUND",
        "Pengumuman tidak ditemukan atau sudah diarsipkan."
      );
    }

    const archived = await executeAuditedMutation(ctx, async (tx) => {
      const row = await tx.announcement.update({
        where: { id: existing.id },
        data: {
          deletedAt: new Date(),
          isPinned: false,
        },
        select: {
          id: true,
          deletedAt: true,
        },
      });

      return {
        result: row,
        audit: {
          module: "SYSTEM" as const,
          action: "system:announcement:archived",
          entityType: "ANNOUNCEMENT",
          entityId: existing.id,
          summary: `${ctx.fullName} mengarsipkan pengumuman "${existing.title}"`,
          oldValues: {
            deletedAt: null,
            isPinned: existing.isPinned,
          },
          newValues: {
            deletedAt: row.deletedAt?.toISOString() ?? null,
            isPinned: false,
          },
        },
      };
    });

    revalidatePath("/announcements");
    revalidatePath("/", "layout");

    return {
      data: { id: archived.id },
      message: `Pengumuman "${existing.title}" dipindahkan ke arsip.`,
    };
  },
});
