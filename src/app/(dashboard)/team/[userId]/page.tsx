import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/server/auth/rbac";
import { IndividualMetricsHeader } from "@/features/team-kpi/components/IndividualMetricsHeader";
import { KpiForbiddenCard } from "@/features/team-kpi/components/KpiForbiddenCard";
import { getIndividualProfileAndPerformance } from "@/features/team-kpi/queries/team.queries";

export const dynamic = "force-dynamic";

export default async function IndividualPerformancePage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login");
  }

  const [{ userId }, sp] = await Promise.all([params, searchParams]);
  const result = await getIndividualProfileAndPerformance(
    ctx,
    userId,
    sp.period
  );

  if (result.status === "NOT_FOUND") {
    notFound();
  }

  if (result.status === "FORBIDDEN") {
    return (
      <KpiForbiddenCard
        description="Akses performa anggota tim lain memerlukan izin kpi:performance:read_team."
        backHref={`/team/${ctx.userId}`}
        backLabel="Performa Saya"
      />
    );
  }

  return (
    <IndividualMetricsHeader
      data={result.data}
      isSelf={ctx.userId === userId}
    />
  );
}
