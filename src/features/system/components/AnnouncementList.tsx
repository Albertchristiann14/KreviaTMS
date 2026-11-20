"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Archive,
  BookOpen,
  CheckCheck,
  Clock,
  Eye,
  Info,
  Megaphone,
  Pin,
  PinOff,
  Plus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  archiveAnnouncementAction,
  markAnnouncementReadAction,
  togglePinAnnouncementAction,
} from "@/features/system/actions/announcement.actions";
import { AnnouncementEditorDialog } from "@/features/system/components/AnnouncementEditorDialog";
import type {
  AnnouncementItemDTO,
  AnnouncementsFeedData,
} from "@/features/system/types";

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  PROJECT_MANAGER: "Project Manager",
  STAFF_CREATOR: "Staff / Creator",
  DESIGNER: "Designer",
};

const PRIORITY_STYLE_MAP: Record<
  string,
  {
    badgeClass: string;
    dotClass: string;
    ringClass: string;
    icon: typeof Info;
    label: string;
  }
> = {
  URGENT: {
    badgeClass:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300",
    dotClass: "bg-rose-600",
    ringClass: "ring-rose-100 dark:ring-rose-500/25",
    icon: AlertTriangle,
    label: "URGENT",
  },
  IMPORTANT: {
    badgeClass:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300",
    dotClass: "bg-amber-500",
    ringClass: "ring-amber-100 dark:ring-amber-500/25",
    icon: Megaphone,
    label: "IMPORTANT",
  },
  INFO: {
    badgeClass:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300",
    dotClass: "bg-blue-600",
    ringClass: "ring-blue-100 dark:ring-blue-500/25",
    icon: Info,
    label: "INFO",
  },
};

function getInitials(name: string): string {
  const cleanTokens = (input: string) =>
    input
      .trim()
      .split(/\s+/)
      .map((part) => part.replace(/[^\p{L}\p{N}]/gu, ""))
      .filter(Boolean);

  const withoutParens = name.replace(/\([^)]*\)/g, " ");
  let parts = cleanTokens(withoutParens);
  if (parts.length === 0) {
    parts = cleanTokens(name);
  }
  if (parts.length === 0) return "KT";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function estimateReadTimeLabel(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 180));
  return `${minutes} min read`;
}

export interface AnnouncementListProps {
  initialData: AnnouncementsFeedData;
}

export function AnnouncementList({ initialData }: AnnouncementListProps) {
  const router = useRouter();
  const [tab, setTab] = useState<"active" | "archived">("active");
  const [editorOpen, setEditorOpen] = useState(false);
  const [receiptsItem, setReceiptsItem] = useState<AnnouncementItemDTO | null>(
    null
  );
  const [archiveTarget, setArchiveTarget] =
    useState<AnnouncementItemDTO | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const unreadCount = initialData.active.filter(
    (item) => !item.isReadByCurrentUser
  ).length;

  const handleMarkRead = async (item: AnnouncementItemDTO) => {
    setBusyId(item.id);
    try {
      const res = await markAnnouncementReadAction({
        announcementId: item.id,
      });
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      toast.success("Pengumuman ditandai sudah dibaca.");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const handleTogglePin = async (item: AnnouncementItemDTO) => {
    setBusyId(item.id);
    try {
      const res = await togglePinAnnouncementAction({
        announcementId: item.id,
        isPinned: !item.isPinned,
      });
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      toast.success(res.message ?? "Status pin diperbarui.");
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    setBusyId(archiveTarget.id);
    try {
      const res = await archiveAnnouncementAction({
        announcementId: archiveTarget.id,
      });
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      toast.success(res.message ?? "Pengumuman diarsipkan.");
      setArchiveTarget(null);
      router.refresh();
    } finally {
      setBusyId(null);
    }
  };

  const renderTimelineCard = (
    item: AnnouncementItemDTO,
    isArchivedTab: boolean
  ) => {
    const pMeta = PRIORITY_STYLE_MAP[item.priority] ?? PRIORITY_STYLE_MAP.INFO!;
    const PIcon = pMeta.icon;
    const readPct =
      item.totalTargetUsers > 0
        ? Math.min(
            100,
            Math.round((item.readCount / item.totalTargetUsers) * 100)
          )
        : 100;
    const isBusy = busyId === item.id;
    const isUnread = !item.isReadByCurrentUser && !isArchivedTab;
    const readTime = estimateReadTimeLabel(item.content);

    return (
      <div key={item.id} className="relative sm:pl-10">
        {/* Timeline Node */}
        <span
          className={`absolute top-6 left-[13px] hidden size-3 rounded-full ring-4 sm:block ${pMeta.dotClass} ${pMeta.ringClass}`}
          aria-hidden="true"
        />

        <article
          className={`group rounded-2xl border bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:bg-slate-900 ${
            isUnread
              ? "border-blue-300 border-l-4 border-l-blue-600 ring-1 ring-blue-500/10 dark:border-blue-500/40 dark:border-l-blue-500"
              : "border-slate-200/90 hover:border-slate-300 dark:border-slate-800 dark:hover:border-slate-700"
          }`}
        >
          {/* Top Metadata Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold tracking-wide ${pMeta.badgeClass}`}
              >
                <PIcon className="size-3" />
                <span>{pMeta.label}</span>
              </span>

              {item.isPinned ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300">
                  <Pin className="size-3" />
                  <span>Pinned</span>
                </span>
              ) : null}

              {isUnread ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-2xs">
                  <span className="size-1.5 rounded-full bg-white" />
                  <span>Unread</span>
                </span>
              ) : null}

              {item.targetRoleCodes.length === 0 ? (
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  All Team
                </span>
              ) : (
                item.targetRoleCodes.map((code) => (
                  <span
                    key={code}
                    className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {ROLE_DISPLAY_NAMES[code] ?? code}
                  </span>
                ))
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-mono text-[11px] text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <BookOpen className="size-3 text-slate-500" />
                <span>{readTime}</span>
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[11px]">
                <Clock className="size-3 text-slate-400" />
                <span>{formatDateTime(item.publishedAt)}</span>
              </span>
            </div>
          </div>

          {/* Title & Clean Author Tag */}
          <div className="mt-3.5 min-w-0 space-y-2.5">
            <h2 className="break-words text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
              {item.title}
            </h2>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="inline-flex max-w-full min-w-0 items-center gap-2 rounded-full border border-slate-200 bg-slate-50 py-1 pr-3 pl-1.5 dark:border-slate-700 dark:bg-slate-800">
                <Avatar size="sm" className="size-5 shrink-0">
                  <AvatarFallback className="bg-blue-600 text-[9px] font-bold text-white">
                    {getInitials(item.author.fullName)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate font-bold text-slate-800 dark:text-slate-100">
                  {item.author.fullName}
                </span>
                <span className="shrink-0 rounded bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700">
                  {ROLE_DISPLAY_NAMES[item.author.roleCode] ?? item.author.roleCode}
                </span>
              </div>

              {item.expiresAt ? (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  Exp {formatDateTime(item.expiresAt)}
                </span>
              ) : null}
            </div>
          </div>

          {/* Body */}
          <div className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed font-medium text-slate-700 dark:text-slate-300">
            {item.content}
          </div>

          {/* Read Receipt Meter + Footer Actions */}
          <div className="mt-5 flex flex-col gap-3.5 border-t border-slate-200/80 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex min-w-[170px] flex-1 items-center gap-2.5 sm:max-w-xs">
                <Users className="size-4 shrink-0 text-slate-500 dark:text-slate-400" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-semibold text-slate-600 dark:text-slate-400">
                      {item.readCount}/{item.totalTargetUsers} read
                    </span>
                    <span className="font-mono font-extrabold text-slate-900 dark:text-white">
                      {readPct}%
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all"
                      style={{ width: `${readPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {initialData.canManage ? (
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={() => setReceiptsItem(item)}
                  className="h-7 rounded-lg border-slate-200 bg-slate-50 px-2.5 text-xs font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <Eye className="size-3.5" />
                  <span>Receipts</span>
                </Button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {!isArchivedTab ? (
                item.isReadByCurrentUser ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
                    <CheckCheck className="size-3.5" />
                    <span>Read</span>
                  </span>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => void handleMarkRead(item)}
                    className="h-8 rounded-xl bg-blue-600 px-3.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-700"
                  >
                    <CheckCheck className="size-3.5" />
                    <span>Mark Read</span>
                  </Button>
                )
              ) : (
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {item.deletedAt
                    ? `Archived ${formatDateTime(item.deletedAt)}`
                    : "Expired"}
                </span>
              )}

              {initialData.canManage && !isArchivedTab ? (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={
                      isBusy ||
                      (!item.isPinned && initialData.activePinnedCount >= 3)
                    }
                    onClick={() => void handleTogglePin(item)}
                    title={
                      !item.isPinned && initialData.activePinnedCount >= 3
                        ? "Maksimal 3 pengumuman aktif dapat di-pin"
                        : undefined
                    }
                    className="h-8 rounded-xl border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    {item.isPinned ? (
                      <>
                        <PinOff className="size-3.5" />
                        <span>Unpin</span>
                      </>
                    ) : (
                      <>
                        <Pin className="size-3.5" />
                        <span>Pin</span>
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => setArchiveTarget(item)}
                    className="h-8 rounded-xl border-rose-200 bg-rose-50/70 px-3 text-xs font-semibold text-rose-700 hover:bg-rose-100 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
                  >
                    <Archive className="size-3.5" />
                    <span>Archive</span>
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        </article>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Control Header */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
        <Tabs
          value={tab}
          onValueChange={(val) => setTab(val as "active" | "archived")}
        >
          <TabsList className="h-9 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            <TabsTrigger
              value="active"
              className="rounded-lg px-3.5 text-xs font-semibold text-slate-600 data-active:bg-white data-active:font-bold data-active:text-slate-900 data-active:shadow-xs dark:text-slate-300 dark:data-active:bg-slate-900 dark:data-active:text-white"
            >
              <span>Active ({initialData.active.length})</span>
              {unreadCount > 0 ? (
                <Badge className="ml-1.5 h-4 rounded-full bg-blue-600 px-1.5 font-mono text-[10px] font-bold text-white">
                  {unreadCount}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger
              value="archived"
              className="rounded-lg px-3.5 text-xs font-semibold text-slate-600 data-active:bg-white data-active:font-bold data-active:text-slate-900 data-active:shadow-xs dark:text-slate-300 dark:data-active:bg-slate-900 dark:data-active:text-white"
            >
              Archived ({initialData.archived.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex h-8.5 items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 font-mono text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <Pin className="size-3.5 text-blue-600 dark:text-blue-400" />
            <span>Pinned {initialData.activePinnedCount}/3</span>
          </span>

          {initialData.canManage ? (
            <Button
              type="button"
              size="sm"
              onClick={() => setEditorOpen(true)}
              className="h-8.5 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
            >
              <Plus className="size-3.5" />
              <span>New Announcement</span>
            </Button>
          ) : null}
        </div>
      </div>

      {/* Timeline Feed */}
      <Tabs value={tab}>
        <TabsContent value="active" className="mt-0">
          {initialData.active.length === 0 ? (
            <EmptyState
              icon={Megaphone}
              title="Belum ada pengumuman aktif"
              className="border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900"
              action={
                initialData.canManage ? (
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setEditorOpen(true)}
                    className="rounded-xl bg-blue-600 font-semibold text-white hover:bg-blue-700"
                  >
                    <Plus className="size-4" />
                    <span>New Announcement</span>
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <div className="relative space-y-4 sm:before:absolute sm:before:top-6 sm:before:bottom-6 sm:before:left-[18px] sm:before:w-0.5 sm:before:bg-slate-200 dark:sm:before:bg-slate-800">
              {initialData.active.map((item) =>
                renderTimelineCard(item, false)
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="archived" className="mt-0">
          {initialData.archived.length === 0 ? (
            <EmptyState
              icon={Archive}
              title="Arsip pengumuman kosong"
              className="border-slate-200 bg-white py-12 dark:border-slate-800 dark:bg-slate-900"
            />
          ) : (
            <div className="relative space-y-4 sm:before:absolute sm:before:top-6 sm:before:bottom-6 sm:before:left-[18px] sm:before:w-0.5 sm:before:bg-slate-200 dark:sm:before:bg-slate-800">
              {initialData.archived.map((item) =>
                renderTimelineCard(item, true)
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AnnouncementEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        roles={initialData.roles}
        activePinnedCount={initialData.activePinnedCount}
      />

      {/* Read Receipts Detail Dialog */}
      <Dialog
        open={Boolean(receiptsItem)}
        onOpenChange={(open) => {
          if (!open) setReceiptsItem(null);
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl border-slate-200 bg-white sm:max-w-lg dark:border-slate-800 dark:bg-slate-900">
          <DialogHeader className="min-w-0">
            <DialogTitle className="text-lg font-extrabold text-slate-900 dark:text-white">
              Read Receipts
            </DialogTitle>
            <DialogDescription className="text-xs font-medium break-words text-slate-600 dark:text-slate-300">
              {receiptsItem?.title} · {receiptsItem?.readCount ?? 0}/
              {receiptsItem?.totalTargetUsers ?? 0} read
            </DialogDescription>
          </DialogHeader>

          {receiptsItem ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-bold tracking-wider text-emerald-700 uppercase dark:text-emerald-400">
                  Read ({receiptsItem.readers.length})
                </p>
                {receiptsItem.readers.length === 0 ? (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-600 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300">
                    Belum ada yang membaca.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-slate-50/50 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-800/40">
                    {receiptsItem.readers.map((reader) => (
                      <li
                        key={reader.userId}
                        className="flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs"
                      >
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Avatar size="sm" className="size-6 shrink-0">
                            <AvatarFallback className="bg-emerald-600 text-[10px] font-bold text-white">
                              {getInitials(reader.fullName)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900 dark:text-white">
                              {reader.fullName}
                            </p>
                            <p className="truncate text-[10px] font-medium text-slate-500 dark:text-slate-400">
                              {ROLE_DISPLAY_NAMES[reader.roleCode] ?? reader.roleCode}
                            </p>
                          </div>
                        </div>
                        <span className="shrink-0 font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                          {formatDateTime(reader.readAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs font-bold tracking-wider text-amber-700 uppercase dark:text-amber-400">
                  Pending ({receiptsItem.unreadUsers.length})
                </p>
                {receiptsItem.unreadUsers.length === 0 ? (
                  <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
                    Semua anggota target telah membaca.
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-200 rounded-xl border border-slate-200 bg-slate-50/50 dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-800/40">
                    {receiptsItem.unreadUsers.map((u) => (
                      <li
                        key={u.userId}
                        className="flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs"
                      >
                        <span className="min-w-0 flex-1 truncate font-semibold text-slate-900 dark:text-white">
                          {u.fullName}
                        </span>
                        <Badge
                          variant="outline"
                          className="shrink-0 rounded-full border-slate-200 bg-white text-[10px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                        >
                          {ROLE_DISPLAY_NAMES[u.roleCode] ?? u.roleCode}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null);
        }}
        title="Arsipkan Pengumuman?"
        description={`"${archiveTarget?.title ?? ""}" akan dipindahkan ke tab Archived.`}
        confirmLabel="Archive"
        variant="destructive"
        isLoading={Boolean(archiveTarget && busyId === archiveTarget.id)}
        onConfirm={handleConfirmArchive}
      />
    </div>
  );
}
