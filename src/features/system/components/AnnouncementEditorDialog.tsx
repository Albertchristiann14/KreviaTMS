"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2, Pin } from "lucide-react";
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
import { publishAnnouncementAction } from "@/features/system/actions/announcement.actions";
import {
  ANNOUNCEMENT_PRIORITIES,
  publishAnnouncementSchema,
  type PublishAnnouncementFormValues,
} from "@/features/system/schemas/announcement.schema";
import type { RoleOptionDTO } from "@/features/system/types";
import type { RoleCode } from "@/lib/constants/permissions";

const PRIORITY_LABELS: Record<
  (typeof ANNOUNCEMENT_PRIORITIES)[number],
  string
> = {
  INFO: "INFO — Informasi Umum",
  IMPORTANT: "IMPORTANT — Penting",
  URGENT: "URGENT — Mendesak",
};

export interface AnnouncementEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: RoleOptionDTO[];
  activePinnedCount: number;
}

export function AnnouncementEditorDialog({
  open,
  onOpenChange,
  roles,
  activePinnedCount,
}: AnnouncementEditorDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader className="pb-1">
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
            Buat & Publikasikan Pengumuman
          </DialogTitle>
        </DialogHeader>

        {open ? (
          <AnnouncementEditorForm
            onOpenChange={onOpenChange}
            roles={roles}
            activePinnedCount={activePinnedCount}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function AnnouncementEditorForm({
  onOpenChange,
  roles,
  activePinnedCount,
}: Omit<AnnouncementEditorDialogProps, "open">) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [broadcastAll, setBroadcastAll] = useState(true);

  const form = useForm<PublishAnnouncementFormValues>({
    resolver: zodResolver(publishAnnouncementSchema),
    defaultValues: {
      title: "",
      content: "",
      priority: "INFO",
      isPinned: false,
      targetRoleCodes: [],
      publishedAt: null,
      expiresAt: "",
    },
  });

  const selectedRoleCodes =
    useWatch({
      control: form.control,
      name: "targetRoleCodes",
    }) ?? [];
  const isPinLimitReached = activePinnedCount >= 3;

  const handleToggleRole = (roleCode: RoleCode, checked: boolean) => {
    const next = checked
      ? Array.from(new Set([...selectedRoleCodes, roleCode]))
      : selectedRoleCodes.filter((c) => c !== roleCode);
    form.setValue("targetRoleCodes", next, { shouldValidate: true });
  };

  const onSubmit = async (values: PublishAnnouncementFormValues) => {
    setServerError(null);
    const payload: PublishAnnouncementFormValues = {
      ...values,
      targetRoleCodes: broadcastAll ? [] : values.targetRoleCodes,
      expiresAt:
        values.expiresAt && values.expiresAt.trim() !== ""
          ? new Date(values.expiresAt).toISOString()
          : null,
    };

    const res = await publishAnnouncementAction(payload);
    if (!res.success) {
      setServerError(res.error.message);
      if (res.error.fieldErrors) {
        for (const [field, msgs] of Object.entries(res.error.fieldErrors)) {
          if (msgs?.[0] && field in values) {
            form.setError(field as keyof PublishAnnouncementFormValues, {
              message: msgs[0],
            });
          }
        }
      }
      return;
    }

    toast.success(res.message ?? "Pengumuman berhasil dipublikasikan.");
    onOpenChange(false);
    router.refresh();
  };

  return (
    <>
      {serverError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      ) : null}

      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="ann-title">Judul Pengumuman</Label>
            <Input
              id="ann-title"
              placeholder="Jadwal Review KPI Bulanan & Content Freeze"
              {...form.register("title")}
              aria-invalid={Boolean(form.formState.errors.title)}
            />
            {form.formState.errors.title ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.title.message}
              </p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-w-0 space-y-1.5">
              <Label>Tingkat Prioritas</Label>
              <Controller
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      if (val !== null) field.onChange(val);
                    }}
                    items={PRIORITY_LABELS}
                  >
                    <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                      <SelectValue placeholder="Pilih prioritas" className="block min-w-0 truncate" />
                    </SelectTrigger>
                    <SelectContent>
                      {ANNOUNCEMENT_PRIORITIES.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          {PRIORITY_LABELS[priority]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="ann-expiresAt">
                Kedaluwarsa Otomatis (Opsional)
              </Label>
              <Input
                id="ann-expiresAt"
                type="datetime-local"
                className="w-full min-w-0"
                {...form.register("expiresAt")}
                aria-invalid={Boolean(form.formState.errors.expiresAt)}
              />
              {form.formState.errors.expiresAt ? (
                <p className="text-xs text-destructive">
                  {form.formState.errors.expiresAt.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ann-content">Isi Pengumuman</Label>
            <Textarea
              id="ann-content"
              rows={5}
              placeholder="Tuliskan instruksi lengkap, tenggat waktu, dan poin penting untuk tim..."
              {...form.register("content")}
              aria-invalid={Boolean(form.formState.errors.content)}
            />
            {form.formState.errors.content ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.content.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
            <Label className="text-xs font-semibold">Target Penerima</Label>
            <label className="flex cursor-pointer items-center gap-2 text-xs">
              <Checkbox
                checked={broadcastAll}
                onCheckedChange={(checked) => {
                  setBroadcastAll(checked);
                  if (checked) {
                    form.setValue("targetRoleCodes", []);
                  }
                }}
              />
              <span className="font-medium text-foreground">
                Semua Peran (Seluruh Tim Krevia Digital)
              </span>
            </label>

            {!broadcastAll ? (
              <div className="grid grid-cols-2 gap-2 pt-1.5">
                {roles.map((role) => {
                  const checked = selectedRoleCodes.includes(role.code);
                  return (
                    <label
                      key={role.id}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1.5 text-xs"
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(next) =>
                          handleToggleRole(role.code, next)
                        }
                      />
                      <span className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                        {role.name}
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="rounded-lg border border-border bg-muted/20 p-3">
            <Controller
              control={form.control}
              name="isPinned"
              render={({ field }) => (
                <label className="flex cursor-pointer items-start gap-2.5">
                  <Checkbox
                    checked={field.value}
                    disabled={isPinLimitReached && !field.value}
                    onCheckedChange={(checked) => field.onChange(checked)}
                  />
                  <div className="space-y-0.5 text-xs">
                    <div className="flex items-center gap-1.5 font-semibold text-foreground">
                      <Pin className="size-3.5 text-primary" />
                      <span>Sematkan di Banner Atas Dashboard (Pinned)</span>
                    </div>
                    <p className="text-muted-foreground">
                      Slot pin aktif saat ini:{" "}
                      <span className="font-mono font-semibold text-foreground">
                        {activePinnedCount} / 3
                      </span>
                      .{" "}
                      {isPinLimitReached
                        ? "Slot pin penuh — lepas pin pengumuman lain terlebih dahulu."
                        : "Pengumuman tersemat tampil di top banner sampai dibaca atau kedaluwarsa."}
                    </p>
                  </div>
                </label>
              )}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={form.formState.isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Mempublikasikan...</span>
                </>
              ) : (
                <span>Publikasikan Pengumuman</span>
              )}
            </Button>
          </DialogFooter>
        </form>
    </>
  );
}
