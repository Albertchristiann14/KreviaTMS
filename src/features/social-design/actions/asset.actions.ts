"use server";

import { revalidatePath } from "next/cache";
import {
  archiveAssetSchema,
  upsertAssetSchema,
} from "@/features/social-design/schemas/design.schema";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { validateSafeExternalHttpsUrl } from "@/lib/validations/common";
import { createProtectedAction } from "@/server/actions/safe-action";
import { executeAuditedMutation } from "@/server/services/audit-logger";
import { validateStorageKeyPath } from "@/server/storage/presigned";
import { DomainError } from "@/types/action-result";

export const upsertAssetAction = createProtectedAction({
  permission: PERMISSIONS.ASSETS_LIBRARY_MANAGE,
  schema: upsertAssetSchema,
  handler: async ({ ctx, input }) => {
    const data = await executeAuditedMutation(ctx, async (tx) => {
      const normalizedTags = Array.from(
        new Set(input.tags.map((t) => t.trim().toLowerCase()).filter(Boolean))
      ).slice(0, 10);

      if (input.id) {
        const existing = await tx.asset.findFirst({
          where: { id: input.id, deletedAt: null },
        });
        if (!existing) {
          throw new DomainError("NOT_FOUND", "Aset tidak ditemukan.");
        }

        const isAdminOrPm =
          ctx.roleCode === "SUPER_ADMIN" || ctx.roleCode === "PROJECT_MANAGER";
        if (!isAdminOrPm && existing.uploadedBy !== ctx.userId) {
          throw new DomainError(
            "FORBIDDEN",
            "Anda hanya dapat mengubah metadata aset yang Anda unggah sendiri."
          );
        }

        let nextFileUrl = existing.fileUrl;
        let nextStorageKey = existing.storageKey;
        let nextSourceType = existing.sourceType;
        let nextMimeType = existing.mimeType;
        let nextFileSize = existing.fileSizeBytes;

        if (input.sourceType === "UPLOAD" && input.storageKey) {
          const parsedKey = validateStorageKeyPath(input.storageKey);
          if (!parsedKey) {
            throw new DomainError("VALIDATION_ERROR", "storageKey tidak valid.");
          }
          nextSourceType = "UPLOAD";
          nextStorageKey = input.storageKey.trim();
          nextFileUrl = `/api/uploads/download-url?storageKey=${encodeURIComponent(nextStorageKey)}`;
          nextMimeType = input.mimeType ?? existing.mimeType;
          nextFileSize =
            input.fileSizeBytes != null
              ? BigInt(input.fileSizeBytes)
              : existing.fileSizeBytes;
        } else if (input.sourceType !== "UPLOAD" && input.externalUrl?.trim()) {
          const urlCheck = validateSafeExternalHttpsUrl(input.externalUrl);
          if (!urlCheck.valid || !urlCheck.normalizedUrl) {
            throw new DomainError(
              "VALIDATION_ERROR",
              urlCheck.error ?? "Tautan eksternal harus HTTPS publik valid."
            );
          }
          nextSourceType = input.sourceType;
          nextFileUrl = urlCheck.normalizedUrl;
          nextStorageKey = null;
          nextMimeType = null;
          nextFileSize = null;
        }

        const updated = await tx.asset.update({
          where: { id: existing.id },
          data: {
            projectId: input.projectId ?? null,
            contentItemId: input.contentItemId ?? existing.contentItemId,
            title: input.title,
            description: input.description ?? null,
            category: input.category,
            sourceType: nextSourceType,
            fileUrl: nextFileUrl,
            storageKey: nextStorageKey,
            mimeType: nextMimeType,
            fileSizeBytes: nextFileSize,
            tags: normalizedTags,
            isApprovedBrandAsset: input.isApprovedBrandAsset,
          },
        });

        return {
          result: { id: updated.id, title: updated.title },
          audit: {
            module: "SOCIAL_DESIGN" as const,
            action: "assets:library:updated",
            entityType: "ASSET",
            entityId: updated.id,
            summary: `Metadata aset diperbarui: ${updated.title}`,
            oldValues: {
              title: existing.title,
              category: existing.category,
              tags: existing.tags,
            },
            newValues: {
              title: updated.title,
              category: updated.category,
              tags: updated.tags,
            },
          },
        };
      }

      // Create new manual asset
      let fileUrl = "";
      let storageKey: string | null = null;

      if (input.sourceType === "UPLOAD") {
        const key = input.storageKey?.trim() ?? "";
        const parsedKey = validateStorageKeyPath(key);
        if (!parsedKey) {
          throw new DomainError(
            "VALIDATION_ERROR",
            "storageKey file unggahan tidak valid."
          );
        }
        storageKey = key;
        fileUrl = `/api/uploads/download-url?storageKey=${encodeURIComponent(key)}`;
      } else {
        const urlCheck = validateSafeExternalHttpsUrl(input.externalUrl ?? "");
        if (!urlCheck.valid || !urlCheck.normalizedUrl) {
          throw new DomainError(
            "VALIDATION_ERROR",
            urlCheck.error ?? "Tautan eksternal harus HTTPS publik yang valid."
          );
        }
        fileUrl = urlCheck.normalizedUrl;
      }

      const created = await tx.asset.create({
        data: {
          projectId: input.projectId ?? null,
          contentItemId: input.contentItemId ?? null,
          title: input.title,
          description: input.description ?? null,
          category: input.category,
          sourceType: input.sourceType,
          fileUrl,
          storageKey,
          mimeType: input.mimeType ?? null,
          fileSizeBytes:
            input.fileSizeBytes != null ? BigInt(input.fileSizeBytes) : null,
          tags: normalizedTags,
          uploadedBy: ctx.userId,
          isApprovedBrandAsset: input.isApprovedBrandAsset,
          isSuperseded: false,
        },
      });

      return {
        result: { id: created.id, title: created.title },
        audit: {
          module: "SOCIAL_DESIGN" as const,
          action: "assets:library:created",
          entityType: "ASSET",
          entityId: created.id,
          summary: `Aset baru ditambahkan ke Asset Library: ${created.title}`,
          newValues: {
            id: created.id,
            category: created.category,
            sourceType: created.sourceType,
            tags: created.tags,
          },
        },
      };
    });

    revalidatePath("/assets");
    return {
      data,
      message: input.id
        ? "Aset berhasil diperbarui."
        : "Aset baru berhasil disimpan ke Asset Library.",
    };
  },
});

export const archiveAssetAction = createProtectedAction({
  permission: PERMISSIONS.ASSETS_LIBRARY_MANAGE,
  schema: archiveAssetSchema,
  handler: async ({ ctx, input }) => {
    const data = await executeAuditedMutation(ctx, async (tx) => {
      const existing = await tx.asset.findFirst({
        where: { id: input.assetId, deletedAt: null },
      });
      if (!existing) {
        throw new DomainError("NOT_FOUND", "Aset tidak ditemukan.");
      }

      const isAdminOrPm =
        ctx.roleCode === "SUPER_ADMIN" || ctx.roleCode === "PROJECT_MANAGER";
      if (!isAdminOrPm && existing.uploadedBy !== ctx.userId) {
        throw new DomainError(
          "FORBIDDEN",
          "Hanya Project Manager, Super Admin, atau pengunggah asli yang dapat mengarsipkan aset ini."
        );
      }

      const now = new Date();
      await tx.asset.update({
        where: { id: existing.id },
        data: { deletedAt: now },
      });

      return {
        result: { id: existing.id, archivedAt: now.toISOString() },
        audit: {
          module: "SOCIAL_DESIGN" as const,
          action: "assets:library:archived",
          entityType: "ASSET",
          entityId: existing.id,
          summary: `Aset diarsipkan (soft-delete): ${existing.title}`,
          oldValues: { deletedAt: null },
          newValues: { deletedAt: now.toISOString() },
        },
      };
    });

    revalidatePath("/assets");
    return {
      data,
      message: "Aset berhasil diarsipkan dari Asset Library.",
    };
  },
});
