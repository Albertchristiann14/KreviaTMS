import type { NotificationType, Prisma } from "@prisma/client";

export interface NotificationDraft {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string | null;
  entityId?: string | null;
  actionUrl?: string | null;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Dispatches in-app notifications within an active Prisma transaction,
 * automatically filtering out self-notifications (`recipientId === actorId`).
 */
export async function dispatchNotifications(
  tx: Prisma.TransactionClient,
  actorId: string | null,
  drafts: readonly NotificationDraft[]
): Promise<number> {
  if (drafts.length === 0) return 0;

  const filtered = drafts.filter(
    (draft) => Boolean(draft.recipientId) && draft.recipientId !== actorId
  );

  if (filtered.length === 0) return 0;

  const result = await tx.notification.createMany({
    data: filtered.map((draft) => ({
      recipientId: draft.recipientId,
      actorId,
      type: draft.type,
      title: draft.title.slice(0, 180),
      message: draft.message,
      entityType: draft.entityType ?? null,
      entityId: draft.entityId ?? null,
      actionUrl: draft.actionUrl ? draft.actionUrl.slice(0, 255) : null,
      metadata: draft.metadata ?? {},
    })),
  });

  return result.count;
}
