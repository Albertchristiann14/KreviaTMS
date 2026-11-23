import { DesignSubmissionStatus, Prisma } from "@prisma/client";
import type { DesignBriefDTO } from "@/features/social-design/types";
import { prisma } from "@/server/db/prisma";

if (typeof window !== "undefined") {
  throw new Error("design.queries must only be imported on the server.");
}

function parseJsonStringArray(val: Prisma.JsonValue): string[] {
  if (!Array.isArray(val)) return [];
  return val.filter((item): item is string => typeof item === "string");
}

const BRIEF_INCLUDE = {
  project: {
    select: {
      code: true,
      name: true,
      colorHex: true,
      deletedAt: true,
    },
  },
  contentItem: {
    select: {
      id: true,
      title: true,
      platform: true,
      contentFormat: true,
      status: true,
      plannedPublishAt: true,
      deletedAt: true,
    },
  },
  requester: {
    select: { fullName: true },
  },
  assignedDesigner: {
    select: { fullName: true, avatarUrl: true },
  },
  approver: {
    select: { fullName: true },
  },
  tasks: {
    where: { deletedAt: null },
    orderBy: { createdAt: "desc" as const },
    take: 1,
    include: {
      assignee: { select: { fullName: true } },
    },
  },
  submissions: {
    orderBy: { versionNumber: "desc" as const },
    include: {
      submitter: { select: { fullName: true, avatarUrl: true } },
      reviews: {
        orderBy: { reviewedAt: "desc" as const },
        include: {
          reviewer: { select: { fullName: true, avatarUrl: true } },
        },
      },
    },
  },
} satisfies Prisma.DesignBriefInclude;

type BriefWithRelations = Prisma.DesignBriefGetPayload<{
  include: typeof BRIEF_INCLUDE;
}>;

function serializeBrief(row: BriefWithRelations): DesignBriefDTO {
  const task = row.tasks[0] ?? null;
  const activeProject =
    row.project && row.project.deletedAt === null ? row.project : null;
  const activeContent =
    row.contentItem && row.contentItem.deletedAt === null
      ? row.contentItem
      : null;

  return {
    id: row.id,
    projectId: row.projectId,
    projectCode: activeProject?.code ?? "UMUM",
    projectName: activeProject?.name ?? "Umum",
    projectColorHex: activeProject?.colorHex ?? "#64748b",
    contentItemId: activeContent?.id ?? null,
    contentTitle: activeContent?.title ?? null,
    contentPlatform: activeContent?.platform ?? null,
    contentFormat: activeContent?.contentFormat ?? null,
    contentStatus: activeContent?.status ?? null,
    contentPlannedPublishAt:
      activeContent?.plannedPublishAt?.toISOString() ?? null,
    title: row.title,
    objective: row.objective,
    dimensionsSpec: row.dimensionsSpec,
    copyText: row.copyText,
    brandGuidelinesNotes: row.brandGuidelinesNotes,
    referenceLinks: parseJsonStringArray(row.referenceLinks),
    status: row.status,
    requestedBy: row.requestedBy,
    requesterName: row.requester.fullName,
    assignedDesignerId: row.assignedDesignerId,
    assignedDesignerName: row.assignedDesigner?.fullName ?? null,
    assignedDesignerAvatarUrl: row.assignedDesigner?.avatarUrl ?? null,
    dueDate: row.dueDate?.toISOString() ?? null,
    currentVersion: row.currentVersion,
    revisionCount: row.revisionCount,
    approvedAt: row.approvedAt?.toISOString() ?? null,
    approvedBy: row.approvedBy,
    approverName: row.approver?.fullName ?? null,
    linkedTask: task
      ? {
          id: task.id,
          taskCode: task.taskCode,
          taskType: task.taskType,
          status: task.status,
          priority: task.priority,
          assigneeId: task.assigneeId,
          assigneeName: task.assignee?.fullName ?? null,
          dueDate: task.dueDate?.toISOString() ?? null,
          completedAt: task.completedAt?.toISOString() ?? null,
          isOnTime: task.isOnTime,
        }
      : null,
    submissions: row.submissions.map((sub) => ({
      id: sub.id,
      designBriefId: sub.designBriefId,
      versionNumber: sub.versionNumber,
      submittedBy: sub.submittedBy,
      submitterName: sub.submitter.fullName,
      submitterAvatarUrl: sub.submitter.avatarUrl,
      status: sub.status,
      sourceType: sub.sourceType,
      fileUrl: sub.fileUrl,
      storageKey: sub.storageKey,
      thumbnailUrl: sub.thumbnailUrl,
      mimeType: sub.mimeType,
      fileSizeBytes: sub.fileSizeBytes != null ? Number(sub.fileSizeBytes) : null,
      designerNotes: sub.designerNotes,
      submittedAt: sub.submittedAt.toISOString(),
      reviews: sub.reviews.map((rev) => ({
        id: rev.id,
        designSubmissionId: rev.designSubmissionId,
        reviewerId: rev.reviewerId,
        reviewerName: rev.reviewer.fullName,
        reviewerAvatarUrl: rev.reviewer.avatarUrl,
        decision: rev.decision,
        feedback: rev.feedback,
        revisionChecklist: parseJsonStringArray(rev.revisionChecklist),
        reviewedAt: rev.reviewedAt.toISOString(),
      })),
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getDesignWorkspaceBriefs(params: {
  currentUserId: string;
  roleCode: string;
  status?: DesignSubmissionStatus;
  projectId?: string;
  designerId?: string;
  briefId?: string;
}): Promise<DesignBriefDTO[]> {
  const isDesignerOnly = params.roleCode === "DESIGNER";

  const where: Prisma.DesignBriefWhereInput = {
    deletedAt: null,
    ...(isDesignerOnly ? { assignedDesignerId: params.currentUserId } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.projectId ? { projectId: params.projectId } : {}),
    ...(!isDesignerOnly && params.designerId
      ? { assignedDesignerId: params.designerId }
      : {}),
    ...(params.briefId ? { id: params.briefId } : {}),
  };

  const rows = await prisma.designBrief.findMany({
    where,
    orderBy: [
      { dueDate: "asc" },
      { updatedAt: "desc" },
    ],
    include: BRIEF_INCLUDE,
  });

  return rows.map(serializeBrief);
}

export async function getDesignReviewQueue(params?: {
  status?: DesignSubmissionStatus;
  projectId?: string;
}): Promise<DesignBriefDTO[]> {
  const where: Prisma.DesignBriefWhereInput = {
    deletedAt: null,
    submissions: { some: {} },
    ...(params?.status ? { status: params.status } : {}),
    ...(params?.projectId ? { projectId: params.projectId } : {}),
  };

  const rows = await prisma.designBrief.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }],
    include: BRIEF_INCLUDE,
  });

  return rows.map(serializeBrief);
}
