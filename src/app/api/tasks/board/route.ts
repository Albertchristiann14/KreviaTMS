import { NextResponse } from "next/server";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/server/auth/rbac";
import { getKanbanBoardData } from "@/features/tasks/queries/task.queries";
import { DomainError } from "@/types/action-result";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache",
} as const;

export async function GET(request: Request) {
  try {
    const ctx = await requirePermission(PERMISSIONS.TASKS_ITEM_READ);
    const { searchParams } = new URL(request.url);

    const projectId = searchParams.get("projectId");
    const assigneeId = searchParams.get("assigneeId");
    const priority = searchParams.get("priority");
    const taskType = searchParams.get("taskType");
    const q = searchParams.get("q");
    const overdueOnly =
      searchParams.get("overdueOnly") === "true" ||
      searchParams.get("overdueOnly") === "1";
    const includeCancelled =
      searchParams.get("includeCancelled") === "true" ||
      searchParams.get("includeCancelled") === "1";

    const data = await getKanbanBoardData(ctx, {
      projectId,
      assigneeId,
      priority,
      taskType,
      q,
      overdueOnly,
      includeCancelled,
    });

    return NextResponse.json(data, {
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

    console.error("[KTMS_TASKS_BOARD_API_ERROR]", err);
    return NextResponse.json(
      {
        error: "Gagal memuat data Kanban Board.",
        code: "INTERNAL_ERROR",
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
