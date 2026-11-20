"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  Bell,
  BellOff,
  Check,
  CheckCheck,
  CheckSquare,
  Circle,
  ExternalLink,
  Loader2,
  Palette,
  Search,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/features/system/actions/notification.actions";
import { UNREAD_NOTIFICATIONS_QUERY_KEY } from "@/features/system/hooks/useUnreadNotifications";
import type {
  AuditModule,
  NotificationFeedItemDTO,
} from "@/features/system/types";

const MODULE_LABELS: Record<"ALL" | AuditModule, string> = {
  ALL: "Semua Modul",
  TASKS: "Modul A: Tasks",
  TEAM_KPI: "Modul B: Team & KPI",
  SOCIAL_DESIGN: "Modul C: Social & Design",
  SYSTEM: "Modul D: System",
};

const MODULE_META: Record<
  AuditModule,
  { badgeClass: string; icon: typeof Bell; label: string }
> = {
  TASKS: {
    badgeClass: "border-blue-200 bg-blue-50 text-blue-700",
    icon: CheckSquare,
    label: "Tasks",
  },
  TEAM_KPI: {
    badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    icon: Award,
    label: "Team & KPI",
  },
  SOCIAL_DESIGN: {
    badgeClass: "border-violet-200 bg-violet-50 text-violet-700",
    icon: Palette,
    label: "Social & Design",
  },
  SYSTEM: {
    badgeClass: "border-slate-200 bg-slate-100 text-slate-700",
    icon: Settings,
    label: "System",
  },
};

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export interface NotificationFeedProps {
  initialItems: NotificationFeedItemDTO[];
  initialUnreadCount: number;
}

export function NotificationFeed({
  initialItems,
  initialUnreadCount,
}: NotificationFeedProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [items, setItems] = useState<NotificationFeedItemDTO[]>(initialItems);
  const [readFilter, setReadFilter] = useState<"all" | "unread">("all");
  const [moduleFilter, setModuleFilter] = useState<"ALL" | AuditModule>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const unreadCount = useMemo(
    () =>
      items.some((i) => !i.isRead)
        ? items.filter((i) => !i.isRead).length
        : Math.min(0, initialUnreadCount),
    [items, initialUnreadCount]
  );

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (readFilter === "unread" && item.isRead) return false;
      if (moduleFilter !== "ALL" && item.moduleCategory !== moduleFilter) {
        return false;
      }
      if (q) {
        const hay =
          `${item.title} ${item.message} ${item.type} ${item.actor?.fullName ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, readFilter, moduleFilter, searchQuery]);

  const markOneMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const res = await markNotificationReadAction({ notificationId });
      if (!res.success) {
        throw new Error(res.error.message);
      }
      return res.data;
    },
    onSuccess: (_data, notificationId) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === notificationId
            ? { ...item, isRead: true, readAt: new Date().toISOString() }
            : item
        )
      );
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
      const nowIso = new Date().toISOString();
      setItems((prev) =>
        prev.map((item) =>
          item.isRead ? item : { ...item, isRead: true, readAt: nowIso }
        )
      );
      toast.success(
        res.updatedCount > 0
          ? `${res.updatedCount} notifikasi ditandai sudah dibaca.`
          : "Semua notifikasi sudah terbaca."
      );
      void queryClient.invalidateQueries({
        queryKey: UNREAD_NOTIFICATIONS_QUERY_KEY,
      });
      router.refresh();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const handleOpenNotification = (item: NotificationFeedItemDTO) => {
    if (!item.isRead) {
      markOneMutation.mutate(item.id);
    }
    if (item.actionUrl) {
      router.push(item.actionUrl);
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls & Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={readFilter}
          onValueChange={(val) => setReadFilter(val as "all" | "unread")}
        >
          <TabsList>
            <TabsTrigger value="all">Semua ({items.length})</TabsTrigger>
            <TabsTrigger value="unread">
              Belum Dibaca ({unreadCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari notifikasi..."
              className="bg-card pl-8"
            />
          </div>

          <Select
            value={moduleFilter}
            onValueChange={(val) => {
              if (val !== null) setModuleFilter(val as "ALL" | AuditModule);
            }}
            items={MODULE_LABELS}
          >
            <SelectTrigger className="w-48 min-w-0 overflow-hidden bg-card *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
              <SelectValue placeholder="Semua Modul" className="block min-w-0 truncate" />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(MODULE_LABELS) as Array<"ALL" | AuditModule>).map(
                (key) => (
                  <SelectItem key={key} value={key}>
                    {MODULE_LABELS[key]}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            disabled={unreadCount === 0 || markAllMutation.isPending}
            onClick={() => markAllMutation.mutate()}
          >
            {markAllMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CheckCheck className="size-4" />
            )}
            <span>Tandai Semua Dibaca</span>
          </Button>
        </div>
      </div>

      {/* Feed List */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={readFilter === "unread" ? BellOff : Bell}
          title={
            readFilter === "unread"
              ? "Tidak ada notifikasi yang belum dibaca"
              : "Belum ada riwayat notifikasi"
          }
          description={
            readFilter === "unread"
              ? "Anda sudah membaca semua pembaruan terbaru dari task, desain, KPI, dan pengumuman."
              : "Notifikasi akan muncul di sini saat Anda ditugaskan task, menerima komentar, atau ada pengumuman baru."
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {filteredItems.map((item) => {
                const modMeta = MODULE_META[item.moduleCategory];
                const ModIcon = modMeta.icon;
                return (
                  <li
                    key={item.id}
                    className={`flex flex-col gap-3 p-4 transition-colors sm:flex-row sm:items-start sm:justify-between ${
                      !item.isRead ? "bg-primary/[0.03]" : "hover:bg-muted/40"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenNotification(item)}
                      className="flex min-w-0 flex-1 items-start gap-3 text-left"
                    >
                      <div className="mt-1 shrink-0">
                        {!item.isRead ? (
                          <Circle
                            className="size-2.5 fill-primary text-primary"
                            aria-label="Belum dibaca"
                          />
                        ) : (
                          <Check
                            className="size-3.5 text-muted-foreground"
                            aria-label="Sudah dibaca"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`gap-1 text-[10px] ${modMeta.badgeClass}`}
                          >
                            <ModIcon className="size-3" />
                            <span>{modMeta.label}</span>
                          </Badge>
                          <span className="font-mono text-[10px] text-muted-foreground">
                            {item.type}
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            · {formatDateTime(item.createdAt)}
                          </span>
                        </div>

                        <p
                          className={`break-words text-sm ${
                            !item.isRead
                              ? "font-semibold text-foreground"
                              : "font-medium text-foreground/90"
                          }`}
                        >
                          {item.title}
                        </p>

                        <p className="break-words text-xs leading-relaxed text-muted-foreground">
                          {item.message}
                        </p>

                        {item.actor ? (
                          <p className="text-[11px] text-muted-foreground">
                            Dipicu oleh{" "}
                            <span className="font-medium text-foreground">
                              {item.actor.fullName}
                            </span>
                          </p>
                        ) : null}
                      </div>
                    </button>

                    <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
                      {!item.isRead ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          disabled={markOneMutation.isPending}
                          onClick={() => markOneMutation.mutate(item.id)}
                        >
                          <Check className="size-3.5" />
                          <span>Tandai Dibaca</span>
                        </Button>
                      ) : null}

                      <Button
                        type="button"
                        variant="outline"
                        size="xs"
                        onClick={() => handleOpenNotification(item)}
                      >
                        <span>Buka</span>
                        <ExternalLink className="size-3" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
