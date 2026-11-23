"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Calendar as CalendarIcon,
  CalendarClock,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  List,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  softDeleteTaskAction,
  updateTaskAction,
} from "@/features/tasks/actions/task.actions";
import { TaskCreateDialog } from "@/features/tasks/components/TaskCreateDialog";
import { useWorkCalendarFilters } from "@/features/tasks/hooks/useTaskFilters";
import type {
  AssigneeWorkloadOption,
  CalendarContentOverlayDto,
  CalendarTaskDto,
  ProjectLookupOption,
  TaskDetailApiResponse,
  TaskDetailDto,
  WorkCalendarResponse,
} from "@/features/tasks/types";
import {
  formatDateKeyWib,
  formatDisplayDateWib,
  toDateInputValueWib,
} from "@/features/tasks/utils/date-wib";
import {
  TASK_PRIORITY_META,
  TASK_PRIORITY_VALUES,
  TASK_TYPE_META,
  TASK_TYPE_VALUES,
  type TaskPriority,
  type TaskType,
} from "@/lib/constants/enums";
import { useUIStore } from "@/lib/stores/ui-store";
import { cn } from "@/lib/utils";

const WEEKDAY_HEADERS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const TASK_TYPE_CALENDAR_STYLE: Record<TaskType, string> = {
  GENERAL:
    "border-blue-500/20 bg-blue-500/10 text-blue-700 hover:bg-blue-500/15 dark:text-blue-300",
  CONTENT_PRODUCTION:
    "border-violet-500/20 bg-violet-500/10 text-violet-700 hover:bg-violet-500/15 dark:text-violet-300",
  DESIGN_TASK:
    "border-teal-500/20 bg-teal-500/10 text-teal-700 hover:bg-teal-500/15 dark:text-teal-300",
};

function parseAnchorDate(dateStr: string): Date {
  const safe = /^\d{4}-\d{2}-\d{2}$/.test(dateStr)
    ? dateStr
    : formatDateKeyWib(new Date());
  const parts = safe.split("-").map(Number);
  return new Date(
    Date.UTC(parts[0] ?? 2026, (parts[1] ?? 1) - 1, parts[2] ?? 1)
  );
}

function addUtcDays(date: Date, delta: number): Date {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + delta);
  return copy;
}

function getMondayOfWeek(date: Date): Date {
  const day = date.getUTCDay();
  const diffToMon = day === 0 ? -6 : 1 - day;
  return addUtcDays(date, diffToMon);
}

function formatUtcDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getVisibleRangeForMode(
  anchorDate: Date,
  viewMode: string
): { from: Date; to: Date; gridDays: Date[] } {
  if (viewMode === "week") {
    const startMon = getMondayOfWeek(anchorDate);
    const gridDays = Array.from({ length: 7 }, (_, i) => addUtcDays(startMon, i));
    const lastSun = gridDays[6]!;
    return {
      from: new Date(`${formatUtcDateKey(startMon)}T00:00:00+07:00`),
      to: new Date(`${formatUtcDateKey(lastSun)}T23:59:59+07:00`),
      gridDays,
    };
  }

  const monthStart = new Date(
    Date.UTC(anchorDate.getUTCFullYear(), anchorDate.getUTCMonth(), 1)
  );
  const monthEnd = new Date(
    Date.UTC(anchorDate.getUTCFullYear(), anchorDate.getUTCMonth() + 1, 0)
  );
  const gridStart = getMondayOfWeek(monthStart);
  const lastWeekday = monthEnd.getUTCDay();
  const daysToSun = lastWeekday === 0 ? 0 : 7 - lastWeekday;
  const gridEnd = addUtcDays(monthEnd, daysToSun);

  const gridDays: Date[] = [];
  let cursor = gridStart;
  while (cursor.getTime() <= gridEnd.getTime()) {
    gridDays.push(cursor);
    cursor = addUtcDays(cursor, 1);
  }

  return {
    from: new Date(`${formatUtcDateKey(gridStart)}T00:00:00+07:00`),
    to: new Date(`${formatUtcDateKey(gridEnd)}T23:59:59+07:00`),
    gridDays,
  };
}

export interface WorkCalendarViewProps {
  initialData: WorkCalendarResponse;
  defaultAnchorDate: string;
  projects: ProjectLookupOption[];
  assignees: AssigneeWorkloadOption[];
  currentUserId: string;
  canCreateTask: boolean;
  canEditTask?: boolean;
  canDeleteTask?: boolean;
  canEditDueDate: boolean;
  canAssignTask: boolean;
}

export function WorkCalendarView({
  initialData,
  defaultAnchorDate,
  projects,
  assignees,
  currentUserId,
  canCreateTask,
  canEditTask = false,
  canDeleteTask = false,
  canEditDueDate,
  canAssignTask,
}: WorkCalendarViewProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const openDrawer = useUIStore((s) => s.openDrawer);
  const { filters, setFilters, resetFilters } =
    useWorkCalendarFilters(defaultAnchorDate);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDefaultDueDate, setCreateDefaultDueDate] = useState("");
  const [editingTask, setEditingTask] = useState<TaskDetailDto | null>(null);
  const [loadingEditTaskId, setLoadingEditTaskId] = useState<string | null>(
    null
  );
  const [deletingTask, setDeletingTask] = useState<CalendarTaskDto | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [rescheduleTarget, setRescheduleTarget] =
    useState<CalendarTaskDto | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSaving, setRescheduleSaving] = useState(false);

  const anchorDate = useMemo(
    () => parseAnchorDate(filters.date),
    [filters.date]
  );

  const { from, to, gridDays } = useMemo(
    () => getVisibleRangeForMode(anchorDate, filters.view),
    [anchorDate, filters.view]
  );

  const fromIso = from.toISOString();
  const toIso = to.toISOString();

  const queryKey = useMemo(
    () =>
      [
        "tasks",
        "calendar",
        fromIso,
        toIso,
        filters.projectId,
        filters.assigneeId,
        filters.priority,
        filters.taskType,
        filters.overlayContent,
      ] as const,
    [
      fromIso,
      toIso,
      filters.projectId,
      filters.assigneeId,
      filters.priority,
      filters.taskType,
      filters.overlayContent,
    ]
  );

  const isDefaultRange =
    filters.view === "month" &&
    filters.date.slice(0, 7) === defaultAnchorDate.slice(0, 7) &&
    filters.projectId === "ALL" &&
    filters.assigneeId === "ALL" &&
    filters.priority === "ALL" &&
    filters.taskType === "ALL" &&
    filters.overlayContent === true;

  const calendarQuery = useQuery<WorkCalendarResponse>({
    queryKey,
    initialData: isDefaultRange ? initialData : undefined,
    placeholderData: (prev) => prev ?? initialData,
    staleTime: 20_000,
    queryFn: async () => {
      const params = new URLSearchParams({
        from: fromIso,
        to: toIso,
        includeContentOverlay: String(filters.overlayContent),
      });
      if (filters.projectId !== "ALL") params.set("projectId", filters.projectId);
      if (filters.assigneeId !== "ALL") {
        params.set("assigneeId", filters.assigneeId);
      }
      if (filters.priority !== "ALL") params.set("priority", filters.priority);
      if (filters.taskType !== "ALL") params.set("taskType", filters.taskType);

      const res = await fetch(`/api/tasks/calendar?${params.toString()}`, {
        cache: "no-cache",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "Gagal memuat Work Calendar.");
      }
      return (await res.json()) as WorkCalendarResponse;
    },
  });

  const data = calendarQuery.data ?? initialData;
  const todayWibKey = formatDateKeyWib(new Date());

  const { tasksByDate, overlaysByDate } = useMemo(() => {
    const taskMap = new Map<string, CalendarTaskDto[]>();
    for (const task of data.tasks) {
      if (!task.dueDate) continue;
      const dateKey = formatDateKeyWib(new Date(task.dueDate));
      const existing = taskMap.get(dateKey) ?? [];
      existing.push(task);
      taskMap.set(dateKey, existing);
    }

    const overlayMap = new Map<string, CalendarContentOverlayDto[]>();
    if (filters.overlayContent) {
      for (const item of data.contentOverlays) {
        const dateKey = formatDateKeyWib(new Date(item.plannedPublishAt));
        const existing = overlayMap.get(dateKey) ?? [];
        existing.push(item);
        overlayMap.set(dateKey, existing);
      }
    }

    return { tasksByDate: taskMap, overlaysByDate: overlayMap };
  }, [data.tasks, data.contentOverlays, filters.overlayContent]);

  const navigatePeriod = (direction: -1 | 0 | 1) => {
    if (direction === 0) {
      void setFilters({ date: todayWibKey });
      return;
    }

    if (filters.view === "week") {
      const next = addUtcDays(anchorDate, direction * 7);
      void setFilters({ date: formatUtcDateKey(next) });
    } else {
      const next = new Date(
        Date.UTC(
          anchorDate.getUTCFullYear(),
          anchorDate.getUTCMonth() + direction,
          1
        )
      );
      void setFilters({ date: formatUtcDateKey(next) });
    }
  };

  const periodLabel = useMemo(() => {
    if (filters.view === "week") {
      const start = gridDays[0];
      const end = gridDays[6];
      if (!start || !end) return "";
      return `${formatDisplayDateWib(start, "compact")} – ${formatDisplayDateWib(
        end,
        "short"
      )}`;
    }
    return new Intl.DateTimeFormat("id-ID", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(anchorDate);
  }, [anchorDate, filters.view, gridDays]);

  const openEditTask = async (task: CalendarTaskDto) => {
    setLoadingEditTaskId(task.id);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { cache: "no-cache" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        toast.error(body.error ?? "Gagal memuat detail task untuk diedit.");
        return;
      }
      const detail = (await res.json()) as TaskDetailApiResponse;
      setEditingTask(detail.task);
    } catch {
      toast.error("Gagal memuat detail task.");
    } finally {
      setLoadingEditTaskId(null);
    }
  };

  const handleConfirmDeleteTask = async () => {
    if (!deletingTask) return;
    setIsDeleting(true);
    try {
      const res = await softDeleteTaskAction({ taskId: deletingTask.id });
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      toast.success(res.message ?? `Task ${deletingTask.taskCode} dihapus.`);
      void queryClient.invalidateQueries({ queryKey: ["tasks", "calendar"] });
      void queryClient.invalidateQueries({ queryKey: ["kanban-board"] });
      void queryClient.invalidateQueries({
        queryKey: ["slide-over-detail", "TASK_DETAIL", deletingTask.id],
      });
      setDeletingTask(null);
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  const openReschedule = (task: CalendarTaskDto) => {
    setRescheduleTarget(task);
    setRescheduleDate(toDateInputValueWib(task.dueDate) || todayWibKey);
  };

  const handleSaveReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleTarget) return;
    setRescheduleSaving(true);
    try {
      const res = await updateTaskAction({
        taskId: rescheduleTarget.id,
        dueDate: rescheduleDate || null,
        expectedVersion: rescheduleTarget.version,
      });
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      toast.success(`Tenggat ${rescheduleTarget.taskCode} diperbarui.`);
      setRescheduleTarget(null);
      void queryClient.invalidateQueries({ queryKey: ["tasks", "calendar"] });
      void queryClient.invalidateQueries({ queryKey: ["kanban-board"] });
    } finally {
      setRescheduleSaving(false);
    }
  };

  const activeMonthIndex = anchorDate.getUTCMonth();

  return (
    <div className="space-y-4">
      {/* Crisp Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Work Calendar
          </h1>
          <span className="inline-flex h-6 items-center rounded-full bg-muted/80 px-2.5 font-mono text-xs font-medium text-muted-foreground tabular-nums">
            {data.tasks.length}
          </span>
          {calendarQuery.isFetching ? (
            <Loader2 className="size-4 animate-spin text-primary" />
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-border/60 bg-muted/40 p-0.5">
            <Button
              type="button"
              size="xs"
              variant={filters.view === "month" ? "default" : "ghost"}
              onClick={() => void setFilters({ view: "month" })}
              className="gap-1 rounded-md"
            >
              <CalendarIcon className="size-3.5" />
              <span>Month</span>
            </Button>
            <Button
              type="button"
              size="xs"
              variant={filters.view === "week" ? "default" : "ghost"}
              onClick={() => void setFilters({ view: "week" })}
              className="gap-1 rounded-md"
            >
              <CalendarDays className="size-3.5" />
              <span>Week</span>
            </Button>
            <Button
              type="button"
              size="xs"
              variant={filters.view === "agenda" ? "default" : "ghost"}
              onClick={() => void setFilters({ view: "agenda" })}
              className="gap-1 rounded-md"
            >
              <List className="size-3.5" />
              <span>Agenda</span>
            </Button>
          </div>

          {canCreateTask ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setCreateDefaultDueDate(todayWibKey);
                setCreateDialogOpen(true);
              }}
              className="h-8 gap-1.5 shadow-xs"
            >
              <Plus className="size-3.5" />
              <span>Task Baru</span>
            </Button>
          ) : null}
        </div>
      </div>

      {/* Navigation + Inline Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => navigatePeriod(-1)}
            aria-label="Periode sebelumnya"
            className="h-8 w-8 border-border/60 bg-card/80"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigatePeriod(0)}
            className="h-8 border-border/60 bg-card/80 text-xs"
          >
            Hari Ini
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => navigatePeriod(1)}
            aria-label="Periode berikutnya"
            className="h-8 w-8 border-border/60 bg-card/80"
          >
            <ChevronRight className="size-4" />
          </Button>
          <h2 className="ml-2 text-sm font-semibold tracking-tight text-foreground sm:text-base">
            {periodLabel}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filters.projectId}
            onValueChange={(val) => {
              if (val) void setFilters({ projectId: val });
            }}
          >
            <SelectTrigger className="h-8 w-40 min-w-0 overflow-hidden rounded-lg border-border/60 bg-card/80 text-xs shadow-2xs *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
              <SelectValue className="block min-w-0 truncate">
                {(val: string | null) => {
                  const label = (() => {
                    if (!val || val === "ALL") return "Semua Proyek";
                    if (val === "NONE") return "Tanpa Proyek (Umum)";
                    const p = projects.find((item) => item.id === val);
                    return p ? `${p.code} · ${p.name}` : "Proyek";
                  })();
                  return <span className="block truncate">{label}</span>;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Proyek</SelectItem>
              <SelectItem value="NONE">Tanpa Proyek (Umum)</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="truncate">
                    {p.code} · {p.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.assigneeId}
            onValueChange={(val) => {
              if (val) void setFilters({ assigneeId: val });
            }}
          >
            <SelectTrigger className="h-8 w-36 min-w-0 overflow-hidden rounded-lg border-border/60 bg-card/80 text-xs shadow-2xs *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
              <SelectValue className="block min-w-0 truncate">
                {(val: string | null) => {
                  const label = (() => {
                    if (!val || val === "ALL") return "Semua Anggota";
                    const u = assignees.find((item) => item.id === val);
                    return u ? u.fullName : "Anggota";
                  })();
                  return <span className="block truncate">{label}</span>;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Anggota</SelectItem>
              {assignees.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  <span className="truncate">{u.fullName}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.taskType}
            onValueChange={(val) => {
              if (val) void setFilters({ taskType: val });
            }}
          >
            <SelectTrigger className="h-8 w-36 min-w-0 overflow-hidden rounded-lg border-border/60 bg-card/80 text-xs shadow-2xs *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
              <SelectValue className="block min-w-0 truncate">
                {(val: string | null) => {
                  const label =
                    !val || val === "ALL"
                      ? "Tipe"
                      : (TASK_TYPE_META[val as TaskType]?.label ?? val);
                  return <span className="block truncate">{label}</span>;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Tipe</SelectItem>
              {TASK_TYPE_VALUES.map((tt) => (
                <SelectItem key={tt} value={tt}>
                  {TASK_TYPE_META[tt].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.priority}
            onValueChange={(val) => {
              if (val) void setFilters({ priority: val });
            }}
          >
            <SelectTrigger className="h-8 w-32 min-w-0 overflow-hidden rounded-lg border-border/60 bg-card/80 text-xs shadow-2xs *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
              <SelectValue className="block min-w-0 truncate">
                {(val: string | null) => {
                  const label =
                    !val || val === "ALL"
                      ? "Prioritas"
                      : (TASK_PRIORITY_META[val as TaskPriority]?.label ?? val);
                  return <span className="block truncate">{label}</span>;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Prioritas</SelectItem>
              {TASK_PRIORITY_VALUES.map((pr) => (
                <SelectItem key={pr} value={pr}>
                  {TASK_PRIORITY_META[pr].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-border/60 bg-card/80 px-2.5 text-xs shadow-2xs">
            <Checkbox
              checked={filters.overlayContent}
              onCheckedChange={(checked) =>
                void setFilters({ overlayContent: Boolean(checked) })
              }
            />
            <span>Konten</span>
          </label>

          {(filters.projectId !== "ALL" ||
            filters.assigneeId !== "ALL" ||
            filters.priority !== "ALL" ||
            filters.taskType !== "ALL") && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8 gap-1 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="size-3" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Compact Legend */}
      <div className="flex flex-wrap items-center gap-4 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-blue-500" />
          General
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-violet-500" />
          Content
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-teal-500" />
          Design
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-amber-500" />
          Publikasi
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-rose-500" />
          Overdue
        </span>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        <div className="xl:col-span-3">
          {filters.view === "agenda" ? (
            <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4 shadow-2xs">
              {data.tasks.length === 0 &&
              (!filters.overlayContent || data.contentOverlays.length === 0) ? (
                <EmptyState
                  icon={CalendarDays}
                  title="Belum ada jadwal"
                  description="Task dengan deadline bulan ini tampil di sini."
                  className="border-0 py-10"
                />
              ) : (
                gridDays
                  .filter((d) => {
                    const key = formatUtcDateKey(d);
                    return (
                      (tasksByDate.get(key)?.length ?? 0) > 0 ||
                      (overlaysByDate.get(key)?.length ?? 0) > 0
                    );
                  })
                  .map((day) => {
                    const dayKey = formatUtcDateKey(day);
                    const dayTasks = tasksByDate.get(dayKey) ?? [];
                    const dayOverlays = overlaysByDate.get(dayKey) ?? [];
                    const isToday = dayKey === todayWibKey;
                    return (
                      <div
                        key={dayKey}
                        className={cn(
                          "rounded-xl border border-border/60 p-3.5",
                          isToday && "border-primary/40 bg-primary/[0.03]"
                        )}
                      >
                        <div className="mb-2.5 flex items-center justify-between">
                          <h3 className="text-xs font-semibold text-foreground">
                            {formatDisplayDateWib(day, "short")}
                            {isToday ? " · Hari Ini" : ""}
                          </h3>
                          <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10.5px] font-medium text-muted-foreground tabular-nums">
                            {dayTasks.length + dayOverlays.length}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {dayTasks.map((task) => (
                            <div
                              key={task.id}
                              onClick={() => openDrawer("TASK_DETAIL", task.id)}
                              className={cn(
                                "flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-xs transition-colors",
                                task.isOverdue
                                  ? "border-rose-500/25 bg-rose-500/10 text-rose-700 hover:bg-rose-500/15 dark:text-rose-300"
                                  : TASK_TYPE_CALENDAR_STYLE[task.taskType]
                              )}
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <span className="font-mono text-[11px] font-semibold">
                                  {task.taskCode}
                                </span>
                                <span className="truncate font-medium">
                                  {task.title}
                                </span>
                                <span className="hidden shrink-0 rounded border border-current/15 px-1.5 py-0.5 text-[10px] font-semibold opacity-80 sm:inline-flex">
                                  {task.project?.code ?? "Tanpa Proyek"}
                                </span>
                              </div>
                              <div
                                className="flex shrink-0 items-center gap-1.5"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <StatusBadge domain="task" value={task.status} />
                                <PriorityBadge priority={task.priority} />
                                {canEditDueDate ? (
                                  <Button
                                    type="button"
                                    size="icon-xs"
                                    variant="ghost"
                                    title="Ubah tenggat"
                                    aria-label={`Reschedule ${task.taskCode}`}
                                    onClick={() => openReschedule(task)}
                                  >
                                    <CalendarClock className="size-3" />
                                  </Button>
                                ) : null}
                                {canEditTask ? (
                                  <Button
                                    type="button"
                                    size="icon-xs"
                                    variant="ghost"
                                    title="Edit task"
                                    aria-label={`Edit ${task.taskCode}`}
                                    disabled={loadingEditTaskId === task.id}
                                    onClick={() => void openEditTask(task)}
                                  >
                                    {loadingEditTaskId === task.id ? (
                                      <Loader2 className="size-3 animate-spin" />
                                    ) : (
                                      <Pencil className="size-3" />
                                    )}
                                  </Button>
                                ) : null}
                                {canDeleteTask ? (
                                  <Button
                                    type="button"
                                    size="icon-xs"
                                    variant="ghost"
                                    title="Hapus task"
                                    aria-label={`Hapus ${task.taskCode}`}
                                    onClick={() => setDeletingTask(task)}
                                    className="hover:text-rose-600"
                                  >
                                    <Trash2 className="size-3" />
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          ))}

                          {dayOverlays.map((item) => (
                            <div
                              key={item.id}
                              onClick={() =>
                                openDrawer("CONTENT_DETAIL", item.id)
                              }
                              className="flex cursor-pointer items-center justify-between gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-800 hover:bg-amber-500/15 dark:text-amber-300"
                            >
                              <div className="flex min-w-0 items-center gap-2">
                                <Megaphone className="size-3.5 shrink-0" />
                                <span className="font-mono text-[10px] font-semibold">
                                  {item.platform}
                                </span>
                                <span className="truncate font-medium">
                                  {item.title}
                                </span>
                              </div>
                              <StatusBadge
                                domain="content"
                                value={item.status}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-2xs">
              <div className="grid grid-cols-7 border-b border-border/60 bg-muted/35">
                {WEEKDAY_HEADERS.map((label) => (
                  <div
                    key={label}
                    className="py-2 text-center text-[11px] font-semibold tracking-wide text-muted-foreground uppercase"
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 divide-x divide-y divide-border/50">
                {gridDays.map((day) => {
                  const dayKey = formatUtcDateKey(day);
                  const isToday = dayKey === todayWibKey;
                  const isOutsideMonth =
                    filters.view === "month" &&
                    day.getUTCMonth() !== activeMonthIndex;
                  const dayTasks = tasksByDate.get(dayKey) ?? [];
                  const dayOverlays = overlaysByDate.get(dayKey) ?? [];

                  return (
                    <div
                      key={dayKey}
                      className={cn(
                        "group flex flex-col p-1.5 transition-colors",
                        filters.view === "week"
                          ? "min-h-[320px]"
                          : "min-h-[124px]",
                        isOutsideMonth && "bg-muted/20 text-muted-foreground",
                        isToday && "bg-primary/[0.04]"
                      )}
                    >
                      <div className="mb-1 flex items-center justify-between px-1">
                        <span
                          className={cn(
                            "inline-flex size-6 items-center justify-center rounded-full font-mono text-xs font-medium tabular-nums",
                            isToday
                              ? "bg-primary font-semibold text-primary-foreground"
                              : "text-foreground"
                          )}
                        >
                          {day.getUTCDate()}
                        </span>

                        {canCreateTask ? (
                          <button
                            type="button"
                            onClick={() => {
                              setCreateDefaultDueDate(dayKey);
                              setCreateDialogOpen(true);
                            }}
                            aria-label={`Buat task pada ${dayKey}`}
                            className="rounded-md p-0.5 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
                          >
                            <Plus className="size-3.5" />
                          </button>
                        ) : null}
                      </div>

                      <div className="flex-1 space-y-1 overflow-y-auto">
                        {dayTasks.map((task) => (
                          <div
                            key={task.id}
                            onClick={() => openDrawer("TASK_DETAIL", task.id)}
                            className={cn(
                              "flex cursor-pointer items-center justify-between gap-1 rounded-md border px-1.5 py-1 text-[11px] leading-tight transition-colors",
                              task.isOverdue
                                ? "border-rose-500/30 bg-rose-500/10 text-rose-700 hover:bg-rose-500/15 dark:text-rose-300"
                                : TASK_TYPE_CALENDAR_STYLE[task.taskType]
                            )}
                            title={`${task.taskCode}: ${task.title} (${task.project?.name ?? "Tanpa Proyek (Umum)"})`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1">
                                {task.isOverdue ? (
                                  <AlertTriangle className="size-2.5 shrink-0 text-rose-500" />
                                ) : null}
                                <span className="truncate font-medium">
                                  {task.title}
                                </span>
                              </div>
                              {filters.view === "week" ? (
                                <p className="mt-0.5 truncate text-[10px] opacity-80">
                                  {task.taskCode} ·{" "}
                                  {task.project?.code ?? "Umum"} ·{" "}
                                  {task.assignee?.fullName ?? "Unassigned"}
                                </p>
                              ) : null}
                            </div>

                            <div
                              className="flex shrink-0 items-center gap-0.5"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {canEditDueDate ? (
                                <button
                                  type="button"
                                  onClick={() => openReschedule(task)}
                                  aria-label={`Ubah tanggal ${task.taskCode}`}
                                  title="Ubah tenggat"
                                  className="shrink-0 rounded p-0.5 opacity-60 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
                                >
                                  <CalendarClock className="size-2.5" />
                                </button>
                              ) : null}
                              {canEditTask ? (
                                <button
                                  type="button"
                                  disabled={loadingEditTaskId === task.id}
                                  onClick={() => void openEditTask(task)}
                                  aria-label={`Edit ${task.taskCode}`}
                                  title="Edit task"
                                  className="shrink-0 rounded p-0.5 opacity-60 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
                                >
                                  {loadingEditTaskId === task.id ? (
                                    <Loader2 className="size-2.5 animate-spin" />
                                  ) : (
                                    <Pencil className="size-2.5" />
                                  )}
                                </button>
                              ) : null}
                              {canDeleteTask ? (
                                <button
                                  type="button"
                                  onClick={() => setDeletingTask(task)}
                                  aria-label={`Hapus ${task.taskCode}`}
                                  title="Hapus task"
                                  className="shrink-0 rounded p-0.5 opacity-60 hover:bg-rose-500/15 hover:text-rose-600 hover:opacity-100"
                                >
                                  <Trash2 className="size-2.5" />
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ))}

                        {dayOverlays.map((item) => (
                          <div
                            key={item.id}
                            onClick={() =>
                              openDrawer("CONTENT_DETAIL", item.id)
                            }
                            className="flex cursor-pointer items-center gap-1 rounded-md border border-amber-500/25 bg-amber-500/10 px-1.5 py-1 text-[11px] leading-tight text-amber-800 hover:bg-amber-500/15 dark:text-amber-300"
                            title={`Konten ${item.platform}: ${item.title}`}
                          >
                            <Megaphone className="size-2.5 shrink-0" />
                            <span className="truncate font-medium">
                              {item.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Unscheduled Side Panel */}
        <aside className="rounded-2xl border border-border/60 bg-card p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">
                Unscheduled
              </h2>
            </div>
            <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[11px] font-medium text-muted-foreground tabular-nums">
              {data.unscheduledTasks.length}
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {data.unscheduledTasks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
                Semua task terjadwal.
              </div>
            ) : (
              data.unscheduledTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => openDrawer("TASK_DETAIL", task.id)}
                  className="cursor-pointer rounded-xl border border-border/60 bg-muted/20 p-3 transition-all hover:border-primary/40 hover:bg-accent/30"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded bg-muted/80 px-1.5 py-0.5 font-mono text-[10.5px] font-medium text-muted-foreground">
                      {task.taskCode}
                    </span>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  <p className="mt-1.5 line-clamp-2 break-words text-xs font-medium text-foreground">
                    {task.title}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between gap-2">
                    <span className="truncate text-[11px] text-muted-foreground">
                      {task.project?.code ?? "Tanpa Proyek"} ·{" "}
                      {task.assignee?.fullName ?? "Unassigned"}
                    </span>
                    <div
                      className="flex shrink-0 items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {canEditDueDate ? (
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          onClick={() => openReschedule(task)}
                          className="h-6 border-border/60 text-[11px]"
                        >
                          Atur
                        </Button>
                      ) : null}
                      {canEditTask ? (
                        <Button
                          type="button"
                          size="icon-xs"
                          variant="ghost"
                          aria-label={`Edit ${task.taskCode}`}
                          disabled={loadingEditTaskId === task.id}
                          onClick={() => void openEditTask(task)}
                          className="size-6"
                        >
                          {loadingEditTaskId === task.id ? (
                            <Loader2 className="size-3 animate-spin" />
                          ) : (
                            <Pencil className="size-3" />
                          )}
                        </Button>
                      ) : null}
                      {canDeleteTask ? (
                        <Button
                          type="button"
                          size="icon-xs"
                          variant="ghost"
                          aria-label={`Hapus ${task.taskCode}`}
                          onClick={() => setDeletingTask(task)}
                          className="size-6 hover:text-rose-600"
                        >
                          <Trash2 className="size-3" />
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>

      {/* Quick Reschedule Due Date Dialog */}
      <Dialog
        open={Boolean(rescheduleTarget)}
        onOpenChange={(open) => {
          if (!open) setRescheduleTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">
              Reschedule {rescheduleTarget?.taskCode}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Pilih tanggal tenggat baru (23:59 WIB).
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveReschedule} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="reschedule-due-date" className="text-xs">
                Tanggal Tenggat
              </Label>
              <Input
                id="reschedule-due-date"
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRescheduleTarget(null)}
                disabled={rescheduleSaving}
              >
                Batal
              </Button>
              <Button type="submit" disabled={rescheduleSaving}>
                {rescheduleSaving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {canCreateTask || canEditTask ? (
        <TaskCreateDialog
          open={createDialogOpen || Boolean(editingTask)}
          onOpenChange={(open) => {
            if (!open) {
              setCreateDialogOpen(false);
              setEditingTask(null);
            }
          }}
          projects={projects}
          assignees={assignees}
          currentUserId={currentUserId}
          canAssignOthers={canAssignTask}
          defaultProjectId={
            filters.projectId !== "ALL" && filters.projectId !== "NONE"
              ? filters.projectId
              : undefined
          }
          defaultDueDate={createDefaultDueDate}
          editTask={editingTask}
          onCreated={() => {
            void queryClient.invalidateQueries({
              queryKey: ["tasks", "calendar"],
            });
            router.refresh();
          }}
          onUpdated={() => {
            void queryClient.invalidateQueries({
              queryKey: ["tasks", "calendar"],
            });
            void queryClient.invalidateQueries({ queryKey: ["kanban-board"] });
            router.refresh();
          }}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(deletingTask)}
        onOpenChange={(open) => {
          if (!open) setDeletingTask(null);
        }}
        title={`Hapus Task ${deletingTask?.taskCode ?? ""}?`}
        description={`Task "${deletingTask?.title ?? ""}" akan dihapus dari kalender dan tampilan aktif.`}
        confirmLabel="Hapus Task"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleConfirmDeleteTask}
      />
    </div>
  );
}
