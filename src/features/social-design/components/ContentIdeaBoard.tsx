"use client";

import { useMemo, useOptimistic, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ContentIdeaStatus, SocialPlatform } from "@prisma/client";
import {
  Archive,
  ArrowRight,
  Check,
  ExternalLink,
  Lightbulb,
  Loader2,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  createContentIdeaAction,
  reviewContentIdeaAction,
  toggleIdeaUpvoteAction,
} from "@/features/social-design/actions/content-idea.actions";
import { ContentPlanFormDrawer } from "@/features/social-design/components/ContentPlanFormDrawer";
import {
  ChannelPill,
  CreativeAvatar,
} from "@/features/social-design/components/StudioPrimitives";
import {
  CONTENT_PILLAR_OPTIONS,
  SOCIAL_PLATFORM_META,
  SOCIAL_PLATFORM_VALUES,
  getPillarLabel,
} from "@/features/social-design/constants";
import type {
  ContentIdeaDTO,
  SelectableProjectOption,
  SelectableUserOption,
} from "@/features/social-design/types";
import { formatDateId } from "@/features/social-design/utils";
import { cn } from "@/lib/utils";

export interface ContentIdeaBoardProps {
  initialIdeas: ContentIdeaDTO[];
  projects: SelectableProjectOption[];
  creators: SelectableUserOption[];
  designers: SelectableUserOption[];
  currentUserId: string;
  canCreateIdea: boolean;
  canApproveIdea: boolean;
  canManageContent: boolean;
}

const IDEA_STATUS_PILLS: Array<{
  value: "ALL" | ContentIdeaStatus;
  label: string;
  dotClass: string;
  badgeClass: string;
  ribbonClass: string;
}> = [
  {
    value: "ALL",
    label: "Semua",
    dotClass: "bg-slate-600 dark:bg-slate-300",
    badgeClass:
      "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
    ribbonClass: "from-slate-500 to-slate-600",
  },
  {
    value: "IDEA",
    label: "Kurasi",
    dotClass: "bg-violet-600 dark:bg-violet-400",
    badgeClass:
      "bg-violet-50 text-violet-800 border-violet-300 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/35",
    ribbonClass: "from-violet-600 via-purple-500 to-fuchsia-500",
  },
  {
    value: "APPROVED_IDEA",
    label: "Disetujui",
    dotClass: "bg-blue-600 dark:bg-blue-400",
    badgeClass:
      "bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/35",
    ribbonClass: "from-blue-600 via-indigo-500 to-cyan-500",
  },
  {
    value: "CONVERTED",
    label: "Di Planner",
    dotClass: "bg-emerald-600 dark:bg-emerald-400",
    badgeClass:
      "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/35",
    ribbonClass: "from-emerald-500 via-teal-500 to-cyan-500",
  },
  {
    value: "ARCHIVED",
    label: "Arsip",
    dotClass: "bg-slate-500 dark:bg-slate-400",
    badgeClass:
      "bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
    ribbonClass: "from-slate-400 to-slate-500",
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

const STATUS_BADGE_LOOKUP = Object.fromEntries(
  IDEA_STATUS_PILLS.filter((p) => p.value !== "ALL").map((p) => [p.value, p])
) as Record<ContentIdeaStatus, (typeof IDEA_STATUS_PILLS)[number]>;

export function ContentIdeaBoard({
  initialIdeas,
  projects,
  creators,
  designers,
  currentUserId,
  canCreateIdea,
  canApproveIdea,
  canManageContent,
}: ContentIdeaBoardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [ideas, applyIdeaPatch] = useOptimistic(
    initialIdeas,
    (
      current: ContentIdeaDTO[],
      patch: { id: string; changes: Partial<ContentIdeaDTO> }
    ) =>
      current.map((item) =>
        item.id === patch.id ? { ...item, ...patch.changes } : item
      )
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [platformFilter, setPlatformFilter] = useState<string>("ALL");

  // Create Idea Modal state
  const [createOpen, setCreateOpen] = useState(false);
  const [newProjectId, setNewProjectId] = useState(projects[0]?.id ?? "");
  const [newTitle, setNewTitle] = useState("");
  const [newPlatform, setNewPlatform] = useState<SocialPlatform>("INSTAGRAM");
  const [newPillar, setNewPillar] = useState("EDUCATIONAL");
  const [newDescription, setNewDescription] = useState("");
  const [refInput, setRefInput] = useState("");
  const [refUrls, setRefUrls] = useState<string[]>([]);

  // Archive/Reject Idea Modal state
  const [archiveTarget, setArchiveTarget] = useState<ContentIdeaDTO | null>(
    null
  );
  const [archiveNotes, setArchiveNotes] = useState("");

  // Promote to Content Plan Drawer state
  const [promoteTarget, setPromoteTarget] = useState<ContentIdeaDTO | null>(
    null
  );

  const filteredIdeas = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ideas.filter((idea) => {
      if (statusFilter !== "ALL" && idea.status !== statusFilter) return false;
      if (platformFilter !== "ALL" && idea.targetPlatform !== platformFilter) {
        return false;
      }
      if (q) {
        const hay = `${idea.title} ${idea.description ?? ""} ${idea.contentPillar ?? ""} ${idea.proposerName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [ideas, searchQuery, statusFilter, platformFilter]);

  const countsByStatus = useMemo(() => {
    const counts: Record<"ALL" | ContentIdeaStatus, number> = {
      ALL: ideas.length,
      IDEA: 0,
      APPROVED_IDEA: 0,
      CONVERTED: 0,
      ARCHIVED: 0,
    };
    for (const idea of ideas) {
      counts[idea.status] += 1;
    }
    return counts;
  }, [ideas]);

  const projectItems = useMemo(
    () =>
      projects.map((p) => ({
        value: p.id,
        label: `${p.code} — ${p.name}`,
      })),
    [projects]
  );

  const handleAddRefUrl = () => {
    const trimmed = refInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("https://")) {
      toast.error("URL referensi wajib menggunakan https://");
      return;
    }
    if (refUrls.length >= 5) {
      toast.error("Maksimal 5 tautan referensi.");
      return;
    }
    if (!refUrls.includes(trimmed)) {
      setRefUrls((prev) => [...prev, trimmed]);
    }
    setRefInput("");
  };

  const handleCreateIdea = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await createContentIdeaAction({
          projectId: newProjectId,
          title: newTitle,
          description: newDescription,
          targetPlatform: newPlatform,
          contentPillar: newPillar || null,
          referenceUrls: refUrls,
        });

        if (!res.success) {
          const firstField = res.error.fieldErrors
            ? Object.values(res.error.fieldErrors).flat()[0]
            : null;
          toast.error(firstField ?? res.error.message);
          return;
        }

        toast.success(res.message ?? "Ide ditambahkan.");
        setCreateOpen(false);
        setNewTitle("");
        setNewDescription("");
        setRefUrls([]);
        setRefInput("");
        router.refresh();
      } catch {
        toast.error("Gagal mengajukan ide konten.");
      }
    });
  };

  const handleUpvote = (idea: ContentIdeaDTO) => {
    startTransition(async () => {
      applyIdeaPatch({
        id: idea.id,
        changes: {
          hasUpvoted: !idea.hasUpvoted,
          upvoteCount: idea.hasUpvoted
            ? Math.max(0, idea.upvoteCount - 1)
            : idea.upvoteCount + 1,
        },
      });

      try {
        const res = await toggleIdeaUpvoteAction({ ideaId: idea.id });
        if (!res.success) {
          toast.error(res.error.message);
          return;
        }
        router.refresh();
      } catch {
        toast.error("Gagal memperbarui upvote.");
      }
    });
  };

  const handleApproveIdea = (idea: ContentIdeaDTO) => {
    startTransition(async () => {
      applyIdeaPatch({ id: idea.id, changes: { status: "APPROVED_IDEA" } });

      try {
        const res = await reviewContentIdeaAction({
          ideaId: idea.id,
          decision: "APPROVE",
        });
        if (!res.success) {
          toast.error(res.error.message);
          return;
        }
        toast.success(res.message ?? "Ide disetujui.");
        router.refresh();
      } catch {
        toast.error("Gagal menyetujui ide.");
      }
    });
  };

  const handleConfirmArchive = (e: React.FormEvent) => {
    e.preventDefault();
    if (!archiveTarget) return;
    const target = archiveTarget;
    const notes = archiveNotes;

    startTransition(async () => {
      applyIdeaPatch({
        id: target.id,
        changes: { status: "ARCHIVED", reviewNotes: notes },
      });

      try {
        const res = await reviewContentIdeaAction({
          ideaId: target.id,
          decision: "ARCHIVE",
          reviewNotes: notes,
        });

        if (!res.success) {
          const firstErr = res.error.fieldErrors
            ? Object.values(res.error.fieldErrors).flat()[0]
            : null;
          toast.error(firstErr ?? res.error.message);
          return;
        }

        toast.success(res.message ?? "Ide diarsipkan.");
        setArchiveTarget(null);
        setArchiveNotes("");
        router.refresh();
      } catch {
        toast.error("Gagal mengarsipkan ide.");
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* Studio Toolbar: Status Filter Pills + Search + Channel + New CTA */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Segmented Status Tabs with Live Counts */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800/80">
            {IDEA_STATUS_PILLS.map((pill) => {
              const active = statusFilter === pill.value;
              return (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => setStatusFilter(pill.value)}
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
                    {countsByStatus[pill.value]}
                  </span>
                </button>
              );
            })}
          </div>

          {canCreateIdea ? (
            <Button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="shrink-0 gap-1.5 rounded-xl bg-blue-600 font-bold text-white shadow-sm hover:bg-blue-700"
            >
              <Plus className="size-4" />
              <span>Ide Baru</span>
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 border-t border-slate-200/80 pt-3 dark:border-slate-800">
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ide, hook, atau kreator..."
              className="h-9 rounded-xl border-slate-200 bg-slate-50 pl-8.5 text-xs font-medium text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100 dark:placeholder:text-slate-400"
            />
          </div>

          <Select
            value={platformFilter}
            onValueChange={(v) => setPlatformFilter(v ?? "ALL")}
            items={[
              { value: "ALL", label: "Semua Channel" },
              ...SOCIAL_PLATFORM_VALUES.map((v) => ({
                value: v,
                label: SOCIAL_PLATFORM_META[v].label,
              })),
            ]}
          >
            <SelectTrigger className="h-9 w-44 min-w-0 overflow-hidden rounded-xl border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100">
              <SelectValue placeholder="Channel" className="block min-w-0 truncate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Channel</SelectItem>
              {SOCIAL_PLATFORM_VALUES.map((v) => (
                <SelectItem key={v} value={v}>
                  {SOCIAL_PLATFORM_META[v].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Visual Ideas Gallery Grid */}
      {filteredIdeas.length === 0 ? (
        <EmptyState
          icon={Lightbulb}
          title="Belum ada ide"
          description="Ajukan ide baru atau ubah filter."
          action={
            canCreateIdea ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setCreateOpen(true)}
                className="bg-blue-600 font-bold text-white hover:bg-blue-700"
              >
                <Plus className="size-4" />
                <span>Ajukan Ide</span>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredIdeas.map((idea) => {
            const statusMeta = STATUS_BADGE_LOOKUP[idea.status];
            const canPromote =
              canManageContent &&
              (idea.status === "APPROVED_IDEA" ||
                (idea.status === "IDEA" && canApproveIdea));

            return (
              <div
                key={idea.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/70"
              >
                {/* Stage Color Top Ribbon */}
                <div
                  className={cn(
                    "h-1.5 w-full bg-gradient-to-r",
                    statusMeta.ribbonClass
                  )}
                />

                <div className="flex flex-1 flex-col gap-3 p-4">
                  {/* Top Row: Vibrant Channel Pill + Pillar + Stage Badge */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <ChannelPill
                        platform={idea.targetPlatform}
                        className={
                          VIBRANT_CHANNEL_PILL_CLASS[idea.targetPlatform]
                        }
                      />
                      {idea.contentPillar ? (
                        <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {getPillarLabel(idea.contentPillar)}
                        </span>
                      ) : null}
                    </div>

                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
                        statusMeta.badgeClass
                      )}
                    >
                      <span
                        className={cn("size-1.5 rounded-full", statusMeta.dotClass)}
                      />
                      <span>{statusMeta.label}</span>
                    </span>
                  </div>

                  {/* Title & Project Chip */}
                  <div className="min-w-0 space-y-1.5">
                    <h3 className="line-clamp-2 break-words font-heading text-[15px] font-bold leading-snug text-slate-900 dark:text-white">
                      {idea.title}
                    </h3>
                    <span className="inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ backgroundColor: idea.projectColorHex }}
                      />
                      <span className="truncate">
                        {idea.projectCode} · {idea.projectName}
                      </span>
                    </span>
                  </div>

                  {/* Hook / Description */}
                  {idea.description ? (
                    <p className="line-clamp-3 break-words text-xs leading-relaxed font-medium text-slate-600 dark:text-slate-300">
                      {idea.description}
                    </p>
                  ) : null}

                  {/* Reference Chips */}
                  {idea.referenceUrls.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {idea.referenceUrls.map((url, idx) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60"
                        >
                          <ExternalLink className="size-3" />
                          <span>Ref {idx + 1}</span>
                        </a>
                      ))}
                    </div>
                  ) : null}

                  {/* Review Notes (only if present) */}
                  {idea.reviewNotes ? (
                    <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-3 py-2 text-xs break-words text-slate-800 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-slate-200">
                      <span className="font-bold text-amber-900 dark:text-amber-300">
                        Catatan:{" "}
                      </span>
                      {idea.reviewNotes}
                    </div>
                  ) : null}
                </div>

                {/* Footer: Author Avatar + Tactile Upvote Chip (▲ 12) + Quick Actions */}
                <div className="space-y-2.5 border-t border-slate-200/80 bg-slate-50/90 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <CreativeAvatar
                        name={idea.proposerName}
                        avatarUrl={idea.proposerAvatarUrl}
                        size="sm"
                        className="ring-2 ring-white dark:ring-slate-800"
                      />
                      <div className="min-w-0 leading-tight">
                        <p className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                          {idea.proposerName}
                        </p>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {formatDateId(idea.createdAt)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleUpvote(idea)}
                      disabled={isPending}
                      aria-label={`Upvote ${idea.title}`}
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1 text-xs font-bold tabular-nums transition-all",
                        idea.hasUpvoted
                          ? "border-blue-600 bg-blue-600 text-white shadow-sm hover:bg-blue-700"
                          : "border-slate-200 bg-slate-100 text-slate-800 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-blue-500 dark:hover:bg-blue-950 dark:hover:text-blue-300"
                      )}
                    >
                      <span className="text-[10px] leading-none">▲</span>
                      <span>{idea.upvoteCount}</span>
                    </button>
                  </div>

                  {/* Contextual Quick Actions */}
                  {idea.status === "IDEA" && canApproveIdea ? (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() => handleApproveIdea(idea)}
                        disabled={isPending}
                        className="h-7 flex-1 rounded-lg border-emerald-300 bg-emerald-50 font-bold text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25"
                      >
                        <Check className="size-3.5" />
                        <span>Approve</span>
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          setArchiveTarget(idea);
                          setArchiveNotes("");
                        }}
                        disabled={isPending}
                        className="h-7 rounded-lg border-rose-200 bg-rose-50 font-bold text-rose-700 hover:bg-rose-100 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-300 dark:hover:bg-rose-500/25"
                      >
                        <Archive className="size-3.5" />
                        <span>Arsip</span>
                      </Button>
                    </div>
                  ) : null}

                  {canPromote ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setPromoteTarget(idea)}
                      className="h-8 w-full justify-between rounded-lg bg-blue-600 font-bold text-white shadow-xs hover:bg-blue-700"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Sparkles className="size-3.5" />
                        <span>Promote ke Planner</span>
                      </span>
                      <ArrowRight className="size-3.5" />
                    </Button>
                  ) : null}

                  {idea.status === "CONVERTED" ? (
                    <Link
                      href="/content/calendar"
                      className="inline-flex h-8 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-blue-600 transition-colors hover:border-blue-300 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-800 dark:text-blue-400 dark:hover:bg-slate-700"
                    >
                      <span>Lihat di Calendar</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Dialog: Create Idea */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="size-4 text-primary" />
              <span>Ide Konten Baru</span>
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateIdea} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Channel *</Label>
              <div className="flex flex-wrap gap-1.5">
                {SOCIAL_PLATFORM_VALUES.map((v) => {
                  const active = newPlatform === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setNewPlatform(v)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-full p-0.5 transition-all",
                        active
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                          : "opacity-65 hover:opacity-100"
                      )}
                    >
                      <ChannelPill
                        platform={v}
                        className={VIBRANT_CHANNEL_PILL_CLASS[v]}
                      />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="min-w-0 space-y-1.5">
                <Label>Proyek *</Label>
                <Select
                  value={newProjectId}
                  onValueChange={(val) => {
                    if (val) setNewProjectId(val);
                  }}
                  items={projectItems}
                >
                  <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                    <SelectValue placeholder="Pilih proyek" className="block min-w-0 truncate" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectItems.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <span className="truncate">{p.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-0 space-y-1.5">
                <Label>Pilar Konten</Label>
                <Select
                  value={newPillar}
                  onValueChange={(val) => {
                    if (val !== null) setNewPillar(val);
                  }}
                  items={CONTENT_PILLAR_OPTIONS.map((p) => ({
                    value: p.value,
                    label: p.label,
                  }))}
                >
                  <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                    <SelectValue placeholder="Pilih pilar" className="block min-w-0 truncate" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_PILLAR_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="idea-title">Judul / Konsep *</Label>
              <Input
                id="idea-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                minLength={5}
                maxLength={200}
                placeholder="Reels Behind the Scene Studio Workflow"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="idea-desc">Hook & Angle *</Label>
              <Textarea
                id="idea-desc"
                rows={3}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                required
                minLength={10}
                maxLength={2000}
                placeholder="Hook 3 detik pertama & poin inti konten..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="idea-ref">Referensi (HTTPS)</Label>
              <div className="flex gap-2">
                <Input
                  id="idea-ref"
                  type="url"
                  value={refInput}
                  onChange={(e) => setRefInput(e.target.value)}
                  placeholder="https://www.instagram.com/reel/..."
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddRefUrl}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              {refUrls.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {refUrls.map((url) => (
                    <Badge key={url} variant="secondary" className="max-w-xs gap-1">
                      <span className="truncate">{url}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setRefUrls((prev) => prev.filter((u) => u !== url))
                        }
                        aria-label="Hapus link"
                      >
                        <X className="size-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  "Simpan Ide"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog: Archive Idea */}
      <Dialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Arsipkan Ide</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleConfirmArchive} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="archive-notes">Alasan (min. 10 karakter) *</Label>
              <Textarea
                id="archive-notes"
                rows={3}
                value={archiveNotes}
                onChange={(e) => setArchiveNotes(e.target.value)}
                required
                minLength={10}
                placeholder="Topik sudah tayang minggu lalu..."
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setArchiveTarget(null)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button type="submit" variant="destructive" disabled={isPending}>
                {isPending ? "Memproses..." : "Arsipkan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Drawer: Promote Idea -> Content Plan */}
      <ContentPlanFormDrawer
        open={Boolean(promoteTarget)}
        onOpenChange={(open) => {
          if (!open) setPromoteTarget(null);
        }}
        projects={projects}
        creators={creators}
        designers={designers}
        currentUserId={currentUserId}
        promotingIdea={promoteTarget}
        onSuccess={() => {
          if (promoteTarget) {
            const promotedId = promoteTarget.id;
            startTransition(() => {
              applyIdeaPatch({
                id: promotedId,
                changes: { status: "CONVERTED" },
              });
              router.refresh();
            });
          } else {
            router.refresh();
          }
        }}
      />
    </div>
  );
}
