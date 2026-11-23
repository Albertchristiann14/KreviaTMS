"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KanbanTaskCard } from "@/features/tasks/components/KanbanTaskCard";
import type {
  KanbanColumnStatus,
  TaskBoardCardDto,
} from "@/features/tasks/types";
import { TASK_STATUS_META } from "@/lib/constants/enums";
import { cn } from "@/lib/utils";

const COLUMN_STATUS_DOT: Record<KanbanColumnStatus, string> = {
  BACKLOG: "bg-slate-500 ring-slate-500/20 dark:bg-slate-400 dark:ring-slate-400/20",
  TODO: "bg-indigo-500 ring-indigo-500/20",
  IN_PROGRESS: "bg-blue-600 ring-blue-500/25",
  IN_REVIEW: "bg-amber-500 ring-amber-500/25",
  REVISION: "bg-rose-500 ring-rose-500/25",
  DONE: "bg-emerald-500 ring-emerald-500/25",
};

export interface KanbanColumnProps {
  status: KanbanColumnStatus;
  tasks: TaskBoardCardDto[];
  canCreateHere?: boolean;
  canEditTask?: boolean;
  canDeleteTask?: boolean;
  onQuickCreate?: (status: "BACKLOG" | "TODO" | "IN_PROGRESS") => void;
  onOpenDetail: (taskId: string) => void;
  onQuickMoveStatus: (
    task: TaskBoardCardDto,
    targetStatus: KanbanColumnStatus
  ) => void;
  onEditTask?: (task: TaskBoardCardDto) => void;
  onDeleteTask?: (task: TaskBoardCardDto) => void;
}

export function KanbanColumn({
  status,
  tasks,
  canCreateHere = false,
  canEditTask = false,
  canDeleteTask = false,
  onQuickCreate,
  onOpenDetail,
  onQuickMoveStatus,
  onEditTask,
  onDeleteTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: {
      type: "COLUMN",
      status,
    },
  });

  const meta = TASK_STATUS_META[status];
  const taskIds = tasks.map((t) => t.id);
  const supportsQuickCreate =
    canCreateHere &&
    Boolean(onQuickCreate) &&
    (status === "BACKLOG" || status === "TODO" || status === "IN_PROGRESS");

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full min-h-[520px] w-[304px] shrink-0 flex-col rounded-2xl border border-slate-300/70 bg-slate-200/60 p-3 transition-colors dark:border-slate-700 dark:bg-slate-800/60",
        isOver &&
          "border-blue-500 bg-blue-100/70 ring-2 ring-blue-500/20 dark:border-blue-400 dark:bg-blue-950/40"
      )}
    >
      {/* Bold High-Contrast Column Header */}
      <div className="flex items-center justify-between gap-2 px-1 pb-3 pt-0.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span
            className={cn(
              "size-2.5 shrink-0 rounded-full ring-4",
              COLUMN_STATUS_DOT[status]
            )}
          />
          <h3 className="truncate text-sm font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {meta.label}
          </h3>
          <span className="inline-flex h-5.5 min-w-6 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white px-2 font-mono text-xs font-bold text-slate-700 shadow-2xs tabular-nums dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            {tasks.length}
          </span>
        </div>

        {supportsQuickCreate && onQuickCreate ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() =>
              onQuickCreate(status as "BACKLOG" | "TODO" | "IN_PROGRESS")
            }
            aria-label={`Tambah task di ${meta.label}`}
            className="size-7 rounded-lg border border-slate-200/90 bg-white text-slate-600 shadow-2xs transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-blue-500/50 dark:hover:bg-blue-500/15 dark:hover:text-blue-300"
          >
            <Plus className="size-3.5" />
          </Button>
        ) : null}
      </div>

      {/* Popping Cards Stack */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto pt-0.5 pb-1 [scrollbar-width:thin]">
          {tasks.length === 0 ? (
            <div className="flex min-h-[124px] flex-1 flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-slate-300/90 bg-white/50 px-4 text-center dark:border-slate-700 dark:bg-slate-900/40">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Belum ada task
              </span>
              {supportsQuickCreate && onQuickCreate ? (
                <button
                  type="button"
                  onClick={() =>
                    onQuickCreate(status as "BACKLOG" | "TODO" | "IN_PROGRESS")
                  }
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:border-blue-400 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-500/50 dark:hover:text-blue-300"
                >
                  <Plus className="size-3" />
                  <span>Tambah Task</span>
                </button>
              ) : null}
            </div>
          ) : (
            tasks.map((task) => (
              <KanbanTaskCard
                key={task.id}
                task={task}
                onOpenDetail={onOpenDetail}
                onQuickMoveStatus={onQuickMoveStatus}
                canEdit={canEditTask}
                canDelete={canDeleteTask}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
