import type {
  AssetCategory,
  AssetSourceType,
  ContentFormat,
  ContentIdeaStatus,
  ContentStatus,
  DesignReviewDecision,
  DesignSubmissionStatus,
  SocialPlatform,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@prisma/client";

export type {
  AssetCategory,
  AssetSourceType,
  ContentFormat,
  ContentIdeaStatus,
  ContentStatus,
  DesignReviewDecision,
  DesignSubmissionStatus,
  SocialPlatform,
};

export interface SelectableProjectOption {
  id: string;
  code: string;
  name: string;
  colorHex: string;
}

export interface SelectableUserOption {
  id: string;
  fullName: string;
  displayName: string | null;
  roleCode: string;
  jobTitle: string;
  avatarUrl: string | null;
}

export interface ContentIdeaDTO {
  id: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  projectColorHex: string;
  title: string;
  description: string | null;
  targetPlatform: SocialPlatform;
  contentPillar: string | null;
  referenceUrls: string[];
  status: ContentIdeaStatus;
  upvoteCount: number;
  hasUpvoted: boolean;
  upvotedByUserIds: string[];
  proposedBy: string;
  proposerName: string;
  proposerAvatarUrl: string | null;
  reviewedBy: string | null;
  reviewerName: string | null;
  reviewNotes: string | null;
  reviewedAt: string | null;
  convertedContentItemId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LinkedTaskSummaryDTO {
  id: string;
  taskCode: string;
  taskType: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: string | null;
  assigneeName: string | null;
  dueDate: string | null;
  completedAt: string | null;
  isOnTime: boolean | null;
}

export interface ContentPlanDesignBriefSummaryDTO {
  id: string;
  title: string;
  status: DesignSubmissionStatus;
  assignedDesignerId: string | null;
  assignedDesignerName: string | null;
  dueDate: string | null;
  currentVersion: number;
  revisionCount: number;
}

export interface ContentPlanItemDTO {
  id: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  projectColorHex: string;
  ideaId: string | null;
  ideaTitle: string | null;
  title: string;
  platform: SocialPlatform;
  contentFormat: ContentFormat;
  contentPillar: string | null;
  campaignName: string | null;
  status: ContentStatus;
  requiresDesign: boolean;
  caption: string | null;
  hashtags: string[];
  ctaText: string | null;
  creatorId: string;
  creatorName: string;
  creatorAvatarUrl: string | null;
  approverId: string | null;
  approverName: string | null;
  plannedPublishAt: string | null;
  publishedAt: string | null;
  publishedUrl: string | null;
  designBrief: ContentPlanDesignBriefSummaryDTO | null;
  linkedTasks: LinkedTaskSummaryDTO[];
  latestAnalytic: ContentAnalyticSnapshotDTO | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContentPlanOutput {
  contentItem: {
    id: string;
    title: string;
    status: ContentStatus;
    platform: SocialPlatform;
    plannedPublishAt: string | null;
  };
  designBriefId: string | null;
  spawnedTasks: Array<{
    taskId: string;
    taskCode: string;
    taskType: "CONTENT_PRODUCTION" | "DESIGN_TASK";
    assigneeId: string | null;
    status: TaskStatus;
    dueDate: string | null;
  }>;
}

export interface DesignReviewDTO {
  id: string;
  designSubmissionId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatarUrl: string | null;
  decision: DesignReviewDecision;
  feedback: string;
  revisionChecklist: string[];
  reviewedAt: string;
}

export interface DesignSubmissionDTO {
  id: string;
  designBriefId: string;
  versionNumber: number;
  submittedBy: string;
  submitterName: string;
  submitterAvatarUrl: string | null;
  status: DesignSubmissionStatus;
  sourceType: AssetSourceType;
  fileUrl: string;
  storageKey: string | null;
  thumbnailUrl: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  designerNotes: string | null;
  submittedAt: string;
  reviews: DesignReviewDTO[];
}

export interface DesignBriefDTO {
  id: string;
  projectId: string;
  projectCode: string;
  projectName: string;
  projectColorHex: string;
  contentItemId: string | null;
  contentTitle: string | null;
  contentPlatform: SocialPlatform | null;
  contentFormat: ContentFormat | null;
  contentStatus: ContentStatus | null;
  contentPlannedPublishAt: string | null;
  title: string;
  objective: string;
  dimensionsSpec: string | null;
  copyText: string | null;
  brandGuidelinesNotes: string | null;
  referenceLinks: string[];
  status: DesignSubmissionStatus;
  requestedBy: string;
  requesterName: string;
  assignedDesignerId: string | null;
  assignedDesignerName: string | null;
  assignedDesignerAvatarUrl: string | null;
  dueDate: string | null;
  currentVersion: number;
  revisionCount: number;
  approvedAt: string | null;
  approvedBy: string | null;
  approverName: string | null;
  linkedTask: LinkedTaskSummaryDTO | null;
  submissions: DesignSubmissionDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface ReviewDesignSubmissionOutput {
  submissionId: string;
  designBriefId: string;
  versionNumber: number;
  submissionStatus: DesignSubmissionStatus;
  syncedContentStatus: ContentStatus | null;
  syncedTaskStatus: TaskStatus | null;
  totalRevisionCount: number;
  promotedAssetId: string | null;
}

export interface AssetDTO {
  id: string;
  projectId: string | null;
  projectCode: string | null;
  projectName: string | null;
  contentItemId: string | null;
  contentTitle: string | null;
  contentPlatform: SocialPlatform | null;
  designSubmissionId: string | null;
  designBriefId: string | null;
  designVersionNumber: number | null;
  title: string;
  description: string | null;
  category: AssetCategory;
  sourceType: AssetSourceType;
  fileUrl: string;
  storageKey: string | null;
  thumbnailUrl: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
  tags: string[];
  metadata: Record<string, unknown>;
  uploadedBy: string;
  uploaderName: string;
  uploaderAvatarUrl: string | null;
  isApprovedBrandAsset: boolean;
  isSuperseded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContentAnalyticSnapshotDTO {
  id: string;
  contentItemId: string;
  recordedDate: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  videoViews: number;
  engagementRate: number;
  ctr: number;
  notes: string | null;
  recordedBy: string;
  recorderName: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublishedContentAnalyticItemDTO {
  id: string;
  title: string;
  platform: SocialPlatform;
  contentFormat: ContentFormat;
  contentPillar: string | null;
  campaignName: string | null;
  projectId: string;
  projectCode: string;
  projectName: string;
  creatorId: string;
  creatorName: string;
  publishedAt: string | null;
  publishedUrl: string | null;
  latestSnapshot: ContentAnalyticSnapshotDTO | null;
  snapshots: ContentAnalyticSnapshotDTO[];
}

export interface PlatformAnalyticsBreakdownDTO {
  platform: SocialPlatform;
  label: string;
  publishedCount: number;
  trackedCount: number;
  totalReach: number;
  totalImpressions: number;
  totalEngagement: number;
  totalClicks: number;
  avgEngagementRate: number;
  avgCtr: number;
}

export interface PillarAnalyticsBreakdownDTO {
  pillar: string;
  label: string;
  publishedCount: number;
  trackedCount: number;
  totalReach: number;
  avgEngagementRate: number;
}

export interface ContentAnalyticsSummaryDTO {
  totalPublishedCount: number;
  trackedContentCount: number;
  totalReach: number;
  totalImpressions: number;
  totalEngagement: number;
  totalClicks: number;
  totalVideoViews: number;
  avgEngagementRate: number;
  avgCtr: number;
  byPlatform: PlatformAnalyticsBreakdownDTO[];
  byPillar: PillarAnalyticsBreakdownDTO[];
  topContents: PublishedContentAnalyticItemDTO[];
  publishedContents: PublishedContentAnalyticItemDTO[];
}

export interface ContentCalendarApiResponse {
  items: ContentPlanItemDTO[];
  month: string;
  meta: {
    total: number;
  };
}

export interface AssetsApiResponse {
  items: AssetDTO[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  availableTags: string[];
}
