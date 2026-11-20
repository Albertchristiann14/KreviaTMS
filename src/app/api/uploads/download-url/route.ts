import { NextResponse } from "next/server";
import { hasPermission, PERMISSIONS } from "@/lib/constants/permissions";
import { requireSession } from "@/server/auth/rbac";
import { prisma } from "@/server/db/prisma";
import {
  createPresignedDownload,
  getRequiredUploadPermission,
  StorageConfigurationError,
  validateStorageKeyPath,
} from "@/server/storage/presigned";
import { DomainError } from "@/types/action-result";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store",
} as const;

export async function GET(request: Request) {
  try {
    const ctx = await requireSession();
    const { searchParams } = new URL(request.url);
    const storageKey = searchParams.get("storageKey") ?? "";
    const forceDownload = searchParams.get("download") === "1";

    const parsedKey = validateStorageKeyPath(storageKey);
    if (!parsedKey) {
      return NextResponse.json(
        { error: "Parameter storageKey tidak valid.", code: "VALIDATION_ERROR" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    let resolvedMimeType: string | null = null;
    let resolvedFileName: string | null = parsedKey.fileName;
    let authorized = false;

    if (parsedKey.bucketFolder === "design-submissions") {
      if (!hasPermission(ctx.permissions, PERMISSIONS.DESIGN_BRIEF_READ, ctx.roleCode)) {
        return NextResponse.json(
          { error: "Akses ditolak untuk melihat submission desain.", code: "FORBIDDEN" },
          { status: 403, headers: NO_STORE_HEADERS }
        );
      }

      const submission = await prisma.designSubmission.findFirst({
        where: { storageKey },
        select: {
          submittedBy: true,
          mimeType: true,
          designBrief: {
            select: {
              assignedDesignerId: true,
              deletedAt: true,
            },
          },
        },
      });

      if (submission) {
        if (submission.designBrief.deletedAt) {
          return NextResponse.json(
            { error: "File desain tidak ditemukan.", code: "NOT_FOUND" },
            { status: 404, headers: NO_STORE_HEADERS }
          );
        }
        const canViewAll =
          ctx.roleCode !== "DESIGNER" ||
          hasPermission(ctx.permissions, PERMISSIONS.DESIGN_SUBMISSION_APPROVE, ctx.roleCode);
        const isAssignedOrSubmitter =
          submission.submittedBy === ctx.userId ||
          submission.designBrief.assignedDesignerId === ctx.userId;

        if (!canViewAll && !isAssignedOrSubmitter) {
          return NextResponse.json(
            { error: "Anda tidak memiliki akses ke submission desain ini.", code: "FORBIDDEN" },
            { status: 403, headers: NO_STORE_HEADERS }
          );
        }

        resolvedMimeType = submission.mimeType;
        authorized = true;
      }
    } else if (parsedKey.bucketFolder === "assets") {
      if (!hasPermission(ctx.permissions, PERMISSIONS.ASSETS_LIBRARY_READ, ctx.roleCode)) {
        return NextResponse.json(
          { error: "Akses ditolak untuk membaca Asset Library.", code: "FORBIDDEN" },
          { status: 403, headers: NO_STORE_HEADERS }
        );
      }

      const asset = await prisma.asset.findFirst({
        where: { storageKey, deletedAt: null },
        select: { mimeType: true, title: true },
      });

      if (asset) {
        resolvedMimeType = asset.mimeType;
        authorized = true;
      }
    } else if (parsedKey.bucketFolder === "task-attachments") {
      if (!hasPermission(ctx.permissions, PERMISSIONS.TASKS_ITEM_READ, ctx.roleCode)) {
        return NextResponse.json(
          { error: "Akses ditolak untuk membaca lampiran task.", code: "FORBIDDEN" },
          { status: 403, headers: NO_STORE_HEADERS }
        );
      }

      const attachment = await prisma.taskAttachment.findFirst({
        where: { storageKey, deletedAt: null },
        select: {
          mimeType: true,
          fileName: true,
          task: { select: { deletedAt: true } },
        },
      });

      if (attachment) {
        if (attachment.task.deletedAt) {
          return NextResponse.json(
            { error: "Lampiran task tidak ditemukan.", code: "NOT_FOUND" },
            { status: 404, headers: NO_STORE_HEADERS }
          );
        }
        resolvedMimeType = attachment.mimeType;
        resolvedFileName = attachment.fileName;
        authorized = true;
      }
    } else if (parsedKey.bucketFolder === "avatars") {
      const avatarOwner = await prisma.user.findFirst({
        where: { avatarUrl: storageKey, deletedAt: null },
        select: { id: true },
      });
      if (avatarOwner) {
        authorized = true;
      }
    }

    // Allow freshly uploaded pre-commit preview only for the uploader who owns the scope
    if (!authorized) {
      const uploadPerm = getRequiredUploadPermission(parsedKey.bucketFolder);
      const hasFolderPerm =
        !uploadPerm || hasPermission(ctx.permissions, uploadPerm, ctx.roleCode);
      if (parsedKey.ownerScopeId === ctx.userId && hasFolderPerm) {
        authorized = true;
      }
    }

    if (!authorized) {
      return NextResponse.json(
        { error: "File tidak ditemukan atau akses tidak diizinkan.", code: "NOT_FOUND" },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    const result = await createPresignedDownload({
      storageKey,
      mimeType: resolvedMimeType,
      fileName: resolvedFileName,
      forceDownload,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: NO_STORE_HEADERS,
    });
  } catch (err) {
    if (err instanceof StorageConfigurationError) {
      return NextResponse.json(
        { error: err.message, code: "SERVICE_UNAVAILABLE" },
        { status: 503, headers: NO_STORE_HEADERS }
      );
    }

    if (err instanceof DomainError) {
      const status =
        err.code === "UNAUTHORIZED"
          ? 401
          : err.code === "FORBIDDEN"
            ? 403
            : err.code === "NOT_FOUND"
              ? 404
              : err.code === "VALIDATION_ERROR"
                ? 400
                : 500;
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status, headers: NO_STORE_HEADERS }
      );
    }

    if (err instanceof Error && err.message.startsWith("[KTMS_ENV_ERROR]")) {
      return NextResponse.json(
        {
          error: "Konfigurasi environment server belum lengkap.",
          code: "SERVICE_UNAVAILABLE",
        },
        { status: 503, headers: NO_STORE_HEADERS }
      );
    }

    console.error("[KTMS_DOWNLOAD_URL_ERROR]", err);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan saat membuat tautan unduhan.",
        code: "INTERNAL_ERROR",
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
