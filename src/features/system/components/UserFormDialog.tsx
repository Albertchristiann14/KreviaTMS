"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  Check,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  ShieldAlert,
} from "lucide-react";
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
import {
  createUserAction,
  updateUserAction,
} from "@/features/system/actions/user.actions";
import {
  createUserSchema,
  EMPLOYMENT_STATUS_VALUES,
  updateUserSchema,
  type CreateUserInput,
  type UpdateUserInput,
} from "@/features/system/schemas/user.schema";
import type {
  ManagerOptionDTO,
  RoleOptionDTO,
  SystemUserRowDTO,
} from "@/features/system/types";

const EMPLOYMENT_STATUS_LABELS: Record<
  (typeof EMPLOYMENT_STATUS_VALUES)[number],
  string
> = {
  FULL_TIME: "Full-Time",
  PART_TIME: "Part-Time",
  CONTRACT: "Contract",
  INTERN: "Internship",
  INACTIVE: "Inactive",
};

function generateTemporaryPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%";
  const all = upper + lower + digits + special;

  const pick = (pool: string) =>
    pool[Math.floor(Math.random() * pool.length)] ?? "K";

  const chars = [
    pick(upper),
    pick(upper),
    pick(lower),
    pick(lower),
    pick(digits),
    pick(digits),
    pick(special),
    ...Array.from({ length: 5 }, () => pick(all)),
  ];

  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = chars[i]!;
    chars[i] = chars[j]!;
    chars[j] = tmp;
  }

  return chars.join("");
}

export interface UserFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: SystemUserRowDTO | null;
  roles: RoleOptionDTO[];
  managers: ManagerOptionDTO[];
  currentUserId: string;
}

export function UserFormDialog({
  open,
  onOpenChange,
  user,
  roles,
  managers,
  currentUserId,
}: UserFormDialogProps) {
  const isEdit = Boolean(user);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader className="min-w-0 pb-1">
          <DialogTitle className="truncate text-lg font-bold text-slate-900 dark:text-white">
            {isEdit ? `Edit Profil · ${user?.fullName}` : "Tambah Anggota Tim"}
          </DialogTitle>
        </DialogHeader>

        {open ? (
          <UserFormBody
            key={user?.id ?? "create"}
            onOpenChange={onOpenChange}
            user={user}
            roles={roles}
            managers={managers}
            currentUserId={currentUserId}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function UserFormBody({
  onOpenChange,
  user,
  roles,
  managers,
  currentUserId,
}: Omit<UserFormDialogProps, "open">) {
  const router = useRouter();
  const isEdit = Boolean(user);

  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [initialTempPassword] = useState(() => generateTemporaryPassword());

  const defaultRoleId =
    roles.find((r) => r.code === "STAFF_CREATOR")?.id ?? roles[0]?.id ?? "";

  const createForm = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      fullName: "",
      displayName: "",
      email: "",
      roleId: defaultRoleId,
      jobTitle: "",
      department: "Operations",
      employmentStatus: "FULL_TIME",
      phone: "",
      managerId: "",
      temporaryPassword: initialTempPassword,
    },
  });

  const editForm = useForm<UpdateUserInput>({
    resolver: zodResolver(updateUserSchema),
    defaultValues: {
      userId: user?.id ?? "",
      fullName: user?.fullName ?? "",
      displayName: user?.displayName ?? "",
      roleId: user?.role.id ?? defaultRoleId,
      jobTitle: user?.jobTitle ?? "",
      department: user?.department ?? "Operations",
      employmentStatus: user?.employmentStatus ?? "FULL_TIME",
      phone: user?.phone ?? "",
      managerId: user?.manager?.id ?? "",
      isActive: user?.isActive ?? true,
    },
  });

  const roleLabelsById: Record<string, string> = {
    ...(user?.role ? { [user.role.id]: user.role.name } : {}),
    ...Object.fromEntries(roles.map((r) => [r.id, r.name])),
  };

  const availableManagers = managers.filter((m) => m.id !== user?.id);
  const inactiveCurrentManager =
    isEdit &&
    user?.manager &&
    user.manager.id !== user.id &&
    !availableManagers.some((m) => m.id === user.manager!.id)
      ? user.manager
      : null;

  const managerLabelsById: Record<string, string> = {
    "": "Tidak ada atasan",
    ...(inactiveCurrentManager
      ? {
          [inactiveCurrentManager.id]: `${inactiveCurrentManager.fullName} (Nonaktif)`,
        }
      : {}),
    ...Object.fromEntries(
      availableManagers.map((m) => [m.id, `${m.fullName} — ${m.jobTitle}`])
    ),
  };

  const handleCreateSubmit = async (values: CreateUserInput) => {
    setServerError(null);
    const res = await createUserAction(values);

    if (!res.success) {
      setServerError(res.error.message);
      if (res.error.fieldErrors) {
        for (const [field, messages] of Object.entries(
          res.error.fieldErrors
        )) {
          if (messages?.[0] && field in values) {
            createForm.setError(field as keyof CreateUserInput, {
              message: messages[0],
            });
          }
        }
      }
      return;
    }

    toast.success(res.message ?? "Akun berhasil dibuat.");
    onOpenChange(false);
    router.refresh();
  };

  const handleEditSubmit = async (values: UpdateUserInput) => {
    setServerError(null);
    const res = await updateUserAction(values);

    if (!res.success) {
      setServerError(res.error.message);
      if (res.error.fieldErrors) {
        for (const [field, messages] of Object.entries(
          res.error.fieldErrors
        )) {
          if (messages?.[0] && field in values) {
            editForm.setError(field as keyof UpdateUserInput, {
              message: messages[0],
            });
          }
        }
      }
      return;
    }

    toast.success(res.message ?? "Akun diperbarui.");
    if (res.data.activeTasksWarning.length > 0) {
      const codes = res.data.activeTasksWarning
        .slice(0, 5)
        .map((t) => t.taskCode)
        .join(", ");
      toast.warning(
        `Perhatian Reassignment: masih ada ${res.data.activeTasksWarning.length} task aktif (${codes}).`
      );
    }
    onOpenChange(false);
    router.refresh();
  };

  const watchedEditRoleId = useWatch({
    control: editForm.control,
    name: "roleId",
  });
  const watchedEditIsActive = useWatch({
    control: editForm.control,
    name: "isActive",
  });
  const willRevokeSession =
    isEdit &&
    user &&
    (watchedEditRoleId !== user.role.id ||
      watchedEditIsActive !== user.isActive);

  const isSubmitting = isEdit
    ? editForm.formState.isSubmitting
    : createForm.formState.isSubmitting;

  const tempPasswordValue =
    useWatch({
      control: createForm.control,
      name: "temporaryPassword",
    }) ?? "";

  return (
    <>
      {serverError ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      ) : null}

      {isEdit && user ? (
        <form
          onSubmit={editForm.handleSubmit(handleEditSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className="min-w-0 space-y-1.5 sm:col-span-2">
              <Label className="text-xs">Email Kerja</Label>
              <Input
                value={user.email}
                disabled
                className="bg-muted/60 font-mono text-xs"
              />
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="edit-fullName" className="text-xs">
                Nama Lengkap
              </Label>
              <Input
                id="edit-fullName"
                {...editForm.register("fullName")}
                aria-invalid={Boolean(editForm.formState.errors.fullName)}
              />
              {editForm.formState.errors.fullName ? (
                <p className="text-xs text-destructive">
                  {editForm.formState.errors.fullName.message}
                </p>
              ) : null}
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="edit-displayName" className="text-xs">
                Nama Panggilan
              </Label>
              <Input
                id="edit-displayName"
                placeholder="Opsional"
                {...editForm.register("displayName")}
              />
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label className="text-xs">Peran RBAC</Label>
              <Controller
                control={editForm.control}
                name="roleId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      if (val !== null) field.onChange(val);
                    }}
                    items={roleLabelsById}
                  >
                    <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                      <SelectValue placeholder="Pilih peran" className="block min-w-0 truncate">
                        {(value: string | null) => (
                          <span className="block truncate">
                            {value
                              ? (roleLabelsById[value] ?? "Pilih peran")
                              : "Pilih peran"}
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label className="text-xs">Kepegawaian</Label>
              <Controller
                control={editForm.control}
                name="employmentStatus"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      if (val !== null) field.onChange(val);
                    }}
                    items={EMPLOYMENT_STATUS_LABELS}
                  >
                    <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                      <SelectValue placeholder="Pilih status" className="block min-w-0 truncate" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_STATUS_VALUES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {EMPLOYMENT_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="edit-jobTitle" className="text-xs">
                Jabatan
              </Label>
              <Input
                id="edit-jobTitle"
                {...editForm.register("jobTitle")}
                aria-invalid={Boolean(editForm.formState.errors.jobTitle)}
              />
              {editForm.formState.errors.jobTitle ? (
                <p className="text-xs text-destructive">
                  {editForm.formState.errors.jobTitle.message}
                </p>
              ) : null}
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="edit-department" className="text-xs">
                Divisi
              </Label>
              <Input
                id="edit-department"
                {...editForm.register("department")}
                aria-invalid={Boolean(editForm.formState.errors.department)}
              />
              {editForm.formState.errors.department ? (
                <p className="text-xs text-destructive">
                  {editForm.formState.errors.department.message}
                </p>
              ) : null}
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="edit-phone" className="text-xs">
                Telepon / WhatsApp
              </Label>
              <Input
                id="edit-phone"
                placeholder="Opsional"
                {...editForm.register("phone")}
              />
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label className="text-xs">Atasan (Manager)</Label>
              <Controller
                control={editForm.control}
                name="managerId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(val) => {
                      if (val !== null) field.onChange(val);
                    }}
                    items={managerLabelsById}
                  >
                    <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                      <SelectValue placeholder="Tidak ada atasan" className="block min-w-0 truncate">
                        {(value: string | null) => (
                          <span className="block truncate">
                            {value
                              ? (managerLabelsById[value] ?? "Tidak ada atasan")
                              : "Tidak ada atasan"}
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tidak ada atasan</SelectItem>
                      {inactiveCurrentManager ? (
                        <SelectItem value={inactiveCurrentManager.id}>
                          <span className="truncate">
                            {inactiveCurrentManager.fullName} (Nonaktif)
                          </span>
                        </SelectItem>
                      ) : null}
                      {availableManagers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          <span className="truncate">
                            {m.fullName} — {m.jobTitle}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {editForm.formState.errors.managerId ? (
                <p className="text-xs text-destructive">
                  {editForm.formState.errors.managerId.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-xl border border-border/70 bg-muted/30 p-3">
            <Controller
              control={editForm.control}
              name="isActive"
              render={({ field }) => (
                <label className="flex cursor-pointer items-start gap-2.5">
                  <Checkbox
                    checked={field.value}
                    disabled={user.id === currentUserId}
                    onCheckedChange={(checked) => field.onChange(checked)}
                  />
                  <div className="space-y-0.5 text-xs">
                    <p className="font-semibold text-foreground">
                      Akun Aktif
                    </p>
                    <p className="text-muted-foreground">
                      {user.id === currentUserId
                        ? "Tidak dapat menonaktifkan akun sendiri."
                        : "Izinkan akun masuk ke sistem."}
                    </p>
                  </div>
                </label>
              )}
            />
          </div>

          {willRevokeSession ? (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-300">
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              <div className="space-y-0.5">
                <p className="font-semibold">Sesi aktif akan dicabut</p>
                {!watchedEditIsActive && user.activeTaskCount > 0 ? (
                  <p className="text-rose-700 dark:text-rose-300">
                    Masih memegang {user.activeTaskCount} task aktif — lakukan
                    reassignment.
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
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
              ) : (
                <span>Simpan</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      ) : (
        <form
          onSubmit={createForm.handleSubmit(handleCreateSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="create-fullName" className="text-xs">
                Nama Lengkap
              </Label>
              <Input
                id="create-fullName"
                placeholder="Dina Maharani"
                {...createForm.register("fullName")}
                aria-invalid={Boolean(createForm.formState.errors.fullName)}
              />
              {createForm.formState.errors.fullName ? (
                <p className="text-xs text-destructive">
                  {createForm.formState.errors.fullName.message}
                </p>
              ) : null}
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="create-displayName" className="text-xs">
                Nama Panggilan
              </Label>
              <Input
                id="create-displayName"
                placeholder="Opsional"
                {...createForm.register("displayName")}
              />
            </div>

            <div className="min-w-0 space-y-1.5 sm:col-span-2">
              <Label htmlFor="create-email" className="text-xs">
                Email Kerja
              </Label>
              <Input
                id="create-email"
                type="email"
                placeholder="nama@krevia.digital"
                {...createForm.register("email")}
                aria-invalid={Boolean(createForm.formState.errors.email)}
              />
              {createForm.formState.errors.email ? (
                <p className="text-xs text-destructive">
                  {createForm.formState.errors.email.message}
                </p>
              ) : null}
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label className="text-xs">Peran RBAC</Label>
              <Controller
                control={createForm.control}
                name="roleId"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      if (val !== null) field.onChange(val);
                    }}
                    items={roleLabelsById}
                  >
                    <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                      <SelectValue placeholder="Pilih peran" className="block min-w-0 truncate">
                        {(value: string | null) => (
                          <span className="block truncate">
                            {value
                              ? (roleLabelsById[value] ?? "Pilih peran")
                              : "Pilih peran"}
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {createForm.formState.errors.roleId ? (
                <p className="text-xs text-destructive">
                  {createForm.formState.errors.roleId.message}
                </p>
              ) : null}
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label className="text-xs">Kepegawaian</Label>
              <Controller
                control={createForm.control}
                name="employmentStatus"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(val) => {
                      if (val !== null) field.onChange(val);
                    }}
                    items={EMPLOYMENT_STATUS_LABELS}
                  >
                    <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                      <SelectValue placeholder="Pilih status" className="block min-w-0 truncate" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_STATUS_VALUES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {EMPLOYMENT_STATUS_LABELS[status]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="create-jobTitle" className="text-xs">
                Jabatan
              </Label>
              <Input
                id="create-jobTitle"
                placeholder="Content Strategist"
                {...createForm.register("jobTitle")}
                aria-invalid={Boolean(createForm.formState.errors.jobTitle)}
              />
              {createForm.formState.errors.jobTitle ? (
                <p className="text-xs text-destructive">
                  {createForm.formState.errors.jobTitle.message}
                </p>
              ) : null}
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="create-department" className="text-xs">
                Divisi
              </Label>
              <Input
                id="create-department"
                placeholder="Creative & Social"
                {...createForm.register("department")}
                aria-invalid={Boolean(createForm.formState.errors.department)}
              />
              {createForm.formState.errors.department ? (
                <p className="text-xs text-destructive">
                  {createForm.formState.errors.department.message}
                </p>
              ) : null}
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="create-phone" className="text-xs">
                Telepon / WhatsApp
              </Label>
              <Input
                id="create-phone"
                placeholder="Opsional"
                {...createForm.register("phone")}
              />
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label className="text-xs">Atasan (Manager)</Label>
              <Controller
                control={createForm.control}
                name="managerId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(val) => {
                      if (val !== null) field.onChange(val);
                    }}
                    items={managerLabelsById}
                  >
                    <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                      <SelectValue placeholder="Tidak ada atasan" className="block min-w-0 truncate">
                        {(value: string | null) => (
                          <span className="block truncate">
                            {value
                              ? (managerLabelsById[value] ?? "Tidak ada atasan")
                              : "Tidak ada atasan"}
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Tidak ada atasan</SelectItem>
                      {availableManagers.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          <span className="truncate">
                            {m.fullName} — {m.jobTitle}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {createForm.formState.errors.managerId ? (
                <p className="text-xs text-destructive">
                  {createForm.formState.errors.managerId.message}
                </p>
              ) : null}
            </div>

            <div className="min-w-0 space-y-1.5 sm:col-span-2">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="create-tempPassword" className="text-xs">
                  Kata Sandi Sementara
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      const generated = generateTemporaryPassword();
                      createForm.setValue("temporaryPassword", generated, {
                        shouldValidate: true,
                      });
                      setCopiedPassword(false);
                    }}
                  >
                    <KeyRound className="size-3" />
                    <span>Acak</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => {
                      if (tempPasswordValue) {
                        void navigator.clipboard.writeText(tempPasswordValue);
                        setCopiedPassword(true);
                        toast.success("Disalin.");
                      }
                    }}
                  >
                    {copiedPassword ? (
                      <Check className="size-3 text-emerald-600" />
                    ) : (
                      <Copy className="size-3" />
                    )}
                    <span>{copiedPassword ? "Tersalin" : "Salin"}</span>
                  </Button>
                </div>
              </div>
              <div className="relative">
                <Input
                  id="create-tempPassword"
                  type={showPassword ? "text" : "password"}
                  className="pr-9 font-mono text-xs"
                  {...createForm.register("temporaryPassword")}
                  aria-invalid={Boolean(
                    createForm.formState.errors.temporaryPassword
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label={
                    showPassword
                      ? "Sembunyikan password"
                      : "Tampilkan password"
                  }
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Min. 10 karakter (huruf besar, kecil, angka). Wajib diganti saat
                login pertama.
              </p>
              {createForm.formState.errors.temporaryPassword ? (
                <p className="text-xs text-destructive">
                  {createForm.formState.errors.temporaryPassword.message}
                </p>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Membuat...</span>
                </>
              ) : (
                <span>Buat Akun</span>
              )}
            </Button>
          </DialogFooter>
        </form>
      )}
    </>
  );
}
