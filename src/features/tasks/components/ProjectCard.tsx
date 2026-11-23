"use client";

import Link from "next/link";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Edit3,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProjectStatus, ProjectSummaryDto } from "@/features/tasks/types";
import { formatDisplayDateWib } from "@/features/tasks/utils/date-wib";
import { cn } from "@/lib/utils";

export const PROJECT_STATUS_META: Record<
  ProjectStatus,
  { label: string; dotClass: string; badgeClass: string }
> = {
  PLANNING: {
    label: "Planning",
    dotClass: "bg-sky-500",
    badgeClass:
      "border border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300",
  },
  ACTIVE: {
    label: "Active",
    dotClass: "bg-emerald-500",
    badgeClass:
      "border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
  },
  ON_HOLD: {
    label: "On Hold",
    dotClass: "bg-amber-500",
    badgeClass:
      "border border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300",
  },
  COMPLETED: {
    label: "Completed",
    dotClass: "bg-indigo-500",
    badgeClass:
      "border border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300",
  },
  ARCHIVED: {
    label: "Archived",
    dotClass: "bg-slate-400",
    badgeClass:
      "border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
  },
};

export function getInitials(name: string): string {
  const cleanTokens = (input: string) =>
    input
      .trim()
      .split(/\s+/)
      .map((part) => part.replace(/[^\p{L}\p{N}]/gu, ""))
      .filter(Boolean);

  const withoutParens = name.replace(/\([^)]*\)/g, " ");
  let parts = cleanTokens(withoutParens);
  if (parts.length === 0) {
    parts = cleanTokens(name);
  }
  if (parts.length === 0) return "KT";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export interface ProjectCardProps {
  project: ProjectSummaryDto;
  canEdit?: boolean;
  canDelete?: boolean;
  onEdit?: (project: ProjectSummaryDto) => void;
  onDelete?: (project: ProjectSummaryDto) => void;
}

export function ProjectCard({
  project,
  canEdit = false,
  canDelete = false,
  onEdit,
  onDelete,
}: ProjectCardProps) {
  const statusMeta = PROJECT_STATUS_META[project.status];
  const denominator = Math.max(0, project.totalTasks - project.cancelledTasks);
  const visibleMembers = project.membersPreview.slice(0, 4);
  const extraMemberCount = Math.max(
    0,
    project.memberCount - visibleMembers.length
  );
  const showActions = (canEdit && onEdit) || (canDelete && onDelete);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-400">
      <Link
        href={`/projects/${project.id}`}
        aria-label={`Buka proyek ${project.name}`}
        className="absolute inset-0 z-0 focus:outline-none"
      />
      {/* Vibrant gradient top accent bar */}
      <div
        className="h-2 w-full shrink-0"
        style={{
          background: `linear-gradient(90deg, ${project.colorHex}, ${project.colorHex}99)`,
        }}
      />

      <div className="flex flex-1 flex-col p-5">
        {/* Top Row: Code chip + Health & Status pills + Action Menu */}
        <div className="flex items-start justify-between gap-2">
          <span className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: project.colorHex }}
            />
            <span className="truncate">{project.code}</span>
          </span>

          <div className="flex flex-wrap items-center justify-end gap-1.5">
            {project.overdueTasks > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300">
                <AlertTriangle className="size-3 shrink-0" />
                <span>{project.overdueTasks} Overdue</span>
              </span>
            ) : project.status === "ACTIVE" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
                <CheckCircle2 className="size-3 shrink-0" />
                <span>On Track</span>
              </span>
            ) : null}

            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold",
                statusMeta.badgeClass
              )}
            >
              <span
                className={cn("size-1.5 rounded-full", statusMeta.dotClass)}
              />
              <span>{statusMeta.label}</span>
            </span>

            {showActions ? (
              <div className="relative z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="size-6 rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                        aria-label={`Aksi proyek ${project.code}`}
                      />
                    }
                  >
                    <MoreHorizontal className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    {canEdit && onEdit ? (
                      <DropdownMenuItem onClick={() => onEdit(project)}>
                        <Edit3 className="size-3.5" />
                        <span>Edit Proyek</span>
                      </DropdownMenuItem>
                    ) : null}
                    {canEdit && onEdit && canDelete && onDelete ? (
                      <DropdownMenuSeparator />
                    ) : null}
                    {canDelete && onDelete ? (
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => onDelete(project)}
                      >
                        <Trash2 className="size-3.5" />
                        <span>Hapus Proyek</span>
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : null}
          </div>
        </div>

          {/* Bold Project Title & Readable Description */}
          <div className="mt-4 min-w-0 space-y-1.5">
            <h3 className="line-clamp-1 break-words text-base font-bold tracking-tight text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
              {project.name}
            </h3>
            {project.description ? (
              <p className="line-clamp-2 break-words text-xs font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                {project.description}
              </p>
            ) : null}
          </div>

          {/* Progress & Task Counter Chips */}
          <div className="mt-auto space-y-2.5 pt-5">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700 tabular-nums dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <span>{denominator} Tasks</span>
                <span className="text-slate-400 dark:text-slate-500">·</span>
                <span className="text-slate-900 dark:text-white">
                  {project.doneTasks} Done
                </span>
              </span>
              <span
                className={cn(
                  "rounded-md border px-2 py-0.5 font-mono text-xs font-bold tabular-nums",
                  project.progressPct >= 100
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
                    : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300"
                )}
              >
                {project.progressPct}%
              </span>
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-full border border-slate-200/70 bg-slate-100 dark:border-slate-700/70 dark:bg-slate-800">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${project.progressPct}%`,
                  backgroundColor: project.colorHex,
                }}
              />
            </div>
          </div>
        </div>

        {/* Footer: Member Avatar Stack & Target End Date */}
        <div className="flex items-center justify-between border-t border-slate-200/80 bg-slate-50/90 px-5 py-3 text-xs dark:border-slate-800 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            {visibleMembers.length > 0 ? (
              <AvatarGroup>
                {visibleMembers.map((m) => (
                  <Avatar
                    key={m.id}
                    size="sm"
                    title={m.fullName}
                    className="size-7 ring-2 ring-white dark:ring-slate-900"
                  >
                    {m.avatarUrl ? (
                      <AvatarImage src={m.avatarUrl} alt={m.fullName} />
                    ) : null}
                    <AvatarFallback className="bg-blue-50 text-[10px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                      {getInitials(m.fullName)}
                    </AvatarFallback>
                  </Avatar>
                ))}
                {extraMemberCount > 0 ? (
                  <AvatarGroupCount className="size-7 border border-slate-200 bg-white text-[11px] font-bold text-slate-700 ring-2 ring-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-900">
                    +{extraMemberCount}
                  </AvatarGroupCount>
                ) : null}
              </AvatarGroup>
            ) : (
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                0 members
              </span>
            )}
          </div>

          <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <Calendar className="size-3 shrink-0 text-slate-500 dark:text-slate-400" />
            <span>
              {project.targetEndDate
                ? formatDisplayDateWib(project.targetEndDate, "compact")
                : "—"}
            </span>
          </span>
        </div>
      </article>
  );
}
