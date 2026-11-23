import { NextResponse } from "next/server";
import type { SocialPlatform } from "@prisma/client";
import { z } from "zod";
import { SOCIAL_PLATFORM_VALUES } from "@/features/social-design/constants";
import { getContentAnalyticsSummary } from "@/features/social-design/queries/content.queries";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/server/auth/rbac";
import { DomainError } from "@/types/action-result";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache",
} as const;

const monthSchema = z
  .string()
  .regex(/^(\d{4}-(0[1-9]|1[0-2])|ALL)$/);

export async function GET(request: Request) {
  try {
    await requirePermission(PERMISSIONS.SOCIAL_CONTENT_READ);

    const { searchParams } = new URL(request.url);
    const rawMonth = searchParams.get("month")?.trim() || "ALL";
    const rawPlatform = searchParams.get("platform")?.trim();

    if (!monthSchema.safeParse(rawMonth).success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Parameter month harus berformat YYYY-MM atau ALL.",
          },
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const platform =
      rawPlatform &&
      rawPlatform !== "ALL" &&
      (SOCIAL_PLATFORM_VALUES as readonly string[]).includes(rawPlatform)
        ? (rawPlatform as SocialPlatform)
        : undefined;

    const summary = await getContentAnalyticsSummary({
      month: rawMonth,
      platform,
    });

    return NextResponse.json(summary, {
      status: 200,
      headers: NO_STORE_HEADERS,
    });
  } catch (err) {
    if (err instanceof DomainError) {
      const status = err.code === "UNAUTHORIZED" ? 401 : 403;
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status, headers: NO_STORE_HEADERS }
      );
    }

    console.error("[KTMS_API_CONTENT_ANALYTICS_SUMMARY_ERROR]", err);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Gagal memuat ringkasan Content Analytics.",
        },
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
