import { notFound, redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { ProjectDetailTabs } from "@/features/tasks/components/ProjectDetailTabs";
import {
  getAssignableUsersWithWorkload,
  getProjectDetailById,
} from "@/features/tasks/queries/project.queries";
import { hasPermission, PERMISSIONS } from "@/lib/constants/permissions";
import { getAuthContext } from "@/server/auth/rbac";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
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
        description="Anda tidak memiliki izin detail proyek."
      />
    );
  }

  const { projectId } = await params;
  const [project, assignableUsers] = await Promise.all([
    getProjectDetailById(ctx, projectId),
    getAssignableUsersWithWorkload(),
  ]);

  if (!project) {
    notFound();
  }

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
  const canCreateTask = hasPermission(
    ctx.permissions,
    PERMISSIONS.TASKS_ITEM_CREATE,
    ctx.roleCode
  );
  const canAssignTask = hasPermission(
    ctx.permissions,
    PERMISSIONS.TASKS_ITEM_ASSIGN,
    ctx.roleCode
  );
  const canEditTask = hasPermission(
    ctx.permissions,
    PERMISSIONS.TASKS_ITEM_UPDATE,
    ctx.roleCode
  );
  const canDeleteTask = hasPermission(
    ctx.permissions,
    PERMISSIONS.TASKS_ITEM_DELETE,
    ctx.roleCode
  );

  return (
    <ProjectDetailTabs
      project={project}
      assignableUsers={assignableUsers}
      currentUserId={ctx.userId}
      canUpdateProject={canUpdateProject}
      canDeleteProject={canDeleteProject}
      canCreateTask={canCreateTask}
      canAssignTask={canAssignTask}
      canEditTask={canEditTask}
      canDeleteTask={canDeleteTask}
    />
  );
}
