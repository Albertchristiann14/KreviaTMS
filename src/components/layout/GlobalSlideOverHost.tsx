"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  CheckSquare,
  Download,
  ExternalLink,
  FileText,
  FolderKanban,
  Layers,
  Loader2,
  MessageSquare,
  Palette,
  Paperclip,
  Pencil,
  Plus,
  Send,
  Trash2,
  User as UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  addTaskChecklistItemAction,
  addTaskCommentAction,
  moveKanbanTaskAction,
  softDeleteTaskAction,
  toggleTaskChecklistAction,
} from "@/features/tasks/actions/task.actions";
import { getInitials } from "@/features/tasks/components/ProjectCard";
import { TaskCreateDialog } from "@/features/tasks/components/TaskCreateDialog";
import type {
  TaskAttachmentDto,
  TaskDetailApiResponse,
} from "@/features/tasks/types";
import {
  TASK_STATUS_META,
  TASK_STATUS_VALUES,
  type TaskStatus,
} from "@/lib/constants/enums";
import {
  useUIStore,
  type ActiveDrawerType,
} from "@/lib/stores/ui-store";
import { cn } from "@/lib/utils";

type DrawerTab = "detail" | "checklist" | "activity";

const PARAM_TO_DRAWER: Record<string, ActiveDrawerType> = {
  task: "TASK_DETAIL",
  content: "CONTENT_DETAIL",
  design: "DESIGN_REVIEW",
};

const DRAWER_TO_PARAM: Record<ActiveDrawerType, string> = {
  TASK_DETAIL: "task",
  CONTENT_DETAIL: "content",
  DESIGN_REVIEW: "design",
};

const DRAWER_META: Record<
  ActiveDrawerType,
  { title: string; subtitle: string; icon: typeof Layers }
> = {
  TASK_DETAIL: {
    title: "Task Detail",
    subtitle: "Status, checklist & discussion",
    icon: Layers,
  },
  CONTENT_DETAIL: {
    title: "Content Plan",
    subtitle: "Schedule & brief reference",
    icon: FileText,
  },
  DESIGN_REVIEW: {
    title: "Design Review",
    subtitle: "Submission & approval",
    icon: Palette,
  },
};

const STATUS_SELECT_LABELS: Record<string, string> = Object.fromEntries(
  TASK_STATUS_VALUES.map((status) => [
    status,
    TASK_STATUS_META[status].label,
  ])
);

function formatDateTime(iso: string | null): string {
  if (!iso) return "No due date";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatFileSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function GlobalSlideOverHost() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const activeDrawer = useUIStore((s) => s.activeDrawer);
  const openDrawer = useUIStore((s) => s.openDrawer);
  const closeDrawer = useUIStore((s) => s.closeDrawer);

  const lastUrlKeyRef = useRef<string | null>(null);

  const [tabState, setTabState] = useState<{
    key: string;
    tab: DrawerTab;
  }>({ key: "", tab: "detail" });

  const [statusOverride, setStatusOverride] = useState<{
    taskId: string;
    version: number;
    status: TaskStatus;
  } | null>(null);
  const [revisionNotes, setRevisionNotes] = useState("");
  const [checklistDraft, setChecklistDraft] = useState<{
    taskId: string;
    title: string;
  } | null>(null);
  const [commentBody, setCommentBody] = useState("");
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<
    string | null
  >(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Sync URL query params (?drawer=task&id=<uuid>) -> Zustand store when URL changes
  useEffect(() => {
    const drawerParam = searchParams.get("drawer");
    const idParam = searchParams.get("id");
    const urlKey = drawerParam && idParam ? `${drawerParam}:${idParam}` : null;

    if (urlKey !== lastUrlKeyRef.current) {
      lastUrlKeyRef.current = urlKey;
      if (drawerParam && idParam) {
        const mappedType = PARAM_TO_DRAWER[drawerParam];
        if (mappedType) {
          openDrawer(mappedType, idParam);
        }
      }
    }
  }, [searchParams, openDrawer]);

  // Keep URL query params aligned when store opens/closes
  useEffect(() => {
    const currentDrawer = searchParams.get("drawer");
    const currentId = searchParams.get("id");

    if (activeDrawer) {
      const targetParam = DRAWER_TO_PARAM[activeDrawer.type];
      if (currentDrawer !== targetParam || currentId !== activeDrawer.id) {
        const nextParams = new URLSearchParams(searchParams.toString());
        nextParams.set("drawer", targetParam);
        nextParams.set("id", activeDrawer.id);
        lastUrlKeyRef.current = `${targetParam}:${activeDrawer.id}`;
        router.replace(`${pathname}?${nextParams.toString()}`, {
          scroll: false,
        });
      }
    } else if (currentDrawer || currentId) {
      const nextParams = new URLSearchParams(searchParams.toString());
      nextParams.delete("drawer");
      nextParams.delete("id");
      const query = nextParams.toString();
      lastUrlKeyRef.current = null;
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      });
    }
  }, [activeDrawer, pathname, router, searchParams]);

  const taskDetailQueryKey = [
    "slide-over-detail",
    activeDrawer?.type,
    activeDrawer?.id,
  ] as const;

  const taskQuery = useQuery<TaskDetailApiResponse | null, Error>({
    queryKey: taskDetailQueryKey,
    enabled: Boolean(
      activeDrawer?.id && activeDrawer.type === "TASK_DETAIL"
    ),
    queryFn: async () => {
      if (!activeDrawer || activeDrawer.type !== "TASK_DETAIL") return null;
      const res = await fetch(`/api/tasks/${activeDrawer.id}`, {
        cache: "no-cache",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(
          body?.error ?? "Gagal memuat detail task atau akses ditolak."
        );
      }
      return (await res.json()) as TaskDetailApiResponse;
    },
    retry: false,
  });

  const taskDetail = taskQuery.data?.task ?? null;
  const taskPermissions = taskQuery.data?.permissions ?? null;

  const drawerKey = activeDrawer ? `${activeDrawer.type}:${activeDrawer.id}` : "";
  const activeTab: DrawerTab =
    tabState.key === drawerKey ? tabState.tab : "detail";

  const selectedStatus: TaskStatus =
    taskDetail &&
    statusOverride &&
    statusOverride.taskId === taskDetail.id &&
    statusOverride.version === taskDetail.version
      ? statusOverride.status
      : (taskDetail?.status ?? "TODO");

  const newChecklistTitle =
    taskDetail &&
    checklistDraft &&
    checklistDraft.taskId === taskDetail.id
      ? checklistDraft.title
      : "";

  const invalidateTaskRelatedQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: taskDetailQueryKey });
    await queryClient.invalidateQueries({ queryKey: ["kanban-board"] });
    await queryClient.invalidateQueries({ queryKey: ["tasks"] });
    router.refresh();
  };

  const addChecklistMutation = useMutation({
    mutationFn: async (vars: { taskId: string; title: string }) => {
      const res = await addTaskChecklistItemAction(vars);
      if (!res.success) {
        throw new Error(res.error.message);
      }
      return res;
    },
    onSuccess: (res, vars) => {
      setChecklistDraft(null);
      toast.success(res.message ?? "Item checklist ditambahkan.");
      const detailKey = ["slide-over-detail", "TASK_DETAIL", vars.taskId] as const;
      queryClient.setQueryData<TaskDetailApiResponse | null>(
        detailKey,
        (prev) => {
          if (!prev) return prev;
          if (prev.task.checklists.some((c) => c.id === res.data.id)) {
            return prev;
          }
          const nextChecklists = [...prev.task.checklists, res.data];
          return {
            ...prev,
            task: {
              ...prev.task,
              checklists: nextChecklists,
              checklistTotal: nextChecklists.length,
            },
          };
        }
      );
      void queryClient.invalidateQueries({ queryKey: detailKey });
      void queryClient.invalidateQueries({ queryKey: ["kanban-board"] });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      router.refresh();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const toggleChecklistMutation = useMutation({
    mutationFn: async (vars: { checklistId: string; isCompleted: boolean }) => {
      const res = await toggleTaskChecklistAction(vars);
      if (!res.success) {
        throw new Error(res.error.message);
      }
      return res.data;
    },
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: taskDetailQueryKey });
      const prev =
        queryClient.getQueryData<TaskDetailApiResponse | null>(
          taskDetailQueryKey
        );
      if (prev) {
        const nextChecklists = prev.task.checklists.map((item) =>
          item.id === vars.checklistId
            ? { ...item, isCompleted: vars.isCompleted }
            : item
        );
        const completedCount = nextChecklists.filter((c) => c.isCompleted).length;
        queryClient.setQueryData<TaskDetailApiResponse>(taskDetailQueryKey, {
          ...prev,
          task: {
            ...prev.task,
            checklists: nextChecklists,
            checklistCompleted: completedCount,
          },
        });
      }
      return { prev };
    },
    onError: (err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(taskDetailQueryKey, context.prev);
      }
      toast.error(err.message);
    },
    onSettled: () => {
      void invalidateTaskRelatedQueries();
    },
  });

  const moveStatusMutation = useMutation({
    mutationFn: async (vars: {
      taskId: string;
      targetStatus: TaskStatus;
      expectedVersion: number;
      revisionNotes?: string;
    }) => {
      const res = await moveKanbanTaskAction(vars);
      if (!res.success) {
        throw new Error(res.error.message);
      }
      return res;
    },
    onSuccess: (res) => {
      toast.success(res.message ?? "Status task diperbarui.");
      setStatusOverride(null);
      setRevisionNotes("");
      void invalidateTaskRelatedQueries();
    },
    onError: (err) => {
      toast.error(err.message);
      void taskQuery.refetch();
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (vars: { taskId: string; body: string }) => {
      const res = await addTaskCommentAction(vars);
      if (!res.success) {
        throw new Error(res.error.message);
      }
      return res;
    },
    onSuccess: (res) => {
      setCommentBody("");
      toast.success(res.message ?? "Komentar terkirim.");
      void invalidateTaskRelatedQueries();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await softDeleteTaskAction({ taskId });
      if (!res.success) {
        throw new Error(res.error.message);
      }
      return res;
    },
    onSuccess: (res, taskId) => {
      toast.success(res.message ?? "Task berhasil dihapus.");
      setDeleteDialogOpen(false);
      closeDrawer();
      void queryClient.invalidateQueries({ queryKey: ["kanban-board"] });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      void queryClient.invalidateQueries({
        queryKey: ["slide-over-detail", "TASK_DETAIL", taskId],
      });
      router.refresh();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleOpenAttachment = async (att: TaskAttachmentDto) => {
    if (att.sourceType !== "UPLOAD" || !att.storageKey) {
      window.open(att.fileUrl, "_blank", "noopener,noreferrer");
      return;
    }

    setDownloadingAttachmentId(att.id);
    try {
      const res = await fetch(
        `/api/uploads/download-url?storageKey=${encodeURIComponent(att.storageKey)}&download=1`,
        { cache: "no-cache" }
      );
      const data = (await res.json()) as {
        downloadUrl?: string;
        error?: string;
      };
      if (!res.ok || !data.downloadUrl) {
        toast.error(data.error ?? "Gagal membuat tautan unduhan.");
        return;
      }
      window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
    } catch {
      toast.error("Gagal mengunduh lampiran.");
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  const meta = activeDrawer ? DRAWER_META[activeDrawer.type] : null;
  const Icon = meta?.icon ?? Layers;

  const needsRevisionNotes =
    taskDetail !== null &&
    selectedStatus === "REVISION" &&
    taskDetail.status !== "REVISION";

  const checklistCompletedCount = taskDetail
    ? taskDetail.checklists.filter((c) => c.isCompleted).length
    : 0;
  const checklistTotalCount = taskDetail ? taskDetail.checklists.length : 0;
  const checklistProgressPct =
    checklistTotalCount > 0
      ? Math.round((checklistCompletedCount / checklistTotalCount) * 100)
      : 0;

  return (
    <Sheet
      open={Boolean(activeDrawer)}
      onOpenChange={(open) => {
        if (!open) {
          setChecklistDraft(null);
          setStatusOverride(null);
          setRevisionNotes("");
          setCommentBody("");
          closeDrawer();
        }
      }}
    >
      <SheetContent
        side="right"
        className="w-full gap-0 border-l border-slate-200 bg-slate-100 p-0 sm:max-w-[560px] dark:border-slate-800 dark:bg-slate-950"
      >
        {activeDrawer && meta ? (
          <>
            {/* High-Contrast Drawer Header */}
            <SheetHeader className="border-b border-slate-200 bg-white px-6 pt-5 pb-4 pr-12 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-mono text-xs font-bold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300">
                    <Icon className="size-3.5" />
                    <span>
                      {taskDetail?.taskCode ?? activeDrawer.id.slice(0, 8)}
                    </span>
                  </span>
                  {taskDetail ? (
                    <>
                      <StatusBadge domain="task" value={taskDetail.status} />
                      <PriorityBadge priority={taskDetail.priority} />
                      {taskDetail.revisionCount > 0 ? (
                        <Badge
                          variant="outline"
                          className="rounded-full border-rose-200 bg-rose-50 font-mono text-[11px] font-bold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300"
                        >
                          Rev #{taskDetail.revisionCount}
                        </Badge>
                      ) : null}
                    </>
                  ) : null}
                </div>

                {activeDrawer.type === "TASK_DETAIL" &&
                taskDetail &&
                taskPermissions ? (
                  <div className="flex shrink-0 items-center gap-1">
                    {taskPermissions.canEdit ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => setEditDialogOpen(true)}
                        className="h-7 gap-1 rounded-lg border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        aria-label="Edit task"
                      >
                        <Pencil className="size-3" />
                        <span>Edit</span>
                      </Button>
                    ) : null}
                    {taskPermissions.canDelete ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => setDeleteDialogOpen(true)}
                        className="h-7 gap-1 rounded-lg border-rose-200 bg-rose-50/80 px-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300"
                        aria-label="Hapus task"
                      >
                        <Trash2 className="size-3" />
                        <span>Hapus</span>
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <SheetTitle className="mt-2.5 text-lg leading-snug font-extrabold tracking-tight text-slate-900 dark:text-white">
                {taskDetail?.title ?? meta.title}
              </SheetTitle>
              <SheetDescription className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                {taskDetail
                  ? taskDetail.project
                    ? `${taskDetail.project.code} · ${taskDetail.project.name}`
                    : "Tanpa Proyek (Umum)"
                  : meta.subtitle}
              </SheetDescription>
            </SheetHeader>

            {activeDrawer.type !== "TASK_DETAIL" ? (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-400">
                    <Icon className="size-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {meta.title}
                    </p>
                    <p className="font-mono text-xs font-medium text-slate-500 dark:text-slate-400">
                      {activeDrawer.id}
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2 pt-1">
                    {activeDrawer.type === "CONTENT_DETAIL" ? (
                      <>
                        <Link
                          href="/content/planner"
                          onClick={closeDrawer}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                        >
                          <span>Content Planner</span>
                          <ExternalLink className="size-3.5" />
                        </Link>
                        <Link
                          href="/content/calendar"
                          onClick={closeDrawer}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          <span>Calendar</span>
                        </Link>
                      </>
                    ) : (
                      <>
                        <Link
                          href={`/design/workspace?briefId=${activeDrawer.id}`}
                          onClick={closeDrawer}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                        >
                          <span>Design Workspace</span>
                          <ExternalLink className="size-3.5" />
                        </Link>
                        <Link
                          href="/design/reviews"
                          onClick={closeDrawer}
                          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                        >
                          <span>Review Queue</span>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : taskQuery.isLoading ? (
              <div className="flex-1 space-y-3 overflow-y-auto p-6">
                <Skeleton className="h-10 w-full rounded-xl" />
                <Skeleton className="h-28 w-full rounded-2xl" />
                <Skeleton className="h-36 w-full rounded-2xl" />
                <Skeleton className="h-24 w-full rounded-2xl" />
              </div>
            ) : taskQuery.isError ? (
              <div className="flex-1 overflow-y-auto p-6">
                <div className="flex items-start gap-2.5 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <div>
                    <p className="font-bold">Tidak dapat memuat task</p>
                    <p className="mt-0.5 font-medium">{taskQuery.error.message}</p>
                  </div>
                </div>
              </div>
            ) : taskDetail && taskPermissions ? (
              <Tabs
                value={activeTab}
                onValueChange={(val) =>
                  setTabState({ key: drawerKey, tab: val as DrawerTab })
                }
                className="flex min-h-0 flex-1 flex-col gap-0"
              >
                {/* Crisp Segmented Tab Bar */}
                <div className="border-b border-slate-200 bg-white px-6 py-2.5 dark:border-slate-800 dark:bg-slate-900">
                  <TabsList className="grid h-10 w-full grid-cols-3 rounded-xl border border-slate-200/80 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
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
                      {checklistTotalCount > 0 ? (
                        <span className="ml-1 rounded-full bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 group-data-active/tab:bg-white/20 group-data-active/tab:text-white dark:bg-slate-900 dark:text-slate-200">
                          {checklistCompletedCount}/{checklistTotalCount}
                        </span>
                      ) : null}
                    </TabsTrigger>
                    <TabsTrigger
                      value="activity"
                      className="group/tab rounded-lg text-xs font-bold text-slate-600 data-active:bg-blue-600 data-active:text-white data-active:shadow-xs dark:text-slate-300 dark:data-active:bg-blue-600 dark:data-active:text-white"
                    >
                      <span>Activity</span>
                      {taskDetail.comments.length > 0 ? (
                        <span className="ml-1 rounded-full bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 group-data-active/tab:bg-white/20 group-data-active/tab:text-white dark:bg-slate-900 dark:text-slate-200">
                          {taskDetail.comments.length}
                        </span>
                      ) : null}
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Tab 1: Detail */}
                <TabsContent
                  value="detail"
                  className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6"
                >
                  {/* Quick Status Transition */}
                  {taskPermissions.canEdit ? (
                    <div className="space-y-2.5 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                      <Label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                        Update Status
                      </Label>
                      <div className="flex flex-wrap items-center gap-2">
                        <Select
                          value={selectedStatus}
                          onValueChange={(val) => {
                            if (val !== null && taskDetail) {
                              setStatusOverride({
                                taskId: taskDetail.id,
                                version: taskDetail.version,
                                status: val as TaskStatus,
                              });
                            }
                          }}
                          items={STATUS_SELECT_LABELS}
                        >
                          <SelectTrigger className="h-9 flex-1 rounded-xl border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 sm:max-w-[260px] dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                            <SelectValue placeholder="Pilih status" />
                          </SelectTrigger>
                          <SelectContent>
                            {TASK_STATUS_VALUES.map((status) => (
                              <SelectItem key={status} value={status}>
                                {TASK_STATUS_META[status].label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          type="button"
                          size="sm"
                          className="h-9 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                          disabled={
                            selectedStatus === taskDetail.status ||
                            moveStatusMutation.isPending ||
                            (needsRevisionNotes &&
                              revisionNotes.trim().length < 10)
                          }
                          onClick={() =>
                            moveStatusMutation.mutate({
                              taskId: taskDetail.id,
                              targetStatus: selectedStatus,
                              expectedVersion: taskDetail.version,
                              revisionNotes: needsRevisionNotes
                                ? revisionNotes.trim()
                                : undefined,
                            })
                          }
                        >
                          {moveStatusMutation.isPending ? (
                            <Loader2 className="size-3.5 animate-spin" />
                          ) : null}
                          <span>Apply</span>
                        </Button>
                      </div>

                      {needsRevisionNotes ? (
                        <Textarea
                          rows={2}
                          value={revisionNotes}
                          onChange={(e) => setRevisionNotes(e.target.value)}
                          placeholder="Revision notes (min. 10 chars)..."
                          className="rounded-xl border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                      ) : null}
                    </div>
                  ) : null}

                  {/* Crisp Property Grid */}
                  <div className="grid gap-3 rounded-2xl border border-slate-200/90 bg-white p-4 text-xs shadow-xs sm:grid-cols-2 dark:border-slate-800 dark:bg-slate-900">
                    <div className="space-y-1.5 rounded-xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                      <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                        Project
                      </p>
                      {taskDetail.project ? (
                        <Link
                          href={`/projects/${taskDetail.project.id}`}
                          className="inline-flex items-center gap-1.5 font-bold text-slate-900 hover:text-blue-600 hover:underline dark:text-white dark:hover:text-blue-400"
                        >
                          <span
                            className="size-2.5 shrink-0 rounded-full"
                            style={{
                              backgroundColor: taskDetail.project.colorHex,
                            }}
                          />
                          <span className="truncate">
                            {taskDetail.project.code} · {taskDetail.project.name}
                          </span>
                          <FolderKanban className="size-3.5 shrink-0 text-slate-400" />
                        </Link>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                          <span className="size-2 shrink-0 rounded-full bg-slate-400" />
                          <span>Tanpa Proyek (Umum)</span>
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 rounded-xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                      <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                        Due Date
                      </p>
                      <div
                        className={cn(
                          "inline-flex flex-wrap items-center gap-1.5 font-bold",
                          taskDetail.isOverdue
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-slate-900 dark:text-white"
                        )}
                      >
                        <CalendarClock className="size-3.5 shrink-0" />
                        <span>{formatDateTime(taskDetail.dueDate)}</span>
                        {taskDetail.isOverdue ? (
                          <Badge
                            variant="destructive"
                            className="text-[10px] font-bold"
                          >
                            Overdue
                          </Badge>
                        ) : null}
                      </div>
                    </div>

                    <div className="space-y-1.5 rounded-xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                      <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                        Assignee
                      </p>
                      {taskDetail.assignee ? (
                        <div className="flex items-center gap-2">
                          <Avatar
                            size="sm"
                            className="size-6 border border-slate-200 dark:border-slate-700"
                          >
                            {taskDetail.assignee.avatarUrl ? (
                              <AvatarImage
                                src={taskDetail.assignee.avatarUrl}
                                alt={taskDetail.assignee.fullName}
                              />
                            ) : null}
                            <AvatarFallback className="bg-blue-50 text-[10px] font-bold text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                              {getInitials(taskDetail.assignee.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-bold text-slate-900 dark:text-white">
                            {taskDetail.assignee.fullName}
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 font-semibold text-slate-500 dark:text-slate-400">
                          <UserIcon className="size-3.5" />
                          <span>Unassigned</span>
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5 rounded-xl border border-slate-200/70 bg-slate-50/80 p-3 dark:border-slate-800 dark:bg-slate-800/50">
                      <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                        Type & Flow
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge
                          domain="taskType"
                          value={taskDetail.taskType}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5 rounded-xl border border-slate-200/70 bg-slate-50/80 p-3 sm:col-span-2 dark:border-slate-800 dark:bg-slate-800/50">
                      <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                        Reporter / Reviewer
                      </p>
                      <p className="font-bold text-slate-900 dark:text-white">
                        {taskDetail.reporter.fullName}
                        {taskDetail.reviewer
                          ? ` → ${taskDetail.reviewer.fullName}`
                          : ""}
                      </p>
                    </div>
                  </div>

                  {/* Linked Cross-Module References */}
                  {taskDetail.linkedDesignBrief ||
                  taskDetail.linkedContentItem ? (
                    <div className="space-y-2.5 rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 text-xs dark:border-indigo-500/30 dark:bg-indigo-500/10">
                      <p className="text-[11px] font-bold tracking-wider text-indigo-700 uppercase dark:text-indigo-300">
                        Linked Items
                      </p>
                      {taskDetail.linkedContentItem ? (
                        <div className="flex items-center justify-between gap-2 rounded-xl border border-indigo-200/70 bg-white px-3.5 py-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-900 dark:text-white">
                              {taskDetail.linkedContentItem.title}
                            </p>
                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              {taskDetail.linkedContentItem.platform} ·{" "}
                              {taskDetail.linkedContentItem.contentFormat}
                            </p>
                          </div>
                          <Link
                            href="/content/calendar"
                            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300"
                          >
                            <span>Calendar</span>
                            <ExternalLink className="size-3" />
                          </Link>
                        </div>
                      ) : null}

                      {taskDetail.linkedDesignBrief ? (
                        <div className="flex items-center justify-between gap-2 rounded-xl border border-indigo-200/70 bg-white px-3.5 py-2.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                          <div className="min-w-0 space-y-1">
                            <p className="truncate font-bold text-slate-900 dark:text-white">
                              {taskDetail.linkedDesignBrief.title}
                            </p>
                            <StatusBadge
                              domain="design"
                              value={taskDetail.linkedDesignBrief.status}
                              versionNumber={
                                taskDetail.linkedDesignBrief.currentVersion
                              }
                              revisionCount={
                                taskDetail.linkedDesignBrief.revisionCount
                              }
                            />
                          </div>
                          <Link
                            href={`/design/workspace?briefId=${taskDetail.linkedDesignBrief.id}`}
                            className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300"
                          >
                            <span>Brief</span>
                            <ExternalLink className="size-3" />
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Tags */}
                  {taskDetail.tags.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {taskDetail.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                        >
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  ) : null}

                  {/* Description */}
                  {taskDetail.description ? (
                    <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                      <h3 className="mb-1.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                        Description
                      </h3>
                      <p className="whitespace-pre-wrap text-xs leading-relaxed font-medium text-slate-700 dark:text-slate-200">
                        {taskDetail.description}
                      </p>
                    </div>
                  ) : null}

                  {/* Attachments */}
                  {taskDetail.attachments.length > 0 ? (
                    <div className="space-y-2.5 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                      <h3 className="flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                        <Paperclip className="size-3.5 text-blue-600 dark:text-blue-400" />
                        <span>Attachments ({taskDetail.attachments.length})</span>
                      </h3>
                      <ul className="space-y-2">
                        {taskDetail.attachments.map((att) => (
                          <li
                            key={att.id}
                            className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs dark:border-slate-800 dark:bg-slate-800/50"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-bold text-slate-900 dark:text-white">
                                {att.fileName}
                              </p>
                              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                {att.sourceType}
                                {att.fileSizeBytes
                                  ? ` · ${formatFileSize(att.fileSizeBytes)}`
                                  : ""}{" "}
                                · {att.uploaderName}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="xs"
                              disabled={downloadingAttachmentId === att.id}
                              onClick={() => void handleOpenAttachment(att)}
                              className="rounded-lg border-slate-200 bg-white font-semibold text-slate-700 hover:border-blue-400 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            >
                              {downloadingAttachmentId === att.id ? (
                                <Loader2 className="size-3 animate-spin" />
                              ) : att.sourceType === "UPLOAD" ? (
                                <Download className="size-3" />
                              ) : (
                                <ExternalLink className="size-3" />
                              )}
                              <span>Open</span>
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </TabsContent>

                {/* Tab 2: Progress-Tracked Checklist */}
                <TabsContent
                  value="checklist"
                  className="min-h-0 flex-1 space-y-4 overflow-y-auto p-6"
                >
                  <div className="rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="size-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-bold tracking-wide text-slate-900 uppercase dark:text-white">
                          Completion
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="font-bold text-slate-600 dark:text-slate-300">
                          {checklistCompletedCount}/{checklistTotalCount}
                        </span>
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[11px] font-bold",
                            checklistProgressPct === 100 &&
                              checklistTotalCount > 0
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
                              : "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300"
                          )}
                        >
                          {checklistProgressPct}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-300",
                          checklistProgressPct === 100 &&
                            checklistTotalCount > 0
                            ? "bg-emerald-500"
                            : "bg-blue-600"
                        )}
                        style={{ width: `${checklistProgressPct}%` }}
                      />
                    </div>
                  </div>

                  {taskDetail.checklists.length > 0 ? (
                    <ul className="space-y-2">
                      {taskDetail.checklists.map((item) => (
                        <li
                          key={item.id}
                          className={cn(
                            "flex items-start justify-between gap-2.5 rounded-xl border px-3.5 py-3 text-xs transition-all",
                            item.isCompleted
                              ? "border-slate-200/80 bg-slate-200/50 dark:border-slate-800 dark:bg-slate-800/40"
                              : "border-slate-200 bg-white shadow-2xs hover:border-blue-400 dark:border-slate-800 dark:bg-slate-900"
                          )}
                        >
                          <div className="flex min-w-0 items-start gap-2.5">
                            <Checkbox
                              checked={item.isCompleted}
                              disabled={
                                !taskPermissions.canToggleChecklist ||
                                toggleChecklistMutation.isPending
                              }
                              onCheckedChange={(checked) =>
                                toggleChecklistMutation.mutate({
                                  checklistId: item.id,
                                  isCompleted: checked,
                                })
                              }
                              className="mt-0.5"
                            />
                            <span
                              className={cn(
                                "leading-relaxed transition-colors",
                                item.isCompleted
                                  ? "font-medium text-slate-500 line-through dark:text-slate-400"
                                  : "font-semibold text-slate-900 dark:text-white"
                              )}
                            >
                              {item.title}
                            </span>
                          </div>
                          {item.isCompleted ? (
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 py-8 text-center text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                      Belum ada item checklist.
                    </div>
                  )}

                  {taskPermissions.canToggleChecklist ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const trimmed = newChecklistTitle.trim();
                        if (trimmed.length < 2) {
                          toast.error("Judul checklist minimal 2 karakter.");
                          return;
                        }
                        addChecklistMutation.mutate({
                          taskId: taskDetail.id,
                          title: trimmed,
                        });
                      }}
                      className="flex items-center gap-2 pt-1"
                    >
                      <Input
                        value={newChecklistTitle}
                        onChange={(e) =>
                          setChecklistDraft({
                            taskId: taskDetail.id,
                            title: e.target.value,
                          })
                        }
                        placeholder="Add checklist item..."
                        maxLength={200}
                        disabled={
                          addChecklistMutation.isPending ||
                          taskDetail.checklists.length >= 30
                        }
                        className="h-9.5 rounded-xl border-slate-200 bg-white text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                        aria-label="Tambah item checklist"
                      />
                      <Button
                        type="submit"
                        size="sm"
                        disabled={
                          newChecklistTitle.trim().length < 2 ||
                          addChecklistMutation.isPending ||
                          taskDetail.checklists.length >= 30
                        }
                        className="h-9.5 shrink-0 gap-1 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700"
                        aria-label="+ Tambah"
                      >
                        {addChecklistMutation.isPending ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          <Plus className="size-3.5" aria-hidden="true" />
                        )}
                        <span>Add</span>
                      </Button>
                    </form>
                  ) : null}
                </TabsContent>

                {/* Tab 3: Activity / Distinct Chat Bubbles */}
                <TabsContent
                  value="activity"
                  className="min-h-0 flex-1 overflow-y-auto p-6"
                >
                  <div className="flex min-h-full flex-col justify-between gap-4">
                    <div className="space-y-3">
                      {taskDetail.comments.length === 0 ? (
                        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 py-10 text-center text-xs font-semibold text-slate-500 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-400">
                          <MessageSquare className="mx-auto mb-2 size-5 text-slate-400" />
                          <p>Belum ada komentar. Mulai diskusi dengan @mention.</p>
                        </div>
                      ) : (
                        <ul className="space-y-3">
                          {taskDetail.comments.map((comment, idx) => (
                            <li key={comment.id} className="flex gap-2.5">
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
                                  "min-w-0 flex-1 rounded-2xl rounded-tl-sm border px-4 py-3 text-xs shadow-2xs",
                                  idx % 2 === 0
                                    ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                                    : "border-blue-200/80 bg-blue-50/75 dark:border-blue-500/30 dark:bg-blue-950/30"
                                )}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-slate-900 dark:text-white">
                                      {comment.author.fullName}
                                    </span>
                                    <span className="rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                      {comment.author.jobTitle}
                                    </span>
                                  </div>
                                  <span className="font-mono text-[10.5px] font-medium text-slate-500 dark:text-slate-400">
                                    {formatDateTime(comment.createdAt)}
                                  </span>
                                </div>
                                <p className="mt-2 whitespace-pre-wrap leading-relaxed font-medium text-slate-700 dark:text-slate-200">
                                  {comment.body}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {taskPermissions.canComment ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const trimmed = commentBody.trim();
                          if (!trimmed) return;
                          addCommentMutation.mutate({
                            taskId: taskDetail.id,
                            body: trimmed,
                          });
                        }}
                        className="sticky bottom-0 space-y-2.5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-md dark:border-slate-800 dark:bg-slate-900"
                      >
                        <Textarea
                          rows={2}
                          value={commentBody}
                          onChange={(e) => setCommentBody(e.target.value)}
                          placeholder="Write a comment or @mention..."
                          className="resize-none rounded-xl border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 focus-visible:bg-white dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                            Gunakan @nama untuk mention
                          </span>
                          <Button
                            type="submit"
                            size="sm"
                            disabled={
                              !commentBody.trim() ||
                              addCommentMutation.isPending
                            }
                            className="h-8.5 gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white hover:bg-blue-700"
                          >
                            {addCommentMutation.isPending ? (
                              <Loader2 className="size-3.5 animate-spin" />
                            ) : (
                              <Send className="size-3.5" />
                            )}
                            <span>Send</span>
                          </Button>
                        </div>
                      </form>
                    ) : null}
                  </div>
                </TabsContent>
              </Tabs>
            ) : null}
          </>
        ) : null}
      </SheetContent>

      {taskDetail && taskPermissions?.canEdit ? (
        <TaskCreateDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          projects={taskQuery.data?.formOptions?.projects ?? []}
          assignees={taskQuery.data?.formOptions?.assignees ?? []}
          canAssignOthers={taskPermissions.canAssign}
          editTask={taskDetail}
          onUpdated={() => void invalidateTaskRelatedQueries()}
        />
      ) : null}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={`Hapus Task ${taskDetail?.taskCode ?? ""}?`}
        description={`Task "${taskDetail?.title ?? ""}" akan dihapus dari tampilan aktif.`}
        confirmLabel="Hapus Task"
        variant="destructive"
        isLoading={deleteTaskMutation.isPending}
        onConfirm={() => {
          if (taskDetail) {
            deleteTaskMutation.mutate(taskDetail.id);
          }
        }}
      />
    </Sheet>
  );
}
