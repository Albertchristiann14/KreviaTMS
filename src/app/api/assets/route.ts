import { NextResponse } from "next/server";
import type { AssetCategory } from "@prisma/client";
import { z } from "zod";
import { ASSET_CATEGORY_VALUES } from "@/features/social-design/constants";
import { getAssetsPaginated } from "@/features/social-design/queries/asset.queries";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/server/auth/rbac";
import { DomainError } from "@/types/action-result";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache",
} as const;

const uuidSchema = z.string().uuid();

export async function GET(request: Request) {
  try {
    await requirePermission(PERMISSIONS.ASSETS_LIBRARY_READ);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || undefined;
    const rawCategory = searchParams.get("category")?.trim();
    const rawTags = searchParams.get("tags")?.trim();
    const rawProjectId = searchParams.get("projectId")?.trim();
    const includeSuperseded = searchParams.get("includeSuperseded") === "true";
    const page = Number(searchParams.get("page") ?? "1") || 1;
    const limit = Number(searchParams.get("limit") ?? "24") || 24;

    const category =
      rawCategory &&
      rawCategory !== "ALL" &&
      (ASSET_CATEGORY_VALUES as readonly string[]).includes(rawCategory)
        ? (rawCategory as AssetCategory)
        : undefined;

    const tags = rawTags
      ? rawTags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : undefined;

    const projectId =
      rawProjectId && rawProjectId !== "ALL" && uuidSchema.safeParse(rawProjectId).success
        ? rawProjectId
        : undefined;

    const data = await getAssetsPaginated({
      q,
      category,
      tags,
      projectId,
      includeSuperseded,
      page,
      limit,
    });

    return NextResponse.json(data, {
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

    console.error("[KTMS_API_ASSETS_ERROR]", err);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Gagal memuat daftar aset dari Asset Library.",
        },
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
