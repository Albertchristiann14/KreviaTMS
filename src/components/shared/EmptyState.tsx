import type { ReactNode } from "react";
import { Inbox, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/60 bg-muted/20 px-6 py-10 text-center",
        className
      )}
    >
      <div className="mb-3 flex size-10 items-center justify-center rounded-xl border border-border/60 bg-background text-muted-foreground shadow-2xs">
        <Icon className="size-4.5" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-semibold tracking-tight text-foreground">
        {title}
      </h3>
      {description ? (
        <p
          title={description}
          className="mt-1 line-clamp-1 max-w-md text-xs text-muted-foreground/85"
        >
          {description}
        </p>
      ) : null}
      {action ? (
        <div className="mt-4 flex items-center justify-center gap-2">
          {action}
        </div>
      ) : null}
    </div>
  );
}
