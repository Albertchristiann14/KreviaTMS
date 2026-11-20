import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { PERMISSIONS, type PermissionCode } from "@/lib/constants/permissions";
import { getPublicEnv, getServerEnv } from "@/lib/env";
import {
  isSvgAsset,
  PRESIGN_RATE_LIMIT_MAX_PER_MIN,
  PRESIGN_UPLOAD_TTL_SECONDS,
  sanitizeUploadFileName,
  SIGNED_DOWNLOAD_TTL_SECONDS,
  UPLOAD_BUCKET_FOLDERS,
  type UploadBucketFolder,
} from "@/lib/validations/common";
import { DomainError } from "@/types/action-result";

if (typeof window !== "undefined") {
  throw new Error("Storage presigner must only be imported in server modules.");
}

export interface PresignUploadRequest {
  bucketFolder: UploadBucketFolder;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
}

export interface PresignUploadResponse {
  uploadUrl: string;
  storageKey: string;
  expiresInSeconds: number;
}

export interface PresignDownloadResponse {
  downloadUrl: string;
  expiresInSeconds: number;
  forceDownload: boolean;
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const PRESIGN_RATE_MAP_MAX_KEYS = 5_000;
const presignRateStore = new Map<string, number[]>();

export function checkPresignRateLimit(userId: string): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const recent = (presignRateStore.get(userId) ?? []).filter(
    (ts) => ts > windowStart
  );

  if (recent.length >= PRESIGN_RATE_LIMIT_MAX_PER_MIN) {
    const oldest = recent[0] ?? now;
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000)
    );
    presignRateStore.set(userId, recent);
    return { allowed: false, retryAfterSeconds };
  }

  if (
    presignRateStore.size >= PRESIGN_RATE_MAP_MAX_KEYS &&
    !presignRateStore.has(userId)
  ) {
    const oldestKey = presignRateStore.keys().next().value;
    if (oldestKey) {
      presignRateStore.delete(oldestKey);
    }
  }

  recent.push(now);
  presignRateStore.set(userId, recent);
  return { allowed: true, retryAfterSeconds: 0 };
}

export function getRequiredUploadPermission(
  folder: UploadBucketFolder
): PermissionCode | null {
  switch (folder) {
    case "design-submissions":
      return PERMISSIONS.DESIGN_SUBMISSION_CREATE;
    case "assets":
      return PERMISSIONS.ASSETS_LIBRARY_MANAGE;
    case "task-attachments":
      return PERMISSIONS.TASKS_ITEM_UPDATE;
    case "avatars":
      return null; // Authenticated self
  }
}

export function buildStorageKey(params: {
  bucketFolder: UploadBucketFolder;
  ownerScopeId: string;
  fileName: string;
}): string {
  const { bucketFolder, ownerScopeId, fileName } = params;
  const publicEnv = getPublicEnv();
  const safeEnv = publicEnv.NEXT_PUBLIC_APP_ENV.replace(/[^a-z0-9_-]/gi, "");
  const safeScope =
    ownerScopeId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64) || "shared";
  const sanitizedFileName = sanitizeUploadFileName(fileName);
  return `ktms/${safeEnv}/${bucketFolder}/${safeScope}/${crypto.randomUUID()}-${sanitizedFileName}`;
}

export interface ParsedStorageKey {
  envName: string;
  bucketFolder: UploadBucketFolder;
  ownerScopeId: string;
  fileName: string;
}

export function validateStorageKeyPath(
  rawKey: string
): ParsedStorageKey | null {
  const key = rawKey.trim();
  if (!key || key.length > 512) return null;
  if (
    key.startsWith("/") ||
    key.includes("..") ||
    key.includes("\\") ||
    key.includes("//") ||
    /[\x00-\x1f\x7f]/.test(key)
  ) {
    return null;
  }

  const segments = key.split("/");
  if (segments.length !== 5 || segments[0] !== "ktms") {
    return null;
  }

  const [, envName, folder, ownerScopeId, fileName] = segments as [
    string,
    string,
    string,
    string,
    string,
  ];
  if (
    !envName ||
    !/^[a-z0-9_-]{1,32}$/i.test(envName) ||
    !ownerScopeId ||
    !/^[a-zA-Z0-9_-]{1,64}$/.test(ownerScopeId) ||
    !fileName ||
    !/^[a-zA-Z0-9._-]{1,200}$/.test(fileName) ||
    !(UPLOAD_BUCKET_FOLDERS as readonly string[]).includes(folder)
  ) {
    return null;
  }

  return {
    envName,
    bucketFolder: folder as UploadBucketFolder,
    ownerScopeId,
    fileName,
  };
}

export class StorageConfigurationError extends DomainError {
  constructor(message: string) {
    super("INTERNAL_ERROR", message);
    this.name = "StorageConfigurationError";
  }
}

function getSupabaseStorageAdmin() {
  let serverEnv: ReturnType<typeof getServerEnv>;
  let publicEnv: ReturnType<typeof getPublicEnv>;

  try {
    serverEnv = getServerEnv();
    publicEnv = getPublicEnv();
  } catch (err) {
    console.error("[KTMS_STORAGE_ENV_ERROR]", err);
    throw new StorageConfigurationError(
      "Konfigurasi environment Supabase Storage belum lengkap."
    );
  }

  if (!serverEnv.SUPABASE_SERVICE_ROLE_KEY) {
    throw new StorageConfigurationError(
      "SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi pada server."
    );
  }

  if (publicEnv.NEXT_PUBLIC_SUPABASE_URL === "https://placeholder.supabase.co") {
    throw new StorageConfigurationError(
      "NEXT_PUBLIC_SUPABASE_URL belum dikonfigurasi pada server."
    );
  }

  const client = createClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  return {
    storage: client.storage,
    bucket: serverEnv.SUPABASE_STORAGE_BUCKET,
  };
}

export async function createPresignedUpload(params: {
  ownerScopeId: string;
  bucketFolder: UploadBucketFolder;
  fileName: string;
}): Promise<PresignUploadResponse> {
  const storageKey = buildStorageKey({
    bucketFolder: params.bucketFolder,
    ownerScopeId: params.ownerScopeId,
    fileName: params.fileName,
  });

  const { storage, bucket } = getSupabaseStorageAdmin();
  const { data, error } = await storage
    .from(bucket)
    .createSignedUploadUrl(storageKey);

  if (error || !data?.signedUrl) {
    console.error("[KTMS_SUPABASE_SIGNED_UPLOAD_ERROR]", error);
    throw new DomainError(
      "INTERNAL_ERROR",
      "Gagal membuat signed upload URL di Supabase Storage."
    );
  }

  return {
    uploadUrl: data.signedUrl,
    storageKey,
    expiresInSeconds: PRESIGN_UPLOAD_TTL_SECONDS,
  };
}

export async function createPresignedDownload(params: {
  storageKey: string;
  mimeType?: string | null;
  fileName?: string | null;
  forceDownload?: boolean;
}): Promise<PresignDownloadResponse> {
  const isSvg = isSvgAsset(params.fileName ?? params.storageKey, params.mimeType);
  const mustDownload = isSvg || Boolean(params.forceDownload);
  const downloadFileName = mustDownload
    ? sanitizeUploadFileName(params.fileName ?? params.storageKey)
    : false;

  const { storage, bucket } = getSupabaseStorageAdmin();
  const { data, error } = await storage
    .from(bucket)
    .createSignedUrl(params.storageKey, SIGNED_DOWNLOAD_TTL_SECONDS, {
      download: downloadFileName,
    });

  if (error || !data?.signedUrl) {
    console.error("[KTMS_SUPABASE_SIGNED_DOWNLOAD_ERROR]", error);
    throw new DomainError(
      "INTERNAL_ERROR",
      "Gagal membuat signed download URL dari Supabase Storage."
    );
  }

  return {
    downloadUrl: data.signedUrl,
    expiresInSeconds: SIGNED_DOWNLOAD_TTL_SECONDS,
    forceDownload: mustDownload,
  };
}
