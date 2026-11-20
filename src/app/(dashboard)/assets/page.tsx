import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { AssetLibraryGrid } from "@/features/social-design/components/AssetLibraryGrid";
import { getAssetsPaginated } from "@/features/social-design/queries/asset.queries";
import { getSelectableOptionsForSocialDesign } from "@/features/social-design/queries/content.queries";
import { hasPermission, PERMISSIONS } from "@/lib/constants/permissions";
import { getAuthContext } from "@/server/auth/rbac";

export const dynamic = "force-dynamic";

export default async function AssetLibraryPage() {
  const ctx = await getAuthContext();
  if (!ctx) redirect("/login");

  if (
    !hasPermission(ctx.permissions, PERMISSIONS.ASSETS_LIBRARY_READ, ctx.roleCode)
  ) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Akses Asset Library Dibatasi"
        description="Anda tidak memiliki izin assets:library:read untuk mengakses repositori aset."
        action={
          <Link href="/" className="text-xs font-medium text-primary underline">
            Kembali ke Dashboard
          </Link>
        }
      />
    );
  }

  const [initialData, options] = await Promise.all([
    getAssetsPaginated({ page: 1, limit: 24 }),
    getSelectableOptionsForSocialDesign(),
  ]);

  const canManageAssets = hasPermission(
    ctx.permissions,
    PERMISSIONS.ASSETS_LIBRARY_MANAGE,
    ctx.roleCode
  );
  const isAdminOrPm =
    ctx.roleCode === "SUPER_ADMIN" || ctx.roleCode === "PROJECT_MANAGER";

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
            Asset Library
          </h1>
          <span className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
            {initialData.meta.totalItems}
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
            href="/design/reviews"
            className="rounded-lg border border-border/70 bg-card px-3 py-1.5 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            Reviews
          </Link>
        </div>
      </div>

      <AssetLibraryGrid
        initialData={initialData}
        projects={options.projects}
        currentUserId={ctx.userId}
        isAdminOrPm={isAdminOrPm}
        canManageAssets={canManageAssets}
      />
    </div>
  );
}
