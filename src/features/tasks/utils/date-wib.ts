import type { TaskStatus } from "@/lib/constants/enums";
import type { DeadlineHealth } from "@/features/tasks/types";

export const WIB_TIME_ZONE = "Asia/Jakarta";
const WIB_OFFSET = "+07:00";
const MS_PER_HOUR = 3_600_000;
const MS_PER_DAY = 86_400_000;
const DUE_SOON_WINDOW_MS = 48 * MS_PER_HOUR;

const wibDateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: WIB_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const wibShortDateFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: WIB_TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const wibCompactDateFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: WIB_TIME_ZONE,
  day: "2-digit",
  month: "short",
});

const wibDateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  timeZone: WIB_TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/**
 * Formats a Date into `YYYY-MM-DD` in Asia/Jakarta (WIB) timezone.
 */
export function formatDateKeyWib(date: Date): string {
  return wibDateKeyFormatter.format(date);
}

/**
 * Parses a date key `YYYY-MM-DD` into UTC midnight timestamp for deterministic day-diff math.
 */
function dateKeyToUtcMidnightMs(dateKey: string): number {
  const parts = dateKey.split("-").map(Number);
  const year = parts[0] ?? 1970;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  return Date.UTC(year, month - 1, day);
}

/**
 * Returns whole calendar-day difference `(targetWibDate - baseWibDate)` in WIB.
 * Positive = future (`+2` means H-2), `0` = today (H-0), negative = past (`-1` means H+1 overdue).
 */
export function diffWibDays(target: Date, base: Date = new Date()): number {
  const targetKey = formatDateKeyWib(target);
  const baseKey = formatDateKeyWib(base);
  return Math.round(
    (dateKeyToUtcMidnightMs(targetKey) - dateKeyToUtcMidnightMs(baseKey)) /
      MS_PER_DAY
  );
}

/**
 * Normalizes a due-date input string.
 * Per FR-A07, date-only strings (`YYYY-MM-DD`) default to `23:59:59+07:00` (WIB).
 */
export function parseDueDateWib(
  input: string | null | undefined
): Date | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const parsed = new Date(`${trimmed}T23:59:59${WIB_OFFSET}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  // If datetime-local string without offset (`YYYY-MM-DDTHH:mm`), assume WIB
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    const withSeconds = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
    const parsed = new Date(`${withSeconds}${WIB_OFFSET}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Parses a date-only string (`YYYY-MM-DD` or ISO) into UTC midnight for Prisma `@db.Date`.
 */
export function parseDateOnlyUtc(
  input: string | null | undefined
): Date | null {
  if (!input) return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const datePart = trimmed.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
    const parsed = new Date(`${datePart}T00:00:00.000Z`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Computes deadline urgency classification per FR-A07.
 */
export function computeDeadlineHealth(
  status: TaskStatus,
  dueDate: Date | null,
  now: Date = new Date()
): { isOverdue: boolean; deadlineHealth: DeadlineHealth } {
  if (status === "DONE" || status === "CANCELLED") {
    return { isOverdue: false, deadlineHealth: "COMPLETED" };
  }
  if (!dueDate) {
    return { isOverdue: false, deadlineHealth: "NO_DEADLINE" };
  }

  const remainingMs = dueDate.getTime() - now.getTime();
  if (remainingMs < 0) {
    return { isOverdue: true, deadlineHealth: "OVERDUE" };
  }
  if (remainingMs <= DUE_SOON_WINDOW_MS) {
    return { isOverdue: false, deadlineHealth: "DUE_SOON" };
  }
  return { isOverdue: false, deadlineHealth: "ON_TRACK" };
}

export function formatDisplayDateWib(
  input: Date | string | null | undefined,
  variant: "short" | "compact" | "datetime" = "short"
): string {
  if (!input) return "-";
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "-";

  switch (variant) {
    case "compact":
      return wibCompactDateFormatter.format(date);
    case "datetime":
      return `${wibDateTimeFormatter.format(date)} WIB`;
    case "short":
    default:
      return wibShortDateFormatter.format(date);
  }
}

/**
 * Converts a Date or ISO string to `YYYY-MM-DD` in WIB for `<input type="date" />`.
 */
export function toDateInputValueWib(
  input: Date | string | null | undefined
): string {
  if (!input) return "";
  const date = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(date.getTime())) return "";
  return formatDateKeyWib(date);
}
