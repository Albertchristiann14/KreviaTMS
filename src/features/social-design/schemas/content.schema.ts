import { z } from "zod";
import {
  safeExternalHttpsUrlSchema,
  validateSafeExternalHttpsUrl,
} from "@/lib/validations/common";
import {
  CAPTION_MAX_LENGTH,
  CONTENT_FORMAT_VALUES,
  SOCIAL_PLATFORM_VALUES,
} from "@/features/social-design/constants";
import { CONTENT_STATUS_VALUES } from "@/lib/constants/enums";

const dateTimeStringSchema = z
  .string()
  .trim()
  .min(1)
  .refine((val) => !Number.isNaN(new Date(val).getTime()), {
    message: "Format tanggal & waktu tidak valid.",
  });

export const createContentIdeaSchema = z.object({
  projectId: z.string().uuid("Proyek wajib dipilih."),
  title: z
    .string()
    .trim()
    .min(5, "Judul ide minimal 5 karakter.")
    .max(200, "Judul ide maksimal 200 karakter."),
  description: z
    .string()
    .trim()
    .min(10, "Deskripsi / hook ide minimal 10 karakter.")
    .max(2000, "Deskripsi maksimal 2.000 karakter."),
  targetPlatform: z.enum(SOCIAL_PLATFORM_VALUES),
  contentPillar: z.string().trim().max(100).optional().nullable(),
  referenceUrls: z
    .array(safeExternalHttpsUrlSchema)
    .max(5, "Maksimal 5 tautan referensi.")
    .default([]),
});

export const toggleIdeaUpvoteSchema = z.object({
  ideaId: z.string().uuid("ID ide tidak valid."),
});

export const reviewContentIdeaSchema = z
  .object({
    ideaId: z.string().uuid("ID ide tidak valid."),
    decision: z.enum(["APPROVE", "ARCHIVE"]),
    reviewNotes: z.string().trim().max(1000).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (
      data.decision === "ARCHIVE" &&
      (!data.reviewNotes || data.reviewNotes.trim().length < 10)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["reviewNotes"],
        message: "Alasan penolakan / arsip wajib diisi minimal 10 karakter.",
      });
    }
  });

export const designBriefDraftSchema = z.object({
  title: z.string().trim().max(200).optional().nullable(),
  objective: z
    .string()
    .trim()
    .min(5, "Arahan visual / objektif desain minimal 5 karakter.")
    .max(5000, "Objektif desain maksimal 5.000 karakter."),
  dimensionsSpec: z.string().trim().max(150).optional().nullable(),
  copyText: z.string().trim().max(5000).optional().nullable(),
  brandGuidelinesNotes: z.string().trim().max(3000).optional().nullable(),
  referenceLinks: z
    .array(safeExternalHttpsUrlSchema)
    .max(10, "Maksimal 10 tautan referensi desain.")
    .default([]),
  assignedDesignerId: z.string().uuid("ID designer tidak valid.").optional().nullable(),
  dueDate: dateTimeStringSchema.optional().nullable(),
});

export const createContentPlanSchema = z
  .object({
    projectId: z.string().uuid("Proyek wajib dipilih."),
    ideaId: z.string().uuid().optional().nullable(),
    title: z
      .string()
      .trim()
      .min(3, "Judul konten minimal 3 karakter.")
      .max(200, "Judul konten maksimal 200 karakter."),
    platform: z.enum(SOCIAL_PLATFORM_VALUES),
    contentFormat: z.enum(CONTENT_FORMAT_VALUES),
    contentPillar: z.string().trim().max(100).optional().nullable(),
    campaignName: z.string().trim().max(150).optional().nullable(),
    caption: z
      .string()
      .trim()
      .max(CAPTION_MAX_LENGTH, `Caption maksimal ${CAPTION_MAX_LENGTH} karakter.`)
      .optional()
      .nullable(),
    hashtags: z
      .array(z.string().trim().min(1).max(60))
      .max(30, "Maksimal 30 hashtag.")
      .default([]),
    ctaText: z.string().trim().max(255).optional().nullable(),
    creatorId: z.string().uuid("PIC Creator wajib dipilih."),
    plannedPublishAt: dateTimeStringSchema.optional().nullable(),
    requiresDesign: z.boolean().default(true),
    designBrief: designBriefDraftSchema.optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.requiresDesign && !data.designBrief) {
      ctx.addIssue({
        code: "custom",
        path: ["designBrief.objective"],
        message: "Detail brief desain wajib diisi jika konten memerlukan desain.",
      });
    }

    if (
      data.requiresDesign &&
      data.designBrief?.dueDate &&
      data.plannedPublishAt
    ) {
      const designDue = new Date(data.designBrief.dueDate);
      const publishDue = new Date(data.plannedPublishAt);
      if (designDue.getTime() > publishDue.getTime()) {
        ctx.addIssue({
          code: "custom",
          path: ["designBrief.dueDate"],
          message:
            "Deadline desain tidak boleh lebih lambat dari rencana tanggal tayang konten.",
        });
      }
    }
  });

export const convertIdeaToPlanSchema = z.object({
  ideaId: z.string().uuid("ID ide tidak valid."),
  projectId: z.string().uuid().optional(),
  title: z.string().trim().min(3).max(200).optional(),
  platform: z.enum(SOCIAL_PLATFORM_VALUES).optional(),
  contentFormat: z.enum(CONTENT_FORMAT_VALUES).optional(),
  contentPillar: z.string().trim().max(100).optional().nullable(),
  campaignName: z.string().trim().max(150).optional().nullable(),
  caption: z.string().trim().max(CAPTION_MAX_LENGTH).optional().nullable(),
  hashtags: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
  ctaText: z.string().trim().max(255).optional().nullable(),
  creatorId: z.string().uuid().optional(),
  plannedPublishAt: dateTimeStringSchema.optional().nullable(),
  requiresDesign: z.boolean().optional(),
  designBrief: designBriefDraftSchema.optional().nullable(),
});

export const updateContentPlanSchema = z.object({
  contentItemId: z.string().uuid("ID konten tidak valid."),
  title: z
    .string()
    .trim()
    .min(3, "Judul konten minimal 3 karakter.")
    .max(200)
    .optional(),
  platform: z.enum(SOCIAL_PLATFORM_VALUES).optional(),
  contentFormat: z.enum(CONTENT_FORMAT_VALUES).optional(),
  contentPillar: z.string().trim().max(100).optional().nullable(),
  campaignName: z.string().trim().max(150).optional().nullable(),
  caption: z
    .string()
    .trim()
    .max(CAPTION_MAX_LENGTH, `Caption maksimal ${CAPTION_MAX_LENGTH} karakter.`)
    .optional()
    .nullable(),
  hashtags: z.array(z.string().trim().min(1).max(60)).max(30).optional(),
  ctaText: z.string().trim().max(255).optional().nullable(),
  creatorId: z.string().uuid().optional(),
  plannedPublishAt: dateTimeStringSchema.optional().nullable(),
  requiresDesign: z.boolean().optional(),
});

export const updateContentScheduleSchema = z
  .object({
    contentItemId: z.string().uuid("ID konten tidak valid."),
    targetStatus: z.enum(CONTENT_STATUS_VALUES).optional(),
    plannedPublishAt: dateTimeStringSchema.optional().nullable(),
    caption: z.string().trim().max(CAPTION_MAX_LENGTH).optional().nullable(),
    publishedUrl: z.string().trim().max(2048).optional().nullable(),
    publishedAt: dateTimeStringSchema.optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.targetStatus === "PUBLISHED") {
      if (!data.publishedUrl || !data.publishedUrl.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["publishedUrl"],
          message:
            "Tautan post tayang (HTTPS) wajib diisi saat menandai konten Published.",
        });
      } else {
        const urlCheck = validateSafeExternalHttpsUrl(data.publishedUrl);
        if (!urlCheck.valid) {
          ctx.addIssue({
            code: "custom",
            path: ["publishedUrl"],
            message: urlCheck.error ?? "URL publikasi harus HTTPS publik valid.",
          });
        }
      }
    } else if (data.publishedUrl && data.publishedUrl.trim()) {
      const urlCheck = validateSafeExternalHttpsUrl(data.publishedUrl);
      if (!urlCheck.valid) {
        ctx.addIssue({
          code: "custom",
          path: ["publishedUrl"],
          message: urlCheck.error ?? "URL publikasi harus HTTPS publik valid.",
        });
      }
    }
  });
