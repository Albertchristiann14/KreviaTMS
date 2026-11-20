"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import {
  FileUploadDropzone,
  type FileDropzonePayload,
} from "@/components/shared/FileUploadDropzone";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitDesignAction } from "@/features/social-design/actions/design.actions";
import { parseDimensionSpec } from "@/features/social-design/components/StudioPrimitives";
import { ASSET_SOURCE_TYPE_META } from "@/features/social-design/constants";
import type { DesignBriefDTO } from "@/features/social-design/types";
import { formatBytes } from "@/features/social-design/utils";

export interface DesignSubmissionModalProps {
  brief: DesignBriefDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

function DesignSubmissionModalBody({
  brief,
  onOpenChange,
  onSuccess,
}: {
  brief: DesignBriefDTO;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [payload, setPayload] = useState<FileDropzonePayload | null>(null);
  const [designerNotes, setDesignerNotes] = useState("");

  const nextVersion = brief.currentVersion + 1;
  const displayBriefTitle =
    brief.title.replace(/^(?:Brief:\s*)+/i, "").trim() || brief.title;
  const dim = parseDimensionSpec(brief.dimensionsSpec);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payload) {
      toast.error("Unggah file atau simpan tautan desain terlebih dahulu.");
      return;
    }

    startTransition(async () => {
      try {
        const res = await submitDesignAction({
          designBriefId: brief.id,
          sourceType: payload.sourceType,
          storageKey:
            payload.sourceType === "UPLOAD" ? payload.storageKey : null,
          externalUrl:
            payload.sourceType !== "UPLOAD" ? payload.fileUrl : null,
          fileName: payload.fileName,
          mimeType: payload.mimeType,
          fileSizeBytes: payload.fileSizeBytes,
          designerNotes: designerNotes.trim() || null,
        });

        if (!res.success) {
          const firstErr = res.error.fieldErrors
            ? Object.values(res.error.fieldErrors).flat()[0]
            : null;
          toast.error(firstErr ?? res.error.message);
          return;
        }

        toast.success(
          res.message ?? `Desain v${nextVersion} berhasil dikumpulkan.`
        );
        onOpenChange(false);
        onSuccess?.();
      } catch {
        toast.error("Gagal mengumpulkan karya desain.");
      }
    });
  };

  return (
    <>
      <DialogHeader className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-zinc-950 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-white dark:bg-zinc-800">
            v{nextVersion}
          </span>
          <DialogTitle className="font-heading">Submit Karya Desain</DialogTitle>
          {brief.dimensionsSpec ? (
            <span className="rounded-full border border-border bg-muted/60 px-2 py-0.5 font-mono text-[10px] font-medium text-muted-foreground">
              {dim.pxLabel}
            </span>
          ) : null}
        </div>
        <p className="truncate text-xs font-medium text-muted-foreground">
          {displayBriefTitle}
        </p>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <FileUploadDropzone
          bucketFolder="design-submissions"
          allowExternalLink={true}
          onComplete={(result) => setPayload(result)}
        />

        {payload ? (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200/80 bg-emerald-500/10 px-3.5 py-2.5 text-xs text-emerald-900 dark:border-emerald-500/30 dark:text-emerald-200">
            <div className="flex min-w-0 items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <div className="min-w-0">
                <p className="truncate font-semibold">{payload.fileName}</p>
                <p className="text-[11px] opacity-80">
                  {ASSET_SOURCE_TYPE_META[payload.sourceType].label}
                  {payload.fileSizeBytes != null
                    ? ` · ${formatBytes(payload.fileSizeBytes)}`
                    : ""}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setPayload(null)}
            >
              Ganti
            </Button>
          </div>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="designer-notes">Catatan Designer</Label>
          <Textarea
            id="designer-notes"
            rows={2}
            value={designerNotes}
            onChange={(e) => setDesignerNotes(e.target.value)}
            maxLength={2000}
            placeholder="Catatan singkat versi ini (opsional)..."
          />
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Batal
          </Button>
          <Button type="submit" disabled={isPending || !payload}>
            {isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Mengunggah...</span>
              </>
            ) : (
              <>
                <UploadCloud className="size-4" />
                <span>Submit v{nextVersion}</span>
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

export function DesignSubmissionModal({
  brief,
  open,
  onOpenChange,
  onSuccess,
}: DesignSubmissionModalProps) {
  if (!brief) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        {open ? (
          <DesignSubmissionModalBody
            key={brief.id}
            brief={brief}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
