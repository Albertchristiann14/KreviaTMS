import Link from "next/link";
import { redirect } from "next/navigation";
import { Award } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { hasPermission, PERMISSIONS } from "@/lib/constants/permissions";
import { cn } from "@/lib/utils";
import { getAuthContext } from "@/server/auth/rbac";
import { KpiForbiddenCard } from "@/features/team-kpi/components/KpiForbiddenCard";
import { KpiTemplateBuilder } from "@/features/team-kpi/components/KpiTemplateBuilder";
import { getKpiTemplatesBuilderData } from "@/features/team-kpi/queries/kpi.queries";

export const dynamic = "force-dynamic";

export default async function KpiTemplatesPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login");
  }

  const canManageTemplates = hasPermission(
    ctx.permissions,
    PERMISSIONS.KPI_TEMPLATE_MANAGE,
    ctx.roleCode
  );
  const canManageAssignments = hasPermission(
    ctx.permissions,
    PERMISSIONS.KPI_ASSIGNMENT_MANAGE,
    ctx.roleCode
  );

  if (!canManageTemplates && !canManageAssignments) {
    return (
      <KpiForbiddenCard description="Akses Template & Target KPI memerlukan izin kpi:template:manage atau kpi:assignment:manage." />
    );
  }

  const sp = await searchParams;
  const data = await getKpiTemplatesBuilderData(sp.period);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Template & Target KPI
          </h1>
          <p className="text-xs text-muted-foreground">
            Katalog indikator dan penetapan bobot bulanan (100%)
          </p>
        </div>

        <Link
          href={`/kpi/evaluations?period=${data.period.periodMonth}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "w-fit gap-1.5"
          )}
        >
          <Award className="size-3.5" aria-hidden="true" />
          <span>Evaluasi KPI</span>
        </Link>
      </div>

      <KpiTemplateBuilder
        key={data.period.periodMonth}
        data={data}
        canManageTemplates={canManageTemplates}
        canManageAssignments={canManageAssignments}
      />
    </div>
  );
}
