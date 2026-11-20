"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, Circle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/system/actions/notification.actions";
import {
  UNREAD_NOTIFICATIONS_QUERY_KEY,
  useUnreadNotifications,
} from "@/features/system/hooks/useUnreadNotifications";

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) return "Baru saja";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay} hari lalu`;
}

export function NotificationBellPopover() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading } = useUnreadNotifications();

  const unreadCount = data?.unreadCount ?? 0;
  const items = data?.items ?? [];

  const markOneMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await markNotificationReadAction({ notificationId });
      if (!res.success) {
        throw new Error(res.error.message);
      }
      return res.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: UNREAD_NOTIFICATIONS_QUERY_KEY,
      });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const markAllMutation = useMutation({
    mutationFn: async () => {
      const res = await markAllNotificationsReadAction({});
      if (!res.success) {
        throw new Error(res.error.message);
      }
      return res.data;
    },
    onSuccess: (res) => {
      if (res.updatedCount > 0) {
        toast.success(`${res.updatedCount} notifikasi ditandai sudah dibaca.`);
      }
      void queryClient.invalidateQueries({
        queryKey: UNREAD_NOTIFICATIONS_QUERY_KEY,
      });
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Notifikasi"
          />
        }
      >
        <Bell className="size-4" />
        {unreadCount > 0 ? (
          <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 font-mono text-[10px] leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </Badge>
        ) : null}
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 p-0 sm:w-96">
        <PopoverHeader className="flex flex-row items-center justify-between gap-2 px-4 py-3">
          <div>
            <PopoverTitle className="text-sm font-semibold">
              Notifikasi
            </PopoverTitle>
            <PopoverDescription className="text-xs">
              {unreadCount > 0
                ? `${unreadCount} belum dibaca`
                : "Semua notifikasi telah dibaca"}
            </PopoverDescription>
          </div>

          {unreadCount > 0 ? (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              disabled={markAllMutation.isPending}
              onClick={() => markAllMutation.mutate()}
              className="gap-1 text-xs text-primary"
            >
              {markAllMutation.isPending ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <CheckCheck className="size-3.5" />
              )}
              <span>Tandai semua</span>
            </Button>
          ) : null}
        </PopoverHeader>

        <Separator />

        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 3 }).map((_, idx) => (
                <Skeleton key={idx} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="px-4 py-8 text-center text-xs text-muted-foreground">
              Tidak ada notifikasi baru saat ini.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.slice(0, 15).map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => {
                      markOneMutation.mutate(item.id);
                      if (item.actionUrl) {
                        router.push(item.actionUrl);
                      }
                    }}
                    className="flex w-full items-start gap-2.5 px-4 py-3 text-left transition-colors hover:bg-muted/60"
                  >
                    <Circle
                      className="mt-1.5 size-2 shrink-0 fill-primary text-primary"
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-xs font-semibold text-foreground">
                          {item.title}
                        </p>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {item.message}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <Separator />

        <div className="p-2">
          <Link
            href="/notifications"
            className="flex w-full items-center justify-center rounded-md py-1.5 text-xs font-medium text-primary transition-colors hover:bg-muted"
          >
            Lihat semua di /notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
