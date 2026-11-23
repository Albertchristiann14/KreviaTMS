"use client";

import { useQuery } from "@tanstack/react-query";

export interface UnreadNotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadNotificationsPayload {
  unreadCount: number;
  items: UnreadNotificationItem[];
}

export const UNREAD_NOTIFICATIONS_QUERY_KEY = [
  "notifications",
  "unread",
] as const;

async function fetchUnreadNotifications(): Promise<UnreadNotificationsPayload> {
  const res = await fetch("/api/notifications/unread", {
    method: "GET",
    cache: "no-cache",
  });

  if (!res.ok) {
    throw new Error("Gagal mengambil daftar notifikasi.");
  }

  return (await res.json()) as UnreadNotificationsPayload;
}

export function useUnreadNotifications(enabled = true) {
  return useQuery({
    queryKey: UNREAD_NOTIFICATIONS_QUERY_KEY,
    queryFn: fetchUnreadNotifications,
    enabled,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
}
