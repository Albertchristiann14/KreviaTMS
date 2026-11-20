import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import type { LucideIcon } from "lucide-react";

export interface ModuleSkeletonPageProps {
  moduleBadge: string;
  title: string;
  description: string;
  emptyTitle: string;
  emptyDescription: string;
  icon?: LucideIcon;
  metaTag?: string;
  action?: ReactNode;
}

export function ModuleSkeletonPage({
  moduleBadge,
  title,
  description,
  emptyTitle,
  emptyDescription,
  icon,
  metaTag,
  action,
}: ModuleSkeletonPageProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[11px] font-semibold">
              {moduleBadge}
            </Badge>
            {metaTag ? (
              <Badge variant="outline" className="font-mono text-[11px]">
                {metaTag}
              </Badge>
            ) : null}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>

      <EmptyState
        icon={icon}
        title={emptyTitle}
        description={emptyDescription}
      />
    </div>
  );
}
