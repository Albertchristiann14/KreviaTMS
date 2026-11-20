"use server";

import { revalidatePath } from "next/cache";
import { ContentStatus } from "@prisma/client";
import { upsertContentAnalyticsSchema } from "@/features/social-design/schemas/analytics.schema";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { createProtectedAction } from "@/server/actions/safe-action";
import { executeAuditedMutation } from "@/server/services/audit-logger";
import { DomainError } from "@/types/action-result";

export const upsertContentAnalyticsAction = createProtectedAction({
  permission: PERMISSIONS.SOCIAL_ANALYTICS_MANAGE,
  schema: upsertContentAnalyticsSchema,
  handler: async ({ ctx, input }) => {
    const recordedDateObj = new Date(`${input.recordedDate}T00:00:00.000Z`);

    const saved = await executeAuditedMutation(ctx, async (tx) => {
      const contentItem = await tx.contentItem.findFirst({
        where: { id: input.contentItemId, deletedAt: null },
        select: {
          id: true,
          title: true,
          status: true,
          publishedAt: true,
        },
      });

      if (!contentItem) {
        throw new DomainError("NOT_FOUND", "Item konten tidak ditemukan.");
      }

      const isAllowedStatus =
        contentItem.status === ContentStatus.PUBLISHED ||
        (contentItem.status === ContentStatus.ARCHIVED &&
          contentItem.publishedAt !== null);

      if (!isAllowedStatus) {
        throw new DomainError(
          "INVALID_STATE_TRANSITION",
          "Metrik analitik hanya dapat dicatat untuk konten berstatus PUBLISHED."
        );
      }

      // CRITICAL: Never pass engagementRate or ctr into create/update!
      // Both are PostgreSQL GENERATED ALWAYS AS ... STORED columns.
      const row = await tx.contentAnalytic.upsert({
        where: {
          contentItemId_recordedDate: {
            contentItemId: input.contentItemId,
            recordedDate: recordedDateObj,
          },
        },
        create: {
          contentItemId: input.contentItemId,
          recordedDate: recordedDateObj,
          impressions: input.impressions,
          reach: input.reach,
          likes: input.likes,
          comments: input.comments,
          shares: input.shares,
          saves: input.saves,
          clicks: input.clicks,
          videoViews: input.videoViews,
          notes: input.notes?.trim() || null,
          recordedBy: ctx.userId,
        },
        update: {
          impressions: input.impressions,
          reach: input.reach,
          likes: input.likes,
          comments: input.comments,
          shares: input.shares,
          saves: input.saves,
          clicks: input.clicks,
          videoViews: input.videoViews,
          notes: input.notes?.trim() || null,
          recordedBy: ctx.userId,
        },
        select: {
          id: true,
          contentItemId: true,
          recordedDate: true,
          impressions: true,
          reach: true,
          likes: true,
          comments: true,
          shares: true,
          saves: true,
          clicks: true,
          videoViews: true,
          engagementRate: true,
          ctr: true,
          notes: true,
        },
      });

      const engagementRate = Number(row.engagementRate);
      const ctr = Number(row.ctr);

      return {
        result: {
          id: row.id,
          contentItemId: row.contentItemId,
          recordedDate: row.recordedDate.toISOString().slice(0, 10),
          engagementRate,
          ctr,
          reachExceedsImpressionsWarning:
            input.impressions > 0 && input.reach > input.impressions,
        },
        audit: {
          module: "SOCIAL_DESIGN" as const,
          action: "social:analytics:upserted",
          entityType: "CONTENT_ANALYTIC",
          entityId: row.id,
          summary: `Metrik konten "${contentItem.title}" (${input.recordedDate}) dicatat — ER ${engagementRate.toFixed(2)}%, CTR ${ctr.toFixed(2)}%`,
          newValues: {
            contentItemId: input.contentItemId,
            recordedDate: input.recordedDate,
            impressions: input.impressions,
            reach: input.reach,
            likes: input.likes,
            comments: input.comments,
            shares: input.shares,
            saves: input.saves,
            clicks: input.clicks,
            videoViews: input.videoViews,
            engagementRate,
            ctr,
          },
        },
      };
    });

    revalidatePath("/content/analytics");
    revalidatePath("/content/calendar");

    return {
      data: saved,
      message: saved.reachExceedsImpressionsWarning
        ? `Metrik tersimpan (ER ${saved.engagementRate.toFixed(2)}%). Catatan: nilai Reach lebih besar dari Impressions.`
        : `Metrik tersimpan — Engagement Rate ${saved.engagementRate.toFixed(2)}% & CTR ${saved.ctr.toFixed(2)}%.`,
    };
  },
});
