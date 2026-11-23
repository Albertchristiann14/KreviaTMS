"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ContentStatus } from "@prisma/client";
import {
  Calendar as CalendarIcon,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Loader2,
  Palette,
  Plus,
  RefreshCw,
  RotateCcw,
  Table as TableIcon,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  DataTable,
  createDataTableColumnHelper,
  type DataTableColumnDef,
} from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  deleteContentPlanAction,
  updateContentScheduleAction,
} from "@/features/social-design/actions/content-plan.actions";
import { ContentPlanFormDrawer } from "@/features/social-design/components/ContentPlanFormDrawer";
import {
  CHANNEL_VISUAL_STYLE,
  ChannelPill,
  CreativeAvatar,
} from "@/features/social-design/components/StudioPrimitives";
import {
  CONTENT_FORMAT_META,
  CONTENT_PILLAR_OPTIONS,
  SOCIAL_PLATFORM_META,
  SOCIAL_PLATFORM_VALUES,
  getPillarLabel,
} from "@/features/social-design/constants";
import { useContentCalendar } from "@/features/social-design/hooks/useContentCalendar";
import type {
  ContentPlanItemDTO,
  SelectableProjectOption,
  SelectableUserOption,
} from "@/features/social-design/types";
import {
  formatDateTimeId,
  formatMonthYearLabel,
  formatTimeWib,
  fromJakartaDatetimeLocalValue,
  getCurrentMonthJakarta,
  getJakartaDateKey,
  getMonthBoundsJakarta,
  toJakartaDatetimeLocalValue,
} from "@/features/social-design/utils";
import { CONTENT_STATUS_META, CONTENT_STATUS_VALUES } from "@/lib/constants/enums";
import { cn } from "@/lib/utils";

export interface ContentCalendarGridProps {
  initialItems: ContentPlanItemDTO[];
  initialMonth: string;
  projects: SelectableProjectOption[];
  creators: SelectableUserOption[];
  designers: SelectableUserOption[];
  currentUserId: string;
  canManageContent: boolean;
  canDeleteContent?: boolean;
  isAdminOrPm: boolean;
}

const columnHelper = createDataTableColumnHelper<ContentPlanItemDTO>();

const WEEKDAY_HEADERS = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

interface CalendarDayCell {
  dateKey: string;
  dayNum: number;
  inCurrentMonth: boolean;
  shortLabel: string;
}

function buildCalendarDays(monthStr: string): CalendarDayCell[] {
  const { year, month } = getMonthBoundsJakarta(monthStr);
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const startOffset = (firstDay.getUTCDay() + 6) % 7;

  const cells: CalendarDayCell[] = [];

  for (let i = startOffset - 1; i >= 0; i--) {
    const prevDate = new Date(Date.UTC(year, month - 1, -i));
    cells.push({
      dateKey: prevDate.toISOString().slice(0, 10),
      dayNum: prevDate.getUTCDate(),
      inCurrentMonth: false,
      shortLabel: "",
    });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cur = new Date(Date.UTC(year, month - 1, d));
    cells.push({
      dateKey: cur.toISOString().slice(0, 10),
      dayNum: d,
      inCurrentMonth: true,
      shortLabel: "",
    });
  }

  while (cells.length % 7 !== 0) {
    const nextIdx = cells.length - startOffset - daysInMonth + 1;
    const nextDate = new Date(Date.UTC(year, month, nextIdx));
    cells.push({
      dateKey: nextDate.toISOString().slice(0, 10),
      dayNum: nextDate.getUTCDate(),
      inCurrentMonth: false,
      shortLabel: "",
    });
  }

  return cells;
}

function parseDateKeyParts(dateKey: string): { y: number; m: number; d: number } {
  const parts = dateKey.split("-").map(Number);
  return {
    y: Number.isFinite(parts[0]) && parts[0] ? parts[0] : 2026,
    m: Number.isFinite(parts[1]) && parts[1] ? parts[1] : 1,
    d: Number.isFinite(parts[2]) && parts[2] ? parts[2] : 1,
  };
}

function getMondayKeyForDate(dateKey: string): string {
  const { y, m, d } = parseDateKeyParts(dateKey);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const offset = (dt.getUTCDay() + 6) % 7;
  dt.setUTCDate(dt.getUTCDate() - offset);
  return dt.toISOString().slice(0, 10);
}

function shiftDateKey(dateKey: string, deltaDays: number): string {
  const { y, m, d } = parseDateKeyParts(dateKey);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return dt.toISOString().slice(0, 10);
}

function buildWeekDays(
  mondayKey: string,
  monthStr: string
): CalendarDayCell[] {
  const formatter = new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return Array.from({ length: 7 }, (_, i) => {
    const dateKey = shiftDateKey(mondayKey, i);
    const { y, m, d } = parseDateKeyParts(dateKey);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return {
      dateKey,
      dayNum: d,
      inCurrentMonth: dateKey.startsWith(monthStr),
      shortLabel: formatter.format(dt),
    };
  });
}

export function ContentCalendarGrid({
  initialItems,
  initialMonth,
  projects,
  creators,
  designers,
  currentUserId,
  canManageContent,
  canDeleteContent = false,
  isAdminOrPm,
}: ContentCalendarGridProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deleteTarget, setDeleteTarget] = useState<ContentPlanItemDTO | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    filters,
    setFilters,
    items,
    isLoading,
    isFetching,
    error,
    goToPrevMonth,
    goToNextMonth,
    goToCurrentMonth,
    resetFilters,
    invalidateCalendar,
  } = useContentCalendar({ initialItems, initialMonth });

  const [gridScale, setGridScale] = useState<"month" | "week">("month");
  const todayJakarta = getJakartaDateKey(new Date());
  const [weekMondayKey, setWeekMondayKey] = useState<string>(() =>
    getMondayKeyForDate(
      todayJakarta.startsWith(initialMonth)
        ? todayJakarta
        : `${initialMonth}-01`
    )
  );

  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<ContentPlanItemDTO | null>(
    null
  );

  // Quick Status / Schedule / Publish Modal
  const [selectedItem, setSelectedItem] = useState<ContentPlanItemDTO | null>(
    null
  );
  const [modalStatus, setModalStatus] = useState<ContentStatus>("PLANNING");
  const [modalPlannedLocal, setModalPlannedLocal] = useState("");
  const [modalCaption, setModalCaption] = useState("");
  const [modalPublishedUrl, setModalPublishedUrl] = useState("");

  const openQuickModal = (item: ContentPlanItemDTO) => {
    setSelectedItem(item);
    setModalStatus(item.status);
    setModalPlannedLocal(toJakartaDatetimeLocalValue(item.plannedPublishAt));
    setModalCaption(item.caption ?? "");
    setModalPublishedUrl(item.publishedUrl ?? "");
  };

  const effectiveMonth =
    filters.month === "ALL" ? getCurrentMonthJakarta() : filters.month;

  const calendarCells = useMemo(
    () => buildCalendarDays(effectiveMonth),
    [effectiveMonth]
  );

  const weekCells = useMemo(
    () => buildWeekDays(weekMondayKey, effectiveMonth),
    [weekMondayKey, effectiveMonth]
  );

  const shiftWeek = (deltaWeeks: number) => {
    const nextMonday = shiftDateKey(weekMondayKey, deltaWeeks * 7);
    setWeekMondayKey(nextMonday);
    const midWeekMonth = shiftDateKey(nextMonday, 3).slice(0, 7);
    if (midWeekMonth !== filters.month) {
      void setFilters({ month: midWeekMonth });
    }
  };

  const handleTodayClick = () => {
    goToCurrentMonth();
    setWeekMondayKey(getMondayKeyForDate(todayJakarta));
  };

  const handlePrevPeriod = () => {
    if (filters.view === "calendar" && gridScale === "week") {
      shiftWeek(-1);
    } else {
      goToPrevMonth();
    }
  };

  const handleNextPeriod = () => {
    if (filters.view === "calendar" && gridScale === "week") {
      shiftWeek(1);
    } else {
      goToNextMonth();
    }
  };

  const itemsByDay = useMemo(() => {
    const map = new Map<string, ContentPlanItemDTO[]>();
    for (const item of items) {
      if (!item.plannedPublishAt) continue;
      const key = getJakartaDateKey(item.plannedPublishAt);
      const bucket = map.get(key) ?? [];
      bucket.push(item);
      map.set(key, bucket);
    }
    return map;
  }, [items]);

  const unscheduledItems = useMemo(
    () => items.filter((item) => !item.plannedPublishAt),
    [items]
  );

  const handleQuickSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    startTransition(async () => {
      const plannedPublishAt = fromJakartaDatetimeLocalValue(modalPlannedLocal);

      const res = await updateContentScheduleAction({
        contentItemId: selectedItem.id,
        targetStatus: modalStatus,
        plannedPublishAt,
        caption: modalCaption || null,
        publishedUrl: modalPublishedUrl.trim() || null,
      });

      if (!res.success) {
        const firstErr = res.error.fieldErrors
          ? Object.values(res.error.fieldErrors).flat()[0]
          : null;
        toast.error(firstErr ?? res.error.message);
        return;
      }

      toast.success(res.message ?? "Jadwal diperbarui.");
      setSelectedItem(null);
      invalidateCalendar();
      router.refresh();
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await deleteContentPlanAction({
        contentItemId: deleteTarget.id,
      });
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      toast.success(res.message ?? "Content plan berhasil dihapus.");
      setDeleteTarget(null);
      setSelectedItem(null);
      invalidateCalendar();
      router.refresh();
    } catch {
      toast.error("Gagal menghapus Content Plan.");
    } finally {
      setIsDeleting(false);
    }
  };

  const tableColumns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("title", {
          header: "Konten",
          cell: (info) => {
            const row = info.row.original;
            return (
              <div className="min-w-[200px] max-w-[340px] space-y-0.5">
                <p className="truncate font-medium text-foreground">{row.title}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {row.projectCode ?? "UMUM"} ·{" "}
                  {CONTENT_FORMAT_META[row.contentFormat].label}
                  {row.campaignName ? ` · ${row.campaignName}` : ""}
                </p>
              </div>
            );
          },
        }),
        columnHelper.accessor("platform", {
          header: "Channel",
          cell: (info) => <ChannelPill platform={info.row.original.platform} />,
        }),
        columnHelper.accessor("contentPillar", {
          header: "Pilar",
          cell: (info) => (
            <span className="text-xs text-muted-foreground">
              {getPillarLabel(info.row.original.contentPillar)}
            </span>
          ),
        }),
        columnHelper.accessor("status", {
          header: "Status",
          cell: (info) => (
            <StatusBadge domain="content" value={info.row.original.status} />
          ),
        }),
        columnHelper.accessor("creatorName", {
          header: "Creator",
          cell: (info) => {
            const row = info.row.original;
            return (
              <div className="flex items-center gap-2">
                <CreativeAvatar
                  name={row.creatorName}
                  avatarUrl={row.creatorAvatarUrl}
                  size="sm"
                />
                <span className="text-xs font-medium text-foreground">
                  {row.creatorName}
                </span>
              </div>
            );
          },
        }),
        columnHelper.display({
          id: "designer",
          header: "Desain",
          cell: (info) => {
            const brief = info.row.original.designBrief;
            if (!info.row.original.requiresDesign) {
              return (
                <span className="text-[11px] text-muted-foreground">
                  Copy Only
                </span>
              );
            }
            return brief ? (
              <div className="space-y-0.5">
                <p className="text-xs">
                  {brief.assignedDesignerName ?? "Unassigned"}
                </p>
                <StatusBadge domain="design" value={brief.status} />
              </div>
            ) : (
              <span className="text-[11px] text-amber-700">No Brief</span>
            );
          },
        }),
        columnHelper.accessor("plannedPublishAt", {
          header: "Jadwal",
          cell: (info) => (
            <span className="font-mono text-xs tabular-nums text-foreground">
              {formatDateTimeId(info.row.original.plannedPublishAt)}
            </span>
          ),
        }),
        columnHelper.display({
          id: "actions",
          header: "",
          cell: (info) => (
            <Button
              type="button"
              size="xs"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                openQuickModal(info.row.original);
              }}
            >
              Kelola
            </Button>
          ),
        }),
      ]) as DataTableColumnDef<ContentPlanItemDTO>[],
    []
  );

  const periodLabel =
    filters.view === "calendar" && gridScale === "week"
      ? `${weekCells[0]?.shortLabel ?? ""} — ${weekCells[6]?.shortLabel ?? ""}`
      : filters.month === "ALL"
        ? "Semua Bulan"
        : formatMonthYearLabel(effectiveMonth);

  return (
    <div className="space-y-4">
      {/* Studio Calendar Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/90 p-3 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center rounded-xl border border-border/70 bg-background p-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handlePrevPeriod}
                aria-label="Periode sebelumnya"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="min-w-36 px-3 text-center text-sm font-semibold text-foreground">
                {periodLabel}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleNextPeriod}
                aria-label="Periode berikutnya"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTodayClick}
              className="rounded-xl"
            >
              Hari Ini
            </Button>

            {filters.view === "table" ? (
              <Button
                type="button"
                variant={filters.month === "ALL" ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  void setFilters({
                    month:
                      filters.month === "ALL" ? getCurrentMonthJakarta() : "ALL",
                  })
                }
                className="rounded-xl"
              >
                {filters.month === "ALL" ? "1 Bulan" : "Semua Bulan"}
              </Button>
            ) : null}

            {isFetching ? (
              <RefreshCw className="size-3.5 animate-spin text-muted-foreground" />
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Month / Week / Table Mode Switcher */}
            <div className="inline-flex rounded-xl border border-border/70 bg-muted/60 p-0.5">
              <Button
                type="button"
                size="sm"
                variant={
                  filters.view === "calendar" && gridScale === "month"
                    ? "secondary"
                    : "ghost"
                }
                onClick={() => {
                  setGridScale("month");
                  if (filters.month === "ALL") {
                    void setFilters({
                      view: "calendar",
                      month: getCurrentMonthJakarta(),
                    });
                  } else {
                    void setFilters({ view: "calendar" });
                  }
                }}
                className="gap-1.5 rounded-lg"
              >
                <CalendarIcon className="size-3.5" />
                <span>Bulan</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant={
                  filters.view === "calendar" && gridScale === "week"
                    ? "secondary"
                    : "ghost"
                }
                onClick={() => {
                  setGridScale("week");
                  setWeekMondayKey(
                    getMondayKeyForDate(
                      todayJakarta.startsWith(effectiveMonth)
                        ? todayJakarta
                        : `${effectiveMonth}-01`
                    )
                  );
                  if (filters.month === "ALL") {
                    void setFilters({
                      view: "calendar",
                      month: getCurrentMonthJakarta(),
                    });
                  } else {
                    void setFilters({ view: "calendar" });
                  }
                }}
                className="gap-1.5 rounded-lg"
              >
                <CalendarDays className="size-3.5" />
                <span>Minggu</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant={filters.view === "table" ? "secondary" : "ghost"}
                onClick={() => void setFilters({ view: "table" })}
                className="gap-1.5 rounded-lg"
              >
                <TableIcon className="size-3.5" />
                <span>Tabel</span>
              </Button>
            </div>

            {canManageContent ? (
              <Button
                type="button"
                onClick={() => setCreateDrawerOpen(true)}
                className="gap-1.5 rounded-xl"
              >
                <Plus className="size-4" />
                <span>Plan Baru</span>
              </Button>
            ) : null}
          </div>
        </div>

        {/* Compact Filter Row */}
        <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-2.5">
          <Select
            value={filters.platform}
            onValueChange={(v) => void setFilters({ platform: v ?? "ALL" })}
            items={[
              { value: "ALL", label: "Semua Channel" },
              ...SOCIAL_PLATFORM_VALUES.map((v) => ({
                value: v,
                label: SOCIAL_PLATFORM_META[v].label,
              })),
            ]}
          >
            <SelectTrigger className="h-8 w-40 min-w-0 overflow-hidden bg-background text-xs *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
              <SelectValue placeholder="Channel" className="block min-w-0 truncate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Channel</SelectItem>
              {SOCIAL_PLATFORM_VALUES.map((v) => (
                <SelectItem key={v} value={v}>
                  {SOCIAL_PLATFORM_META[v].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.status}
            onValueChange={(v) => void setFilters({ status: v ?? "ALL" })}
            items={[
              { value: "ALL", label: "Semua Status" },
              ...CONTENT_STATUS_VALUES.map((s) => ({
                value: s,
                label: CONTENT_STATUS_META[s].label,
              })),
            ]}
          >
            <SelectTrigger className="h-8 w-40 min-w-0 overflow-hidden bg-background text-xs *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
              <SelectValue placeholder="Status" className="block min-w-0 truncate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Status</SelectItem>
              {CONTENT_STATUS_VALUES.map((s) => (
                <SelectItem key={s} value={s}>
                  {CONTENT_STATUS_META[s].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.pillar}
            onValueChange={(v) => void setFilters({ pillar: v ?? "ALL" })}
            items={[
              { value: "ALL", label: "Semua Pilar" },
              ...CONTENT_PILLAR_OPTIONS.map((p) => ({
                value: p.value,
                label: p.label,
              })),
            ]}
          >
            <SelectTrigger className="h-8 w-36 min-w-0 overflow-hidden bg-background text-xs *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
              <SelectValue placeholder="Pilar" className="block min-w-0 truncate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Pilar</SelectItem>
              {CONTENT_PILLAR_OPTIONS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.creatorId}
            onValueChange={(v) => void setFilters({ creatorId: v ?? "ALL" })}
            items={[
              { value: "ALL", label: "Semua Creator" },
              ...creators.map((c) => ({
                value: c.id,
                label: c.fullName,
              })),
            ]}
          >
            <SelectTrigger className="h-8 w-44 min-w-0 overflow-hidden bg-background text-xs *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
              <SelectValue placeholder="Creator" className="block min-w-0 truncate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Creator</SelectItem>
              {creators.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="truncate">{c.fullName}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="h-8 gap-1 text-xs text-muted-foreground"
          >
            <RotateCcw className="size-3.5" />
            <span>Reset</span>
          </Button>

          <span className="ml-auto font-mono text-xs text-muted-foreground">
            {items.length} konten
          </span>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* Calendar Views: Month or Week Grid */}
      {filters.view === "calendar" ? (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card shadow-2xs">
            <div className="min-w-[820px]">
              {/* Day Headers */}
              <div className="grid grid-cols-7 border-b border-border/70 bg-muted/30">
                {WEEKDAY_HEADERS.map((day, idx) => {
                  const weekCell = gridScale === "week" ? weekCells[idx] : null;
                  const isTodayCol =
                    weekCell && weekCell.dateKey === todayJakarta;
                  return (
                    <div
                      key={day}
                      className="flex items-center justify-center gap-1.5 px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      <span>{day}</span>
                      {weekCell ? (
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 font-mono text-[10px] normal-case",
                            isTodayCol
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground"
                          )}
                        >
                          {weekCell.shortLabel}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>

              {/* Grid Cells */}
              <div className="grid grid-cols-7 divide-x divide-y divide-border/60">
                {(gridScale === "week" ? weekCells : calendarCells).map(
                  (cell) => {
                    const dayItems = itemsByDay.get(cell.dateKey) ?? [];
                    const isToday = cell.dateKey === todayJakarta;

                    return (
                      <div
                        key={cell.dateKey}
                        className={cn(
                          "p-2 transition-colors",
                          gridScale === "week"
                            ? "min-h-[340px]"
                            : "min-h-[132px]",
                          cell.inCurrentMonth
                            ? "bg-card"
                            : "bg-muted/20 text-muted-foreground/50",
                          isToday && "bg-primary/[0.02]"
                        )}
                      >
                        {gridScale === "month" ? (
                          <div className="mb-1.5 flex items-center justify-between">
                            <span
                              className={cn(
                                "inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                                isToday
                                  ? "bg-primary text-primary-foreground shadow-xs"
                                  : "text-foreground"
                              )}
                            >
                              {cell.dayNum}
                            </span>
                            {dayItems.length > 0 ? (
                              <span className="rounded-full bg-muted px-1.5 py-0.5 font-mono text-[9px] font-medium text-muted-foreground">
                                {dayItems.length}
                              </span>
                            ) : null}
                          </div>
                        ) : null}

                        <div className="space-y-1.5">
                          {dayItems.map((item) => {
                            const style = CHANNEL_VISUAL_STYLE[item.platform];
                            const pMeta = SOCIAL_PLATFORM_META[item.platform];
                            return (
                              <Tooltip key={item.id}>
                                <TooltipTrigger
                                  render={
                                    <button
                                      type="button"
                                      onClick={() => openQuickModal(item)}
                                      className={cn(
                                        "group/chip w-full rounded-lg border border-border/60 border-l-[3px] p-2 text-left shadow-2xs transition-all hover:border-primary/40 hover:shadow-xs",
                                        style.chipClass
                                      )}
                                    >
                                      <div className="flex items-center justify-between gap-1">
                                        <ChannelPill
                                          platform={item.platform}
                                          compact
                                        />
                                        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
                                          {formatTimeWib(item.plannedPublishAt)}
                                        </span>
                                      </div>

                                      <p
                                        className={cn(
                                          "mt-1 break-words font-medium leading-snug text-foreground",
                                          gridScale === "week"
                                            ? "line-clamp-3 text-xs"
                                            : "line-clamp-2 text-[11px]"
                                        )}
                                      >
                                        {item.title}
                                      </p>

                                      <div className="mt-1.5 flex items-center justify-between gap-1">
                                        <StatusBadge
                                          domain="content"
                                          value={item.status}
                                          className="h-4 px-1.5 text-[9px]"
                                        />
                                        {gridScale === "week" ? (
                                          <CreativeAvatar
                                            name={item.creatorName}
                                            avatarUrl={item.creatorAvatarUrl}
                                            size="sm"
                                            className="size-4"
                                          />
                                        ) : null}
                                      </div>
                                    </button>
                                  }
                                />

                                <TooltipContent
                                  side="top"
                                  sideOffset={6}
                                  className="max-w-xs flex-col items-start gap-1.5 rounded-xl p-3 text-left shadow-xl"
                                >
                                  <div className="flex w-full items-center justify-between gap-2">
                                    <span className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
                                      {pMeta.label} ·{" "}
                                      {CONTENT_FORMAT_META[item.contentFormat].label}
                                    </span>
                                    <span className="inline-flex items-center gap-1 font-mono text-[10px] opacity-85">
                                      <Clock className="size-2.5" />
                                      {formatTimeWib(item.plannedPublishAt)} WIB
                                    </span>
                                  </div>
                                  <p className="text-xs font-semibold leading-snug">
                                    {item.title}
                                  </p>
                                  <div className="flex items-center gap-2 text-[10px] opacity-80">
                                    <span>{item.projectCode ?? "UMUM"}</span>
                                    <span>·</span>
                                    <span>PIC: {item.creatorName}</span>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>

          {unscheduledItems.length > 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 bg-card/70 p-4">
              <div className="mb-2.5 flex items-center gap-2">
                <span className="text-xs font-semibold tracking-tight text-foreground">
                  Belum Dijadwalkan
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] font-semibold text-muted-foreground">
                  {unscheduledItems.length}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {unscheduledItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openQuickModal(item)}
                    className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-1.5 text-xs font-medium text-foreground shadow-2xs transition-all hover:border-primary/40 hover:bg-muted/60"
                  >
                    <ChannelPill platform={item.platform} compact />
                    <span className="max-w-xs truncate">{item.title}</span>
                    <StatusBadge domain="content" value={item.status} />
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        /* Editorial Table View */
        <DataTable
          columns={tableColumns}
          data={items}
          isLoading={isLoading}
          searchPlaceholder="Cari konten, kampanye, creator..."
          onRowClick={(row) => openQuickModal(row)}
          pagination={{ pageSize: 15 }}
          emptyState={
            <EmptyState
              icon={TableIcon}
              title="Belum ada konten"
              description="Ubah filter atau buat Content Plan baru."
            />
          }
        />
      )}

      {/* Quick Schedule & Publish Modal */}
      <Dialog
        open={Boolean(selectedItem)}
        onOpenChange={(open) => {
          if (!open) setSelectedItem(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          {selectedItem ? (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-1.5">
                  <ChannelPill platform={selectedItem.platform} />
                  <Badge variant="secondary">
                    {CONTENT_FORMAT_META[selectedItem.contentFormat].label}
                  </Badge>
                  <StatusBadge domain="content" value={selectedItem.status} />
                </div>
                <DialogTitle className="pt-1 break-words font-heading text-lg">
                  {selectedItem.title}
                </DialogTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">
                    {selectedItem.projectCode ?? "UMUM"}
                  </span>
                  <span>·</span>
                  <span>{selectedItem.creatorName}</span>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid gap-2.5 rounded-xl border border-border/70 bg-muted/30 p-3 text-xs sm:grid-cols-2">
                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground">
                      Design Status
                    </p>
                    {selectedItem.requiresDesign ? (
                      selectedItem.designBrief ? (
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <StatusBadge
                            domain="design"
                            value={selectedItem.designBrief.status}
                          />
                          <Link
                            href={`/design/workspace?briefId=${selectedItem.designBrief.id}`}
                            className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                          >
                            <Palette className="size-3" />
                            <span>Brief</span>
                          </Link>
                        </div>
                      ) : (
                        <p className="mt-1 text-amber-700">Belum ada brief</p>
                      )
                    ) : (
                      <p className="mt-1 text-muted-foreground">Copy Only</p>
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] font-medium text-muted-foreground">
                      Tasks
                    </p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {selectedItem.linkedTasks.length > 0 ? (
                        selectedItem.linkedTasks.map((t) => (
                          <Badge
                            key={t.id}
                            variant="outline"
                            className="font-mono text-[10px]"
                          >
                            {t.taskCode} · {t.status}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleQuickSave} className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="min-w-0 space-y-1.5">
                      <Label>Status Pipeline</Label>
                      {(() => {
                        const allowedQuickStatuses =
                          CONTENT_STATUS_VALUES.filter((s) => {
                            if (s === "IDEA" || s === "APPROVED_IDEA") {
                              return false;
                            }
                            if (
                              (s === "IN_DESIGN" ||
                                s === "DESIGN_REVIEW" ||
                                s === "DESIGN_REVISION") &&
                              s !== selectedItem.status
                            ) {
                              return false;
                            }
                            if (
                              selectedItem.status === "PUBLISHED" &&
                              !isAdminOrPm &&
                              s !== "PUBLISHED" &&
                              s !== "ARCHIVED"
                            ) {
                              return false;
                            }
                            return true;
                          });

                        return (
                          <Select
                            value={modalStatus}
                            onValueChange={(v) => {
                              if (v) setModalStatus(v as ContentStatus);
                            }}
                            disabled={!canManageContent}
                            items={allowedQuickStatuses.map((s) => ({
                              value: s,
                              label: CONTENT_STATUS_META[s].label,
                            }))}
                          >
                            <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                              <SelectValue placeholder="Pilih status" className="block min-w-0 truncate" />
                            </SelectTrigger>
                            <SelectContent>
                              {allowedQuickStatuses.map((s) => (
                                <SelectItem key={s} value={s}>
                                  {CONTENT_STATUS_META[s].label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        );
                      })()}
                    </div>

                    <div className="min-w-0 space-y-1.5">
                      <Label htmlFor="quick-publish-at">
                        Jadwal Tayang (WIB)
                      </Label>
                      <Input
                        id="quick-publish-at"
                        type="datetime-local"
                        value={modalPlannedLocal}
                        onChange={(e) => setModalPlannedLocal(e.target.value)}
                        disabled={
                          !canManageContent ||
                          (selectedItem.status === "PUBLISHED" && !isAdminOrPm)
                        }
                        className="w-full min-w-0 px-2.5 text-xs tabular-nums sm:text-[13px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="quick-caption">Caption</Label>
                    <Textarea
                      id="quick-caption"
                      rows={3}
                      value={modalCaption}
                      onChange={(e) => setModalCaption(e.target.value)}
                      disabled={!canManageContent}
                      placeholder="Caption minimal 10 karakter..."
                    />
                  </div>

                  {modalStatus === "PUBLISHED" || selectedItem.publishedUrl ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="quick-published-url">
                        Live Post URL (HTTPS) *
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="quick-published-url"
                          type="url"
                          value={modalPublishedUrl}
                          onChange={(e) => setModalPublishedUrl(e.target.value)}
                          disabled={!canManageContent}
                          required={modalStatus === "PUBLISHED"}
                          placeholder="https://www.instagram.com/p/..."
                        />
                        {selectedItem.publishedUrl ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() =>
                              window.open(
                                selectedItem.publishedUrl!,
                                "_blank",
                                "noopener,noreferrer"
                              )
                            }
                            aria-label="Buka tautan publikasi"
                          >
                            <ExternalLink className="size-4" />
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <DialogFooter className="flex-wrap justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {canManageContent ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const target = selectedItem;
                            setSelectedItem(null);
                            setEditingPlan(target);
                          }}
                        >
                          Edit Detail
                        </Button>
                      ) : null}
                      {canDeleteContent ? (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setDeleteTarget(selectedItem)}
                          disabled={isPending || isDeleting}
                          className="gap-1.5 border-rose-200 text-destructive hover:bg-rose-50 hover:text-destructive dark:border-rose-500/30 dark:hover:bg-rose-950/50"
                        >
                          <Trash2 className="size-3.5" />
                          <span>Hapus</span>
                        </Button>
                      ) : null}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setSelectedItem(null)}
                        disabled={isPending}
                      >
                        Tutup
                      </Button>
                      {canManageContent ? (
                        <Button type="submit" disabled={isPending}>
                          {isPending ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              <span>Menyimpan...</span>
                            </>
                          ) : modalStatus === "PUBLISHED" ? (
                            "Publish"
                          ) : (
                            "Simpan"
                          )}
                        </Button>
                      ) : null}
                    </div>
                  </DialogFooter>
                </form>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Drawer: Create / Edit Full Content Plan */}
      <ContentPlanFormDrawer
        open={createDrawerOpen || Boolean(editingPlan)}
        onOpenChange={(open) => {
          if (!open) {
            setCreateDrawerOpen(false);
            setEditingPlan(null);
          }
        }}
        projects={projects}
        creators={creators}
        designers={designers}
        currentUserId={currentUserId}
        editingItem={editingPlan}
        canDelete={canDeleteContent}
        onSuccess={() => {
          invalidateCalendar();
          router.refresh();
        }}
      />

      {/* Confirm Delete Content Plan Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Hapus Content Plan?"
        description={`Content Plan "${deleteTarget?.title ?? ""}" akan dihapus. Task produksi terkait akan dilepas sebagai task umum (tidak ikut terhapus), dan Design Brief yang ada tetap tersimpan terpisah.`}
        confirmLabel="Hapus Content Plan"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
