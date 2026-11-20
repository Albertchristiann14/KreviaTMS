"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowUpRight,
  Briefcase,
  FolderKanban,
  UserCheck,
  Users,
} from "lucide-react";
import {
  createDataTableColumnHelper,
  DataTable,
  type DataTableColumnDef,
} from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TeamDirectoryMemberDTO } from "@/features/team-kpi/types";
import {
  getInitials,
  ROLE_DISPLAY_META,
} from "@/features/team-kpi/utils/kpi-ui";
import type { RoleCode } from "@/lib/constants/permissions";
import { cn } from "@/lib/utils";

export interface TeamDirectoryTableProps {
  members: TeamDirectoryMemberDTO[];
  departments: string[];
  roles: Array<{ id: string; code: RoleCode; name: string }>;
  canReadWorkload: boolean;
  currentUserId: string;
}

const columnHelper = createDataTableColumnHelper<TeamDirectoryMemberDTO>();

export function TeamDirectoryTable({
  members,
  departments,
  roles,
  canReadWorkload,
  currentUserId,
}: TeamDirectoryTableProps) {
  const router = useRouter();
  const [selectedDept, setSelectedDept] = useState<string>("ALL");
  const [selectedRole, setSelectedRole] = useState<string>("ALL");
  const [showInactive, setShowInactive] = useState<boolean>(false);

  const deptSelectItems = useMemo<Record<string, string>>(
    () => ({
      ALL: "Semua Divisi",
      ...Object.fromEntries(departments.map((dept) => [dept, dept])),
    }),
    [departments]
  );

  const roleSelectItems = useMemo<Record<string, string>>(
    () => ({
      ALL: "Semua Peran",
      ...Object.fromEntries(
        roles.map((r) => [r.code, ROLE_DISPLAY_META[r.code]?.label ?? r.name])
      ),
    }),
    [roles]
  );

  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      if (!showInactive && !m.isActive) return false;
      if (selectedDept !== "ALL" && m.department !== selectedDept) return false;
      if (selectedRole !== "ALL" && m.roleCode !== selectedRole) return false;
      return true;
    });
  }, [members, selectedDept, selectedRole, showInactive]);

  const activeCount = useMemo(
    () => members.filter((m) => m.isActive).length,
    [members]
  );

  const totalOverdueAcrossTeam = useMemo(() => {
    if (!canReadWorkload) return null;
    return members
      .filter((m) => m.isActive)
      .reduce((sum, m) => sum + (m.overdueTasksCount ?? 0), 0);
  }, [members, canReadWorkload]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = useMemo<DataTableColumnDef<TeamDirectoryMemberDTO, any>[]>(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cols: DataTableColumnDef<TeamDirectoryMemberDTO, any>[] = [
      columnHelper.accessor("fullName", {
        header: "Anggota",
        cell: (info) => {
          const row = info.row.original;
          const isSelf = row.id === currentUserId;
          return (
            <div className="flex items-center gap-3 py-0.5">
              <Avatar className="ring-1 ring-border/60">
                {row.avatarUrl ? (
                  <AvatarImage src={row.avatarUrl} alt={row.fullName} />
                ) : null}
                <AvatarFallback className="text-xs font-semibold">
                  {getInitials(row.fullName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate font-medium text-foreground">
                    {row.fullName}
                  </span>
                  {isSelf ? (
                    <Badge
                      variant="secondary"
                      className="text-[10px] font-medium"
                    >
                      Anda
                    </Badge>
                  ) : null}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {row.email}
                </p>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor("jobTitle", {
        header: "Jabatan & Divisi",
        cell: (info) => {
          const row = info.row.original;
          return (
            <div className="space-y-0.5 text-xs">
              <p className="font-medium text-foreground">{row.jobTitle}</p>
              <p className="text-muted-foreground">{row.department}</p>
            </div>
          );
        },
      }),
      columnHelper.accessor("roleCode", {
        header: "Peran",
        cell: (info) => {
          const code = info.row.original.roleCode;
          const meta = ROLE_DISPLAY_META[code];
          return (
            <Badge
              variant="outline"
              className={cn("font-mono text-[11px]", meta?.badgeClass)}
            >
              {meta?.label ?? code}
            </Badge>
          );
        },
      }),
      columnHelper.accessor("activeProjectsCount", {
        header: "Proyek",
        cell: (info) => (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs tabular-nums text-foreground">
            <FolderKanban
              className="size-3.5 text-muted-foreground"
              aria-hidden="true"
            />
            {info.row.original.activeProjectsCount}
          </span>
        ),
      }),
    ];

    if (canReadWorkload) {
      cols.push(
        columnHelper.accessor("activeTasksCount", {
          header: "Beban Kerja",
          cell: (info) => {
            const row = info.row.original;
            const active = row.activeTasksCount ?? 0;
            const overdue = row.overdueTasksCount ?? 0;
            return (
              <div className="flex items-center gap-1.5">
                <Badge variant="secondary" className="font-mono text-[11px]">
                  {active} aktif
                </Badge>
                {overdue > 0 ? (
                  <Badge
                    variant="outline"
                    className="border-rose-500/25 bg-rose-500/10 font-mono text-[11px] text-rose-700 dark:text-rose-300"
                  >
                    {overdue} late
                  </Badge>
                ) : null}
              </div>
            );
          },
        })
      );
    }

    cols.push(
      columnHelper.accessor("isActive", {
        header: "Status",
        cell: (info) => {
          const active = info.row.original.isActive;
          return (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium">
              <span
                className={cn(
                  "size-2 rounded-full",
                  active ? "bg-emerald-500" : "bg-slate-400"
                )}
              />
              <span
                className={active ? "text-foreground" : "text-muted-foreground"}
              >
                {active ? "Aktif" : "Nonaktif"}
              </span>
            </span>
          );
        },
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: (info) => {
          const row = info.row.original;
          const canOpenProfile = canReadWorkload || row.id === currentUserId;
          if (!canOpenProfile) {
            return null;
          }
          return (
            <div className="flex justify-end">
              <Link
                href={`/team/${row.id}`}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  buttonVariants({ variant: "ghost", size: "xs" }),
                  "gap-1 text-muted-foreground hover:text-foreground"
                )}
              >
                <span>Performa</span>
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
          );
        },
      })
    );

    return cols;
  }, [canReadWorkload, currentUserId]);

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card size="sm">
          <CardContent className="flex items-center justify-between pt-3">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">
                Anggota Aktif
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tabular-nums">
                {activeCount}
              </p>
            </div>
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Users className="size-4" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardContent className="flex items-center justify-between pt-3">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">
                Divisi
              </p>
              <p className="mt-1 font-mono text-2xl font-bold tabular-nums">
                {departments.length}
              </p>
            </div>
            <div className="flex size-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Briefcase className="size-4" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        <Card size="sm">
          <CardContent className="flex items-center justify-between pt-3">
            <div>
              <p className="text-[11px] font-medium text-muted-foreground">
                Rapor Pribadi
              </p>
              <Link
                href={`/team/${currentUserId}`}
                className="mt-1 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                <span>Performa Saya</span>
                <ArrowUpRight className="size-3.5" aria-hidden="true" />
              </Link>
            </div>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserCheck className="size-4" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        {canReadWorkload ? (
          <Card size="sm">
            <CardContent className="flex items-center justify-between pt-3">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">
                  Task Overdue
                </p>
                <p
                  className={cn(
                    "mt-1 font-mono text-2xl font-bold tabular-nums",
                    (totalOverdueAcrossTeam ?? 0) > 0
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-emerald-600 dark:text-emerald-400"
                  )}
                >
                  {totalOverdueAcrossTeam ?? 0}
                </p>
              </div>
              <div className="flex size-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <AlertCircle className="size-4" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <DataTable
        columns={columns}
        data={filteredMembers}
        searchPlaceholder="Cari nama, email, jabatan..."
        pagination={{ pageSize: 12 }}
        onRowClick={(row) => {
          if (canReadWorkload || row.id === currentUserId) {
            router.push(`/team/${row.id}`);
          }
        }}
        emptyState={
          <EmptyState
            icon={Users}
            title="Tidak ada anggota yang cocok"
            className="py-10"
          />
        }
        toolbarSlot={
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={selectedDept}
              items={deptSelectItems}
              onValueChange={(val) => {
                if (val) setSelectedDept(val);
              }}
            >
              <SelectTrigger
                className="w-40 min-w-0 overflow-hidden bg-card *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate"
                aria-label="Filter divisi"
              >
                <SelectValue placeholder="Semua Divisi" className="block min-w-0 truncate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Divisi</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedRole}
              items={roleSelectItems}
              onValueChange={(val) => {
                if (val) setSelectedRole(val);
              }}
            >
              <SelectTrigger
                className="w-40 min-w-0 overflow-hidden bg-card *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate"
                aria-label="Filter peran"
              >
                <SelectValue placeholder="Semua Peran" className="block min-w-0 truncate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Peran</SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.code}>
                    {ROLE_DISPLAY_META[r.code]?.label ?? r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground">
              <Checkbox
                checked={showInactive}
                onCheckedChange={(checked) => setShowInactive(Boolean(checked))}
              />
              <span>Nonaktif</span>
            </Label>
          </div>
        }
      />
    </div>
  );
}
