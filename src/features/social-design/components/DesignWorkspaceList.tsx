"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { DesignSubmissionStatus, SocialPlatform } from "@prisma/client";
import {
  AlertTriangle,
  Brush,
  Calendar,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  History,
  Loader2,
  Palette,
  Plus,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  assignDesignBriefAction,
  deleteDesignBriefAction,
  startDesignBriefAction,
} from "@/features/social-design/actions/design.actions";
import { DesignSubmissionModal } from "@/features/social-design/components/DesignSubmissionModal";
import {
  FileTypeBadge,
  SignedMediaPreviewDialog,
  openAssetOrSubmissionLink,
} from "@/features/social-design/components/SignedMediaPreview";
import {
  ChannelPill,
  CreativeAvatar,
  DesignArtboardThumb,
  parseDimensionSpec,
} from "@/features/social-design/components/StudioPrimitives";
import { DESIGN_DIMENSIONS_PRESETS } from "@/features/social-design/constants";
import type {
  DesignBriefDTO,
  DesignSubmissionDTO,
  SelectableProjectOption,
  SelectableUserOption,
} from "@/features/social-design/types";
import {
  formatDateId,
  formatDateTimeId,
  fromJakartaDatetimeLocalValue,
  toJakartaDatetimeLocalValue,
} from "@/features/social-design/utils";
import {
  DESIGN_SUBMISSION_STATUS_META,
  DESIGN_SUBMISSION_STATUS_VALUES,
} from "@/lib/constants/enums";
import { cn } from "@/lib/utils";

export interface DesignWorkspaceListProps {
  initialBriefs: DesignBriefDTO[];
  projects: SelectableProjectOption[];
  designers: SelectableUserOption[];
  currentUserId: string;
  canManageBriefs: boolean;
  canSubmitDesign: boolean;
  canApproveDesign: boolean;
  canDeleteBriefs?: boolean;
  initialBriefId?: string;
}

const STATUS_DOT_MAP: Record<DesignSubmissionStatus, string> = {
  PENDING_BRIEF: "bg-slate-500",
  IN_PROGRESS: "bg-blue-600",
  SUBMITTED: "bg-amber-500",
  REVISION_REQUESTED: "bg-rose-600",
  APPROVED: "bg-emerald-600",
};

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

export function DesignWorkspaceList({
  initialBriefs,
  projects,
  designers,
  currentUserId,
  canManageBriefs,
  canSubmitDesign,
  canApproveDesign,
  canDeleteBriefs = false,
  initialBriefId,
}: DesignWorkspaceListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<DesignBriefDTO | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [bottleneckOnly, setBottleneckOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeBriefId, setActiveBriefId] = useState<string | null>(
    initialBriefId ?? null
  );

  // Submission Modal
  const [submitTarget, setSubmitTarget] = useState<DesignBriefDTO | null>(null);

  // Preview Modal
  const [previewTarget, setPreviewTarget] = useState<{
    briefTitle: string;
    submission: DesignSubmissionDTO;
  } | null>(null);

  // Create / Reassign Brief Modal
  const [briefDialogOpen, setBriefDialogOpen] = useState(false);
  const [editingBrief, setEditingBrief] = useState<DesignBriefDTO | null>(null);
  const [briefProjectId, setBriefProjectId] = useState(projects[0]?.id ?? "");
  const [briefTitle, setBriefTitle] = useState("");
  const [briefObjective, setBriefObjective] = useState("");
  const [briefDimensions, setBriefDimensions] = useState<string>(
    DESIGN_DIMENSIONS_PRESETS[0]
  );
  const [briefCopyText, setBriefCopyText] = useState("");
  const [briefGuidelines, setBriefGuidelines] = useState("");
  const [briefDesignerId, setBriefDesignerId] = useState(
    designers[0]?.id ?? ""
  );
  const [briefDueLocal, setBriefDueLocal] = useState("");
  const [briefRefInput, setBriefRefInput] = useState("");
  const [briefRefLinks, setBriefRefLinks] = useState<string[]>([]);

  const activeBrief = useMemo(
    () => initialBriefs.find((b) => b.id === activeBriefId) ?? null,
    [initialBriefs, activeBriefId]
  );

  const openCreateBriefDialog = (existing?: DesignBriefDTO) => {
    if (existing) {
      setEditingBrief(existing);
      setBriefProjectId(existing.projectId);
      setBriefTitle(existing.title);
      setBriefObjective(existing.objective);
      setBriefDimensions(
        existing.dimensionsSpec ?? DESIGN_DIMENSIONS_PRESETS[0]
      );
      setBriefCopyText(existing.copyText ?? "");
      setBriefGuidelines(existing.brandGuidelinesNotes ?? "");
      setBriefDesignerId(
        existing.assignedDesignerId ?? designers[0]?.id ?? ""
      );
      setBriefDueLocal(toJakartaDatetimeLocalValue(existing.dueDate));
      setBriefRefLinks(existing.referenceLinks ?? []);
    } else {
      setEditingBrief(null);
      setBriefProjectId(projects[0]?.id ?? "");
      setBriefTitle("");
      setBriefObjective("");
      setBriefDimensions(DESIGN_DIMENSIONS_PRESETS[0]);
      setBriefCopyText("");
      setBriefGuidelines("");
      setBriefDesignerId(designers[0]?.id ?? "");
      setBriefDueLocal("");
      setBriefRefLinks([]);
    }
    setBriefRefInput("");
    setBriefDialogOpen(true);
  };

  const filteredBriefs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return initialBriefs.filter((b) => {
      if (statusFilter !== "ALL" && b.status !== statusFilter) return false;
      if (bottleneckOnly && !(b.revisionCount >= 3 && b.status !== "APPROVED")) {
        return false;
      }
      if (q) {
        const hay = `${b.title} ${b.objective} ${b.projectName} ${b.contentTitle ?? ""} ${b.assignedDesignerName ?? ""} ${b.linkedTask?.taskCode ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [initialBriefs, statusFilter, bottleneckOnly, searchQuery]);

  const statusCounts = useMemo(() => {
    const counts: Record<DesignSubmissionStatus, number> = {
      PENDING_BRIEF: 0,
      IN_PROGRESS: 0,
      SUBMITTED: 0,
      REVISION_REQUESTED: 0,
      APPROVED: 0,
    };
    for (const b of initialBriefs) {
      counts[b.status] += 1;
    }
    return counts;
  }, [initialBriefs]);

  const bottleneckCount = useMemo(
    () =>
      initialBriefs.filter(
        (b) => b.revisionCount >= 3 && b.status !== "APPROVED"
      ).length,
    [initialBriefs]
  );

  const projectItems = useMemo(
    () =>
      projects.map((p) => ({
        value: p.id,
        label: `${p.code} — ${p.name}`,
      })),
    [projects]
  );

  const designerItems = useMemo(() => {
    const items = designers.map((d) => ({
      value: d.id,
      label: `${d.fullName} · Designer`,
    }));
    if (
      editingBrief?.assignedDesignerId &&
      !items.some((item) => item.value === editingBrief.assignedDesignerId)
    ) {
      items.unshift({
        value: editingBrief.assignedDesignerId,
        label: editingBrief.assignedDesignerName ?? "Designer (Nonaktif)",
      });
    }
    return items;
  }, [designers, editingBrief]);

  const handleStartBrief = (brief: DesignBriefDTO) => {
    startTransition(async () => {
      const res = await startDesignBriefAction({ designBriefId: brief.id });
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      toast.success(res.message ?? "Status brief diubah menjadi Working.");
      router.refresh();
    });
  };

  const handleAddBriefRef = () => {
    const trimmed = briefRefInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("https://")) {
      toast.error("Tautan referensi harus menggunakan https://");
      return;
    }
    if (briefRefLinks.length >= 10) {
      toast.error("Maksimal 10 tautan referensi.");
      return;
    }
    if (!briefRefLinks.includes(trimmed)) {
      setBriefRefLinks((prev) => [...prev, trimmed]);
    }
    setBriefRefInput("");
  };

  const handleSaveBrief = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await assignDesignBriefAction({
        briefId: editingBrief?.id,
        contentItemId: editingBrief?.contentItemId ?? null,
        projectId: briefProjectId,
        title: briefTitle,
        objective: briefObjective,
        dimensionsSpec: briefDimensions || null,
        copyText: briefCopyText || null,
        brandGuidelinesNotes: briefGuidelines || null,
        referenceLinks: briefRefLinks,
        assignedDesignerId: briefDesignerId,
        dueDate: fromJakartaDatetimeLocalValue(briefDueLocal),
      });

      if (!res.success) {
        const firstErr = res.error.fieldErrors
          ? Object.values(res.error.fieldErrors).flat()[0]
          : null;
        toast.error(firstErr ?? res.error.message);
        return;
      }

      toast.success(res.message ?? "Design brief disimpan.");
      setBriefDialogOpen(false);
      router.refresh();
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteDesignBriefAction({
        designBriefId: deleteTarget.id,
      });
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      toast.success(res.message ?? "Brief desain berhasil dihapus.");
      if (activeBriefId === deleteTarget.id) {
        setActiveBriefId(null);
      }
      setDeleteTarget(null);
      router.refresh();
    } catch {
      toast.error("Gagal menghapus brief desain.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Studio Filter & Action Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Status Pills */}
          <div className="flex flex-wrap items-center gap-1 rounded-xl border border-slate-200/80 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800/80">
            <button
              type="button"
              onClick={() => {
                setStatusFilter("ALL");
                setBottleneckOnly(false);
              }}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all",
                statusFilter === "ALL" && !bottleneckOnly
                  ? "bg-white font-bold text-slate-900 shadow-xs ring-1 ring-slate-200 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
                  : "font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
              )}
            >
              <span>Semua</span>
              <span
                className={cn(
                  "rounded-md px-1.5 py-0.2 font-mono text-[10px] font-bold",
                  statusFilter === "ALL" && !bottleneckOnly
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                    : "bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                )}
              >
                {initialBriefs.length}
              </span>
            </button>

            {DESIGN_SUBMISSION_STATUS_VALUES.map((st) => {
              const active = statusFilter === st && !bottleneckOnly;
              return (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setBottleneckOnly(false);
                    setStatusFilter(active ? "ALL" : st);
                  }}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs transition-all",
                    active
                      ? "bg-white font-bold text-slate-900 shadow-xs ring-1 ring-slate-200 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
                      : "font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  )}
                >
                  <span
                    className={cn("size-2 rounded-full", STATUS_DOT_MAP[st])}
                  />
                  <span>{DESIGN_SUBMISSION_STATUS_META[st].label}</span>
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.2 font-mono text-[10px] font-bold",
                      active
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300"
                        : "bg-slate-200/80 text-slate-700 dark:bg-slate-700 dark:text-slate-200"
                    )}
                  >
                    {statusCounts[st]}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {bottleneckCount > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("ALL");
                  setBottleneckOnly((prev) => !prev);
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all",
                  bottleneckOnly
                    ? "border-amber-600 bg-amber-600 text-white shadow-xs"
                    : "border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300"
                )}
              >
                <AlertTriangle className="size-3.5" />
                <span>{bottleneckCount} High Revision</span>
              </button>
            ) : null}

            {canManageBriefs ? (
              <Button
                type="button"
                onClick={() => openCreateBriefDialog()}
                className="gap-1.5 rounded-xl bg-blue-600 font-bold text-white shadow-sm hover:bg-blue-700"
              >
                <Plus className="size-4" />
                <span>Brief Baru</span>
              </Button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-200/80 pt-3 dark:border-slate-800">
          <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari brief, task code, designer..."
              className="h-9 rounded-xl border-slate-200 bg-slate-50 pl-8.5 text-xs font-medium text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100 dark:placeholder:text-slate-400"
            />
          </div>
        </div>
      </div>

      {/* Design Gallery Grid */}
      {filteredBriefs.length === 0 ? (
        <EmptyState
          icon={Palette}
          title="Belum ada brief desain"
          description="Buat brief baru atau ubah filter."
          action={
            canManageBriefs ? (
              <Button
                type="button"
                size="sm"
                onClick={() => openCreateBriefDialog()}
                className="bg-blue-600 font-bold text-white hover:bg-blue-700"
              >
                <Plus className="size-4" />
                <span>Brief Baru</span>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredBriefs.map((brief) => {
            const latest = brief.submissions[0] ?? null;
            const cleanTitle =
              brief.title.replace(/^(?:Brief:\s*)+/i, "").trim() || brief.title;
            const dimInfo = parseDimensionSpec(brief.dimensionsSpec);
            const canSubmitForThisBrief =
              canSubmitDesign &&
              (brief.status === "PENDING_BRIEF" ||
                brief.status === "IN_PROGRESS" ||
                brief.status === "REVISION_REQUESTED") &&
              (brief.assignedDesignerId === currentUserId || canManageBriefs);

            const canStartThisBrief =
              canSubmitDesign &&
              brief.status === "PENDING_BRIEF" &&
              (brief.assignedDesignerId === currentUserId || canManageBriefs);

            return (
              <div
                key={brief.id}
                className={cn(
                  "group flex flex-col justify-between overflow-hidden rounded-2xl border bg-white shadow-xs transition-all duration-150 hover:-translate-y-0.5 hover:border-blue-500 hover:shadow-md dark:bg-slate-900",
                  brief.revisionCount >= 3 && brief.status !== "APPROVED"
                    ? "border-amber-400 ring-1 ring-amber-400/20 dark:border-amber-500/60"
                    : "border-slate-200 dark:border-slate-800"
                )}
              >
                {/* Visual Artboard Thumbnail Stage */}
                <button
                  type="button"
                  onClick={() => {
                    if (latest) {
                      setPreviewTarget({
                        briefTitle: `${cleanTitle} (v${latest.versionNumber})`,
                        submission: latest,
                      });
                    } else {
                      setActiveBriefId(brief.id);
                    }
                  }}
                  className="relative block w-full text-left focus:outline-none"
                >
                  <DesignArtboardThumb
                    title={cleanTitle}
                    projectCode={brief.projectCode ?? "UMUM"}
                    projectColorHex={brief.projectColorHex || "#64748b"}
                    platform={brief.contentPlatform}
                    contentFormat={brief.contentFormat}
                    dimensionsSpec={brief.dimensionsSpec}
                    versionNumber={brief.currentVersion}
                    revisionCount={brief.revisionCount}
                    latestSubmission={latest}
                    className="rounded-t-none border-b border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950"
                  />
                </button>

                {/* Card Body */}
                <div className="flex flex-1 flex-col gap-2.5 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <StatusBadge
                      domain="design"
                      value={brief.status}
                      versionNumber={brief.currentVersion}
                      revisionCount={brief.revisionCount}
                    />
                    <div className="flex flex-wrap items-center gap-1.5">
                      {brief.dimensionsSpec ? (
                        <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {dimInfo.pxLabel}
                        </span>
                      ) : null}
                      {brief.linkedTask ? (
                        <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          {brief.linkedTask.taskCode}
                        </span>
                      ) : null}
                      <span className="rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 font-mono text-[10px] font-bold text-blue-700 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                        {brief.projectCode ?? "UMUM"}
                      </span>
                    </div>
                  </div>

                  <div className="min-w-0 space-y-1">
                    <button
                      type="button"
                      onClick={() => setActiveBriefId(brief.id)}
                      className="line-clamp-1 break-words text-left font-heading text-[15px] font-bold text-slate-900 transition-colors hover:text-blue-600 dark:text-white dark:hover:text-blue-400"
                    >
                      {cleanTitle}
                    </button>
                    <p className="line-clamp-2 break-words text-xs leading-relaxed font-medium text-slate-600 dark:text-slate-300">
                      {brief.objective}
                    </p>
                  </div>
                </div>

                {/* Designer Chip & Quick Actions */}
                <div className="space-y-2.5 border-t border-slate-200/80 bg-slate-50/90 px-4 py-3 dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <CreativeAvatar
                        name={brief.assignedDesignerName ?? "Unassigned"}
                        avatarUrl={brief.assignedDesignerAvatarUrl}
                        size="sm"
                        className="ring-2 ring-white dark:ring-slate-800"
                      />
                      <span className="truncate text-xs font-bold text-slate-900 dark:text-slate-100">
                        {brief.assignedDesignerName ?? "Unassigned"}
                      </span>
                    </div>

                    {brief.dueDate ? (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        <Calendar className="size-3 text-slate-500 dark:text-slate-400" />
                        {formatDateId(brief.dueDate)}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {canStartThisBrief ? (
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() => handleStartBrief(brief)}
                        disabled={isPending}
                        className="h-7 flex-1 gap-1 rounded-lg border-slate-300 bg-white font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <Brush className="size-3" />
                        <span>Mulai</span>
                      </Button>
                    ) : null}

                    {canSubmitForThisBrief ? (
                      <Button
                        type="button"
                        size="xs"
                        onClick={() => setSubmitTarget(brief)}
                        className="h-7 flex-1 gap-1 rounded-lg bg-blue-600 font-bold text-white shadow-xs hover:bg-blue-700"
                      >
                        <UploadCloud className="size-3" />
                        <span>Submit v{brief.currentVersion + 1}</span>
                      </Button>
                    ) : null}

                    {brief.status === "SUBMITTED" && canApproveDesign ? (
                      <Link
                        href={`/design/reviews?briefId=${brief.id}`}
                        className="inline-flex h-7 flex-1 items-center justify-center gap-1 rounded-lg bg-amber-600 px-2.5 text-xs font-bold text-white shadow-xs transition-colors hover:bg-amber-700"
                      >
                        <Eye className="size-3" />
                        <span>Review</span>
                      </Link>
                    ) : null}

                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => setActiveBriefId(brief.id)}
                      className="h-7 gap-1 rounded-lg border-slate-200 bg-white font-bold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      <History className="size-3" />
                      <span>Versi ({brief.submissions.length})</span>
                    </Button>

                    {canManageBriefs && brief.status !== "APPROVED" ? (
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="outline"
                        onClick={() => openCreateBriefDialog(brief)}
                        aria-label="Edit Brief"
                        className="size-7 rounded-lg border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        <Edit3 className="size-3" />
                      </Button>
                    ) : null}

                    {canDeleteBriefs ? (
                      <Button
                        type="button"
                        size="icon-xs"
                        variant="outline"
                        onClick={() => setDeleteTarget(brief)}
                        aria-label={`Hapus brief ${cleanTitle}`}
                        title="Hapus Brief"
                        className="size-7 rounded-lg border-rose-200 bg-white text-destructive hover:bg-rose-50 hover:text-destructive dark:border-rose-500/30 dark:bg-slate-800 dark:hover:bg-rose-950/50"
                      >
                        <Trash2 className="size-3" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Brief Detail & Version History Slide-Over */}
      <Sheet
        open={Boolean(activeBrief)}
        onOpenChange={(open) => {
          if (!open) setActiveBriefId(null);
        }}
      >
        <SheetContent
          side="right"
          className="w-full gap-0 bg-slate-50 p-0 sm:max-w-[640px] dark:bg-slate-950"
        >
          {activeBrief ? (
            <>
              <SheetHeader className="border-b border-slate-200 bg-white px-6 py-4 pr-12 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                    {activeBrief.projectCode ?? "UMUM"}
                  </span>
                  {activeBrief.linkedTask ? (
                    <Badge
                      variant="secondary"
                      className="border border-slate-200 bg-slate-100 font-mono text-[10px] font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                    >
                      {activeBrief.linkedTask.taskCode}
                    </Badge>
                  ) : null}
                  <StatusBadge
                    domain="design"
                    value={activeBrief.status}
                    versionNumber={activeBrief.currentVersion}
                    revisionCount={activeBrief.revisionCount}
                  />
                  {activeBrief.contentPlatform ? (
                    <ChannelPill
                      platform={activeBrief.contentPlatform}
                      compact
                      className={
                        VIBRANT_CHANNEL_PILL_CLASS[activeBrief.contentPlatform]
                      }
                    />
                  ) : null}
                  {activeBrief.dimensionsSpec ? (
                    <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                      {parseDimensionSpec(activeBrief.dimensionsSpec).pxLabel}
                    </span>
                  ) : null}
                </div>
                <SheetTitle className="pt-1 break-words font-heading text-lg font-extrabold text-slate-900 dark:text-white">
                  {activeBrief.title.replace(/^(?:Brief:\s*)+/i, "").trim() ||
                    activeBrief.title}
                </SheetTitle>
                <div className="flex flex-wrap items-center gap-2 pt-0.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <CreativeAvatar
                      name={activeBrief.assignedDesignerName ?? "Unassigned"}
                      avatarUrl={activeBrief.assignedDesignerAvatarUrl}
                      size="sm"
                      className="size-5 ring-1 ring-slate-200 dark:ring-slate-700"
                    />
                    <span className="font-bold text-slate-900 dark:text-white">
                      {activeBrief.assignedDesignerName ?? "Unassigned"}
                    </span>
                  </div>
                  <span>·</span>
                  <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    Due: {formatDateTimeId(activeBrief.dueDate)}
                  </span>
                </div>
              </SheetHeader>

              <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                {/* Brief Spec Box */}
                <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-2xs dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="h-3.5 w-1 rounded-full bg-blue-600" />
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                        Brief Spec
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {canManageBriefs && activeBrief.status !== "APPROVED" ? (
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          onClick={() => openCreateBriefDialog(activeBrief)}
                          className="border-slate-200 font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                        >
                          <Edit3 className="size-3" />
                          <span>Edit</span>
                        </Button>
                      ) : null}
                      {canDeleteBriefs ? (
                        <Button
                          type="button"
                          size="xs"
                          variant="outline"
                          onClick={() => setDeleteTarget(activeBrief)}
                          disabled={isDeleting}
                          className="border-rose-200 font-semibold text-destructive hover:bg-rose-50 hover:text-destructive dark:border-rose-500/30 dark:hover:bg-rose-950/50"
                        >
                          <Trash2 className="size-3" />
                          <span>Hapus</span>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                  <p className="whitespace-pre-wrap break-words leading-relaxed font-medium text-slate-800 dark:text-slate-100">
                    {activeBrief.objective}
                  </p>
                  {activeBrief.copyText ? (
                    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/60">
                      <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Copy on Visual
                      </p>
                      <p className="whitespace-pre-wrap break-words font-medium text-slate-900 dark:text-white">
                        {activeBrief.copyText}
                      </p>
                    </div>
                  ) : null}
                  {activeBrief.brandGuidelinesNotes ? (
                    <p className="break-words text-slate-600 dark:text-slate-300">
                      <strong className="font-bold text-slate-900 dark:text-white">
                        Brand:{" "}
                      </strong>
                      {activeBrief.brandGuidelinesNotes}
                    </p>
                  ) : null}
                  {activeBrief.referenceLinks.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {activeBrief.referenceLinks.map((url, idx) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-700 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                        >
                          <ExternalLink className="size-3" />
                          <span>Ref {idx + 1}</span>
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Quick Actions inside Sheet */}
                <div className="flex flex-wrap gap-2">
                  {canSubmitDesign &&
                  activeBrief.status === "PENDING_BRIEF" &&
                  (activeBrief.assignedDesignerId === currentUserId ||
                    canManageBriefs) ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => handleStartBrief(activeBrief)}
                      disabled={isPending}
                      className="rounded-xl border-slate-300 bg-white font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                    >
                      <Brush className="size-3.5" />
                      <span>Mulai Kerjakan</span>
                    </Button>
                  ) : null}

                  {canSubmitDesign &&
                  (activeBrief.status === "PENDING_BRIEF" ||
                    activeBrief.status === "IN_PROGRESS" ||
                    activeBrief.status === "REVISION_REQUESTED") &&
                  (activeBrief.assignedDesignerId === currentUserId ||
                    canManageBriefs) ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setSubmitTarget(activeBrief)}
                      className="rounded-xl bg-blue-600 font-bold text-white shadow-xs hover:bg-blue-700"
                    >
                      <UploadCloud className="size-3.5" />
                      <span>Submit v{activeBrief.currentVersion + 1}</span>
                    </Button>
                  ) : null}

                  {activeBrief.status === "SUBMITTED" && canApproveDesign ? (
                    <Link
                      href={`/design/reviews?briefId=${activeBrief.id}`}
                      className="inline-flex h-8 items-center gap-1.5 rounded-xl bg-amber-600 px-3 text-xs font-bold text-white shadow-xs hover:bg-amber-700"
                    >
                      <Eye className="size-3.5" />
                      <span>Review Sekarang</span>
                    </Link>
                  ) : null}
                </div>

                {/* Version History */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3.5 w-1 rounded-full bg-slate-800 dark:bg-slate-200" />
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                      Riwayat Versi ({activeBrief.submissions.length})
                    </p>
                  </div>

                  {activeBrief.submissions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                      Belum ada submission.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeBrief.submissions.map((sub) => (
                        <div
                          key={sub.id}
                          className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-4 text-xs shadow-2xs dark:border-slate-800 dark:bg-slate-900"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 font-mono text-[11px] font-bold text-white dark:bg-slate-700">
                                v{sub.versionNumber}
                              </span>
                              <StatusBadge domain="design" value={sub.status} />
                              <span className="font-mono text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                {formatDateTimeId(sub.submittedAt)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <Button
                                type="button"
                                size="xs"
                                variant="outline"
                                onClick={() =>
                                  setPreviewTarget({
                                    briefTitle: `${activeBrief.title} (v${sub.versionNumber})`,
                                    submission: sub,
                                  })
                                }
                                className="rounded-lg border-slate-200 font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                              >
                                <Eye className="size-3" />
                                <span>Preview</span>
                              </Button>
                              <Button
                                type="button"
                                size="xs"
                                variant="outline"
                                onClick={() =>
                                  void openAssetOrSubmissionLink({
                                    sourceType: sub.sourceType,
                                    fileUrl: sub.fileUrl,
                                    storageKey: sub.storageKey,
                                    forceDownload: sub.sourceType === "UPLOAD",
                                  })
                                }
                                className="rounded-lg border-slate-200 font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                              >
                                {sub.sourceType === "UPLOAD" ? (
                                  <>
                                    <Download className="size-3" />
                                    <span>Unduh</span>
                                  </>
                                ) : (
                                  <>
                                    <ExternalLink className="size-3" />
                                    <span>Buka</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>

                          <FileTypeBadge
                            sourceType={sub.sourceType}
                            mimeType={sub.mimeType}
                            fileSizeBytes={sub.fileSizeBytes}
                          />

                          {sub.designerNotes ? (
                            <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 font-medium break-words text-slate-800 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                              “{sub.designerNotes}”
                            </p>
                          ) : null}

                          {sub.reviews.length > 0 ? (
                            <div className="space-y-2 border-t border-slate-200/80 pt-2.5 dark:border-slate-800">
                              {sub.reviews.map((rev) => (
                                <div
                                  key={rev.id}
                                  className={cn(
                                    "rounded-xl border p-3 break-words",
                                    rev.decision === "APPROVED"
                                      ? "border-emerald-300 bg-emerald-50/80 dark:border-emerald-500/40 dark:bg-emerald-500/10"
                                      : "border-rose-300 bg-rose-50/80 dark:border-rose-500/40 dark:bg-rose-500/10"
                                  )}
                                >
                                  <p
                                    className={cn(
                                      "font-bold",
                                      rev.decision === "APPROVED"
                                        ? "text-emerald-900 dark:text-emerald-300"
                                        : "text-rose-900 dark:text-rose-300"
                                    )}
                                  >
                                    {rev.decision === "APPROVED"
                                      ? "✓ Approved"
                                      : "↺ Revisi"}{" "}
                                    · {rev.reviewerName}
                                  </p>
                                  <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">
                                    {rev.feedback}
                                  </p>
                                  {rev.revisionChecklist.length > 0 ? (
                                    <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[11px] font-medium text-slate-700 dark:text-slate-300">
                                      {rev.revisionChecklist.map((pt, i) => (
                                        <li key={i}>{pt}</li>
                                      ))}
                                    </ul>
                                  ) : null}
                                </div>
                              ))}
                            </div>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* Submit Design Version Modal */}
      <DesignSubmissionModal
        brief={submitTarget}
        open={Boolean(submitTarget)}
        onOpenChange={(open) => {
          if (!open) setSubmitTarget(null);
        }}
        onSuccess={() => router.refresh()}
      />

      {/* Lightbox Preview Modal */}
      {previewTarget ? (
        <SignedMediaPreviewDialog
          open={Boolean(previewTarget)}
          onOpenChange={(open) => {
            if (!open) setPreviewTarget(null);
          }}
          title={previewTarget.briefTitle}
          subtitle={`${previewTarget.submission.submitterName} · ${formatDateTimeId(previewTarget.submission.submittedAt)}`}
          sourceType={previewTarget.submission.sourceType}
          fileUrl={previewTarget.submission.fileUrl}
          storageKey={previewTarget.submission.storageKey}
          mimeType={previewTarget.submission.mimeType}
          fileSizeBytes={previewTarget.submission.fileSizeBytes}
        />
      ) : null}

      {/* Create / Edit Design Brief Modal */}
      <Dialog open={briefDialogOpen} onOpenChange={setBriefDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingBrief ? "Edit Brief Desain" : "Brief Desain Baru"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveBrief} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="brief-title">Judul Brief *</Label>
                <Input
                  id="brief-title"
                  value={briefTitle}
                  onChange={(e) => setBriefTitle(e.target.value)}
                  required
                  minLength={3}
                  placeholder="Banner Promo Akhir Tahun Krevia"
                />
              </div>

              {!editingBrief ? (
                <div className="min-w-0 space-y-1.5 sm:col-span-2">
                  <Label>Proyek *</Label>
                  <Select
                    value={briefProjectId}
                    onValueChange={(v) => {
                      if (v) setBriefProjectId(v);
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
              ) : null}

              <div className="min-w-0 space-y-1.5">
                <Label>Designer *</Label>
                <Select
                  value={briefDesignerId}
                  onValueChange={(v) => {
                    if (v) setBriefDesignerId(v);
                  }}
                  items={designerItems}
                >
                  <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                    <SelectValue placeholder="Pilih Designer" className="block min-w-0 truncate" />
                  </SelectTrigger>
                  <SelectContent>
                    {designerItems.map((d) => (
                      <SelectItem key={d.value} value={d.value}>
                        <span className="truncate">{d.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="brief-due">Deadline (WIB)</Label>
                <Input
                  id="brief-due"
                  type="datetime-local"
                  value={briefDueLocal}
                  onChange={(e) => setBriefDueLocal(e.target.value)}
                  className="w-full min-w-0 px-2.5 text-xs tabular-nums sm:text-[13px]"
                />
              </div>
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label>Dimensi / Rasio</Label>
              <Select
                value={briefDimensions}
                onValueChange={(v) => {
                  if (v) setBriefDimensions(v);
                }}
                items={DESIGN_DIMENSIONS_PRESETS.map((p) => ({
                  value: p,
                  label: p,
                }))}
              >
                <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                  <SelectValue placeholder="Pilih dimensi" className="block min-w-0 truncate" />
                </SelectTrigger>
                <SelectContent>
                  {DESIGN_DIMENSIONS_PRESETS.map((preset) => (
                    <SelectItem key={preset} value={preset}>
                      <span className="truncate">{preset}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brief-obj">Arahan Visual *</Label>
              <Textarea
                id="brief-obj"
                rows={3}
                value={briefObjective}
                onChange={(e) => setBriefObjective(e.target.value)}
                required
                minLength={5}
                placeholder="Gaya visual, warna, komposisi..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brief-copy">Copy on Visual</Label>
              <Textarea
                id="brief-copy"
                rows={2}
                value={briefCopyText}
                onChange={(e) => setBriefCopyText(e.target.value)}
                placeholder="Headline, subheadline, CTA..."
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brief-guidelines">Brand Notes</Label>
              <Input
                id="brief-guidelines"
                value={briefGuidelines}
                onChange={(e) => setBriefGuidelines(e.target.value)}
                placeholder="Logo dark-navy, font Plus Jakarta Sans"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="brief-ref">Referensi (HTTPS)</Label>
              <div className="flex gap-2">
                <Input
                  id="brief-ref"
                  type="url"
                  value={briefRefInput}
                  onChange={(e) => setBriefRefInput(e.target.value)}
                  placeholder="https://www.figma.com/file/..."
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddBriefRef}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
              {briefRefLinks.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {briefRefLinks.map((url) => (
                    <Badge key={url} variant="secondary" className="max-w-xs gap-1">
                      <span className="truncate">{url}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setBriefRefLinks((prev) =>
                            prev.filter((u) => u !== url)
                          )
                        }
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
                onClick={() => setBriefDialogOpen(false)}
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
                ) : editingBrief ? (
                  "Simpan Perubahan"
                ) : (
                  "Buat Brief"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Hapus Brief Desain?"
        description={`Brief desain "${deleteTarget?.title ?? ""}" beserta riwayat versinya akan dihapus. Task desain terkait akan dilepas sebagai task umum (tidak ikut terhapus).`}
        confirmLabel="Hapus Brief"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
