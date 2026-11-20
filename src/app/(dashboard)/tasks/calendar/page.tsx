import { Suspense } from "react";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { WorkCalendarView } from "@/features/tasks/components/WorkCalendarView";
import { getTaskFormOptions } from "@/features/tasks/queries/project.queries";
import { getWorkCalendarTasks } from "@/features/tasks/queries/task.queries";
import { formatDateKeyWib } from "@/features/tasks/utils/date-wib";
import {
  hasAnyPermission,
  hasPermission,
  PERMISSIONS,
} from "@/lib/constants/permissions";
import { getAuthContext } from "@/server/auth/rbac";

export const dynamic = "force-dynamic";

function getInitialMonthBoundsWib(todayKey: string): { from: Date; to: Date } {
  const parts = todayKey.split("-").map(Number);
  const year = parts[0] ?? 2026;
  const month = parts[1] ?? 1;

  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month, 0));

  const startDay = monthStart.getUTCDay();
  const diffToMon = startDay === 0 ? -6 : 1 - startDay;
  const gridStart = new Date(monthStart.getTime());
  gridStart.setUTCDate(gridStart.getUTCDate() + diffToMon);

  const endDay = monthEnd.getUTCDay();
  const daysToSun = endDay === 0 ? 0 : 7 - endDay;
  const gridEnd = new Date(monthEnd.getTime());
  gridEnd.setUTCDate(gridEnd.getUTCDate() + daysToSun);

  return {
    from: new Date(`${gridStart.toISOString().slice(0, 10)}T00:00:00+07:00`),
    to: new Date(`${gridEnd.toISOString().slice(0, 10)}T23:59:59+07:00`),
  };
}

function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-44 rounded-lg" />
        <Skeleton className="h-8 w-52 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <Skeleton className="h-[540px] rounded-2xl xl:col-span-3" />
        <Skeleton className="h-[540px] rounded-2xl" />
      </div>
    </div>
  );
}

export default async function WorkCalendarPage() {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login");
  }

  if (!hasPermission(ctx.permissions, PERMISSIONS.TASKS_ITEM_READ, ctx.roleCode)) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Akses Ditolak"
        description="Akun Anda tidak memiliki izin Work Calendar."
      />
    );
  }

  const todayKey = formatDateKeyWib(new Date());
  const { from, to } = getInitialMonthBoundsWib(todayKey);

  const [calendarData, formOptions] = await Promise.all([
    getWorkCalendarTasks(ctx, {
      from,
      to,
      includeContentOverlay: true,
    }),
    getTaskFormOptions(ctx),
  ]);

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
  const canEditDueDate = hasAnyPermission(
    ctx.permissions,
    [PERMISSIONS.TASKS_ITEM_ASSIGN, PERMISSIONS.TASKS_ITEM_APPROVE],
    ctx.roleCode
  );

  return (
    <Suspense fallback={<CalendarSkeleton />}>
      <WorkCalendarView
        initialData={{
          ...calendarData,
          range: {
            from: from.toISOString(),
            to: to.toISOString(),
          },
        }}
        defaultAnchorDate={todayKey}
        projects={formOptions.projects}
        assignees={formOptions.assignees}
        currentUserId={ctx.userId}
        canCreateTask={canCreateTask}
        canEditDueDate={canEditDueDate}
        canAssignTask={canAssignTask}
      />
    </Suspense>
  );
}
