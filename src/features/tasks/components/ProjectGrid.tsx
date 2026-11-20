"use client";

import { useMemo, useState } from "react";
import { FolderKanban, Plus, RotateCcw, Search } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PROJECT_STATUS_META,
  ProjectCard,
} from "@/features/tasks/components/ProjectCard";
import { ProjectFormDialog } from "@/features/tasks/components/ProjectFormDialog";
import { useProjectListFilters } from "@/features/tasks/hooks/useTaskFilters";
import {
  PROJECT_STATUS_VALUES,
  type AssigneeWorkloadOption,
  type ProjectStatus,
  type ProjectSummaryDto,
} from "@/features/tasks/types";

export interface ProjectGridProps {
  initialProjects: ProjectSummaryDto[];
  assignableUsers: AssigneeWorkloadOption[];
  currentUserId: string;
  canCreateProject: boolean;
}

export function ProjectGrid({
  initialProjects,
  assignableUsers,
  currentUserId,
  canCreateProject,
}: ProjectGridProps) {
  const { filters, setFilters, resetFilters } = useProjectListFilters();
  const [createOpen, setCreateOpen] = useState(false);

  const filteredProjects = useMemo(() => {
    const query = filters.q.trim().toLowerCase();
    return initialProjects.filter((project) => {
      if (filters.status === "ACTIVE_ALL") {
        if (project.status === "ARCHIVED") return false;
      } else if (filters.status !== "ALL") {
        if (project.status !== filters.status) return false;
      }

      if (query) {
        const hay = `${project.code} ${project.name} ${
          project.description ?? ""
        }`.toLowerCase();
        if (!hay.includes(query)) return false;
      }

      return true;
    });
  }, [initialProjects, filters.status, filters.q]);

  const totalActiveCount = initialProjects.filter(
    (p) => p.status === "ACTIVE"
  ).length;
  const totalOverdueTasks = initialProjects.reduce(
    (acc, p) => acc + p.overdueTasks,
    0
  );

  return (
    <div className="space-y-5">
      {/* Crisp Command Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="h-6 w-1 rounded-full bg-blue-600" />
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
            Projects
          </h1>
          <span className="inline-flex h-6 items-center rounded-full border border-slate-200 bg-white px-2.5 font-mono text-xs font-bold text-slate-700 shadow-2xs tabular-nums dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            {initialProjects.length}
          </span>
          <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-500" />
            <span>{totalActiveCount} Aktif</span>
          </span>
          {totalOverdueTasks > 0 ? (
            <span className="inline-flex h-6 items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 text-xs font-bold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300">
              <span className="size-1.5 rounded-full bg-rose-500" />
              <span>{totalOverdueTasks} Overdue</span>
            </span>
          ) : null}
        </div>

        {canCreateProject ? (
          <Button
            type="button"
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="h-9 gap-1.5 rounded-xl bg-blue-600 px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
          >
            <Plus className="size-3.5" />
            <span>Proyek Baru</span>
          </Button>
        ) : null}
      </div>

      {/* Elevated Filter Toolbar */}
      <div className="flex flex-col gap-2.5 rounded-2xl border border-slate-200/90 bg-white p-3 shadow-xs sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div className="relative w-full sm:max-w-xs">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-500 dark:text-slate-400"
            aria-hidden="true"
          />
          <Input
            value={filters.q}
            onChange={(e) => void setFilters({ q: e.target.value })}
            placeholder="Cari kode atau nama proyek..."
            className="h-8.5 rounded-lg border-slate-200 bg-slate-50 pl-8.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus-visible:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filters.status}
            onValueChange={(val) => {
              if (val) void setFilters({ status: val });
            }}
          >
            <SelectTrigger className="h-8.5 w-full min-w-0 overflow-hidden rounded-lg border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-white *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate sm:w-52 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <SelectValue className="block min-w-0 truncate">
                {(val: string | null) => {
                  const label = (() => {
                    if (!val || val === "ACTIVE_ALL") {
                      return "Semua Kecuali Archived";
                    }
                    if (val === "ALL") return "Semua Status";
                    return (
                      PROJECT_STATUS_META[val as ProjectStatus]?.label ?? val
                    );
                  })();
                  return <span className="block truncate">{label}</span>;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE_ALL">Semua Kecuali Archived</SelectItem>
              <SelectItem value="ALL">Semua Status</SelectItem>
              {PROJECT_STATUS_VALUES.map((st) => (
                <SelectItem key={st} value={st}>
                  {PROJECT_STATUS_META[st].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(filters.q || filters.status !== "ACTIVE_ALL") && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-8.5 gap-1 rounded-lg px-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <RotateCcw className="size-3" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Project Cards Grid */}
      {filteredProjects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="Tidak ada proyek ditemukan"
          description={
            canCreateProject
              ? "Buat proyek baru untuk mulai mengelola task."
              : "Proyek akan tampil setelah Anda ditambahkan."
          }
          action={
            canCreateProject ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setCreateOpen(true)}
                className="bg-blue-600 font-semibold text-white hover:bg-blue-700"
              >
                <Plus className="size-3.5" />
                <span>Proyek Baru</span>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      {canCreateProject ? (
        <ProjectFormDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          mode="create"
          assignableUsers={assignableUsers}
          currentUserId={currentUserId}
        />
      ) : null}
    </div>
  );
}
