import { Badge } from "@/components/ui/badge";
import { getStatusBadgeMeta, type StatusDomain } from "@/lib/constants/enums";
import { cn } from "@/lib/utils";

type BadgeToneKey =
  | "slate"
  | "zinc"
  | "blue"
  | "bluePulse"
  | "indigo"
  | "violet"
  | "sky"
  | "cyan"
  | "teal"
  | "emerald"
  | "amber"
  | "rose"
  | "cancelled";

interface ToneStyle {
  pill: string;
  dot: string;
}

const TONE_STYLES: Record<BadgeToneKey, ToneStyle> = {
  slate: {
    pill: "border-slate-300/80 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200",
    dot: "bg-slate-500 dark:bg-slate-400",
  },
  zinc: {
    pill: "border-zinc-300/80 bg-zinc-100 text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
    dot: "bg-zinc-600 dark:bg-zinc-400",
  },
  blue: {
    pill: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300",
    dot: "bg-blue-600 dark:bg-blue-400",
  },
  bluePulse: {
    pill: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300",
    dot: "bg-blue-600 dark:bg-blue-400 animate-pulse",
  },
  indigo: {
    pill: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300",
    dot: "bg-indigo-600 dark:bg-indigo-400",
  },
  violet: {
    pill: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-300",
    dot: "bg-violet-600 dark:bg-violet-400",
  },
  sky: {
    pill: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-300",
    dot: "bg-sky-600 dark:bg-sky-400",
  },
  cyan: {
    pill: "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-500/30 dark:bg-cyan-500/15 dark:text-cyan-300",
    dot: "bg-cyan-600 dark:bg-cyan-400",
  },
  teal: {
    pill: "border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-500/30 dark:bg-teal-500/15 dark:text-teal-300",
    dot: "bg-teal-600 dark:bg-teal-400",
  },
  emerald: {
    pill: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
    dot: "bg-emerald-600 dark:bg-emerald-400",
  },
  amber: {
    pill: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300",
    dot: "bg-amber-500 dark:bg-amber-400",
  },
  rose: {
    pill: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300",
    dot: "bg-rose-600 dark:bg-rose-400",
  },
  cancelled: {
    pill: "border-slate-300 bg-slate-100 text-slate-500 line-through dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-400",
    dot: "bg-slate-400 dark:bg-slate-500",
  },
};

const DOMAIN_STATUS_TONES: Record<StatusDomain, Record<string, BadgeToneKey>> = {
  task: {
    BACKLOG: "slate",
    TODO: "zinc",
    IN_PROGRESS: "bluePulse",
    IN_REVIEW: "amber",
    REVISION: "rose",
    DONE: "emerald",
    CANCELLED: "cancelled",
  },
  taskType: {
    GENERAL: "slate",
    CONTENT_PRODUCTION: "violet",
    DESIGN_TASK: "sky",
  },
  content: {
    IDEA: "violet",
    APPROVED_IDEA: "indigo",
    PLANNING: "sky",
    IN_DESIGN: "bluePulse",
    DESIGN_REVIEW: "amber",
    DESIGN_REVISION: "rose",
    READY_TO_PUBLISH: "teal",
    SCHEDULED: "cyan",
    PUBLISHED: "emerald",
    ARCHIVED: "slate",
  },
  design: {
    PENDING_BRIEF: "slate",
    IN_PROGRESS: "bluePulse",
    SUBMITTED: "amber",
    REVISION_REQUESTED: "rose",
    APPROVED: "emerald",
  },
  evaluation: {
    DRAFT: "slate",
    SUBMITTED: "blue",
    REVIEWED: "amber",
    FINALIZED: "emerald",
  },
};

export interface StatusBadgeProps {
  domain: StatusDomain;
  value: string;
  versionNumber?: number;
  revisionCount?: number;
  className?: string;
}

export function StatusBadge({
  domain,
  value,
  versionNumber,
  revisionCount,
  className,
}: StatusBadgeProps) {
  const meta = getStatusBadgeMeta(domain, value);
  const toneKey = DOMAIN_STATUS_TONES[domain]?.[value] ?? "slate";
  const tone = TONE_STYLES[toneKey];

  if (!meta) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
          tone.pill,
          className
        )}
      >
        <span
          className={cn("size-1.5 shrink-0 rounded-full", tone.dot)}
          aria-hidden="true"
        />
        <span>{value}</span>
      </Badge>
    );
  }

  const suffix =
    domain === "design" && value === "SUBMITTED" && versionNumber != null
      ? `v${versionNumber}`
      : domain === "design" &&
          value === "REVISION_REQUESTED" &&
          revisionCount != null
        ? `Rev #${revisionCount}`
        : null;

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide",
        tone.pill,
        className
      )}
    >
      <span
        className={cn("size-1.5 shrink-0 rounded-full", tone.dot)}
        aria-hidden="true"
      />
      <span>{meta.label}</span>
      {suffix ? (
        <span className="font-mono text-[10.5px] font-bold opacity-90">
          {suffix}
        </span>
      ) : null}
    </Badge>
  );
}
