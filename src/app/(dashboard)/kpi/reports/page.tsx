import { redirect } from "next/navigation";
import { hasPermission, PERMISSIONS } from "@/lib/constants/permissions";
import { getAuthContext } from "@/server/auth/rbac";
import { KpiForbiddenCard } from "@/features/team-kpi/components/KpiForbiddenCard";
import { ReportExportToolbar } from "@/features/team-kpi/components/ReportExportToolbar";
import { getInitialTeamDashboardData } from "@/features/team-kpi/queries/kpi.queries";
import { sanitizeOptionalUuid } from "@/features/team-kpi/utils/kpi-ui";

export const dynamic = "force-dynamic";

export default async function KpiReportsPage({
  searchParams,
}: {
  searchParams: Promise<{
    period?: string;
    department?: string;
    projectId?: string;
  }>;
}) {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login");
  }

  if (
    !hasPermission(
      ctx.permissions,
      PERMISSIONS.KPI_PERFORMANCE_READ_TEAM,
      ctx.roleCode
    )
  ) {
    return (
      <KpiForbiddenCard
        description="Laporan tim memerlukan izin kpi:performance:read_team."
        backHref="/kpi/evaluations"
        backLabel="Evaluasi Saya"
      />
    );
  }

  const sp = await searchParams;
  const { overview, filterOptions } = await getInitialTeamDashboardData(
    sp.period,
    sp.department,
    sanitizeOptionalUuid(sp.projectId)
  );

  return (
    <div className="space-y-6">
      <div className="print:hidden" data-print-hide="true">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Laporan KPI
        </h1>
        <p className="text-xs text-muted-foreground">
          Pratinjau laporan bulanan, unduhan CSV, dan cetak PDF
        </p>
      </div>

      <ReportExportToolbar
        key={`${overview.period.periodMonth}:${overview.filters.department ?? "ALL"}:${overview.filters.projectId ?? "ALL"}`}
        overview={overview}
        filterOptions={filterOptions}
        exporterName={ctx.fullName}
      />
    </div>
  );
}
