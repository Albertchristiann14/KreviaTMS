"use client";

import { useState, useTransition } from "react";
import type { SocialPlatform } from "@prisma/client";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  Download,
  ExternalLink,
  Loader2,
  Plus,
  RotateCcw,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { reviewDesignSubmissionAction } from "@/features/social-design/actions/design.actions";
import {
  FileTypeBadge,
  InlineSignedMediaCanvas,
  openAssetOrSubmissionLink,
} from "@/features/social-design/components/SignedMediaPreview";
import {
  ChannelPill,
  CreativeAvatar,
  parseDimensionSpec,
} from "@/features/social-design/components/StudioPrimitives";
import type { DesignBriefDTO } from "@/features/social-design/types";
import {
  formatDateTimeId,
  fromJakartaDatetimeLocalValue,
  parseTagsInput,
} from "@/features/social-design/utils";
import { cn } from "@/lib/utils";

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

export interface DesignApprovalDrawerProps {
  brief: DesignBriefDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  canApprove: boolean;
  onSuccess?: () => void;
}

export interface DesignReviewInspectorProps {
  brief: DesignBriefDTO;
  currentUserId: string;
  canApprove: boolean;
  onCompleted?: () => void;
  compactHeader?: boolean;
}

export function DesignReviewInspector({
  brief,
  currentUserId,
  canApprove,
  onCompleted,
  compactHeader = false,
}: DesignReviewInspectorProps) {
  const [isPending, startTransition] = useTransition();

  const [mode, setMode] = useState<"APPROVE" | "REVISION">("APPROVE");
  const [feedback, setFeedback] = useState("");
  const [promoteToAsset, setPromoteToAsset] = useState(true);
  const [assetTagsRaw, setAssetTagsRaw] = useState("");
  const [checklistInput, setChecklistInput] = useState("");
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [revisionDueLocal, setRevisionDueLocal] = useState("");

  const latestSubmission = brief.submissions[0] ?? null;
  const isSelfSubmission = latestSubmission?.submittedBy === currentUserId;
  const canSubmitDecision =
    canApprove &&
    !isSelfSubmission &&
    latestSubmission !== null &&
    latestSubmission.status === "SUBMITTED" &&
    brief.status === "SUBMITTED";

  const cleanTitle =
    brief.title.replace(/^(?:Brief:\s*)+/i, "").trim() || brief.title;
  const dim = parseDimensionSpec(brief.dimensionsSpec);

  const handleAddChecklistItem = () => {
    const trimmed = checklistInput.trim();
    if (!trimmed) return;
    if (checklistItems.length >= 20) return;
    setChecklistItems((prev) => [...prev, trimmed]);
    setChecklistInput("");
  };

  const handleApprove = () => {
    if (!latestSubmission) return;
    startTransition(async () => {
      try {
        const res = await reviewDesignSubmissionAction({
          submissionId: latestSubmission.id,
          decision: "APPROVED",
          feedback: feedback.trim(),
          promoteToAssetLibrary: promoteToAsset,
          assetTags: parseTagsInput(assetTagsRaw),
          revisionChecklist: [],
        });

        if (!res.success) {
          toast.error(res.error.message);
          return;
        }

        toast.success(
          res.message ?? "Desain disetujui & masuk Asset Library."
        );
        onCompleted?.();
      } catch {
        toast.error("Gagal menyetujui desain.");
      }
    });
  };

  const handleRequestRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!latestSubmission) return;
    if (feedback.trim().length < 10) {
      toast.error("Catatan revisi wajib minimal 10 karakter.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await reviewDesignSubmissionAction({
          submissionId: latestSubmission.id,
          decision: "REVISION_REQUESTED",
          feedback: feedback.trim(),
          revisionChecklist: checklistItems,
          revisionDueDate: fromJakartaDatetimeLocalValue(revisionDueLocal),
          promoteToAssetLibrary: false,
          assetTags: [],
        });

        if (!res.success) {
          const firstErr = res.error.fieldErrors
            ? Object.values(res.error.fieldErrors).flat()[0]
            : null;
          toast.error(firstErr ?? res.error.message);
          return;
        }

        toast.success(res.message ?? "Permintaan revisi terkirim.");
        onCompleted?.();
      } catch {
        toast.error("Gagal mengirim permintaan revisi.");
      }
    });
  };

  return (
    <div className="space-y-5">
      {compactHeader ? (
        <div className="space-y-2.5 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
              {brief.projectCode}
            </span>
            {brief.linkedTask ? (
              <Badge
                variant="secondary"
                className="border border-slate-200 bg-slate-100 font-mono text-[10px] font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                {brief.linkedTask.taskCode}
              </Badge>
            ) : null}
            <StatusBadge
              domain="design"
              value={brief.status}
              versionNumber={brief.currentVersion}
              revisionCount={brief.revisionCount}
            />
            {brief.contentPlatform ? (
              <ChannelPill
                platform={brief.contentPlatform}
                compact
                className={VIBRANT_CHANNEL_PILL_CLASS[brief.contentPlatform]}
              />
            ) : null}
            {brief.dimensionsSpec ? (
              <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                {dim.pxLabel}
              </span>
            ) : null}
          </div>
          <h2 className="break-words font-heading text-lg font-extrabold tracking-tight text-slate-900 dark:text-white">
            {cleanTitle}
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-1.5">
              <CreativeAvatar
                name={brief.assignedDesignerName ?? "Unassigned"}
                avatarUrl={brief.assignedDesignerAvatarUrl}
                size="sm"
                className="size-5 ring-1 ring-slate-200 dark:ring-slate-700"
              />
              <span className="font-bold text-slate-900 dark:text-white">
                {brief.assignedDesignerName ?? "—"}
              </span>
            </div>
            <span>·</span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Due: {formatDateTimeId(brief.dueDate)}
            </span>
            <span>·</span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              Rev #{brief.revisionCount}
            </span>
          </div>
        </div>
      ) : null}

      {brief.revisionCount >= 3 ? (
        <div className="flex items-center gap-2.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs font-bold text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200">
          <AlertTriangle className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
          <span>
            High Revision ({brief.revisionCount}× revisi) — pertimbangkan
            sinkronisasi singkat dengan designer.
          </span>
        </div>
      ) : null}

      {/* Visual Canvas Stage */}
      {latestSubmission ? (
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-100 p-4 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-slate-900 px-2.5 py-0.5 font-mono text-[11px] font-bold text-white dark:bg-slate-800">
                v{latestSubmission.versionNumber}
              </span>
              <StatusBadge domain="design" value={latestSubmission.status} />
              <FileTypeBadge
                sourceType={latestSubmission.sourceType}
                mimeType={latestSubmission.mimeType}
                fileSizeBytes={latestSubmission.fileSizeBytes}
              />
            </div>

            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() =>
                void openAssetOrSubmissionLink({
                  sourceType: latestSubmission.sourceType,
                  fileUrl: latestSubmission.fileUrl,
                  storageKey: latestSubmission.storageKey,
                  forceDownload: latestSubmission.sourceType === "UPLOAD",
                })
              }
              className="rounded-lg border-slate-300 bg-white font-bold text-slate-800 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            >
              {latestSubmission.sourceType === "UPLOAD" ? (
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

          <InlineSignedMediaCanvas
            sourceType={latestSubmission.sourceType}
            fileUrl={latestSubmission.fileUrl}
            storageKey={latestSubmission.storageKey}
            mimeType={latestSubmission.mimeType}
            title={`${cleanTitle} v${latestSubmission.versionNumber}`}
          />

          {latestSubmission.designerNotes ? (
            <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs break-words dark:border-slate-800 dark:bg-slate-900">
              <span className="font-bold text-slate-900 dark:text-white">
                Catatan Designer:{" "}
              </span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                “{latestSubmission.designerNotes}”
              </span>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          Belum ada submission pada brief ini.
        </div>
      )}

      {/* Decision Action Bar */}
      {canSubmitDecision ? (
        <div className="space-y-4 rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-xs dark:border-slate-700 dark:bg-slate-900">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-3.5 w-1 rounded-full bg-blue-600" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                Keputusan Review v{latestSubmission.versionNumber}
              </span>
            </div>
            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setMode("APPROVE")}
                className={cn(
                  "gap-1.5 rounded-lg font-bold transition-all",
                  mode === "APPROVE"
                    ? "bg-emerald-600 text-white shadow-xs hover:bg-emerald-700 hover:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                )}
              >
                <BadgeCheck className="size-3.5" />
                <span>Approve</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setMode("REVISION")}
                className={cn(
                  "gap-1.5 rounded-lg font-bold transition-all",
                  mode === "REVISION"
                    ? "bg-rose-600 text-white shadow-xs hover:bg-rose-700 hover:text-white"
                    : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                )}
              >
                <RotateCcw className="size-3.5" />
                <span>Minta Revisi</span>
              </Button>
            </div>
          </div>

          {mode === "APPROVE" ? (
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100">
                <Checkbox
                  checked={promoteToAsset}
                  onCheckedChange={(c) => setPromoteToAsset(Boolean(c))}
                />
                <span>Simpan otomatis ke Asset Library</span>
              </label>

              {promoteToAsset ? (
                <div className="space-y-1.5">
                  <Label
                    htmlFor={`rev-asset-tags-${brief.id}`}
                    className="text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    Asset Tags (pisahkan koma)
                  </Label>
                  <Input
                    id={`rev-asset-tags-${brief.id}`}
                    value={assetTagsRaw}
                    onChange={(e) => setAssetTagsRaw(e.target.value)}
                    placeholder="q4, carousel, campaign"
                    className="border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100"
                  />
                </div>
              ) : null}

              <div className="space-y-1.5">
                <Label
                  htmlFor={`rev-approve-note-${brief.id}`}
                  className="text-xs font-bold text-slate-700 dark:text-slate-200"
                >
                  Catatan (Opsional)
                </Label>
                <Textarea
                  id={`rev-approve-note-${brief.id}`}
                  rows={2}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Visual rapi & siap tayang..."
                  className="border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleApprove}
                  disabled={isPending}
                  className="gap-1.5 rounded-xl bg-emerald-600 font-bold text-white shadow-sm hover:bg-emerald-700"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Menyetujui...</span>
                    </>
                  ) : (
                    <>
                      <Check className="size-4" />
                      <span>Approve &amp; Siap Tayang</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleRequestRevision} className="space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor={`rev-notes-${brief.id}`}
                    className="text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    Catatan Revisi *
                  </Label>
                  <span
                    className={cn(
                      "rounded-md px-2 py-0.5 font-mono text-[11px] font-bold",
                      feedback.trim().length < 10
                        ? "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                    )}
                  >
                    {feedback.trim().length} / min 10
                  </span>
                </div>
                <Textarea
                  id={`rev-notes-${brief.id}`}
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  required
                  minLength={10}
                  placeholder="Perjelas slide/bagian yang perlu direvisi..."
                  className="border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <Label
                  htmlFor={`rev-checklist-${brief.id}`}
                  className="text-xs font-bold text-slate-700 dark:text-slate-200"
                >
                  Checklist Revisi
                </Label>
                <div className="flex gap-2">
                  <Input
                    id={`rev-checklist-${brief.id}`}
                    value={checklistInput}
                    onChange={(e) => setChecklistInput(e.target.value)}
                    placeholder="Tambah poin checklist..."
                    className="border-slate-200 bg-slate-50 text-xs font-medium text-slate-900 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddChecklistItem}
                    className="border-slate-300 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <Plus className="size-4" />
                  </Button>
                </div>
                {checklistItems.length > 0 ? (
                  <ul className="space-y-1.5 pt-1">
                    {checklistItems.map((item, idx) => (
                      <li
                        key={`${item}-${idx}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                      >
                        <span className="min-w-0 flex-1 break-words">
                          {idx + 1}. {item}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setChecklistItems((prev) =>
                              prev.filter((_, i) => i !== idx)
                            )
                          }
                          aria-label="Hapus poin checklist"
                          className="shrink-0"
                        >
                          <X className="size-3.5 text-slate-500 hover:text-rose-600" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <div className="min-w-0 space-y-1.5">
                <Label
                  htmlFor={`rev-due-${brief.id}`}
                  className="text-xs font-bold text-slate-700 dark:text-slate-200"
                >
                  Deadline Revisi (WIB)
                </Label>
                <Input
                  id={`rev-due-${brief.id}`}
                  type="datetime-local"
                  value={revisionDueLocal}
                  onChange={(e) => setRevisionDueLocal(e.target.value)}
                  className="w-full min-w-0 border-slate-200 bg-slate-50 px-2.5 text-xs font-semibold tabular-nums text-slate-900 sm:text-[13px] dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  variant="destructive"
                  disabled={isPending}
                  className="gap-1.5 rounded-xl bg-rose-600 font-bold text-white shadow-sm hover:bg-rose-700"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      <span>Mengirim...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="size-4" />
                      <span>Kirim Revisi (#{brief.revisionCount + 1})</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      ) : isSelfSubmission ? (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs font-bold text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200">
          Tidak dapat menyetujui submission milik sendiri.
        </div>
      ) : null}

      {/* Compact Brief Spec & Version Timeline */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="h-3.5 w-1 rounded-full bg-slate-800 dark:bg-slate-200" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
            Brief &amp; Riwayat Revisi ({brief.submissions.length})
          </span>
        </div>

        <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs break-words dark:border-slate-800 dark:bg-slate-800/50">
          <p className="leading-relaxed text-slate-800 dark:text-slate-100">
            <strong className="font-bold text-slate-900 dark:text-white">
              Objektif:{" "}
            </strong>
            {brief.objective}
          </p>
          {brief.copyText ? (
            <p className="leading-relaxed text-slate-700 dark:text-slate-200">
              <strong className="font-bold text-slate-900 dark:text-white">
                Copy:{" "}
              </strong>
              {brief.copyText}
            </p>
          ) : null}
          {brief.dimensionsSpec ? (
            <p className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <strong className="font-sans font-bold text-slate-900 dark:text-white">
                Dimensi:
              </strong>{" "}
              {brief.dimensionsSpec}
            </p>
          ) : null}
        </div>

        <div className="space-y-2.5">
          {brief.submissions.map((sub) => (
            <div
              key={sub.id}
              className="space-y-2.5 rounded-xl border border-slate-200 bg-white p-3.5 text-xs shadow-2xs dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-slate-900 px-2 py-0.5 font-mono text-[10px] font-bold text-white dark:bg-slate-700">
                    v{sub.versionNumber}
                  </span>
                  <StatusBadge domain="design" value={sub.status} />
                  <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                    <strong className="font-bold text-slate-900 dark:text-white">
                      {sub.submitterName}
                    </strong>{" "}
                    · {formatDateTimeId(sub.submittedAt)}
                  </span>
                </div>
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
                  Buka
                </Button>
              </div>

              {sub.designerNotes ? (
                <p className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] font-medium break-words text-slate-800 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
                  “{sub.designerNotes}”
                </p>
              ) : null}

              {sub.reviews.map((rev) => (
                <div
                  key={rev.id}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-[11px] break-words",
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
                    {rev.decision === "APPROVED" ? "✓ Approved" : "↺ Revisi"} ·{" "}
                    {rev.reviewerName}
                  </p>
                  <p className="mt-0.5 font-medium text-slate-800 dark:text-slate-200">
                    {rev.feedback}
                  </p>
                  {rev.revisionChecklist.length > 0 ? (
                    <ul className="mt-1 list-disc space-y-0.5 pl-4 font-medium text-slate-700 dark:text-slate-300">
                      {rev.revisionChecklist.map((pt, idx) => (
                        <li key={idx}>{pt}</li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DesignApprovalDrawer({
  brief,
  open,
  onOpenChange,
  currentUserId,
  canApprove,
  onSuccess,
}: DesignApprovalDrawerProps) {
  if (!brief) return null;

  const cleanTitle =
    brief.title.replace(/^(?:Brief:\s*)+/i, "").trim() || brief.title;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 bg-slate-50 p-0 sm:max-w-[680px] dark:bg-slate-950"
      >
        {open ? (
          <>
            <SheetHeader className="border-b border-slate-200 bg-white px-6 py-4 pr-12 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="outline"
                  className="border-slate-200 bg-slate-100 font-mono text-[10px] font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {brief.projectCode}
                </Badge>
                {brief.linkedTask ? (
                  <Badge
                    variant="secondary"
                    className="border border-slate-200 bg-slate-100 font-mono text-[10px] font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    {brief.linkedTask.taskCode}
                  </Badge>
                ) : null}
                <StatusBadge
                  domain="design"
                  value={brief.status}
                  versionNumber={brief.currentVersion}
                  revisionCount={brief.revisionCount}
                />
                {brief.contentPlatform ? (
                  <ChannelPill
                    platform={brief.contentPlatform}
                    compact
                    className={
                      VIBRANT_CHANNEL_PILL_CLASS[brief.contentPlatform]
                    }
                  />
                ) : null}
              </div>
              <SheetTitle className="pt-1 break-words font-heading text-lg font-extrabold text-slate-900 dark:text-white">
                {cleanTitle}
              </SheetTitle>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <CreativeAvatar
                  name={brief.assignedDesignerName ?? "Unassigned"}
                  avatarUrl={brief.assignedDesignerAvatarUrl}
                  size="sm"
                  className="size-5 ring-1 ring-slate-200 dark:ring-slate-700"
                />
                <span className="font-bold text-slate-900 dark:text-white">
                  {brief.assignedDesignerName ?? "—"}
                </span>
                <span>·</span>
                <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {formatDateTimeId(brief.dueDate)}
                </span>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <DesignReviewInspector
                key={brief.id}
                brief={brief}
                currentUserId={currentUserId}
                canApprove={canApprove}
                onCompleted={() => {
                  onOpenChange(false);
                  onSuccess?.();
                }}
              />
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
