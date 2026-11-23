import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { DesignWorkspaceList } from "@/features/social-design/components/DesignWorkspaceList";
import { getSelectableOptionsForSocialDesign } from "@/features/social-design/queries/content.queries";
import { getDesignWorkspaceBriefs } from "@/features/social-design/queries/design.queries";
import {
  hasAnyPermission,
  hasPermission,
  PERMISSIONS,
} from "@/lib/constants/permissions";
import { getAuthContext } from "@/server/auth/rbac";

export const dynamic = "force-dynamic";

export default async function DesignWorkspacePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  if (
    !hasPermission(ctx.permissions, PERMISSIONS.DESIGN_BRIEF_READ, ctx.roleCode)
  ) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Akses Design Workspace Dibatasi"
        description="Anda tidak memiliki izin design:brief:read untuk mengakses Design Workspace."
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

  const [briefs, options] = await Promise.all([
    getDesignWorkspaceBriefs({
      currentUserId: ctx.userId,
      roleCode: ctx.roleCode,
    }),
    getSelectableOptionsForSocialDesign(),
  ]);

  const canManageBriefs = hasPermission(
    ctx.permissions,
    PERMISSIONS.DESIGN_BRIEF_MANAGE,
    ctx.roleCode
  );
  const canSubmitDesign = hasPermission(
    ctx.permissions,
    PERMISSIONS.DESIGN_SUBMISSION_CREATE,
    ctx.roleCode
  );
  const canApproveDesign = hasPermission(
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
            Design Workspace
          </h1>
          <span className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
            {briefs.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {canApproveDesign ? (
            <Link
              href="/design/reviews"
              className="rounded-lg border border-border/70 bg-card px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              Review Queue
            </Link>
          ) : null}
          <Link
            href="/assets"
            className="rounded-lg border border-border/70 bg-card px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Assets
          </Link>
        </div>
      </div>

      <DesignWorkspaceList
        initialBriefs={briefs}
        projects={options.projects}
        designers={options.designers}
        currentUserId={ctx.userId}
        canManageBriefs={canManageBriefs}
        canSubmitDesign={canSubmitDesign}
        canApproveDesign={canApproveDesign}
        canDeleteBriefs={canDeleteBriefs}
        initialBriefId={initialBriefId}
      />
    </div>
  );
}
