"use server";

import { revalidatePath } from "next/cache";
import {
  ContentFormat,
  ContentIdeaStatus,
  NotificationType,
} from "@prisma/client";
import {
  convertIdeaToPlanSchema,
  createContentIdeaSchema,
  deleteContentIdeaSchema,
  reviewContentIdeaSchema,
  toggleIdeaUpvoteSchema,
} from "@/features/social-design/schemas/content.schema";
import { createContentPlanAtomic } from "@/features/social-design/services/content-workflow.service";
import type { CreateContentPlanOutput } from "@/features/social-design/types";
import {
  hasAnyPermission,
  hasPermission,
  PERMISSIONS,
} from "@/lib/constants/permissions";
import { createProtectedAction } from "@/server/actions/safe-action";
import { prisma } from "@/server/db/prisma";
import { executeAuditedMutation } from "@/server/services/audit-logger";
import { DomainError } from "@/types/action-result";

const IDEA_TX_OPTIONS = {
  maxWait: 10_000,
  timeout: 25_000,
} as const;

export const createContentIdeaAction = createProtectedAction({
  permission: PERMISSIONS.SOCIAL_IDEA_CREATE,
  schema: createContentIdeaSchema,
  handler: async ({ ctx, input }) => {
    const data = await executeAuditedMutation(ctx, async (tx) => {
      const project = await tx.project.findFirst({
        where: { id: input.projectId, deletedAt: null },
        select: { id: true, name: true },
      });
      if (!project) {
        throw new DomainError("NOT_FOUND", "Proyek tidak ditemukan.");
      }

      const idea = await tx.contentIdea.create({
        data: {
          projectId: input.projectId,
          title: input.title,
          description: input.description,
          targetPlatform: input.targetPlatform,
          contentPillar: input.contentPillar?.trim() || null,
          referenceUrls: input.referenceUrls,
          status: ContentIdeaStatus.IDEA,
          upvotedByUserIds: [ctx.userId],
          proposedBy: ctx.userId,
        },
      });

      const managers = await tx.user.findMany({
        where: {
          deletedAt: null,
          isActive: true,
          role: { code: { in: ["PROJECT_MANAGER", "SUPER_ADMIN"] } },
        },
        select: { id: true },
      });

      return {
        result: {
          id: idea.id,
          title: idea.title,
          status: idea.status,
          createdAt: idea.createdAt.toISOString(),
          proposerName: ctx.fullName,
        },
        audit: {
          module: "SOCIAL_DESIGN" as const,
          action: "social:idea:created",
          entityType: "CONTENT_IDEA",
          entityId: idea.id,
          summary: `Ide konten baru diajukan: ${idea.title} (${idea.targetPlatform})`,
          newValues: {
            id: idea.id,
            projectId: idea.projectId,
            targetPlatform: idea.targetPlatform,
            contentPillar: idea.contentPillar,
          },
        },
        notifications: managers.map((mgr) => ({
          recipientId: mgr.id,
          type: NotificationType.SYSTEM_ALERT,
          title: `Ide Konten Baru: ${idea.title}`,
          message: `${ctx.fullName} mengusulkan ide konten ${idea.targetPlatform} untuk proyek ${project.name}.`,
          entityType: "CONTENT_IDEA",
          entityId: idea.id,
          actionUrl: `/content/ideas`,
        })),
      };
    });

    revalidatePath("/content/ideas");
    return {
      data,
      message: "Ide konten berhasil diajukan ke bank ide.",
    };
  },
});

export const toggleIdeaUpvoteAction = createProtectedAction({
  permission: PERMISSIONS.SOCIAL_IDEA_READ,
  schema: toggleIdeaUpvoteSchema,
  handler: async ({ ctx, input }) => {
    const result = await prisma.$transaction(async (tx) => {
      const idea = await tx.contentIdea.findFirst({
        where: { id: input.ideaId, deletedAt: null },
        select: { id: true, upvotedByUserIds: true },
      });
      if (!idea) {
        throw new DomainError("NOT_FOUND", "Ide konten tidak ditemukan.");
      }

      const alreadyVoted = idea.upvotedByUserIds.includes(ctx.userId);
      const nextVotes = alreadyVoted
        ? idea.upvotedByUserIds.filter((id) => id !== ctx.userId)
        : [...idea.upvotedByUserIds, ctx.userId];

      await tx.contentIdea.update({
        where: { id: idea.id },
        data: { upvotedByUserIds: nextVotes },
      });

      return {
        ideaId: idea.id,
        hasUpvoted: !alreadyVoted,
        upvoteCount: nextVotes.length,
      };
    }, IDEA_TX_OPTIONS);

    revalidatePath("/content/ideas");
    return {
      data: result,
      message: result.hasUpvoted
        ? "Dukungan (upvote) ditambahkan."
        : "Dukungan (upvote) dibatalkan.",
    };
  },
});

export const reviewContentIdeaAction = createProtectedAction({
  permission: PERMISSIONS.SOCIAL_IDEA_APPROVE,
  schema: reviewContentIdeaSchema,
  handler: async ({ ctx, input }) => {
    const data = await executeAuditedMutation(ctx, async (tx) => {
      const idea = await tx.contentIdea.findFirst({
        where: { id: input.ideaId, deletedAt: null },
      });
      if (!idea) {
        throw new DomainError("NOT_FOUND", "Ide konten tidak ditemukan.");
      }
      if (idea.status === ContentIdeaStatus.CONVERTED) {
        throw new DomainError(
          "INVALID_STATE_TRANSITION",
          "Ide yang sudah dikonversi ke Content Plan tidak dapat direview ulang."
        );
      }

      const nextStatus =
        input.decision === "APPROVE"
          ? ContentIdeaStatus.APPROVED_IDEA
          : ContentIdeaStatus.ARCHIVED;

      const now = new Date();
      const updated = await tx.contentIdea.update({
        where: { id: idea.id },
        data: {
          status: nextStatus,
          reviewedBy: ctx.userId,
          reviewNotes: input.reviewNotes?.trim() || null,
          reviewedAt: now,
        },
      });

      return {
        result: {
          id: updated.id,
          status: updated.status,
          reviewedAt: updated.reviewedAt?.toISOString() ?? null,
        },
        audit: {
          module: "SOCIAL_DESIGN" as const,
          action:
            input.decision === "APPROVE"
              ? "social:idea:approved"
              : "social:idea:archived",
          entityType: "CONTENT_IDEA",
          entityId: updated.id,
          summary: `Ide konten ${input.decision === "APPROVE" ? "disetujui" : "diarsipkan"}: ${updated.title}`,
          oldValues: { status: idea.status },
          newValues: {
            status: updated.status,
            reviewNotes: updated.reviewNotes,
          },
        },
        notifications: [
          {
            recipientId: idea.proposedBy,
            type: NotificationType.CONTENT_IDEA_REVIEWED,
            title:
              input.decision === "APPROVE"
                ? `Ide Disetujui: ${idea.title}`
                : `Ide Diarsipkan: ${idea.title}`,
            message:
              input.decision === "APPROVE"
                ? `${ctx.fullName} menyetujui ide konten Anda dan siap dipromosikan ke Content Plan.`
                : `${ctx.fullName} mengarsipkan ide Anda: "${updated.reviewNotes ?? "-"}"`,
            entityType: "CONTENT_IDEA",
            entityId: idea.id,
            actionUrl: `/content/ideas`,
          },
        ],
      };
    });

    revalidatePath("/content/ideas");
    return {
      data,
      message:
        input.decision === "APPROVE"
          ? "Ide konten disetujui."
          : "Ide konten diarsipkan.",
    };
  },
});

export const convertIdeaToPlanAction = createProtectedAction({
  permission: PERMISSIONS.SOCIAL_CONTENT_MANAGE,
  schema: convertIdeaToPlanSchema,
  handler: async ({ ctx, input }): Promise<{ data: CreateContentPlanOutput; message: string }> => {
    const idea = await prisma.contentIdea.findFirst({
      where: { id: input.ideaId, deletedAt: null },
    });

    if (!idea) {
      throw new DomainError("NOT_FOUND", "Ide konten tidak ditemukan.");
    }

    if (
      idea.status === ContentIdeaStatus.IDEA &&
      !hasPermission(ctx.permissions, PERMISSIONS.SOCIAL_IDEA_APPROVE, ctx.roleCode)
    ) {
      throw new DomainError(
        "FORBIDDEN",
        "Ide masih berstatus Menunggu Kurasi. Hanya Project Manager atau Super Admin yang dapat mempromosikan ide sebelum disetujui."
      );
    }

    if (
      idea.status === ContentIdeaStatus.CONVERTED ||
      idea.status === ContentIdeaStatus.ARCHIVED
    ) {
      throw new DomainError(
        "INVALID_STATE_TRANSITION",
        "Ide ini sudah dikonversi atau telah diarsipkan."
      );
    }

    const requiresDesign = input.requiresDesign ?? Boolean(input.designBrief);
    if (
      requiresDesign &&
      !hasPermission(ctx.permissions, PERMISSIONS.DESIGN_BRIEF_MANAGE, ctx.roleCode)
    ) {
      throw new DomainError(
        "FORBIDDEN",
        "Anda tidak memiliki izin untuk membuat Design Brief."
      );
    }

    const plannedPublishAt = input.plannedPublishAt
      ? new Date(input.plannedPublishAt)
      : null;

    const output = await createContentPlanAtomic(ctx, {
      projectId: input.projectId ?? idea.projectId,
      ideaId: idea.id,
      title: input.title ?? idea.title,
      platform: input.platform ?? idea.targetPlatform,
      contentFormat: input.contentFormat ?? ContentFormat.CAROUSEL,
      contentPillar: input.contentPillar ?? idea.contentPillar,
      campaignName: input.campaignName ?? null,
      caption: input.caption ?? idea.description ?? null,
      hashtags: input.hashtags ?? [],
      ctaText: input.ctaText ?? null,
      creatorId: input.creatorId ?? idea.proposedBy,
      plannedPublishAt,
      requiresDesign,
      designBrief: requiresDesign
        ? {
            title: input.designBrief?.title?.trim() || null,
            objective:
              input.designBrief?.objective ??
              idea.description ??
              `Desain visual untuk konten ${idea.title}`,
            dimensionsSpec: input.designBrief?.dimensionsSpec ?? null,
            copyText: input.designBrief?.copyText ?? null,
            brandGuidelinesNotes:
              input.designBrief?.brandGuidelinesNotes ?? null,
            referenceLinks: input.designBrief?.referenceLinks ?? [],
            assignedDesignerId: input.designBrief?.assignedDesignerId ?? null,
            dueDate: input.designBrief?.dueDate
              ? new Date(input.designBrief.dueDate)
              : null,
          }
        : null,
    });

    revalidatePath("/content/ideas");
    revalidatePath("/content/planner");
    revalidatePath("/content/calendar");
    revalidatePath("/design/workspace");
    revalidatePath("/tasks/board");
    revalidatePath("/tasks/my-tasks");
    revalidatePath("/tasks/calendar");

    return {
      data: output,
      message: `Ide dipromosikan ke Content Plan dan ${output.spawnedTasks.length} task otomatis dibuat.`,
    };
  },
});

export const deleteContentIdeaAction = createProtectedAction({
  permission: null,
  schema: deleteContentIdeaSchema,
  handler: async ({ ctx, input }) => {
    if (
      !hasAnyPermission(
        ctx.permissions,
        [PERMISSIONS.SOCIAL_IDEA_CREATE, PERMISSIONS.SOCIAL_CONTENT_DELETE],
        ctx.roleCode
      )
    ) {
      throw new DomainError(
        "FORBIDDEN",
        "Anda tidak memiliki izin untuk menghapus ide konten."
      );
    }

    const data = await executeAuditedMutation(ctx, async (tx) => {
      const existing = await tx.contentIdea.findFirst({
        where: { id: input.ideaId, deletedAt: null },
      });

      if (!existing) {
        throw new DomainError("NOT_FOUND", "Ide konten tidak ditemukan.");
      }

      const canDeleteAny = hasPermission(
        ctx.permissions,
        PERMISSIONS.SOCIAL_CONTENT_DELETE,
        ctx.roleCode
      );
      const canDeleteOwnDraft =
        existing.proposedBy === ctx.userId &&
        existing.status === ContentIdeaStatus.IDEA &&
        hasPermission(
          ctx.permissions,
          PERMISSIONS.SOCIAL_IDEA_CREATE,
          ctx.roleCode
        );

      if (!canDeleteAny && !canDeleteOwnDraft) {
        throw new DomainError(
          "FORBIDDEN",
          "Anda hanya dapat menghapus ide Anda sendiri yang masih berstatus Kurasi (IDEA), atau memerlukan izin social:content:delete."
        );
      }

      const now = new Date();
      await tx.contentIdea.update({
        where: { id: existing.id },
        data: { deletedAt: now },
      });

      return {
        result: { id: existing.id, deletedAt: now.toISOString() },
        audit: {
          module: "SOCIAL_DESIGN" as const,
          action: "social:idea:deleted",
          entityType: "CONTENT_IDEA",
          entityId: existing.id,
          summary: `Ide konten dihapus: ${existing.title}`,
          oldValues: {
            status: existing.status,
            deletedAt: null,
          },
          newValues: {
            deletedAt: now.toISOString(),
          },
        },
      };
    });

    revalidatePath("/content/ideas");
    revalidatePath("/content/planner");
    revalidatePath("/");

    return {
      data,
      message: "Ide konten berhasil dihapus.",
    };
  },
});
