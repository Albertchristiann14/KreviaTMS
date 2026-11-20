import type { KpiCategory, KpiGrade, KpiMetricSource, KpiUnit } from "@prisma/client";
import type { RoleCode } from "@/lib/constants/permissions";
import type { WeightedScoreResult } from "@/features/team-kpi/types";

const STRICT_UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUuid(value: string | null | undefined): boolean {
  if (!value) return false;
  return STRICT_UUID_REGEX.test(value.trim());
}

export function sanitizeOptionalUuid(
  value: string | null | undefined
): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed === "ALL") return undefined;
  return STRICT_UUID_REGEX.test(trimmed) ? trimmed : undefined;
}

export function round2(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, round2(value)));
}

export function gradeFromScore(score: number): KpiGrade {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  return "D";
}

export const resolveKpiGrade = gradeFromScore;

/**
 * Computes Weighted Monthly KPI Score with N/A weight re-normalization and canonical Grade A-D.
 * Items with `achievementPct === null` are excluded from the denominator; if active weight sum === 0, returns 0.00.
 */
export function computeWeightedScoreAndGrade(
  items: ReadonlyArray<{ weight: number; achievementPct: number | null }>
): WeightedScoreResult {
  let totalWeight = 0;
  let activeWeight = 0;
  let weightedSum = 0;

  for (const item of items) {
    if (!Number.isFinite(item.weight) || item.weight <= 0) continue;
    totalWeight += item.weight;
    if (
      item.achievementPct !== null &&
      item.achievementPct !== undefined &&
      Number.isFinite(item.achievementPct)
    ) {
      activeWeight += item.weight;
      weightedSum += item.achievementPct * item.weight;
    }
  }

  const weightedKpiScore =
    activeWeight <= 0 ? 0 : clampScore(weightedSum / activeWeight);

  return {
    activeWeightPercent: round2(activeWeight),
    totalWeightPercent: round2(totalWeight),
    weightedKpiScore,
    grade: gradeFromScore(weightedKpiScore),
  };
}

export const ROLE_DISPLAY_META: Record<
  RoleCode,
  { label: string; badgeClass: string }
> = {
  SUPER_ADMIN: {
    label: "Super Admin",
    badgeClass: "bg-indigo-100 text-indigo-800 border-indigo-200",
  },
  PROJECT_MANAGER: {
    label: "Project Manager",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
  },
  STAFF_CREATOR: {
    label: "Staff / Creator",
    badgeClass: "bg-violet-100 text-violet-800 border-violet-200",
  },
  DESIGNER: {
    label: "Designer",
    badgeClass: "bg-sky-100 text-sky-800 border-sky-200",
  },
};

export const KPI_GRADE_META: Record<
  KpiGrade,
  { label: string; description: string; badgeClass: string }
> = {
  A: {
    label: "Grade A",
    description: "Exceeds Expectations (90–100)",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  B: {
    label: "Grade B",
    description: "Meets Expectations (80–89.99)",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
  },
  C: {
    label: "Grade C",
    description: "Needs Improvement (70–79.99)",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  D: {
    label: "Grade D",
    description: "Perlu Pembinaan (< 70)",
    badgeClass: "bg-rose-100 text-rose-800 border-rose-200",
  },
};

export const METRIC_SOURCE_META: Record<
  KpiMetricSource,
  { label: string; shortLabel: string; isAuto: boolean; badgeClass: string }
> = {
  AUTO_TCR: {
    label: "Otomatis: Task Completion Rate (TCR)",
    shortLabel: "Sistem TCR",
    isAuto: true,
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  AUTO_OTDR: {
    label: "Otomatis: On-Time Delivery Rate (OTDR)",
    shortLabel: "Sistem OTDR",
    isAuto: true,
    badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  AUTO_DQS: {
    label: "Otomatis: Design Quality Score (DQS)",
    shortLabel: "Sistem DQS",
    isAuto: true,
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
  },
  AUTO_CPVS: {
    label: "Otomatis: Target Output Konten (CPVS)",
    shortLabel: "Sistem CPVS",
    isAuto: true,
    badgeClass: "bg-violet-50 text-violet-700 border-violet-200",
  },
  MANUAL_SCORE: {
    label: "Manual: Penilaian Evaluator (0–100)",
    shortLabel: "Manual",
    isAuto: false,
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
};

export const KPI_CATEGORY_LABELS: Record<KpiCategory, string> = {
  DELIVERY: "Delivery",
  QUALITY: "Quality",
  PRODUCTIVITY: "Productivity",
  CREATIVE: "Creative",
  COLLABORATION: "Collaboration",
};

export const KPI_UNIT_LABELS: Record<KpiUnit, string> = {
  PERCENTAGE: "%",
  SCORE_100: "Skor",
  COUNT: "Konten/Item",
  RATIO: "Rasio",
};

export function formatKpiPercent(
  value: number | null | undefined,
  suffix = "%"
): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "N/A";
  }
  return `${value.toFixed(2)}${suffix}`;
}

export function formatKpiScore(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "N/A";
  }
  return value.toFixed(2);
}

export function formatWibDateTime(isoString: string | null | undefined): string {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "-";
  return (
    new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date) + " WIB"
  );
}

export function formatWibDate(isoString: string | null | undefined): string {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

const MONTH_NAMES_FULL_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
] as const;

export function formatPeriodLabelId(year: number, month: number): string {
  const monthName = MONTH_NAMES_FULL_ID[month - 1] ?? String(month);
  return `${monthName} ${year}`;
}

export function buildPeriodSelectOptions(
  anchorYear: number,
  anchorMonth: number,
  monthsBack = 12,
  monthsForward = 2
): Array<{ value: string; year: number; month: number; label: string }> {
  const options: Array<{
    value: string;
    year: number;
    month: number;
    label: string;
  }> = [];

  for (let offset = monthsForward; offset >= -monthsBack; offset -= 1) {
    const d = new Date(Date.UTC(anchorYear, anchorMonth - 1 + offset, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth() + 1;
    const value = `${y}-${String(m).padStart(2, "0")}`;
    options.push({
      value,
      year: y,
      month: m,
      label: `${formatPeriodLabelId(y, m)} (${value})`,
    });
  }

  return options;
}

export function getInitials(name: string): string {
  const withoutParens = name.replace(/\([^)]*\)/g, " ");
  const cleaned = withoutParens.replace(/[^\p{L}\p{N}\s]/gu, " ");
  let parts = cleaned.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    parts = name
      .replace(/[^\p{L}\p{N}\s]/gu, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }
  if (parts.length === 0) return "KT";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}
