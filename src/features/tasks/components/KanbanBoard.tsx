"use client";

import { useEffect, useRef, useState } from "react";
import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import {
  AlertTriangle,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
} from "lucide-react";
import { KanbanColumn } from "@/features/tasks/components/KanbanColumn";
import { KanbanTaskCard } from "@/features/tasks/components/KanbanTaskCard";
import { TaskCreateDialog } from "@/features/tasks/components/TaskCreateDialog";
import {
  useKanbanBoard,
  type KanbanBoardFilterValues,
} from "@/features/tasks/hooks/useKanbanBoard";
import { useTaskBoardFilters } from "@/features/tasks/hooks/useTaskFilters";
import {
  KANBAN_COLUMN_STATUSES,
  type AssigneeWorkloadOption,
  type KanbanBoardResponse,
  type KanbanColumnStatus,
  type ProjectLookupOption,
  type TaskBoardCardDto,
} from "@/features/tasks/types";
import { Button } from "@/components/ui/button";
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
import { Textarea } from "@/components/ui/textarea";
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

export interface KanbanBoardProps {
  initialData: KanbanBoardResponse;
  initialFilters: KanbanBoardFilterValues;
  projects: ProjectLookupOption[];
  assignees: AssigneeWorkloadOption[];
  currentUserId: string;
  canCreateTask: boolean;
  canAssignTask: boolean;
}

interface PendingRevisionModal {
  task: TaskBoardCardDto;
  sourceStatus: KanbanColumnStatus;
  targetIndex?: number;
}

export function KanbanBoard({
  initialData,
  initialFilters,
  projects,
  assignees,
  currentUserId,
  canCreateTask,
  canAssignTask,
}: KanbanBoardProps) {
  const openDrawer = useUIStore((s) => s.openDrawer);
  const { filters, setFilters, hasActiveFilters, resetFilters } =
    useTaskBoardFilters();

  const { board, isFetching, moveTask, isMoving, refreshBoard } =
    useKanbanBoard(initialData, initialFilters, filters);

  const [activeTask, setActiveTask] = useState<TaskBoardCardDto | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDefaultStatus, setCreateDefaultStatus] = useState<
    "BACKLOG" | "TODO" | "IN_PROGRESS"
  >("TODO");

  // Mandatory revision feedback modal state
  const [revisionPrompt, setRevisionPrompt] =
    useState<PendingRevisionModal | null>(null);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [revisionError, setRevisionError] = useState<string | null>(null);
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

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const findCardLocation = (
    taskId: string
  ): {
    status: KanbanColumnStatus;
    index: number;
    task: TaskBoardCardDto;
  } | null => {
    for (const status of KANBAN_COLUMN_STATUSES) {
      const idx = board.columns[status].findIndex((t) => t.id === taskId);
      if (idx !== -1) {
        const task = board.columns[status][idx];
        if (task) return { status, index: idx, task };
      }
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const taskId = String(event.active.id);
    const found = findCardLocation(taskId);
    setActiveTask(found?.task ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const source = findCardLocation(activeId);
    if (!source) return;

    let targetStatus: KanbanColumnStatus;
    let targetIndex: number;

    if (KANBAN_COLUMN_STATUSES.includes(overId as KanbanColumnStatus)) {
      targetStatus = overId as KanbanColumnStatus;
      targetIndex = board.columns[targetStatus].length;
    } else {
      const overLoc = findCardLocation(overId);
      if (!overLoc) return;
      targetStatus = overLoc.status;
      targetIndex = overLoc.index;
    }

    if (source.status === targetStatus && source.index === targetIndex) {
      return;
    }

    if (source.status !== "REVISION" && targetStatus === "REVISION") {
      setRevisionNotes("");
      setRevisionError(null);
      setRevisionPrompt({
        task: source.task,
        sourceStatus: source.status,
        targetIndex,
      });
      return;
    }

    moveTask({
      taskId: source.task.id,
      sourceStatus: source.status,
      targetStatus,
      targetIndex,
      expectedVersion: source.task.version,
    });
  };

  const handleQuickMoveStatus = (
    task: TaskBoardCardDto,
    targetStatus: KanbanColumnStatus
  ) => {
    const sourceStatus = task.status as KanbanColumnStatus;
    if (sourceStatus === targetStatus) return;

    if (targetStatus === "REVISION") {
      setRevisionNotes("");
      setRevisionError(null);
      setRevisionPrompt({
        task,
        sourceStatus,
      });
      return;
    }

    moveTask({
      taskId: task.id,
      sourceStatus,
      targetStatus,
      expectedVersion: task.version,
    });
  };

  const handleSubmitRevisionPrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionPrompt) return;
    const trimmed = revisionNotes.trim();
    if (trimmed.length < 10) {
      setRevisionError("Minimal 10 karakter.");
      return;
    }

    moveTask({
      taskId: revisionPrompt.task.id,
      sourceStatus: revisionPrompt.sourceStatus,
      targetStatus: "REVISION",
      targetIndex: revisionPrompt.targetIndex,
      expectedVersion: revisionPrompt.task.version,
      revisionNotes: trimmed,
    });
    setRevisionPrompt(null);
    setRevisionNotes("");
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Crisp Command Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-1 rounded-full bg-blue-600" />
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
            Kanban Board
          </h1>
          <span className="inline-flex h-6 items-center rounded-full border border-slate-200 bg-white px-2.5 font-mono text-xs font-bold text-slate-700 shadow-2xs tabular-nums dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            {board.totalCount}
          </span>
          {isFetching || isMoving ? (
            <Loader2 className="size-4 animate-spin text-blue-600 dark:text-blue-400" />
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={refreshBoard}
            disabled={isFetching}
            title="Sinkronkan papan"
            className="h-9 gap-1.5 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw className={cn("size-3.5", isFetching && "animate-spin")} />
            <span className="hidden sm:inline">Sync</span>
          </Button>
          {canCreateTask ? (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setCreateDefaultStatus("TODO");
                setCreateDialogOpen(true);
              }}
              className="h-9 gap-1.5 rounded-xl bg-blue-600 px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <Plus className="size-3.5" />
              <span>Buat Task</span>
            </Button>
          ) : null}
        </div>
      </div>

      {/* Elevated High-Contrast Filter Deck */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/90 bg-white p-2.5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          <Input
            value={displayedSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Cari kode atau judul task..."
            className="h-8.5 rounded-lg border-slate-200 bg-slate-50 pl-8.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus-visible:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <Select
          value={filters.projectId}
          onValueChange={(val) => {
            if (val) void setFilters({ projectId: val });
          }}
        >
          <SelectTrigger
            className={cn(
              "h-8.5 w-44 min-w-0 overflow-hidden rounded-lg border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-white *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
              filters.projectId !== "ALL" &&
                "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-300"
            )}
          >
            <SelectValue className="block min-w-0 truncate">
              {(val: string | null) => {
                const label = (() => {
                  if (!val || val === "ALL") return "Semua Proyek";
                  const p = projects.find((item) => item.id === val);
                  return p ? `${p.code} · ${p.name}` : "Proyek";
                })();
                return <span className="block truncate">{label}</span>;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Proyek</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                <span className="inline-flex min-w-0 items-center gap-2">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: p.colorHex }}
                  />
                  <span className="truncate">
                    {p.code} · {p.name}
                  </span>
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
          <SelectTrigger
            className={cn(
              "h-8.5 w-40 min-w-0 overflow-hidden rounded-lg border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-white *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
              filters.assigneeId !== "ALL" &&
                "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-300"
            )}
          >
            <SelectValue className="block min-w-0 truncate">
              {(val: string | null) => {
                const label = (() => {
                  if (!val || val === "ALL") return "Semua Assignee";
                  if (val === "UNASSIGNED") return "Unassigned";
                  const u = assignees.find((item) => item.id === val);
                  return u ? u.fullName : "Assignee";
                })();
                return <span className="block truncate">{label}</span>;
              }}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Semua Assignee</SelectItem>
            <SelectItem value="UNASSIGNED">Unassigned</SelectItem>
            {assignees.map((u) => (
              <SelectItem key={u.id} value={u.id}>
                <span className="truncate">{u.fullName}</span>
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
          <SelectTrigger
            className={cn(
              "h-8.5 w-36 min-w-0 overflow-hidden rounded-lg border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-white *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
              filters.priority !== "ALL" &&
                "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-300"
            )}
          >
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
          <SelectTrigger
            className={cn(
              "h-8.5 w-36 min-w-0 overflow-hidden rounded-lg border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-white *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
              filters.taskType !== "ALL" &&
                "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-300"
            )}
          >
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

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void setFilters({ overdueOnly: !filters.overdueOnly })}
          className={cn(
            "h-8.5 gap-1.5 rounded-lg border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 transition-colors hover:bg-white hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
            filters.overdueOnly &&
              "border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-300"
          )}
        >
          <AlertTriangle className="size-3.5" />
          <span>Overdue</span>
        </Button>

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

      {/* 6-Column High-Contrast Kanban Canvas */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 gap-4 overflow-x-auto pb-3 [scrollbar-width:thin]">
          {KANBAN_COLUMN_STATUSES.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={board.columns[status]}
              canCreateHere={canCreateTask}
              onQuickCreate={(colStatus) => {
                setCreateDefaultStatus(colStatus);
                setCreateDialogOpen(true);
              }}
              onOpenDetail={(taskId) => openDrawer("TASK_DETAIL", taskId)}
              onQuickMoveStatus={handleQuickMoveStatus}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? (
            <KanbanTaskCard
              task={activeTask}
              onOpenDetail={() => {}}
              onQuickMoveStatus={() => {}}
              isOverlay
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Mandatory Revision Notes Dialog */}
      <Dialog
        open={Boolean(revisionPrompt)}
        onOpenChange={(open) => {
          if (!open) setRevisionPrompt(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
              <span>Catatan Revisi</span>
              {revisionPrompt ? (
                <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {revisionPrompt.task.taskCode}
                </span>
              ) : null}
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-600 dark:text-slate-300">
              Wajib isi arahan revisi minimal 10 karakter.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitRevisionPrompt} className="space-y-4">
            <div className="space-y-1.5">
              <Label
                htmlFor="kanban-revision-notes"
                className="text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                Feedback *
              </Label>
              <Textarea
                id="kanban-revision-notes"
                value={revisionNotes}
                onChange={(e) => {
                  setRevisionNotes(e.target.value);
                  setRevisionError(null);
                }}
                placeholder="Poin yang perlu diperbaiki..."
                rows={4}
                required
              />
              {revisionError ? (
                <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                  {revisionError}
                </p>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRevisionPrompt(null)}
              >
                Batal
              </Button>
              <Button type="submit" variant="destructive">
                Kirim ke Revision
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {canCreateTask ? (
        <TaskCreateDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          projects={projects}
          assignees={assignees}
          currentUserId={currentUserId}
          canAssignOthers={canAssignTask}
          defaultProjectId={
            filters.projectId !== "ALL" ? filters.projectId : undefined
          }
          defaultStatus={createDefaultStatus}
          onCreated={() => refreshBoard()}
        />
      ) : null}
    </div>
  );
}
