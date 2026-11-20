import { z } from "zod";

export const EMPLOYMENT_STATUS_VALUES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERN",
  "INACTIVE",
] as const;

export const strongPasswordSchema = z
  .string()
  .min(10, "Kata sandi minimal 10 karakter.")
  .max(128, "Kata sandi maksimal 128 karakter.")
  .refine((val) => /[A-Z]/.test(val), {
    message: "Kata sandi wajib mengandung minimal 1 huruf besar.",
  })
  .refine((val) => /[a-z]/.test(val), {
    message: "Kata sandi wajib mengandung minimal 1 huruf kecil.",
  })
  .refine((val) => /[0-9]/.test(val), {
    message: "Kata sandi wajib mengandung minimal 1 angka.",
  });

const optionalDisplayNameSchema = z
  .string()
  .trim()
  .max(80, "Nama panggilan maksimal 80 karakter.")
  .optional()
  .nullable();

const optionalPhoneSchema = z
  .string()
  .trim()
  .max(30, "Nomor telepon maksimal 30 karakter.")
  .optional()
  .nullable();

const optionalManagerIdSchema = z
  .union([
    z.string().uuid("ID atasan tidak valid."),
    z.literal(""),
    z.null(),
  ])
  .optional();

export const createUserSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(3, "Nama lengkap minimal 3 karakter.")
    .max(100, "Nama lengkap maksimal 100 karakter."),
  displayName: optionalDisplayNameSchema,
  email: z
    .string()
    .trim()
    .min(1, "Email kerja wajib diisi.")
    .max(255, "Email maksimal 255 karakter.")
    .email("Format email tidak valid.")
    .transform((v) => v.toLowerCase()),
  roleId: z.string().uuid("Peran (role) wajib dipilih."),
  jobTitle: z
    .string()
    .trim()
    .min(2, "Jabatan minimal 2 karakter.")
    .max(80, "Jabatan maksimal 80 karakter."),
  department: z
    .string()
    .trim()
    .min(2, "Departemen minimal 2 karakter.")
    .max(100, "Departemen maksimal 100 karakter."),
  employmentStatus: z.enum(EMPLOYMENT_STATUS_VALUES),
  phone: optionalPhoneSchema,
  managerId: optionalManagerIdSchema,
  temporaryPassword: strongPasswordSchema,
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z.object({
  userId: z.string().uuid("ID pengguna tidak valid."),
  fullName: z
    .string()
    .trim()
    .min(3, "Nama lengkap minimal 3 karakter.")
    .max(100, "Nama lengkap maksimal 100 karakter."),
  displayName: optionalDisplayNameSchema,
  roleId: z.string().uuid("Peran (role) wajib dipilih."),
  jobTitle: z
    .string()
    .trim()
    .min(2, "Jabatan minimal 2 karakter.")
    .max(80, "Jabatan maksimal 80 karakter."),
  department: z
    .string()
    .trim()
    .min(2, "Departemen minimal 2 karakter.")
    .max(100, "Departemen maksimal 100 karakter."),
  employmentStatus: z.enum(EMPLOYMENT_STATUS_VALUES),
  phone: optionalPhoneSchema,
  managerId: optionalManagerIdSchema,
  isActive: z.boolean(),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export const resetUserPasswordSchema = z.object({
  userId: z.string().uuid("ID pengguna tidak valid."),
  temporaryPassword: strongPasswordSchema,
});

export type ResetUserPasswordInput = z.infer<typeof resetUserPasswordSchema>;
