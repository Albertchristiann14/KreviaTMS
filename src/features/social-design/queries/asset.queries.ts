import { AssetCategory, Prisma } from "@prisma/client";
import type { AssetDTO, AssetsApiResponse } from "@/features/social-design/types";
import { prisma } from "@/server/db/prisma";

if (typeof window !== "undefined") {
  throw new Error("asset.queries must only be imported on the server.");
}

function toMetadataRecord(value: Prisma.JsonValue): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export async function getAssetsPaginated(params: {
  q?: string;
  category?: AssetCategory;
  tags?: string[];
  projectId?: string;
  includeSuperseded?: boolean;
  page?: number;
  limit?: number;
}): Promise<AssetsApiResponse> {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(60, Math.max(1, params.limit ?? 24));
  const skip = (page - 1) * limit;

  const cleanTags = (params.tags ?? [])
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);

  const where: Prisma.AssetWhereInput = {
    deletedAt: null,
    ...(params.includeSuperseded ? {} : { isSuperseded: false }),
    ...(params.category ? { category: params.category } : {}),
    ...(params.projectId ? { projectId: params.projectId } : {}),
    ...(cleanTags.length > 0 ? { tags: { hasSome: cleanTags } } : {}),
    ...(params.q?.trim()
      ? {
          OR: [
            { title: { contains: params.q.trim(), mode: "insensitive" } },
            { description: { contains: params.q.trim(), mode: "insensitive" } },
            { tags: { has: params.q.trim().toLowerCase() } },
          ],
        }
      : {}),
  };

  const [totalItems, rows, tagRows] = await Promise.all([
    prisma.asset.count({ where }),
    prisma.asset.findMany({
      where,
      orderBy: [{ createdAt: "desc" }],
      skip,
      take: limit,
      include: {
        project: { select: { code: true, name: true, deletedAt: true } },
        contentItem: { select: { title: true, platform: true, deletedAt: true } },
        designSubmission: {
          select: { designBriefId: true, versionNumber: true },
        },
        uploader: { select: { fullName: true, avatarUrl: true } },
      },
    }),
    prisma.asset.findMany({
      where: { deletedAt: null, isSuperseded: false },
      select: { tags: true },
      take: 200,
    }),
  ]);

  const tagSet = new Set<string>();
  for (const row of tagRows) {
    for (const tag of row.tags) {
      tagSet.add(tag);
    }
  }

  const items: AssetDTO[] = rows.map((row) => {
    const activeProject =
      row.project && row.project.deletedAt === null ? row.project : null;
    const activeContent =
      row.contentItem && row.contentItem.deletedAt === null
        ? row.contentItem
        : null;

    return {
      id: row.id,
      projectId: activeProject ? row.projectId : null,
      projectCode: activeProject?.code ?? null,
      projectName: activeProject?.name ?? null,
      contentItemId: activeContent ? row.contentItemId : null,
      contentTitle: activeContent?.title ?? null,
      contentPlatform: activeContent?.platform ?? null,
      designSubmissionId: row.designSubmissionId,
      designBriefId: row.designSubmission?.designBriefId ?? null,
      designVersionNumber: row.designSubmission?.versionNumber ?? null,
      title: row.title,
      description: row.description,
      category: row.category,
      sourceType: row.sourceType,
      fileUrl: row.fileUrl,
      storageKey: row.storageKey,
      thumbnailUrl: row.thumbnailUrl,
      mimeType: row.mimeType,
      fileSizeBytes: row.fileSizeBytes != null ? Number(row.fileSizeBytes) : null,
      tags: row.tags,
      metadata: toMetadataRecord(row.metadata),
      uploadedBy: row.uploadedBy,
      uploaderName: row.uploader.fullName,
      uploaderAvatarUrl: row.uploader.avatarUrl,
      isApprovedBrandAsset: row.isApprovedBrandAsset,
      isSuperseded: row.isSuperseded,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  });

  return {
    items,
    meta: {
      page,
      limit,
      totalItems,
      totalPages: Math.max(1, Math.ceil(totalItems / limit)),
    },
    availableTags: Array.from(tagSet).sort(),
  };
}
