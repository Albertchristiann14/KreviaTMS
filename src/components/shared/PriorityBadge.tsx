import { Badge } from "@/components/ui/badge";
import {
  TASK_PRIORITY_META,
  type TaskPriority,
} from "@/lib/constants/enums";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES: Record<TaskPriority, { pill: string; dot: string }> = {
  LOW: {
    pill: "border-slate-300/80 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
    dot: "bg-slate-500 dark:bg-slate-400",
  },
  MEDIUM: {
    pill: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300",
    dot: "bg-sky-600 dark:bg-sky-400",
  },
  HIGH: {
    pill: "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/15 dark:text-orange-300",
    dot: "bg-orange-600 dark:bg-orange-400",
  },
  URGENT: {
    pill: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300",
    dot: "bg-rose-600 dark:bg-rose-400 animate-pulse",
  },
};

export interface PriorityBadgeProps {
  priority: TaskPriority | string;
  className?: string;
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const meta = TASK_PRIORITY_META[priority as TaskPriority];
  const style = PRIORITY_STYLES[priority as TaskPriority];

  if (!meta || !style) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border border-slate-300/80 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold tracking-wide text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
          className
        )}
      >
        <span
          className="size-1.5 shrink-0 rounded-full bg-slate-500 dark:bg-slate-400"
          aria-hidden="true"
        />
        <span>{priority}</span>
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        style.pill,
        className
      )}
    >
      <span
        className={cn("size-1.5 shrink-0 rounded-full", style.dot)}
        aria-hidden="true"
      />
      <span>{meta.label}</span>
    </Badge>
  );
}
