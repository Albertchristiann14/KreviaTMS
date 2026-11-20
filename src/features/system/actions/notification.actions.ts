"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createProtectedAction } from "@/server/actions/safe-action";
import { prisma } from "@/server/db/prisma";
import { DomainError } from "@/types/action-result";

const markNotificationReadSchema = z.object({
  notificationId: z.string().uuid("ID notifikasi tidak valid."),
});

const markAllNotificationsReadSchema = z.object({}).optional();

export const markNotificationReadAction = createProtectedAction({
  schema: markNotificationReadSchema,
  handler: async ({ user, input }) => {
    const existing = await prisma.notification.findFirst({
      where: {
        id: input.notificationId,
        recipientId: user.userId,
      },
      select: {
        id: true,
        isRead: true,
      },
    });

    if (!existing) {
      throw new DomainError("NOT_FOUND", "Notifikasi tidak ditemukan.");
    }

    if (!existing.isRead) {
      await prisma.notification.update({
        where: { id: existing.id },
        data: {
          isRead: true,
          readAt: new Date(),
        },
      });
    }

    revalidatePath("/notifications");
    return {
      data: { id: existing.id, isRead: true },
      message: "Notifikasi ditandai sudah dibaca.",
    };
  },
});

const runMarkAllNotificationsRead = createProtectedAction({
  schema: markAllNotificationsReadSchema,
  handler: async ({ user }) => {
    const result = await prisma.notification.updateMany({
      where: {
        recipientId: user.userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    revalidatePath("/notifications");
    return {
      data: { updatedCount: result.count },
      message: `${result.count} notifikasi ditandai sudah dibaca.`,
    };
  },
});

export async function markAllNotificationsReadAction(
  rawInput?: Record<string, never>
) {
  return runMarkAllNotificationsRead(rawInput);
}
