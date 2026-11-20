"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
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
  createProjectAction,
  updateProjectAction,
} from "@/features/tasks/actions/project.actions";
import {
  PROJECT_STATUS_VALUES,
  type AssigneeWorkloadOption,
  type ProjectStatus,
  type ProjectSummaryDto,
} from "@/features/tasks/types";
import { cn } from "@/lib/utils";

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING: "Planning",
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETED: "Completed",
  ARCHIVED: "Archived",
};

const COLOR_PRESETS = [
  "#2563EB",
  "#0EA5E9",
  "#10B981",
  "#8B5CF6",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#475569",
] as const;

export interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  project?: ProjectSummaryDto | null;
  assignableUsers?: AssigneeWorkloadOption[];
  currentUserId?: string;
  onSuccess?: () => void;
}

interface ProjectFormBodyProps {
  mode: "create" | "edit";
  project?: ProjectSummaryDto | null;
  assignableUsers: AssigneeWorkloadOption[];
  currentUserId?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

function ProjectFormBody({
  mode,
  project,
  assignableUsers,
  currentUserId,
  onClose,
  onSuccess,
}: ProjectFormBodyProps) {
  const router = useRouter();
  const isEdit = mode === "edit" && Boolean(project);

  const [code, setCode] = useState(() => (isEdit && project ? project.code : ""));
  const [name, setName] = useState(() => (isEdit && project ? project.name : ""));
  const [description, setDescription] = useState(() =>
    isEdit && project ? (project.description ?? "") : ""
  );
  const [status, setStatus] = useState<ProjectStatus>(() =>
    isEdit && project ? project.status : "ACTIVE"
  );
  const [colorHex, setColorHex] = useState(() =>
    isEdit && project ? project.colorHex : "#2563EB"
  );
  const [startDate, setStartDate] = useState(() =>
    isEdit && project ? (project.startDate ?? "") : ""
  );
  const [targetEndDate, setTargetEndDate] = useState(() =>
    isEdit && project ? (project.targetEndDate ?? "") : ""
  );
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [archiveConfirmOpen, setArchiveConfirmOpen] = useState(false);

  const toggleInitialMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const executeSubmit = async (confirmArchiveWithActiveTasks: boolean) => {
    setFieldError(null);
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        const res = await createProjectAction({
          code: code.trim().toUpperCase(),
          name: name.trim(),
          description: description.trim() || null,
          status,
          colorHex,
          startDate: startDate || null,
          targetEndDate: targetEndDate || null,
          members: selectedMemberIds.map((userId) => ({
            userId,
            projectRole: "MEMBER" as const,
          })),
        });

        if (!res.success) {
          setFieldError(res.error.message);
          toast.error(res.error.message);
          return;
        }

        toast.success(res.message ?? "Proyek berhasil dibuat.");
        onClose();
        onSuccess?.();
        router.refresh();
      } else if (project) {
        const res = await updateProjectAction({
          projectId: project.id,
          name: name.trim(),
          description: description.trim() || null,
          status,
          colorHex,
          startDate: startDate || null,
          targetEndDate: targetEndDate || null,
          confirmArchiveWithActiveTasks,
        });

        if (!res.success) {
          setFieldError(res.error.message);
          toast.error(res.error.message);
          return;
        }

        toast.success(res.message ?? "Proyek berhasil diperbarui.");
        setArchiveConfirmOpen(false);
        onClose();
        onSuccess?.();
        router.refresh();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      mode === "edit" &&
      project &&
      status === "ARCHIVED" &&
      project.status !== "ARCHIVED" &&
      project.activeTasks > 0
    ) {
      setArchiveConfirmOpen(true);
      return;
    }

    void executeSubmit(false);
  };

  const candidateMembers = assignableUsers.filter(
    (u) => u.id !== currentUserId
  );

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="project-code">Kode Proyek *</Label>
            <Input
              id="project-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="KRV-SOC"
              disabled={mode === "edit"}
              maxLength={20}
              required
              className="font-mono uppercase"
            />
            <p className="text-[11px] text-muted-foreground">
              2–20 huruf besar/angka
            </p>
          </div>

          <div className="min-w-0 space-y-1.5 sm:col-span-2">
            <Label htmlFor="project-name">Nama Proyek *</Label>
            <Input
              id="project-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Kampanye Digital Q4"
              maxLength={150}
              required
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="project-desc">Deskripsi</Label>
          <Textarea
            id="project-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ringkasan ruang lingkup proyek, objektif, dan catatan tim..."
            rows={3}
            maxLength={2000}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="min-w-0 space-y-1.5">
            <Label>Status Proyek</Label>
            <Select
              value={status}
              onValueChange={(val) => {
                if (val) setStatus(val as ProjectStatus);
              }}
            >
              <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                <SelectValue className="block min-w-0 truncate">
                  {(val: string | null) => (
                    <span className="block truncate">
                      {val && val in PROJECT_STATUS_LABELS
                        ? PROJECT_STATUS_LABELS[val as ProjectStatus]
                        : "Pilih status"}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PROJECT_STATUS_VALUES.map((st) => (
                  <SelectItem key={st} value={st}>
                    {PROJECT_STATUS_LABELS[st]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="project-start">Tanggal Mulai</Label>
            <Input
              id="project-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="min-w-0 space-y-1.5">
            <Label htmlFor="project-end">Target Selesai</Label>
            <Input
              id="project-end"
              type="date"
              value={targetEndDate}
              onChange={(e) => setTargetEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Warna Penanda Visual</Label>
          <div className="flex flex-wrap items-center gap-2">
            {COLOR_PRESETS.map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => setColorHex(hex)}
                aria-label={`Pilih warna ${hex}`}
                className={cn(
                  "size-7 rounded-full border-2 transition-transform hover:scale-105",
                  colorHex.toUpperCase() === hex
                    ? "border-foreground ring-2 ring-primary/30"
                    : "border-transparent"
                )}
                style={{ backgroundColor: hex }}
              />
            ))}
            <Input
              type="text"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              className="ml-1 h-7 w-24 font-mono text-xs"
              maxLength={7}
            />
          </div>
        </div>

        {mode === "create" && candidateMembers.length > 0 ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Label>Anggota Awal Proyek (Opsional)</Label>
              <Badge variant="secondary" className="text-[11px]">
                Anda otomatis menjadi Owner
              </Badge>
            </div>
            <div className="grid max-h-40 grid-cols-1 gap-1.5 overflow-y-auto rounded-lg border border-border p-2.5 sm:grid-cols-2">
              {candidateMembers.map((user) => {
                const checked = selectedMemberIds.includes(user.id);
                return (
                  <label
                    key={user.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/60"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggleInitialMember(user.id)}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-foreground">
                        {user.fullName}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {user.jobTitle}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        ) : null}

        {fieldError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs break-words text-destructive">
            {fieldError}
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : mode === "create" ? (
              "Simpan Proyek"
            ) : (
              "Perbarui Proyek"
            )}
          </Button>
        </DialogFooter>
      </form>

      <ConfirmDialog
        open={archiveConfirmOpen}
        onOpenChange={setArchiveConfirmOpen}
        title="Arsipkan Proyek dengan Task Aktif?"
        description={`Proyek ${project?.code ?? ""} masih memiliki ${
          project?.activeTasks ?? 0
        } task aktif. Pengarsipan tidak akan menghapus task historis agar perhitungan KPI tetap akurat.`}
        confirmLabel="Ya, Arsipkan Proyek"
        variant="destructive"
        isLoading={isSubmitting}
        onConfirm={() => executeSubmit(true)}
      />
    </>
  );
}

export function ProjectFormDialog({
  open,
  onOpenChange,
  mode,
  project,
  assignableUsers = [],
  currentUserId,
  onSuccess,
}: ProjectFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader className="min-w-0 pb-1">
          <DialogTitle className="truncate text-lg font-bold text-slate-900 dark:text-white">
            {mode === "create"
              ? "Buat Proyek Baru"
              : `Edit Proyek ${project?.code ?? ""}`}
          </DialogTitle>
        </DialogHeader>

        {open ? (
          <ProjectFormBody
            key={`${mode}-${project?.id ?? "new"}`}
            mode={mode}
            project={project}
            assignableUsers={assignableUsers}
            currentUserId={currentUserId}
            onClose={() => onOpenChange(false)}
            onSuccess={onSuccess}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
