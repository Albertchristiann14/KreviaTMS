import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { ContentCalendarGrid } from "@/features/social-design/components/ContentCalendarGrid";
import {
  getContentCalendarItems,
  getSelectableOptionsForSocialDesign,
} from "@/features/social-design/queries/content.queries";
import { getCurrentMonthJakarta } from "@/features/social-design/utils";
import { hasPermission, PERMISSIONS } from "@/lib/constants/permissions";
import { getAuthContext } from "@/server/auth/rbac";

export const dynamic = "force-dynamic";

export default async function ContentCalendarPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  if (
    !hasPermission(ctx.permissions, PERMISSIONS.SOCIAL_CONTENT_READ, ctx.roleCode)
  ) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Akses Content Calendar Dibatasi"
        description="Anda tidak memiliki izin social:content:read untuk melihat kalender konten."
        action={
          <Link href="/" className="text-xs font-medium text-primary underline">
            Kembali ke Dashboard
          </Link>
        }
      />
    );
  }

  const sp = await searchParams;
  const rawMonth = typeof sp.month === "string" ? sp.month.trim() : "";
  const initialMonth = /^(\d{4}-(0[1-9]|1[0-2])|ALL)$/.test(rawMonth)
    ? rawMonth
    : getCurrentMonthJakarta();

  const [initialItems, options] = await Promise.all([
    getContentCalendarItems({ month: initialMonth }),
    getSelectableOptionsForSocialDesign(),
  ]);

  const canManageContent = hasPermission(
    ctx.permissions,
    PERMISSIONS.SOCIAL_CONTENT_MANAGE,
    ctx.roleCode
  );
  const canDeleteContent = hasPermission(
    ctx.permissions,
    PERMISSIONS.SOCIAL_CONTENT_DELETE,
    ctx.roleCode
  );
  const isAdminOrPm =
    ctx.roleCode === "SUPER_ADMIN" || ctx.roleCode === "PROJECT_MANAGER";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Content Calendar
          </h1>
          <span className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
            {initialItems.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Link
            href="/content/ideas"
            className="rounded-lg border border-border/70 bg-card px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Ideas
          </Link>
          {canManageContent ? (
            <Link
              href="/content/planner"
              className="rounded-lg border border-border/70 bg-card px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Planner
            </Link>
          ) : null}
        </div>
      </div>

      <ContentCalendarGrid
        initialItems={initialItems}
        initialMonth={initialMonth}
        projects={options.projects}
        creators={options.creators}
        designers={options.designers}
        currentUserId={ctx.userId}
        canManageContent={canManageContent}
        canDeleteContent={canDeleteContent}
        isAdminOrPm={isAdminOrPm}
      />
    </div>
  );
}
