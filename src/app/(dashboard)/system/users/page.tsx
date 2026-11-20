import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UsersDataTable } from "@/features/system/components/UsersDataTable";
import { getUsersManagementData } from "@/features/system/queries/user.queries";
import { hasPermission, PERMISSIONS } from "@/lib/constants/permissions";
import { cn } from "@/lib/utils";
import { getAuthContext } from "@/server/auth/rbac";

export const dynamic = "force-dynamic";

export default async function SystemUsersPage() {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login");
  }

  if (
    !hasPermission(ctx.permissions, PERMISSIONS.SYSTEM_USER_MANAGE, ctx.roleCode)
  ) {
    return (
      <Card className="mx-auto max-w-md border-destructive/30">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-5" />
          </div>
          <h1 className="text-base font-semibold text-foreground">
            Akses Ditolak (403)
          </h1>
          <p className="text-xs text-muted-foreground">
            Memerlukan izin <code className="font-mono">system:user:manage</code>.
          </p>
          <Link
            href="/"
            className={cn(buttonVariants({ size: "sm" }), "mt-1")}
          >
            Kembali ke Dashboard
          </Link>
        </CardContent>
      </Card>
    );
  }

  const data = await getUsersManagementData();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            Manajemen Tim
          </h1>
          <p className="text-xs text-muted-foreground">
            Akun anggota, peran RBAC, dan kontrol akses sesi
          </p>
        </div>

        {ctx.roleCode === "SUPER_ADMIN" ? (
          <Link
            href="/system/roles"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "w-fit gap-1.5"
            )}
          >
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            <span>Akses &amp; Peran</span>
          </Link>
        ) : null}
      </div>

      <UsersDataTable initialData={data} currentUserId={ctx.userId} />
    </div>
  );
}
