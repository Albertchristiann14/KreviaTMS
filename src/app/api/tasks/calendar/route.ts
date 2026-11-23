import { NextResponse } from "next/server";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/server/auth/rbac";
import { getWorkCalendarTasks } from "@/features/tasks/queries/task.queries";
import { DomainError } from "@/types/action-result";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache",
} as const;

function resolveDateRange(
  fromParam: string | null,
  toParam: string | null
): { from: Date; to: Date } | null {
  const now = new Date();
  const defaultFrom = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0)
  );
  const defaultTo = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59)
  );

  const from = fromParam ? new Date(fromParam) : defaultFrom;
  const to = toParam ? new Date(toParam) : defaultTo;

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return null;
  }

  return { from, to };
}

export async function GET(request: Request) {
  try {
    const ctx = await requirePermission(PERMISSIONS.TASKS_ITEM_READ);
    const { searchParams } = new URL(request.url);

    const range = resolveDateRange(
      searchParams.get("from"),
      searchParams.get("to")
    );

    if (!range) {
      return NextResponse.json(
        {
          error: "Parameter tanggal 'from' atau 'to' tidak valid.",
          code: "VALIDATION_ERROR",
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const projectId = searchParams.get("projectId");
    const assigneeId = searchParams.get("assigneeId");
    const priority = searchParams.get("priority");
    const taskType = searchParams.get("taskType");
    const includeContentOverlay =
      searchParams.get("includeContentOverlay") !== "false";

    const data = await getWorkCalendarTasks(ctx, {
      from: range.from,
      to: range.to,
      projectId,
      assigneeId,
      priority,
      taskType,
      includeContentOverlay,
    });

    return NextResponse.json(
      {
        ...data,
        range: {
          from: range.from.toISOString(),
          to: range.to.toISOString(),
        },
      },
      {
        status: 200,
        headers: NO_STORE_HEADERS,
      }
    );
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

    console.error("[KTMS_TASKS_CALENDAR_API_ERROR]", err);
    return NextResponse.json(
      {
        error: "Gagal memuat data Work Calendar.",
        code: "INTERNAL_ERROR",
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
