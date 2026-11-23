"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Check,
  CheckCircle2,
  CheckSquare,
  Clock,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  createDataTableColumnHelper,
  DataTable,
  type DataTableColumnDef,
} from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  moveKanbanTaskAction,
  softDeleteTaskAction,
} from "@/features/tasks/actions/task.actions";
import { TaskCreateDialog } from "@/features/tasks/components/TaskCreateDialog";
import { useMyTasksFilters } from "@/features/tasks/hooks/useTaskFilters";
import type {
  AssigneeWorkloadOption,
  MyTasksGroupedData,
  ProjectLookupOption,
  TaskBoardCardDto,
} from "@/features/tasks/types";
import { formatDisplayDateWib } from "@/features/tasks/utils/date-wib";
import {
  TASK_PRIORITY_META,
  TASK_PRIORITY_VALUES,
  TASK_STATUS_META,
  TASK_STATUS_VALUES,
  TASK_TYPE_META,
  TASK_TYPE_VALUES,
  type TaskPriority,
  type TaskStatus,
  type TaskType,
} from "@/lib/constants/enums";
import { useUIStore } from "@/lib/stores/ui-store";
import { cn } from "@/lib/utils";

const columnHelper = createDataTableColumnHelper<TaskBoardCardDto>();

export interface MyTasksTableProps {
  initialData: MyTasksGroupedData;
  projects: ProjectLookupOption[];
  assignees: AssigneeWorkloadOption[];
  currentUserId: string;
  canCreateTask?: boolean;
  canEditTask?: boolean;
  canDeleteTask?: boolean;
  canAssignOthers: boolean;
  canApproveTasks: boolean;
}

export function MyTasksTable({
  initialData,
  projects,
  assignees,
  currentUserId,
  canCreateTask = true,
  canEditTask = false,
  canDeleteTask = false,
  canAssignOthers,
  canApproveTasks,
}: MyTasksTableProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const openDrawer = useUIStore((s) => s.openDrawer);
  const { filters, setFilters, hasActiveFilters, resetFilters } =
    useMyTasksFilters();
  const [createOpen, setCreateOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskBoardCardDto | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TaskBoardCardDto | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const [searchDraft, setSearchDraft] = useState<string | null>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  const displayedSearch = searchDraft ?? filters.q;

  const handleSearchChange = (value: string) => {
    setSearchDraft(value);
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = setTimeout(() => {
      void setFilters({ q: value });
      setSearchDraft(null);
    }, 300);
  };

  const handleResetFilters = () => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    setSearchDraft(null);
    resetFilters();
  };

  const filterTaskList = useMemo(() => {
    const q = displayedSearch.trim().toLowerCase();
    return (list: TaskBoardCardDto[]) =>
      list.filter((task) => {
        if (filters.projectId === "NONE") {
          if (task.projectId !== null) return false;
        } else if (
          filters.projectId !== "ALL" &&
          task.projectId !== filters.projectId
        ) {
          return false;
        }
        if (filters.status !== "ALL" && task.status !== filters.status) {
          return false;
        }
        if (filters.priority !== "ALL" && task.priority !== filters.priority) {
          return false;
        }
        if (filters.taskType !== "ALL" && task.taskType !== filters.taskType) {
          return false;
        }
        if (q) {
          const hay = `${task.taskCode} ${task.title} ${
            task.project?.name ?? "Tanpa Proyek"
          } ${task.project?.code ?? "UMUM"}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
  }, [filters, displayedSearch]);

  const filtered = useMemo(
    () => ({
      overdue: filterTaskList(initialData.overdue),
      today: filterTaskList(initialData.today),
      upcoming: filterTaskList(initialData.upcoming),
      later: filterTaskList(initialData.later),
      completed: filterTaskList(initialData.completed),
      cancelled: filterTaskList(initialData.cancelled),
    }),
    [initialData, filterTaskList]
  );

  const handleQuickAdvance = async (
    task: TaskBoardCardDto,
    targetStatus: TaskStatus
  ) => {
    setPendingTaskId(task.id);
    try {
      const res = await moveKanbanTaskAction({
        taskId: task.id,
        targetStatus,
        expectedVersion: task.version,
      });
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      toast.success(res.message ?? `Task dipindahkan ke ${targetStatus}.`);
      router.refresh();
    } finally {
      setPendingTaskId(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await softDeleteTaskAction({ taskId: deleteTarget.id });
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      toast.success(res.message ?? `Task ${deleteTarget.taskCode} dihapus.`);
      void queryClient.invalidateQueries({ queryKey: ["kanban-board"] });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({
        queryKey: ["slide-over-detail", "TASK_DETAIL", deleteTarget.id],
      });
      setDeleteTarget(null);
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo<DataTableColumnDef<TaskBoardCardDto>[]>(
    () => [
      columnHelper.accessor("taskCode", {
        header: "Task",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="min-w-[240px] max-w-[380px] space-y-1.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor: row.project?.colorHex ?? "#64748B",
                    }}
                  />
                  <span>{row.taskCode}</span>
                </span>
                <p className="min-w-0 flex-1 truncate font-bold text-slate-900 dark:text-white">
                  {row.title}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                {row.project ? (
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {row.project.code}
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    Tanpa Proyek
                  </span>
                )}
                {row.checklistTotal > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <Check className="size-2.5" />
                    <span>
                      {row.checklistCompleted}/{row.checklistTotal}
                    </span>
                  </span>
                ) : null}
                {row.linkedContentItemId ? (
                  <Link
                    href={`/content/planner?contentId=${row.linkedContentItemId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-0.5 font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    <span>Content</span>
                    <ExternalLink className="size-3" />
                  </Link>
                ) : null}
                {row.linkedDesignBriefId ? (
                  <Link
                    href={`/design/workspace?briefId=${row.linkedDesignBriefId}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-0.5 font-semibold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    <span>Design</span>
                    <ExternalLink className="size-3" />
                  </Link>
                ) : null}
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("status", {
        header: "Status",
        cell: (info) => <StatusBadge domain="task" value={info.getValue()} />,
      }),
      columnHelper.accessor("priority", {
        header: "Prioritas",
        cell: (info) => <PriorityBadge priority={info.getValue()} />,
      }),
      columnHelper.accessor((row) => row.dueDate ?? "", {
        id: "dueDate",
        header: "Tenggat",
        cell: (info) => {
          const row = info.row.original;
          if (!row.dueDate) {
            return (
              <span className="text-xs font-medium text-slate-400">—</span>
            );
          }
          return (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums",
                  row.deadlineHealth === "OVERDUE"
                    ? "border-rose-200 bg-rose-50 font-bold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300"
                    : row.deadlineHealth === "DUE_SOON"
                      ? "border-amber-200 bg-amber-50 font-bold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
                      : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                )}
              >
                {formatDisplayDateWib(row.dueDate, "datetime")}
              </span>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "Aksi",
        cell: (info) => {
          const row = info.row.original;
          const isBusy = pendingTaskId === row.id;

          let nextAction: { label: string; target: TaskStatus } | null = null;
          if (row.status === "TODO" || row.status === "REVISION") {
            nextAction = { label: "Kerjakan", target: "IN_PROGRESS" };
          } else if (row.status === "IN_PROGRESS") {
            if (!row.requiresReview || canApproveTasks) {
              nextAction = row.requiresReview
                ? { label: "Review", target: "IN_REVIEW" }
                : { label: "Selesai", target: "DONE" };
            } else {
              nextAction = { label: "Review", target: "IN_REVIEW" };
            }
          } else if (row.status === "IN_REVIEW" && canApproveTasks) {
            nextAction = { label: "Approve", target: "DONE" };
          }

          return (
            <div
              className="flex items-center gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              {nextAction ? (
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  disabled={isBusy}
                  onClick={() => void handleQuickAdvance(row, nextAction.target)}
                  className="gap-1 rounded-lg border-slate-200 bg-white font-semibold text-slate-700 shadow-2xs hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/15"
                >
                  {isBusy ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <ArrowRight className="size-3" />
                  )}
                  <span>{nextAction.label}</span>
                </Button>
              ) : (
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Detail
                </span>
              )}

              {canEditTask ? (
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  aria-label={`Edit ${row.taskCode}`}
                  onClick={() => setEditingTask(row)}
                  className="size-7 rounded-lg text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-blue-500/15 dark:hover:text-blue-400"
                >
                  <Pencil className="size-3.5" />
                </Button>
              ) : null}

              {canDeleteTask ? (
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  aria-label={`Hapus ${row.taskCode}`}
                  onClick={() => setDeleteTarget(row)}
                  className="size-7 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-500/15 dark:hover:text-rose-400"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              ) : null}
            </div>
          );
        },
      }),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pendingTaskId, canApproveTasks, canEditTask, canDeleteTask]
  );

  const renderSection = (
    title: string,
    tasks: TaskBoardCardDto[],
    dotClass: string
  ) => {
    if (tasks.length === 0) return null;
    return (
      <section className="space-y-3">
        <div className="flex items-center gap-2.5">
          <span className={cn("size-2.5 rounded-full ring-4", dotClass)} />
          <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            {title}
          </h2>
          <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 font-mono text-xs font-bold text-slate-700 shadow-2xs tabular-nums dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            {tasks.length}
          </span>
        </div>
        <DataTable
          columns={columns}
          data={tasks}
          searchable={false}
          pagination={{ pageSize: 10 }}
          onRowClick={(row) => openDrawer("TASK_DETAIL", row.id)}
        />
      </section>
    );
  };

  const activeFilteredTotal =
    filtered.overdue.length +
    filtered.today.length +
    filtered.upcoming.length +
    filtered.later.length;

  return (
    <div className="space-y-5">
      {/* Crisp Command Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-1 rounded-full bg-blue-600" />
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
            My Tasks
          </h1>
          <span className="inline-flex h-6 items-center rounded-full border border-slate-200 bg-white px-2.5 font-mono text-xs font-bold text-slate-700 shadow-2xs tabular-nums dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            {initialData.counts.activeTotal} aktif
          </span>
        </div>

        {canCreateTask ? (
          <Button
            type="button"
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="h-9 gap-1.5 rounded-xl bg-blue-600 px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="size-3.5" />
            <span>Task Baru</span>
          </Button>
        ) : null}
      </div>

      {/* High-Contrast Bento Urgency Strip */}
      <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
        <button
          type="button"
          onClick={() => void setFilters({ tab: "active" })}
          className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white p-4 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-rose-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div>
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
              Overdue
            </span>
            <p
              className={cn(
                "mt-1 font-mono text-3xl font-extrabold tabular-nums",
                initialData.counts.overdue > 0
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-slate-900 dark:text-white"
              )}
            >
              {initialData.counts.overdue}
            </p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-400">
            <AlertTriangle className="size-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => void setFilters({ tab: "active" })}
          className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white p-4 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div>
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
              Hari Ini
            </span>
            <p className="mt-1 font-mono text-3xl font-extrabold text-slate-900 tabular-nums dark:text-white">
              {initialData.counts.today}
            </p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-400">
            <Clock className="size-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => void setFilters({ tab: "active" })}
          className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white p-4 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div>
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
              7 Hari
            </span>
            <p className="mt-1 font-mono text-3xl font-extrabold text-slate-900 tabular-nums dark:text-white">
              {initialData.counts.upcoming}
            </p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-400">
            <CalendarClock className="size-5" />
          </div>
        </button>

        <button
          type="button"
          onClick={() => void setFilters({ tab: "completed" })}
          className="flex items-center justify-between rounded-xl border border-slate-200/90 bg-white p-4 text-left shadow-xs transition-all hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
        >
          <div>
            <span className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
              Selesai (30h)
            </span>
            <p className="mt-1 font-mono text-3xl font-extrabold text-emerald-600 tabular-nums dark:text-emerald-400">
              {initialData.counts.completed}
            </p>
          </div>
          <div className="flex size-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400">
            <CheckCircle2 className="size-5" />
          </div>
        </button>
      </div>

      {/* Elevated Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/90 bg-white p-2.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          <Input
            type="search"
            value={displayedSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Cari task..."
            className="h-8.5 rounded-lg border-slate-200 bg-slate-50 pl-8.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus-visible:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <Select
          value={filters.projectId}
          onValueChange={(val) => {
            if (val) void setFilters({ projectId: val });
          }}
        >
          <SelectTrigger className="h-8.5 w-44 min-w-0 overflow-hidden rounded-lg border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-white *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
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
          value={filters.status}
          onValueChange={(val) => {
            if (val) {
              void setFilters({
                status: val,
                tab:
                  val === "CANCELLED"
                    ? "cancelled"
                    : val === "DONE"
                      ? "completed"
                      : filters.tab,
              });
            }
          }}
        >
          <SelectTrigger className="h-8.5 w-36 min-w-0 overflow-hidden rounded-lg border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-white *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <SelectValue className="block min-w-0 truncate">
              {(val: string | null) => {
                const label =
                  !val || val === "ALL"
                    ? "Semua Status"
                    : (TASK_STATUS_META[val as TaskStatus]?.label ?? val);
                return <span className="block truncate">{label}</span>;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Status</SelectItem>
            {TASK_STATUS_VALUES.map((st) => (
              <SelectItem key={st} value={st}>
                {TASK_STATUS_META[st].label}
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
          <SelectTrigger className="h-8.5 w-36 min-w-0 overflow-hidden rounded-lg border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-white *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
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

        <Select
          value={filters.taskType}
          onValueChange={(val) => {
            if (val) void setFilters({ taskType: val });
          }}
        >
          <SelectTrigger className="h-8.5 w-40 min-w-0 overflow-hidden rounded-lg border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-white *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <SelectValue className="block min-w-0 truncate">
              {(val: string | null) => {
                const label =
                  !val || val === "ALL"
                    ? "Semua Tipe"
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

        {hasActiveFilters || Boolean(searchDraft) ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
            className="h-8.5 gap-1 rounded-lg px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <RotateCcw className="size-3" />
            <span>Reset</span>
          </Button>
        ) : null}
      </div>

      {/* Grouped Pill Tabs */}
      <Tabs
        value={filters.tab}
        onValueChange={(val) => {
          if (val) void setFilters({ tab: val });
        }}
        className="space-y-5"
      >
        <TabsList className="h-11 w-full justify-start gap-1.5 rounded-xl border border-slate-200/90 bg-white p-1 shadow-xs sm:w-fit dark:border-slate-800 dark:bg-slate-900">
          <TabsTrigger
            value="active"
            className="group/tab flex-none rounded-lg px-4 text-xs font-bold text-slate-600 data-active:bg-blue-600 data-active:text-white data-active:shadow-xs dark:text-slate-300 dark:data-active:bg-blue-600 dark:data-active:text-white"
          >
            <span>Aktif</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10.5px] font-bold text-slate-700 tabular-nums group-data-active/tab:bg-white/20 group-data-active/tab:text-white dark:bg-slate-800 dark:text-slate-200">
              {activeFilteredTotal}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="completed"
            className="group/tab flex-none rounded-lg px-4 text-xs font-bold text-slate-600 data-active:bg-blue-600 data-active:text-white data-active:shadow-xs dark:text-slate-300 dark:data-active:bg-blue-600 dark:data-active:text-white"
          >
            <span>Selesai (30h)</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10.5px] font-bold text-slate-700 tabular-nums group-data-active/tab:bg-white/20 group-data-active/tab:text-white dark:bg-slate-800 dark:text-slate-200">
              {filtered.completed.length}
            </span>
          </TabsTrigger>
          {filters.status === "CANCELLED" || filtered.cancelled.length > 0 ? (
            <TabsTrigger
              value="cancelled"
              className="group/tab flex-none rounded-lg px-4 text-xs font-bold text-slate-600 data-active:bg-blue-600 data-active:text-white data-active:shadow-xs dark:text-slate-300 dark:data-active:bg-blue-600 dark:data-active:text-white"
            >
              <span>Cancelled</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10.5px] font-bold text-slate-700 tabular-nums group-data-active/tab:bg-white/20 group-data-active/tab:text-white dark:bg-slate-800 dark:text-slate-200">
                {filtered.cancelled.length}
              </span>
            </TabsTrigger>
          ) : null}
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          {activeFilteredTotal === 0 ? (
            <EmptyState
              icon={CheckSquare}
              title="Tidak ada tugas aktif"
              description="Semua tugas selesai atau belum ada sesuai filter."
              action={
                canCreateTask ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setCreateOpen(true)}
                    className="bg-blue-600 font-semibold text-white hover:bg-blue-700"
                  >
                    <Plus className="size-3.5" />
                    <span>Task Baru</span>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <>
              {renderSection(
                "Overdue",
                filtered.overdue,
                "bg-rose-500 ring-rose-500/25"
              )}
              {renderSection(
                "Hari Ini",
                filtered.today,
                "bg-amber-500 ring-amber-500/25"
              )}
              {renderSection(
                "7 Hari Ke Depan",
                filtered.upcoming,
                "bg-blue-600 ring-blue-500/25"
              )}
              {renderSection(
                "Mendatang",
                filtered.later,
                "bg-slate-500 ring-slate-500/20"
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="completed">
          <DataTable
            columns={columns}
            data={filtered.completed}
            searchable={false}
            pagination={{ pageSize: 15 }}
            onRowClick={(row) => openDrawer("TASK_DETAIL", row.id)}
            emptyState={
              <EmptyState
                icon={CheckCircle2}
                title="Belum ada task selesai"
                description="Task DONE dalam 30 hari terakhir tampil di sini."
                className="border-0 py-8"
              />
            }
          />
        </TabsContent>

        <TabsContent value="cancelled">
          <DataTable
            columns={columns}
            data={filtered.cancelled}
            searchable={false}
            pagination={{ pageSize: 15 }}
            onRowClick={(row) => openDrawer("TASK_DETAIL", row.id)}
          />
        </TabsContent>
      </Tabs>

      <TaskCreateDialog
        open={createOpen || Boolean(editingTask)}
        onOpenChange={(open) => {
          if (!open) {
            setCreateOpen(false);
            setEditingTask(null);
          }
        }}
        projects={projects}
        assignees={assignees}
        currentUserId={currentUserId}
        canAssignOthers={canAssignOthers}
        defaultProjectId={
          filters.projectId !== "ALL" && filters.projectId !== "NONE"
            ? filters.projectId
            : undefined
        }
        editTask={editingTask}
        onUpdated={() => router.refresh()}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`Hapus Task ${deleteTarget?.taskCode ?? ""}?`}
        description={`Task "${deleteTarget?.title ?? ""}" akan dihapus dari tampilan aktif.`}
        confirmLabel="Hapus Task"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
