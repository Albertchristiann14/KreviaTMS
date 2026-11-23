import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectGrid } from "@/features/tasks/components/ProjectGrid";
import { getProjectsForUser } from "@/features/tasks/queries/project.queries";
import { hasPermission, PERMISSIONS } from "@/lib/constants/permissions";
import { getAuthContext } from "@/server/auth/rbac";

export const dynamic = "force-dynamic";

function ProjectsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-44 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default async function ProjectsPage() {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login");
  }

  if (
    !hasPermission(ctx.permissions, PERMISSIONS.TASKS_PROJECT_READ, ctx.roleCode)
  ) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Akses Ditolak"
        description="Akun Anda tidak memiliki izin daftar proyek."
      />
    );
  }

  const { projects, assignableUsers } = await getProjectsForUser(ctx, {
    status: "ALL",
  });

  const canCreateProject = hasPermission(
    ctx.permissions,
    PERMISSIONS.TASKS_PROJECT_CREATE,
    ctx.roleCode
  );
  const canUpdateProject = hasPermission(
    ctx.permissions,
    PERMISSIONS.TASKS_PROJECT_UPDATE,
    ctx.roleCode
  );
  const canDeleteProject = hasPermission(
    ctx.permissions,
    PERMISSIONS.TASKS_PROJECT_DELETE,
    ctx.roleCode
  );

  return (
    <Suspense fallback={<ProjectsSkeleton />}>
      <ProjectGrid
        initialProjects={projects}
        assignableUsers={assignableUsers}
        currentUserId={ctx.userId}
        canCreateProject={canCreateProject}
        canUpdateProject={canUpdateProject}
        canDeleteProject={canDeleteProject}
      />
    </Suspense>
  );
}
