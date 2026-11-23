"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Edit3,
  KeyRound,
  MoreHorizontal,
  Plus,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  createDataTableColumnHelper,
  DataTable,
  type DataTableColumnDef,
} from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  deleteUserAction,
  updateUserAction,
} from "@/features/system/actions/user.actions";
import { ResetPasswordDialog } from "@/features/system/components/ResetPasswordDialog";
import { UserFormDialog } from "@/features/system/components/UserFormDialog";
import type {
  ManagerOptionDTO,
  RoleOptionDTO,
  SystemUserRowDTO,
  UsersManagementPageData,
} from "@/features/system/types";
import type { RoleCode } from "@/lib/constants/permissions";
import { cn } from "@/lib/utils";

const columnHelper = createDataTableColumnHelper<SystemUserRowDTO>();

const ROLE_BADGE_STYLES: Record<RoleCode, string> = {
  SUPER_ADMIN:
    "border-purple-300 bg-purple-50 text-purple-800 dark:border-purple-500/40 dark:bg-purple-500/15 dark:text-purple-200",
  PROJECT_MANAGER:
    "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-200",
  STAFF_CREATOR:
    "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200",
  DESIGNER:
    "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200",
};

const ROLE_SHORT_LABELS: Record<RoleCode, string> = {
  SUPER_ADMIN: "Super Admin",
  PROJECT_MANAGER: "Project Manager",
  STAFF_CREATOR: "Staff / Creator",
  DESIGNER: "Designer",
};

function getInitials(name: string): string {
  const clean = name.replace(/[()[\]{}_.,/\\-]/g, " ").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "KT";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "Belum login";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export interface UsersDataTableProps {
  initialData: UsersManagementPageData;
  currentUserId: string;
}

export function UsersDataTable({
  initialData,
  currentUserId,
}: UsersDataTableProps) {
  const router = useRouter();
  const [roleFilter, setRoleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUserRowDTO | null>(null);
  const [resetUser, setResetUser] = useState<SystemUserRowDTO | null>(null);
  const [toggleTarget, setToggleTarget] = useState<SystemUserRowDTO | null>(
    null
  );
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SystemUserRowDTO | null>(
    null
  );
  const [isDeletingUser, setIsDeletingUser] = useState(false);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return initialData.users.filter((u) => {
      if (roleFilter !== "ALL" && u.role.code !== roleFilter) return false;
      if (statusFilter === "ACTIVE" && !u.isActive) return false;
      if (statusFilter === "INACTIVE" && u.isActive) return false;
      if (q) {
        const hay =
          `${u.fullName} ${u.email} ${u.jobTitle} ${u.department} ${u.role.name} ${u.manager?.fullName ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [initialData.users, roleFilter, statusFilter, searchQuery]);

  const roleFilterItems: Record<string, string> = useMemo(
    () => ({
      ALL: "Semua Peran",
      ...Object.fromEntries(initialData.roles.map((r) => [r.code, r.name])),
    }),
    [initialData.roles]
  );

  const statusFilterItems: Record<string, string> = {
    ALL: "Semua Status",
    ACTIVE: "Aktif",
    INACTIVE: "Nonaktif",
  };

  const handleConfirmToggleActive = async () => {
    if (!toggleTarget) return;
    setIsTogglingStatus(true);
    try {
      const nextActive = !toggleTarget.isActive;
      const res = await updateUserAction({
        userId: toggleTarget.id,
        fullName: toggleTarget.fullName,
        displayName: toggleTarget.displayName,
        roleId: toggleTarget.role.id,
        jobTitle: toggleTarget.jobTitle,
        department: toggleTarget.department,
        employmentStatus: toggleTarget.employmentStatus,
        phone: toggleTarget.phone,
        managerId: toggleTarget.manager?.id ?? "",
        isActive: nextActive,
      });

      if (!res.success) {
        toast.error(res.error.message);
        return;
      }

      toast.success(res.message ?? "Status akun diperbarui.");
      if (res.data.activeTasksWarning.length > 0) {
        const taskCodes = res.data.activeTasksWarning
          .slice(0, 4)
          .map((t) => t.taskCode)
          .join(", ");
        toast.warning(
          `Reassignment diperlukan: ${toggleTarget.fullName} masih memiliki ${res.data.activeTasksWarning.length} task aktif (${taskCodes}).`
        );
      }

      setToggleTarget(null);
      router.refresh();
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteTarget) return;
    setIsDeletingUser(true);
    try {
      const res = await deleteUserAction({ userId: deleteTarget.id });
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }

      toast.success(res.message ?? "Akun pengguna berhasil dihapus.");
      if (res.data.activeTasksWarning.length > 0) {
        const taskCodes = res.data.activeTasksWarning
          .slice(0, 4)
          .map((t) => t.taskCode)
          .join(", ");
        toast.warning(
          `Reassignment diperlukan: ${deleteTarget.fullName} masih memiliki ${res.data.activeTasksWarning.length} task aktif (${taskCodes}).`
        );
      }

      setDeleteTarget(null);
      router.refresh();
    } finally {
      setIsDeletingUser(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: DataTableColumnDef<SystemUserRowDTO, any>[] = [
    columnHelper.accessor("fullName", {
      header: "Anggota",
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div className="flex items-center gap-3 py-0.5">
            <Avatar
              size="sm"
              className="ring-2 ring-slate-200 dark:ring-slate-700"
            >
              {u.avatarUrl ? (
                <AvatarImage src={u.avatarUrl} alt={u.fullName} />
              ) : null}
              <AvatarFallback className="bg-slate-100 text-[11px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                {getInitials(u.fullName)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="truncate font-bold text-slate-900 dark:text-white">
                  {u.fullName}
                </span>
                {u.id === currentUserId ? (
                  <Badge
                    variant="secondary"
                    className="border border-blue-200 bg-blue-50 text-[10px] font-bold text-blue-700 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-300"
                  >
                    Anda
                  </Badge>
                ) : null}
                {u.mustChangePassword ? (
                  <Badge
                    variant="outline"
                    className="border-amber-300 bg-amber-50 text-[10px] font-bold text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300"
                  >
                    Temp Pass
                  </Badge>
                ) : null}
              </div>
              <p className="truncate font-mono text-[11px] font-medium text-slate-600 dark:text-slate-300">
                {u.email}
              </p>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor((row) => row.role.code, {
      id: "roleCode",
      header: "Peran",
      cell: ({ row }) => {
        const { role } = row.original;
        return (
          <Badge
            variant="outline"
            className={cn(
              "text-[11px] font-bold",
              ROLE_BADGE_STYLES[role.code] ?? ""
            )}
          >
            {ROLE_SHORT_LABELS[role.code] ?? role.name}
          </Badge>
        );
      },
    }),
    columnHelper.accessor("jobTitle", {
      header: "Jabatan & Divisi",
      cell: ({ row }) => (
        <div className="max-w-[200px] space-y-0.5 text-xs">
          <p className="truncate font-bold text-slate-900 dark:text-white">
            {row.original.jobTitle}
          </p>
          <p className="truncate font-medium text-slate-600 dark:text-slate-300">
            {row.original.department}
          </p>
        </div>
      ),
    }),
    columnHelper.accessor((row) => row.manager?.fullName ?? "", {
      id: "manager",
      header: "Manager",
      cell: ({ row }) => {
        const mgr = row.original.manager;
        if (!mgr) {
          return (
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              —
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 py-0.5 pr-2.5 pl-1 text-xs font-semibold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <span className="flex size-5 items-center justify-center rounded-full bg-white font-mono text-[9px] font-extrabold text-slate-800 ring-1 ring-slate-300 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700">
              {getInitials(mgr.fullName)}
            </span>
            <span className="max-w-28 truncate">{mgr.fullName}</span>
          </span>
        );
      },
    }),
    columnHelper.accessor("isActive", {
      header: "Status",
      cell: ({ row }) =>
        row.original.isActive ? (
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300">
            <span className="size-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
            <span>Aktif</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
            <span className="size-2 rounded-full bg-slate-400" />
            <span>Nonaktif</span>
          </span>
        ),
    }),
    columnHelper.accessor("activeTaskCount", {
      header: "Tasks",
      cell: ({ row }) => (
        <Badge
          variant="outline"
          className={cn(
            "font-mono text-[11px] font-bold tabular-nums",
            row.original.activeTaskCount > 0
              ? "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300"
              : "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          )}
        >
          {row.original.activeTaskCount}
        </Badge>
      ),
    }),
    columnHelper.accessor("lastLoginAt", {
      header: "Login Terakhir",
      cell: ({ row }) => (
        <span className="font-mono text-xs font-medium text-slate-600 dark:text-slate-300">
          {formatDateTime(row.original.lastLoginAt)}
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      header: "",
      cell: ({ row }) => {
        const u = row.original;
        const isSelf = u.id === currentUserId;
        return (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label={`Aksi untuk ${u.fullName}`}
                    className="rounded-lg border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  />
                }
              >
                <MoreHorizontal className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => {
                    setEditingUser(u);
                    setFormOpen(true);
                  }}
                >
                  <Edit3 className="size-3.5" />
                  <span>Edit Profil &amp; Peran</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setResetUser(u)}>
                  <KeyRound className="size-3.5" />
                  <span>Reset Kata Sandi</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled={isSelf}
                  variant={u.isActive ? "destructive" : "default"}
                  onClick={() => setToggleTarget(u)}
                >
                  {u.isActive ? (
                    <>
                      <UserX className="size-3.5" />
                      <span>Nonaktifkan Akun</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="size-3.5" />
                      <span>Aktifkan Akun</span>
                    </>
                  )}
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={isSelf}
                  variant="destructive"
                  onClick={() => setDeleteTarget(u)}
                >
                  <Trash2 className="size-3.5" />
                  <span>Hapus Akun</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      },
    }),
  ];

  const roles: RoleOptionDTO[] = initialData.roles;
  const managers: ManagerOptionDTO[] = initialData.managers;

  return (
    <div className="space-y-5">
      {/* KPI Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border-slate-200 bg-white shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Total Akun
              </p>
              <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {initialData.summary.total}
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-400">
              <Users className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200 bg-white shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Aktif
              </p>
              <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums text-emerald-700 dark:text-emerald-400">
                {initialData.summary.active}
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400">
              <UserCheck className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200 bg-white shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Nonaktif
              </p>
              <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums text-slate-700 dark:text-slate-300">
                {initialData.summary.inactive}
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              <UserX className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200 bg-white shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="flex items-center justify-between p-4">
            <div>
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Temp Password
              </p>
              <p className="mt-1 font-mono text-2xl font-extrabold tabular-nums text-amber-700 dark:text-amber-400">
                {initialData.summary.mustChangePasswordCount}
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-400">
              <ShieldCheck className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        searchPlaceholder="Cari nama, email, jabatan..."
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        pagination={{ pageSize: 12 }}
        className="[&>div:nth-child(2)]:border-slate-200 [&>div:nth-child(2)]:bg-white [&>div:nth-child(2)]:shadow-xs dark:[&>div:nth-child(2)]:border-slate-800 dark:[&>div:nth-child(2)]:bg-slate-900 [&_[data-slot=table-header]]:border-b [&_[data-slot=table-header]]:border-slate-200 [&_[data-slot=table-header]]:bg-slate-50 dark:[&_[data-slot=table-header]]:border-slate-800 dark:[&_[data-slot=table-header]]:bg-slate-800/70 [&_[data-slot=table-head]]:text-xs [&_[data-slot=table-head]]:font-bold [&_[data-slot=table-head]]:text-slate-700 [&_[data-slot=table-head]]:uppercase dark:[&_[data-slot=table-head]]:text-slate-200 [&_[data-slot=table-row]]:border-slate-200 dark:[&_[data-slot=table-row]]:border-slate-800 [&_[data-slot=table-row]:hover]:bg-slate-50/90 dark:[&_[data-slot=table-row]:hover]:bg-slate-800/50"
        toolbarSlot={
          <>
            <Select
              value={roleFilter}
              onValueChange={(val) => {
                if (val !== null) setRoleFilter(val);
              }}
              items={roleFilterItems}
            >
              <SelectTrigger className="w-44 min-w-0 overflow-hidden rounded-xl border-slate-200 bg-white font-semibold text-slate-800 *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                <SelectValue placeholder="Semua Peran" className="block min-w-0 truncate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Peran</SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.code}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(val) => {
                if (val !== null) setStatusFilter(val);
              }}
              items={statusFilterItems}
            >
              <SelectTrigger className="w-36 min-w-0 overflow-hidden rounded-xl border-slate-200 bg-white font-semibold text-slate-800 *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                <SelectValue placeholder="Status" className="block min-w-0 truncate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Status</SelectItem>
                <SelectItem value="ACTIVE">Aktif</SelectItem>
                <SelectItem value="INACTIVE">Nonaktif</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="button"
              size="sm"
              onClick={() => {
                setEditingUser(null);
                setFormOpen(true);
              }}
              className="gap-1.5 rounded-xl bg-blue-600 font-bold text-white shadow-sm hover:bg-blue-700"
            >
              <Plus className="size-3.5" />
              <span>Tambah Anggota</span>
            </Button>
          </>
        }
        emptyState={
          <EmptyState
            icon={Users}
            title="Tidak ada anggota yang cocok"
            className="py-10"
          />
        }
      />

      <UserFormDialog
        open={formOpen}
        onOpenChange={(next) => {
          setFormOpen(next);
          if (!next) setEditingUser(null);
        }}
        user={editingUser}
        roles={roles}
        managers={managers}
        currentUserId={currentUserId}
      />

      <ResetPasswordDialog
        open={Boolean(resetUser)}
        onOpenChange={(next) => {
          if (!next) setResetUser(null);
        }}
        user={resetUser}
      />

      <ConfirmDialog
        open={Boolean(toggleTarget)}
        onOpenChange={(next) => {
          if (!next) setToggleTarget(null);
        }}
        title={
          toggleTarget?.isActive
            ? `Nonaktifkan ${toggleTarget.fullName}?`
            : `Aktifkan ${toggleTarget?.fullName}?`
        }
        description={
          toggleTarget?.isActive
            ? toggleTarget.activeTaskCount > 0
              ? `Masih memegang ${toggleTarget.activeTaskCount} task aktif. Sesi login akan langsung dicabut.`
              : "Sesi aktif akan langsung dicabut dan akun tidak dapat masuk."
            : "Akun akan diaktifkan kembali."
        }
        confirmLabel={
          toggleTarget?.isActive ? "Nonaktifkan" : "Aktifkan"
        }
        variant={toggleTarget?.isActive ? "destructive" : "default"}
        isLoading={isTogglingStatus}
        onConfirm={handleConfirmToggleActive}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null);
        }}
        title={`Hapus Akun ${deleteTarget?.fullName ?? ""}?`}
        description={
          deleteTarget && deleteTarget.activeTaskCount > 0
            ? `Akun akan dihapus dari direktori aktif dan sesi login langsung dicabut (riwayat audit & task tetap tersimpan). Catatan: masih ada ${deleteTarget.activeTaskCount} task aktif yang ditugaskan.`
            : "Akun akan dihapus dari direktori aktif dan sesi login langsung dicabut. Riwayat audit, task, dan evaluasi sebelumnya tetap terjaga."
        }
        confirmLabel="Hapus Akun"
        variant="destructive"
        isLoading={isDeletingUser}
        onConfirm={handleConfirmDeleteUser}
      />
    </div>
  );
}
