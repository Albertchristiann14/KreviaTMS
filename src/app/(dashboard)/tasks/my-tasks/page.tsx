import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { MyTasksTable } from "@/features/tasks/components/MyTasksTable";
import { getTaskFormOptions } from "@/features/tasks/queries/project.queries";
import { getMyTasksForUser } from "@/features/tasks/queries/task.queries";
import { hasPermission, PERMISSIONS } from "@/lib/constants/permissions";
import { getAuthContext } from "@/server/auth/rbac";

export const dynamic = "force-dynamic";

function firstParam(val: string | string[] | undefined): string | undefined {
  return Array.isArray(val) ? val[0] : val;
}

function MyTasksSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}

export default async function MyTasksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login");
  }

  if (!hasPermission(ctx.permissions, PERMISSIONS.TASKS_ITEM_READ, ctx.roleCode)) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Akses Ditolak"
        description="Akun Anda tidak memiliki izin melihat tugas."
      />
    );
  }

  const sp = await searchParams;
  const statusParam = firstParam(sp.status);

  const [myTasks, formOptions] = await Promise.all([
    getMyTasksForUser(ctx, {
      status: statusParam === "CANCELLED" ? "CANCELLED" : undefined,
    }),
    getTaskFormOptions(ctx),
  ]);

  const canCreateTask = hasPermission(
    ctx.permissions,
    PERMISSIONS.TASKS_ITEM_CREATE,
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
  const canAssignOthers = hasPermission(
    ctx.permissions,
    PERMISSIONS.TASKS_ITEM_ASSIGN,
    ctx.roleCode
  );
  const canApproveTasks = hasPermission(
    ctx.permissions,
    PERMISSIONS.TASKS_ITEM_APPROVE,
    ctx.roleCode
  );

  return (
    <Suspense fallback={<MyTasksSkeleton />}>
      <MyTasksTable
        initialData={myTasks}
        projects={formOptions.projects}
        assignees={formOptions.assignees}
        currentUserId={ctx.userId}
        canCreateTask={canCreateTask}
        canEditTask={canEditTask}
        canDeleteTask={canDeleteTask}
        canAssignOthers={canAssignOthers}
        canApproveTasks={canApproveTasks}
      />
    </Suspense>
  );
}
