import { NextResponse } from "next/server";
import type { ContentStatus, SocialPlatform } from "@prisma/client";
import { z } from "zod";
import { SOCIAL_PLATFORM_VALUES } from "@/features/social-design/constants";
import { getContentCalendarItems } from "@/features/social-design/queries/content.queries";
import { getCurrentMonthJakarta } from "@/features/social-design/utils";
import { CONTENT_STATUS_VALUES } from "@/lib/constants/enums";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/server/auth/rbac";
import { DomainError } from "@/types/action-result";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache",
} as const;

const uuidSchema = z.string().uuid();
const monthSchema = z
  .string()
  .regex(/^(\d{4}-(0[1-9]|1[0-2])|ALL)$/);

export async function GET(request: Request) {
  try {
    await requirePermission(PERMISSIONS.SOCIAL_CONTENT_READ);

    const { searchParams } = new URL(request.url);
    const rawMonth = searchParams.get("month")?.trim() || getCurrentMonthJakarta();
    const rawPlatform = searchParams.get("platform")?.trim();
    const rawStatus = searchParams.get("status")?.trim();
    const rawPillar = searchParams.get("pillar")?.trim();
    const rawCreatorId = searchParams.get("creatorId")?.trim();
    const rawProjectId = searchParams.get("projectId")?.trim();

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

    const status =
      rawStatus &&
      rawStatus !== "ALL" &&
      (CONTENT_STATUS_VALUES as readonly string[]).includes(rawStatus)
        ? (rawStatus as ContentStatus)
        : undefined;

    const creatorId =
      rawCreatorId && rawCreatorId !== "ALL" && uuidSchema.safeParse(rawCreatorId).success
        ? rawCreatorId
        : undefined;

    const projectId =
      rawProjectId && rawProjectId !== "ALL" && uuidSchema.safeParse(rawProjectId).success
        ? rawProjectId
        : undefined;

    const pillar = rawPillar && rawPillar !== "ALL" ? rawPillar : undefined;

    const items = await getContentCalendarItems({
      month: rawMonth,
      platform,
      status,
      pillar,
      creatorId,
      projectId,
    });

    return NextResponse.json(
      {
        items,
        month: rawMonth,
        meta: {
          total: items.length,
        },
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    if (err instanceof DomainError) {
      const status = err.code === "UNAUTHORIZED" ? 401 : 403;
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        { status, headers: NO_STORE_HEADERS }
      );
    }

    console.error("[KTMS_API_CONTENT_CALENDAR_ERROR]", err);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Gagal memuat data Content Calendar.",
        },
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
