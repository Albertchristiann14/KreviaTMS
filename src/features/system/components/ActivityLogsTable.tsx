"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  Eye,
  RotateCcw,
  ScrollText,
  Shield,
} from "lucide-react";
import {
  createDataTableColumnHelper,
  DataTable,
  type DataTableColumnDef,
} from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  ActivityLogActorOptionDTO,
  ActivityLogRowDTO,
  ActivityLogsPageResult,
  AuditModule,
} from "@/features/system/types";
import { cn } from "@/lib/utils";

const ROLE_NAME_MAP: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  PROJECT_MANAGER: "Project Manager",
  STAFF_CREATOR: "Staff / Creator",
  DESIGNER: "Designer",
};

const columnHelper = createDataTableColumnHelper<ActivityLogRowDTO>();

const MODULE_BADGE_CLASS: Record<AuditModule, string> = {
  TASKS: "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  TEAM_KPI:
    "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  SOCIAL_DESIGN:
    "border-violet-500/25 bg-violet-500/10 text-violet-700 dark:text-violet-300",
  SYSTEM:
    "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
};

const MODULE_OPTION_LABELS: Record<string, string> = {
  ALL: "Semua Modul",
  TASKS: "TASKS",
  TEAM_KPI: "TEAM_KPI",
  SOCIAL_DESIGN: "SOCIAL_DESIGN",
  SYSTEM: "SYSTEM",
};

function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(iso));
}

function formatJsonValue(value: unknown): string {
  if (value === undefined) return "—";
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

interface DiffEntry {
  key: string;
  oldVal: unknown;
  newVal: unknown;
  status: "ADDED" | "REMOVED" | "CHANGED" | "UNCHANGED";
}

function buildDiffEntries(
  oldValues: Record<string, unknown> | null,
  newValues: Record<string, unknown> | null
): DiffEntry[] {
  const keys = Array.from(
    new Set([
      ...Object.keys(oldValues ?? {}),
      ...Object.keys(newValues ?? {}),
    ])
  ).sort();

  return keys.map((key) => {
    const hasOld = Boolean(oldValues && key in oldValues);
    const hasNew = Boolean(newValues && key in newValues);
    const oldVal = hasOld ? oldValues![key] : undefined;
    const newVal = hasNew ? newValues![key] : undefined;

    let status: DiffEntry["status"] = "UNCHANGED";
    if (!hasOld && hasNew) status = "ADDED";
    else if (hasOld && !hasNew) status = "REMOVED";
    else if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      status = "CHANGED";
    }

    return { key, oldVal, newVal, status };
  });
}

export interface ActivityLogsTableProps {
  initialData: ActivityLogsPageResult;
  actors: ActivityLogActorOptionDTO[];
  entityTypes: string[];
  allowedModules: AuditModule[];
  isSuperAdmin: boolean;
}

export function ActivityLogsTable({
  initialData,
  actors,
  entityTypes,
  allowedModules,
  isSuperAdmin,
}: ActivityLogsTableProps) {
  const [moduleFilter, setModuleFilter] = useState<string>("ALL");
  const [actorFilter, setActorFilter] = useState<string>("ALL");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>("ALL");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState<number>(1);
  const [selectedLog, setSelectedLog] = useState<ActivityLogRowDTO | null>(null);

  const isDefaultQuery =
    page === 1 &&
    moduleFilter === "ALL" &&
    actorFilter === "ALL" &&
    entityTypeFilter === "ALL" &&
    fromDate === "" &&
    toDate === "" &&
    searchQuery.trim() === "";

  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (moduleFilter !== "ALL") params.set("module", moduleFilter);
    if (actorFilter !== "ALL") params.set("actorId", actorFilter);
    if (entityTypeFilter !== "ALL") params.set("entityType", entityTypeFilter);
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    return params.toString();
  }, [
    page,
    moduleFilter,
    actorFilter,
    entityTypeFilter,
    fromDate,
    toDate,
    searchQuery,
  ]);

  const logsQuery = useQuery({
    queryKey: ["activity-logs", queryParams],
    queryFn: async () => {
      const res = await fetch(`/api/activity-logs?${queryParams}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(body?.error ?? "Gagal memuat activity logs.");
      }
      return (await res.json()) as ActivityLogsPageResult;
    },
    initialData: isDefaultQuery ? initialData : undefined,
  });

  const activeData = logsQuery.data ?? initialData;

  const csvExportHref = useMemo(() => {
    const params = new URLSearchParams(queryParams);
    params.delete("page");
    params.delete("limit");
    params.set("format", "csv");
    return `/api/activity-logs?${params.toString()}`;
  }, [queryParams]);

  const moduleSelectItems: Record<string, string> = useMemo(
    () => ({
      ALL: isSuperAdmin ? "Semua Modul" : "Modul Operasional",
      ...Object.fromEntries(
        allowedModules.map((m) => [m, MODULE_OPTION_LABELS[m] ?? m])
      ),
    }),
    [allowedModules, isSuperAdmin]
  );

  const actorSelectItems: Record<string, string> = useMemo(
    () => ({
      ALL: "Semua Aktor",
      SYSTEM_ACTOR: "System / Cron",
      ...Object.fromEntries(
        actors.map((a) => [
          a.id,
          `${a.fullName} · ${ROLE_NAME_MAP[a.roleCode] ?? a.roleCode}`,
        ])
      ),
    }),
    [actors]
  );

  const entitySelectItems: Record<string, string> = useMemo(
    () => ({
      ALL: "Semua Entitas",
      ...Object.fromEntries(entityTypes.map((et) => [et, et])),
    }),
    [entityTypes]
  );

  const handleResetFilters = () => {
    setModuleFilter("ALL");
    setActorFilter("ALL");
    setEntityTypeFilter("ALL");
    setFromDate("");
    setToDate("");
    setSearchQuery("");
    setPage(1);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: DataTableColumnDef<ActivityLogRowDTO, any>[] = [
    columnHelper.accessor("createdAt", {
      header: "Waktu",
      cell: ({ row }) => (
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {formatDateTime(row.original.createdAt)}
        </span>
      ),
    }),
    columnHelper.accessor((row) => row.actor?.name ?? "Sistem", {
      id: "actor",
      header: "Aktor",
      cell: ({ row }) => {
        const actor = row.original.actor;
        if (!actor) {
          return (
            <Badge variant="outline" className="font-mono text-[10px]">
              SYSTEM
            </Badge>
          );
        }
        return (
          <div className="text-xs">
            <p className="font-medium text-foreground">{actor.name}</p>
            <p className="font-mono text-[10px] text-muted-foreground">
              {actor.role}
            </p>
          </div>
        );
      },
    }),
    columnHelper.accessor("module", {
      header: "Modul",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            "font-mono text-[10px]",
            MODULE_BADGE_CLASS[row.original.module] ?? ""
          )}
        >
          {row.original.module}
        </Badge>
      ),
    }),
    columnHelper.accessor("action", {
      header: "Aksi",
      cell: ({ row }) => (
        <div className="space-y-0.5">
          <code className="block font-mono text-[11px] font-semibold text-foreground">
            {row.original.action}
          </code>
          <span className="text-[11px] text-muted-foreground">
            {row.original.entityType}
            {row.original.entityId
              ? ` · ${row.original.entityId.slice(0, 8)}`
              : ""}
          </span>
        </div>
      ),
    }),
    columnHelper.accessor("summary", {
      header: "Ringkasan",
      cell: ({ row }) => (
        <p className="max-w-md whitespace-normal text-xs leading-relaxed text-foreground/90">
          {row.original.summary}
        </p>
      ),
    }),
    columnHelper.display({
      id: "diff",
      header: "",
      cell: ({ row }) => (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => setSelectedLog(row.original)}
            className="gap-1 text-muted-foreground hover:text-foreground"
          >
            <Eye className="size-3.5" />
            <span>Diff</span>
          </Button>
        </div>
      ),
    }),
  ];

  const diffEntries = useMemo(
    () =>
      selectedLog
        ? buildDiffEntries(selectedLog.oldValues, selectedLog.newValues)
        : [],
    [selectedLog]
  );

  return (
    <div className="space-y-4">
      {!isSuperAdmin ? (
        <div className="flex items-center gap-2 rounded-xl border border-blue-500/25 bg-blue-500/8 px-3.5 py-2 text-xs text-blue-700 dark:text-blue-300">
          <Shield className="size-4 shrink-0" />
          <span>
            Cakupan Project Manager: modul TASKS, TEAM_KPI, dan SOCIAL_DESIGN.
          </span>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={activeData.items}
        searchPlaceholder="Cari ringkasan, aksi, aktor..."
        searchValue={searchQuery}
        onSearchChange={(val) => {
          setSearchQuery(val);
          setPage(1);
        }}
        isLoading={logsQuery.isFetching && !logsQuery.data}
        pagination={{
          page: activeData.meta.page,
          limit: activeData.meta.limit,
          totalItems: activeData.meta.totalItems,
          totalPages: activeData.meta.totalPages,
          onPageChange: setPage,
        }}
        toolbarSlot={
          <>
            <Select
              value={moduleFilter}
              onValueChange={(val) => {
                if (val !== null) {
                  setModuleFilter(val);
                  setPage(1);
                }
              }}
              items={moduleSelectItems}
            >
              <SelectTrigger className="w-40 min-w-0 overflow-hidden bg-card *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                <SelectValue placeholder="Modul" className="block min-w-0 truncate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  {isSuperAdmin ? "Semua Modul" : "Modul Operasional"}
                </SelectItem>
                {allowedModules.map((mod) => (
                  <SelectItem key={mod} value={mod}>
                    {MODULE_OPTION_LABELS[mod] ?? mod}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={actorFilter}
              onValueChange={(val) => {
                if (val !== null) {
                  setActorFilter(val);
                  setPage(1);
                }
              }}
              items={actorSelectItems}
            >
              <SelectTrigger className="w-40 min-w-0 overflow-hidden bg-card *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                <SelectValue placeholder="Aktor" className="block min-w-0 truncate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Aktor</SelectItem>
                <SelectItem value="SYSTEM_ACTOR">System / Cron</SelectItem>
                {actors.map((actor) => (
                  <SelectItem key={actor.id} value={actor.id}>
                    <span className="truncate">
                      {actor.fullName} ({actor.roleCode})
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={entityTypeFilter}
              onValueChange={(val) => {
                if (val !== null) {
                  setEntityTypeFilter(val);
                  setPage(1);
                }
              }}
              items={entitySelectItems}
            >
              <SelectTrigger className="w-36 min-w-0 overflow-hidden bg-card *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                <SelectValue placeholder="Entitas" className="block min-w-0 truncate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Entitas</SelectItem>
                {entityTypes.map((et) => (
                  <SelectItem key={et} value={et}>
                    <span className="truncate">{et}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              aria-label="Dari tanggal"
              className="w-36 bg-card text-xs"
            />
            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              aria-label="Sampai tanggal"
              className="w-36 bg-card text-xs"
            />

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="gap-1 text-muted-foreground"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset</span>
            </Button>

            <a
              href={csvExportHref}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5"
              )}
            >
              <Download className="size-3.5" />
              <span>CSV</span>
            </a>
          </>
        }
        emptyState={
          <EmptyState
            icon={ScrollText}
            title="Belum ada log yang cocok"
            className="py-10"
          />
        }
      />

      {/* JSONB Old vs New Diff Modal */}
      <Dialog
        open={Boolean(selectedLog)}
        onOpenChange={(open) => {
          if (!open) setSelectedLog(null);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Diff</DialogTitle>
            <DialogDescription>
              <code className="font-mono font-semibold text-foreground">
                {selectedLog?.action}
              </code>
            </DialogDescription>
          </DialogHeader>

          {selectedLog ? (
            <div className="space-y-4">
              <div className="grid gap-2 rounded-xl border border-border/70 bg-muted/30 p-3 text-xs break-words sm:grid-cols-2">
                <div className="min-w-0">
                  <span className="text-muted-foreground">Waktu: </span>
                  <span className="font-mono font-medium">
                    {formatDateTime(selectedLog.createdAt)}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-muted-foreground">Aktor: </span>
                  <span className="font-medium">
                    {selectedLog.actor
                      ? `${selectedLog.actor.name} · ${
                          ROLE_NAME_MAP[selectedLog.actor.role] ?? selectedLog.actor.role
                        }`
                      : "SYSTEM"}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-muted-foreground">Modul: </span>
                  <span className="font-mono font-medium">
                    {selectedLog.module}
                  </span>
                </div>
                <div className="min-w-0">
                  <span className="text-muted-foreground">Entitas: </span>
                  <span className="font-mono">
                    {selectedLog.entityType}
                    {selectedLog.entityId ? ` (${selectedLog.entityId})` : ""}
                  </span>
                </div>
                {selectedLog.ipAddress ? (
                  <div className="min-w-0">
                    <span className="text-muted-foreground">IP: </span>
                    <span className="font-mono">{selectedLog.ipAddress}</span>
                  </div>
                ) : null}
                <div className="min-w-0 sm:col-span-2">
                  <span className="text-muted-foreground">Ringkasan: </span>
                  <span className="font-medium text-foreground">
                    {selectedLog.summary}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                  Perbandingan Field
                </p>
                {diffEntries.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                    Tidak ada perubahan field tercatat.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-border/70">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-xs">Field</TableHead>
                          <TableHead className="text-xs">Old</TableHead>
                          <TableHead className="text-xs">New</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {diffEntries.map((entry) => (
                          <TableRow key={entry.key}>
                            <TableCell className="font-mono text-xs font-semibold">
                              {entry.key}
                            </TableCell>
                            <TableCell className="max-w-44 whitespace-normal break-all font-mono text-xs text-muted-foreground">
                              {formatJsonValue(entry.oldVal)}
                            </TableCell>
                            <TableCell className="max-w-44 whitespace-normal break-all font-mono text-xs text-foreground">
                              {formatJsonValue(entry.newVal)}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={
                                  entry.status === "ADDED"
                                    ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                                    : entry.status === "REMOVED"
                                      ? "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300"
                                      : entry.status === "CHANGED"
                                        ? "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                                        : "border-border bg-muted/50 text-muted-foreground"
                                }
                              >
                                {entry.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>

              {(selectedLog.oldValues || selectedLog.newValues) && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                      oldValues
                    </p>
                    <pre className="max-h-40 overflow-auto rounded-xl border border-border/60 bg-muted/30 p-2.5 font-mono text-[11px]">
                      {JSON.stringify(selectedLog.oldValues, null, 2) ?? "null"}
                    </pre>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold text-muted-foreground uppercase">
                      newValues
                    </p>
                    <pre className="max-h-40 overflow-auto rounded-xl border border-border/60 bg-muted/30 p-2.5 font-mono text-[11px]">
                      {JSON.stringify(selectedLog.newValues, null, 2) ?? "null"}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
