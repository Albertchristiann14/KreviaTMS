import { z } from "zod";

const nonNegInt = (label: string) =>
  z
    .number({ message: `${label} harus berupa angka.` })
    .int(`${label} harus berupa bilangan bulat.`)
    .min(0, `${label} tidak boleh bernilai negatif.`)
    .max(1_000_000_000, `${label} terlalu besar.`);

export const upsertContentAnalyticsSchema = z.object({
  contentItemId: z.string().uuid("Konten wajib dipilih."),
  recordedDate: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal pencatatan harus berformat YYYY-MM-DD."),
  impressions: nonNegInt("Impressions"),
  reach: nonNegInt("Reach"),
  likes: nonNegInt("Likes"),
  comments: nonNegInt("Comments"),
  shares: nonNegInt("Shares"),
  saves: nonNegInt("Saves"),
  clicks: nonNegInt("Clicks"),
  videoViews: nonNegInt("Video Views").default(0),
  notes: z.string().trim().max(2000).optional().nullable(),
});
