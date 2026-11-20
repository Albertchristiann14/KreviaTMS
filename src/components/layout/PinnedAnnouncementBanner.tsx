"use client";

import { useCallback, useSyncExternalStore, useTransition } from "react";
import Link from "next/link";
import { AlertTriangle, Check, Info, Megaphone, X } from "lucide-react";
import { toast } from "sonner";
import { markAnnouncementReadAction } from "@/features/system/actions/announcement.actions";
import { cn } from "@/lib/utils";

export interface PinnedAnnouncementItem {
  id: string;
  title: string;
  content: string;
  priority: "INFO" | "IMPORTANT" | "URGENT" | string;
}

export interface PinnedAnnouncementBannerProps {
  announcements: PinnedAnnouncementItem[];
}

const STORAGE_KEY = "ktms:dismissed-pinned-announcements";
const DISMISS_EVENT = "ktms:dismissed-announcements-changed";
const SERVER_SNAPSHOT = "[]";

function subscribeDismissedStore(callback: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  const onChange = () => callback();
  window.addEventListener("storage", onChange);
  window.addEventListener(DISMISS_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(DISMISS_EVENT, onChange);
  };
}

function getDismissedSnapshot(): string {
  try {
    return window.sessionStorage.getItem(STORAGE_KEY) ?? SERVER_SNAPSHOT;
  } catch {
    return SERVER_SNAPSHOT;
  }
}

const PRIORITY_STYLES: Record<
  string,
  {
    container: string;
    badge: string;
    dot: string;
    desc: string;
    action: string;
    icon: typeof Info;
  }
> = {
  URGENT: {
    container:
      "border-rose-200 bg-rose-50 text-rose-950 dark:border-rose-500/30 dark:bg-rose-950/40 dark:text-rose-100",
    badge:
      "border border-rose-300 bg-rose-100 text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/20 dark:text-rose-200",
    dot: "bg-rose-600 dark:bg-rose-400 animate-pulse",
    desc: "text-rose-800 dark:text-rose-200",
    action:
      "border border-rose-200 bg-white/90 text-rose-800 hover:bg-white dark:border-rose-500/30 dark:bg-slate-900/70 dark:text-rose-200 dark:hover:bg-slate-900",
    icon: AlertTriangle,
  },
  IMPORTANT: {
    container:
      "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-100",
    badge:
      "border border-amber-300 bg-amber-100 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/20 dark:text-amber-200",
    dot: "bg-amber-600 dark:bg-amber-400",
    desc: "text-amber-900 dark:text-amber-200",
    action:
      "border border-amber-200 bg-white/90 text-amber-900 hover:bg-white dark:border-amber-500/30 dark:bg-slate-900/70 dark:text-amber-200 dark:hover:bg-slate-900",
    icon: Megaphone,
  },
  INFO: {
    container:
      "border-blue-200 bg-blue-50 text-blue-950 dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-100",
    badge:
      "border border-blue-300 bg-blue-100 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/20 dark:text-blue-200",
    dot: "bg-blue-600 dark:bg-blue-400",
    desc: "text-blue-800 dark:text-blue-200",
    action:
      "border border-blue-200 bg-white/90 text-blue-800 hover:bg-white dark:border-blue-500/30 dark:bg-slate-900/70 dark:text-blue-200 dark:hover:bg-slate-900",
    icon: Info,
  },
};

export function PinnedAnnouncementBanner({
  announcements,
}: PinnedAnnouncementBannerProps) {
  const [, startTransition] = useTransition();
  const rawDismissed = useSyncExternalStore(
    subscribeDismissedStore,
    getDismissedSnapshot,
    () => SERVER_SNAPSHOT
  );

  let dismissedIds: string[] = [];
  try {
    const parsed = JSON.parse(rawDismissed) as unknown;
    if (Array.isArray(parsed)) {
      dismissedIds = parsed.filter((v): v is string => typeof v === "string");
    }
  } catch {
    dismissedIds = [];
  }

  const handleAcknowledgeAndDismiss = useCallback(
    (item: PinnedAnnouncementItem) => {
      try {
        const currentRaw =
          window.sessionStorage.getItem(STORAGE_KEY) ?? SERVER_SNAPSHOT;
        const parsed = JSON.parse(currentRaw) as unknown;
        const current = Array.isArray(parsed)
          ? parsed.filter((v): v is string => typeof v === "string")
          : [];
        const next = current.includes(item.id)
          ? current
          : [...current, item.id];
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new Event(DISMISS_EVENT));
      } catch {
        // Ignore storage errors
      }

      startTransition(async () => {
        const res = await markAnnouncementReadAction({
          announcementId: item.id,
        });
        if (res.success) {
          toast.success("Pengumuman ditandai sudah dibaca.");
        }
      });
    },
    []
  );

  const visibleItems = announcements
    .filter((item) => !dismissedIds.includes(item.id))
    .slice(0, 3);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1.5 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900 lg:px-6">
      {visibleItems.map((item) => {
        const style = PRIORITY_STYLES[item.priority] ?? PRIORITY_STYLES.INFO!;
        const Icon = style.icon;
        return (
          <div
            key={item.id}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl border px-3 py-1.5 text-xs transition-colors",
              style.container
            )}
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase",
                  style.badge
                )}
              >
                <span
                  className={cn("size-1.5 rounded-full", style.dot)}
                  aria-hidden="true"
                />
                <Icon className="size-3" aria-hidden="true" />
                <span>{item.priority}</span>
              </span>
              <Link
                href="/announcements"
                className="truncate font-bold tracking-tight hover:underline"
              >
                {item.title}
              </Link>
              <span className={cn("hidden truncate font-medium md:inline", style.desc)}>
                — {item.content}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAcknowledgeAndDismiss(item)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors",
                  style.action
                )}
                title="Tandai sudah dibaca & sembunyikan"
              >
                <Check className="size-3" />
                <span className="hidden sm:inline">Dibaca</span>
              </button>

              <button
                type="button"
                onClick={() => handleAcknowledgeAndDismiss(item)}
                className={cn(
                  "rounded-lg p-1 transition-colors",
                  style.action
                )}
                aria-label={`Tutup dan tandai dibaca pengumuman ${item.title}`}
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
