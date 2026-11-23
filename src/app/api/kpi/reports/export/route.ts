import { NextRequest, NextResponse } from "next/server";
import { hasPermission, PERMISSIONS } from "@/lib/constants/permissions";
import { requirePermission } from "@/server/auth/rbac";
import { prisma } from "@/server/db/prisma";
import { executeAuditedMutation } from "@/server/services/audit-logger";
import { DomainError } from "@/types/action-result";
import { isValidUuid } from "@/features/team-kpi/queries/team.queries";
import {
  computeUserMonthlyMetrics,
  decimalToNumber,
  formatPeriodMonthLabel,
  getJakartaCurrentYearMonth,
  getJakartaPeriodWindow,
  getTeamPerformanceOverview,
} from "@/features/team-kpi/services/kpi-aggregator.service";

export const dynamic = "force-dynamic";

function escapeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return '""';
  }
  const str = String(value);
  // Protect Excel/Sheets from CSV formula injection (including leading whitespace/newlines)
  const needsFormulaGuard =
    typeof value === "string" &&
    str.length > 0 &&
    (/^[=+\-@\t\r\n]/.test(str) || /^[=+\-@]/.test(str.trimStart()));
  const safe = needsFormulaGuard ? `'${str}` : str;
  return `"${safe.replace(/"/g, '""')}"`;
}

function buildCsvContent(
  headers: readonly string[],
  rows: ReadonlyArray<ReadonlyArray<string | number | boolean | null | undefined>>
): string {
  const headerLine = headers.map((h) => escapeCsvCell(h)).join(",");
  const bodyLines = rows.map((row) =>
    row.map((cell) => escapeCsvCell(cell)).join(",")
  );
  return `\uFEFF${[headerLine, ...bodyLines].join("\r\n")}`;
}

function formatWibTimestamp(date: Date): string {
  return (
    new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date) + " WIB"
  );
}

export async function HEAD() {
  try {
    await requirePermission(PERMISSIONS.KPI_REPORT_EXPORT);
    return new Response(null, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
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
      return new Response(null, {
        status,
        headers: { "Cache-Control": "private, no-cache" },
      });
    }
    return new Response(null, {
      status: 500,
      headers: { "Cache-Control": "private, no-cache" },
    });
  }
}

export async function GET(request: NextRequest) {
  try {
    const ctx = await requirePermission(PERMISSIONS.KPI_REPORT_EXPORT);
    const canReadTeam = hasPermission(
      ctx.permissions,
      PERMISSIONS.KPI_PERFORMANCE_READ_TEAM,
      ctx.roleCode
    );

    const { searchParams } = request.nextUrl;
    const current = getJakartaCurrentYearMonth();

    const periodRaw = searchParams.get("period")?.trim();
    const yearRaw = searchParams.get("year");
    const monthRaw = searchParams.get("month");

    let year = current.year;
    let month = current.month;

    if (periodRaw && /^\d{4}-(0[1-9]|1[0-2])$/.test(periodRaw)) {
      const [yStr, mStr] = periodRaw.split("-");
      year = Number(yStr);
      month = Number(mStr);
    } else {
      if (yearRaw) {
        const parsedYear = Number(yearRaw);
        if (
          !Number.isInteger(parsedYear) ||
          parsedYear < 2024 ||
          parsedYear > 2100
        ) {
          throw new DomainError(
            "VALIDATION_ERROR",
            "Parameter year tidak valid."
          );
        }
        year = parsedYear;
      }
      if (monthRaw) {
        const parsedMonth = Number(monthRaw);
        if (
          !Number.isInteger(parsedMonth) ||
          parsedMonth < 1 ||
          parsedMonth > 12
        ) {
          throw new DomainError(
            "VALIDATION_ERROR",
            "Parameter month tidak valid."
          );
        }
        month = parsedMonth;
      }
    }

    const periodLabel = formatPeriodMonthLabel(year, month);
    const requestedScope = searchParams.get("scope")?.trim() || (canReadTeam ? "team" : "individual");
    const requestedUserId = searchParams.get("userId")?.trim() || null;
    const department = searchParams.get("department")?.trim() || null;
    const projectIdRaw = searchParams.get("projectId")?.trim() || null;
    const projectId =
      projectIdRaw && projectIdRaw !== "ALL" ? projectIdRaw : null;

    if (projectId && !isValidUuid(projectId)) {
      throw new DomainError(
        "VALIDATION_ERROR",
        "Parameter projectId tidak valid."
      );
    }

    if (requestedUserId && !isValidUuid(requestedUserId)) {
      throw new DomainError(
        "VALIDATION_ERROR",
        "Parameter userId tidak valid."
      );
    }

    // Strict RBAC scope enforcement: employees lacking kpi:performance:read_team
    // can ONLY export their own finalized individual report.
    if (!canReadTeam) {
      if (requestedScope !== "individual") {
        throw new DomainError(
          "FORBIDDEN",
          "Anda tidak memiliki izin untuk mengekspor laporan tim atau proyek."
        );
      }
      if (requestedUserId && requestedUserId !== ctx.userId) {
        throw new DomainError(
          "FORBIDDEN",
          "Anda hanya dapat mengekspor laporan KPI milik Anda sendiri."
        );
      }
    }

    const generatedAtWib = formatWibTimestamp(new Date());
    let csv = "";
    let filename = `ktms-kpi-${periodLabel}.csv`;
    let rowCount = 0;
    const effectiveScope = !canReadTeam ? "individual" : requestedScope;
    const effectiveTargetUserId = !canReadTeam ? ctx.userId : requestedUserId;

    if (effectiveScope === "individual") {
      const targetId = effectiveTargetUserId ?? ctx.userId;

      const [targetUser, evaluation] = await Promise.all([
        prisma.user.findFirst({
          where: { id: targetId, deletedAt: null },
          select: {
            id: true,
            fullName: true,
            email: true,
            department: true,
            jobTitle: true,
            role: { select: { code: true } },
          },
        }),
        prisma.monthlyEvaluation.findUnique({
          where: {
            userId_periodYear_periodMonth: {
              userId: targetId,
              periodYear: year,
              periodMonth: month,
            },
          },
          include: {
            evaluator: { select: { fullName: true } },
            items: {
              orderBy: { weight: "desc" },
              include: { kpiTemplate: { select: { unit: true } } },
            },
          },
        }),
      ]);

      if (!targetUser) {
        throw new DomainError("NOT_FOUND", "Anggota tim tidak ditemukan.");
      }

      if (!canReadTeam && (!evaluation || evaluation.status !== "FINALIZED")) {
        throw new DomainError(
          "FORBIDDEN",
          `Rapor KPI pribadi periode ${periodLabel} hanya dapat diunduh setelah evaluasi berstatus FINALIZED.`
        );
      }

      if (evaluation) {
        const headers = [
          "Nama",
          "Email",
          "Role",
          "Divisi",
          "Periode",
          "Status Evaluasi",
          "Indikator KPI",
          "Sumber Metrik",
          "Satuan",
          "Bobot (%)",
          "Target",
          "Aktual",
          "Capaian (%)",
          "Skor Kontribusi",
          "Weighted KPI Score",
          "Grade",
          "Evaluator",
          "Catatan Bukti",
          "Generated At (WIB)",
          "Exported By",
        ];

        const rows = evaluation.items.map((item) => [
          targetUser.fullName,
          targetUser.email,
          targetUser.role.code,
          targetUser.department,
          periodLabel,
          evaluation.status,
          item.indicatorNameSnapshot,
          item.metricSource,
          item.kpiTemplate.unit,
          decimalToNumber(item.weight) ?? 0,
          decimalToNumber(item.targetValue) ?? 0,
          decimalToNumber(item.actualValue) ?? "N/A",
          decimalToNumber(item.achievementPct) ?? "N/A",
          decimalToNumber(item.weightedScore) ?? "N/A",
          decimalToNumber(evaluation.weightedKpiScore) ?? 0,
          evaluation.performanceGrade ?? "-",
          evaluation.evaluator.fullName,
          item.evidenceNotes ?? "",
          generatedAtWib,
          ctx.fullName,
        ]);
        rowCount = rows.length;
        csv = buildCsvContent(headers, rows);
      } else {
        const live = await computeUserMonthlyMetrics(targetId, year, month);
        const headers = [
          "Nama",
          "Email",
          "Role",
          "Divisi",
          "Periode",
          "Status Evaluasi",
          "Tasks Assigned",
          "Tasks Done",
          "On-Time Tasks",
          "TCR (%)",
          "OTDR (%)",
          "DQS",
          "CPVS (%)",
          "Content Delivered",
          "Generated At (WIB)",
          "Exported By",
        ];
        const rows = [
          [
            targetUser.fullName,
            targetUser.email,
            targetUser.role.code,
            targetUser.department,
            periodLabel,
            "LIVE_PREVIEW",
            live.totalTasksAssigned,
            live.totalTasksCompleted,
            live.tasksCompletedOnTime,
            live.completionRate ?? "N/A",
            live.onTimeRate ?? "N/A",
            live.designQualityScore ?? "N/A",
            live.cpvsScore ?? "N/A",
            live.contentDeliveredCount,
            generatedAtWib,
            ctx.fullName,
          ],
        ];
        rowCount = rows.length;
        csv = buildCsvContent(headers, rows);
      }

      const safeSlug = targetUser.fullName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      filename = `ktms-kpi-individual-${safeSlug || targetUser.id}-${periodLabel}.csv`;
    } else if (effectiveScope === "tasks") {
      const window = getJakartaPeriodWindow(year, month);
      const tasks = await prisma.task.findMany({
        where: {
          deletedAt: null,
          status: { not: "CANCELLED" },
          ...(department
            ? { assignee: { department } }
            : {}),
          AND: [
            projectId
              ? { projectId, project: { is: { deletedAt: null } } }
              : {
                  OR: [
                    { projectId: null },
                    { project: { is: { deletedAt: null } } },
                  ],
                },
            {
              OR: [
                { dueDate: { gte: window.start, lt: window.end } },
                {
                  dueDate: null,
                  completedAt: { gte: window.start, lt: window.end },
                },
              ],
            },
          ],
        },
        orderBy: [{ project: { code: "asc" } }, { dueDate: "asc" }],
        select: {
          taskCode: true,
          title: true,
          taskType: true,
          status: true,
          priority: true,
          dueDate: true,
          firstSubmittedAt: true,
          completedAt: true,
          revisionCount: true,
          isOnTime: true,
          project: { select: { code: true, name: true } },
          assignee: { select: { fullName: true, department: true } },
        },
      });

      const headers = [
        "Task Code",
        "Project Code",
        "Project Name",
        "Judul Task",
        "Tipe",
        "Status",
        "Prioritas",
        "Assignee",
        "Divisi",
        "Due Date (WIB)",
        "First Submitted (WIB)",
        "Completed At (WIB)",
        "Ketepatan",
        "Revision Count",
        "Generated At (WIB)",
        "Exported By",
      ];

      const rows = tasks.map((t) => {
        let onTimeLabel = "Belum Selesai";
        if (t.status === "DONE") {
          if (!t.dueDate) {
            onTimeLabel = "Tanpa Deadline";
          } else {
            const eff =
              t.revisionCount === 0
                ? (t.firstSubmittedAt ?? t.completedAt)
                : t.completedAt;
            const onTime = eff !== null && eff.getTime() <= t.dueDate.getTime();
            onTimeLabel = onTime ? "Tepat Waktu" : "Terlambat";
          }
        } else if (t.dueDate && t.dueDate < new Date()) {
          onTimeLabel = "Overdue";
        }

        return [
          t.taskCode,
          t.project?.code ?? "Tanpa Proyek",
          t.project?.name ?? "Umum",
          t.title,
          t.taskType,
          t.status,
          t.priority,
          t.assignee?.fullName ?? "Unassigned",
          t.assignee?.department ?? "-",
          t.dueDate ? formatWibTimestamp(t.dueDate) : "-",
          t.firstSubmittedAt ? formatWibTimestamp(t.firstSubmittedAt) : "-",
          t.completedAt ? formatWibTimestamp(t.completedAt) : "-",
          onTimeLabel,
          t.revisionCount,
          generatedAtWib,
          ctx.fullName,
        ];
      });

      rowCount = rows.length;
      csv = buildCsvContent(headers, rows);
      filename = `ktms-task-execution-report-${periodLabel}.csv`;
    } else {
      // Monthly Team Performance Summary CSV
      const overview = await getTeamPerformanceOverview({
        year,
        month,
        department,
        projectId,
      });

      const headers = [
        "Nama",
        "Email",
        "Role",
        "Divisi",
        "Jabatan",
        "Periode",
        "Tasks Assigned",
        "Tasks Done",
        "On-Time Tasks",
        "Active Tasks",
        "Overdue Tasks",
        "TCR (%)",
        "OTDR (%)",
        "DQS",
        "CPVS (%)",
        "Content Delivered",
        "Weighted KPI Score",
        "Grade",
        "Status Evaluasi",
        "Sumber Data",
        "Generated At (WIB)",
        "Exported By",
      ];

      const rows = overview.leaderboard.map((r) => [
        r.fullName,
        r.email,
        r.roleCode,
        r.department,
        r.jobTitle,
        periodLabel,
        r.tasksAssigned,
        r.tasksCompleted,
        r.tasksOnTime,
        r.activeTasksCount,
        r.overdueTasksCount,
        r.tcr ?? "N/A",
        r.otdr ?? "N/A",
        r.dqs ?? "N/A",
        r.cpvs ?? "N/A",
        r.contentDeliveredCount,
        r.weightedKpiScore,
        r.grade,
        r.evaluationStatus ?? "BELUM_DIGENERATE",
        r.isFinalizedSnapshot ? "FINALIZED_SNAPSHOT" : "LIVE_CALCULATION",
        generatedAtWib,
        ctx.fullName,
      ]);

      rowCount = rows.length;
      csv = buildCsvContent(headers, rows);
      filename = `ktms-team-kpi-summary-${periodLabel}.csv`;
    }

    await executeAuditedMutation(ctx, async () => ({
      result: { exportedRows: rowCount },
      audit: {
        module: "TEAM_KPI",
        action: "REPORT_EXPORTED",
        entityType: "KPI_REPORT",
        entityId: effectiveTargetUserId ?? null,
        summary: `Ekspor laporan CSV (${effectiveScope}) periode ${periodLabel} (${rowCount} baris) oleh ${ctx.fullName}.`,
        newValues: {
          scope: effectiveScope,
          periodMonth: periodLabel,
          department,
          projectId,
          targetUserId: effectiveTargetUserId,
          rowCount,
          filename,
        },
      },
    }));

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
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
            : err.code === "NOT_FOUND"
              ? 404
              : 400;
      return NextResponse.json(
        { error: { code: err.code, message: err.message } },
        {
          status,
          headers: { "Cache-Control": "private, no-cache" },
        }
      );
    }

    console.error("[KTMS_KPI_EXPORT_ERROR]", err);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Gagal mengekspor laporan KPI.",
        },
      },
      {
        status: 500,
        headers: { "Cache-Control": "private, no-cache" },
      }
    );
  }
}
