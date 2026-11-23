import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { KanbanBoard } from "@/features/tasks/components/KanbanBoard";
import type { KanbanBoardFilterValues } from "@/features/tasks/hooks/useKanbanBoard";
import { getTaskFormOptions } from "@/features/tasks/queries/project.queries";
import { getKanbanBoardData } from "@/features/tasks/queries/task.queries";
import { hasPermission, PERMISSIONS } from "@/lib/constants/permissions";
import { getAuthContext } from "@/server/auth/rbac";

export const dynamic = "force-dynamic";

function firstParam(val: string | string[] | undefined): string | undefined {
  return Array.isArray(val) ? val[0] : val;
}

function BoardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-44 rounded-lg" />
        <Skeleton className="h-8 w-28 rounded-lg" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-52 rounded-lg" />
        <Skeleton className="h-8 w-40 rounded-lg" />
        <Skeleton className="h-8 w-36 rounded-lg" />
      </div>
      <div className="flex gap-3.5 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[460px] w-[296px] shrink-0 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

export default async function KanbanBoardPage({
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
        description="Akun Anda tidak memiliki izin Kanban Board."
      />
    );
  }

  const sp = await searchParams;
  const initialFilters: KanbanBoardFilterValues = {
    projectId: firstParam(sp.projectId) ?? "ALL",
    assigneeId: firstParam(sp.assigneeId) ?? "ALL",
    priority: firstParam(sp.priority) ?? "ALL",
    taskType: firstParam(sp.taskType) ?? "ALL",
    overdueOnly: firstParam(sp.overdueOnly) === "true",
    q: firstParam(sp.q) ?? "",
  };

  const [boardData, formOptions] = await Promise.all([
    getKanbanBoardData(ctx, {
      projectId:
        initialFilters.projectId !== "ALL" ? initialFilters.projectId : null,
      assigneeId:
        initialFilters.assigneeId !== "ALL" ? initialFilters.assigneeId : null,
      priority:
        initialFilters.priority !== "ALL" ? initialFilters.priority : null,
      taskType:
        initialFilters.taskType !== "ALL" ? initialFilters.taskType : null,
      overdueOnly: initialFilters.overdueOnly,
      q: initialFilters.q || null,
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
  const canAssignTask = hasPermission(
    ctx.permissions,
    PERMISSIONS.TASKS_ITEM_ASSIGN,
    ctx.roleCode
  );

  return (
    <Suspense fallback={<BoardSkeleton />}>
      <KanbanBoard
        initialData={boardData}
        initialFilters={initialFilters}
        projects={formOptions.projects}
        assignees={formOptions.assignees}
        currentUserId={ctx.userId}
        canCreateTask={canCreateTask}
        canEditTask={canEditTask}
        canDeleteTask={canDeleteTask}
        canAssignTask={canAssignTask}
      />
    </Suspense>
  );
}
