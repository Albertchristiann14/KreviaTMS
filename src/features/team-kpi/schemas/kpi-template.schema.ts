import { z } from "zod";

export const KPI_CATEGORY_VALUES = [
  "DELIVERY",
  "QUALITY",
  "PRODUCTIVITY",
  "CREATIVE",
  "COLLABORATION",
] as const;

export const KPI_METRIC_SOURCE_VALUES = [
  "AUTO_TCR",
  "AUTO_OTDR",
  "AUTO_DQS",
  "AUTO_CPVS",
  "MANUAL_SCORE",
] as const;

export const KPI_UNIT_VALUES = [
  "PERCENTAGE",
  "COUNT",
  "SCORE_100",
  "RATIO",
] as const;

export const upsertKpiTemplateSchema = z
  .object({
    id: z.string().uuid("ID template tidak valid.").optional(),
    code: z
      .string()
      .trim()
      .min(3, "Kode template minimal 3 karakter.")
      .max(50, "Kode template maksimal 50 karakter.")
      .regex(
        /^[A-Za-z0-9_]+$/,
        "Kode template hanya boleh berisi huruf, angka, dan garis bawah (_)."
      )
      .transform((val) => val.toUpperCase()),
    name: z
      .string()
      .trim()
      .min(3, "Nama indikator minimal 3 karakter.")
      .max(120, "Nama indikator maksimal 120 karakter."),
    description: z
      .string()
      .trim()
      .max(500, "Deskripsi maksimal 500 karakter.")
      .optional()
      .nullable(),
    category: z.enum(KPI_CATEGORY_VALUES),
    applicableRoleId: z
      .string()
      .uuid("ID peran tidak valid.")
      .optional()
      .nullable(),
    metricSource: z.enum(KPI_METRIC_SOURCE_VALUES),
    unit: z.enum(KPI_UNIT_VALUES),
    defaultTargetValue: z
      .number()
      .min(0, "Target default tidak boleh negatif.")
      .max(100000, "Target default maksimal 100.000."),
    defaultWeight: z
      .number()
      .gt(0, "Bobot default harus lebih dari 0%.")
      .max(100, "Bobot default maksimal 100%."),
    isHigherBetter: z.boolean().default(true),
    isActive: z.boolean().default(true),
  })
  .superRefine((data, ctx) => {
    if (
      (data.unit === "PERCENTAGE" || data.unit === "SCORE_100") &&
      data.defaultTargetValue > 100
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["defaultTargetValue"],
        message: "Target untuk satuan persentase / skor 100 maksimal 100.",
      });
    }
    if (data.metricSource === "AUTO_CPVS" && data.defaultTargetValue <= 0) {
      ctx.addIssue({
        code: "custom",
        path: ["defaultTargetValue"],
        message: "Target konten (CPVS) harus lebih dari 0.",
      });
    }
  });

export type UpsertKpiTemplateInput = z.infer<typeof upsertKpiTemplateSchema>;

export const toggleKpiTemplateActiveSchema = z.object({
  templateId: z.string().uuid("ID template tidak valid."),
  isActive: z.boolean(),
});

export type ToggleKpiTemplateActiveInput = z.infer<
  typeof toggleKpiTemplateActiveSchema
>;

export const deleteKpiTemplateSchema = z.object({
  templateId: z.string().uuid("ID template tidak valid."),
});

export type DeleteKpiTemplateInput = z.infer<typeof deleteKpiTemplateSchema>;

export const assignKpiItemSchema = z.object({
  kpiTemplateId: z.string().uuid("ID template KPI tidak valid."),
  targetValue: z
    .number()
    .min(0, "Target tidak boleh negatif.")
    .max(100000, "Target maksimal 100.000."),
  weight: z
    .number()
    .gt(0, "Bobot indikator harus lebih dari 0%.")
    .max(100, "Bobot indikator maksimal 100%."),
});

export const assignKpiMonthlySchema = z
  .object({
    userId: z.string().uuid("ID anggota tim tidak valid."),
    periodYear: z.number().int().min(2024).max(2100),
    periodMonth: z.number().int().min(1).max(12),
    items: z
      .array(assignKpiItemSchema)
      .min(1, "Minimal harus ada 1 indikator KPI yang ditetapkan."),
  })
  .superRefine((data, ctx) => {
    const seen = new Set<string>();
    let totalWeightCents = 0;

    data.items.forEach((item, index) => {
      if (seen.has(item.kpiTemplateId)) {
        ctx.addIssue({
          code: "custom",
          path: ["items", index, "kpiTemplateId"],
          message: "Indikator KPI tidak boleh duplikat pada periode yang sama.",
        });
      }
      seen.add(item.kpiTemplateId);
      totalWeightCents += Math.round(item.weight * 100);
    });

    const totalWeight = totalWeightCents / 100;
    if (totalWeightCents !== 10000) {
      ctx.addIssue({
        code: "custom",
        path: ["items"],
        message: `Total bobot seluruh indikator KPI wajib tepat 100% (saat ini: ${totalWeight}%).`,
      });
    }
  });

export type AssignKpiMonthlyInput = z.infer<typeof assignKpiMonthlySchema>;

export const clonePreviousMonthAssignmentsSchema = z.object({
  targetYear: z.number().int().min(2024).max(2100),
  targetMonth: z.number().int().min(1).max(12),
  userId: z.string().uuid("ID anggota tim tidak valid.").optional().nullable(),
  overwriteExisting: z.boolean().optional().default(false),
});

export type ClonePreviousMonthAssignmentsInput = z.infer<
  typeof clonePreviousMonthAssignmentsSchema
>;
