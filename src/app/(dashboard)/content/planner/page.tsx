import Link from "next/link";
import { redirect } from "next/navigation";
import { ContentIdeaStatus } from "@prisma/client";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { ContentPlannerClient } from "@/features/social-design/components/ContentPlannerClient";
import {
  getContentCalendarItems,
  getContentIdeas,
  getSelectableOptionsForSocialDesign,
} from "@/features/social-design/queries/content.queries";
import { hasPermission, PERMISSIONS } from "@/lib/constants/permissions";
import { getAuthContext } from "@/server/auth/rbac";

export const dynamic = "force-dynamic";

export default async function ContentPlannerPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  if (
    !hasPermission(
      ctx.permissions,
      PERMISSIONS.SOCIAL_CONTENT_MANAGE,
      ctx.roleCode
    )
  ) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Akses Content Planner Dibatasi"
        description="Hanya Staff Creator, Project Manager, dan Super Admin yang dapat mengelola Content Planner."
        action={
          <Link href="/" className="text-xs font-medium text-primary underline">
            Kembali ke Dashboard
          </Link>
        }
      />
    );
  }

  const [items, approvedIdeas, options] = await Promise.all([
    getContentCalendarItems({ month: "ALL" }),
    getContentIdeas({
      currentUserId: ctx.userId,
      status: ContentIdeaStatus.APPROVED_IDEA,
    }),
    getSelectableOptionsForSocialDesign(),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Content Planner
          </h1>
          <span className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
            {items.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Link
            href="/content/ideas"
            className="rounded-lg border border-border/70 bg-card px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Ideas
          </Link>
          <Link
            href="/content/calendar"
            className="rounded-lg border border-border/70 bg-card px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Calendar
          </Link>
        </div>
      </div>

      <ContentPlannerClient
        initialItems={items}
        approvedIdeas={approvedIdeas}
        projects={options.projects}
        creators={options.creators}
        designers={options.designers}
        currentUserId={ctx.userId}
      />
    </div>
  );
}
