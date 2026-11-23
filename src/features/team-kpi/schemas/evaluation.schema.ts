import { z } from "zod";

export const PERIOD_MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export const EVALUATION_STATUS_LIST = [
  "DRAFT",
  "SUBMITTED",
  "REVIEWED",
  "FINALIZED",
] as const;

export const generateMonthlyEvaluationSchema = z
  .object({
    userId: z.string().uuid("ID anggota tim tidak valid.").optional(),
    generateAll: z.boolean().optional().default(false),
    periodMonth: z
      .string()
      .regex(PERIOD_MONTH_REGEX, "Format periode harus YYYY-MM (contoh: 2026-11).")
      .optional(),
    periodYear: z.number().int().min(2024).max(2100).optional(),
    periodMonthNum: z.number().int().min(1).max(12).optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.userId && !data.generateAll) {
      ctx.addIssue({
        code: "custom",
        path: ["userId"],
        message: "Pilih anggota tim atau aktifkan generate seluruh tim.",
      });
    }

    const hasPeriodString = Boolean(data.periodMonth);
    const hasYearMonth =
      typeof data.periodYear === "number" &&
      typeof data.periodMonthNum === "number";

    if (!hasPeriodString && !hasYearMonth) {
      ctx.addIssue({
        code: "custom",
        path: ["periodMonth"],
        message: "Periode evaluasi (YYYY-MM) wajib ditentukan.",
      });
    }
  });

export type GenerateMonthlyEvaluationInput = z.infer<
  typeof generateMonthlyEvaluationSchema
>;

export const resyncDraftEvaluationSchema = z.object({
  evaluationId: z.string().uuid("ID evaluasi tidak valid."),
});

export type ResyncDraftEvaluationInput = z.infer<
  typeof resyncDraftEvaluationSchema
>;

export const deleteDraftEvaluationSchema = z.object({
  evaluationId: z.string().uuid("ID evaluasi tidak valid."),
});

export type DeleteDraftEvaluationInput = z.infer<
  typeof deleteDraftEvaluationSchema
>;

export const updateEvaluationItemScoreSchema = z.object({
  itemId: z.string().uuid("ID item evaluasi tidak valid."),
  manualScore: z
    .number()
    .min(0, "Skor minimal 0.00.")
    .max(100, "Skor maksimal 100.00.")
    .nullable(),
  evidenceNotes: z
    .string()
    .trim()
    .max(1000, "Catatan bukti maksimal 1000 karakter.")
    .optional()
    .nullable(),
});

export const updateEvaluationScoresSchema = z.object({
  evaluationId: z.string().uuid("ID evaluasi tidak valid."),
  evaluatorNotes: z
    .string()
    .trim()
    .max(4000, "Catatan evaluator maksimal 4000 karakter.")
    .optional()
    .nullable(),
  selfAssessmentNotes: z
    .string()
    .trim()
    .max(4000, "Catatan self-assessment maksimal 4000 karakter.")
    .optional()
    .nullable(),
  items: z.array(updateEvaluationItemScoreSchema),
});

export type UpdateEvaluationScoresInput = z.infer<
  typeof updateEvaluationScoresSchema
>;

export const transitionEvaluationStatusSchema = z
  .object({
    evaluationId: z.string().uuid("ID evaluasi tidak valid."),
    targetStatus: z.enum(EVALUATION_STATUS_LIST),
    evaluatorNotes: z
      .string()
      .trim()
      .max(4000, "Catatan evaluator maksimal 4000 karakter.")
      .optional()
      .nullable(),
    reason: z
      .string()
      .trim()
      .max(1000, "Alasan penyesuaian maksimal 1000 karakter.")
      .optional()
      .nullable(),
    confirmLock: z.boolean().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.targetStatus === "FINALIZED" && data.confirmLock !== true) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmLock"],
        message:
          "Konfirmasi penguncian permanen (confirmLock) wajib disetujui sebelum FINALIZED.",
      });
    }
  });

export type TransitionEvaluationStatusInput = z.infer<
  typeof transitionEvaluationStatusSchema
>;

export const reopenEvaluationSchema = z.object({
  evaluationId: z.string().uuid("ID evaluasi tidak valid."),
  reason: z
    .string()
    .trim()
    .min(
      20,
      "Alasan pembukaan kembali evaluasi wajib diisi minimal 20 karakter."
    )
    .max(1000, "Alasan pembukaan kembali maksimal 1000 karakter."),
  targetStatus: z.enum(["DRAFT", "REVIEWED"]).optional().default("DRAFT"),
});

export type ReopenEvaluationInput = z.infer<typeof reopenEvaluationSchema>;
