import { NextResponse } from "next/server";
import { z } from "zod";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/server/auth/rbac";
import { getTaskDetailById } from "@/features/tasks/queries/task.queries";
import { DomainError } from "@/types/action-result";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache",
} as const;

const uuidSchema = z.string().uuid();

export async function GET(
  _request: Request,
  context: { params: Promise<{ taskId: string }> }
) {
  try {
    const ctx = await requirePermission(PERMISSIONS.TASKS_ITEM_READ);
    const { taskId } = await context.params;

    if (!uuidSchema.safeParse(taskId).success) {
      return NextResponse.json(
        { error: "Format ID task tidak valid.", code: "VALIDATION_ERROR" },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const detail = await getTaskDetailById(ctx, taskId);
    if (!detail) {
      return NextResponse.json(
        {
          error: "Task tidak ditemukan atau Anda tidak memiliki akses.",
          code: "NOT_FOUND",
        },
        { status: 404, headers: NO_STORE_HEADERS }
      );
    }

    return NextResponse.json(detail, {
      status: 200,
      headers: NO_STORE_HEADERS,
    });
  } catch (err) {
    if (err instanceof DomainError) {
      const status =
        err.code === "UNAUTHORIZED"
          ? 401
          : err.code === "FORBIDDEN"
            ? 403
            : 400;
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status, headers: NO_STORE_HEADERS }
      );
    }

    console.error("[KTMS_TASK_DETAIL_API_ERROR]", err);
    return NextResponse.json(
      {
        error: "Gagal memuat detail task.",
        code: "INTERNAL_ERROR",
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
