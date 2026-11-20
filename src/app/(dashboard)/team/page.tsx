import { redirect } from "next/navigation";
import { hasPermission, PERMISSIONS } from "@/lib/constants/permissions";
import { getAuthContext } from "@/server/auth/rbac";
import { KpiForbiddenCard } from "@/features/team-kpi/components/KpiForbiddenCard";
import { TeamDirectoryTable } from "@/features/team-kpi/components/TeamDirectoryTable";
import { getTeamDirectoryData } from "@/features/team-kpi/queries/team.queries";

export const dynamic = "force-dynamic";

export default async function TeamDirectoryPage() {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login");
  }

  if (
    !hasPermission(ctx.permissions, PERMISSIONS.KPI_DIRECTORY_READ, ctx.roleCode)
  ) {
    return (
      <KpiForbiddenCard description="Akses Direktori Tim memerlukan izin kpi:directory:read." />
    );
  }

  const data = await getTeamDirectoryData(ctx);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Direktori Tim
        </h1>
        <p className="text-xs text-muted-foreground">
          Anggota aktif, divisi, dan kapasitas kerja
        </p>
      </div>

      <TeamDirectoryTable
        members={data.members}
        departments={data.departments}
        roles={data.roles}
        canReadWorkload={data.canReadWorkload}
        currentUserId={ctx.userId}
      />
    </div>
  );
}
