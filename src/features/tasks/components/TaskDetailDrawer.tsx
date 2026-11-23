"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  CheckSquare,
  Download,
  ExternalLink,
  Link2,
  Loader2,
  MessageSquare,
  Paperclip,
  Pencil,
  Plus,
  Send,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  FileUploadDropzone,
  type FileDropzonePayload,
} from "@/components/shared/FileUploadDropzone";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  addTaskAttachmentAction,
  addTaskChecklistItemAction,
  addTaskCommentAction,
  deleteTaskChecklistItemAction,
  moveKanbanTaskAction,
  softDeleteTaskAction,
  toggleTaskChecklistAction,
  updateTaskAction,
} from "@/features/tasks/actions/task.actions";
import { getInitials } from "@/features/tasks/components/ProjectCard";
import { TaskCreateDialog } from "@/features/tasks/components/TaskCreateDialog";
import type { TaskDetailApiResponse } from "@/features/tasks/types";
import {
  formatDisplayDateWib,
  toDateInputValueWib,
} from "@/features/tasks/utils/date-wib";
import {
  TASK_PRIORITY_META,
  TASK_PRIORITY_VALUES,
  TASK_STATUS_META,
  TASK_STATUS_VALUES,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/constants/enums";
import { cn } from "@/lib/utils";

const STATUS_DOT: Record<TaskStatus, string> = {
  BACKLOG: "bg-slate-400",
  TODO: "bg-indigo-500",
  IN_PROGRESS: "bg-blue-600",
  IN_REVIEW: "bg-amber-500",
  REVISION: "bg-rose-500",
  DONE: "bg-emerald-500",
  CANCELLED: "bg-neutral-400",
};

export interface TaskDetailContentProps {
  taskId: string;
  onDeleted?: () => void;
}

export function TaskDetailContent({
  taskId,
  onDeleted,
}: TaskDetailContentProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const detailQuery = useQuery<TaskDetailApiResponse>({
    queryKey: ["slide-over-detail", "TASK_DETAIL", taskId],
    enabled: Boolean(taskId),
    staleTime: 10_000,
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}`, { cache: "no-cache" });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? "Gagal memuat detail task.");
      }
      return (await res.json()) as TaskDetailApiResponse;
    },
  });

  const [newChecklistTitle, setNewChecklistTitle] = useState("");
  const [commentBody, setCommentBody] = useState("");
  const [showUploadDropzone, setShowUploadDropzone] = useState(false);
  const [dueDateDraft, setDueDateDraft] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [revisionDialogOpen, setRevisionDialogOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState("");

  const task = detailQuery.data?.task;
  const permissions = detailQuery.data?.permissions;
  const dueDateEdit =
    dueDateDraft ?? (task ? toDateInputValueWib(task.dueDate) : "");

  const invalidateTaskQueries = () => {
    void queryClient.invalidateQueries({
      queryKey: ["slide-over-detail", "TASK_DETAIL", taskId],
    });
    void queryClient.invalidateQueries({ queryKey: ["kanban-board"] });
    void queryClient.invalidateQueries({ queryKey: ["tasks"] });
    router.refresh();
  };

  const handleStatusChange = async (targetStatus: TaskStatus) => {
    if (!task || targetStatus === task.status) return;
    if (targetStatus === "REVISION") {
      setRevisionNotes("");
      setRevisionDialogOpen(true);
      return;
    }
    setIsBusy(true);
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
      toast.success(res.message ?? "Status diperbarui.");
      invalidateTaskQueries();
    } finally {
      setIsBusy(false);
    }
  };

  const handleConfirmRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    if (revisionNotes.trim().length < 10) {
      toast.error("Catatan revisi minimal 10 karakter.");
      return;
    }
    setIsBusy(true);
    try {
      const res = await moveKanbanTaskAction({
        taskId: task.id,
        targetStatus: "REVISION",
        expectedVersion: task.version,
        revisionNotes: revisionNotes.trim(),
      });
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      toast.success(res.message ?? "Task dikembalikan ke Revision.");
      setRevisionDialogOpen(false);
      invalidateTaskQueries();
    } finally {
      setIsBusy(false);
    }
  };

  const handlePriorityChange = async (nextPriority: TaskPriority) => {
    if (!task || nextPriority === task.priority) return;
    setIsBusy(true);
    try {
      const res = await updateTaskAction({
        taskId: task.id,
        priority: nextPriority,
        expectedVersion: task.version,
      });
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      toast.success("Prioritas diperbarui.");
      invalidateTaskQueries();
    } finally {
      setIsBusy(false);
    }
  };

  const handleDueDateUpdate = async () => {
    if (!task) return;
    setIsBusy(true);
    try {
      const res = await updateTaskAction({
        taskId: task.id,
        dueDate: dueDateEdit || null,
        expectedVersion: task.version,
      });
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      toast.success("Tenggat diperbarui.");
      setDueDateDraft(null);
      invalidateTaskQueries();
    } finally {
      setIsBusy(false);
    }
  };

  const handleToggleChecklist = async (
    checklistId: string,
    isCompleted: boolean
  ) => {
    const res = await toggleTaskChecklistAction({ checklistId, isCompleted });
    if (!res.success) {
      toast.error(res.error.message);
      return;
    }
    invalidateTaskQueries();
  };

  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || newChecklistTitle.trim().length < 2) {
      toast.error("Minimal 2 karakter.");
      return;
    }
    setIsBusy(true);
    try {
      const res = await addTaskChecklistItemAction({
        taskId: task.id,
        title: newChecklistTitle.trim(),
      });
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      setNewChecklistTitle("");
      toast.success("Checklist ditambahkan.");
      invalidateTaskQueries();
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteChecklist = async (checklistId: string) => {
    const res = await deleteTaskChecklistItemAction({ checklistId });
    if (!res.success) {
      toast.error(res.error.message);
      return;
    }
    invalidateTaskQueries();
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task || !commentBody.trim()) return;
    setIsBusy(true);
    try {
      const res = await addTaskCommentAction({
        taskId: task.id,
        body: commentBody.trim(),
      });
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      setCommentBody("");
      toast.success("Komentar terkirim.");
      invalidateTaskQueries();
    } finally {
      setIsBusy(false);
    }
  };

  const handleUploadComplete = async (payload: FileDropzonePayload) => {
    if (!task) return;
    const res = await addTaskAttachmentAction({
      taskId: task.id,
      sourceType: payload.sourceType,
      fileName: payload.fileName,
      fileUrl: payload.sourceType === "UPLOAD" ? null : payload.fileUrl,
      storageKey: payload.sourceType === "UPLOAD" ? payload.storageKey : null,
      mimeType: payload.mimeType,
      fileSizeBytes: payload.fileSizeBytes,
    });
    if (!res.success) {
      toast.error(res.error.message);
      return;
    }
    toast.success("Lampiran ditambahkan.");
    setShowUploadDropzone(false);
    invalidateTaskQueries();
  };

  const handleDownloadAttachment = async (storageKey: string) => {
    const res = await fetch(
      `/api/uploads/download-url?storageKey=${encodeURIComponent(
        storageKey
      )}&download=1`,
      { cache: "no-cache" }
    );
    const body = (await res.json().catch(() => ({}))) as {
      downloadUrl?: string;
      error?: string;
    };
    if (!res.ok || !body.downloadUrl) {
      toast.error(body.error ?? "Gagal mengunduh file.");
      return;
    }
    window.open(body.downloadUrl, "_blank", "noopener,noreferrer");
  };

  const handleDeleteTask = async () => {
    if (!task) return;
    setIsBusy(true);
    try {
      const res = await softDeleteTaskAction({ taskId: task.id });
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      toast.success(res.message ?? "Task dihapus.");
      setDeleteDialogOpen(false);
      invalidateTaskQueries();
      onDeleted?.();
    } finally {
      setIsBusy(false);
    }
  };

  if (detailQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3 rounded-xl" />
        <Skeleton className="h-28 w-full rounded-2xl" />
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  if (detailQuery.isError || !task || !permissions) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300">
        {detailQuery.error instanceof Error
          ? detailQuery.error.message
          : "Detail task tidak tersedia."}
      </div>
    );
  }

  const checklistPct =
    task.checklistTotal > 0
      ? Math.round((task.checklistCompleted / task.checklistTotal) * 100)
      : 0;
  const isChecklistComplete =
    task.checklistTotal > 0 && task.checklistCompleted === task.checklistTotal;

  return (
    <div className="space-y-5 text-sm">
      {/* High-Contrast Header Card */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {task.taskCode}
            </span>
            {task.project ? (
              <Link
                href={`/projects/${task.project.id}`}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-bold text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <span
                  className="size-2 rounded-full"
                  style={{ backgroundColor: task.project.colorHex }}
                />
                <span>{task.project.code}</span>
              </Link>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <span className="size-2 rounded-full bg-slate-400" />
                <span>Tanpa Proyek (Umum)</span>
              </span>
            )}
            <StatusBadge domain="taskType" value={task.taskType} />
            {task.revisionCount > 0 ? (
              <Badge
                variant="outline"
                className="border-rose-200 bg-rose-50 font-mono text-[11px] font-bold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300"
              >
                Rev {task.revisionCount}x
              </Badge>
            ) : null}
          </div>

          <div className="flex items-center gap-1">
            {permissions.canEdit ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setEditDialogOpen(true)}
                className="text-slate-500 hover:bg-blue-50 hover:text-blue-600 dark:text-slate-400 dark:hover:bg-blue-500/15 dark:hover:text-blue-400"
                aria-label="Edit task"
              >
                <Pencil className="size-4" />
              </Button>
            ) : null}
            {permissions.canDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-rose-500/15 dark:hover:text-rose-400"
                aria-label="Hapus task"
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </div>
        </div>

        <h3 className="mt-3 break-words text-lg leading-snug font-extrabold tracking-tight text-slate-900 dark:text-white">
          {task.title}
        </h3>
      </div>

      {/* Clean Tab Bar */}
      <Tabs defaultValue="detail" className="space-y-4">
        <TabsList className="grid h-10 w-full grid-cols-3 rounded-xl border border-slate-200 bg-white p-1 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          <TabsTrigger
            value="detail"
            className="group/tab rounded-lg text-xs font-bold text-slate-600 data-active:bg-blue-600 data-active:text-white data-active:shadow-xs dark:text-slate-300 dark:data-active:bg-blue-600 dark:data-active:text-white"
          >
            Detail
          </TabsTrigger>
          <TabsTrigger
            value="checklist"
            className="group/tab rounded-lg text-xs font-bold text-slate-600 data-active:bg-blue-600 data-active:text-white data-active:shadow-xs dark:text-slate-300 dark:data-active:bg-blue-600 dark:data-active:text-white"
          >
            <span>Checklist</span>
            {task.checklistTotal > 0 ? (
              <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 group-data-active/tab:bg-white/20 group-data-active/tab:text-white dark:bg-slate-800 dark:text-slate-200">
                {task.checklistCompleted}/{task.checklistTotal}
              </span>
            ) : null}
          </TabsTrigger>
          <TabsTrigger
            value="discussion"
            className="group/tab rounded-lg text-xs font-bold text-slate-600 data-active:bg-blue-600 data-active:text-white data-active:shadow-xs dark:text-slate-300 dark:data-active:bg-blue-600 dark:data-active:text-white"
          >
            <span>Diskusi</span>
            {task.comments.length > 0 ? (
              <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 group-data-active/tab:bg-white/20 group-data-active/tab:text-white dark:bg-slate-800 dark:text-slate-200">
                {task.comments.length}
              </span>
            ) : null}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Detail, Property Grid, Attachments */}
        <TabsContent value="detail" className="space-y-4">
          {task.description ? (
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
              <p className="mb-1.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Deskripsi
              </p>
              <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed font-medium text-slate-700 dark:text-slate-200">
                {task.description}
              </p>
            </div>
          ) : null}

          {/* Linked Cross-Module References */}
          {(task.linkedContentItem || task.linkedDesignBrief) && (
            <div className="space-y-2 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-500/30 dark:bg-indigo-500/10">
              <p className="text-[11px] font-bold tracking-wider text-indigo-700 uppercase dark:text-indigo-300">
                Terkait Modul Lain
              </p>
              {task.linkedContentItem ? (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-indigo-200/70 bg-white px-3 py-2.5 text-xs shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900 dark:text-white">
                      {task.linkedContentItem.title}
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      {task.linkedContentItem.platform} ·{" "}
                      {task.linkedContentItem.contentFormat}
                    </p>
                  </div>
                  <Link
                    href={`/content/planner?contentId=${task.linkedContentItem.id}`}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300"
                  >
                    <span>Content</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
              ) : null}
              {task.linkedDesignBrief ? (
                <div className="flex items-center justify-between gap-2 rounded-xl border border-indigo-200/70 bg-white px-3 py-2.5 text-xs shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-slate-900 dark:text-white">
                      {task.linkedDesignBrief.title}
                    </p>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                      v{task.linkedDesignBrief.currentVersion} · Rev{" "}
                      {task.linkedDesignBrief.revisionCount}x
                    </p>
                  </div>
                  <Link
                    href={`/design/workspace?briefId=${task.linkedDesignBrief.id}`}
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300"
                  >
                    <span>Design</span>
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
              ) : null}
            </div>
          )}

          {/* Crisp Property Grid */}
          <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-900">
            <div className="min-w-0 space-y-1.5 rounded-xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/50">
              <Label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Status
              </Label>
              <Select
                value={task.status}
                disabled={isBusy}
                onValueChange={(val) => {
                  if (val) void handleStatusChange(val as TaskStatus);
                }}
              >
                <SelectTrigger className="h-8.5 w-full min-w-0 overflow-hidden rounded-lg border-slate-200 bg-white text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                  <SelectValue className="min-w-0 truncate">
                    {(val: string | null) =>
                      val && val in TASK_STATUS_META ? (
                        <span className="inline-flex min-w-0 items-center gap-2">
                          <span
                            className={cn(
                              "size-2 shrink-0 rounded-full",
                              STATUS_DOT[val as TaskStatus]
                            )}
                          />
                          <span className="truncate">
                            {TASK_STATUS_META[val as TaskStatus].label}
                          </span>
                        </span>
                      ) : (
                        <span className="truncate">Status</span>
                      )
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {TASK_STATUS_VALUES.map((st) => (
                    <SelectItem key={st} value={st}>
                      <span className="inline-flex items-center gap-2">
                        <span
                          className={cn("size-2 rounded-full", STATUS_DOT[st])}
                        />
                        <span>{TASK_STATUS_META[st].label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-0 space-y-1.5 rounded-xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/50">
              <Label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Prioritas
              </Label>
              {permissions.canEdit ? (
                <Select
                  value={task.priority}
                  disabled={isBusy}
                  onValueChange={(val) => {
                    if (val) void handlePriorityChange(val as TaskPriority);
                  }}
                >
                  <SelectTrigger className="h-8.5 w-full min-w-0 overflow-hidden rounded-lg border-slate-200 bg-white text-xs font-semibold text-slate-900 *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate dark:border-slate-700 dark:bg-slate-900 dark:text-white">
                    <SelectValue className="block min-w-0 truncate">
                      {(val: string | null) => (
                        <span className="block truncate">
                          {val && val in TASK_PRIORITY_META
                            ? TASK_PRIORITY_META[val as TaskPriority].label
                            : "Prioritas"}
                        </span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_PRIORITY_VALUES.map((pr) => (
                      <SelectItem key={pr} value={pr}>
                        {TASK_PRIORITY_META[pr].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="pt-1">
                  <PriorityBadge priority={task.priority} />
                </div>
              )}
            </div>

            <div className="min-w-0 space-y-1.5 rounded-xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/50">
              <Label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Assignee
              </Label>
              {task.assignee ? (
                <div className="flex h-8.5 min-w-0 items-center gap-2">
                  <Avatar
                    size="sm"
                    className="size-6.5 shrink-0 border border-slate-200 dark:border-slate-700"
                  >
                    {task.assignee.avatarUrl ? (
                      <AvatarImage
                        src={task.assignee.avatarUrl}
                        alt={task.assignee.fullName}
                      />
                    ) : null}
                    <AvatarFallback className="bg-blue-50 text-[10px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                      {getInitials(task.assignee.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="truncate text-xs font-bold text-slate-900 dark:text-white">
                    {task.assignee.fullName}
                  </span>
                </div>
              ) : (
                <div className="flex h-8.5 items-center text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Unassigned
                </div>
              )}
            </div>

            <div className="min-w-0 space-y-1.5 rounded-xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/50">
              <Label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Tenggat
              </Label>
              {permissions.canEditDueDate ? (
                <div className="flex min-w-0 items-center gap-1.5">
                  <Input
                    type="date"
                    value={dueDateEdit}
                    onChange={(e) => setDueDateDraft(e.target.value)}
                    className="h-8.5 min-w-0 flex-1 rounded-lg border-slate-200 bg-white text-xs font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    disabled={isBusy}
                    onClick={() => void handleDueDateUpdate()}
                    className="h-8.5 shrink-0 rounded-lg border-slate-200 bg-white px-2.5 font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    Simpan
                  </Button>
                </div>
              ) : (
                <div className="flex h-8.5 min-w-0 items-center gap-1.5 text-xs">
                  {task.deadlineHealth === "OVERDUE" ? (
                    <AlertTriangle className="size-3.5 shrink-0 text-rose-600" />
                  ) : (
                    <Calendar className="size-3.5 shrink-0 text-slate-500 dark:text-slate-400" />
                  )}
                  <span
                    className={cn(
                      "truncate font-semibold",
                      task.deadlineHealth === "OVERDUE"
                        ? "font-bold text-rose-600 dark:text-rose-400"
                        : "text-slate-800 dark:text-slate-200"
                    )}
                  >
                    {formatDisplayDateWib(task.dueDate, "datetime")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Attachments Card */}
          <div className="space-y-3 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="size-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-xs font-bold tracking-wide text-slate-900 uppercase dark:text-white">
                  Lampiran
                </h4>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10.5px] font-bold text-slate-700 tabular-nums dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {task.attachments.length}/5
                </span>
              </div>
              {permissions.canEdit && task.attachments.length < 5 ? (
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => setShowUploadDropzone((prev) => !prev)}
                  className="rounded-lg border-slate-200 bg-slate-50 font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {showUploadDropzone ? "Tutup" : "+ Lampirkan"}
                </Button>
              ) : null}
            </div>

            {showUploadDropzone ? (
              <FileUploadDropzone
                bucketFolder="task-attachments"
                onComplete={(payload) => void handleUploadComplete(payload)}
              />
            ) : null}

            {task.attachments.length === 0 ? (
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Belum ada lampiran.
              </p>
            ) : (
              <div className="space-y-2">
                {task.attachments.map((att) => (
                  <div
                    key={att.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3 py-2.5 text-xs transition-colors hover:border-blue-300 hover:bg-blue-50/40 dark:border-slate-800 dark:bg-slate-800/50"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-400">
                        {att.sourceType === "UPLOAD" ? (
                          <Paperclip className="size-3.5" />
                        ) : (
                          <Link2 className="size-3.5" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-bold text-slate-900 dark:text-white">
                          {att.fileName}
                        </p>
                        <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {att.sourceType} · {att.uploaderName}
                        </p>
                      </div>
                    </div>

                    {att.storageKey ? (
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() => void handleDownloadAttachment(att.storageKey!)}
                        className="rounded-lg border-slate-200 bg-white font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        <Download className="size-3.5" />
                      </Button>
                    ) : (
                      <a
                        href={att.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-blue-600 hover:border-blue-400 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-900 dark:text-blue-400"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Progress-Tracked Checklist */}
        <TabsContent value="checklist" className="space-y-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="size-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-xs font-bold tracking-wide text-slate-900 uppercase dark:text-white">
                  Progres Checklist
                </h4>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10.5px] font-bold text-slate-700 tabular-nums dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {task.checklistCompleted}/{task.checklistTotal}
                </span>
              </div>
              {task.checklistTotal > 0 ? (
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 font-mono text-xs font-bold tabular-nums",
                    isChecklistComplete
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
                      : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300"
                  )}
                >
                  {checklistPct}%
                </span>
              ) : null}
            </div>

            {task.checklistTotal > 0 ? (
              <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300 ease-out",
                    isChecklistComplete ? "bg-emerald-500" : "bg-blue-600"
                  )}
                  style={{ width: `${checklistPct}%` }}
                />
              </div>
            ) : null}
          </div>

          {task.checklists.length > 0 ? (
            <div className="space-y-2">
              {task.checklists.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "group flex items-center justify-between gap-2 rounded-xl border px-3.5 py-2.5 transition-all",
                    item.isCompleted
                      ? "border-slate-200/80 bg-slate-200/50 dark:border-slate-800 dark:bg-slate-800/40"
                      : "border-slate-200 bg-white shadow-2xs hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900"
                  )}
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-xs">
                    <Checkbox
                      checked={item.isCompleted}
                      disabled={!permissions.canToggleChecklist}
                      onCheckedChange={(checked) =>
                        void handleToggleChecklist(item.id, Boolean(checked))
                      }
                    />
                    <span
                      className={cn(
                        "truncate transition-all duration-200",
                        item.isCompleted
                          ? "font-medium text-slate-500 line-through decoration-slate-400 dark:text-slate-400"
                          : "font-semibold text-slate-900 dark:text-white"
                      )}
                    >
                      {item.title}
                    </span>
                  </label>

                  <div className="flex items-center gap-1.5">
                    {item.isCompleted ? (
                      <CheckCircle2 className="size-3.5 text-emerald-500" />
                    ) : null}
                    {permissions.canToggleChecklist ? (
                      <button
                        type="button"
                        onClick={() => void handleDeleteChecklist(item.id)}
                        className="text-slate-400 opacity-0 transition-opacity hover:text-rose-600 focus-visible:opacity-100 group-hover:opacity-100"
                        aria-label={`Hapus ${item.title}`}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 py-8 text-center text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
              Belum ada item checklist.
            </div>
          )}

          {permissions.canToggleChecklist ? (
            <form onSubmit={handleAddChecklist} className="flex gap-2">
              <Input
                value={newChecklistTitle}
                onChange={(e) => setNewChecklistTitle(e.target.value)}
                placeholder="Tambah item checklist..."
                className="h-9 rounded-xl border-slate-200 bg-white text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
              <Button
                type="submit"
                size="sm"
                disabled={isBusy || newChecklistTitle.trim().length < 2}
                aria-label="Tambah item checklist"
                className="h-9 rounded-xl bg-blue-600 px-3.5 text-xs font-semibold text-white hover:bg-blue-700"
              >
                <Plus className="size-3.5" />
                <span>Tambah</span>
              </Button>
            </form>
          ) : null}
        </TabsContent>

        {/* Tab 3: Distinct Chat Bubbles & Comments */}
        <TabsContent value="discussion" className="space-y-4">
          <div className="space-y-3">
            {task.comments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 py-10 text-center text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                <MessageSquare className="mx-auto mb-2 size-5 text-slate-400" />
                <p>Belum ada komentar.</p>
              </div>
            ) : (
              task.comments.map((comment, idx) => (
                <div key={comment.id} className="flex gap-2.5">
                  <Avatar
                    size="sm"
                    className="mt-1 size-7 shrink-0 border border-slate-200 dark:border-slate-700"
                  >
                    {comment.author.avatarUrl ? (
                      <AvatarImage
                        src={comment.author.avatarUrl}
                        alt={comment.author.fullName}
                      />
                    ) : null}
                    <AvatarFallback className="bg-blue-50 text-[10px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                      {getInitials(comment.author.fullName)}
                    </AvatarFallback>
                  </Avatar>

                  <div
                    className={cn(
                      "min-w-0 flex-1 rounded-2xl rounded-tl-sm border p-3.5 text-xs shadow-2xs",
                      idx % 2 === 0
                        ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                        : "border-blue-200/80 bg-blue-50/70 dark:border-blue-500/30 dark:bg-blue-950/30"
                    )}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">
                        {comment.author.fullName}
                      </span>
                      <span className="font-mono text-[10.5px] font-medium text-slate-500 dark:text-slate-400">
                        {formatDisplayDateWib(comment.createdAt, "datetime")}
                        {comment.isEdited ? " (edited)" : ""}
                      </span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap break-words leading-relaxed font-medium text-slate-700 dark:text-slate-200">
                      {comment.body}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {permissions.canComment ? (
            <form
              onSubmit={handleAddComment}
              className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-800 dark:bg-slate-900"
            >
              <Textarea
                value={commentBody}
                onChange={(e) => setCommentBody(e.target.value)}
                placeholder="Tulis komentar (@nama untuk mention)..."
                rows={2}
                className="rounded-xl border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus-visible:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isBusy || !commentBody.trim()}
                  className="h-8.5 gap-1.5 rounded-xl bg-blue-600 px-3.5 text-xs font-semibold text-white hover:bg-blue-700"
                >
                  {isBusy ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Send className="size-3.5" />
                  )}
                  <span>Kirim</span>
                </Button>
              </div>
            </form>
          ) : null}
        </TabsContent>
      </Tabs>

      {/* Revision Notes Dialog */}
      <Dialog open={revisionDialogOpen} onOpenChange={setRevisionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Catatan Revisi
            </DialogTitle>
            <DialogDescription className="text-xs font-medium">
              Wajib isi minimal 10 karakter sebelum memindahkan ke Revision.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleConfirmRevision} className="space-y-4">
            <Textarea
              value={revisionNotes}
              onChange={(e) => setRevisionNotes(e.target.value)}
              placeholder="Poin yang perlu diperbaiki..."
              rows={3}
              required
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setRevisionDialogOpen(false)}
              >
                Batal
              </Button>
              <Button type="submit" variant="destructive" disabled={isBusy}>
                Kirim ke Revision
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {permissions.canEdit ? (
        <TaskCreateDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          projects={detailQuery.data?.formOptions?.projects ?? []}
          assignees={detailQuery.data?.formOptions?.assignees ?? []}
          canAssignOthers={permissions.canAssign}
          editTask={task}
          onUpdated={() => invalidateTaskQueries()}
        />
      ) : null}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Hapus Task?"
        description={`Task ${task.taskCode} akan dihapus dari tampilan aktif.`}
        confirmLabel="Hapus"
        variant="destructive"
        isLoading={isBusy}
        onConfirm={handleDeleteTask}
      />
    </div>
  );
}

export interface TaskDetailDrawerProps {
  taskId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TaskDetailDrawer({
  taskId,
  open,
  onOpenChange,
}: TaskDetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 border-l border-slate-200 bg-slate-100 p-0 sm:max-w-[560px] dark:border-slate-800 dark:bg-slate-950"
      >
        <SheetHeader className="border-b border-slate-200 bg-white px-6 py-4 pr-12 dark:border-slate-800 dark:bg-slate-900">
          <SheetTitle className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
            Task Detail
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto p-6">
          {taskId ? (
            <TaskDetailContent
              taskId={taskId}
              onDeleted={() => onOpenChange(false)}
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
