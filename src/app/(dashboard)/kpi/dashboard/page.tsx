import Link from "next/link";
import { redirect } from "next/navigation";
import { FileSpreadsheet, SlidersHorizontal } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { hasPermission, PERMISSIONS } from "@/lib/constants/permissions";
import { cn } from "@/lib/utils";
import { getAuthContext } from "@/server/auth/rbac";
import { KpiForbiddenCard } from "@/features/team-kpi/components/KpiForbiddenCard";
import { TeamPerformanceCharts } from "@/features/team-kpi/components/TeamPerformanceCharts";
import { getInitialTeamDashboardData } from "@/features/team-kpi/queries/kpi.queries";
import { sanitizeOptionalUuid } from "@/features/team-kpi/utils/kpi-ui";

export const dynamic = "force-dynamic";

export default async function TeamKpiDashboardPage({
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
        description="Akses Performa Tim memerlukan izin kpi:performance:read_team."
        backHref={`/team/${ctx.userId}`}
        backLabel="Performa Saya"
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Performa Tim
          </h1>
          <p className="text-xs text-muted-foreground">
            Ringkasan KPI, beban kerja, dan leaderboard ·{" "}
            <span className="font-mono font-medium text-foreground">
              {overview.period.periodMonth}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/kpi/templates?period=${overview.period.periodMonth}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5"
            )}
          >
            <SlidersHorizontal className="size-3.5" aria-hidden="true" />
            <span>Template KPI</span>
          </Link>
          <Link
            href={`/kpi/reports?period=${overview.period.periodMonth}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "gap-1.5"
            )}
          >
            <FileSpreadsheet className="size-3.5" aria-hidden="true" />
            <span>Laporan</span>
          </Link>
        </div>
      </div>

      <TeamPerformanceCharts
        initialData={overview}
        filterOptions={filterOptions}
      />
    </div>
  );
}
