import Link from "next/link";
import { redirect } from "next/navigation";
import { Megaphone, Pin, ShieldAlert, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { AnnouncementList } from "@/features/system/components/AnnouncementList";
import { getAnnouncementsFeed } from "@/features/system/queries/announcement.queries";
import { hasPermission, PERMISSIONS } from "@/lib/constants/permissions";
import { getAuthContext } from "@/server/auth/rbac";

export const dynamic = "force-dynamic";

export default async function AnnouncementsPage() {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login");
  }

  if (
    !hasPermission(
      ctx.permissions,
      PERMISSIONS.SYSTEM_ANNOUNCEMENT_READ,
      ctx.roleCode
    )
  ) {
    return (
      <Card className="mx-auto max-w-md rounded-2xl border-rose-200 bg-white shadow-sm dark:border-rose-500/30 dark:bg-slate-900">
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-2xl border border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-400">
            <ShieldAlert className="size-5" />
          </div>
          <h1 className="text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
            Access Denied (403)
          </h1>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Izin{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
              system:announcement:read
            </code>{" "}
            diperlukan.
          </p>
          <Link
            href="/"
            className="mt-2 inline-flex h-9 items-center rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            Back to Overview
          </Link>
        </CardContent>
      </Card>
    );
  }

  const feedData = await getAnnouncementsFeed(ctx);
  const unreadCount = feedData.active.filter(
    (item) => !item.isReadByCurrentUser
  ).length;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500"
        />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-600/20">
              <Megaphone className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Announcements
              </h1>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                Team broadcasts & read receipts
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-mono text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <span>{feedData.active.length} active</span>
            </span>

            {unreadCount > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-mono text-xs font-bold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300">
                <Sparkles className="size-3.5" />
                <span>{unreadCount} unread</span>
              </span>
            ) : null}

            <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 font-mono text-xs font-bold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300">
              <Pin className="size-3.5" />
              <span>{feedData.activePinnedCount}/3 pinned</span>
            </span>
          </div>
        </div>
      </section>

      <AnnouncementList initialData={feedData} />
    </div>
  );
}
