import { z } from "zod";
import { PROJECT_STATUS_VALUES } from "@/features/tasks/types";

export const projectCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(
    /^[A-Z0-9_-]{2,20}$/,
    "Kode proyek harus 2–20 karakter alfanumerik huruf besar, '-' atau '_'."
  );

export const projectColorHexSchema = z
  .string()
  .trim()
  .regex(/^#[0-9A-Fa-f]{6}$/, "Warna proyek harus berupa kode hex #RRGGBB.");

const optionalDateStringSchema = z
  .string()
  .trim()
  .optional()
  .nullable()
  .transform((val) => (val && val.length > 0 ? val : null));

export const initialProjectMemberSchema = z.object({
  userId: z.string().uuid("ID anggota tidak valid."),
  projectRole: z.enum(["LEAD", "MEMBER", "VIEWER"]).default("MEMBER"),
});

export const createProjectSchema = z
  .object({
    code: projectCodeSchema,
    name: z
      .string()
      .trim()
      .min(3, "Nama proyek minimal 3 karakter.")
      .max(150, "Nama proyek maksimal 150 karakter."),
    description: z
      .string()
      .trim()
      .max(2000, "Deskripsi proyek maksimal 2.000 karakter.")
      .optional()
      .nullable()
      .transform((val) => (val && val.length > 0 ? val : null)),
    status: z.enum(PROJECT_STATUS_VALUES).default("ACTIVE"),
    colorHex: projectColorHexSchema.default("#2563EB"),
    startDate: optionalDateStringSchema,
    targetEndDate: optionalDateStringSchema,
    members: z.array(initialProjectMemberSchema).max(50).optional().default([]),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.targetEndDate) {
      const start = new Date(`${data.startDate.slice(0, 10)}T00:00:00Z`);
      const end = new Date(`${data.targetEndDate.slice(0, 10)}T00:00:00Z`);
      if (
        !Number.isNaN(start.getTime()) &&
        !Number.isNaN(end.getTime()) &&
        end < start
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["targetEndDate"],
          message:
            "Tanggal target selesai tidak boleh lebih awal dari tanggal mulai.",
        });
      }
    }
  });

export const updateProjectSchema = z
  .object({
    projectId: z.string().uuid("ID proyek tidak valid."),
    name: z
      .string()
      .trim()
      .min(3, "Nama proyek minimal 3 karakter.")
      .max(150, "Nama proyek maksimal 150 karakter.")
      .optional(),
    description: z
      .string()
      .trim()
      .max(2000, "Deskripsi proyek maksimal 2.000 karakter.")
      .optional()
      .nullable(),
    status: z.enum(PROJECT_STATUS_VALUES).optional(),
    colorHex: projectColorHexSchema.optional(),
    startDate: optionalDateStringSchema,
    targetEndDate: optionalDateStringSchema,
    confirmArchiveWithActiveTasks: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.startDate && data.targetEndDate) {
      const start = new Date(`${data.startDate.slice(0, 10)}T00:00:00Z`);
      const end = new Date(`${data.targetEndDate.slice(0, 10)}T00:00:00Z`);
      if (
        !Number.isNaN(start.getTime()) &&
        !Number.isNaN(end.getTime()) &&
        end < start
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["targetEndDate"],
          message:
            "Tanggal target selesai tidak boleh lebih awal dari tanggal mulai.",
        });
      }
    }
  });

export const manageProjectMembersSchema = z
  .object({
    projectId: z.string().uuid("ID proyek tidak valid."),
    operation: z.enum(["UPSERT", "REMOVE"]),
    userId: z.string().uuid("ID user tidak valid."),
    projectRole: z.enum(["LEAD", "MEMBER", "VIEWER"]).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.operation === "UPSERT" && !data.projectRole) {
      ctx.addIssue({
        code: "custom",
        path: ["projectRole"],
        message: "Peran anggota proyek wajib dipilih.",
      });
    }
  });

export type CreateProjectInput = z.input<typeof createProjectSchema>;
export type UpdateProjectInput = z.input<typeof updateProjectSchema>;
export type ManageProjectMembersInput = z.input<
  typeof manageProjectMembersSchema
>;
