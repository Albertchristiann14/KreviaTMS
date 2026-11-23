import { NextResponse } from "next/server";
import { hasPermission } from "@/lib/constants/permissions";
import { presignUploadRequestSchema } from "@/lib/validations/common";
import { requireSession } from "@/server/auth/rbac";
import {
  checkPresignRateLimit,
  createPresignedUpload,
  getRequiredUploadPermission,
  StorageConfigurationError,
} from "@/server/storage/presigned";
import { DomainError } from "@/types/action-result";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache",
} as const;

export async function POST(request: Request) {
  try {
    const ctx = await requireSession();

    let rawBody: unknown;
    try {
      rawBody = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Body JSON tidak valid.", code: "VALIDATION_ERROR" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const parsed = presignUploadRequestSchema.safeParse(rawBody);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      return NextResponse.json(
        {
          error: firstIssue?.message ?? "Payload presign tidak valid.",
          code: "VALIDATION_ERROR",
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const requiredPermission = getRequiredUploadPermission(
      parsed.data.bucketFolder
    );
    if (
      requiredPermission &&
      !hasPermission(ctx.permissions, requiredPermission, ctx.roleCode)
    ) {
      return NextResponse.json(
        {
          error: `Akses ditolak: membutuhkan izin '${requiredPermission}'.`,
          code: "FORBIDDEN",
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const rate = checkPresignRateLimit(ctx.userId);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error:
            "Terlalu banyak permintaan presigned URL. Silakan coba lagi sebentar lagi.",
          code: "RATE_LIMITED",
        },
        {
          status: 429,
          headers: {
            ...NO_STORE_HEADERS,
            "Retry-After": String(rate.retryAfterSeconds),
          },
        }
      );
    }

    const result = await createPresignedUpload({
      ownerScopeId: ctx.userId,
      bucketFolder: parsed.data.bucketFolder,
      fileName: parsed.data.fileName,
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

    console.error("[KTMS_PRESIGN_UPLOAD_ERROR]", err);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan saat memproses URL unggahan.",
        code: "INTERNAL_ERROR",
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
