import { NextRequest, NextResponse } from "next/server";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/server/auth/rbac";
import { DomainError } from "@/types/action-result";
import { isValidUuid } from "@/features/team-kpi/queries/team.queries";
import {
  getJakartaCurrentYearMonth,
  getTeamPerformanceOverview,
} from "@/features/team-kpi/services/kpi-aggregator.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await requirePermission(PERMISSIONS.KPI_PERFORMANCE_READ_TEAM);

    const { searchParams } = request.nextUrl;
    const current = getJakartaCurrentYearMonth();

    const yearRaw = searchParams.get("year");
    const monthRaw = searchParams.get("month");
    const periodRaw = searchParams.get("period");
    const department = searchParams.get("department")?.trim() || null;
    const projectIdRaw = searchParams.get("projectId")?.trim() || null;

    let year = current.year;
    let month = current.month;

    if (periodRaw && /^\d{4}-(0[1-9]|1[0-2])$/.test(periodRaw)) {
      const [yStr, mStr] = periodRaw.split("-");
      year = Number(yStr);
      month = Number(mStr);
    } else {
      if (yearRaw !== null) {
        const parsedYear = Number(yearRaw);
        if (
          !Number.isInteger(parsedYear) ||
          parsedYear < 2024 ||
          parsedYear > 2100
        ) {
          throw new DomainError(
            "VALIDATION_ERROR",
            "Parameter year harus berupa angka antara 2024 hingga 2100."
          );
        }
        year = parsedYear;
      }
      if (monthRaw !== null) {
        const parsedMonth = Number(monthRaw);
        if (
          !Number.isInteger(parsedMonth) ||
          parsedMonth < 1 ||
          parsedMonth > 12
        ) {
          throw new DomainError(
            "VALIDATION_ERROR",
            "Parameter month harus berupa angka antara 1 hingga 12."
          );
        }
        month = parsedMonth;
      }
    }

    const projectId =
      projectIdRaw && projectIdRaw !== "ALL" ? projectIdRaw : null;
    if (projectId && !isValidUuid(projectId)) {
      throw new DomainError(
        "VALIDATION_ERROR",
        "Parameter projectId harus berupa UUID yang valid."
      );
    }

    const overview = await getTeamPerformanceOverview({
      year,
      month,
      department,
      projectId,
    });

    return NextResponse.json(overview, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-cache",
      },
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
        { error: { code: err.code, message: err.message } },
        {
          status,
          headers: { "Cache-Control": "private, no-cache" },
        }
      );
    }

    console.error("[KTMS_KPI_DASHBOARD_ERROR]", err);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Gagal memuat agregasi dashboard KPI.",
        },
      },
      {
        status: 500,
        headers: { "Cache-Control": "private, no-cache" },
      }
    );
  }
}
