import { z } from "zod";
import { ROLE_CODES } from "@/lib/constants/permissions";

export const ANNOUNCEMENT_PRIORITIES = [
  "INFO",
  "IMPORTANT",
  "URGENT",
] as const;

export const publishAnnouncementSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(5, "Judul pengumuman minimal 5 karakter.")
      .max(150, "Judul pengumuman maksimal 150 karakter."),
    content: z
      .string()
      .trim()
      .min(10, "Isi pengumuman minimal 10 karakter.")
      .max(5000, "Isi pengumuman maksimal 5.000 karakter."),
    priority: z.enum(ANNOUNCEMENT_PRIORITIES),
    isPinned: z.boolean(),
    targetRoleCodes: z.array(z.enum(ROLE_CODES)),
    publishedAt: z.string().optional().nullable(),
    expiresAt: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const pubDate = data.publishedAt ? new Date(data.publishedAt) : new Date();
    if (Number.isNaN(pubDate.getTime())) {
      ctx.addIssue({
        code: "custom",
        path: ["publishedAt"],
        message: "Format tanggal publikasi tidak valid.",
      });
      return;
    }

    if (data.expiresAt && data.expiresAt.trim() !== "") {
      const expDate = new Date(data.expiresAt);
      if (Number.isNaN(expDate.getTime())) {
        ctx.addIssue({
          code: "custom",
          path: ["expiresAt"],
          message: "Format tanggal kedaluwarsa tidak valid.",
        });
        return;
      }

      if (expDate.getTime() <= pubDate.getTime()) {
        ctx.addIssue({
          code: "custom",
          path: ["expiresAt"],
          message: "Tanggal kedaluwarsa harus lebih besar dari waktu publikasi.",
        });
      }
    }
  });

export type PublishAnnouncementFormValues = z.infer<
  typeof publishAnnouncementSchema
>;

export const togglePinAnnouncementSchema = z.object({
  announcementId: z.string().uuid("ID pengumuman tidak valid."),
  isPinned: z.boolean(),
});

export const markAnnouncementReadSchema = z.object({
  announcementId: z.string().uuid("ID pengumuman tidak valid."),
});

export const archiveAnnouncementSchema = z.object({
  announcementId: z.string().uuid("ID pengumuman tidak valid."),
});
