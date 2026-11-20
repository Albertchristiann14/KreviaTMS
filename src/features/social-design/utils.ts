const JAKARTA_OFFSET_MS = 7 * 60 * 60 * 1000;

/**
 * Returns the current `YYYY-MM` string in Asia/Jakarta (WIB, UTC+7).
 */
export function getCurrentMonthJakarta(referenceDate: Date = new Date()): string {
  const jakarta = new Date(referenceDate.getTime() + JAKARTA_OFFSET_MS);
  const year = jakarta.getUTCFullYear();
  const month = String(jakarta.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/**
 * Returns today's `YYYY-MM-DD` date string in Asia/Jakarta (WIB, UTC+7).
 */
export function getTodayDateJakarta(referenceDate: Date = new Date()): string {
  const jakarta = new Date(referenceDate.getTime() + JAKARTA_OFFSET_MS);
  const year = jakarta.getUTCFullYear();
  const month = String(jakarta.getUTCMonth() + 1).padStart(2, "0");
  const day = String(jakarta.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Returns UTC [startInclusive, endExclusive) Date bounds for a `YYYY-MM` month in Asia/Jakarta.
 */
export function getMonthBoundsJakarta(monthParam: string): {
  start: Date;
  end: Date;
  year: number;
  month: number;
} {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(monthParam.trim());
  if (!match) {
    const fallback = getCurrentMonthJakarta();
    return getMonthBoundsJakarta(fallback);
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const startUtcMs = Date.UTC(year, month - 1, 1, 0, 0, 0) - JAKARTA_OFFSET_MS;
  const endUtcMs = Date.UTC(year, month, 1, 0, 0, 0) - JAKARTA_OFFSET_MS;
  return {
    start: new Date(startUtcMs),
    end: new Date(endUtcMs),
    year,
    month,
  };
}

/**
 * Shifts a `YYYY-MM` string by `deltaMonths` (+1 or -1).
 */
export function shiftMonthString(monthStr: string, deltaMonths: number): string {
  const { year, month } = getMonthBoundsJakarta(monthStr);
  const d = new Date(Date.UTC(year, month - 1 + deltaMonths, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Formats a `YYYY-MM` string to Indonesian month/year label (e.g., "November 2026").
 */
export function formatMonthYearLabel(monthStr: string): string {
  const { year, month } = getMonthBoundsJakarta(monthStr);
  const date = new Date(Date.UTC(year, month - 1, 15));
  return new Intl.DateTimeFormat("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/**
 * Returns the `YYYY-MM-DD` date key in Asia/Jakarta for an ISO timestamp.
 */
export function getJakartaDateKey(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(d.getTime())) return "";
  const jakarta = new Date(d.getTime() + JAKARTA_OFFSET_MS);
  const year = jakarta.getUTCFullYear();
  const month = String(jakarta.getUTCMonth() + 1).padStart(2, "0");
  const day = String(jakarta.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Formats an ISO string for display in WIB (Asia/Jakarta).
 */
export function formatDateTimeId(isoOrNull: string | null | undefined): string {
  if (!isoOrNull) return "—";
  const d = new Date(isoOrNull);
  if (Number.isNaN(d.getTime())) return "—";
  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Jakarta",
    }).format(d) + " WIB"
  );
}

export function formatDateId(isoOrNull: string | null | undefined): string {
  if (!isoOrNull) return "—";
  const d = new Date(isoOrNull);
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(d);
}

export function formatTimeWib(isoOrNull: string | null | undefined): string {
  if (!isoOrNull) return "";
  const d = new Date(isoOrNull);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Jakarta",
  }).format(d);
}

/**
 * Converts an ISO string to `YYYY-MM-DDTHH:mm` in Asia/Jakarta for `<input type="datetime-local" />`.
 */
export function toJakartaDatetimeLocalValue(
  isoOrNull: string | null | undefined
): string {
  if (!isoOrNull) return "";
  const d = new Date(isoOrNull);
  if (Number.isNaN(d.getTime())) return "";
  const jakarta = new Date(d.getTime() + JAKARTA_OFFSET_MS);
  const year = jakarta.getUTCFullYear();
  const month = String(jakarta.getUTCMonth() + 1).padStart(2, "0");
  const day = String(jakarta.getUTCDate()).padStart(2, "0");
  const hour = String(jakarta.getUTCHours()).padStart(2, "0");
  const minute = String(jakarta.getUTCMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hour}:${minute}`;
}

/**
 * Converts a `<input type="datetime-local" />` string (`YYYY-MM-DDTHH:mm`) treated as WIB (+07:00)
 * into a canonical ISO-8601 string, or returns null when empty.
 */
export function fromJakartaDatetimeLocalValue(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?$/.test(trimmed)) {
    const withSec = trimmed.length === 16 ? `${trimmed}:00` : trimmed;
    const d = new Date(`${withSec}+07:00`);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function parseHashtagsInput(raw: string): string[] {
  const tokens = raw
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => (t.startsWith("#") ? t : `#${t}`))
    .map((t) => t.slice(0, 60));

  return Array.from(new Set(tokens)).slice(0, 30);
}

export function parseTagsInput(raw: string): string[] {
  const tokens = raw
    .split(",")
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .map((t) => t.slice(0, 50));

  return Array.from(new Set(tokens)).slice(0, 10);
}

/**
 * Canonical KTMS on-time completion formula (`effective_completion_time <= due_date`).
 */
export function computeEffectiveIsOnTime(params: {
  dueDate: Date | null;
  revisionCount: number;
  firstSubmittedAt: Date | null;
  completedAt: Date;
}): boolean | null {
  if (!params.dueDate) return null;
  const effectiveCompletionTime =
    params.revisionCount === 0
      ? (params.firstSubmittedAt ?? params.completedAt)
      : params.completedAt;
  return effectiveCompletionTime.getTime() <= params.dueDate.getTime();
}

export function isImageMime(mimeType: string | null | undefined): boolean {
  if (!mimeType) return false;
  const lower = mimeType.toLowerCase();
  return (
    lower === "image/png" ||
    lower === "image/jpeg" ||
    lower === "image/jpg" ||
    lower === "image/webp"
  );
}
