/**
 * Canonical UI enums, labels, Tailwind color tokens, and Lucide icon identifiers
 * synchronized across all 4 KTMS modules (Runbook §3.2.A).
 */

export const TASK_STATUS_VALUES = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "IN_REVIEW",
  "REVISION",
  "DONE",
  "CANCELLED",
] as const;
export type TaskStatus = (typeof TASK_STATUS_VALUES)[number];

export const TASK_TYPE_VALUES = [
  "GENERAL",
  "CONTENT_PRODUCTION",
  "DESIGN_TASK",
] as const;
export type TaskType = (typeof TASK_TYPE_VALUES)[number];

export const TASK_PRIORITY_VALUES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
] as const;
export type TaskPriority = (typeof TASK_PRIORITY_VALUES)[number];

export const CONTENT_STATUS_VALUES = [
  "IDEA",
  "APPROVED_IDEA",
  "PLANNING",
  "IN_DESIGN",
  "DESIGN_REVIEW",
  "DESIGN_REVISION",
  "READY_TO_PUBLISH",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
] as const;
export type ContentStatus = (typeof CONTENT_STATUS_VALUES)[number];

export const DESIGN_SUBMISSION_STATUS_VALUES = [
  "PENDING_BRIEF",
  "IN_PROGRESS",
  "SUBMITTED",
  "REVISION_REQUESTED",
  "APPROVED",
] as const;
export type DesignSubmissionStatus =
  (typeof DESIGN_SUBMISSION_STATUS_VALUES)[number];

export const EVALUATION_STATUS_VALUES = [
  "DRAFT",
  "SUBMITTED",
  "REVIEWED",
  "FINALIZED",
] as const;
export type EvaluationStatus = (typeof EVALUATION_STATUS_VALUES)[number];

export type EnumIconName =
  | "CircleDashed"
  | "Circle"
  | "Loader2"
  | "Eye"
  | "RotateCcw"
  | "CheckCircle2"
  | "XCircle"
  | "CheckSquare"
  | "Megaphone"
  | "Palette"
  | "ChevronDown"
  | "Minus"
  | "ChevronUp"
  | "AlertTriangle"
  | "Lightbulb"
  | "Check"
  | "PenLine"
  | "Sparkles"
  | "CalendarClock"
  | "CheckCheck"
  | "Archive"
  | "FileClock"
  | "Brush"
  | "UploadCloud"
  | "BadgeCheck"
  | "FileEdit"
  | "Send"
  | "ClipboardCheck"
  | "Lock";

export interface EnumBadgeMeta {
  label: string;
  className: string;
  icon: EnumIconName;
}

export const TASK_STATUS_META: Record<TaskStatus, EnumBadgeMeta> = {
  BACKLOG: {
    label: "Backlog",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    icon: "CircleDashed",
  },
  TODO: {
    label: "To Do",
    className: "bg-zinc-100 text-zinc-800 border-zinc-200",
    icon: "Circle",
  },
  IN_PROGRESS: {
    label: "In Progress",
    className: "bg-blue-100 text-blue-700 border-blue-200",
    icon: "Loader2",
  },
  IN_REVIEW: {
    label: "In Review",
    className: "bg-amber-100 text-amber-800 border-amber-200",
    icon: "Eye",
  },
  REVISION: {
    label: "Needs Revision",
    className: "bg-rose-100 text-rose-700 border-rose-200",
    icon: "RotateCcw",
  },
  DONE: {
    label: "Done",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: "CheckCircle2",
  },
  CANCELLED: {
    label: "Cancelled",
    className: "bg-neutral-200 text-neutral-500 line-through border-neutral-300",
    icon: "XCircle",
  },
};

export const TASK_TYPE_META: Record<TaskType, EnumBadgeMeta> = {
  GENERAL: {
    label: "General Task",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    icon: "CheckSquare",
  },
  CONTENT_PRODUCTION: {
    label: "Content Production",
    className: "bg-violet-100 text-violet-700 border-violet-200",
    icon: "Megaphone",
  },
  DESIGN_TASK: {
    label: "Design Task",
    className: "bg-sky-100 text-sky-700 border-sky-200",
    icon: "Palette",
  },
};

export const TASK_PRIORITY_META: Record<TaskPriority, EnumBadgeMeta> = {
  LOW: {
    label: "Low",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    icon: "ChevronDown",
  },
  MEDIUM: {
    label: "Medium",
    className: "bg-sky-100 text-sky-700 border-sky-200",
    icon: "Minus",
  },
  HIGH: {
    label: "High",
    className: "bg-orange-100 text-orange-700 border-orange-200",
    icon: "ChevronUp",
  },
  URGENT: {
    label: "Urgent",
    className: "bg-red-100 text-red-700 border-red-200",
    icon: "AlertTriangle",
  },
};

export const CONTENT_STATUS_META: Record<ContentStatus, EnumBadgeMeta> = {
  IDEA: {
    label: "Idea",
    className: "bg-violet-100 text-violet-700 border-violet-200",
    icon: "Lightbulb",
  },
  APPROVED_IDEA: {
    label: "Approved",
    className: "bg-indigo-100 text-indigo-700 border-indigo-200",
    icon: "Check",
  },
  PLANNING: {
    label: "Planning",
    className: "bg-sky-100 text-sky-700 border-sky-200",
    icon: "PenLine",
  },
  IN_DESIGN: {
    label: "In Design",
    className: "bg-blue-100 text-blue-700 border-blue-200",
    icon: "Palette",
  },
  DESIGN_REVIEW: {
    label: "Design Review",
    className: "bg-amber-100 text-amber-800 border-amber-200",
    icon: "Eye",
  },
  DESIGN_REVISION: {
    label: "Design Revision",
    className: "bg-rose-100 text-rose-700 border-rose-200",
    icon: "RotateCcw",
  },
  READY_TO_PUBLISH: {
    label: "Ready",
    className: "bg-teal-100 text-teal-700 border-teal-200",
    icon: "Sparkles",
  },
  SCHEDULED: {
    label: "Scheduled",
    className: "bg-cyan-100 text-cyan-700 border-cyan-200",
    icon: "CalendarClock",
  },
  PUBLISHED: {
    label: "Published",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: "CheckCheck",
  },
  ARCHIVED: {
    label: "Archived",
    className: "bg-slate-100 text-slate-500 border-slate-200",
    icon: "Archive",
  },
};

export const DESIGN_SUBMISSION_STATUS_META: Record<
  DesignSubmissionStatus,
  EnumBadgeMeta
> = {
  PENDING_BRIEF: {
    label: "Pending",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    icon: "FileClock",
  },
  IN_PROGRESS: {
    label: "Working",
    className: "bg-blue-100 text-blue-700 border-blue-200",
    icon: "Brush",
  },
  SUBMITTED: {
    label: "Submitted",
    className: "bg-amber-100 text-amber-800 border-amber-200",
    icon: "UploadCloud",
  },
  REVISION_REQUESTED: {
    label: "Revision Req.",
    className: "bg-rose-100 text-rose-700 border-rose-200",
    icon: "RotateCcw",
  },
  APPROVED: {
    label: "Approved",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: "BadgeCheck",
  },
};

export const EVALUATION_STATUS_META: Record<EvaluationStatus, EnumBadgeMeta> = {
  DRAFT: {
    label: "Draft",
    className: "bg-slate-100 text-slate-700 border-slate-200",
    icon: "FileEdit",
  },
  SUBMITTED: {
    label: "Submitted",
    className: "bg-blue-100 text-blue-700 border-blue-200",
    icon: "Send",
  },
  REVIEWED: {
    label: "Reviewed",
    className: "bg-amber-100 text-amber-800 border-amber-200",
    icon: "ClipboardCheck",
  },
  FINALIZED: {
    label: "Finalized",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: "Lock",
  },
};

export type StatusDomain =
  | "task"
  | "taskType"
  | "content"
  | "design"
  | "evaluation";

export function getStatusBadgeMeta(
  domain: StatusDomain,
  value: string
): EnumBadgeMeta | null {
  switch (domain) {
    case "task":
      return TASK_STATUS_META[value as TaskStatus] ?? null;
    case "taskType":
      return TASK_TYPE_META[value as TaskType] ?? null;
    case "content":
      return CONTENT_STATUS_META[value as ContentStatus] ?? null;
    case "design":
      return DESIGN_SUBMISSION_STATUS_META[value as DesignSubmissionStatus] ?? null;
    case "evaluation":
      return EVALUATION_STATUS_META[value as EvaluationStatus] ?? null;
    default:
      return null;
  }
}
