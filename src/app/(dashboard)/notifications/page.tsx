import { redirect } from "next/navigation";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NotificationFeed } from "@/features/system/components/NotificationFeed";
import { getNotificationsForUser } from "@/features/system/queries/dashboard.queries";
import { getAuthContext } from "@/server/auth/rbac";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login");
  }

  const { items, unreadCount } = await getNotificationsForUser(ctx.userId);

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[11px] font-semibold">
            Modul D: System
          </Badge>
          <Badge variant="outline" className="font-mono text-[11px]">
            FR-D03 · Actionable Deep-Links
          </Badge>
        </div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
          <Bell className="size-6 text-primary" aria-hidden="true" />
          <span>Notification Center</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          Seluruh riwayat notifikasi in-app dari task, brief desain, evaluasi
          KPI, dan pengumuman tim beserta tautan langsung ke detail terkait.
        </p>
      </div>

      <NotificationFeed
        initialItems={items}
        initialUnreadCount={unreadCount}
      />
    </div>
  );
}
