import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { DesignReviewQueueClient } from "@/features/social-design/components/DesignReviewQueueClient";
import { getDesignReviewQueue } from "@/features/social-design/queries/design.queries";
import {
  hasAnyPermission,
  hasPermission,
  PERMISSIONS,
} from "@/lib/constants/permissions";
import { getAuthContext } from "@/server/auth/rbac";

export const dynamic = "force-dynamic";

export default async function DesignReviewsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  const canAccess = hasAnyPermission(
    ctx.permissions,
    [PERMISSIONS.DESIGN_SUBMISSION_APPROVE, PERMISSIONS.SOCIAL_CONTENT_MANAGE],
    ctx.roleCode
  );

  if (!canAccess) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Akses Design Review Queue Dibatasi"
        description="Halaman ini hanya tersedia bagi Project Manager, Super Admin, dan Staff Creator (read-only)."
        action={
          <Link href="/" className="text-xs font-medium text-primary underline">
            Kembali ke Dashboard
          </Link>
        }
      />
    );
  }

  const sp = await searchParams;
  const initialBriefId =
    typeof sp.briefId === "string" ? sp.briefId.trim() : undefined;

  const briefs = await getDesignReviewQueue();
  const canApprove = hasPermission(
    ctx.permissions,
    PERMISSIONS.DESIGN_SUBMISSION_APPROVE,
    ctx.roleCode
  );
  const canDeleteBriefs = hasAnyPermission(
    ctx.permissions,
    [PERMISSIONS.DESIGN_BRIEF_MANAGE, PERMISSIONS.SOCIAL_CONTENT_DELETE],
    ctx.roleCode
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Design Reviews
          </h1>
          <span className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
            {briefs.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Link
            href="/design/workspace"
            className="rounded-lg border border-border/70 bg-card px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Workspace
          </Link>
          <Link
            href="/assets"
            className="rounded-lg border border-border/70 bg-card px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Assets
          </Link>
        </div>
      </div>

      <DesignReviewQueueClient
        initialBriefs={briefs}
        currentUserId={ctx.userId}
        canApprove={canApprove}
        canDeleteBriefs={canDeleteBriefs}
        initialBriefId={initialBriefId}
      />
    </div>
  );
}
