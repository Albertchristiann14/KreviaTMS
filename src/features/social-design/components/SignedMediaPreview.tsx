"use client";

import { useQuery } from "@tanstack/react-query";
import type { AssetSourceType } from "@prisma/client";
import {
  Download,
  ExternalLink,
  Eye,
  FileText,
  Film,
  Image as ImageIcon,
  Link2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ASSET_SOURCE_TYPE_META } from "@/features/social-design/constants";
import { formatBytes, isImageMime } from "@/features/social-design/utils";

interface SignedDownloadApiResponse {
  downloadUrl: string;
  expiresInSeconds: number;
  forceDownload: boolean;
  error?: string;
}

export async function fetchSignedDownloadUrl(
  storageKey: string,
  forceDownload: boolean = false
): Promise<SignedDownloadApiResponse> {
  const params = new URLSearchParams({ storageKey });
  if (forceDownload) params.set("download", "1");

  const res = await fetch(`/api/uploads/download-url?${params.toString()}`, {
    cache: "no-cache",
  });
  const payload = (await res.json()) as SignedDownloadApiResponse;
  if (!res.ok || !payload.downloadUrl) {
    throw new Error(payload.error ?? "Gagal membuat tautan unduhan.");
  }
  return payload;
}

export async function openAssetOrSubmissionLink(params: {
  sourceType: AssetSourceType;
  fileUrl: string;
  storageKey: string | null;
  forceDownload?: boolean;
}) {
  if (params.sourceType === "UPLOAD" && params.storageKey) {
    try {
      const signed = await fetchSignedDownloadUrl(
        params.storageKey,
        Boolean(params.forceDownload)
      );
      window.open(signed.downloadUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal membuka file storage."
      );
    }
    return;
  }

  window.open(params.fileUrl, "_blank", "noopener,noreferrer");
}

export function FileTypeBadge({
  sourceType,
  mimeType,
  fileSizeBytes,
}: {
  sourceType: AssetSourceType;
  mimeType: string | null;
  fileSizeBytes: number | null;
}) {
  const meta = ASSET_SOURCE_TYPE_META[sourceType];
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant="secondary" className="text-[11px]">
        {meta.label}
      </Badge>
      {mimeType ? (
        <Badge variant="outline" className="font-mono text-[10px]">
          {mimeType.split("/")[1]?.toUpperCase() ?? mimeType}
        </Badge>
      ) : null}
      {fileSizeBytes != null ? (
        <span className="text-[11px] text-muted-foreground">
          {formatBytes(fileSizeBytes)}
        </span>
      ) : null}
    </div>
  );
}

export function InlineSignedMediaCanvas({
  sourceType,
  fileUrl,
  storageKey,
  mimeType,
  title,
}: {
  sourceType: AssetSourceType;
  fileUrl: string;
  storageKey: string | null;
  mimeType: string | null;
  title: string;
}) {
  const isUpload = sourceType === "UPLOAD" && Boolean(storageKey);

  const previewQuery = useQuery({
    queryKey: ["social-design", "signed-preview", storageKey],
    enabled: isUpload,
    queryFn: async () => fetchSignedDownloadUrl(storageKey!, false),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const signedUrl = previewQuery.data?.downloadUrl ?? null;
  const isLoading = previewQuery.isLoading;
  const error =
    previewQuery.error instanceof Error ? previewQuery.error.message : null;

  if (sourceType !== "UPLOAD") {
    const sourceMeta = ASSET_SOURCE_TYPE_META[sourceType];
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-6 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Link2 className="size-5" />
        </div>
        <div className="max-w-full min-w-0 space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Tautan Eksternal ({sourceMeta.label})
          </p>
          <p className="max-w-md truncate text-xs text-muted-foreground">
            {fileUrl}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          onClick={() =>
            window.open(fileUrl, "_blank", "noopener,noreferrer")
          }
        >
          <ExternalLink className="size-3.5" />
          <span>Buka di {sourceMeta.label}</span>
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border bg-muted/20">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <span>Memuat signed preview URL...</span>
        </div>
      </div>
    );
  }

  if (error || !signedUrl) {
    return (
      <div className="flex h-52 flex-col items-center justify-center gap-2 rounded-xl border border-dashed bg-muted/20 p-4 text-center">
        <FileText className="size-7 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">
          {error ?? "Pratinjau file belum tersedia."}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() =>
            void openAssetOrSubmissionLink({
              sourceType,
              fileUrl,
              storageKey,
              forceDownload: true,
            })
          }
        >
          <Download className="size-3.5" />
          <span>Unduh File</span>
        </Button>
      </div>
    );
  }

  if (isImageMime(mimeType)) {
    return (
      <div className="overflow-hidden rounded-xl border bg-muted/20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={signedUrl}
          alt={title}
          className="max-h-[420px] w-full object-contain"
        />
      </div>
    );
  }

  if (mimeType === "video/mp4") {
    return (
      <div className="overflow-hidden rounded-xl border bg-black">
        <video src={signedUrl} controls className="max-h-[420px] w-full" />
      </div>
    );
  }

  if (mimeType === "application/pdf") {
    return (
      <div className="space-y-2">
        <iframe
          src={signedUrl}
          title={title}
          className="h-[420px] w-full rounded-xl border bg-white"
        />
      </div>
    );
  }

  // SVG or other attachment types: download safely rather than rendering raw inline SVG
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed bg-muted/30 p-6 text-center">
      {mimeType?.startsWith("video/") ? (
        <Film className="size-8 text-primary" />
      ) : (
        <ImageIcon className="size-8 text-primary" />
      )}
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">
          {mimeType === "image/svg+xml"
            ? "File SVG diunduh sebagai attachment untuk keamanan."
            : "Gunakan tombol di bawah untuk mengunduh atau membuka file."}
        </p>
      </div>
      <Button
        type="button"
        size="sm"
        onClick={() =>
          void openAssetOrSubmissionLink({
            sourceType,
            fileUrl,
            storageKey,
            forceDownload: true,
          })
        }
      >
        <Download className="size-3.5" />
        <span>Unduh File</span>
      </Button>
    </div>
  );
}

export interface SignedMediaPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle?: string;
  sourceType: AssetSourceType;
  fileUrl: string;
  storageKey: string | null;
  mimeType: string | null;
  fileSizeBytes: number | null;
}

export function SignedMediaPreviewDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  sourceType,
  fileUrl,
  storageKey,
  mimeType,
  fileSizeBytes,
}: SignedMediaPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader className="min-w-0">
          <DialogTitle className="flex min-w-0 items-center gap-2">
            <Eye className="size-4 shrink-0 text-primary" />
            <span className="truncate">{title}</span>
          </DialogTitle>
          {subtitle ? <DialogDescription className="truncate">{subtitle}</DialogDescription> : null}
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <FileTypeBadge
              sourceType={sourceType}
              mimeType={mimeType}
              fileSizeBytes={fileSizeBytes}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() =>
                void openAssetOrSubmissionLink({
                  sourceType,
                  fileUrl,
                  storageKey,
                  forceDownload: sourceType === "UPLOAD",
                })
              }
            >
              {sourceType === "UPLOAD" ? (
                <>
                  <Download className="size-3.5" />
                  <span>Unduh Signed URL</span>
                </>
              ) : (
                <>
                  <ExternalLink className="size-3.5" />
                  <span>Buka Tautan</span>
                </>
              )}
            </Button>
          </div>

          {open ? (
            <InlineSignedMediaCanvas
              sourceType={sourceType}
              fileUrl={fileUrl}
              storageKey={storageKey}
              mimeType={mimeType}
              title={title}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
