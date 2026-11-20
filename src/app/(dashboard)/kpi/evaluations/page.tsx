import Link from "next/link";
import { redirect } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { hasAnyPermission, PERMISSIONS } from "@/lib/constants/permissions";
import { cn } from "@/lib/utils";
import { getAuthContext } from "@/server/auth/rbac";
import { EvaluationsDirectoryClient } from "@/features/team-kpi/components/EvaluationsDirectoryClient";
import { KpiForbiddenCard } from "@/features/team-kpi/components/KpiForbiddenCard";
import { getEvaluationsListData } from "@/features/team-kpi/queries/kpi.queries";

export const dynamic = "force-dynamic";

export default async function MonthlyEvaluationsPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login");
  }

  const canAccess = hasAnyPermission(
    ctx.permissions,
    [
      PERMISSIONS.KPI_EVALUATION_CREATE,
      PERMISSIONS.KPI_EVALUATION_SUBMIT,
      PERMISSIONS.KPI_EVALUATION_REVIEW,
      PERMISSIONS.KPI_EVALUATION_FINALIZE,
      PERMISSIONS.KPI_PERFORMANCE_READ_OWN,
    ],
    ctx.roleCode
  );

  if (!canAccess) {
    return (
      <KpiForbiddenCard description="Anda tidak memiliki izin untuk mengakses halaman Evaluasi KPI." />
    );
  }

  const sp = await searchParams;
  const data = await getEvaluationsListData(ctx, sp.period);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {data.canManageEvaluations ? "Evaluasi KPI" : "Evaluasi Saya"}
          </h1>
          <p className="text-xs text-muted-foreground">
            {data.canManageEvaluations
              ? `Siklus penilaian bulanan · ${data.period.periodMonth}`
              : "Rapor evaluasi bulanan pribadi"}
          </p>
        </div>

        {data.canManageEvaluations ? (
          <Link
            href={`/kpi/templates?period=${data.period.periodMonth}`}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-fit gap-1.5"
            )}
          >
            <SlidersHorizontal className="size-3.5" aria-hidden="true" />
            <span>Atur Bobot & Target</span>
          </Link>
        ) : null}
      </div>

      <EvaluationsDirectoryClient data={data} />
    </div>
  );
}
