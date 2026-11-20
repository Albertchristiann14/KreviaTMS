"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Layers,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email wajib diisi.")
    .email("Format email tidak valid."),
  password: z.string().min(1, "Password wajib diisi."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function sanitizeCallbackUrl(raw: string | null): string {
  if (!raw) return "/";
  const trimmed = raw.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) {
    return "/";
  }
  return trimmed;
}

function mapAuthErrorMessage(error?: string, code?: string): string {
  const combined = `${code ?? ""} ${error ?? ""}`.toLowerCase();
  if (combined.includes("rate") || combined.includes("too many")) {
    return "Terlalu banyak percobaan login gagal. Silakan coba lagi dalam beberapa menit.";
  }
  if (
    combined.includes("nonaktif") ||
    combined.includes("inactive") ||
    combined.includes("revoked") ||
    combined.includes("dicabut")
  ) {
    return "Akun Anda dinonaktifkan atau sesi dicabut. Hubungi Super Admin Krevia.";
  }
  return "Email atau password tidak sesuai. Silakan periksa kembali kredensial Anda.";
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = sanitizeCallbackUrl(searchParams.get("callbackUrl"));

  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setAuthError(null);
    try {
      const result = await signIn("credentials", {
        email: values.email.toLowerCase(),
        password: values.password,
        redirect: false,
      });

      if (!result || result.error || !result.ok) {
        setAuthError(mapAuthErrorMessage(result?.error, result?.code));
        return;
      }

      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setAuthError("Terjadi gangguan koneksi saat mencoba masuk. Silakan ulangi.");
    }
  };

  return (
    <main className="grid min-h-screen lg:grid-cols-12">
      <div className="relative hidden flex-col justify-between bg-slate-950 p-10 text-white lg:col-span-5 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-sm">
            <Layers className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">Krevia Digital</p>
            <p className="text-xs text-slate-400">Team Management System</p>
          </div>
        </div>

        <div className="space-y-4">
          <Badge
            variant="outline"
            className="border-blue-500/40 bg-blue-500/10 text-blue-200"
          >
            KTMS Internal Workspace
          </Badge>
          <p className="text-3xl leading-tight font-bold tracking-tight">
            Satu ruang kerja terpadu untuk eksekusi tim, KPI, dan produksi konten.
          </p>
          <p className="max-w-md text-sm leading-relaxed text-slate-300">
            Kelola proyek, Kanban board, kalender konten media sosial, brief
            desain, hingga evaluasi KPI bulanan berbasis data objektif.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="size-4 text-blue-400" aria-hidden="true" />
          <span>Dilindungi Auth.js v5 & RBAC 42 izin granular</span>
        </div>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10 lg:col-span-7">
        <div className="w-full max-w-md space-y-6">
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Layers className="size-4" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold">Krevia TMS</p>
              <p className="text-xs text-muted-foreground">
                Internal Operations Portal
              </p>
            </div>
          </div>

          <Card className="border-border/80 shadow-sm">
            <CardHeader className="space-y-1">
              <CardTitle className="text-xl font-semibold">
                <h1>Masuk ke KTMS</h1>
              </CardTitle>
              <CardDescription>
                Gunakan akun email Krevia Digital Anda untuk melanjutkan.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              {authError ? (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  <span>{authError}</span>
                </div>
              ) : null}

              <form
                onSubmit={handleSubmit(onSubmit)}
                className="space-y-4"
                noValidate
              >
                <div className="space-y-1.5">
                  <Label htmlFor="login-email">Email Kerja</Label>
                  <div className="relative">
                    <Mail
                      className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      placeholder="nama@krevia.digital"
                      className="pl-8"
                      aria-invalid={Boolean(errors.email)}
                      {...register("email")}
                    />
                  </div>
                  {errors.email ? (
                    <p className="text-xs text-destructive">
                      {errors.email.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="login-password">Password</Label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      id="login-password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Masukkan password Anda"
                      className="pr-9 pl-8"
                      aria-invalid={Boolean(errors.password)}
                      {...register("password")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute top-1/2 right-2.5 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={
                        showPassword
                          ? "Sembunyikan password"
                          : "Tampilkan password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" aria-hidden="true" />
                      ) : (
                        <Eye className="size-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {errors.password ? (
                    <p className="text-xs text-destructive">
                      {errors.password.message}
                    </p>
                  ) : null}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                      <span>Memverifikasi...</span>
                    </>
                  ) : (
                    <span>Masuk</span>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-50">
          <Loader2 className="size-6 animate-spin text-primary" aria-label="Memuat halaman login" />
        </main>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
