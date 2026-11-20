import { notFound, redirect } from "next/navigation";
import { getAuthContext } from "@/server/auth/rbac";
import { EvaluationScoreForm } from "@/features/team-kpi/components/EvaluationScoreForm";
import { KpiForbiddenCard } from "@/features/team-kpi/components/KpiForbiddenCard";
import { getEvaluationDetailById } from "@/features/team-kpi/queries/kpi.queries";

export const dynamic = "force-dynamic";

export default async function EvaluationDetailPage({
  params,
}: {
  params: Promise<{ evaluationId: string }>;
}) {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login");
  }

  const { evaluationId } = await params;
  const result = await getEvaluationDetailById(ctx, evaluationId);

  if (result.status === "NOT_FOUND") {
    notFound();
  }

  if (result.status === "FORBIDDEN") {
    return (
      <KpiForbiddenCard
        description={result.reason}
        backHref="/kpi/evaluations"
        backLabel="Daftar Evaluasi"
      />
    );
  }

  return (
    <EvaluationScoreForm
      evaluation={result.evaluation}
      permissions={result.permissions}
    />
  );
}
