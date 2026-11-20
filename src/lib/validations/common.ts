import { z } from "zod";

/**
 * Upload caps & signed URL TTL constants (Runbook §3.4.A).
 */
export const MAX_UPLOAD_FILE_BYTES = 26_214_400; // 25 MB
export const MAX_AVATAR_FILE_BYTES = 2_097_152; // 2 MB
export const PRESIGN_UPLOAD_TTL_SECONDS = 300; // 5 minutes
export const SIGNED_DOWNLOAD_TTL_SECONDS = 900; // 15 minutes
export const PRESIGN_RATE_LIMIT_MAX_PER_MIN = 30;

export const UPLOAD_BUCKET_FOLDERS = [
  "design-submissions",
  "assets",
  "task-attachments",
  "avatars",
] as const;
export type UploadBucketFolder = (typeof UPLOAD_BUCKET_FOLDERS)[number];

export const AVATAR_ALLOWED_MIMES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const DESIGN_ASSET_ALLOWED_MIMES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "video/mp4",
] as const;

export const TASK_ATTACHMENT_ALLOWED_MIMES = [
  ...DESIGN_ASSET_ALLOWED_MIMES,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/csv",
  "application/zip",
] as const;

export function getMaxBytesForFolder(folder: UploadBucketFolder): number {
  return folder === "avatars" ? MAX_AVATAR_FILE_BYTES : MAX_UPLOAD_FILE_BYTES;
}

export function getAllowedMimesForFolder(
  folder: UploadBucketFolder
): readonly string[] {
  switch (folder) {
    case "avatars":
      return AVATAR_ALLOWED_MIMES;
    case "design-submissions":
    case "assets":
      return DESIGN_ASSET_ALLOWED_MIMES;
    case "task-attachments":
      return TASK_ATTACHMENT_ALLOWED_MIMES;
  }
}

export function isAllowedMimeForFolder(
  folder: UploadBucketFolder,
  mimeType: string
): boolean {
  const normalized = mimeType.trim().toLowerCase();
  if (!normalized) return false;
  if (
    folder === "task-attachments" &&
    normalized.startsWith("application/vnd.openxmlformats-officedocument.")
  ) {
    return true;
  }
  return getAllowedMimesForFolder(folder).includes(normalized);
}

/**
 * Strip path traversal tokens and produce a safe slugified filename.
 */
export function sanitizeUploadFileName(rawName: string): string {
  const base = rawName.split(/[\\/]/).pop()?.trim() ?? "file";
  const lastDot = base.lastIndexOf(".");
  const rawStem = lastDot > 0 ? base.slice(0, lastDot) : base;
  const rawExt = lastDot > 0 ? base.slice(lastDot + 1) : "";

  const slugStem =
    rawStem
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "file";

  const cleanExt = rawExt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 10);

  return cleanExt ? `${slugStem}.${cleanExt}` : slugStem;
}

export function isSvgAsset(fileNameOrKey: string, mimeType?: string | null): boolean {
  if (mimeType && mimeType.trim().toLowerCase() === "image/svg+xml") {
    return true;
  }
  const cleanPath = fileNameOrKey.split("?")[0]?.toLowerCase() ?? "";
  return cleanPath.endsWith(".svg");
}

function isPrivateOrBlockedIpv4(host: string): boolean {
  const ipv4Match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!ipv4Match) return false;

  const octets = [
    Number(ipv4Match[1]),
    Number(ipv4Match[2]),
    Number(ipv4Match[3]),
    Number(ipv4Match[4]),
  ];
  if (octets.some((o) => Number.isNaN(o) || o < 0 || o > 255)) {
    return true;
  }

  const [a, b] = octets as [number, number, number, number];
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 169 && b === 254) return true; // Cloud metadata / link-local
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a >= 224) return true; // Multicast / reserved
  return false;
}

function isPrivateOrBlockedHostname(rawHost: string): boolean {
  const host = rawHost.trim().toLowerCase().replace(/^\[|\]$/g, "");
  if (!host) return true;

  // Reject local hostnames and internal suffixes
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return true;
  }

  // Reject numeric/hex/octal encoded IPv4 hosts like 0x7f000001 or 2130706433
  if (/^(0x[0-9a-f]+|0[0-7]+|\d+)$/i.test(host)) {
    return true;
  }

  if (isPrivateOrBlockedIpv4(host)) {
    return true;
  }

  // Reject IPv6 loopback, unspecified, ULA (fc00::/7), link-local (fe80::/10), IPv4-mapped
  if (host.includes(":")) {
    if (
      host === "::1" ||
      host === "::" ||
      host.startsWith("fe8") ||
      host.startsWith("fe9") ||
      host.startsWith("fea") ||
      host.startsWith("feb") ||
      host.startsWith("fc") ||
      host.startsWith("fd") ||
      host.startsWith("::ffff:")
    ) {
      return true;
    }
  }

  // Require at least one dot for external domain names
  if (!host.includes(".")) {
    return true;
  }

  return false;
}

export interface ExternalUrlValidationResult {
  valid: boolean;
  normalizedUrl?: string;
  error?: string;
}

/**
 * Validate an external cloud link strictly: HTTPS-only + anti-SSRF host check.
 */
export function validateSafeExternalHttpsUrl(
  rawUrl: string
): ExternalUrlValidationResult {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { valid: false, error: "URL wajib diisi." };
  }
  if (trimmed.length > 2048) {
    return { valid: false, error: "URL terlalu panjang (maks. 2048 karakter)." };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { valid: false, error: "Format URL tidak valid." };
  }

  if (parsed.protocol !== "https:") {
    return {
      valid: false,
      error: "Hanya tautan HTTPS (https://) yang diperbolehkan.",
    };
  }

  if (parsed.username || parsed.password) {
    return {
      valid: false,
      error: "URL tidak boleh mengandung kredensial user:password.",
    };
  }

  if (isPrivateOrBlockedHostname(parsed.hostname)) {
    return {
      valid: false,
      error: "Host lokal atau alamat IP privat tidak diizinkan.",
    };
  }

  return { valid: true, normalizedUrl: parsed.toString() };
}

export const safeExternalHttpsUrlSchema = z
  .string()
  .trim()
  .min(1, "URL wajib diisi.")
  .max(2048, "URL maksimal 2048 karakter.")
  .superRefine((val, ctx) => {
    const result = validateSafeExternalHttpsUrl(val);
    if (!result.valid) {
      ctx.addIssue({
        code: "custom",
        message: result.error ?? "URL eksternal tidak valid.",
      });
    }
  });

export type ExternalCloudSourceType =
  | "FIGMA"
  | "CANVA"
  | "GOOGLE_DRIVE"
  | "OTHER_LINK";

export function detectExternalSourceType(
  rawUrl: string
): ExternalCloudSourceType {
  try {
    const host = new URL(rawUrl.trim()).hostname.toLowerCase();
    if (host === "figma.com" || host.endsWith(".figma.com")) {
      return "FIGMA";
    }
    if (host === "canva.com" || host.endsWith(".canva.com")) {
      return "CANVA";
    }
    if (
      host === "drive.google.com" ||
      host === "docs.google.com" ||
      host.endsWith(".drive.google.com")
    ) {
      return "GOOGLE_DRIVE";
    }
  } catch {
    // Fallback to OTHER_LINK if URL is partial during typing
  }
  return "OTHER_LINK";
}

export const presignUploadRequestSchema = z
  .object({
    bucketFolder: z.enum(UPLOAD_BUCKET_FOLDERS),
    fileName: z.string().trim().min(1, "Nama file wajib diisi.").max(255),
    mimeType: z.string().trim().min(1, "MIME type wajib diisi.").max(120),
    fileSizeBytes: z.number().int().positive("Ukuran file harus lebih dari 0."),
  })
  .superRefine((data, ctx) => {
    if (!isAllowedMimeForFolder(data.bucketFolder, data.mimeType)) {
      ctx.addIssue({
        code: "custom",
        path: ["mimeType"],
        message: `Tipe file '${data.mimeType}' tidak didukung untuk folder '${data.bucketFolder}'.`,
      });
    }

    const maxBytes = getMaxBytesForFolder(data.bucketFolder);
    if (data.fileSizeBytes > maxBytes) {
      const maxMb = Math.round(maxBytes / (1024 * 1024));
      ctx.addIssue({
        code: "custom",
        path: ["fileSizeBytes"],
        message: `Ukuran file melebihi batas maksimal ${maxMb} MB. Untuk file besar, gunakan External Link.`,
      });
    }
  });
