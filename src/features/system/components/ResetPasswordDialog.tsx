"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
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
import { resetUserPasswordAction } from "@/features/system/actions/user.actions";
import {
  resetUserPasswordSchema,
  type ResetUserPasswordInput,
} from "@/features/system/schemas/user.schema";
import type { SystemUserRowDTO } from "@/features/system/types";

function generateStrongTempPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%";
  const all = upper + lower + digits + special;

  const pick = (pool: string) =>
    pool[Math.floor(Math.random() * pool.length)] ?? "A";

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

export interface ResetPasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: SystemUserRowDTO | null;
}

export function ResetPasswordDialog({
  open,
  onOpenChange,
  user,
}: ResetPasswordDialogProps) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="min-w-0">
          <DialogTitle>Reset Kata Sandi Pengguna</DialogTitle>
          <DialogDescription className="break-words">
            Terbitkan kata sandi sementara baru untuk{" "}
            <span className="font-semibold text-foreground">
              {user.fullName}
            </span>{" "}
            (<span className="font-mono text-xs">{user.email}</span>).
          </DialogDescription>
        </DialogHeader>

        {open ? (
          <ResetPasswordForm
            key={user.id}
            user={user}
            onOpenChange={onOpenChange}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ResetPasswordForm({
  user,
  onOpenChange,
}: {
  user: SystemUserRowDTO;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(true);
  const [copied, setCopied] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [initialPassword] = useState(() => generateStrongTempPassword());

  const form = useForm<ResetUserPasswordInput>({
    resolver: zodResolver(resetUserPasswordSchema),
    defaultValues: {
      userId: user.id,
      temporaryPassword: initialPassword,
    },
  });

  const tempPasswordValue =
    useWatch({
      control: form.control,
      name: "temporaryPassword",
    }) ?? "";

  const onSubmit = async (values: ResetUserPasswordInput) => {
    setServerError(null);
    const res = await resetUserPasswordAction(values);

    if (!res.success) {
      setServerError(res.error.message);
      if (res.error.fieldErrors?.temporaryPassword?.[0]) {
        form.setError("temporaryPassword", {
          message: res.error.fieldErrors.temporaryPassword[0],
        });
      }
      return;
    }

    toast.success(
      res.message ?? "Kata sandi sementara berhasil diterbitkan."
    );
    onOpenChange(false);
    router.refresh();
  };

  return (
    <>
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-600" />
          <div className="space-y-0.5">
            <p className="font-semibold">Keamanan & Audit Trail</p>
            <p>
              Reset password otomatis mengaktifkan{" "}
              <code>mustChangePassword</code>, menaikkan{" "}
              <code>tokenVersion</code> (sesi aktif dicabut), dan tidak pernah
              mencatat plaintext password di Activity Logs.
            </p>
          </div>
        </div>

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
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="reset-tempPassword">Kata Sandi Sementara Baru</Label>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    form.setValue(
                      "temporaryPassword",
                      generateStrongTempPassword(),
                      { shouldValidate: true }
                    );
                    setCopied(false);
                  }}
                >
                  <KeyRound className="size-3" />
                  <span>Generate</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => {
                    if (tempPasswordValue) {
                      void navigator.clipboard.writeText(tempPasswordValue);
                      setCopied(true);
                      toast.success("Kata sandi sementara disalin.");
                    }
                  }}
                >
                  {copied ? (
                    <Check className="size-3 text-emerald-600" />
                  ) : (
                    <Copy className="size-3" />
                  )}
                  <span>{copied ? "Tersalin" : "Salin"}</span>
                </Button>
              </div>
            </div>

            <div className="relative">
              <Input
                id="reset-tempPassword"
                type={showPassword ? "text" : "password"}
                className="pr-9 font-mono text-xs"
                {...form.register("temporaryPassword")}
                aria-invalid={Boolean(form.formState.errors.temporaryPassword)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
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
              Minimal 10 karakter (huruf besar, huruf kecil, angka). Salin dan
              kirimkan ke anggota melalui jalur aman sebelum menyimpan.
            </p>
            {form.formState.errors.temporaryPassword ? (
              <p className="text-xs text-destructive">
                {form.formState.errors.temporaryPassword.message}
              </p>
            ) : null}
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
                  <span>Mereset...</span>
                </>
              ) : (
                <span>Terbitkan Password Baru</span>
              )}
            </Button>
          </DialogFooter>
        </form>
    </>
  );
}
