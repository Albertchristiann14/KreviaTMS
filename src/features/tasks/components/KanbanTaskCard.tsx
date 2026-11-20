"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertTriangle,
  Calendar,
  Check,
  Flag,
  GripVertical,
  Megaphone,
  MessageSquare,
  MoreHorizontal,
  Palette,
  Paperclip,
  RotateCcw,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getInitials } from "@/features/tasks/components/ProjectCard";
import {
  KANBAN_COLUMN_STATUSES,
  type KanbanColumnStatus,
  type TaskBoardCardDto,
} from "@/features/tasks/types";
import { formatDisplayDateWib } from "@/features/tasks/utils/date-wib";
import {
  TASK_PRIORITY_META,
  TASK_STATUS_META,
  type TaskPriority,
} from "@/lib/constants/enums";
import { cn } from "@/lib/utils";

const PRIORITY_BADGE_STYLES: Record<TaskPriority, string> = {
  URGENT:
    "border-rose-600 bg-rose-600 text-white shadow-2xs dark:border-rose-500 dark:bg-rose-600",
  HIGH: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300",
  MEDIUM:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300",
  LOW: "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

export interface KanbanTaskCardProps {
  task: TaskBoardCardDto;
  onOpenDetail: (taskId: string) => void;
  onQuickMoveStatus: (
    task: TaskBoardCardDto,
    targetStatus: KanbanColumnStatus
  ) => void;
  isOverlay?: boolean;
}

export function KanbanTaskCard({
  task,
  onOpenDetail,
  onQuickMoveStatus,
  isOverlay = false,
}: KanbanTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "TASK",
      status: task.status,
      task,
    },
    disabled: isOverlay,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityMeta = TASK_PRIORITY_META[task.priority];
  const isChecklistDone =
    task.checklistTotal > 0 && task.checklistCompleted === task.checklistTotal;

  return (
    <div
      ref={isOverlay ? undefined : setNodeRef}
      style={isOverlay ? undefined : style}
      onClick={() => {
        if (!isDragging) {
          onOpenDetail(task.id);
        }
      }}
      className={cn(
        "group relative cursor-pointer rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition-all duration-150 hover:border-blue-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-400",
        isDragging && "opacity-40 ring-2 ring-blue-500/30",
        isOverlay &&
          "rotate-1 cursor-grabbing border-blue-500 bg-white shadow-xl ring-2 ring-blue-500/25 dark:bg-slate-900",
        task.deadlineHealth === "OVERDUE" &&
          "border-rose-300 hover:border-rose-500 dark:border-rose-500/45"
      )}
    >
      {/* Top Bar: Drag Handle + Task Code Pill + Quick Move Menu */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <button
            type="button"
            aria-label={`Seret task ${task.taskCode}`}
            className="cursor-grab touch-none rounded-md p-0.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 active:cursor-grabbing dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
            onClick={(e) => e.stopPropagation()}
            {...(isOverlay ? {} : attributes)}
            {...(isOverlay ? {} : listeners)}
          >
            <GripVertical className="size-3.5" />
          </button>

          <span
            className="inline-flex min-w-0 items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            title={task.project.name}
          >
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: task.project.colorHex }}
            />
            <span className="truncate">{task.taskCode}</span>
          </span>
        </div>

        <div
          className="flex shrink-0 items-center gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          {!isOverlay ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    className="size-7 rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-800 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    aria-label={`Pindah status ${task.taskCode}`}
                  />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-[11px] font-semibold text-slate-500">
                    Pindah Status
                  </DropdownMenuLabel>
                  {KANBAN_COLUMN_STATUSES.filter((s) => s !== task.status).map(
                    (target) => (
                      <DropdownMenuItem
                        key={target}
                        onClick={() => onQuickMoveStatus(task, target)}
                      >
                        <span>{TASK_STATUS_META[target].label}</span>
                      </DropdownMenuItem>
                    )
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onOpenDetail(task.id)}>
                  Buka Detail
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>

      {/* High-Contrast Bold Title */}
      <h4 className="mt-2 line-clamp-2 break-words text-sm font-bold leading-snug text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
        {task.title}
      </h4>

      {/* Type & Revision Pills (when applicable) */}
      {task.taskType !== "GENERAL" || task.revisionCount > 0 ? (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {task.taskType === "CONTENT_PRODUCTION" ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-300">
              <Megaphone className="size-3" />
              <span>Content</span>
            </span>
          ) : task.taskType === "DESIGN_TASK" ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] font-semibold text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300">
              <Palette className="size-3" />
              <span>Design</span>
            </span>
          ) : null}

          {task.revisionCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 font-mono text-[11px] font-bold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300">
              <RotateCcw className="size-3" />
              <span>Rev {task.revisionCount}</span>
            </span>
          ) : null}
        </div>
      ) : null}

      {/* Structured Card Footer: Priority, Checklist, Due Date, Assignee */}
      <div className="mt-3.5 flex items-end justify-between gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span
            title={`Prioritas: ${priorityMeta.label}`}
            className={cn(
              "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-bold",
              PRIORITY_BADGE_STYLES[task.priority]
            )}
          >
            {task.priority === "URGENT" ? (
              <AlertTriangle className="size-3 shrink-0" />
            ) : (
              <Flag className="size-3 shrink-0" />
            )}
            <span>{priorityMeta.label}</span>
          </span>

          {task.checklistTotal > 0 ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-[11px] font-bold",
                isChecklistDone
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
                  : "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              )}
            >
              <Check className="size-3 shrink-0" />
              <span>
                {task.checklistCompleted}/{task.checklistTotal}
              </span>
            </span>
          ) : null}

          {task.dueDate ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px]",
                task.deadlineHealth === "OVERDUE"
                  ? "border-rose-200 bg-rose-50 font-bold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300"
                  : task.deadlineHealth === "DUE_SOON"
                    ? "border-amber-200 bg-amber-50 font-bold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
                    : "border-slate-200 bg-slate-50 font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300"
              )}
            >
              {task.deadlineHealth === "OVERDUE" ? (
                <AlertTriangle className="size-3 shrink-0" />
              ) : (
                <Calendar className="size-3 shrink-0 text-slate-500 dark:text-slate-400" />
              )}
              <span>{formatDisplayDateWib(task.dueDate, "compact")}</span>
            </span>
          ) : null}

          {task.commentCount > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-md px-1 py-0.5 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <MessageSquare className="size-3" />
              <span>{task.commentCount}</span>
            </span>
          ) : null}

          {task.attachmentCount > 0 ? (
            <span className="inline-flex items-center gap-0.5 rounded-md px-1 py-0.5 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <Paperclip className="size-3" />
              <span>{task.attachmentCount}</span>
            </span>
          ) : null}
        </div>

        {task.assignee ? (
          <Avatar
            size="sm"
            title={task.assignee.fullName}
            className="size-7 shrink-0 border border-slate-200 ring-2 ring-white dark:border-slate-700 dark:ring-slate-900"
          >
            {task.assignee.avatarUrl ? (
              <AvatarImage
                src={task.assignee.avatarUrl}
                alt={task.assignee.fullName}
              />
            ) : null}
            <AvatarFallback className="bg-blue-50 text-[11px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
              {getInitials(task.assignee.fullName)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <span
            title="Unassigned"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-dashed border-slate-300 bg-slate-50 text-[11px] font-bold text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-500"
          >
            —
          </span>
        )}
      </div>
    </div>
  );
}
