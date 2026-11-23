import {
  ContentIdeaStatus,
  ContentStatus,
  Prisma,
  SocialPlatform,
} from "@prisma/client";
import {
  CONTENT_PILLAR_OPTIONS,
  SOCIAL_PLATFORM_META,
  getPillarLabel,
} from "@/features/social-design/constants";
import type {
  ContentAnalyticSnapshotDTO,
  ContentAnalyticsSummaryDTO,
  ContentIdeaDTO,
  ContentPlanItemDTO,
  PillarAnalyticsBreakdownDTO,
  PlatformAnalyticsBreakdownDTO,
  PublishedContentAnalyticItemDTO,
  SelectableProjectOption,
  SelectableUserOption,
} from "@/features/social-design/types";
import { getMonthBoundsJakarta } from "@/features/social-design/utils";
import { prisma } from "@/server/db/prisma";

if (typeof window !== "undefined") {
  throw new Error("content.queries must only be imported on the server.");
}

function parseJsonStringArray(val: Prisma.JsonValue): string[] {
  if (!Array.isArray(val)) return [];
  return val.filter((item): item is string => typeof item === "string");
}

function serializeAnalyticSnapshot(row: {
  id: string;
  contentItemId: string;
  recordedDate: Date;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  videoViews: number;
  engagementRate: Prisma.Decimal;
  ctr: Prisma.Decimal;
  notes: string | null;
  recordedBy: string;
  recorder: { fullName: string };
  createdAt: Date;
  updatedAt: Date;
}): ContentAnalyticSnapshotDTO {
  return {
    id: row.id,
    contentItemId: row.contentItemId,
    recordedDate: row.recordedDate.toISOString().slice(0, 10),
    impressions: row.impressions,
    reach: row.reach,
    likes: row.likes,
    comments: row.comments,
    shares: row.shares,
    saves: row.saves,
    clicks: row.clicks,
    videoViews: row.videoViews,
    engagementRate: Number(row.engagementRate),
    ctr: Number(row.ctr),
    notes: row.notes,
    recordedBy: row.recordedBy,
    recorderName: row.recorder.fullName,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getSelectableOptionsForSocialDesign(): Promise<{
  projects: SelectableProjectOption[];
  users: SelectableUserOption[];
  creators: SelectableUserOption[];
  designers: SelectableUserOption[];
}> {
  const [projects, users] = await Promise.all([
    prisma.project.findMany({
      where: {
        deletedAt: null,
        status: { in: ["ACTIVE", "PLANNING"] },
      },
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        code: true,
        name: true,
        colorHex: true,
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
        displayName: true,
        jobTitle: true,
        avatarUrl: true,
        role: { select: { code: true } },
      },
    }),
  ]);

  const mappedUsers: SelectableUserOption[] = users.map((u) => ({
    id: u.id,
    fullName: u.fullName,
    displayName: u.displayName,
    roleCode: u.role.code,
    jobTitle: u.jobTitle,
    avatarUrl: u.avatarUrl,
  }));

  const creators = mappedUsers.filter((u) =>
    ["STAFF_CREATOR", "PROJECT_MANAGER", "SUPER_ADMIN"].includes(u.roleCode)
  );
  const designers = mappedUsers.filter((u) =>
    ["DESIGNER", "SUPER_ADMIN", "PROJECT_MANAGER"].includes(u.roleCode)
  );

  return {
    projects,
    users: mappedUsers,
    creators: creators.length > 0 ? creators : mappedUsers,
    designers: designers.length > 0 ? designers : mappedUsers,
  };
}

export async function getContentIdeas(params: {
  currentUserId: string;
  projectId?: string;
  status?: ContentIdeaStatus;
  platform?: SocialPlatform;
  q?: string;
}): Promise<ContentIdeaDTO[]> {
  const where: Prisma.ContentIdeaWhereInput = {
    deletedAt: null,
    ...(params.projectId ? { projectId: params.projectId } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.platform ? { targetPlatform: params.platform } : {}),
    ...(params.q?.trim()
      ? {
          OR: [
            { title: { contains: params.q.trim(), mode: "insensitive" } },
            { description: { contains: params.q.trim(), mode: "insensitive" } },
            { contentPillar: { contains: params.q.trim(), mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const rows = await prisma.contentIdea.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    include: {
      project: {
        select: { code: true, name: true, colorHex: true, deletedAt: true },
      },
      proposer: { select: { fullName: true, avatarUrl: true } },
      reviewer: { select: { fullName: true } },
      contentItems: {
        where: { deletedAt: null },
        select: { id: true },
        take: 1,
      },
    },
  });

  return rows.map((row) => {
    const activeProject =
      row.project && row.project.deletedAt === null ? row.project : null;

    return {
      id: row.id,
      projectId: row.projectId,
      projectCode: activeProject?.code ?? "UMUM",
      projectName: activeProject?.name ?? "Umum",
      projectColorHex: activeProject?.colorHex ?? "#64748b",
      title: row.title,
      description: row.description,
      targetPlatform: row.targetPlatform,
      contentPillar: row.contentPillar,
      referenceUrls: parseJsonStringArray(row.referenceUrls),
      status: row.status,
      upvoteCount: row.upvotedByUserIds.length,
      hasUpvoted: row.upvotedByUserIds.includes(params.currentUserId),
      upvotedByUserIds: row.upvotedByUserIds,
      proposedBy: row.proposedBy,
      proposerName: row.proposer.fullName,
      proposerAvatarUrl: row.proposer.avatarUrl,
      reviewedBy: row.reviewedBy,
      reviewerName: row.reviewer?.fullName ?? null,
      reviewNotes: row.reviewNotes,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      convertedContentItemId: row.contentItems[0]?.id ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  });
}

export async function getContentCalendarItems(params: {
  month?: string;
  platform?: SocialPlatform;
  status?: ContentStatus;
  pillar?: string;
  creatorId?: string;
  projectId?: string;
}): Promise<ContentPlanItemDTO[]> {
  const where: Prisma.ContentItemWhereInput = {
    deletedAt: null,
    ...(params.platform ? { platform: params.platform } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.pillar ? { contentPillar: params.pillar } : {}),
    ...(params.creatorId ? { creatorId: params.creatorId } : {}),
    ...(params.projectId ? { projectId: params.projectId } : {}),
  };

  if (params.month && params.month !== "ALL") {
    const { start, end } = getMonthBoundsJakarta(params.month);
    where.plannedPublishAt = {
      gte: start,
      lt: end,
    };
  }

  const rows = await prisma.contentItem.findMany({
    where,
    orderBy: [
      { plannedPublishAt: "asc" },
      { createdAt: "desc" },
    ],
    include: {
      project: {
        select: { code: true, name: true, colorHex: true, deletedAt: true },
      },
      idea: { select: { title: true, deletedAt: true } },
      creator: { select: { fullName: true, avatarUrl: true } },
      approver: { select: { fullName: true } },
      designBriefs: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        take: 1,
        include: {
          assignedDesigner: { select: { fullName: true } },
        },
      },
      tasks: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        include: {
          assignee: { select: { fullName: true } },
        },
      },
      analytics: {
        orderBy: [{ recordedDate: "desc" }, { createdAt: "desc" }],
        take: 1,
        include: {
          recorder: { select: { fullName: true } },
        },
      },
    },
  });

  return rows.map((row) => {
    const brief = row.designBriefs[0] ?? null;
    const latestAnalytic = row.analytics[0] ?? null;
    const activeProject =
      row.project && row.project.deletedAt === null ? row.project : null;
    const activeIdea =
      row.idea && row.idea.deletedAt === null ? row.idea : null;

    return {
      id: row.id,
      projectId: row.projectId,
      projectCode: activeProject?.code ?? "UMUM",
      projectName: activeProject?.name ?? "Umum",
      projectColorHex: activeProject?.colorHex ?? "#64748b",
      ideaId: row.ideaId,
      ideaTitle: activeIdea?.title ?? null,
      title: row.title,
      platform: row.platform,
      contentFormat: row.contentFormat,
      contentPillar: row.contentPillar,
      campaignName: row.campaignName,
      status: row.status,
      requiresDesign: row.requiresDesign,
      caption: row.caption,
      hashtags: row.hashtags,
      ctaText: row.ctaText,
      creatorId: row.creatorId,
      creatorName: row.creator.fullName,
      creatorAvatarUrl: row.creator.avatarUrl,
      approverId: row.approverId,
      approverName: row.approver?.fullName ?? null,
      plannedPublishAt: row.plannedPublishAt?.toISOString() ?? null,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      publishedUrl: row.publishedUrl,
      designBrief: brief
        ? {
            id: brief.id,
            title: brief.title,
            status: brief.status,
            assignedDesignerId: brief.assignedDesignerId,
            assignedDesignerName: brief.assignedDesigner?.fullName ?? null,
            dueDate: brief.dueDate?.toISOString() ?? null,
            currentVersion: brief.currentVersion,
            revisionCount: brief.revisionCount,
          }
        : null,
      linkedTasks: row.tasks.map((t) => ({
        id: t.id,
        taskCode: t.taskCode,
        taskType: t.taskType,
        status: t.status,
        priority: t.priority,
        assigneeId: t.assigneeId,
        assigneeName: t.assignee?.fullName ?? null,
        dueDate: t.dueDate?.toISOString() ?? null,
        completedAt: t.completedAt?.toISOString() ?? null,
        isOnTime: t.isOnTime,
      })),
      latestAnalytic: latestAnalytic
        ? serializeAnalyticSnapshot(latestAnalytic)
        : null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  });
}

export async function getContentAnalyticsSummary(params?: {
  month?: string;
  platform?: SocialPlatform;
}): Promise<ContentAnalyticsSummaryDTO> {
  const where: Prisma.ContentItemWhereInput = {
    deletedAt: null,
    OR: [
      { status: ContentStatus.PUBLISHED },
      { status: ContentStatus.ARCHIVED, publishedAt: { not: null } },
    ],
    ...(params?.platform ? { platform: params.platform } : {}),
  };

  if (params?.month && params.month !== "ALL") {
    const { start, end } = getMonthBoundsJakarta(params.month);
    where.publishedAt = { gte: start, lt: end };
  }

  const rows = await prisma.contentItem.findMany({
    where,
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    include: {
      project: { select: { code: true, name: true, deletedAt: true } },
      creator: { select: { fullName: true } },
      analytics: {
        orderBy: [{ recordedDate: "desc" }, { createdAt: "desc" }],
        include: {
          recorder: { select: { fullName: true } },
        },
      },
    },
  });

  const publishedContents: PublishedContentAnalyticItemDTO[] = rows.map((row) => {
    const snapshots = row.analytics.map(serializeAnalyticSnapshot);
    const activeProject =
      row.project && row.project.deletedAt === null ? row.project : null;
    return {
      id: row.id,
      title: row.title,
      platform: row.platform,
      contentFormat: row.contentFormat,
      contentPillar: row.contentPillar,
      campaignName: row.campaignName,
      projectId: row.projectId,
      projectCode: activeProject?.code ?? "UMUM",
      projectName: activeProject?.name ?? "Umum",
      creatorId: row.creatorId,
      creatorName: row.creator.fullName,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      publishedUrl: row.publishedUrl,
      latestSnapshot: snapshots[0] ?? null,
      snapshots,
    };
  });

  let totalReach = 0;
  let totalImpressions = 0;
  let totalEngagement = 0;
  let totalClicks = 0;
  let totalVideoViews = 0;
  let erSum = 0;
  let ctrSum = 0;
  let trackedContentCount = 0;

  const platformBuckets = new Map<
    SocialPlatform,
    {
      publishedCount: number;
      trackedCount: number;
      totalReach: number;
      totalImpressions: number;
      totalEngagement: number;
      totalClicks: number;
      erSum: number;
      ctrSum: number;
    }
  >();

  const pillarBuckets = new Map<
    string,
    {
      publishedCount: number;
      trackedCount: number;
      totalReach: number;
      erSum: number;
    }
  >();

  for (const item of publishedContents) {
    const snap = item.latestSnapshot;
    const engagement = snap
      ? snap.likes + snap.comments + snap.shares + snap.saves
      : 0;

    if (snap) {
      trackedContentCount += 1;
      totalReach += snap.reach;
      totalImpressions += snap.impressions;
      totalEngagement += engagement;
      totalClicks += snap.clicks;
      totalVideoViews += snap.videoViews;
      erSum += snap.engagementRate;
      ctrSum += snap.ctr;
    }

    const pBucket = platformBuckets.get(item.platform) ?? {
      publishedCount: 0,
      trackedCount: 0,
      totalReach: 0,
      totalImpressions: 0,
      totalEngagement: 0,
      totalClicks: 0,
      erSum: 0,
      ctrSum: 0,
    };
    pBucket.publishedCount += 1;
    if (snap) {
      pBucket.trackedCount += 1;
      pBucket.totalReach += snap.reach;
      pBucket.totalImpressions += snap.impressions;
      pBucket.totalEngagement += engagement;
      pBucket.totalClicks += snap.clicks;
      pBucket.erSum += snap.engagementRate;
      pBucket.ctrSum += snap.ctr;
    }
    platformBuckets.set(item.platform, pBucket);

    const pillarKey = item.contentPillar?.trim() || "UNSPECIFIED";
    const pilBucket = pillarBuckets.get(pillarKey) ?? {
      publishedCount: 0,
      trackedCount: 0,
      totalReach: 0,
      erSum: 0,
    };
    pilBucket.publishedCount += 1;
    if (snap) {
      pilBucket.trackedCount += 1;
      pilBucket.totalReach += snap.reach;
      pilBucket.erSum += snap.engagementRate;
    }
    pillarBuckets.set(pillarKey, pilBucket);
  }

  const byPlatform: PlatformAnalyticsBreakdownDTO[] = Array.from(
    platformBuckets.entries()
  ).map(([platform, b]) => ({
    platform,
    label: SOCIAL_PLATFORM_META[platform].label,
    publishedCount: b.publishedCount,
    trackedCount: b.trackedCount,
    totalReach: b.totalReach,
    totalImpressions: b.totalImpressions,
    totalEngagement: b.totalEngagement,
    totalClicks: b.totalClicks,
    avgEngagementRate:
      b.trackedCount > 0 ? Number((b.erSum / b.trackedCount).toFixed(2)) : 0,
    avgCtr:
      b.trackedCount > 0 ? Number((b.ctrSum / b.trackedCount).toFixed(2)) : 0,
  }));

  const byPillar: PillarAnalyticsBreakdownDTO[] = Array.from(
    pillarBuckets.entries()
  ).map(([pillar, b]) => {
    const label =
      pillar === "UNSPECIFIED"
        ? "Tanpa Pilar"
        : CONTENT_PILLAR_OPTIONS.find((opt) => opt.value === pillar)?.label ??
          getPillarLabel(pillar);
    return {
      pillar,
      label,
      publishedCount: b.publishedCount,
      trackedCount: b.trackedCount,
      totalReach: b.totalReach,
      avgEngagementRate:
        b.trackedCount > 0 ? Number((b.erSum / b.trackedCount).toFixed(2)) : 0,
    };
  });

  const topContents = [...publishedContents]
    .filter((item) => item.latestSnapshot !== null)
    .sort((a, b) => {
      const erDiff =
        (b.latestSnapshot?.engagementRate ?? 0) -
        (a.latestSnapshot?.engagementRate ?? 0);
      if (erDiff !== 0) return erDiff;
      return (b.latestSnapshot?.reach ?? 0) - (a.latestSnapshot?.reach ?? 0);
    })
    .slice(0, 5);

  return {
    totalPublishedCount: publishedContents.length,
    trackedContentCount,
    totalReach,
    totalImpressions,
    totalEngagement,
    totalClicks,
    totalVideoViews,
    avgEngagementRate:
      trackedContentCount > 0
        ? Number((erSum / trackedContentCount).toFixed(2))
        : 0,
    avgCtr:
      trackedContentCount > 0
        ? Number((ctrSum / trackedContentCount).toFixed(2))
        : 0,
    byPlatform,
    byPillar,
    topContents,
    publishedContents,
  };
}
