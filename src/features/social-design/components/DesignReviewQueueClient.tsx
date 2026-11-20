"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { SocialPlatform } from "@prisma/client";
import {
  AlertTriangle,
  ClipboardCheck,
  Maximize2,
  Search,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DesignApprovalDrawer,
  DesignReviewInspector,
} from "@/features/social-design/components/DesignApprovalDrawer";
import {
  ChannelPill,
  CreativeAvatar,
  DesignArtboardThumb,
} from "@/features/social-design/components/StudioPrimitives";
import type { DesignBriefDTO } from "@/features/social-design/types";
import { formatDateTimeId } from "@/features/social-design/utils";
import { cn } from "@/lib/utils";

export interface DesignReviewQueueClientProps {
  initialBriefs: DesignBriefDTO[];
  currentUserId: string;
  canApprove: boolean;
  initialBriefId?: string;
}

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

type ReviewTab = "SUBMITTED" | "REVISION_REQUESTED" | "APPROVED" | "ALL";

function resolveInitialTab(
  briefs: DesignBriefDTO[],
  initialBriefId?: string
): ReviewTab {
  if (initialBriefId) {
    const target = briefs.find((b) => b.id === initialBriefId);
    if (target) {
      if (
        target.status === "SUBMITTED" ||
        target.status === "REVISION_REQUESTED" ||
        target.status === "APPROVED"
      ) {
        return target.status;
      }
      return "ALL";
    }
  }
  return "SUBMITTED";
}

export function DesignReviewQueueClient({
  initialBriefs,
  currentUserId,
  canApprove,
  initialBriefId,
}: DesignReviewQueueClientProps) {
  const router = useRouter();

  const [tab, setTab] = useState<ReviewTab>(() =>
    resolveInitialTab(initialBriefs, initialBriefId)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBriefId, setSelectedBriefId] = useState<string | null>(
    () =>
      initialBriefId ??
      initialBriefs.find((b) => b.status === "SUBMITTED")?.id ??
      initialBriefs[0]?.id ??
      null
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

  const counts = useMemo(() => {
    let submitted = 0;
    let revision = 0;
    let approved = 0;
    for (const b of initialBriefs) {
      if (b.status === "SUBMITTED") submitted += 1;
      else if (b.status === "REVISION_REQUESTED") revision += 1;
      else if (b.status === "APPROVED") approved += 1;
    }
    return { submitted, revision, approved, total: initialBriefs.length };
  }, [initialBriefs]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return initialBriefs.filter((b) => {
      if (tab !== "ALL" && b.status !== tab) return false;
      if (q) {
        const hay = `${b.title} ${b.projectName} ${b.assignedDesignerName ?? ""} ${b.contentTitle ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [initialBriefs, tab, searchQuery]);

  const activeBrief = useMemo(
    () =>
      filtered.find((b) => b.id === selectedBriefId) ?? filtered[0] ?? null,
    [filtered, selectedBriefId]
  );

  const drawerBrief = useMemo(
    () => initialBriefs.find((b) => b.id === selectedBriefId) ?? activeBrief,
    [initialBriefs, selectedBriefId, activeBrief]
  );

  const tabs: Array<{
    key: ReviewTab;
    label: string;
    count: number;
    dotClass: string;
  }> = [
    {
      key: "SUBMITTED",
      label: "Siap Review",
      count: counts.submitted,
      dotClass: "bg-amber-500",
    },
    {
      key: "REVISION_REQUESTED",
      label: "Revisi",
      count: counts.revision,
      dotClass: "bg-rose-600",
    },
    {
      key: "APPROVED",
      label: "Approved",
      count: counts.approved,
      dotClass: "bg-emerald-600",
    },
    {
      key: "ALL",
      label: "Semua",
      count: counts.total,
      dotClass: "bg-slate-600 dark:bg-slate-300",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Studio Tabs & Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800/80">
          {tabs.map((t) => {
            const active = tab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all",
                  active
                    ? "bg-white font-bold text-slate-900 shadow-xs ring-1 ring-slate-200 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
                    : "font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                )}
              >
                <span className={cn("size-2 rounded-full", t.dotClass)} />
                <span>{t.label}</span>
                <span
                  className={cn(
                    "rounded-md px-1.5 py-0.2 font-mono text-[10px] font-bold",
                    active
                      ? "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                      : "bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                  )}
                >
                  {t.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari brief atau designer..."
            className="h-9 rounded-xl border-slate-200 bg-slate-50 pl-8.5 text-xs font-medium text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100 dark:placeholder:text-slate-400"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title={
            tab === "SUBMITTED"
              ? "Antrean review kosong"
              : "Tidak ada item di kategori ini"
          }
          description="Karya desain yang disubmit akan muncul di sini."
        />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,390px)_1fr] lg:items-start">
          {/* Left Queue List */}
          <div className="space-y-3">
            {filtered.map((brief) => {
              const latest = brief.submissions[0] ?? null;
              const isSelected = activeBrief?.id === brief.id;
              const cleanTitle =
                brief.title.replace(/^(?:Brief:\s*)+/i, "").trim() ||
                brief.title;

              return (
                <button
                  key={brief.id}
                  type="button"
                  onClick={() => {
                    setSelectedBriefId(brief.id);
                    if (
                      typeof window !== "undefined" &&
                      window.innerWidth < 1024
                    ) {
                      setDrawerOpen(true);
                    }
                  }}
                  className={cn(
                    "group block w-full overflow-hidden rounded-2xl border bg-white text-left shadow-xs transition-all duration-150 hover:border-blue-400 hover:shadow-md dark:bg-slate-900",
                    isSelected
                      ? "border-blue-600 ring-2 ring-blue-600/20 shadow-md dark:border-blue-500"
                      : brief.revisionCount >= 3 && brief.status !== "APPROVED"
                        ? "border-amber-400 dark:border-amber-500/60"
                        : "border-slate-200 dark:border-slate-800"
                  )}
                >
                  <DesignArtboardThumb
                    title={cleanTitle}
                    projectCode={brief.projectCode}
                    projectColorHex={brief.projectColorHex}
                    platform={brief.contentPlatform}
                    contentFormat={brief.contentFormat}
                    dimensionsSpec={brief.dimensionsSpec}
                    versionNumber={brief.currentVersion}
                    revisionCount={brief.revisionCount}
                    latestSubmission={latest}
                    className="aspect-[16/9] rounded-t-none border-b border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950"
                  />

                  <div className="space-y-2.5 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <StatusBadge
                        domain="design"
                        value={brief.status}
                        versionNumber={brief.currentVersion}
                        revisionCount={brief.revisionCount}
                      />
                      {brief.revisionCount >= 3 ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300">
                          <AlertTriangle className="size-2.5" />
                          {brief.revisionCount}× Rev
                        </span>
                      ) : null}
                    </div>

                    <p className="line-clamp-1 break-words font-heading text-sm font-bold text-slate-900 dark:text-white">
                      {cleanTitle}
                    </p>

                    <div className="flex items-center justify-between gap-2 pt-0.5 text-xs">
                      <div className="flex min-w-0 items-center gap-2">
                        <CreativeAvatar
                          name={brief.assignedDesignerName ?? "Unassigned"}
                          avatarUrl={brief.assignedDesignerAvatarUrl}
                          size="sm"
                          className="size-5 ring-1 ring-slate-200 dark:ring-slate-700"
                        />
                        <span className="truncate font-bold text-slate-800 dark:text-slate-100">
                          {brief.assignedDesignerName ?? "—"}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {brief.contentPlatform ? (
                          <ChannelPill
                            platform={brief.contentPlatform}
                            compact
                            className={
                              VIBRANT_CHANNEL_PILL_CLASS[brief.contentPlatform]
                            }
                          />
                        ) : null}
                        {latest ? (
                          <span className="rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {formatDateTimeId(latest.submittedAt).split(",")[0]}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right Sticky Side-by-Side Review Stage (Desktop) */}
          {activeBrief ? (
            <div className="hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-20 lg:block dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-2 flex justify-end">
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => setDrawerOpen(true)}
                  className="gap-1.5 rounded-lg border-slate-200 bg-slate-50 font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <Maximize2 className="size-3" />
                  <span>Slide-Over</span>
                </Button>
              </div>
              <DesignReviewInspector
                key={activeBrief.id}
                brief={activeBrief}
                currentUserId={currentUserId}
                canApprove={canApprove}
                compactHeader
                onCompleted={() => router.refresh()}
              />
            </div>
          ) : null}
        </div>
      )}

      {/* Slide-Over Drawer (Mobile + Desktop Expand) */}
      <DesignApprovalDrawer
        brief={drawerBrief}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        currentUserId={currentUserId}
        canApprove={canApprove}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
