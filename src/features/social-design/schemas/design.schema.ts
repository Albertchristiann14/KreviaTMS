import { z } from "zod";
import {
  safeExternalHttpsUrlSchema,
  validateSafeExternalHttpsUrl,
} from "@/lib/validations/common";
import {
  ASSET_CATEGORY_VALUES,
  ASSET_SOURCE_TYPE_VALUES,
} from "@/features/social-design/constants";

const dateTimeStringSchema = z
  .string()
  .trim()
  .min(1)
  .refine((val) => !Number.isNaN(new Date(val).getTime()), {
    message: "Format tanggal & waktu tidak valid.",
  });

export const assignDesignBriefSchema = z.object({
  briefId: z.string().uuid().optional(),
  contentItemId: z.string().uuid().optional().nullable(),
  projectId: z.string().uuid("Proyek wajib dipilih."),
  title: z
    .string()
    .trim()
    .min(3, "Judul brief minimal 3 karakter.")
    .max(200, "Judul brief maksimal 200 karakter."),
  objective: z
    .string()
    .trim()
    .min(5, "Objektif / arahan visual minimal 5 karakter.")
    .max(5000),
  dimensionsSpec: z.string().trim().max(150).optional().nullable(),
  copyText: z.string().trim().max(5000).optional().nullable(),
  brandGuidelinesNotes: z.string().trim().max(3000).optional().nullable(),
  referenceLinks: z
    .array(safeExternalHttpsUrlSchema)
    .max(10, "Maksimal 10 tautan referensi.")
    .default([]),
  assignedDesignerId: z.string().uuid("Designer wajib dipilih."),
  dueDate: dateTimeStringSchema.optional().nullable(),
});

export const startDesignBriefSchema = z.object({
  designBriefId: z.string().uuid("ID brief desain tidak valid."),
});

export const deleteDesignBriefSchema = z.object({
  designBriefId: z.string().uuid("ID brief desain tidak valid."),
});

export const submitDesignSchema = z
  .object({
    designBriefId: z.string().uuid("Brief desain wajib dipilih."),
    sourceType: z.enum(ASSET_SOURCE_TYPE_VALUES),
    storageKey: z.string().trim().max(512).optional().nullable(),
    externalUrl: z.string().trim().max(2048).optional().nullable(),
    fileName: z
      .string()
      .trim()
      .min(1, "Nama file atau label tautan wajib diisi.")
      .max(255),
    mimeType: z.string().trim().max(120).optional().nullable(),
    fileSizeBytes: z
      .number()
      .int()
      .nonnegative()
      .max(26_214_400, "Ukuran file maksimal 25 MB.")
      .optional()
      .nullable(),
    designerNotes: z.string().trim().max(2000).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.sourceType === "UPLOAD") {
      if (!data.storageKey || !data.storageKey.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["storageKey"],
          message: "File wajib diunggah ke storage terlebih dahulu.",
        });
      }
    } else {
      if (!data.externalUrl || !data.externalUrl.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["externalUrl"],
          message: "Tautan eksternal wajib diisi.",
        });
      } else {
        const res = validateSafeExternalHttpsUrl(data.externalUrl);
        if (!res.valid) {
          ctx.addIssue({
            code: "custom",
            path: ["externalUrl"],
            message: res.error ?? "Tautan eksternal wajib HTTPS publik valid.",
          });
        }
      }
    }
  });

export const reviewDesignSubmissionSchema = z
  .object({
    submissionId: z.string().uuid("Submission desain tidak valid."),
    decision: z.enum(["APPROVED", "REVISION_REQUESTED"]),
    feedback: z.string().trim().max(3000).default(""),
    revisionChecklist: z
      .array(z.string().trim().min(1).max(300))
      .max(20)
      .default([]),
    revisionDueDate: dateTimeStringSchema.optional().nullable(),
    promoteToAssetLibrary: z.boolean().default(true),
    assetTags: z
      .array(z.string().trim().min(1).max(50))
      .max(10, "Maksimal 10 tag aset.")
      .default([]),
  })
  .superRefine((data, ctx) => {
    if (
      data.decision === "REVISION_REQUESTED" &&
      data.feedback.trim().length < 10
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["feedback"],
        message:
          "Catatan revisi wajib diisi minimal 10 karakter agar arahan perbaikan jelas untuk Designer.",
      });
    }
  });

export const upsertAssetSchema = z
  .object({
    id: z.string().uuid().optional(),
    projectId: z.string().uuid().optional().nullable(),
    contentItemId: z.string().uuid().optional().nullable(),
    title: z
      .string()
      .trim()
      .min(2, "Judul aset minimal 2 karakter.")
      .max(200, "Judul aset maksimal 200 karakter."),
    description: z.string().trim().max(2000).optional().nullable(),
    category: z.enum(ASSET_CATEGORY_VALUES),
    sourceType: z.enum(ASSET_SOURCE_TYPE_VALUES),
    storageKey: z.string().trim().max(512).optional().nullable(),
    externalUrl: z.string().trim().max(2048).optional().nullable(),
    mimeType: z.string().trim().max(120).optional().nullable(),
    fileSizeBytes: z
      .number()
      .int()
      .nonnegative()
      .max(26_214_400, "Ukuran file maksimal 25 MB.")
      .optional()
      .nullable(),
    tags: z
      .array(z.string().trim().min(1).max(50))
      .max(10, "Maksimal 10 tag per aset.")
      .default([]),
    isApprovedBrandAsset: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (!data.id) {
      if (data.sourceType === "UPLOAD") {
        if (!data.storageKey || !data.storageKey.trim()) {
          ctx.addIssue({
            code: "custom",
            path: ["storageKey"],
            message: "File aset wajib diunggah terlebih dahulu.",
          });
        }
      } else {
        if (!data.externalUrl || !data.externalUrl.trim()) {
          ctx.addIssue({
            code: "custom",
            path: ["externalUrl"],
            message: "Tautan eksternal aset wajib diisi.",
          });
        } else {
          const urlRes = validateSafeExternalHttpsUrl(data.externalUrl);
          if (!urlRes.valid) {
            ctx.addIssue({
              code: "custom",
              path: ["externalUrl"],
              message: urlRes.error ?? "Tautan harus HTTPS publik yang valid.",
            });
          }
        }
      }
    } else if (
      data.sourceType !== "UPLOAD" &&
      data.externalUrl &&
      data.externalUrl.trim()
    ) {
      const urlRes = validateSafeExternalHttpsUrl(data.externalUrl);
      if (!urlRes.valid) {
        ctx.addIssue({
          code: "custom",
          path: ["externalUrl"],
          message: urlRes.error ?? "Tautan harus HTTPS publik yang valid.",
        });
      }
    }
  });

export const archiveAssetSchema = z.object({
  assetId: z.string().uuid("ID aset tidak valid."),
});
