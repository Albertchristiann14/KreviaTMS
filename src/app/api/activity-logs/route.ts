import { NextResponse } from "next/server";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/server/auth/rbac";
import { DomainError } from "@/types/action-result";
import {
  queryActivityLogs,
  queryActivityLogsForCsv,
} from "@/features/system/queries/audit.queries";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store",
} as const;

function sanitizeCsvCell(raw: string): string {
  const needsFormulaGuard =
    /^[=+\-@\t\r\n]/.test(raw) || /^[=+\-@]/.test(raw.trimStart());
  const safe = needsFormulaGuard ? `'${raw}` : raw;
  return `"${safe.replaceAll('"', '""')}"`;
}

export async function GET(request: Request) {
  try {
    const ctx = await requirePermission(PERMISSIONS.SYSTEM_AUDIT_LOG_READ);
    const { searchParams } = new URL(request.url);

    const format = searchParams.get("format")?.toLowerCase() ?? "json";
    const moduleFilter = searchParams.get("module");
    const actorId = searchParams.get("actorId");
    const entityType = searchParams.get("entityType");
    const action = searchParams.get("action");
    const q = searchParams.get("q");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (format === "csv") {
      const rows = await queryActivityLogsForCsv(ctx, {
        module: moduleFilter,
        actorId,
        entityType,
        action,
        q,
        from,
        to,
      });

      const header = [
        "ID",
        "Timestamp (ISO)",
        "Actor ID",
        "Actor Name",
        "Actor Role",
        "Module",
        "Action",
        "Entity Type",
        "Entity ID",
        "Summary",
        "Old Values JSON",
        "New Values JSON",
        "IP Address",
      ]
        .map(sanitizeCsvCell)
        .join(",");

      const lines = rows.map((row) =>
        [
          row.id,
          row.createdAt,
          row.actor?.id ?? "SYSTEM",
          row.actor?.name ?? "System / Cron",
          row.actor?.role ?? "SYSTEM",
          row.module,
          row.action,
          row.entityType,
          row.entityId ?? "",
          row.summary,
          row.oldValues ? JSON.stringify(row.oldValues) : "",
          row.newValues ? JSON.stringify(row.newValues) : "",
          row.ipAddress ?? "",
        ]
          .map((cell) => sanitizeCsvCell(String(cell)))
          .join(",")
      );

      const csvBody = `\uFEFF${[header, ...lines].join("\r\n")}`;
      const stamp = new Date().toISOString().slice(0, 10);

      return new Response(csvBody, {
        status: 200,
        headers: {
          ...NO_STORE_HEADERS,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="ktms-activity-logs-${stamp}.csv"`,
        },
      });
    }

    const pageParam = Number(searchParams.get("page") ?? "1");
    const limitParam = Number(searchParams.get("limit") ?? "20");
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit =
      Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 20;

    const result = await queryActivityLogs(ctx, {
      module: moduleFilter,
      actorId,
      entityType,
      action,
      q,
      from,
      to,
      page,
      limit,
    });

    return NextResponse.json(result, {
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
            : err.code === "VALIDATION_ERROR"
              ? 400
              : 500;
      return NextResponse.json(
        { error: err.message, code: err.code },
        { status, headers: NO_STORE_HEADERS }
      );
    }

    console.error("[KTMS_ACTIVITY_LOGS_GET_ERROR]", err);
    return NextResponse.json(
      { error: "Gagal memuat activity logs.", code: "INTERNAL_ERROR" },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
