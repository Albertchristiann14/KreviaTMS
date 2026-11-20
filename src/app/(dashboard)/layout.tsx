import { cache, Suspense, type ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";
import { GlobalSlideOverHost } from "@/components/layout/GlobalSlideOverHost";
import {
  PinnedAnnouncementBanner,
  type PinnedAnnouncementItem,
} from "@/components/layout/PinnedAnnouncementBanner";
import { getAuthContext } from "@/server/auth/rbac";
import { prisma } from "@/server/db/prisma";

const getPinnedAnnouncements = cache(
  async (roleId: string): Promise<PinnedAnnouncementItem[]> => {
    try {
      const now = new Date();
      return await prisma.announcement.findMany({
        where: {
          isPinned: true,
          deletedAt: null,
          publishedAt: { lte: now },
          AND: [
            { OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] },
            {
              OR: [
                { targetRoleIds: { isEmpty: true } },
                { targetRoleIds: { has: roleId } },
              ],
            },
          ],
        },
        orderBy: { publishedAt: "desc" },
        take: 3,
        select: {
          id: true,
          title: true,
          content: true,
          priority: true,
        },
      });
    } catch {
      // Graceful fallback when DB schema/migrations are not applied yet
      return [];
    }
  }
);

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login");
  }

  const pinnedAnnouncements = await getPinnedAnnouncements(ctx.roleId);
  const permissions = Array.from(ctx.permissions);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        user={{
          id: ctx.userId,
          fullName: ctx.fullName,
          roleCode: ctx.roleCode,
        }}
        permissions={permissions}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <PinnedAnnouncementBanner announcements={pinnedAnnouncements} />
        <AppTopbar
          user={{
            id: ctx.userId,
            fullName: ctx.fullName,
            email: ctx.email,
            roleCode: ctx.roleCode,
            avatarUrl: ctx.avatarUrl,
          }}
          permissions={permissions}
        />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>

      <Suspense fallback={null}>
        <GlobalSlideOverHost />
      </Suspense>
    </div>
  );
}
