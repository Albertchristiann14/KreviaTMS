"use client";

import { useRef, useState, type DragEvent } from "react";
import {
  AlertCircle,
  CheckCircle2,
  FileUp,
  Link2,
  Loader2,
  UploadCloud,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePresignedUpload } from "@/features/social-design/hooks/usePresignedUpload";
import {
  detectExternalSourceType,
  getAllowedMimesForFolder,
  getMaxBytesForFolder,
  validateSafeExternalHttpsUrl,
  type ExternalCloudSourceType,
  type UploadBucketFolder,
} from "@/lib/validations/common";
import { cn } from "@/lib/utils";

export type FileDropzonePayload =
  | {
      sourceType: "UPLOAD";
      storageKey: string;
      fileName: string;
      mimeType: string;
      fileSizeBytes: number;
    }
  | {
      sourceType: ExternalCloudSourceType;
      fileUrl: string;
      fileName: string;
      mimeType: null;
      fileSizeBytes: null;
    };

export interface FileUploadDropzoneProps {
  bucketFolder: UploadBucketFolder;
  allowExternalLink?: boolean;
  onComplete: (result: FileDropzonePayload) => void;
  className?: string;
}

const SOURCE_LABELS: Record<ExternalCloudSourceType, string> = {
  FIGMA: "Figma",
  CANVA: "Canva",
  GOOGLE_DRIVE: "Google Drive",
  OTHER_LINK: "External HTTPS Link",
};

function formatMb(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

export function FileUploadDropzone({
  bucketFolder,
  allowExternalLink = bucketFolder !== "avatars",
  onComplete,
  className,
}: FileUploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const { uploadFile, isUploading, progress, error: uploadError, reset } =
    usePresignedUpload();

  const [activeTab, setActiveTab] = useState<"upload" | "external">("upload");
  const [isDragActive, setIsDragActive] = useState(false);
  const [sizeExceededNotice, setSizeExceededNotice] = useState<string | null>(
    null
  );
  const [completedFileName, setCompletedFileName] = useState<string | null>(
    null
  );

  const [externalUrl, setExternalUrl] = useState("");
  const [externalLabel, setExternalLabel] = useState("");
  const [externalError, setExternalError] = useState<string | null>(null);

  const maxBytes = getMaxBytesForFolder(bucketFolder);
  const acceptAttr = getAllowedMimesForFolder(bucketFolder).join(",");
  const detectedSource = externalUrl.trim()
    ? detectExternalSourceType(externalUrl)
    : null;

  const processFile = async (file: File) => {
    setSizeExceededNotice(null);
    setCompletedFileName(null);
    reset();

    if (file.size > maxBytes) {
      const msg = `File "${file.name}" berukuran ${(file.size / (1024 * 1024)).toFixed(1)} MB, melebihi batas Direct Upload (${formatMb(maxBytes)}). ${
        allowExternalLink
          ? "Gunakan tab External Link untuk file mentah berukuran besar (Figma, Canva, Google Drive)."
          : ""
      }`;
      setSizeExceededNotice(msg);
      return;
    }

    try {
      const result = await uploadFile(file, bucketFolder);
      setCompletedFileName(result.fileName);
      onComplete(result);
    } catch {
      // Error surfaced via hook state
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void processFile(file);
    }
  };

  const handleExternalSubmit = () => {
    setExternalError(null);
    const validation = validateSafeExternalHttpsUrl(externalUrl);
    if (!validation.valid || !validation.normalizedUrl) {
      setExternalError(validation.error ?? "URL tidak valid.");
      return;
    }

    const sourceType = detectExternalSourceType(validation.normalizedUrl);
    const fallbackName =
      externalLabel.trim() || `${SOURCE_LABELS[sourceType]} Link`;

    onComplete({
      sourceType,
      fileUrl: validation.normalizedUrl,
      fileName: fallbackName,
      mimeType: null,
      fileSizeBytes: null,
    });
    setCompletedFileName(fallbackName);
  };

  const uploadContent = (
    <div className="space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragActive(true);
        }}
        onDragLeave={() => setIsDragActive(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-border bg-muted/20 hover:border-primary/50 hover:bg-muted/40",
          isUploading && "pointer-events-none opacity-80"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={acceptAttr}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              void processFile(file);
            }
            e.target.value = "";
          }}
        />
        {isUploading ? (
          <>
            <Loader2 className="mb-2 size-7 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground">
              Mengunggah ke storage... {progress}%
            </p>
            <div className="mt-2 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : (
          <>
            <UploadCloud className="mb-2 size-7 text-primary" />
            <p className="text-sm font-medium text-foreground">
              Tarik & lepas file ke sini, atau klik untuk memilih
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Maks. {formatMb(maxBytes)} per file via Direct Presigned Upload
            </p>
          </>
        )}
      </div>

      {sizeExceededNotice ? (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-600" />
            <p>{sizeExceededNotice}</p>
          </div>
          {allowExternalLink ? (
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={() => setActiveTab("external")}
              className="shrink-0 border-amber-300 bg-white text-amber-900 hover:bg-amber-100"
            >
              Buka External Link
            </Button>
          ) : null}
        </div>
      ) : null}

      {uploadError ? (
        <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p>{uploadError}</p>
        </div>
      ) : null}

      {completedFileName && !uploadError && !isUploading ? (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-xs text-emerald-800">
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span className="truncate font-medium">
            Siap dilampirkan: {completedFileName}
          </span>
        </div>
      ) : null}
    </div>
  );

  if (!allowExternalLink) {
    return <div className={cn("w-full", className)}>{uploadContent}</div>;
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={(val) =>
        setActiveTab(val === "external" ? "external" : "upload")
      }
      className={cn("w-full", className)}
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="upload" className="gap-1.5">
          <FileUp className="size-3.5" />
          <span>Upload File ({`<= ${formatMb(maxBytes)}`})</span>
        </TabsTrigger>
        <TabsTrigger value="external" className="gap-1.5">
          <Link2 className="size-3.5" />
          <span>External Cloud Link</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="upload" className="pt-2">
        {uploadContent}
      </TabsContent>

      <TabsContent value="external" className="space-y-3 pt-2">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="ktms-external-url">Tautan Cloud (HTTPS)</Label>
            {detectedSource ? (
              <Badge variant="secondary" className="text-[11px]">
                {SOURCE_LABELS[detectedSource]}
              </Badge>
            ) : null}
          </div>
          <Input
            id="ktms-external-url"
            type="url"
            value={externalUrl}
            onChange={(e) => {
              setExternalUrl(e.target.value);
              setExternalError(null);
            }}
            placeholder="https://www.figma.com/file/... atau https://drive.google.com/..."
          />
          <p className="text-[11px] text-muted-foreground">
            Wajib digunakan untuk file mentah &gt; 25 MB (Figma, Canva, Google
            Drive). Hanya menerima protokol HTTPS publik.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ktms-external-label">
            Nama Tampilan (Opsional)
          </Label>
          <Input
            id="ktms-external-label"
            type="text"
            value={externalLabel}
            onChange={(e) => setExternalLabel(e.target.value)}
            placeholder="Misal: Master Figma Carousel Q4"
          />
        </div>

        {externalError ? (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <p>{externalError}</p>
          </div>
        ) : null}

        <div className="flex justify-end">
          <Button type="button" onClick={handleExternalSubmit} size="sm">
            Simpan External Link
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );
}
