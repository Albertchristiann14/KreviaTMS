import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { ContentIdeaBoard } from "@/features/social-design/components/ContentIdeaBoard";
import {
  getContentIdeas,
  getSelectableOptionsForSocialDesign,
} from "@/features/social-design/queries/content.queries";
import { hasPermission, PERMISSIONS } from "@/lib/constants/permissions";
import { getAuthContext } from "@/server/auth/rbac";

export const dynamic = "force-dynamic";

export default async function ContentIdeasPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  if (
    !hasPermission(ctx.permissions, PERMISSIONS.SOCIAL_IDEA_READ, ctx.roleCode)
  ) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Akses Content Ideas Dibatasi"
        description="Anda tidak memiliki izin social:idea:read untuk melihat bank ide konten."
        action={
          <Link href="/" className="text-xs font-medium text-primary underline">
            Kembali ke Dashboard
          </Link>
        }
      />
    );
  }

  const [ideas, options] = await Promise.all([
    getContentIdeas({ currentUserId: ctx.userId }),
    getSelectableOptionsForSocialDesign(),
  ]);

  const canCreateIdea = hasPermission(
    ctx.permissions,
    PERMISSIONS.SOCIAL_IDEA_CREATE,
    ctx.roleCode
  );
  const canApproveIdea = hasPermission(
    ctx.permissions,
    PERMISSIONS.SOCIAL_IDEA_APPROVE,
    ctx.roleCode
  );
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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Content Ideas
          </h1>
          <span className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
            {ideas.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {canManageContent ? (
            <Link
              href="/content/planner"
              className="rounded-lg border border-border/70 bg-card px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Planner
            </Link>
          ) : null}
          <Link
            href="/content/calendar"
            className="rounded-lg border border-border/70 bg-card px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Calendar
          </Link>
        </div>
      </div>

      <ContentIdeaBoard
        initialIdeas={ideas}
        projects={options.projects}
        creators={options.creators}
        designers={options.designers}
        currentUserId={ctx.userId}
        canCreateIdea={canCreateIdea}
        canApproveIdea={canApproveIdea}
        canManageContent={canManageContent}
        canDeleteContent={canDeleteContent}
      />
    </div>
  );
}
