import {
  AssetCategory,
  ContentIdeaStatus,
  ContentStatus,
  DesignReviewDecision,
  DesignSubmissionStatus,
  NotificationType,
  Prisma,
  TaskPriority,
  TaskStatus,
  TaskType,
  type AssetSourceType,
  type ContentFormat,
  type SocialPlatform,
} from "@prisma/client";
import { spawnLinkedTask } from "@/features/tasks/services/task.service";
import {
  ASSET_SOURCE_TYPE_META,
  CONTENT_FORMAT_META,
  SOCIAL_PLATFORM_META,
} from "@/features/social-design/constants";
import type {
  CreateContentPlanOutput,
  ReviewDesignSubmissionOutput,
} from "@/features/social-design/types";
import { computeEffectiveIsOnTime } from "@/features/social-design/utils";
import { hasPermission, PERMISSIONS } from "@/lib/constants/permissions";
import { validateSafeExternalHttpsUrl } from "@/lib/validations/common";
import type { AuthContext } from "@/server/auth/rbac";
import { prisma } from "@/server/db/prisma";
import { writeAuditLog } from "@/server/services/audit-logger";
import { dispatchNotifications } from "@/server/services/notification-dispatcher";
import { validateStorageKeyPath } from "@/server/storage/presigned";
import { DomainError } from "@/types/action-result";

if (typeof window !== "undefined") {
  throw new Error("content-workflow.service must only be imported on the server.");
}

const WORKFLOW_TX_OPTIONS = {
  maxWait: 10_000,
  timeout: 25_000,
} as const;

function formatDesignBriefTitle(rawTitle: string): string {
  const cleaned = rawTitle.trim().replace(/^(?:Brief:\s*)+/i, "");
  return `Brief: ${cleaned || rawTitle.trim()}`.slice(0, 200);
}

export interface CreateContentPlanServiceInput {
  projectId: string;
  ideaId?: string | null;
  title: string;
  platform: SocialPlatform;
  contentFormat: ContentFormat;
  contentPillar?: string | null;
  campaignName?: string | null;
  caption?: string | null;
  hashtags?: string[];
  ctaText?: string | null;
  creatorId: string;
  plannedPublishAt?: Date | null;
  requiresDesign: boolean;
  designBrief?: {
    title?: string | null;
    objective: string;
    dimensionsSpec?: string | null;
    copyText?: string | null;
    brandGuidelinesNotes?: string | null;
    referenceLinks?: string[];
    assignedDesignerId?: string | null;
    dueDate?: Date | null;
  } | null;
}

export interface AssignDesignBriefServiceInput {
  briefId?: string;
  contentItemId?: string | null;
  projectId: string;
  title: string;
  objective: string;
  dimensionsSpec?: string | null;
  copyText?: string | null;
  brandGuidelinesNotes?: string | null;
  referenceLinks?: string[];
  assignedDesignerId: string;
  dueDate?: Date | null;
}

export interface SubmitDesignServiceInput {
  designBriefId: string;
  sourceType: AssetSourceType;
  storageKey?: string | null;
  externalUrl?: string | null;
  fileName: string;
  mimeType?: string | null;
  fileSizeBytes?: number | null;
  designerNotes?: string | null;
}

export interface ReviewDesignServiceInput {
  submissionId: string;
  decision: DesignReviewDecision;
  feedback: string;
  revisionChecklist?: string[];
  revisionDueDate?: Date | null;
  promoteToAssetLibrary?: boolean;
  assetTags?: string[];
}

export interface UpdateContentScheduleServiceInput {
  contentItemId: string;
  targetStatus?: ContentStatus;
  plannedPublishAt?: Date | null;
  hasPlannedPublishAt?: boolean;
  caption?: string | null;
  hasCaption?: boolean;
  publishedUrl?: string | null;
  publishedAt?: Date | null;
}

function computeDefaultContentDueDate(plannedPublishAt: Date | null): Date | null {
  if (!plannedPublishAt) return null;
  return new Date(plannedPublishAt.getTime() - 24 * 60 * 60 * 1000);
}

async function resolveReviewerAndPmRecipients(
  db: Pick<Prisma.TransactionClient, "user">,
  extraIds: Array<string | null | undefined>
): Promise<string[]> {
  const managers = await db.user.findMany({
    where: {
      deletedAt: null,
      isActive: true,
      role: {
        code: {
          in: ["SUPER_ADMIN", "PROJECT_MANAGER"],
        },
      },
    },
    select: { id: true },
  });

  const ids = new Set<string>();
  for (const id of extraIds) {
    if (id) ids.add(id);
  }
  for (const mgr of managers) {
    ids.add(mgr.id);
  }
  return Array.from(ids);
}

export async function createContentPlanAtomic(
  ctx: AuthContext,
  input: CreateContentPlanServiceInput
): Promise<CreateContentPlanOutput> {
  if (
    input.requiresDesign &&
    input.designBrief?.dueDate &&
    input.plannedPublishAt &&
    input.designBrief.dueDate.getTime() > input.plannedPublishAt.getTime()
  ) {
    throw new DomainError(
      "VALIDATION_ERROR",
      "Deadline desain tidak boleh lebih lambat dari rencana jadwal tayang konten."
    );
  }

  const requestedDesignerId =
    input.requiresDesign && input.designBrief?.assignedDesignerId
      ? input.designBrief.assignedDesignerId
      : null;

  const [project, creator, designer, sourceIdea] = await Promise.all([
    prisma.project.findFirst({
      where: { id: input.projectId, deletedAt: null },
      select: { id: true, name: true },
    }),
    prisma.user.findFirst({
      where: { id: input.creatorId, deletedAt: null, isActive: true },
      select: { id: true, fullName: true },
    }),
    requestedDesignerId
      ? prisma.user.findFirst({
          where: {
            id: requestedDesignerId,
            deletedAt: null,
            isActive: true,
          },
          select: { id: true },
        })
      : Promise.resolve(null),
    input.ideaId
      ? prisma.contentIdea.findFirst({
          where: { id: input.ideaId, deletedAt: null },
          select: {
            id: true,
            title: true,
            status: true,
            proposedBy: true,
            reviewedBy: true,
            reviewedAt: true,
          },
        })
      : Promise.resolve(null),
  ]);

  if (!project) {
    throw new DomainError("NOT_FOUND", "Proyek yang dipilih tidak ditemukan.");
  }

  if (!creator) {
    throw new DomainError("NOT_FOUND", "PIC Creator tidak ditemukan atau nonaktif.");
  }

  if (requestedDesignerId && !designer) {
    throw new DomainError(
      "NOT_FOUND",
      "Designer yang ditugaskan tidak ditemukan atau nonaktif."
    );
  }

  if (input.ideaId && !sourceIdea) {
    throw new DomainError("NOT_FOUND", "Ide konten sumber tidak ditemukan.");
  }

  if (
    sourceIdea &&
    (sourceIdea.status === ContentIdeaStatus.CONVERTED ||
      sourceIdea.status === ContentIdeaStatus.ARCHIVED)
  ) {
    throw new DomainError(
      "INVALID_STATE_TRANSITION",
      "Ide konten ini sudah dikonversi ke planner atau telah diarsipkan."
    );
  }

  const designerId = designer?.id ?? null;

  return prisma.$transaction(async (tx) => {
    if (sourceIdea) {
      const converted = await tx.contentIdea.updateMany({
        where: {
          id: sourceIdea.id,
          deletedAt: null,
          status: {
            notIn: [ContentIdeaStatus.CONVERTED, ContentIdeaStatus.ARCHIVED],
          },
        },
        data: {
          status: ContentIdeaStatus.CONVERTED,
          reviewedBy: sourceIdea.reviewedBy ?? ctx.userId,
          reviewedAt: sourceIdea.reviewedAt ?? new Date(),
        },
      });
      if (converted.count === 0) {
        throw new DomainError(
          "INVALID_STATE_TRANSITION",
          "Ide konten ini sudah dikonversi ke planner atau telah diarsipkan."
        );
      }
    }

    const initialContentStatus = input.requiresDesign
      ? ContentStatus.IN_DESIGN
      : ContentStatus.PLANNING;

    const createdContent = await tx.contentItem.create({
      data: {
        projectId: input.projectId,
        ideaId: input.ideaId ?? null,
        title: input.title.trim().slice(0, 200),
        platform: input.platform,
        contentFormat: input.contentFormat,
        contentPillar: input.contentPillar?.trim() || null,
        campaignName: input.campaignName?.trim() || null,
        status: initialContentStatus,
        requiresDesign: input.requiresDesign,
        caption: input.caption ?? null,
        hashtags: input.hashtags ?? [],
        ctaText: input.ctaText?.trim() || null,
        creatorId: input.creatorId,
        plannedPublishAt: input.plannedPublishAt ?? null,
      },
    });

    const spawnedTasks: CreateContentPlanOutput["spawnedTasks"] = [];

    const contentTaskDueDate = computeDefaultContentDueDate(
      input.plannedPublishAt ?? null
    );
    const contentTask = await spawnLinkedTask(tx, {
      projectId: input.projectId,
      title: `[Konten] ${createdContent.title}`,
      description:
        createdContent.caption?.slice(0, 500) ||
        `Produksi konten ${SOCIAL_PLATFORM_META[createdContent.platform].label} (${CONTENT_FORMAT_META[createdContent.contentFormat].label}).`,
      taskType: TaskType.CONTENT_PRODUCTION,
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      requiresReview: false,
      assigneeId: input.creatorId,
      reporterId: ctx.userId,
      actorId: ctx.userId,
      contentItemId: createdContent.id,
      dueDate: contentTaskDueDate,
      tags: [createdContent.platform, createdContent.contentFormat],
      actionUrl: `/content/calendar`,
      auditModule: "SOCIAL_DESIGN",
    });

    spawnedTasks.push({
      taskId: contentTask.id,
      taskCode: contentTask.taskCode,
      taskType: "CONTENT_PRODUCTION",
      assigneeId: contentTask.assigneeId,
      status: contentTask.status,
      dueDate: contentTask.dueDate?.toISOString() ?? null,
    });

    let createdBriefId: string | null = null;

    if (input.requiresDesign) {
      const briefSpec = input.designBrief;
      const briefTitle = briefSpec?.title?.trim()
        ? briefSpec.title.trim().slice(0, 200)
        : formatDesignBriefTitle(createdContent.title);
      const briefObjective =
        briefSpec?.objective?.trim() ||
        `Desain visual untuk konten ${createdContent.title} (${SOCIAL_PLATFORM_META[createdContent.platform].label}).`;
      const designDueDate =
        briefSpec?.dueDate ?? contentTaskDueDate ?? input.plannedPublishAt ?? null;

      const createdBrief = await tx.designBrief.create({
        data: {
          projectId: input.projectId,
          contentItemId: createdContent.id,
          title: briefTitle,
          objective: briefObjective,
          dimensionsSpec: briefSpec?.dimensionsSpec?.trim() || null,
          copyText: briefSpec?.copyText ?? null,
          brandGuidelinesNotes: briefSpec?.brandGuidelinesNotes ?? null,
          referenceLinks: briefSpec?.referenceLinks ?? [],
          status: DesignSubmissionStatus.PENDING_BRIEF,
          requestedBy: ctx.userId,
          assignedDesignerId: designerId,
          dueDate: designDueDate,
        },
      });

      createdBriefId = createdBrief.id;

      const designTask = await spawnLinkedTask(tx, {
        projectId: input.projectId,
        title: `[Desain] ${createdBrief.title}`,
        description: createdBrief.objective,
        taskType: TaskType.DESIGN_TASK,
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        requiresReview: true,
        assigneeId: designerId,
        reporterId: ctx.userId,
        actorId: ctx.userId,
        reviewerId: ctx.userId,
        contentItemId: createdContent.id,
        designBriefId: createdBrief.id,
        dueDate: designDueDate,
        tags: [createdContent.platform, createdContent.contentFormat, "DESIGN"],
        actionUrl: `/design/workspace?briefId=${createdBrief.id}`,
        auditModule: "SOCIAL_DESIGN",
      });

      spawnedTasks.push({
        taskId: designTask.id,
        taskCode: designTask.taskCode,
        taskType: "DESIGN_TASK",
        assigneeId: designTask.assigneeId,
        status: designTask.status,
        dueDate: designTask.dueDate?.toISOString() ?? null,
      });
    }

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      module: "SOCIAL_DESIGN",
      action: "social:content:created",
      entityType: "CONTENT_ITEM",
      entityId: createdContent.id,
      summary: `Content plan dibuat: ${createdContent.title} (${createdContent.platform})`,
      newValues: {
        id: createdContent.id,
        projectId: createdContent.projectId,
        ideaId: createdContent.ideaId,
        platform: createdContent.platform,
        contentFormat: createdContent.contentFormat,
        status: createdContent.status,
        requiresDesign: createdContent.requiresDesign,
        designBriefId: createdBriefId,
        plannedPublishAt: createdContent.plannedPublishAt?.toISOString() ?? null,
      },
    });

    if (sourceIdea && sourceIdea.proposedBy !== ctx.userId) {
      await dispatchNotifications(tx, ctx.userId, [
        {
          recipientId: sourceIdea.proposedBy,
          type: NotificationType.CONTENT_IDEA_REVIEWED,
          title: `Ide Dipromosikan ke Content Plan: ${sourceIdea.title}`,
          message: `${ctx.fullName} mengonversi ide Anda menjadi Content Plan di kalender konten.`,
          entityType: "CONTENT_ITEM",
          entityId: createdContent.id,
          actionUrl: `/content/calendar`,
        },
      ]);
      await writeAuditLog(tx, {
        actorId: ctx.userId,
        module: "SOCIAL_DESIGN",
        action: "social:idea:converted",
        entityType: "CONTENT_IDEA",
        entityId: sourceIdea.id,
        summary: `Ide "${sourceIdea.title}" dikonversi menjadi Content Plan`,
        newValues: {
          contentItemId: createdContent.id,
          designBriefId: createdBriefId,
        },
      });
    }

    return {
      contentItem: {
        id: createdContent.id,
        title: createdContent.title,
        status: createdContent.status,
        platform: createdContent.platform,
        plannedPublishAt: createdContent.plannedPublishAt?.toISOString() ?? null,
      },
      designBriefId: createdBriefId,
      spawnedTasks,
    };
  }, WORKFLOW_TX_OPTIONS);
}

export async function assignDesignBriefAtomic(
  ctx: AuthContext,
  input: AssignDesignBriefServiceInput
): Promise<{ briefId: string; taskId: string; taskCode: string; isUpdate: boolean }> {
  const [project, designer, linkedContent] = await Promise.all([
    prisma.project.findFirst({
      where: { id: input.projectId, deletedAt: null },
      select: { id: true },
    }),
    prisma.user.findFirst({
      where: { id: input.assignedDesignerId, deletedAt: null, isActive: true },
      select: { id: true, fullName: true },
    }),
    input.contentItemId
      ? prisma.contentItem.findFirst({
          where: { id: input.contentItemId, deletedAt: null },
          select: {
            id: true,
            title: true,
            status: true,
            creatorId: true,
            platform: true,
            contentFormat: true,
            plannedPublishAt: true,
          },
        })
      : Promise.resolve(null),
  ]);

  if (!input.briefId && !project) {
    throw new DomainError("NOT_FOUND", "Proyek tidak ditemukan.");
  }

  if (!designer) {
    throw new DomainError("NOT_FOUND", "Designer tidak ditemukan atau nonaktif.");
  }

  if (input.contentItemId && !linkedContent) {
    throw new DomainError("NOT_FOUND", "Item konten terkait tidak ditemukan.");
  }

  if (
    linkedContent &&
    input.dueDate &&
    linkedContent.plannedPublishAt &&
    input.dueDate.getTime() > linkedContent.plannedPublishAt.getTime()
  ) {
    throw new DomainError(
      "VALIDATION_ERROR",
      "Deadline desain tidak boleh melewati rencana tayang konten."
    );
  }

  return prisma.$transaction(async (tx) => {

    // Check existing brief (either explicit briefId or active brief on contentItemId)
    const existingBrief = input.briefId
      ? await tx.designBrief.findFirst({
          where: { id: input.briefId, deletedAt: null },
        })
      : input.contentItemId
        ? await tx.designBrief.findFirst({
            where: { contentItemId: input.contentItemId, deletedAt: null },
            orderBy: { createdAt: "desc" },
          })
        : null;

    if (existingBrief) {
      const updatedBrief = await tx.designBrief.update({
        where: { id: existingBrief.id },
        data: {
          title: input.title.trim().slice(0, 200),
          objective: input.objective.trim(),
          dimensionsSpec: input.dimensionsSpec?.trim() || null,
          copyText: input.copyText ?? null,
          brandGuidelinesNotes: input.brandGuidelinesNotes ?? null,
          referenceLinks: input.referenceLinks ?? [],
          assignedDesignerId: designer.id,
          dueDate: input.dueDate ?? existingBrief.dueDate,
        },
      });

      const existingTask = await tx.task.findFirst({
        where: { designBriefId: existingBrief.id, deletedAt: null },
      });

      let taskId = "";
      let taskCode = "";

      if (existingTask) {
        const updatedTask = await tx.task.update({
          where: { id: existingTask.id },
          data: {
            title: `[Desain] ${updatedBrief.title}`.slice(0, 200),
            description: updatedBrief.objective,
            assigneeId: designer.id,
            dueDate: updatedBrief.dueDate,
            version: { increment: 1 },
          },
        });
        taskId = updatedTask.id;
        taskCode = updatedTask.taskCode;

        if (existingBrief.assignedDesignerId !== designer.id) {
          await dispatchNotifications(tx, ctx.userId, [
            {
              recipientId: designer.id,
              type: NotificationType.DESIGN_BRIEF_ASSIGNED,
              title: `Brief Desain Ditugaskan: ${updatedBrief.title}`,
              message: `Anda ditugaskan mengerjakan brief desain "${updatedBrief.title}" (${updatedTask.taskCode}).`,
              entityType: "DESIGN_BRIEF",
              entityId: updatedBrief.id,
              actionUrl: `/design/workspace?briefId=${updatedBrief.id}`,
            },
          ]);
        }
      } else {
        const spawned = await spawnLinkedTask(tx, {
          projectId: project ? updatedBrief.projectId : null,
          title: `[Desain] ${updatedBrief.title}`,
          description: updatedBrief.objective,
          taskType: TaskType.DESIGN_TASK,
          status: TaskStatus.TODO,
          priority: TaskPriority.HIGH,
          requiresReview: true,
          assigneeId: designer.id,
          reporterId: ctx.userId,
          actorId: ctx.userId,
          reviewerId: ctx.userId,
          contentItemId: updatedBrief.contentItemId,
          designBriefId: updatedBrief.id,
          dueDate: updatedBrief.dueDate,
          actionUrl: `/design/workspace?briefId=${updatedBrief.id}`,
          auditModule: "SOCIAL_DESIGN",
        });
        taskId = spawned.id;
        taskCode = spawned.taskCode;
      }

      await writeAuditLog(tx, {
        actorId: ctx.userId,
        module: "SOCIAL_DESIGN",
        action: "design:brief:updated",
        entityType: "DESIGN_BRIEF",
        entityId: updatedBrief.id,
        summary: `Design brief diperbarui: ${updatedBrief.title}`,
        oldValues: {
          assignedDesignerId: existingBrief.assignedDesignerId,
          dueDate: existingBrief.dueDate?.toISOString() ?? null,
        },
        newValues: {
          assignedDesignerId: updatedBrief.assignedDesignerId,
          dueDate: updatedBrief.dueDate?.toISOString() ?? null,
        },
      });

      return { briefId: updatedBrief.id, taskId, taskCode, isUpdate: true };
    }

    // Create new brief
    const createdBrief = await tx.designBrief.create({
      data: {
        projectId: input.projectId,
        contentItemId: input.contentItemId ?? null,
        title: input.title.trim().slice(0, 200),
        objective: input.objective.trim(),
        dimensionsSpec: input.dimensionsSpec?.trim() || null,
        copyText: input.copyText ?? null,
        brandGuidelinesNotes: input.brandGuidelinesNotes ?? null,
        referenceLinks: input.referenceLinks ?? [],
        status: DesignSubmissionStatus.PENDING_BRIEF,
        requestedBy: ctx.userId,
        assignedDesignerId: designer.id,
        dueDate: input.dueDate ?? null,
      },
    });

    if (linkedContent) {
      if (linkedContent.status === ContentStatus.PLANNING) {
        await tx.contentItem.update({
          where: { id: linkedContent.id },
          data: {
            status: ContentStatus.IN_DESIGN,
            requiresDesign: true,
          },
        });
      } else if (!linkedContent.status.startsWith("DESIGN_")) {
        await tx.contentItem.update({
          where: { id: linkedContent.id },
          data: { requiresDesign: true },
        });
      }

      const existingProdTask = await tx.task.findFirst({
        where: {
          contentItemId: linkedContent.id,
          taskType: TaskType.CONTENT_PRODUCTION,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!existingProdTask) {
        await spawnLinkedTask(tx, {
          projectId: input.projectId,
          title: `[Konten] ${linkedContent.title}`,
          taskType: TaskType.CONTENT_PRODUCTION,
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
          requiresReview: false,
          assigneeId: linkedContent.creatorId,
          reporterId: ctx.userId,
          actorId: ctx.userId,
          contentItemId: linkedContent.id,
          dueDate: computeDefaultContentDueDate(linkedContent.plannedPublishAt),
          tags: [linkedContent.platform, linkedContent.contentFormat],
          actionUrl: `/content/calendar`,
          auditModule: "SOCIAL_DESIGN",
        });
      }
    }

    const designTask = await spawnLinkedTask(tx, {
      projectId: input.projectId,
      title: `[Desain] ${createdBrief.title}`,
      description: createdBrief.objective,
      taskType: TaskType.DESIGN_TASK,
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      requiresReview: true,
      assigneeId: designer.id,
      reporterId: ctx.userId,
      actorId: ctx.userId,
      reviewerId: ctx.userId,
      contentItemId: input.contentItemId ?? null,
      designBriefId: createdBrief.id,
      dueDate: createdBrief.dueDate,
      tags: ["DESIGN"],
      actionUrl: `/design/workspace?briefId=${createdBrief.id}`,
      auditModule: "SOCIAL_DESIGN",
    });

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      module: "SOCIAL_DESIGN",
      action: "design:brief:created",
      entityType: "DESIGN_BRIEF",
      entityId: createdBrief.id,
      summary: `Design brief baru dibuat & ditugaskan ke ${designer.fullName}: ${createdBrief.title}`,
      newValues: {
        briefId: createdBrief.id,
        assignedDesignerId: designer.id,
        contentItemId: createdBrief.contentItemId,
        dueDate: createdBrief.dueDate?.toISOString() ?? null,
      },
    });

    return {
      briefId: createdBrief.id,
      taskId: designTask.id,
      taskCode: designTask.taskCode,
      isUpdate: false,
    };
  }, WORKFLOW_TX_OPTIONS);
}

export async function startDesignBriefAtomic(
  ctx: AuthContext,
  designBriefId: string
): Promise<{ briefId: string; status: DesignSubmissionStatus }> {
  const brief = await prisma.designBrief.findFirst({
    where: { id: designBriefId, deletedAt: null },
  });
  if (!brief) {
    throw new DomainError("NOT_FOUND", "Design brief tidak ditemukan.");
  }

  if (
    ctx.roleCode === "DESIGNER" &&
    brief.assignedDesignerId !== ctx.userId
  ) {
    throw new DomainError(
      "FORBIDDEN",
      "Anda hanya dapat memulai brief desain yang ditugaskan kepada Anda."
    );
  }

  if (brief.status !== DesignSubmissionStatus.PENDING_BRIEF) {
    throw new DomainError(
      "INVALID_STATE_TRANSITION",
      "Brief ini sudah dimulai atau sedang dalam proses review/selesai."
    );
  }

  return prisma.$transaction(async (tx) => {
    const updatedCount = await tx.designBrief.updateMany({
      where: {
        id: brief.id,
        deletedAt: null,
        status: DesignSubmissionStatus.PENDING_BRIEF,
      },
      data: { status: DesignSubmissionStatus.IN_PROGRESS },
    });

    if (updatedCount.count === 0) {
      throw new DomainError(
        "INVALID_STATE_TRANSITION",
        "Brief ini sudah dimulai atau sedang dalam proses review/selesai."
      );
    }

    const linkedTask = await tx.task.findFirst({
      where: { designBriefId: brief.id, deletedAt: null },
      select: { id: true, startedAt: true },
    });
    if (linkedTask) {
      await tx.task.update({
        where: { id: linkedTask.id },
        data: {
          status: TaskStatus.IN_PROGRESS,
          startedAt: linkedTask.startedAt ?? new Date(),
          version: { increment: 1 },
        },
      });
    }

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      module: "SOCIAL_DESIGN",
      action: "design:brief:started",
      entityType: "DESIGN_BRIEF",
      entityId: brief.id,
      summary: `Pengerjaan desain dimulai: ${brief.title}`,
      oldValues: { status: brief.status },
      newValues: { status: DesignSubmissionStatus.IN_PROGRESS },
    });

    return { briefId: brief.id, status: DesignSubmissionStatus.IN_PROGRESS };
  }, WORKFLOW_TX_OPTIONS);
}

export async function submitDesignVersionAtomic(
  ctx: AuthContext,
  input: SubmitDesignServiceInput
): Promise<{
  submissionId: string;
  designBriefId: string;
  versionNumber: number;
  status: DesignSubmissionStatus;
}> {
  let resolvedFileUrl = "";
  let resolvedStorageKey: string | null = null;

  if (input.sourceType === "UPLOAD") {
    const rawKey = input.storageKey?.trim() ?? "";
    const parsedKey = validateStorageKeyPath(rawKey);
    if (!parsedKey) {
      throw new DomainError(
        "VALIDATION_ERROR",
        "storageKey file tidak valid atau gagal validasi keamanan."
      );
    }
    resolvedStorageKey = rawKey;
    resolvedFileUrl = `/api/uploads/download-url?storageKey=${encodeURIComponent(rawKey)}`;
  } else {
    const check = validateSafeExternalHttpsUrl(input.externalUrl ?? "");
    if (!check.valid || !check.normalizedUrl) {
      throw new DomainError(
        "VALIDATION_ERROR",
        check.error ?? "Tautan eksternal wajib menggunakan HTTPS publik yang valid."
      );
    }
    resolvedFileUrl = check.normalizedUrl;
  }

  const baseManagerRecipientIds = await resolveReviewerAndPmRecipients(prisma, []);

  return prisma.$transaction(async (tx) => {
    const lockedRows = await tx.$queryRaw<
      Array<{
        id: string;
        title: string;
        status: DesignSubmissionStatus;
        current_version: number;
        assigned_designer_id: string | null;
        requested_by: string;
        content_item_id: string | null;
        project_id: string;
      }>
    >`
      SELECT
        id,
        title,
        status,
        current_version,
        assigned_designer_id,
        requested_by,
        content_item_id,
        project_id
      FROM design_briefs
      WHERE id = ${input.designBriefId}::uuid
        AND deleted_at IS NULL
      FOR UPDATE
    `;

    const brief = lockedRows[0];
    if (!brief) {
      throw new DomainError("NOT_FOUND", "Design brief tidak ditemukan.");
    }

    if (
      ctx.roleCode === "DESIGNER" &&
      brief.assigned_designer_id !== ctx.userId
    ) {
      throw new DomainError(
        "FORBIDDEN",
        "Anda hanya dapat mengumpulkan desain untuk brief yang ditugaskan kepada Anda."
      );
    }

    if (
      brief.status !== DesignSubmissionStatus.PENDING_BRIEF &&
      brief.status !== DesignSubmissionStatus.IN_PROGRESS &&
      brief.status !== DesignSubmissionStatus.REVISION_REQUESTED
    ) {
      throw new DomainError(
        "INVALID_STATE_TRANSITION",
        `Brief berstatus ${brief.status} tidak dapat menerima submission baru saat ini.`
      );
    }

    const nextVersion = brief.current_version + 1;
    const now = new Date();

    const submission = await tx.designSubmission.create({
      data: {
        designBriefId: brief.id,
        versionNumber: nextVersion,
        submittedBy: ctx.userId,
        status: DesignSubmissionStatus.SUBMITTED,
        sourceType: input.sourceType,
        fileUrl: resolvedFileUrl,
        storageKey: resolvedStorageKey,
        mimeType: input.mimeType ?? null,
        fileSizeBytes:
          input.fileSizeBytes != null ? BigInt(input.fileSizeBytes) : null,
        designerNotes: input.designerNotes?.trim() || null,
        submittedAt: now,
      },
    });

    await tx.designBrief.update({
      where: { id: brief.id },
      data: {
        status: DesignSubmissionStatus.SUBMITTED,
        currentVersion: nextVersion,
      },
    });

    if (brief.content_item_id) {
      await tx.contentItem.update({
        where: { id: brief.content_item_id },
        data: { status: ContentStatus.DESIGN_REVIEW },
      });
    }

    const linkedTask = await tx.task.findFirst({
      where: { designBriefId: brief.id, deletedAt: null },
      select: { id: true, firstSubmittedAt: true, startedAt: true, reviewerId: true },
    });

    if (linkedTask) {
      await tx.task.update({
        where: { id: linkedTask.id },
        data: {
          status: TaskStatus.IN_REVIEW,
          startedAt: linkedTask.startedAt ?? now,
          firstSubmittedAt: linkedTask.firstSubmittedAt ?? now,
          version: { increment: 1 },
        },
      });
    }

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      module: "SOCIAL_DESIGN",
      action: "design:submission:submitted",
      entityType: "DESIGN_BRIEF",
      entityId: brief.id,
      summary: `Desain v${nextVersion} (${ASSET_SOURCE_TYPE_META[input.sourceType].label}) disubmit untuk "${brief.title}"`,
      newValues: {
        submissionId: submission.id,
        versionNumber: nextVersion,
        sourceType: input.sourceType,
        fileName: input.fileName,
      },
    });

    const recipientSet = new Set<string>(baseManagerRecipientIds);
    if (brief.requested_by) recipientSet.add(brief.requested_by);
    if (linkedTask?.reviewerId) recipientSet.add(linkedTask.reviewerId);
    const recipientIds = Array.from(recipientSet);

    await dispatchNotifications(
      tx,
      ctx.userId,
      recipientIds.map((recipientId) => ({
        recipientId,
        type: NotificationType.DESIGN_SUBMITTED,
        title: `Desain v${nextVersion} Siap Direview`,
        message: `${ctx.fullName} mengunggah desain v${nextVersion} untuk brief "${brief.title}".`,
        entityType: "DESIGN_BRIEF",
        entityId: brief.id,
        actionUrl: `/design/reviews?briefId=${brief.id}`,
        metadata: {
          designBriefId: brief.id,
          submissionId: submission.id,
          versionNumber: nextVersion,
        },
      }))
    );

    return {
      submissionId: submission.id,
      designBriefId: brief.id,
      versionNumber: nextVersion,
      status: DesignSubmissionStatus.SUBMITTED,
    };
  }, WORKFLOW_TX_OPTIONS);
}

export async function reviewDesignSubmissionAtomic(
  ctx: AuthContext,
  input: ReviewDesignServiceInput
): Promise<ReviewDesignSubmissionOutput> {
  if (
    ctx.roleCode !== "SUPER_ADMIN" &&
    ctx.roleCode !== "PROJECT_MANAGER"
  ) {
    throw new DomainError(
      "FORBIDDEN",
      "Hanya Project Manager atau Super Admin yang berwenang menyetujui atau meminta revisi desain."
    );
  }

  const cleanFeedback = input.feedback.trim();
  if (
    input.decision === DesignReviewDecision.REVISION_REQUESTED &&
    cleanFeedback.length < 10
  ) {
    throw new DomainError(
      "VALIDATION_ERROR",
      "Catatan revisi wajib diisi minimal 10 karakter."
    );
  }

  return prisma.$transaction(async (tx) => {
    const submission = await tx.designSubmission.findUnique({
      where: { id: input.submissionId },
      include: {
        designBrief: {
          include: {
            contentItem: {
              select: {
                id: true,
                title: true,
                platform: true,
                contentFormat: true,
                creatorId: true,
                campaignName: true,
              },
            },
          },
        },
      },
    });

    if (!submission || submission.designBrief.deletedAt !== null) {
      throw new DomainError("NOT_FOUND", "Submission desain tidak ditemukan.");
    }

    if (submission.submittedBy === ctx.userId) {
      throw new DomainError(
        "FORBIDDEN",
        "Pembuat submission desain tidak dapat mereview atau menyetujui karyanya sendiri."
      );
    }

    const brief = submission.designBrief;

    if (
      submission.status !== DesignSubmissionStatus.SUBMITTED ||
      brief.status !== DesignSubmissionStatus.SUBMITTED
    ) {
      throw new DomainError(
        "INVALID_STATE_TRANSITION",
        "Hanya submission terbaru dengan status SUBMITTED yang dapat direview."
      );
    }

    const now = new Date();

    await tx.designReview.create({
      data: {
        designSubmissionId: submission.id,
        reviewerId: ctx.userId,
        decision: input.decision,
        feedback:
          cleanFeedback ||
          (input.decision === DesignReviewDecision.APPROVED
            ? "Desain disetujui dan dipromosikan ke Asset Library."
            : ""),
        revisionChecklist: input.revisionChecklist ?? [],
        reviewedAt: now,
      },
    });

    const linkedTask = await tx.task.findFirst({
      where: { designBriefId: brief.id, deletedAt: null },
    });

    if (input.decision === DesignReviewDecision.APPROVED) {
      await tx.designSubmission.update({
        where: { id: submission.id },
        data: { status: DesignSubmissionStatus.APPROVED },
      });

      await tx.designBrief.update({
        where: { id: brief.id },
        data: {
          status: DesignSubmissionStatus.APPROVED,
          approvedAt: now,
          approvedBy: ctx.userId,
        },
      });

      let syncedContentStatus: ContentStatus | null = null;
      if (brief.contentItemId) {
        await tx.contentItem.update({
          where: { id: brief.contentItemId },
          data: {
            status: ContentStatus.READY_TO_PUBLISH,
            approverId: ctx.userId,
          },
        });
        syncedContentStatus = ContentStatus.READY_TO_PUBLISH;
      }

      let syncedTaskStatus: TaskStatus | null = null;
      if (linkedTask) {
        const isOnTime = computeEffectiveIsOnTime({
          dueDate: linkedTask.dueDate,
          revisionCount: linkedTask.revisionCount,
          firstSubmittedAt: linkedTask.firstSubmittedAt,
          completedAt: now,
        });

        await tx.task.update({
          where: { id: linkedTask.id },
          data: {
            status: TaskStatus.DONE,
            completedAt: now,
            isOnTime,
            reviewerId: ctx.userId,
            version: { increment: 1 },
          },
        });
        syncedTaskStatus = TaskStatus.DONE;
      }

      let promotedAssetId: string | null = null;
      if (input.promoteToAssetLibrary !== false) {
        // Mark any previously promoted active asset for same contentItem or brief as superseded
        await tx.asset.updateMany({
          where: {
            deletedAt: null,
            isSuperseded: false,
            ...(brief.contentItemId
              ? { contentItemId: brief.contentItemId }
              : {
                  designSubmission: {
                    designBriefId: brief.id,
                  },
                }),
          },
          data: { isSuperseded: true },
        });

        const autoTags = [
          brief.contentItem?.platform?.toLowerCase(),
          brief.contentItem?.contentFormat?.toLowerCase(),
          "approved-final",
          ...(input.assetTags ?? []).map((t) => t.trim().toLowerCase()),
        ].filter((t): t is string => Boolean(t));

        const uniqueTags = Array.from(new Set(autoTags)).slice(0, 10);

        const baseTitle = brief.contentItem?.title ?? brief.title;
        const assetTitle = `[Final v${submission.versionNumber}] ${baseTitle}`.slice(
          0,
          200
        );

        const promotedAsset = await tx.asset.create({
          data: {
            projectId: brief.projectId,
            contentItemId: brief.contentItemId,
            designSubmissionId: submission.id,
            title: assetTitle,
            description: brief.objective,
            category: brief.contentItemId
              ? AssetCategory.SOCIAL_MEDIA
              : AssetCategory.CAMPAIGN,
            sourceType: submission.sourceType,
            fileUrl: submission.fileUrl,
            storageKey: submission.storageKey,
            thumbnailUrl: submission.thumbnailUrl,
            mimeType: submission.mimeType,
            fileSizeBytes: submission.fileSizeBytes,
            tags: uniqueTags,
            metadata: {
              designBriefId: brief.id,
              versionNumber: submission.versionNumber,
              approvedBy: ctx.userId,
              approvedAt: now.toISOString(),
              dimensionsSpec: brief.dimensionsSpec,
              campaignName: brief.contentItem?.campaignName ?? null,
            },
            uploadedBy: submission.submittedBy,
            isApprovedBrandAsset: true,
            isSuperseded: false,
          },
        });
        promotedAssetId = promotedAsset.id;
      }

      await writeAuditLog(tx, {
        actorId: ctx.userId,
        module: "SOCIAL_DESIGN",
        action: "design:submission:approved",
        entityType: "DESIGN_BRIEF",
        entityId: brief.id,
        summary: `Desain v${submission.versionNumber} disetujui untuk "${brief.title}"${promotedAssetId ? " & dipromosikan ke Asset Library" : ""}`,
        newValues: {
          submissionId: submission.id,
          versionNumber: submission.versionNumber,
          syncedContentStatus,
          syncedTaskStatus,
          promotedAssetId,
        },
      });

      const notifDrafts: Array<{
        recipientId: string;
        type: NotificationType;
        title: string;
        message: string;
        entityType: string;
        entityId: string;
        actionUrl: string;
      }> = [];

      const designerRecipients = new Set<string>([submission.submittedBy]);
      if (brief.assignedDesignerId) {
        designerRecipients.add(brief.assignedDesignerId);
      }

      for (const designerId of designerRecipients) {
        notifDrafts.push({
          recipientId: designerId,
          type: NotificationType.DESIGN_APPROVED,
          title: `Desain Disetujui (v${submission.versionNumber})`,
          message: `Karya Anda pada brief "${brief.title}" disetujui oleh ${ctx.fullName} dan tersimpan di Asset Library.`,
          entityType: "DESIGN_BRIEF",
          entityId: brief.id,
          actionUrl: `/design/workspace?briefId=${brief.id}`,
        });
      }

      const creatorRecipients = new Set<string>();
      if (brief.contentItem?.creatorId) {
        creatorRecipients.add(brief.contentItem.creatorId);
      }
      if (brief.requestedBy) {
        creatorRecipients.add(brief.requestedBy);
      }

      for (const creatorId of creatorRecipients) {
        if (!brief.contentItemId) continue;
        notifDrafts.push({
          recipientId: creatorId,
          type: NotificationType.CONTENT_READY_TO_PUBLISH,
          title: `Konten Siap Dijadwalkan: ${brief.contentItem?.title ?? brief.title}`,
          message: `Desain final telah disetujui. Konten kini berstatus Ready to Publish.`,
          entityType: "CONTENT_ITEM",
          entityId: brief.contentItemId,
          actionUrl: `/content/calendar`,
        });
      }

      await dispatchNotifications(tx, ctx.userId, notifDrafts);

      return {
        submissionId: submission.id,
        designBriefId: brief.id,
        versionNumber: submission.versionNumber,
        submissionStatus: DesignSubmissionStatus.APPROVED,
        syncedContentStatus,
        syncedTaskStatus,
        totalRevisionCount: brief.revisionCount,
        promotedAssetId,
      };
    }

    // REVISION_REQUESTED
    await tx.designSubmission.update({
      where: { id: submission.id },
      data: { status: DesignSubmissionStatus.REVISION_REQUESTED },
    });

    const nextRevisionCount = brief.revisionCount + 1;
    await tx.designBrief.update({
      where: { id: brief.id },
      data: {
        status: DesignSubmissionStatus.REVISION_REQUESTED,
        revisionCount: nextRevisionCount,
        dueDate: input.revisionDueDate ?? brief.dueDate,
      },
    });

    let syncedContentStatus: ContentStatus | null = null;
    if (brief.contentItemId) {
      await tx.contentItem.update({
        where: { id: brief.contentItemId },
        data: { status: ContentStatus.DESIGN_REVISION },
      });
      syncedContentStatus = ContentStatus.DESIGN_REVISION;
    }

    let syncedTaskStatus: TaskStatus | null = null;
    if (linkedTask) {
      await tx.task.update({
        where: { id: linkedTask.id },
        data: {
          status: TaskStatus.REVISION,
          revisionCount: { increment: 1 },
          completedAt: null,
          isOnTime: null,
          dueDate: input.revisionDueDate ?? linkedTask.dueDate,
          reviewerId: ctx.userId,
          version: { increment: 1 },
        },
      });
      syncedTaskStatus = TaskStatus.REVISION;
    }

    const isBottleneck = nextRevisionCount >= 3;

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      module: "SOCIAL_DESIGN",
      action: "design:submission:revision_requested",
      entityType: "DESIGN_BRIEF",
      entityId: brief.id,
      summary: `Revisi #${nextRevisionCount} diminta untuk "${brief.title}" (v${submission.versionNumber})${isBottleneck ? " [HIGH REVISION ALERT]" : ""}`,
      newValues: {
        submissionId: submission.id,
        versionNumber: submission.versionNumber,
        revisionCount: nextRevisionCount,
        bottleneckAlert: isBottleneck,
        feedback: cleanFeedback,
      },
    });

    const revisionRecipients = new Set<string>([submission.submittedBy]);
    if (brief.assignedDesignerId) {
      revisionRecipients.add(brief.assignedDesignerId);
    }

    const revisionNotifs = Array.from(revisionRecipients).map((recipientId) => ({
      recipientId,
      type: NotificationType.DESIGN_REVISION_REQUESTED,
      title: isBottleneck
        ? `Peringatan Revisi ke-${nextRevisionCount}: ${brief.title}`
        : `Permintaan Revisi Desain (v${submission.versionNumber})`,
      message: `${ctx.fullName} meminta revisi #${nextRevisionCount}: "${cleanFeedback.slice(0, 180)}"`,
      entityType: "DESIGN_BRIEF",
      entityId: brief.id,
      actionUrl: `/design/workspace?briefId=${brief.id}`,
      metadata: {
        designBriefId: brief.id,
        revisionCount: nextRevisionCount,
        bottleneckAlert: isBottleneck,
      },
    }));

    if (isBottleneck) {
      const pmIds = await resolveReviewerAndPmRecipients(tx, [brief.requestedBy]);
      for (const pmId of pmIds) {
        if (revisionRecipients.has(pmId)) continue;
        revisionNotifs.push({
          recipientId: pmId,
          type: NotificationType.DESIGN_REVISION_REQUESTED,
          title: `Bottleneck Alert (${nextRevisionCount}x Revisi): ${brief.title}`,
          message: `Brief desain "${brief.title}" telah mencapai ${nextRevisionCount}x revisi. Disarankan sinkronisasi brief langsung dengan Designer.`,
          entityType: "DESIGN_BRIEF",
          entityId: brief.id,
          actionUrl: `/design/reviews?briefId=${brief.id}`,
          metadata: {
            designBriefId: brief.id,
            revisionCount: nextRevisionCount,
            bottleneckAlert: true,
          },
        });
      }
    }

    await dispatchNotifications(tx, ctx.userId, revisionNotifs);

    return {
      submissionId: submission.id,
      designBriefId: brief.id,
      versionNumber: submission.versionNumber,
      submissionStatus: DesignSubmissionStatus.REVISION_REQUESTED,
      syncedContentStatus,
      syncedTaskStatus,
      totalRevisionCount: nextRevisionCount,
      promotedAssetId: null,
    };
  }, WORKFLOW_TX_OPTIONS);
}

export async function updateContentScheduleAtomic(
  ctx: AuthContext,
  input: UpdateContentScheduleServiceInput
): Promise<{
  id: string;
  status: ContentStatus;
  plannedPublishAt: string | null;
  publishedAt: string | null;
  publishedUrl: string | null;
}> {
  let validatedPublishedUrl: string | null | undefined = undefined;
  if (input.publishedUrl !== undefined && input.publishedUrl !== null) {
    const trimmedUrl = input.publishedUrl.trim();
    if (trimmedUrl) {
      const urlCheck = validateSafeExternalHttpsUrl(trimmedUrl);
      if (!urlCheck.valid || !urlCheck.normalizedUrl) {
        throw new DomainError(
          "VALIDATION_ERROR",
          urlCheck.error ?? "URL publikasi wajib HTTPS publik yang valid."
        );
      }
      validatedPublishedUrl = urlCheck.normalizedUrl;
    } else {
      validatedPublishedUrl = null;
    }
  }

  return prisma.$transaction(async (tx) => {
    const contentItem = await tx.contentItem.findFirst({
      where: { id: input.contentItemId, deletedAt: null },
      include: {
        designBriefs: {
          where: { deletedAt: null },
          select: { id: true, status: true },
        },
        tasks: {
          where: {
            deletedAt: null,
            taskType: TaskType.CONTENT_PRODUCTION,
          },
          select: {
            id: true,
            status: true,
            dueDate: true,
            revisionCount: true,
            firstSubmittedAt: true,
          },
        },
      },
    });

    if (!contentItem) {
      throw new DomainError("NOT_FOUND", "Item konten tidak ditemukan.");
    }

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
      input.hasPlannedPublishAt &&
      (input.plannedPublishAt?.getTime() ?? null) !==
        (contentItem.plannedPublishAt?.getTime() ?? null);

    if (
      contentItem.status === ContentStatus.PUBLISHED &&
      plannedPublishChanged &&
      !canApproveContent
    ) {
      throw new DomainError(
        "FORBIDDEN",
        "Konten yang sudah PUBLISHED hanya dapat diubah tanggal tayangnya oleh Project Manager atau Super Admin."
      );
    }

    const nextPlannedPublishAt = input.hasPlannedPublishAt
      ? (input.plannedPublishAt ?? null)
      : contentItem.plannedPublishAt;

    const nextCaption = input.hasCaption
      ? (input.caption ?? null)
      : contentItem.caption;

    const targetStatus = input.targetStatus ?? contentItem.status;
    const now = new Date();

    const hasApprovedBrief = contentItem.designBriefs.some(
      (b) => b.status === DesignSubmissionStatus.APPROVED
    );
    const isAlreadyPostDesign =
      contentItem.status === ContentStatus.READY_TO_PUBLISH ||
      contentItem.status === ContentStatus.SCHEDULED ||
      contentItem.status === ContentStatus.PUBLISHED;

    if (targetStatus !== contentItem.status) {
      if (
        contentItem.status === ContentStatus.PUBLISHED &&
        targetStatus !== ContentStatus.ARCHIVED &&
        !canApproveContent
      ) {
        throw new DomainError(
          "FORBIDDEN",
          "Konten yang sudah PUBLISHED hanya dapat diarsipkan (ARCHIVED) atau dikembalikan oleh Project Manager / Super Admin."
        );
      }

      if (
        targetStatus === ContentStatus.IDEA ||
        targetStatus === ContentStatus.APPROVED_IDEA
      ) {
        throw new DomainError(
          "INVALID_STATE_TRANSITION",
          "Status IDEA/APPROVED_IDEA hanya dikelola di Content Ideas Bank."
        );
      }

      if (
        targetStatus === ContentStatus.DESIGN_REVIEW ||
        targetStatus === ContentStatus.DESIGN_REVISION
      ) {
        throw new DomainError(
          "INVALID_STATE_TRANSITION",
          "Status DESIGN_REVIEW dan DESIGN_REVISION dikelola otomatis melalui alur Design Submission & Design Review."
        );
      }

      if (
        targetStatus === ContentStatus.IN_DESIGN &&
        (!contentItem.requiresDesign || contentItem.designBriefs.length === 0)
      ) {
        throw new DomainError(
          "INVALID_STATE_TRANSITION",
          "Status IN_DESIGN hanya berlaku untuk konten yang membutuhkan desain dan sudah memiliki Design Brief."
        );
      }

      if (targetStatus === ContentStatus.READY_TO_PUBLISH) {
        if (contentItem.requiresDesign && !hasApprovedBrief && !isAlreadyPostDesign) {
          throw new DomainError(
            "INVALID_STATE_TRANSITION",
            "Konten yang memerlukan desain harus melewati persetujuan Design Review terlebih dahulu."
          );
        }
      } else if (targetStatus === ContentStatus.SCHEDULED) {
        if (!nextPlannedPublishAt) {
          throw new DomainError(
            "VALIDATION_ERROR",
            "Tanggal & jam rencana tayang wajib diisi sebelum menandai Scheduled."
          );
        }
        if (!nextCaption || nextCaption.trim().length < 10) {
          throw new DomainError(
            "VALIDATION_ERROR",
            "Caption konten minimal 10 karakter sebelum dijadwalkan (Scheduled)."
          );
        }
        if (contentItem.requiresDesign && !hasApprovedBrief && !isAlreadyPostDesign) {
          throw new DomainError(
            "INVALID_STATE_TRANSITION",
            "Desain final harus berstatus APPROVED sebelum konten dijadwalkan."
          );
        }
      } else if (targetStatus === ContentStatus.PUBLISHED) {
        if (contentItem.requiresDesign && !hasApprovedBrief && !isAlreadyPostDesign) {
          throw new DomainError(
            "INVALID_STATE_TRANSITION",
            "Desain final harus berstatus APPROVED sebelum konten ditandai Published."
          );
        }
      }
    }

    let nextPublishedUrl = contentItem.publishedUrl;
    let nextPublishedAt = contentItem.publishedAt;

    if (validatedPublishedUrl !== undefined) {
      nextPublishedUrl = validatedPublishedUrl;
    }

    if (targetStatus === ContentStatus.PUBLISHED) {
      if (!nextPublishedUrl) {
        throw new DomainError(
          "VALIDATION_ERROR",
          "Tautan post tayang (HTTPS) wajib diisi saat menandai konten sebagai Published."
        );
      }
      nextPublishedAt = input.publishedAt ?? contentItem.publishedAt ?? now;
    }

    const updatedItem = await tx.contentItem.update({
      where: { id: contentItem.id },
      data: {
        status: targetStatus,
        plannedPublishAt: nextPlannedPublishAt,
        caption: nextCaption,
        publishedUrl: nextPublishedUrl,
        publishedAt: nextPublishedAt,
        approverId:
          targetStatus === ContentStatus.SCHEDULED ||
          targetStatus === ContentStatus.PUBLISHED
            ? (contentItem.approverId ?? ctx.userId)
            : contentItem.approverId,
      },
    });

    // Sync linked CONTENT_PRODUCTION task
    const prodTask = contentItem.tasks[0];
    if (prodTask) {
      if (targetStatus === ContentStatus.PUBLISHED) {
        const effectiveDue = prodTask.dueDate ?? nextPlannedPublishAt;
        const isOnTime = computeEffectiveIsOnTime({
          dueDate: effectiveDue,
          revisionCount: prodTask.revisionCount,
          firstSubmittedAt: prodTask.firstSubmittedAt,
          completedAt: now,
        });

        await tx.task.update({
          where: { id: prodTask.id },
          data: {
            status: TaskStatus.DONE,
            firstSubmittedAt: prodTask.firstSubmittedAt ?? now,
            completedAt: now,
            isOnTime,
            version: { increment: 1 },
          },
        });
      } else if (
        input.hasPlannedPublishAt &&
        prodTask.status !== TaskStatus.DONE &&
        prodTask.status !== TaskStatus.CANCELLED
      ) {
        await tx.task.update({
          where: { id: prodTask.id },
          data: {
            dueDate: computeDefaultContentDueDate(nextPlannedPublishAt),
            version: { increment: 1 },
          },
        });
      }
    }

    await writeAuditLog(tx, {
      actorId: ctx.userId,
      module: "SOCIAL_DESIGN",
      action:
        targetStatus === ContentStatus.PUBLISHED
          ? "social:content:published"
          : "social:content:schedule_updated",
      entityType: "CONTENT_ITEM",
      entityId: updatedItem.id,
      summary: `Status/jadwal konten diperbarui: ${updatedItem.title} -> ${updatedItem.status}`,
      oldValues: {
        status: contentItem.status,
        plannedPublishAt: contentItem.plannedPublishAt?.toISOString() ?? null,
        publishedAt: contentItem.publishedAt?.toISOString() ?? null,
        publishedUrl: contentItem.publishedUrl,
      },
      newValues: {
        status: updatedItem.status,
        plannedPublishAt: updatedItem.plannedPublishAt?.toISOString() ?? null,
        publishedAt: updatedItem.publishedAt?.toISOString() ?? null,
        publishedUrl: updatedItem.publishedUrl,
      },
    });

    return {
      id: updatedItem.id,
      status: updatedItem.status,
      plannedPublishAt: updatedItem.plannedPublishAt?.toISOString() ?? null,
      publishedAt: updatedItem.publishedAt?.toISOString() ?? null,
      publishedUrl: updatedItem.publishedUrl,
    };
  }, WORKFLOW_TX_OPTIONS);
}
