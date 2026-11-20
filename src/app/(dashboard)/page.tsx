import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Award,
  Bell,
  Calendar,
  CalendarClock,
  CalendarRange,
  CheckCircle2,
  CheckSquare,
  Clock,
  Columns3,
  FolderKanban,
  Megaphone,
  Palette,
  Pin,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { EmptyState } from "@/components/shared/EmptyState";
import { PriorityBadge } from "@/components/shared/PriorityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { getOverviewDashboardData } from "@/features/system/queries/dashboard.queries";
import { hasPermission, PERMISSIONS } from "@/lib/constants/permissions";
import { getAuthContext } from "@/server/auth/rbac";
import { prisma } from "@/server/db/prisma";

export const dynamic = "force-dynamic";

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  PROJECT_MANAGER: "Project Manager",
  STAFF_CREATOR: "Staff / Creator",
  DESIGNER: "Visual Designer",
};

interface ProjectMemberPreview {
  id: string;
  fullName: string;
  avatarUrl: string | null;
}

function getInitials(name: string): string {
  const cleanTokens = (input: string) =>
    input
      .trim()
      .split(/\s+/)
      .map((part) => part.replace(/[^\p{L}\p{N}]/gu, ""))
      .filter(Boolean);

  const withoutParens = name.replace(/\([^)]*\)/g, " ");
  let parts = cleanTokens(withoutParens);
  if (parts.length === 0) {
    parts = cleanTokens(name);
  }
  if (parts.length === 0) return "KT";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function getJakartaGreeting(date: Date): string {
  const hourStr = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    hour: "numeric",
    hour12: false,
  }).format(date);
  const hour = Number.parseInt(hourStr, 10);
  if (Number.isNaN(hour)) return "Halo";
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

function formatLiveDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatShortDate(iso: string | null): string {
  if (!iso) return "No due";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function formatDateOnly(iso: string | null): string {
  if (!iso) return "TBD";
  return new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "short",
  }).format(new Date(iso));
}

const PLATFORM_STYLES: Record<
  string,
  { label: string; className: string; dotClass: string }
> = {
  INSTAGRAM: {
    label: "Instagram",
    className:
      "border-transparent bg-gradient-to-r from-fuchsia-600 via-pink-600 to-rose-500 text-white shadow-2xs",
    dotClass: "bg-white",
  },
  TIKTOK: {
    label: "TikTok",
    className:
      "border-slate-800 bg-slate-900 text-cyan-300 shadow-2xs dark:border-cyan-500/40 dark:bg-slate-950",
    dotClass: "bg-cyan-400",
  },
  YOUTUBE: {
    label: "YouTube",
    className: "border-transparent bg-red-600 text-white shadow-2xs",
    dotClass: "bg-white",
  },
  LINKEDIN: {
    label: "LinkedIn",
    className: "border-transparent bg-blue-600 text-white shadow-2xs",
    dotClass: "bg-white",
  },
  X_TWITTER: {
    label: "X",
    className: "border-transparent bg-slate-800 text-white shadow-2xs",
    dotClass: "bg-slate-200",
  },
  FACEBOOK: {
    label: "Facebook",
    className: "border-transparent bg-indigo-600 text-white shadow-2xs",
    dotClass: "bg-white",
  },
  WEBSITE_BLOG: {
    label: "Blog",
    className: "border-transparent bg-emerald-600 text-white shadow-2xs",
    dotClass: "bg-white",
  },
};

const ANNOUNCEMENT_PRIORITY_STYLE: Record<string, string> = {
  URGENT:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300",
  IMPORTANT:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300",
  INFO: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300",
};

export default async function OverviewDashboardPage() {
  const ctx = await getAuthContext();
  if (!ctx) {
    redirect("/login");
  }

  const now = new Date();
  const isLeaderOrPm =
    ctx.roleCode === "SUPER_ADMIN" || ctx.roleCode === "PROJECT_MANAGER";
  const canCreateTask = hasPermission(
    ctx.permissions,
    PERMISSIONS.TASKS_ITEM_CREATE,
    ctx.roleCode
  );

  const [data, projectRows] = await Promise.all([
    getOverviewDashboardData(ctx),
    prisma.project
      .findMany({
        where: {
          deletedAt: null,
          status: "ACTIVE",
          ...(isLeaderOrPm
            ? {}
            : {
                OR: [
                  { ownerId: ctx.userId },
                  { members: { some: { userId: ctx.userId } } },
                  {
                    tasks: {
                      some: { assigneeId: ctx.userId, deletedAt: null },
                    },
                  },
                ],
              }),
        },
        orderBy: [{ updatedAt: "desc" }],
        take: 5,
        select: {
          id: true,
          owner: {
            select: { id: true, fullName: true, avatarUrl: true },
          },
          members: {
            take: 4,
            orderBy: { joinedAt: "asc" },
            select: {
              user: {
                select: { id: true, fullName: true, avatarUrl: true },
              },
            },
          },
          _count: {
            select: { members: true },
          },
        },
      })
      .catch(() => []),
  ]);

  // Enrich active projects with member avatar stack
  const projectMemberMap = new Map<
    string,
    { members: ProjectMemberPreview[]; totalCount: number }
  >();
  for (const row of projectRows) {
    const seen = new Set<string>();
    const members: ProjectMemberPreview[] = [];
    for (const m of row.members) {
      if (!seen.has(m.user.id)) {
        seen.add(m.user.id);
        members.push(m.user);
      }
    }
    if (members.length === 0 && row.owner) {
      members.push(row.owner);
    }
    projectMemberMap.set(row.id, {
      members,
      totalCount: Math.max(row._count.members, members.length),
    });
  }

  const greeting = getJakartaGreeting(now);
  const liveDate = formatLiveDate(now);
  const currentUserInitials = getInitials(ctx.fullName);

  // Summary metrics & ratios
  const { openCount, dueSoonCount, overdueCount, completedThisMonthCount } =
    data.taskSummary;
  const totalTracked = openCount + completedThisMonthCount;
  const completionRate =
    totalTracked > 0
      ? Math.round((completedThisMonthCount / totalTracked) * 100)
      : 0;
  const onTrackOpen = Math.max(0, openCount - overdueCount);
  const onTrackShare =
    openCount > 0 ? Math.round((onTrackOpen / openCount) * 100) : 100;
  const dueSoonShare =
    openCount > 0 ? Math.min(100, Math.round((dueSoonCount / openCount) * 100)) : 0;
  const overdueShare =
    openCount > 0 ? Math.min(100, Math.round((overdueCount / openCount) * 100)) : 0;

  // Segmented status distribution
  const todoSegment = data.myTasks.filter(
    (t) => t.status === "TODO" || t.status === "BACKLOG"
  ).length;
  const inProgressSegment = data.myTasks.filter(
    (t) => t.status === "IN_PROGRESS"
  ).length;
  const reviewSegment = data.myTasks.filter(
    (t) => t.status === "IN_REVIEW" || t.status === "REVISION"
  ).length;
  const doneSegment = completedThisMonthCount;
  const segmentTotal =
    todoSegment + inProgressSegment + reviewSegment + doneSegment;

  const avgProjectProgress =
    data.activeProjects.length > 0
      ? Math.round(
          data.activeProjects.reduce((acc, p) => acc + p.progressPct, 0) /
            data.activeProjects.length
        )
      : 0;

  const designSectionHref = isLeaderOrPm
    ? "/design/reviews"
    : "/design/workspace";

  const quickDock = [
    {
      label: "My Focus",
      href: "/tasks/my-tasks",
      icon: CheckSquare,
      meta: `${openCount} active`,
      iconBox:
        "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/15 dark:text-blue-400 dark:border-blue-500/30",
    },
    {
      label: "Kanban Board",
      href: "/tasks/board",
      icon: Columns3,
      meta: "Task workflow",
      iconBox:
        "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-400 dark:border-indigo-500/30",
    },
    {
      label: "Content Flow",
      href: "/content/calendar",
      icon: CalendarRange,
      meta: `${data.upcomingContent.length} queued`,
      iconBox:
        "bg-pink-50 text-pink-600 border-pink-200 dark:bg-pink-500/15 dark:text-pink-400 dark:border-pink-500/30",
    },
    {
      label:
        ctx.roleCode === "DESIGNER" || isLeaderOrPm
          ? "Design Queue"
          : "Evaluations",
      href:
        ctx.roleCode === "DESIGNER"
          ? "/design/workspace"
          : isLeaderOrPm
            ? "/design/reviews"
            : "/kpi/evaluations",
      icon:
        ctx.roleCode === "DESIGNER" || isLeaderOrPm ? Palette : Award,
      meta:
        ctx.roleCode === "DESIGNER" || isLeaderOrPm
          ? `${data.designQueue.length} briefs`
          : "KPI Scorecard",
      iconBox:
        ctx.roleCode === "DESIGNER" || isLeaderOrPm
          ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/30"
          : "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-500/30",
    },
  ];

  return (
    <div className="space-y-6">
      {/* 1. HERO GREETING BANNER */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -right-12 size-64 rounded-full bg-gradient-to-br from-blue-500/10 via-indigo-500/8 to-transparent blur-3xl dark:from-blue-500/20"
        />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar
              size="lg"
              className="size-12 shrink-0 ring-2 ring-blue-100 dark:ring-blue-500/30"
            >
              {ctx.avatarUrl ? (
                <AvatarImage src={ctx.avatarUrl} alt={ctx.fullName} />
              ) : null}
              <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-sm font-bold text-white">
                {currentUserInitials}
              </AvatarFallback>
              <AvatarBadge className="bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
            </Avatar>

            <div className="min-w-0 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="truncate text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  {greeting}, {ctx.fullName}
                </h1>
                <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300">
                  {ROLE_DISPLAY_NAMES[ctx.roleCode] ?? ctx.roleCode}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 text-sm font-medium text-slate-600 dark:text-slate-300">
                <span className="truncate">
                  {ctx.jobTitle} · {ctx.department}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  <span className="size-1.5 rounded-full bg-emerald-500" />
                  <span>{liveDate}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href="/notifications"
              className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Bell className="size-3.5 text-blue-600 dark:text-blue-400" />
              <span>Notifications</span>
              {data.unreadNotificationCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 font-mono text-[10px] font-bold text-white">
                  {data.unreadNotificationCount}
                </span>
              ) : null}
            </Link>

            <Link
              href="/tasks/board"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <Columns3 className="size-3.5 text-slate-500 dark:text-slate-400" />
              <span>Kanban</span>
            </Link>

            {canCreateTask ? (
              <Link
                href="/tasks/board"
                className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm shadow-blue-600/20 transition-all hover:-translate-y-0.5 hover:bg-blue-700"
              >
                <Plus className="size-3.5" />
                <span>New Task</span>
              </Link>
            ) : null}
          </div>
        </div>
      </section>

      {/* 2. METRICS STAT CARDS (4 CARDS) */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {/* Active Tasks */}
        <Link
          href="/tasks/my-tasks"
          className="group flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/50"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 p-2.5 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-400">
                <CheckSquare className="size-4.5" />
              </span>
              <span className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Active Tasks
              </span>
            </div>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold ${
                onTrackShare >= 80
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
                  : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
              }`}
            >
              {onTrackShare}% on track
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between gap-2">
            <span className="font-mono text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-white">
              {openCount}
            </span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {onTrackOpen} on schedule
            </span>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${onTrackShare}%` }}
            />
          </div>
        </Link>

        {/* Due Soon */}
        <Link
          href="/tasks/my-tasks"
          className="group flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-500/50"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-400">
                <Clock className="size-4.5" />
              </span>
              <span className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Due Soon
              </span>
            </div>
            <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 font-mono text-[11px] font-bold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300">
              48h window
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between gap-2">
            <span className="font-mono text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-white">
              {dueSoonCount}
            </span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {dueSoonCount > 0 ? "Needs priority" : "Clear ahead"}
            </span>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-amber-500 transition-all"
              style={{ width: `${dueSoonShare}%` }}
            />
          </div>
        </Link>

        {/* Overdue */}
        <Link
          href="/tasks/my-tasks"
          className="group flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-rose-500/50"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-400">
                <AlertCircle className="size-4.5" />
              </span>
              <span className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Overdue
              </span>
            </div>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-bold ${
                overdueCount > 0
                  ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300"
                  : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
              }`}
            >
              {overdueCount > 0 ? "Action needed" : "0 delay"}
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between gap-2">
            <span className="font-mono text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-white">
              {overdueCount}
            </span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {overdueCount > 0 ? "Past deadline" : "All clear"}
            </span>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className={`h-full rounded-full transition-all ${
                overdueCount > 0 ? "bg-rose-500" : "bg-emerald-500"
              }`}
              style={{ width: `${overdueCount > 0 ? overdueShare : 100}%` }}
            />
          </div>
        </Link>

        {/* Completed */}
        <Link
          href={`/team/${ctx.userId}`}
          className="group flex flex-col justify-between rounded-xl border border-slate-200/90 bg-white p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500/50"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 p-2.5 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400">
                <CheckCircle2 className="size-4.5" />
              </span>
              <span className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Completed
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-mono text-[11px] font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              {completionRate}% rate
            </span>
          </div>

          <div className="mt-4 flex items-baseline justify-between gap-2">
            <span className="font-mono text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums dark:text-white">
              {completedThisMonthCount}
            </span>
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              This month
            </span>
          </div>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </Link>
      </section>

      {/* 3. LIVE OPERATIONAL PULSE (BENTO ROW) */}
      {data.managementSnapshot ? (
        <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2">
                <div className="h-4 w-1 rounded-full bg-blue-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Live Operational Pulse
                </h2>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
                </span>
                LIVE
              </span>
              {data.activeProjects.length > 0 ? (
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-mono text-[11px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {avgProjectProgress}% sprint avg
                </span>
              ) : null}
            </div>

            <Link
              href="/kpi/dashboard"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
            >
              <span>Team KPI</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/team"
              className="group flex items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50/75 p-4 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-blue-500/40 dark:hover:bg-slate-800"
            >
              <div className="space-y-1">
                <p className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  Team Active
                </p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-2xl font-extrabold text-slate-900 tabular-nums dark:text-white">
                    {data.managementSnapshot.activeTeamCount}
                  </p>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300">
                    Roster
                  </span>
                </div>
              </div>
              <span className="flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 p-2.5 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-400">
                <Users className="size-4.5" />
              </span>
            </Link>

            <Link
              href="/design/reviews"
              className="group flex items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50/75 p-4 transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-amber-500/40 dark:hover:bg-slate-800"
            >
              <div className="space-y-1">
                <p className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  Design Queue
                </p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-2xl font-extrabold text-slate-900 tabular-nums dark:text-white">
                    {data.managementSnapshot.pendingDesignReviewsCount}
                  </p>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                      data.managementSnapshot.pendingDesignReviewsCount > 0
                        ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
                    }`}
                  >
                    {data.managementSnapshot.pendingDesignReviewsCount > 0
                      ? "Pending"
                      : "Clear"}
                  </span>
                </div>
              </div>
              <span className="flex items-center justify-center rounded-xl border border-amber-200 bg-amber-50 p-2.5 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-400">
                <Palette className="size-4.5" />
              </span>
            </Link>

            <Link
              href="/kpi/evaluations"
              className="group flex items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50/75 p-4 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-indigo-500/40 dark:hover:bg-slate-800"
            >
              <div className="space-y-1">
                <p className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  KPI Pending
                </p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-2xl font-extrabold text-slate-900 tabular-nums dark:text-white">
                    {data.managementSnapshot.pendingEvaluationsCount}
                  </p>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                      data.managementSnapshot.pendingEvaluationsCount > 0
                        ? "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
                    }`}
                  >
                    {data.managementSnapshot.pendingEvaluationsCount > 0
                      ? "Review"
                      : "Synced"}
                  </span>
                </div>
              </div>
              <span className="flex items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 p-2.5 text-indigo-600 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-400">
                <Award className="size-4.5" />
              </span>
            </Link>

            <Link
              href="/tasks/board?overdueOnly=true"
              className="group flex items-center justify-between rounded-xl border border-slate-200/90 bg-slate-50/75 p-4 transition-all hover:-translate-y-0.5 hover:border-rose-300 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/60 dark:hover:border-rose-500/40 dark:hover:bg-slate-800"
            >
              <div className="space-y-1">
                <p className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  Team Overdue
                </p>
                <div className="flex items-center gap-2">
                  <p className="font-mono text-2xl font-extrabold text-slate-900 tabular-nums dark:text-white">
                    {data.managementSnapshot.teamOverdueTasksCount}
                  </p>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${
                      data.managementSnapshot.teamOverdueTasksCount > 0
                        ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
                    }`}
                  >
                    {data.managementSnapshot.teamOverdueTasksCount > 0
                      ? "Alert"
                      : "Healthy"}
                  </span>
                </div>
              </div>
              <span
                className={`flex items-center justify-center rounded-xl border p-2.5 ${
                  data.managementSnapshot.teamOverdueTasksCount > 0
                    ? "border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-400"
                    : "border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400"
                }`}
              >
                <AlertTriangle className="size-4.5" />
              </span>
            </Link>
          </div>
        </section>
      ) : null}

      {/* 4. STRUCTURED WORK QUEUES (2-COLUMN GRID) */}
      <div className="grid gap-5 lg:grid-cols-12">
        {/* Column 1: My Focus + Active Projects */}
        <div className="space-y-5 lg:col-span-7">
          {/* My Focus */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-4 w-1 rounded-full bg-blue-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  My Focus
                </h2>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {openCount}
                </span>
              </div>

              <Link
                href="/tasks/my-tasks"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
              >
                <span>All tasks</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            <div className="space-y-4">
              {/* Segmented Status Distribution */}
              {segmentTotal > 0 ? (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 dark:border-slate-800 dark:bg-slate-800/50">
                  <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    {todoSegment > 0 ? (
                      <div
                        className="h-full bg-slate-500 transition-all"
                        style={{
                          width: `${(todoSegment / segmentTotal) * 100}%`,
                        }}
                        title={`Todo: ${todoSegment}`}
                      />
                    ) : null}
                    {inProgressSegment > 0 ? (
                      <div
                        className="h-full bg-blue-600 transition-all"
                        style={{
                          width: `${(inProgressSegment / segmentTotal) * 100}%`,
                        }}
                        title={`In Progress: ${inProgressSegment}`}
                      />
                    ) : null}
                    {reviewSegment > 0 ? (
                      <div
                        className="h-full bg-amber-500 transition-all"
                        style={{
                          width: `${(reviewSegment / segmentTotal) * 100}%`,
                        }}
                        title={`Review: ${reviewSegment}`}
                      />
                    ) : null}
                    {doneSegment > 0 ? (
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{
                          width: `${(doneSegment / segmentTotal) * 100}%`,
                        }}
                        title={`Done: ${doneSegment}`}
                      />
                    ) : null}
                  </div>

                  <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-slate-500" />
                      Todo{" "}
                      <strong className="font-mono font-bold text-slate-900 dark:text-white">
                        {todoSegment}
                      </strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-blue-600" />
                      In Progress{" "}
                      <strong className="font-mono font-bold text-slate-900 dark:text-white">
                        {inProgressSegment}
                      </strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-amber-500" />
                      Review{" "}
                      <strong className="font-mono font-bold text-slate-900 dark:text-white">
                        {reviewSegment}
                      </strong>
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="size-2 rounded-full bg-emerald-500" />
                      Done{" "}
                      <strong className="font-mono font-bold text-slate-900 dark:text-white">
                        {doneSegment}
                      </strong>
                    </span>
                  </div>
                </div>
              ) : null}

              {data.myTasks.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="Inbox bersih"
                  description="Semua task selesai."
                  className="border-slate-200 bg-slate-50/70 py-8 dark:border-slate-800 dark:bg-slate-800/40"
                />
              ) : (
                <ul className="space-y-2.5">
                  {data.myTasks.map((task) => (
                    <li key={task.id}>
                      <Link
                        href={`/?drawer=task&id=${task.id}`}
                        className="group flex flex-col gap-3 rounded-xl border border-slate-200/90 bg-white p-3.5 shadow-2xs transition-all duration-150 hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900/80 dark:hover:border-blue-500/60"
                      >
                        <div className="min-w-0 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className="size-2 shrink-0 rounded-full"
                              style={{ backgroundColor: task.project.colorHex }}
                            />
                            <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              {task.taskCode}
                            </span>
                            <span className="truncate text-xs font-semibold text-slate-500 dark:text-slate-400">
                              {task.project.name}
                            </span>
                          </div>
                          <p className="truncate text-sm font-semibold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                            {task.title}
                          </p>
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <StatusBadge domain="task" value={task.status} />
                          <PriorityBadge priority={task.priority} />
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-mono text-[11px] font-semibold ${
                              task.isOverdue
                                ? "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300"
                                : "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            }`}
                          >
                            <CalendarClock className="size-3" />
                            <span>{formatShortDate(task.dueDate)}</span>
                          </span>
                          <Avatar
                            size="sm"
                            title={ctx.fullName}
                            className="ring-1 ring-slate-200 dark:ring-slate-700"
                          >
                            {ctx.avatarUrl ? (
                              <AvatarImage
                                src={ctx.avatarUrl}
                                alt={ctx.fullName}
                              />
                            ) : null}
                            <AvatarFallback className="bg-blue-600 text-[10px] font-bold text-white">
                              {currentUserInitials}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Active Projects */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-4 w-1 rounded-full bg-indigo-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Active Projects
                </h2>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {data.activeProjects.length}
                </span>
              </div>

              <Link
                href="/projects"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-blue-500/40 dark:hover:bg-blue-500/10 dark:hover:text-blue-300"
              >
                <span>All projects</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {data.activeProjects.length === 0 ? (
              <EmptyState
                icon={FolderKanban}
                title="Belum ada proyek aktif"
                className="border-slate-200 bg-slate-50/70 py-8 dark:border-slate-800 dark:bg-slate-800/40"
              />
            ) : (
              <div className="space-y-3">
                {data.activeProjects.map((project) => {
                  const memberInfo = projectMemberMap.get(project.id);
                  const visibleMembers = memberInfo?.members.slice(0, 4) ?? [];
                  const extraMembers = Math.max(
                    0,
                    (memberInfo?.totalCount ?? 0) - visibleMembers.length
                  );

                  return (
                    <Link
                      key={project.id}
                      href={`/projects/${project.id}`}
                      className="group block rounded-xl border border-slate-200/90 bg-slate-50/60 p-4 transition-all duration-150 hover:-translate-y-0.5 hover:border-blue-400 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/40 dark:hover:border-blue-500/60 dark:hover:bg-slate-800"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className="size-2.5 shrink-0 rounded-full ring-2 ring-white dark:ring-slate-900"
                            style={{ backgroundColor: project.colorHex }}
                          />
                          <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                            {project.code}
                          </span>
                          <span className="truncate text-sm font-bold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                            {project.name}
                          </span>
                        </div>

                        <span className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-mono text-xs font-extrabold text-blue-700 tabular-nums dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300">
                          {project.progressPct}%
                        </span>
                      </div>

                      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-200/90 dark:bg-slate-700">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${project.progressPct}%`,
                            backgroundColor: project.colorHex,
                          }}
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          {visibleMembers.length > 0 ? (
                            <AvatarGroup>
                              {visibleMembers.map((member) => (
                                <Avatar
                                  key={member.id}
                                  size="sm"
                                  title={member.fullName}
                                >
                                  {member.avatarUrl ? (
                                    <AvatarImage
                                      src={member.avatarUrl}
                                      alt={member.fullName}
                                    />
                                  ) : null}
                                  <AvatarFallback className="bg-slate-800 text-[9px] font-bold text-white dark:bg-blue-600">
                                    {getInitials(member.fullName)}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {extraMembers > 0 ? (
                                <AvatarGroupCount className="size-6 bg-slate-200 text-[10px] font-bold text-slate-700 dark:bg-slate-700 dark:text-slate-200">
                                  +{extraMembers}
                                </AvatarGroupCount>
                              ) : null}
                            </AvatarGroup>
                          ) : null}

                          <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-300">
                            {project.doneTasks}/{project.totalTasks} tasks done
                          </span>
                        </div>

                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 font-mono text-[11px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                          <Calendar className="size-3 text-slate-400" />
                          <span>{formatDateOnly(project.targetEndDate)}</span>
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Column 2: Design Review Queue + Content Flow + Announcements */}
        <div className="space-y-5 lg:col-span-5">
          {/* Design Review Queue */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-4 w-1 rounded-full bg-amber-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Design Review Queue
                </h2>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {data.designQueue.length}
                </span>
              </div>

              <Link
                href={designSectionHref}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-2xs transition-colors hover:bg-blue-700"
              >
                <span>{isLeaderOrPm ? "Review Queue" : "Workspace"}</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {data.designQueue.length === 0 ? (
              <EmptyState
                icon={Palette}
                title="Antrean desain bersih"
                className="border-slate-200 bg-slate-50/70 py-7 dark:border-slate-800 dark:bg-slate-800/40"
              />
            ) : (
              <ul className="space-y-2.5">
                {data.designQueue.map((brief) => {
                  const actorName = brief.designerName ?? brief.requesterName;
                  const targetHref = isLeaderOrPm
                    ? "/design/reviews"
                    : `/design/workspace?briefId=${brief.id}`;

                  return (
                    <li key={brief.id}>
                      <Link
                        href={targetHref}
                        className="group block rounded-xl border border-slate-200/90 bg-slate-50/55 p-3.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-blue-400 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/45 dark:hover:border-blue-500/60 dark:hover:bg-slate-800"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 space-y-1">
                            <p className="truncate text-sm font-semibold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                              {brief.title}
                            </p>
                            <p className="truncate text-xs font-medium text-slate-500 dark:text-slate-400">
                              {brief.projectName}
                            </p>
                          </div>

                          <StatusBadge
                            domain="design"
                            value={brief.status}
                            versionNumber={brief.currentVersion}
                            revisionCount={brief.revisionCount}
                          />
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-200/70 pt-2.5 dark:border-slate-700/70">
                          <div className="flex min-w-0 items-center gap-2">
                            <Avatar
                              size="sm"
                              className="ring-1 ring-slate-200 dark:ring-slate-700"
                            >
                              <AvatarFallback className="bg-amber-500/15 text-[10px] font-bold text-amber-800 dark:text-amber-300">
                                {getInitials(actorName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                              {actorName}
                            </span>
                            <span className="rounded-md border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                              v{brief.currentVersion}
                            </span>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              {formatShortDate(brief.dueDate)}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-700 transition-colors group-hover:border-blue-300 group-hover:bg-blue-50 group-hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                              <span>{isLeaderOrPm ? "Review" : "Open"}</span>
                              <ArrowRight className="size-3" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Content Flow */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-4 w-1 rounded-full bg-pink-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Content Flow
                </h2>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 font-mono text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {data.upcomingContent.length}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/content/planner"
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  <span>Planner</span>
                </Link>
                <Link
                  href="/content/calendar"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  <span>Calendar</span>
                  <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>

            {data.upcomingContent.length === 0 ? (
              <EmptyState
                icon={CalendarRange}
                title="Belum ada jadwal konten"
                className="border-slate-200 bg-slate-50/70 py-7 dark:border-slate-800 dark:bg-slate-800/40"
              />
            ) : (
              <ul className="space-y-2.5">
                {data.upcomingContent.map((item) => {
                  const platformMeta = PLATFORM_STYLES[item.platform] ?? {
                    label: item.platform,
                    className: "border-slate-700 bg-slate-800 text-white",
                    dotClass: "bg-white",
                  };

                  return (
                    <li key={item.id}>
                      <Link
                        href="/content/planner"
                        className="group block rounded-xl border border-slate-200/90 bg-slate-50/55 p-3.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-blue-400 hover:bg-white hover:shadow-sm dark:border-slate-800 dark:bg-slate-800/45 dark:hover:border-blue-500/60 dark:hover:bg-slate-800"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${platformMeta.className}`}
                            >
                              <span
                                className={`size-1.5 rounded-full ${platformMeta.dotClass}`}
                              />
                              <span>{platformMeta.label}</span>
                            </span>

                            <span className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                              {item.contentFormat.replace(/_/g, " ")}
                            </span>
                          </div>

                          <StatusBadge domain="content" value={item.status} />
                        </div>

                        <p className="mt-2 truncate text-sm font-semibold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                          {item.title}
                        </p>

                        <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-slate-200/70 pt-2.5 dark:border-slate-700/70">
                          <div className="flex min-w-0 items-center gap-2">
                            <Avatar
                              size="sm"
                              className="ring-1 ring-slate-200 dark:ring-slate-700"
                            >
                              <AvatarFallback className="bg-pink-500/15 text-[10px] font-bold text-pink-700 dark:text-pink-300">
                                {getInitials(item.creatorName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate text-xs font-semibold text-slate-700 dark:text-slate-200">
                              {item.creatorName}
                            </span>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                              {formatShortDate(item.plannedPublishAt)}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-bold text-slate-700 transition-colors group-hover:border-blue-300 group-hover:bg-blue-50 group-hover:text-blue-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                              <span>Open</span>
                              <ArrowRight className="size-3" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Recent Announcements */}
          <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="h-4 w-1 rounded-full bg-indigo-600" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Announcements
                </h2>
                {data.recentAnnouncements.some((a) => !a.isRead) ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300">
                    <Sparkles className="size-3" />
                    New
                  </span>
                ) : null}
              </div>

              <Link
                href="/announcements"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <span>View all</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </div>

            {data.recentAnnouncements.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title="Belum ada pengumuman"
                className="border-slate-200 bg-slate-50/70 py-7 dark:border-slate-800 dark:bg-slate-800/40"
              />
            ) : (
              <ul className="space-y-2.5">
                {data.recentAnnouncements.map((ann) => {
                  const pStyle =
                    ANNOUNCEMENT_PRIORITY_STYLE[ann.priority] ??
                    ANNOUNCEMENT_PRIORITY_STYLE.INFO!;

                  return (
                    <li key={ann.id}>
                      <Link
                        href="/announcements"
                        className={`group block rounded-xl border p-3.5 transition-all duration-150 hover:-translate-y-0.5 hover:border-blue-400 hover:bg-white hover:shadow-sm dark:hover:border-blue-500/60 dark:hover:bg-slate-800 ${
                          !ann.isRead
                            ? "border-blue-200 bg-blue-50/35 dark:border-blue-500/30 dark:bg-blue-500/5"
                            : "border-slate-200/90 bg-slate-50/55 dark:border-slate-800 dark:bg-slate-800/45"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${pStyle}`}
                            >
                              {ann.priority}
                            </span>
                            {ann.isPinned ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                                <Pin className="size-2.5 text-blue-600 dark:text-blue-400" />
                                Pinned
                              </span>
                            ) : null}
                            {!ann.isRead ? (
                              <span
                                className="size-2 rounded-full bg-blue-600"
                                title="Unread"
                              />
                            ) : null}
                          </div>

                          <span className="font-mono text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            {formatDateOnly(ann.publishedAt)}
                          </span>
                        </div>

                        <p className="mt-2 line-clamp-1 text-sm font-semibold text-slate-900 transition-colors group-hover:text-blue-600 dark:text-white dark:group-hover:text-blue-400">
                          {ann.title}
                        </p>

                        <div className="mt-2 flex items-center justify-between text-xs font-medium text-slate-600 dark:text-slate-400">
                          <span className="truncate">{ann.authorName}</span>
                          <ArrowRight className="size-3.5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600" />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </div>

      {/* 5. QUICK NAVIGATION DOCK */}
      <section className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {quickDock.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className="group flex items-center justify-between rounded-xl border border-slate-200/90 bg-white px-4 py-3.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500/50"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex items-center justify-center rounded-xl border p-2.5 transition-transform duration-150 group-hover:scale-105 ${item.iconBox}`}
                >
                  <Icon className="size-4.5" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {item.label}
                  </p>
                  <p className="font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {item.meta}
                  </p>
                </div>
              </div>
              <ArrowRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
            </Link>
          );
        })}
      </section>
    </div>
  );
}
