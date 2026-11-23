"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
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
import { Textarea } from "@/components/ui/textarea";
import {
  createTaskAction,
  updateTaskAction,
} from "@/features/tasks/actions/task.actions";
import type {
  AssigneeWorkloadOption,
  ProjectLookupOption,
  TaskBoardCardDto,
} from "@/features/tasks/types";
import { toDateInputValueWib } from "@/features/tasks/utils/date-wib";
import {
  TASK_PRIORITY_META,
  TASK_PRIORITY_VALUES,
  type TaskPriority,
} from "@/lib/constants/enums";

const NO_PROJECT_SENTINEL = "__NONE__";

export interface TaskCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects?: ProjectLookupOption[];
  assignees?: AssigneeWorkloadOption[];
  currentUserId?: string;
  canAssignOthers?: boolean;
  defaultProjectId?: string;
  defaultStatus?: "BACKLOG" | "TODO" | "IN_PROGRESS";
  defaultDueDate?: string;
  editTask?: TaskBoardCardDto | null;
  onCreated?: (task: TaskBoardCardDto) => void;
  onUpdated?: (task: TaskBoardCardDto) => void;
}

const ROLE_NAME_MAP: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  PROJECT_MANAGER: "Project Manager",
  STAFF_CREATOR: "Creator",
  DESIGNER: "Designer",
};

function formatWorkloadOption(user: AssigneeWorkloadOption): string {
  const shortName = user.displayName || user.fullName;
  const role = ROLE_NAME_MAP[user.roleCode] ?? user.roleCode;
  if (user.overdueTaskCount > 0) {
    return `${shortName} · ${role} (${user.activeTaskCount} aktif, ${user.overdueTaskCount} overdue)`;
  }
  return `${shortName} · ${role} (${user.activeTaskCount} aktif)`;
}

function formatReviewerOption(user: AssigneeWorkloadOption): string {
  const role = ROLE_NAME_MAP[user.roleCode] ?? user.roleCode;
  return `${user.fullName} · ${role}`;
}

interface TaskFormBodyProps {
  projects: ProjectLookupOption[];
  assignees: AssigneeWorkloadOption[];
  currentUserId: string;
  canAssignOthers: boolean;
  defaultProjectId?: string;
  defaultStatus: "BACKLOG" | "TODO" | "IN_PROGRESS";
  defaultDueDate: string;
  editTask?: TaskBoardCardDto | null;
  onClose: () => void;
  onCreated?: (task: TaskBoardCardDto) => void;
  onUpdated?: (task: TaskBoardCardDto) => void;
}

function TaskFormBody({
  projects,
  assignees,
  currentUserId,
  canAssignOthers,
  defaultProjectId,
  defaultStatus,
  defaultDueDate,
  editTask,
  onClose,
  onCreated,
  onUpdated,
}: TaskFormBodyProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = Boolean(editTask);

  const effectiveProjects = useMemo(() => {
    if (!editTask?.project) return projects;
    if (projects.some((p) => p.id === editTask.project?.id)) return projects;
    return [
      {
        id: editTask.project.id,
        code: editTask.project.code,
        name: editTask.project.name,
        colorHex: editTask.project.colorHex,
        status: "ACTIVE" as const,
        ownerId: "",
      },
      ...projects,
    ];
  }, [projects, editTask]);

  const effectiveAssignees = useMemo(() => {
    const map = new Map<string, AssigneeWorkloadOption>();
    for (const u of assignees) {
      map.set(u.id, u);
    }
    const ensureUser = (
      user: { id: string; fullName: string; avatarUrl: string | null } | null | undefined
    ) => {
      if (!user || map.has(user.id)) return;
      map.set(user.id, {
        id: user.id,
        fullName: user.fullName,
        displayName: null,
        avatarUrl: user.avatarUrl,
        jobTitle: "",
        roleCode: "",
        isActive: true,
        activeTaskCount: 0,
        overdueTaskCount: 0,
      });
    };
    ensureUser(editTask?.assignee);
    ensureUser(editTask?.reviewer);
    return Array.from(map.values());
  }, [assignees, editTask]);

  const initialProj = editTask
    ? (editTask.projectId ?? NO_PROJECT_SENTINEL)
    : defaultProjectId &&
        defaultProjectId !== NO_PROJECT_SENTINEL &&
        effectiveProjects.some((p) => p.id === defaultProjectId)
      ? defaultProjectId
      : NO_PROJECT_SENTINEL;

  const initialDueDate = editTask
    ? toDateInputValueWib(editTask.dueDate)
    : defaultDueDate;

  const [projectId, setProjectId] = useState(initialProj);
  const [title, setTitle] = useState(() => (editTask ? editTask.title : ""));
  const [description, setDescription] = useState(() =>
    editTask ? (editTask.description ?? "") : ""
  );
  const [priority, setPriority] = useState<TaskPriority>(() =>
    editTask ? editTask.priority : "MEDIUM"
  );
  const [status, setStatus] = useState<"BACKLOG" | "TODO" | "IN_PROGRESS">(
    defaultStatus
  );
  const [assigneeId, setAssigneeId] = useState<string>(() => {
    if (editTask) {
      return editTask.assignee?.id ?? "";
    }
    return defaultStatus === "BACKLOG"
      ? ""
      : canAssignOthers
        ? (effectiveAssignees[0]?.id ?? currentUserId)
        : currentUserId;
  });
  const [reviewerId, setReviewerId] = useState<string>(() => {
    if (editTask) {
      return editTask.reviewer?.id ?? "";
    }
    return initialProj !== NO_PROJECT_SENTINEL
      ? (effectiveProjects.find((p) => p.id === initialProj)?.ownerId ?? "")
      : "";
  });
  const [requiresReview, setRequiresReview] = useState(() =>
    editTask ? editTask.requiresReview : true
  );
  const [startDate, setStartDate] = useState(() =>
    editTask ? toDateInputValueWib(editTask.startDate) : ""
  );
  const [dueDate, setDueDate] = useState(initialDueDate);
  const [estimatedHours, setEstimatedHours] = useState(() =>
    editTask &&
    editTask.estimatedHours !== null &&
    editTask.estimatedHours !== undefined
      ? String(editTask.estimatedHours)
      : ""
  );
  const [tagsRaw, setTagsRaw] = useState(() =>
    editTask ? editTask.tags.join(", ") : ""
  );
  const [checklists, setChecklists] = useState<string[]>([]);
  const [newChecklistText, setNewChecklistText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectableAssignees = useMemo(() => {
    if (canAssignOthers) return effectiveAssignees;
    return effectiveAssignees.filter(
      (a) =>
        (currentUserId && a.id === currentUserId) ||
        (editTask?.assignee && a.id === editTask.assignee.id)
    );
  }, [canAssignOthers, effectiveAssignees, currentUserId, editTask]);

  const effectiveStatus = editTask ? editTask.status : status;
  const isDueDateRequired = effectiveStatus !== "BACKLOG";

  const handleAddChecklistRow = () => {
    const trimmed = newChecklistText.trim();
    if (trimmed.length < 2) {
      toast.error("Item checklist minimal 2 karakter.");
      return;
    }
    if (checklists.length >= 30) {
      toast.error("Maksimal 30 item checklist per task.");
      return;
    }
    setChecklists((prev) => [...prev, trimmed]);
    setNewChecklistText("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const tags = tagsRaw
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 5);

      const parsedHours = estimatedHours.trim()
        ? Number(estimatedHours)
        : null;
      const normalizedHours =
        parsedHours !== null && Number.isFinite(parsedHours)
          ? parsedHours
          : null;
      const resolvedProjectId =
        projectId && projectId !== NO_PROJECT_SENTINEL ? projectId : null;

      if (editTask) {
        const res = await updateTaskAction({
          taskId: editTask.id,
          expectedVersion: editTask.version,
          projectId: resolvedProjectId,
          title: title.trim(),
          description: description.trim() || null,
          priority,
          requiresReview,
          ...(canAssignOthers ? { assigneeId: assigneeId || null } : {}),
          reviewerId: reviewerId || null,
          startDate: startDate || null,
          ...(dueDate !== initialDueDate ? { dueDate: dueDate || null } : {}),
          estimatedHours: normalizedHours,
          tags,
        });

        if (!res.success) {
          setErrorMsg(res.error.message);
          toast.error(res.error.message);
          return;
        }

        toast.success(res.message ?? "Task berhasil diperbarui.");
        void queryClient.invalidateQueries({ queryKey: ["kanban-board"] });
        void queryClient.invalidateQueries({ queryKey: ["tasks"] });
        void queryClient.invalidateQueries({
          queryKey: ["slide-over-detail", "TASK_DETAIL", editTask.id],
        });
        onClose();
        onUpdated?.(res.data);
        router.refresh();
        return;
      }

      const res = await createTaskAction({
        projectId: resolvedProjectId,
        title: title.trim(),
        description: description.trim() || null,
        taskType: "GENERAL",
        priority,
        status,
        requiresReview,
        assigneeId: assigneeId || null,
        reviewerId: reviewerId || null,
        startDate: startDate || null,
        dueDate: dueDate || null,
        estimatedHours: normalizedHours,
        tags,
        checklists: checklists.map((item) => ({ title: item })),
      });

      if (!res.success) {
        setErrorMsg(res.error.message);
        toast.error(res.error.message);
        return;
      }

      toast.success(res.message ?? "Task berhasil dibuat.");
      void queryClient.invalidateQueries({ queryKey: ["kanban-board"] });
      void queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onClose();
      onCreated?.(res.data);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-1">
      {/* Judul Task */}
      <div className="space-y-1.5">
        <Label
          htmlFor="task-title"
          className="text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          Judul Task *
        </Label>
        <Input
          id="task-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Audit performa landing page campaign Q4"
          className="text-sm font-medium"
          minLength={3}
          maxLength={200}
          required
        />
      </div>

      {/* Proyek, Status, dan Prioritas */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
        <div
          className={
            isEdit
              ? "min-w-0 space-y-1.5 sm:col-span-8"
              : "min-w-0 space-y-1.5 sm:col-span-6"
          }
        >
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Proyek (Opsional)
          </Label>
          <Select
            value={projectId || NO_PROJECT_SENTINEL}
            onValueChange={(val) => {
              const nextVal = val || NO_PROJECT_SENTINEL;
              setProjectId(nextVal);
              if (nextVal !== NO_PROJECT_SENTINEL) {
                const owner = effectiveProjects.find(
                  (p) => p.id === nextVal
                )?.ownerId;
                if (owner && !reviewerId) setReviewerId(owner);
              }
            }}
          >
            <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
              <SelectValue className="block min-w-0 truncate">
                {(val: string | null) => {
                  const label = (() => {
                    if (!val || val === NO_PROJECT_SENTINEL) {
                      return "Tanpa Proyek (Umum)";
                    }
                    const p = effectiveProjects.find((item) => item.id === val);
                    return p ? `${p.name} · ${p.code}` : "Tanpa Proyek (Umum)";
                  })();
                  return <span className="block truncate">{label}</span>;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_PROJECT_SENTINEL}>
                Tanpa Proyek (Umum)
              </SelectItem>
              {effectiveProjects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="truncate">
                    {p.name} · {p.code}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!isEdit ? (
          <div className="min-w-0 space-y-1.5 sm:col-span-3">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Status
            </Label>
            <Select
              value={status}
              onValueChange={(val) => {
                if (
                  val === "BACKLOG" ||
                  val === "TODO" ||
                  val === "IN_PROGRESS"
                ) {
                  setStatus(val);
                }
              }}
            >
              <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                <SelectValue className="block min-w-0 truncate">
                  {(val: string | null) => {
                    const label =
                      val === "BACKLOG"
                        ? "Backlog"
                        : val === "IN_PROGRESS"
                          ? "In Progress"
                          : "To Do";
                    return <span className="block truncate">{label}</span>;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BACKLOG">Backlog</SelectItem>
                <SelectItem value="TODO">To Do</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div
          className={
            isEdit
              ? "min-w-0 space-y-1.5 sm:col-span-4"
              : "min-w-0 space-y-1.5 sm:col-span-3"
          }
        >
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Prioritas
          </Label>
          <Select
            value={priority}
            onValueChange={(val) => {
              if (val) setPriority(val as TaskPriority);
            }}
          >
            <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
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
        </div>
      </div>

      {/* Deskripsi */}
      <div className="space-y-1.5">
        <Label
          htmlFor="task-desc"
          className="text-xs font-semibold text-slate-700 dark:text-slate-300"
        >
          Deskripsi
        </Label>
        <Textarea
          id="task-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Rincian pekerjaan atau kriteria penyelesaian..."
          rows={3}
          maxLength={5000}
        />
      </div>

      {/* Assignee & Reviewer */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="min-w-0 space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Assignee {!isEdit && status !== "BACKLOG" ? "*" : "(Opsional)"}
          </Label>
          <Select
            value={assigneeId || "UNASSIGNED"}
            disabled={isEdit && !canAssignOthers}
            onValueChange={(val) =>
              setAssigneeId(val && val !== "UNASSIGNED" ? val : "")
            }
          >
            <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
              <SelectValue className="block min-w-0 truncate">
                {(val: string | null) => {
                  const label = (() => {
                    if (!val || val === "UNASSIGNED") {
                      return "Belum ditugaskan";
                    }
                    const found = selectableAssignees.find((u) => u.id === val);
                    return found
                      ? formatWorkloadOption(found)
                      : "Pilih assignee...";
                  })();
                  return <span className="block truncate">{label}</span>;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="UNASSIGNED">Belum ditugaskan</SelectItem>
              {selectableAssignees.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <span className="truncate">{formatWorkloadOption(user)}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-0 space-y-1.5">
          <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Reviewer (Opsional)
          </Label>
          <Select
            value={reviewerId || "NONE"}
            onValueChange={(val) =>
              setReviewerId(val && val !== "NONE" ? val : "")
            }
          >
            <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
              <SelectValue className="block min-w-0 truncate">
                {(val: string | null) => {
                  const label = (() => {
                    if (!val || val === "NONE") {
                      return "Tanpa reviewer";
                    }
                    const found = effectiveAssignees.find((u) => u.id === val);
                    return found
                      ? formatReviewerOption(found)
                      : "Pilih reviewer...";
                  })();
                  return <span className="block truncate">{label}</span>;
                }}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NONE">Tanpa reviewer</SelectItem>
              {effectiveAssignees.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  <span className="truncate">{formatReviewerOption(user)}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Jadwal & Estimasi */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="min-w-0 space-y-1.5">
          <Label
            htmlFor="task-start-date"
            className="text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Tanggal Mulai
          </Label>
          <Input
            id="task-start-date"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div className="min-w-0 space-y-1.5">
          <Label
            htmlFor="task-due-date"
            className="text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Due Date {isDueDateRequired ? "*" : "(Opsional)"}
          </Label>
          <Input
            id="task-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required={isDueDateRequired}
          />
        </div>

        <div className="min-w-0 space-y-1.5">
          <Label
            htmlFor="task-hours"
            className="text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Estimasi (jam)
          </Label>
          <Input
            id="task-hours"
            type="number"
            step="0.5"
            min="0.5"
            max="500"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value)}
            placeholder="2.5"
          />
        </div>
      </div>

      {/* Tags & Review Requirement */}
      <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-2">
        <div className="min-w-0 space-y-1.5">
          <Label
            htmlFor="task-tags"
            className="text-xs font-semibold text-slate-700 dark:text-slate-300"
          >
            Tags
          </Label>
          <Input
            id="task-tags"
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder="seo, campaign, q4"
          />
        </div>

        <div className="min-w-0 pb-0.5">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
            <Checkbox
              checked={requiresReview}
              onCheckedChange={(checked) => setRequiresReview(Boolean(checked))}
            />
            <span className="truncate">Wajib review sebelum status Done</span>
          </label>
        </div>
      </div>

      {/* Checklist (Create Mode Only) */}
      {!isEdit ? (
        <div className="space-y-2 rounded-xl border border-slate-200/90 bg-slate-50/60 p-3.5 dark:border-slate-800 dark:bg-slate-900/40">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Checklist
            </Label>
            {checklists.length > 0 ? (
              <span className="text-[11px] font-semibold text-slate-500">
                {checklists.length} langkah
              </span>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Input
              value={newChecklistText}
              onChange={(e) => setNewChecklistText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddChecklistRow();
                }
              }}
              placeholder="Tambah item checklist..."
              className="bg-white dark:bg-slate-900"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddChecklistRow}
              className="shrink-0 bg-white dark:bg-slate-900"
            >
              <Plus className="size-4" />
            </Button>
          </div>

          {checklists.length > 0 ? (
            <ul className="space-y-1.5 pt-1">
              {checklists.map((item, idx) => (
                <li
                  key={`${item}-${idx}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 text-xs text-slate-800 shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
                >
                  <span className="min-w-0 flex-1 truncate">{item}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() =>
                      setChecklists((prev) =>
                        prev.filter((_, itemIdx) => itemIdx !== idx)
                      )
                    }
                    className="size-6 shrink-0 text-slate-400 hover:text-destructive"
                    aria-label="Hapus checklist"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}

      {errorMsg ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs break-words text-destructive">
          {errorMsg}
        </p>
      ) : null}

      <DialogFooter className="gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 font-semibold text-white hover:bg-blue-700"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>{isEdit ? "Menyimpan..." : "Membuat Task..."}</span>
            </>
          ) : isEdit ? (
            "Perbarui Task"
          ) : (
            "Simpan Task"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function TaskCreateDialog({
  open,
  onOpenChange,
  projects = [],
  assignees = [],
  currentUserId = "",
  canAssignOthers = false,
  defaultProjectId,
  defaultStatus = "TODO",
  defaultDueDate = "",
  editTask = null,
  onCreated,
  onUpdated,
}: TaskCreateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
            {editTask ? `Edit Task ${editTask.taskCode}` : "Buat Task Baru"}
          </DialogTitle>
        </DialogHeader>

        {open ? (
          <TaskFormBody
            key={
              editTask
                ? `edit-${editTask.id}-${editTask.version}`
                : `create-${defaultProjectId ?? "any"}-${defaultStatus}-${defaultDueDate}`
            }
            projects={projects}
            assignees={assignees}
            currentUserId={currentUserId}
            canAssignOthers={canAssignOthers}
            defaultProjectId={defaultProjectId}
            defaultStatus={defaultStatus}
            defaultDueDate={defaultDueDate}
            editTask={editTask}
            onClose={() => onOpenChange(false)}
            onCreated={onCreated}
            onUpdated={onUpdated}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
