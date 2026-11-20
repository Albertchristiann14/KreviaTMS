import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { ContentAnalyticsCharts } from "@/features/social-design/components/ContentAnalyticsCharts";
import { getContentAnalyticsSummary } from "@/features/social-design/queries/content.queries";
import { hasPermission, PERMISSIONS } from "@/lib/constants/permissions";
import { getAuthContext } from "@/server/auth/rbac";

export const dynamic = "force-dynamic";

export default async function ContentAnalyticsPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  if (
    !hasPermission(ctx.permissions, PERMISSIONS.SOCIAL_CONTENT_READ, ctx.roleCode)
  ) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Akses Content Analytics Dibatasi"
        description="Anda tidak memiliki izin social:content:read untuk melihat analitik konten."
        action={
          <Link href="/" className="text-xs font-medium text-primary underline">
            Kembali ke Dashboard
          </Link>
        }
      />
    );
  }

  const summary = await getContentAnalyticsSummary();
  const canManageAnalytics = hasPermission(
    ctx.permissions,
    PERMISSIONS.SOCIAL_ANALYTICS_MANAGE,
    ctx.roleCode
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Content Analytics
          </h1>
          <span className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
            {summary.totalPublishedCount} published
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Link
            href="/content/calendar"
            className="rounded-lg border border-border/70 bg-card px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Calendar
          </Link>
        </div>
      </div>

      <ContentAnalyticsCharts
        summary={summary}
        canManageAnalytics={canManageAnalytics}
      />
    </div>
  );
}
