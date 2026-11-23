"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ContentStatus, SocialPlatform } from "@prisma/client";
import {
  ArrowRight,
  Calendar,
  CalendarRange,
  Edit3,
  Lightbulb,
  NotebookPen,
  Palette,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  DataTable,
  createDataTableColumnHelper,
  type DataTableColumnDef,
} from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteContentPlanAction } from "@/features/social-design/actions/content-plan.actions";
import { ContentPlanFormDrawer } from "@/features/social-design/components/ContentPlanFormDrawer";
import {
  ChannelPill,
  CreativeAvatar,
} from "@/features/social-design/components/StudioPrimitives";
import {
  CONTENT_FORMAT_META,
  SOCIAL_PLATFORM_META,
  SOCIAL_PLATFORM_VALUES,
  getPillarLabel,
} from "@/features/social-design/constants";
import type {
  ContentIdeaDTO,
  ContentPlanItemDTO,
  SelectableProjectOption,
  SelectableUserOption,
} from "@/features/social-design/types";
import { formatDateTimeId } from "@/features/social-design/utils";
import { cn } from "@/lib/utils";

export interface ContentPlannerClientProps {
  initialItems: ContentPlanItemDTO[];
  approvedIdeas: ContentIdeaDTO[];
  projects: SelectableProjectOption[];
  creators: SelectableUserOption[];
  designers: SelectableUserOption[];
  currentUserId: string;
  canDeleteContent?: boolean;
}

type StageGroup =
  | "ALL"
  | "PLANNING"
  | "DESIGN"
  | "READY"
  | "SCHEDULED"
  | "PUBLISHED";

const STAGE_PILLS: Array<{
  key: StageGroup;
  label: string;
  dotClass: string;
  matches: (status: ContentStatus) => boolean;
}> = [
  {
    key: "ALL",
    label: "Semua",
    dotClass: "bg-slate-600 dark:bg-slate-300",
    matches: () => true,
  },
  {
    key: "PLANNING",
    label: "Planning",
    dotClass: "bg-sky-600 dark:bg-sky-400",
    matches: (s) => s === "PLANNING",
  },
  {
    key: "DESIGN",
    label: "Design",
    dotClass: "bg-amber-500 dark:bg-amber-400",
    matches: (s) =>
      s === "IN_DESIGN" || s === "DESIGN_REVIEW" || s === "DESIGN_REVISION",
  },
  {
    key: "READY",
    label: "Siap Tayang",
    dotClass: "bg-teal-600 dark:bg-teal-400",
    matches: (s) => s === "READY_TO_PUBLISH",
  },
  {
    key: "SCHEDULED",
    label: "Scheduled",
    dotClass: "bg-cyan-600 dark:bg-cyan-400",
    matches: (s) => s === "SCHEDULED",
  },
  {
    key: "PUBLISHED",
    label: "Published",
    dotClass: "bg-emerald-600 dark:bg-emerald-400",
    matches: (s) => s === "PUBLISHED",
  },
];

const VIBRANT_CHANNEL_PILL_CLASS: Record<SocialPlatform, string> = {
  INSTAGRAM:
    "border-transparent bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 text-white font-bold shadow-xs [&>span:first-child]:bg-none [&>span:first-child]:bg-white/25 [&>span:first-child]:text-white",
  TIKTOK:
    "border-cyan-500/50 bg-slate-950 text-cyan-300 font-bold shadow-xs dark:border-cyan-400/50 [&>span:first-child]:bg-cyan-400/15 [&>span:first-child]:text-cyan-300",
  YOUTUBE:
    "border-red-700/30 bg-red-600 text-white font-bold shadow-xs [&>span:first-child]:bg-white/20 [&>span:first-child]:text-white",
  LINKEDIN:
    "border-blue-700/30 bg-blue-600 text-white font-bold shadow-xs [&>span:first-child]:bg-white/20 [&>span:first-child]:text-white",
  X_TWITTER:
    "border-slate-700 bg-slate-900 text-white font-bold shadow-xs dark:bg-slate-800 [&>span:first-child]:bg-white/15 [&>span:first-child]:text-white",
  FACEBOOK:
    "border-indigo-700/30 bg-indigo-600 text-white font-bold shadow-xs [&>span:first-child]:bg-white/20 [&>span:first-child]:text-white",
  WEBSITE_BLOG:
    "border-emerald-700/30 bg-emerald-600 text-white font-bold shadow-xs [&>span:first-child]:bg-white/20 [&>span:first-child]:text-white",
};

const columnHelper = createDataTableColumnHelper<ContentPlanItemDTO>();

export function ContentPlannerClient({
  initialItems,
  approvedIdeas,
  projects,
  creators,
  designers,
  currentUserId,
  canDeleteContent = false,
}: ContentPlannerClientProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ContentPlanItemDTO | null>(
    null
  );
  const [promotingIdea, setPromotingIdea] = useState<ContentIdeaDTO | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<ContentPlanItemDTO | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [stageFilter, setStageFilter] = useState<StageGroup>("ALL");
  const [platformFilter, setPlatformFilter] = useState<"ALL" | SocialPlatform>(
    "ALL"
  );

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteContentPlanAction({
        contentItemId: deleteTarget.id,
      });
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      toast.success(res.message ?? "Content plan berhasil dihapus.");
      setDeleteTarget(null);
      router.refresh();
    } catch {
      toast.error("Gagal menghapus Content Plan.");
    } finally {
      setIsDeleting(false);
    }
  };

  const stageCounts = useMemo(() => {
    const counts: Record<StageGroup, number> = {
      ALL: initialItems.length,
      PLANNING: 0,
      DESIGN: 0,
      READY: 0,
      SCHEDULED: 0,
      PUBLISHED: 0,
    };
    for (const item of initialItems) {
      for (const pill of STAGE_PILLS) {
        if (pill.key !== "ALL" && pill.matches(item.status)) {
          counts[pill.key] += 1;
        }
      }
    }
    return counts;
  }, [initialItems]);

  const filteredItems = useMemo(() => {
    const stageRule =
      STAGE_PILLS.find((p) => p.key === stageFilter)?.matches ?? (() => true);
    return initialItems.filter((item) => {
      if (!stageRule(item.status)) return false;
      if (platformFilter !== "ALL" && item.platform !== platformFilter) {
        return false;
      }
      return true;
    });
  }, [initialItems, stageFilter, platformFilter]);

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("title", {
          header: "Konten",
          cell: (info) => {
            const row = info.row.original;
            return (
              <div className="min-w-[220px] max-w-[360px] space-y-1.5 py-0.5">
                <p className="truncate font-bold text-slate-900 dark:text-white">
                  {row.title}
                </p>
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <span
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: row.projectColorHex || "#64748b" }}
                    />
                    {row.projectCode ?? "UMUM"}
                  </span>
                  <span className="rounded-md border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                    {CONTENT_FORMAT_META[row.contentFormat].label}
                  </span>
                  {row.contentPillar ? (
                    <span className="font-medium text-slate-600 dark:text-slate-300">
                      {getPillarLabel(row.contentPillar)}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          },
        }),
        columnHelper.accessor("platform", {
          header: "Channel",
          cell: (info) => {
            const platform = info.row.original.platform;
            return (
              <ChannelPill
                platform={platform}
                className={VIBRANT_CHANNEL_PILL_CLASS[platform]}
              />
            );
          },
        }),
        columnHelper.accessor("status", {
          header: "Status",
          cell: (info) => (
            <StatusBadge domain="content" value={info.row.original.status} />
          ),
        }),
        columnHelper.accessor("creatorName", {
          header: "Creator",
          cell: (info) => {
            const row = info.row.original;
            return (
              <div className="flex min-w-0 items-center gap-2.5">
                <CreativeAvatar
                  name={row.creatorName}
                  avatarUrl={row.creatorAvatarUrl}
                  size="sm"
                  className="ring-2 ring-slate-200 dark:ring-slate-700"
                />
                <span className="truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                  {row.creatorName}
                </span>
              </div>
            );
          },
        }),
        columnHelper.display({
          id: "brief",
          header: "Desain & Task",
          cell: (info) => {
            const row = info.row.original;
            return (
              <div className="space-y-1.5">
                {row.requiresDesign && row.designBrief ? (
                  <div className="flex items-center gap-1.5">
                    <StatusBadge
                      domain="design"
                      value={row.designBrief.status}
                    />
                    <Link
                      href={`/design/workspace?briefId=${row.designBrief.id}`}
                      className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                    >
                      Brief →
                    </Link>
                  </div>
                ) : (
                  <span className="inline-flex rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    Copy Only
                  </span>
                )}
                {row.linkedTasks.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {row.linkedTasks.map((t) => (
                      <Badge
                        key={t.id}
                        variant="secondary"
                        className="border border-slate-200 bg-slate-100 font-mono text-[10px] font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {t.taskCode}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          },
        }),
        columnHelper.accessor("plannedPublishAt", {
          header: "Jadwal Tayang",
          cell: (info) => (
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-2.5 py-1 font-mono text-xs font-semibold tabular-nums text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Calendar className="size-3.5 text-slate-500 dark:text-slate-400" />
              <span>{formatDateTimeId(info.row.original.plannedPublishAt)}</span>
            </span>
          ),
        }),
        columnHelper.display({
          id: "actions",
          header: "",
          cell: (info) => (
            <div className="flex justify-end gap-1.5">
              <Button
                type="button"
                size="xs"
                variant="outline"
                onClick={() => {
                  setPromotingIdea(null);
                  setEditingItem(info.row.original);
                  setDrawerOpen(true);
                }}
                className="h-7 gap-1 rounded-lg border-slate-200 bg-white font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Edit3 className="size-3" />
                <span>Edit</span>
              </Button>
              {canDeleteContent ? (
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => setDeleteTarget(info.row.original)}
                  aria-label={`Hapus ${info.row.original.title}`}
                  title="Hapus Content Plan"
                  className="size-7 rounded-lg text-slate-400 hover:bg-rose-50 hover:text-destructive dark:text-slate-500 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              ) : null}
            </div>
          ),
        }),
      ]) as DataTableColumnDef<ContentPlanItemDTO>[],
    [canDeleteContent]
  );

  return (
    <div className="space-y-5">
      {/* Studio Action & Filter Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800/80">
            {STAGE_PILLS.map((pill) => {
              const active = stageFilter === pill.key;
              return (
                <button
                  key={pill.key}
                  type="button"
                  onClick={() => setStageFilter(pill.key)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all",
                    active
                      ? "bg-white font-bold text-slate-900 shadow-xs ring-1 ring-slate-200 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
                      : "font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  )}
                >
                  <span className={cn("size-2 rounded-full", pill.dotClass)} />
                  <span>{pill.label}</span>
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.2 font-mono text-[10px] font-bold",
                      active
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                        : "bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                    )}
                  >
                    {stageCounts[pill.key]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/content/calendar"
              className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <CalendarRange className="size-3.5 text-blue-600 dark:text-blue-400" />
              <span>Calendar</span>
            </Link>
            <Button
              type="button"
              onClick={() => {
                setEditingItem(null);
                setPromotingIdea(null);
                setDrawerOpen(true);
              }}
              className="gap-1.5 rounded-xl bg-blue-600 font-bold text-white shadow-sm hover:bg-blue-700"
            >
              <Plus className="size-4" />
              <span>Plan Baru</span>
            </Button>
          </div>
        </div>

        {/* Channel Filter Strip */}
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200/80 pt-3 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setPlatformFilter("ALL")}
            className={cn(
              "rounded-full border px-3 py-1 text-[11px] font-bold transition-all",
              platformFilter === "ALL"
                ? "border-slate-900 bg-slate-900 text-white shadow-xs dark:border-white dark:bg-white dark:text-slate-900"
                : "border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            )}
          >
            Semua Channel
          </button>
          {SOCIAL_PLATFORM_VALUES.map((p) => {
            const active = platformFilter === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPlatformFilter(active ? "ALL" : p)}
                aria-label={SOCIAL_PLATFORM_META[p].label}
                className={cn(
                  "rounded-full transition-all",
                  active
                    ? "ring-2 ring-blue-600 ring-offset-2 ring-offset-white dark:ring-offset-slate-900"
                    : "opacity-80 hover:opacity-100"
                )}
              >
                <ChannelPill
                  platform={p}
                  compact
                  className={VIBRANT_CHANNEL_PILL_CLASS[p]}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Approved Ideas Ready to Convert Tray */}
      {approvedIdeas.length > 0 ? (
        <div className="space-y-3 rounded-2xl border border-indigo-200 bg-white p-4 shadow-xs dark:border-indigo-500/30 dark:bg-slate-900">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-400">
                <Lightbulb className="size-4" />
              </div>
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                Ide Siap Promote
              </span>
              <span className="rounded-full bg-indigo-600 px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                {approvedIdeas.length}
              </span>
            </div>
            <Link
              href="/content/ideas"
              className="text-xs font-bold text-blue-600 hover:underline dark:text-blue-400"
            >
              Lihat Semua →
            </Link>
          </div>

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {approvedIdeas.map((idea) => (
              <div
                key={idea.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3 shadow-2xs transition-all hover:border-blue-400 hover:bg-white dark:border-slate-700 dark:bg-slate-800/70 dark:hover:bg-slate-800"
              >
                <div className="min-w-0 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <ChannelPill
                      platform={idea.targetPlatform}
                      compact
                      className={VIBRANT_CHANNEL_PILL_CLASS[idea.targetPlatform]}
                    />
                    <span className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200">
                      {idea.projectCode ?? "UMUM"}
                    </span>
                  </div>
                  <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                    {idea.title}
                  </p>
                </div>

                <Button
                  type="button"
                  size="xs"
                  onClick={() => {
                    setEditingItem(null);
                    setPromotingIdea(idea);
                    setDrawerOpen(true);
                  }}
                  className="shrink-0 gap-1 rounded-lg bg-blue-600 font-bold text-white shadow-xs hover:bg-blue-700"
                >
                  <Sparkles className="size-3" />
                  <span>Promote</span>
                  <ArrowRight className="size-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Content Plans Table */}
      <DataTable
        columns={columns}
        data={filteredItems}
        searchPlaceholder="Cari konten, kampanye, atau creator..."
        pagination={{ pageSize: 15 }}
        className="[&>div:nth-child(2)]:border-slate-200 [&>div:nth-child(2)]:bg-white [&>div:nth-child(2)]:shadow-xs dark:[&>div:nth-child(2)]:border-slate-800 dark:[&>div:nth-child(2)]:bg-slate-900 [&_[data-slot=table-header]]:border-b [&_[data-slot=table-header]]:border-slate-200 [&_[data-slot=table-header]]:bg-slate-50 dark:[&_[data-slot=table-header]]:border-slate-800 dark:[&_[data-slot=table-header]]:bg-slate-800/70 [&_[data-slot=table-head]]:text-xs [&_[data-slot=table-head]]:font-bold [&_[data-slot=table-head]]:text-slate-700 [&_[data-slot=table-head]]:uppercase dark:[&_[data-slot=table-head]]:text-slate-200 [&_[data-slot=table-row]]:border-slate-200 dark:[&_[data-slot=table-row]]:border-slate-800 [&_[data-slot=table-row]:hover]:bg-slate-50/90 dark:[&_[data-slot=table-row]:hover]:bg-slate-800/50"
        toolbarSlot={
          <Link
            href="/design/workspace"
            className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <Palette className="size-3.5 text-blue-600 dark:text-blue-400" />
            <span>Workspace</span>
          </Link>
        }
        emptyState={
          <EmptyState
            icon={NotebookPen}
            title="Belum ada Content Plan"
            description="Buat plan baru atau promote dari Ideas."
          />
        }
      />

      <ContentPlanFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        projects={projects}
        creators={creators}
        designers={designers}
        currentUserId={currentUserId}
        editingItem={editingItem}
        promotingIdea={promotingIdea}
        canDelete={canDeleteContent}
        onSuccess={() => router.refresh()}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Hapus Content Plan?"
        description={`Content Plan "${deleteTarget?.title ?? ""}" akan dihapus. Task produksi terkait akan dilepas sebagai task umum (tidak ikut terhapus), dan Design Brief yang ada tetap tersimpan terpisah.`}
        confirmLabel="Hapus Content Plan"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
