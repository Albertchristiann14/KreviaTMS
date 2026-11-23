"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Columns3,
  Edit3,
  FolderKanban,
  Gauge,
  Layers,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users,
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
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  deleteProjectAction,
  manageProjectMembersAction,
} from "@/features/tasks/actions/project.actions";
import { softDeleteTaskAction } from "@/features/tasks/actions/task.actions";
import {
  getInitials,
  PROJECT_STATUS_META,
} from "@/features/tasks/components/ProjectCard";
import { ProjectFormDialog } from "@/features/tasks/components/ProjectFormDialog";
import { TaskCreateDialog } from "@/features/tasks/components/TaskCreateDialog";
import type {
  AssigneeWorkloadOption,
  ProjectDetailDto,
  ProjectMemberDto,
  TaskBoardCardDto,
} from "@/features/tasks/types";
import { formatDisplayDateWib } from "@/features/tasks/utils/date-wib";
import {
  TASK_STATUS_META,
  TASK_STATUS_VALUES,
  type TaskStatus,
} from "@/lib/constants/enums";
import { useUIStore } from "@/lib/stores/ui-store";
import { cn } from "@/lib/utils";

const columnHelper = createDataTableColumnHelper<TaskBoardCardDto>();

const PROJECT_ROLE_LABELS: Record<"LEAD" | "MEMBER" | "VIEWER", string> = {
  LEAD: "Lead",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

const SYSTEM_ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  PROJECT_MANAGER: "Project Manager",
  STAFF_CREATOR: "Staff / Creator",
  DESIGNER: "Designer",
};

const STATUS_BAR_COLORS: Record<TaskStatus, string> = {
  BACKLOG: "bg-slate-400",
  TODO: "bg-indigo-500",
  IN_PROGRESS: "bg-blue-600",
  IN_REVIEW: "bg-amber-500",
  REVISION: "bg-rose-500",
  DONE: "bg-emerald-500",
  CANCELLED: "bg-neutral-400",
};

export interface ProjectDetailTabsProps {
  project: ProjectDetailDto;
  assignableUsers: AssigneeWorkloadOption[];
  currentUserId: string;
  canUpdateProject: boolean;
  canDeleteProject?: boolean;
  canCreateTask: boolean;
  canAssignTask: boolean;
  canEditTask?: boolean;
  canDeleteTask?: boolean;
}

export function ProjectDetailTabs({
  project,
  assignableUsers,
  currentUserId,
  canUpdateProject,
  canDeleteProject = false,
  canCreateTask,
  canAssignTask,
  canEditTask = false,
  canDeleteTask = false,
}: ProjectDetailTabsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const openDrawer = useUIStore((s) => s.openDrawer);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [deletingProject, setDeletingProject] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskBoardCardDto | null>(null);
  const [deletingTask, setDeletingTask] = useState<TaskBoardCardDto | null>(
    null
  );
  const [deletingTaskLoading, setDeletingTaskLoading] = useState(false);
  const [newMemberUserId, setNewMemberUserId] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<
    "LEAD" | "MEMBER" | "VIEWER"
  >("MEMBER");
  const [memberMutationLoading, setMemberMutationLoading] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<ProjectMemberDto | null>(
    null
  );

  const nonCancelledCount = Math.max(
    0,
    project.totalTasks - project.cancelledTasks
  );
  const statusMeta = PROJECT_STATUS_META[project.status];

  const availableUsersToAdd = useMemo(() => {
    const existingIds = new Set(project.members.map((m) => m.userId));
    return assignableUsers.filter((u) => !existingIds.has(u.id));
  }, [assignableUsers, project.members]);

  const taskColumns = useMemo<DataTableColumnDef<TaskBoardCardDto>[]>(
    () => [
      columnHelper.accessor("taskCode", {
        header: "Task",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="flex min-w-[240px] max-w-[400px] items-center gap-2.5">
              <span className="shrink-0 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {row.taskCode}
              </span>
              <span className="min-w-0 flex-1 truncate font-bold text-slate-900 dark:text-white">
                {row.title}
              </span>
              {row.checklistTotal > 0 ? (
                <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <Check className="size-3" />
                  <span>
                    {row.checklistCompleted}/{row.checklistTotal}
                  </span>
                </span>
              ) : null}
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
      columnHelper.accessor(
        (row) => row.assignee?.fullName ?? "Belum ditugaskan",
        {
          id: "assignee",
          header: "Assignee",
          cell: (info) => {
            const assignee = info.row.original.assignee;
            if (!assignee) {
              return (
                <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                  Unassigned
                </span>
              );
            }
            return (
              <div className="flex items-center gap-2">
                <Avatar
                  size="sm"
                  className="size-6 border border-slate-200 dark:border-slate-700"
                >
                  {assignee.avatarUrl ? (
                    <AvatarImage
                      src={assignee.avatarUrl}
                      alt={assignee.fullName}
                    />
                  ) : null}
                  <AvatarFallback className="bg-blue-50 text-[10px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                    {getInitials(assignee.fullName)}
                  </AvatarFallback>
                </Avatar>
                <span className="max-w-[140px] truncate text-xs font-semibold text-slate-800 dark:text-slate-200">
                  {assignee.fullName}
                </span>
              </div>
            );
          },
        }
      ),
      columnHelper.accessor((row) => row.dueDate ?? "", {
        id: "dueDate",
        header: "Deadline",
        cell: (info) => {
          const row = info.row.original;
          if (!row.dueDate) {
            return (
              <span className="text-xs font-medium text-slate-400">—</span>
            );
          }
          return (
            <span
              className={cn(
                "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums",
                row.deadlineHealth === "OVERDUE"
                  ? "border-rose-200 bg-rose-50 font-bold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300"
                  : row.deadlineHealth === "DUE_SOON"
                    ? "border-amber-200 bg-amber-50 font-bold text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
                    : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
              )}
            >
              {formatDisplayDateWib(row.dueDate, "short")}
            </span>
          );
        },
      }),
      ...(canEditTask || canDeleteTask
        ? [
            columnHelper.display({
              id: "actions",
              header: "Aksi",
              cell: (info) => {
                const row = info.row.original;
                return (
                  <div
                    className="flex items-center gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {canEditTask ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
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
                        variant="ghost"
                        size="icon-xs"
                        aria-label={`Hapus ${row.taskCode}`}
                        onClick={() => setDeletingTask(row)}
                        className="size-7 rounded-lg text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-500/15 dark:hover:text-rose-400"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                );
              },
            }),
          ]
        : []),
    ],
    [canEditTask, canDeleteTask]
  );

  const handleConfirmDeleteProject = async () => {
    setDeletingProject(true);
    try {
      const res = await deleteProjectAction({ projectId: project.id });
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      toast.success(
        res.message ??
          (res.data.detachedTaskCount
            ? `Proyek ${project.code} dihapus. ${res.data.detachedTaskCount} task menjadi Tanpa Proyek (Umum).`
            : `Proyek ${project.code} berhasil dihapus.`)
      );
      setDeleteProjectOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["kanban-board"] });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      router.push("/projects");
      router.refresh();
    } finally {
      setDeletingProject(false);
    }
  };

  const handleConfirmDeleteTask = async () => {
    if (!deletingTask) return;
    setDeletingTaskLoading(true);
    try {
      const res = await softDeleteTaskAction({ taskId: deletingTask.id });
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      toast.success(res.message ?? `Task ${deletingTask.taskCode} dihapus.`);
      void queryClient.invalidateQueries({ queryKey: ["kanban-board"] });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({
        queryKey: ["slide-over-detail", "TASK_DETAIL", deletingTask.id],
      });
      setDeletingTask(null);
      router.refresh();
    } finally {
      setDeletingTaskLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberUserId) {
      toast.error("Pilih anggota tim terlebih dahulu.");
      return;
    }

    setMemberMutationLoading(true);
    try {
      const res = await manageProjectMembersAction({
        projectId: project.id,
        operation: "UPSERT",
        userId: newMemberUserId,
        projectRole: newMemberRole,
      });

      if (!res.success) {
        toast.error(res.error.message);
        return;
      }

      toast.success(res.message ?? "Anggota ditambahkan.");
      setNewMemberUserId("");
      router.refresh();
    } finally {
      setMemberMutationLoading(false);
    }
  };

  const handleRoleChange = async (
    userId: string,
    role: "LEAD" | "MEMBER" | "VIEWER"
  ) => {
    setMemberMutationLoading(true);
    try {
      const res = await manageProjectMembersAction({
        projectId: project.id,
        operation: "UPSERT",
        userId,
        projectRole: role,
      });
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      toast.success(res.message ?? "Peran anggota diperbarui.");
      router.refresh();
    } finally {
      setMemberMutationLoading(false);
    }
  };

  const handleConfirmRemoveMember = async () => {
    if (!removeTarget) return;
    setMemberMutationLoading(true);
    try {
      const res = await manageProjectMembersAction({
        projectId: project.id,
        operation: "REMOVE",
        userId: removeTarget.userId,
      });
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      toast.success(res.message ?? "Anggota dikeluarkan.");
      setRemoveTarget(null);
      router.refresh();
    } finally {
      setMemberMutationLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* High-Contrast Project Hero Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div
          className="h-2 w-full"
          style={{
            background: `linear-gradient(90deg, ${project.colorHex}, ${project.colorHex}99)`,
          }}
        />
        <div className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/projects"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <ArrowLeft className="size-3.5" />
                <span>Projects</span>
              </Link>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: project.colorHex }}
                />
                <span>{project.code}</span>
              </span>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold",
                  statusMeta.badgeClass
                )}
              >
                <span
                  className={cn("size-1.5 rounded-full", statusMeta.dotClass)}
                />
                <span>{statusMeta.label}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/tasks/board?projectId=${project.id}`}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Columns3 className="size-3.5 text-blue-600 dark:text-blue-400" />
                <span>Kanban</span>
              </Link>

              {canUpdateProject ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditOpen(true)}
                  className="h-9 gap-1.5 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <Edit3 className="size-3.5" />
                  <span>Edit</span>
                </Button>
              ) : null}

              {canDeleteProject ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteProjectOpen(true)}
                  className="h-9 gap-1.5 rounded-xl border-rose-200 bg-rose-50/80 px-3 text-xs font-semibold text-rose-700 shadow-2xs hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300 dark:hover:bg-rose-500/25"
                >
                  <Trash2 className="size-3.5" />
                  <span>Hapus Proyek</span>
                </Button>
              ) : null}

              {canCreateTask && project.status !== "ARCHIVED" ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setCreateTaskOpen(true)}
                  className="h-9 gap-1.5 rounded-xl bg-blue-600 px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  <Plus className="size-3.5" />
                  <span>Task Baru</span>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="min-w-0 space-y-2.5">
            <h1 className="break-words text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              {project.name}
            </h1>
            {project.description ? (
              <p className="max-w-3xl break-words text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-300">
                {project.description}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
              <span className="inline-flex max-w-full min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 dark:border-slate-700 dark:bg-slate-800">
                <Avatar size="sm" className="size-5 shrink-0">
                  {project.owner.avatarUrl ? (
                    <AvatarImage
                      src={project.owner.avatarUrl}
                      alt={project.owner.fullName}
                    />
                  ) : null}
                  <AvatarFallback className="bg-blue-50 text-[9px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                    {getInitials(project.owner.fullName)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate font-bold text-slate-800 dark:text-slate-100">
                  {project.owner.fullName}
                </span>
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <Calendar className="size-3.5 text-slate-500 dark:text-slate-400" />
                <span>
                  {project.startDate
                    ? formatDisplayDateWib(project.startDate, "short")
                    : "—"}{" "}
                  →{" "}
                  {project.targetEndDate
                    ? formatDisplayDateWib(project.targetEndDate, "short")
                    : "—"}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* High-Contrast Pill Tabs */}
      <Tabs defaultValue="overview" className="space-y-5">
        <TabsList className="h-11 w-full justify-start gap-1.5 rounded-xl border border-slate-200/90 bg-white p-1 shadow-xs sm:w-fit dark:border-slate-800 dark:bg-slate-900">
          <TabsTrigger
            value="overview"
            className="group/tab flex-none rounded-lg px-4 text-xs font-bold text-slate-600 data-active:bg-blue-600 data-active:text-white data-active:shadow-xs dark:text-slate-300 dark:data-active:bg-blue-600 dark:data-active:text-white"
          >
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="tasks"
            className="group/tab flex-none rounded-lg px-4 text-xs font-bold text-slate-600 data-active:bg-blue-600 data-active:text-white data-active:shadow-xs dark:text-slate-300 dark:data-active:bg-blue-600 dark:data-active:text-white"
          >
            <span>Tasks</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10.5px] font-bold text-slate-700 tabular-nums group-data-active/tab:bg-white/20 group-data-active/tab:text-white dark:bg-slate-800 dark:text-slate-200">
              {project.totalTasks}
            </span>
          </TabsTrigger>
          <TabsTrigger
            value="members"
            className="group/tab flex-none rounded-lg px-4 text-xs font-bold text-slate-600 data-active:bg-blue-600 data-active:text-white data-active:shadow-xs dark:text-slate-300 dark:data-active:bg-blue-600 dark:data-active:text-white"
          >
            <span>Members</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-[10.5px] font-bold text-slate-700 tabular-nums group-data-active/tab:bg-white/20 group-data-active/tab:text-white dark:bg-slate-800 dark:text-slate-200">
              {project.members.length}
            </span>
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Overview */}
        <TabsContent value="overview" className="space-y-5">
          {/* 4 Bold Bento Stat Cards */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  Progress
                </span>
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-2 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-400">
                  <Gauge className="size-4" />
                </div>
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-2">
                <p className="font-mono text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-white">
                  {project.progressPct}%
                </p>
                <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 tabular-nums dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {project.doneTasks}/{nonCancelledCount}
                </span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${project.progressPct}%`,
                    backgroundColor: project.colorHex,
                  }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  Active Tasks
                </span>
                <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-2 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-400">
                  <Layers className="size-4" />
                </div>
              </div>
              <p className="mt-2 font-mono text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-white">
                {project.activeTasks}
              </p>
              <p className="mt-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                {project.totalTasks} total task
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  Overdue
                </span>
                <div
                  className={cn(
                    "rounded-xl border p-2",
                    project.overdueTasks > 0
                      ? "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-400"
                      : "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400"
                  )}
                >
                  {project.overdueTasks > 0 ? (
                    <AlertTriangle className="size-4" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}
                </div>
              </div>
              <p
                className={cn(
                  "mt-2 font-mono text-3xl font-extrabold tracking-tight tabular-nums",
                  project.overdueTasks > 0
                    ? "text-rose-600 dark:text-rose-400"
                    : "text-emerald-600 dark:text-emerald-400"
                )}
              >
                {project.overdueTasks}
              </p>
              <p className="mt-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                {project.overdueTasks > 0 ? "Perlu tindak lanjut" : "On track"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  Team
                </span>
                <div className="rounded-xl border border-violet-200 bg-violet-50 p-2 text-violet-600 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-400">
                  <Users className="size-4" />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="font-mono text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-white">
                  {project.members.length}
                </p>
                <AvatarGroup>
                  {project.members.slice(0, 3).map((m) => (
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
                  {project.members.length > 3 ? (
                    <AvatarGroupCount className="size-7 border border-slate-200 bg-slate-100 text-[10px] font-bold text-slate-700 ring-2 ring-white dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-900">
                      +{project.members.length - 3}
                    </AvatarGroupCount>
                  ) : null}
                </AvatarGroup>
              </div>
              <p className="mt-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
                Anggota terdaftar
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Segmented Status Breakdown */}
            <Card className="border-slate-200/90 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                  <span className="h-4 w-1 rounded-full bg-blue-600" />
                  <span>Status Breakdown</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Unified Segmented Bar */}
                <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  {TASK_STATUS_VALUES.map((st) => {
                    const count = project.statusBreakdown[st] ?? 0;
                    if (count === 0 || project.totalTasks === 0) return null;
                    const pct = (count / project.totalTasks) * 100;
                    return (
                      <div
                        key={st}
                        className={cn(
                          "h-full transition-all duration-300",
                          STATUS_BAR_COLORS[st]
                        )}
                        style={{ width: `${pct}%` }}
                        title={`${TASK_STATUS_META[st].label}: ${count}`}
                      />
                    );
                  })}
                </div>

                {/* High-Contrast Legend Grid */}
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {TASK_STATUS_VALUES.map((st) => {
                    const count = project.statusBreakdown[st] ?? 0;
                    const pct =
                      project.totalTasks > 0
                        ? Math.round((count / project.totalTasks) * 100)
                        : 0;
                    const meta = TASK_STATUS_META[st];
                    return (
                      <div
                        key={st}
                        className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50 px-3 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/50"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              "size-2.5 rounded-full",
                              STATUS_BAR_COLORS[st]
                            )}
                          />
                          <span className="font-bold text-slate-800 dark:text-slate-100">
                            {meta.label}
                          </span>
                        </div>
                        <span className="font-mono font-bold text-slate-700 tabular-nums dark:text-slate-200">
                          {count}{" "}
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            ({pct}%)
                          </span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Overdue Tasks Queue */}
            <Card className="border-slate-200/90 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-base font-bold text-slate-900 dark:text-white">
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-1 rounded-full bg-rose-500" />
                    <span>Overdue Queue</span>
                  </span>
                  {project.overdueTaskList.length > 0 ? (
                    <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-0.5 font-mono text-xs font-bold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300">
                      {project.overdueTaskList.length}
                    </span>
                  ) : null}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {project.overdueTaskList.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50/70 py-10 text-center dark:border-slate-700 dark:bg-slate-800/30">
                    <CheckCircle2 className="mb-2 size-6 text-emerald-500" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                      Semua task tepat waktu
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {project.overdueTaskList.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => openDrawer("TASK_DETAIL", task.id)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 text-left transition-all hover:border-rose-400 hover:bg-rose-50/60 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:border-rose-500/50"
                      >
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded-md border border-rose-200 bg-rose-50 px-2 py-0.5 font-mono text-[11px] font-bold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300">
                              {task.taskCode}
                            </span>
                            <PriorityBadge priority={task.priority} />
                          </div>
                          <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                            {task.title}
                          </p>
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            {task.assignee?.fullName ?? "Unassigned"} ·{" "}
                            {formatDisplayDateWib(task.dueDate, "datetime")}
                          </p>
                        </div>
                        <StatusBadge domain="task" value={task.status} />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Daftar Task */}
        <TabsContent value="tasks">
          <DataTable
            columns={taskColumns}
            data={project.tasks}
            searchPlaceholder="Cari task..."
            pagination={{ pageSize: 12 }}
            onRowClick={(row) => openDrawer("TASK_DETAIL", row.id)}
            emptyState={
              <EmptyState
                icon={FolderKanban}
                title="Belum ada task"
                description="Tambahkan task pertama untuk proyek ini."
                action={
                  canCreateTask && project.status !== "ARCHIVED" ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setCreateTaskOpen(true)}
                      className="bg-blue-600 font-semibold text-white hover:bg-blue-700"
                    >
                      <Plus className="size-3.5" />
                      <span>Task Baru</span>
                    </Button>
                  ) : undefined
                }
                className="border-0 py-8"
              />
            }
          />
        </TabsContent>

        {/* Tab 3: Anggota Proyek */}
        <TabsContent value="members" className="space-y-4">
          {canUpdateProject ? (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-3 flex items-center gap-2 text-xs font-bold tracking-wide text-slate-800 uppercase dark:text-slate-200">
                <UserPlus className="size-4 text-blue-600 dark:text-blue-400" />
                <span>Tambah Anggota</span>
              </div>
              {availableUsersToAdd.length === 0 ? (
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Semua anggota aktif sudah bergabung.
                </p>
              ) : (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <Select
                    value={newMemberUserId || "NONE"}
                    onValueChange={(val) =>
                      setNewMemberUserId(val && val !== "NONE" ? val : "")
                    }
                  >
                    <SelectTrigger className="h-9 w-full min-w-0 overflow-hidden rounded-xl border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate sm:w-72 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <SelectValue className="block min-w-0 truncate">
                        {(val: string | null) => {
                          const label = (() => {
                            if (!val || val === "NONE") {
                              return "Pilih anggota...";
                            }
                            const found = availableUsersToAdd.find(
                              (u) => u.id === val
                            );
                            return found
                              ? `${found.fullName}${found.jobTitle ? ` · ${found.jobTitle}` : ""}`
                              : "Pilih anggota...";
                          })();
                          return <span className="block truncate">{label}</span>;
                        }}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Pilih anggota...</SelectItem>
                      {availableUsersToAdd.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          <span className="truncate">
                            {user.fullName}{user.jobTitle ? ` · ${user.jobTitle}` : ""}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={newMemberRole}
                    items={PROJECT_ROLE_LABELS}
                    onValueChange={(val) => {
                      if (
                        val === "LEAD" ||
                        val === "MEMBER" ||
                        val === "VIEWER"
                      ) {
                        setNewMemberRole(val);
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 w-full min-w-0 overflow-hidden rounded-xl border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate sm:w-36 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <SelectValue className="block min-w-0 truncate">
                        {(val: string | null) => (
                          <span className="block truncate">
                            {val && val in PROJECT_ROLE_LABELS
                              ? PROJECT_ROLE_LABELS[
                                  val as keyof typeof PROJECT_ROLE_LABELS
                                ]
                              : "Peran"}
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LEAD">Lead</SelectItem>
                      <SelectItem value="MEMBER">Member</SelectItem>
                      <SelectItem value="VIEWER">Viewer</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void handleAddMember()}
                    disabled={!newMemberUserId || memberMutationLoading}
                    className="h-9 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    {memberMutationLoading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Plus className="size-3.5" />
                    )}
                    <span>Tambah</span>
                  </Button>
                </div>
              )}
            </div>
          ) : null}

          <Card className="border-slate-200/90 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <span className="h-4 w-1 rounded-full bg-blue-600" />
                <span>Anggota ({project.members.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {project.members.map((member) => {
                  const isOwner =
                    member.userId === project.ownerId ||
                    member.projectRole === "OWNER";
                  return (
                    <div
                      key={member.id}
                      className="flex flex-col justify-between gap-3 py-3.5 sm:flex-row sm:items-center"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar className="size-9 shrink-0 border border-slate-200 dark:border-slate-700">
                          {member.avatarUrl ? (
                            <AvatarImage
                              src={member.avatarUrl}
                              alt={member.fullName}
                            />
                          ) : null}
                          <AvatarFallback className="bg-blue-50 text-xs font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                            {getInitials(member.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                              {member.fullName}
                            </p>
                            <Badge
                              variant="secondary"
                              className="border border-slate-200 bg-slate-100 text-[10.5px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                            >
                              {SYSTEM_ROLE_LABELS[member.roleCode] ?? member.roleCode}
                            </Badge>
                          </div>
                          <p className="truncate text-xs font-medium text-slate-600 dark:text-slate-400">
                            {member.jobTitle} · {member.department}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-2">
                        {isOwner ? (
                          <Badge className="bg-blue-600 font-mono text-[11px] font-bold text-white">
                            OWNER
                          </Badge>
                        ) : canUpdateProject ? (
                          <>
                            <Select
                              value={member.projectRole}
                              items={PROJECT_ROLE_LABELS}
                              disabled={memberMutationLoading}
                              onValueChange={(val) => {
                                if (
                                  val === "LEAD" ||
                                  val === "MEMBER" ||
                                  val === "VIEWER"
                                ) {
                                  void handleRoleChange(member.userId, val);
                                }
                              }}
                            >
                              <SelectTrigger className="h-8.5 w-28 min-w-0 overflow-hidden rounded-lg border-slate-200 bg-slate-50 text-xs font-semibold *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate dark:border-slate-700 dark:bg-slate-800">
                                <SelectValue className="block min-w-0 truncate">
                                  {(val: string | null) => (
                                    <span className="block truncate">
                                      {val && val in PROJECT_ROLE_LABELS
                                        ? PROJECT_ROLE_LABELS[
                                            val as keyof typeof PROJECT_ROLE_LABELS
                                          ]
                                        : "Member"}
                                    </span>
                                  )}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="LEAD">Lead</SelectItem>
                                <SelectItem value="MEMBER">Member</SelectItem>
                                <SelectItem value="VIEWER">Viewer</SelectItem>
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Keluarkan ${member.fullName}`}
                              onClick={() => setRemoveTarget(member)}
                              className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:text-rose-400 dark:hover:bg-rose-500/15"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                          >
                            {PROJECT_ROLE_LABELS[member.projectRole as keyof typeof PROJECT_ROLE_LABELS] ?? member.projectRole}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {canUpdateProject ? (
        <ProjectFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          mode="edit"
          project={project}
          canDelete={canDeleteProject}
          onDeleted={() => {
            router.push("/projects");
            router.refresh();
          }}
        />
      ) : null}

      {canCreateTask || canEditTask ? (
        <TaskCreateDialog
          open={createTaskOpen || Boolean(editingTask)}
          onOpenChange={(open) => {
            if (!open) {
              setCreateTaskOpen(false);
              setEditingTask(null);
            }
          }}
          projects={[
            {
              id: project.id,
              code: project.code,
              name: project.name,
              colorHex: project.colorHex,
              status: project.status,
              ownerId: project.ownerId,
            },
          ]}
          assignees={assignableUsers}
          currentUserId={currentUserId}
          canAssignOthers={canAssignTask}
          defaultProjectId={project.id}
          editTask={editingTask}
          onUpdated={() => router.refresh()}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(removeTarget)}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null);
        }}
        title="Keluarkan Anggota?"
        description={`${removeTarget?.fullName ?? "Anggota"} akan dihapus dari ${project.code}.`}
        confirmLabel="Keluarkan"
        variant="destructive"
        isLoading={memberMutationLoading}
        onConfirm={handleConfirmRemoveMember}
      />

      <ConfirmDialog
        open={deleteProjectOpen}
        onOpenChange={setDeleteProjectOpen}
        title={`Hapus Proyek ${project.code}?`}
        description={`Proyek "${project.name}" akan dihapus. Semua task di proyek ini tidak akan terhapus dan akan berubah menjadi task mandiri "Tanpa Proyek (Umum)".`}
        confirmLabel="Ya, Hapus Proyek"
        variant="destructive"
        isLoading={deletingProject}
        onConfirm={handleConfirmDeleteProject}
      />

      <ConfirmDialog
        open={Boolean(deletingTask)}
        onOpenChange={(open) => {
          if (!open) setDeletingTask(null);
        }}
        title={`Hapus Task ${deletingTask?.taskCode ?? ""}?`}
        description={`Task "${deletingTask?.title ?? ""}" akan dihapus dari tampilan aktif.`}
        confirmLabel="Hapus Task"
        variant="destructive"
        isLoading={deletingTaskLoading}
        onConfirm={handleConfirmDeleteTask}
      />
    </div>
  );
}
