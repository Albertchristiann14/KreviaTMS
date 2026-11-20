"use client";

import { useCallback, useState } from "react";
import {
  getMaxBytesForFolder,
  isAllowedMimeForFolder,
  type UploadBucketFolder,
} from "@/lib/validations/common";

export interface PresignedUploadResult {
  sourceType: "UPLOAD";
  storageKey: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
}

interface PresignApiResponse {
  uploadUrl: string;
  storageKey: string;
  expiresInSeconds: number;
  error?: string;
}

function uploadBlobWithProgress(
  uploadUrl: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) {
        const pct = Math.min(99, Math.round((event.loaded / event.total) * 100));
        onProgress(pct);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(100);
        resolve();
      } else {
        reject(
          new Error(
            `Gagal mengunggah file ke object storage (HTTP ${xhr.status}).`
          )
        );
      }
    };

    xhr.onerror = () => {
      reject(new Error("Koneksi terputus saat mengunggah file ke storage."));
    };

    xhr.onabort = () => {
      reject(new Error("Unggahan file dibatalkan."));
    };

    xhr.send(file);
  });
}

export function usePresignedUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
  }, []);

  const uploadFile = useCallback(
    async (
      file: File,
      bucketFolder: UploadBucketFolder
    ): Promise<PresignedUploadResult> => {
      setError(null);
      setProgress(0);

      const maxBytes = getMaxBytesForFolder(bucketFolder);
      if (file.size <= 0) {
        const msg = "File kosong tidak dapat diunggah.";
        setError(msg);
        throw new Error(msg);
      }

      if (file.size > maxBytes) {
        const maxMb = Math.round(maxBytes / (1024 * 1024));
        const msg = `Ukuran file melebihi batas maksimal ${maxMb} MB. Gunakan tab External Link untuk file berukuran besar.`;
        setError(msg);
        throw new Error(msg);
      }

      if (!isAllowedMimeForFolder(bucketFolder, file.type)) {
        const msg = `Tipe file "${file.type || "tidak diketahui"}" tidak diizinkan untuk folder ${bucketFolder}.`;
        setError(msg);
        throw new Error(msg);
      }

      setIsUploading(true);
      try {
        const presignRes = await fetch("/api/uploads/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bucketFolder,
            fileName: file.name,
            mimeType: file.type,
            fileSizeBytes: file.size,
          }),
        });

        const payload = (await presignRes.json()) as PresignApiResponse;
        if (!presignRes.ok || !payload.uploadUrl || !payload.storageKey) {
          throw new Error(
            payload.error ?? "Gagal meminta URL unggahan presigned."
          );
        }

        await uploadBlobWithProgress(payload.uploadUrl, file, setProgress);

        return {
          sourceType: "UPLOAD",
          storageKey: payload.storageKey,
          fileName: file.name,
          mimeType: file.type,
          fileSizeBytes: file.size,
        };
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat mengunggah file.";
        setError(message);
        throw new Error(message);
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  return {
    uploadFile,
    isUploading,
    progress,
    error,
    reset,
  };
}
