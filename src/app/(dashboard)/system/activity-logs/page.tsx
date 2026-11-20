import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ActivityLogsTable } from "@/features/system/components/ActivityLogsTable";
import {
  getActivityLogFilterOptions,
  queryActivityLogs,
} from "@/features/system/queries/audit.queries";
import { hasPermission, PERMISSIONS } from "@/lib/constants/permissions";
import { cn } from "@/lib/utils";
import { getAuthContext } from "@/server/auth/rbac";

export const dynamic = "force-dynamic";

export default async function ActivityLogsPage() {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login");
  }

  if (
    !hasPermission(
      ctx.permissions,
      PERMISSIONS.SYSTEM_AUDIT_LOG_READ,
      ctx.roleCode
    )
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
            Memerlukan izin{" "}
            <code className="font-mono">system:audit_log:read</code>.
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

  const [initialData, filterOptions] = await Promise.all([
    queryActivityLogs(ctx, { page: 1, limit: 20 }),
    getActivityLogFilterOptions(ctx),
  ]);

  const isSuperAdmin = ctx.roleCode === "SUPER_ADMIN";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          Activity Logs
        </h1>
        <p className="text-xs text-muted-foreground">
          Audit trail perubahan lintas modul
        </p>
      </div>

      <ActivityLogsTable
        initialData={initialData}
        actors={filterOptions.actors}
        entityTypes={filterOptions.entityTypes}
        allowedModules={filterOptions.allowedModules}
        isSuperAdmin={isSuperAdmin}
      />
    </div>
  );
}
