"use server";

import { revalidatePath } from "next/cache";
import { ContentStatus, TaskStatus, TaskType } from "@prisma/client";
import {
  createContentPlanSchema,
  deleteContentPlanSchema,
  updateContentPlanSchema,
  updateContentScheduleSchema,
} from "@/features/social-design/schemas/content.schema";
import {
  createContentPlanAtomic,
  updateContentScheduleAtomic,
} from "@/features/social-design/services/content-workflow.service";
import { hasPermission, PERMISSIONS } from "@/lib/constants/permissions";
import { createProtectedAction } from "@/server/actions/safe-action";
import { executeAuditedMutation } from "@/server/services/audit-logger";
import { DomainError } from "@/types/action-result";

export const createContentPlanAction = createProtectedAction({
  permission: PERMISSIONS.SOCIAL_CONTENT_MANAGE,
  schema: createContentPlanSchema,
  handler: async ({ ctx, input }) => {
    if (
      input.requiresDesign &&
      !hasPermission(ctx.permissions, PERMISSIONS.DESIGN_BRIEF_MANAGE, ctx.roleCode)
    ) {
      throw new DomainError(
        "FORBIDDEN",
        "Anda membutuhkan izin design:brief:manage untuk membuat brief desain."
      );
    }

    const output = await createContentPlanAtomic(ctx, {
      projectId: input.projectId,
      ideaId: input.ideaId ?? null,
      title: input.title,
      platform: input.platform,
      contentFormat: input.contentFormat,
      contentPillar: input.contentPillar ?? null,
      campaignName: input.campaignName ?? null,
      caption: input.caption ?? null,
      hashtags: input.hashtags,
      ctaText: input.ctaText ?? null,
      creatorId: input.creatorId,
      plannedPublishAt: input.plannedPublishAt
        ? new Date(input.plannedPublishAt)
        : null,
      requiresDesign: input.requiresDesign,
      designBrief:
        input.requiresDesign && input.designBrief
          ? {
              title: input.designBrief.title ?? null,
              objective: input.designBrief.objective,
              dimensionsSpec: input.designBrief.dimensionsSpec ?? null,
              copyText: input.designBrief.copyText ?? null,
              brandGuidelinesNotes:
                input.designBrief.brandGuidelinesNotes ?? null,
              referenceLinks: input.designBrief.referenceLinks,
              assignedDesignerId: input.designBrief.assignedDesignerId ?? null,
              dueDate: input.designBrief.dueDate
                ? new Date(input.designBrief.dueDate)
                : null,
            }
          : null,
    });

    revalidatePath("/content/planner");
    revalidatePath("/content/calendar");
    revalidatePath("/content/ideas");
    revalidatePath("/design/workspace");
    revalidatePath("/tasks/board");
    revalidatePath("/tasks/my-tasks");
    revalidatePath("/tasks/calendar");

    return {
      data: output,
      message: output.designBriefId
        ? `Content plan dibuat; 1 Design Brief dan ${output.spawnedTasks.length} Task otomatis muncul di Kanban & Calendar.`
        : `Content plan dibuat dan 1 Task produksi otomatis dibuat di Kanban & Calendar.`,
    };
  },
});

export const updateContentPlanAction = createProtectedAction({
  permission: PERMISSIONS.SOCIAL_CONTENT_MANAGE,
  schema: updateContentPlanSchema,
  handler: async ({ ctx, input }) => {
    const updated = await executeAuditedMutation(ctx, async (tx) => {
      const existing = await tx.contentItem.findFirst({
        where: { id: input.contentItemId, deletedAt: null },
        include: {
          tasks: {
            where: { deletedAt: null, taskType: TaskType.CONTENT_PRODUCTION },
            select: { id: true, status: true, dueDate: true },
          },
        },
      });

      if (!existing) {
        throw new DomainError("NOT_FOUND", "Item konten tidak ditemukan.");
      }

      const nextPlannedPublishAt =
        input.plannedPublishAt !== undefined
          ? input.plannedPublishAt
            ? new Date(input.plannedPublishAt)
            : null
          : existing.plannedPublishAt;

      const isAdminOrPm =
        ctx.roleCode === "SUPER_ADMIN" || ctx.roleCode === "PROJECT_MANAGER";
      const canApproveContent =
        isAdminOrPm ||
        hasPermission(
          ctx.permissions,
          PERMISSIONS.SOCIAL_CONTENT_APPROVE,
          ctx.roleCode
        );
      const plannedPublishChanged =
        input.plannedPublishAt !== undefined &&
        (nextPlannedPublishAt?.getTime() ?? null) !==
          (existing.plannedPublishAt?.getTime() ?? null);

      if (
        existing.status === ContentStatus.PUBLISHED &&
        plannedPublishChanged &&
        !canApproveContent
      ) {
        throw new DomainError(
          "FORBIDDEN",
          "Jadwal konten yang sudah PUBLISHED hanya dapat dikoreksi oleh PM atau Super Admin."
        );
      }

      if (input.creatorId && input.creatorId !== existing.creatorId) {
        const creator = await tx.user.findFirst({
          where: { id: input.creatorId, deletedAt: null, isActive: true },
          select: { id: true },
        });
        if (!creator) {
          throw new DomainError("NOT_FOUND", "PIC Creator tidak ditemukan.");
        }
      }

      const nextItem = await tx.contentItem.update({
        where: { id: existing.id },
        data: {
          ...(input.title !== undefined ? { title: input.title } : {}),
          ...(input.platform !== undefined ? { platform: input.platform } : {}),
          ...(input.contentFormat !== undefined
            ? { contentFormat: input.contentFormat }
            : {}),
          ...(input.contentPillar !== undefined
            ? { contentPillar: input.contentPillar?.trim() || null }
            : {}),
          ...(input.campaignName !== undefined
            ? { campaignName: input.campaignName?.trim() || null }
            : {}),
          ...(input.caption !== undefined ? { caption: input.caption } : {}),
          ...(input.hashtags !== undefined ? { hashtags: input.hashtags } : {}),
          ...(input.ctaText !== undefined
            ? { ctaText: input.ctaText?.trim() || null }
            : {}),
          ...(input.creatorId !== undefined ? { creatorId: input.creatorId } : {}),
          ...(input.plannedPublishAt !== undefined
            ? { plannedPublishAt: nextPlannedPublishAt }
            : {}),
          ...(input.requiresDesign !== undefined
            ? { requiresDesign: input.requiresDesign }
            : {}),
        },
      });

      const prodTask = existing.tasks[0];
      if (
        prodTask &&
        prodTask.status !== TaskStatus.DONE &&
        prodTask.status !== TaskStatus.CANCELLED
      ) {
        const syncedDueDate = nextPlannedPublishAt
          ? new Date(nextPlannedPublishAt.getTime() - 24 * 60 * 60 * 1000)
          : null;

        await tx.task.update({
          where: { id: prodTask.id },
          data: {
            title: `[Konten] ${nextItem.title}`.slice(0, 200),
            assigneeId: nextItem.creatorId,
            ...(input.plannedPublishAt !== undefined
              ? { dueDate: syncedDueDate }
              : {}),
            version: { increment: 1 },
          },
        });
      }

      return {
        result: {
          id: nextItem.id,
          title: nextItem.title,
          status: nextItem.status,
          plannedPublishAt: nextItem.plannedPublishAt?.toISOString() ?? null,
        },
        audit: {
          module: "SOCIAL_DESIGN" as const,
          action: "social:content:updated",
          entityType: "CONTENT_ITEM",
          entityId: nextItem.id,
          summary: `Detail content plan diperbarui: ${nextItem.title}`,
          oldValues: {
            title: existing.title,
            platform: existing.platform,
            creatorId: existing.creatorId,
            plannedPublishAt: existing.plannedPublishAt?.toISOString() ?? null,
          },
          newValues: {
            title: nextItem.title,
            platform: nextItem.platform,
            creatorId: nextItem.creatorId,
            plannedPublishAt: nextItem.plannedPublishAt?.toISOString() ?? null,
          },
        },
      };
    });

    revalidatePath("/content/planner");
    revalidatePath("/content/calendar");
    revalidatePath("/tasks/board");
    revalidatePath("/tasks/my-tasks");
    revalidatePath("/tasks/calendar");

    return {
      data: updated,
      message: "Content plan berhasil diperbarui.",
    };
  },
});

export const updateContentScheduleAction = createProtectedAction({
  permission: PERMISSIONS.SOCIAL_CONTENT_MANAGE,
  schema: updateContentScheduleSchema,
  handler: async ({ ctx, input }) => {
    const result = await updateContentScheduleAtomic(ctx, {
      contentItemId: input.contentItemId,
      targetStatus: input.targetStatus,
      hasPlannedPublishAt: input.plannedPublishAt !== undefined,
      plannedPublishAt: input.plannedPublishAt
        ? new Date(input.plannedPublishAt)
        : null,
      hasCaption: input.caption !== undefined,
      caption: input.caption ?? null,
      publishedUrl: input.publishedUrl ?? undefined,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
    });

    revalidatePath("/content/calendar");
    revalidatePath("/content/planner");
    revalidatePath("/content/analytics");
    revalidatePath("/tasks/board");
    revalidatePath("/tasks/my-tasks");
    revalidatePath("/tasks/calendar");

    return {
      data: result,
      message:
        result.status === ContentStatus.PUBLISHED
          ? "Konten ditandai Published dan linked task CONTENT_PRODUCTION otomatis selesai (DONE)."
          : "Jadwal & status konten berhasil diperbarui.",
    };
  },
});

export const deleteContentPlanAction = createProtectedAction({
  permission: PERMISSIONS.SOCIAL_CONTENT_DELETE,
  schema: deleteContentPlanSchema,
  handler: async ({ ctx, input }) => {
    const data = await executeAuditedMutation(ctx, async (tx) => {
      const existing = await tx.contentItem.findFirst({
        where: { id: input.contentItemId, deletedAt: null },
        include: {
          tasks: {
            where: { deletedAt: null },
            select: { id: true, taskType: true },
          },
        },
      });

      if (!existing) {
        throw new DomainError("NOT_FOUND", "Content plan tidak ditemukan.");
      }

      const now = new Date();
      await tx.contentItem.update({
        where: { id: existing.id },
        data: { deletedAt: now },
      });

      const detachedProduction = await tx.task.updateMany({
        where: {
          contentItemId: existing.id,
          taskType: TaskType.CONTENT_PRODUCTION,
          deletedAt: null,
        },
        data: {
          contentItemId: null,
          taskType: TaskType.GENERAL,
        },
      });

      await tx.task.updateMany({
        where: {
          contentItemId: existing.id,
          deletedAt: null,
        },
        data: {
          contentItemId: null,
        },
      });

      await tx.designBrief.updateMany({
        where: {
          contentItemId: existing.id,
          deletedAt: null,
        },
        data: {
          contentItemId: null,
        },
      });

      return {
        result: {
          id: existing.id,
          detachedTaskCount: existing.tasks.length,
          detachedProductionCount: detachedProduction.count,
          deletedAt: now.toISOString(),
        },
        audit: {
          module: "SOCIAL_DESIGN" as const,
          action: "social:content:deleted",
          entityType: "CONTENT_ITEM",
          entityId: existing.id,
          summary: `Content plan dihapus: ${existing.title}`,
          oldValues: {
            status: existing.status,
            platform: existing.platform,
            deletedAt: null,
          },
          newValues: {
            deletedAt: now.toISOString(),
            detachedTaskCount: existing.tasks.length,
          },
        },
      };
    });

    revalidatePath("/content/planner");
    revalidatePath("/content/calendar");
    revalidatePath("/content/analytics");
    revalidatePath("/design/workspace");
    revalidatePath("/tasks/board");
    revalidatePath("/tasks/my-tasks");
    revalidatePath("/tasks/calendar");
    revalidatePath("/");

    return {
      data,
      message:
        data.detachedTaskCount > 0
          ? `Content plan dihapus dan ${data.detachedTaskCount} task terkait dilepas sebagai task umum.`
          : "Content plan berhasil dihapus.",
    };
  },
});
