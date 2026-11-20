"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Lock,
  RotateCcw,
  Save,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { updateRolePermissionsAction } from "@/features/system/actions/rbac.actions";
import type {
  RbacMatrixData,
  RbacPermissionDTO,
} from "@/features/system/types";
import {
  PERMISSIONS,
  type PermissionCode,
  type RoleCode,
} from "@/lib/constants/permissions";
import { cn } from "@/lib/utils";

type ModuleGroupKey = "ALL" | "TASKS" | "KPI" | "SOCIAL_DESIGN" | "SYSTEM";

const MODULE_GROUP_LABELS: Record<Exclude<ModuleGroupKey, "ALL">, string> = {
  TASKS: "Tasks & Projects",
  KPI: "Team & KPI",
  SOCIAL_DESIGN: "Social & Design",
  SYSTEM: "System & Governance",
};

const ROLE_THEME: Record<
  RoleCode,
  { badge: string; columnBg: string; bar: string }
> = {
  SUPER_ADMIN: {
    badge:
      "border-purple-300 bg-purple-50 text-purple-800 dark:border-purple-500/40 dark:bg-purple-500/15 dark:text-purple-200",
    columnBg: "bg-purple-50/40 dark:bg-purple-500/[0.04]",
    bar: "bg-purple-600",
  },
  PROJECT_MANAGER: {
    badge:
      "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-200",
    columnBg: "bg-blue-50/40 dark:bg-blue-500/[0.04]",
    bar: "bg-blue-600",
  },
  STAFF_CREATOR: {
    badge:
      "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-200",
    columnBg: "bg-emerald-50/40 dark:bg-emerald-500/[0.04]",
    bar: "bg-emerald-600",
  },
  DESIGNER: {
    badge:
      "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-200",
    columnBg: "bg-amber-50/40 dark:bg-amber-500/[0.04]",
    bar: "bg-amber-500",
  },
};

const LOCKED_SUPER_ADMIN_CODES = new Set<string>([
  PERMISSIONS.SYSTEM_RBAC_MANAGE,
  PERMISSIONS.SYSTEM_USER_MANAGE,
]);

function resolveModuleGroup(
  permModule: string
): Exclude<ModuleGroupKey, "ALL"> {
  if (permModule === "tasks") return "TASKS";
  if (permModule === "kpi") return "KPI";
  if (permModule === "system") return "SYSTEM";
  return "SOCIAL_DESIGN";
}

export interface RbacMatrixEditorProps {
  initialData: RbacMatrixData;
}

export function RbacMatrixEditor({ initialData }: RbacMatrixEditorProps) {
  const router = useRouter();
  const [moduleFilter, setModuleFilter] = useState<ModuleGroupKey>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const baselineMap = useMemo(() => {
    const map: Record<string, Set<PermissionCode>> = {};
    for (const role of initialData.roles) {
      map[role.id] = new Set(role.permissionCodes);
    }
    return map;
  }, [initialData.roles]);

  const [draftMap, setDraftMap] = useState<Record<string, Set<PermissionCode>>>(
    () => {
      const copy: Record<string, Set<PermissionCode>> = {};
      for (const role of initialData.roles) {
        copy[role.id] = new Set(role.permissionCodes);
      }
      return copy;
    }
  );

  const roleDiffs = useMemo(() => {
    return initialData.roles.map((role) => {
      const base = baselineMap[role.id] ?? new Set<PermissionCode>();
      const draft = draftMap[role.id] ?? new Set<PermissionCode>();

      const added: PermissionCode[] = [];
      const removed: PermissionCode[] = [];

      for (const code of draft) {
        if (!base.has(code)) added.push(code);
      }
      for (const code of base) {
        if (!draft.has(code)) removed.push(code);
      }

      return {
        roleId: role.id,
        roleCode: role.code,
        roleName: role.name,
        added,
        removed,
        hasChanges: added.length > 0 || removed.length > 0,
      };
    });
  }, [initialData.roles, baselineMap, draftMap]);

  const modifiedRoles = roleDiffs.filter((d) => d.hasChanges);

  const groupedPermissions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const groups: Record<Exclude<ModuleGroupKey, "ALL">, RbacPermissionDTO[]> =
      {
        TASKS: [],
        KPI: [],
        SOCIAL_DESIGN: [],
        SYSTEM: [],
      };

    for (const perm of initialData.permissions) {
      const groupKey = resolveModuleGroup(perm.module);
      if (moduleFilter !== "ALL" && groupKey !== moduleFilter) continue;
      if (q) {
        const hay = `${perm.code} ${perm.description ?? ""}`.toLowerCase();
        if (!hay.includes(q)) continue;
      }
      groups[groupKey].push(perm);
    }

    return (
      Object.entries(groups) as Array<
        [Exclude<ModuleGroupKey, "ALL">, RbacPermissionDTO[]]
      >
    ).filter(([, list]) => list.length > 0);
  }, [initialData.permissions, moduleFilter, searchQuery]);

  const togglePermission = (
    roleId: string,
    roleCode: RoleCode,
    permCode: PermissionCode,
    checked: boolean
  ) => {
    if (
      roleCode === "SUPER_ADMIN" &&
      LOCKED_SUPER_ADMIN_CODES.has(permCode) &&
      !checked
    ) {
      toast.warning(
        `Izin ${permCode} dikunci untuk SUPER_ADMIN guna mencegah lockout.`
      );
      return;
    }

    setDraftMap((prev) => {
      const next = { ...prev };
      const currentSet = new Set(prev[roleId] ?? []);
      if (checked) {
        currentSet.add(permCode);
      } else {
        currentSet.delete(permCode);
      }
      next[roleId] = currentSet;
      return next;
    });
  };

  const handleReset = () => {
    const restored: Record<string, Set<PermissionCode>> = {};
    for (const role of initialData.roles) {
      restored[role.id] = new Set(role.permissionCodes);
    }
    setDraftMap(restored);
    toast.info("Perubahan dikembalikan.");
  };

  const handleSaveChanges = async () => {
    if (modifiedRoles.length === 0) return;
    setIsSaving(true);
    try {
      for (const diff of modifiedRoles) {
        const nextCodes = Array.from(draftMap[diff.roleId] ?? []);
        const res = await updateRolePermissionsAction({
          roleId: diff.roleId,
          permissionCodes: nextCodes,
        });

        if (!res.success) {
          toast.error(`Gagal menyimpan ${diff.roleCode}: ${res.error.message}`);
          return;
        }
      }

      toast.success(
        `Akses diperbarui untuk ${modifiedRoles.map((r) => r.roleCode).join(", ")}.`
      );
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const totalPermissionsCount = initialData.permissions.length;

  return (
    <div className="space-y-5">
      {/* Role Summary Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {initialData.roles.map((role) => {
          const currentCount = draftMap[role.id]?.size ?? 0;
          const pct =
            totalPermissionsCount > 0
              ? Math.round((currentCount / totalPermissionsCount) * 100)
              : 0;
          const diff = roleDiffs.find((d) => d.roleId === role.id);
          const theme = ROLE_THEME[role.code];
          return (
            <Card
              key={role.id}
              className="rounded-xl border-slate-200 bg-white shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className={cn("font-mono text-[10px] font-bold", theme?.badge)}
                  >
                    {role.code}
                  </Badge>
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                    <Users className="size-3" />
                    {role.activeUserCount}
                  </span>
                </div>

                <div className="flex min-w-0 items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-bold text-slate-900 dark:text-white">
                    {role.name}
                  </p>
                  {diff?.hasChanges ? (
                    <div className="flex items-center gap-1 font-mono text-[10px] font-bold">
                      {diff.added.length > 0 ? (
                        <span className="rounded-md border border-emerald-300 bg-emerald-50 px-1.5 py-0.5 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300">
                          +{diff.added.length}
                        </span>
                      ) : null}
                      {diff.removed.length > 0 ? (
                        <span className="rounded-md border border-rose-300 bg-rose-50 px-1.5 py-0.5 text-rose-800 dark:border-rose-500/40 dark:bg-rose-500/15 dark:text-rose-300">
                          -{diff.removed.length}
                        </span>
                      ) : null}
                    </div>
                  ) : (
                    <span className="font-mono text-xs font-extrabold tabular-nums text-slate-900 dark:text-white">
                      {currentCount}/{totalPermissionsCount}
                    </span>
                  )}
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      theme?.bar ?? "bg-blue-600"
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs lg:flex-row lg:items-center lg:justify-between dark:border-slate-800 dark:bg-slate-900">
        <Tabs
          value={moduleFilter}
          onValueChange={(val) => setModuleFilter(val as ModuleGroupKey)}
        >
          <TabsList className="flex-wrap rounded-xl border border-slate-200/80 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
            <TabsTrigger value="ALL" className="font-bold">
              Semua ({totalPermissionsCount})
            </TabsTrigger>
            <TabsTrigger value="TASKS" className="font-bold">
              Tasks
            </TabsTrigger>
            <TabsTrigger value="KPI" className="font-bold">
              Team &amp; KPI
            </TabsTrigger>
            <TabsTrigger value="SOCIAL_DESIGN" className="font-bold">
              Social &amp; Design
            </TabsTrigger>
            <TabsTrigger value="SYSTEM" className="font-bold">
              System
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full lg:w-72">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-slate-500 dark:text-slate-400"
            aria-hidden="true"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter permission..."
            className="h-9 rounded-xl border-slate-200 bg-slate-50 pl-8.5 text-xs font-medium text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100"
          />
        </div>
      </div>

      {/* Floating Save Diff Banner */}
      {modifiedRoles.length > 0 ? (
        <div className="sticky top-16 z-20 flex flex-col gap-3 rounded-2xl border-2 border-blue-500/40 bg-white/95 p-3.5 shadow-xl backdrop-blur-md sm:flex-row sm:items-center sm:justify-between dark:bg-slate-900/95">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <ShieldCheck className="size-4 text-blue-600 dark:text-blue-400" />
            <span className="font-bold text-slate-900 dark:text-white">
              {modifiedRoles.length} peran diubah:
            </span>
            {modifiedRoles.map((diff) => (
              <Badge
                key={diff.roleId}
                variant="outline"
                className="gap-1.5 border-slate-200 bg-slate-100 font-mono text-[11px] font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                <span>
                  {initialData.roles.find((r) => r.id === diff.roleId)?.name ??
                    diff.roleCode}
                </span>
                <span className="text-emerald-700 dark:text-emerald-400">
                  +{diff.added.length}
                </span>
                <span className="text-rose-700 dark:text-rose-400">
                  -{diff.removed.length}
                </span>
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSaving}
              onClick={handleReset}
              className="gap-1 rounded-xl border-slate-300 bg-white font-bold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <RotateCcw className="size-3.5" />
              <span>Reset</span>
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={isSaving}
              onClick={handleSaveChanges}
              className="gap-1.5 rounded-xl bg-blue-600 font-bold text-white shadow-sm hover:bg-blue-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save className="size-3.5" />
                  <span>Simpan</span>
                </>
              )}
            </Button>
          </div>
        </div>
      ) : null}

      {/* Compact Matrix Table with Role Column Highlights */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <Table>
          <TableHeader className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/70">
            <TableRow className="hover:bg-transparent">
              <TableHead className="min-w-[260px] text-xs font-bold tracking-wider text-slate-700 uppercase dark:text-slate-200">
                Permission
              </TableHead>
              {initialData.roles.map((role) => {
                const theme = ROLE_THEME[role.code];
                return (
                  <TableHead
                    key={role.id}
                    className={cn(
                      "w-36 border-l border-slate-200 text-center dark:border-slate-800",
                      theme?.columnBg
                    )}
                  >
                    <div className="flex flex-col items-center gap-1 py-1.5">
                      <Badge
                        variant="outline"
                        className={cn(
                          "font-mono text-[10px] font-bold",
                          theme?.badge
                        )}
                      >
                        {role.code}
                      </Badge>
                      <span className="font-mono text-[11px] font-bold text-slate-600 dark:text-slate-300">
                        {draftMap[role.id]?.size ?? 0} aktif
                      </span>
                    </div>
                  </TableHead>
                );
              })}
            </TableRow>
          </TableHeader>

          <TableBody>
            {groupedPermissions.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={1 + initialData.roles.length}
                  className="py-10 text-center text-xs font-medium text-slate-500 dark:text-slate-400"
                >
                  Tidak ada izin yang cocok.
                </TableCell>
              </TableRow>
            ) : (
              groupedPermissions.map(([groupKey, perms]) => (
                <FragmentGroup
                  key={groupKey}
                  groupTitle={MODULE_GROUP_LABELS[groupKey]}
                  permissions={perms}
                  roles={initialData.roles}
                  draftMap={draftMap}
                  baselineMap={baselineMap}
                  onToggle={togglePermission}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function FragmentGroup({
  groupTitle,
  permissions,
  roles,
  draftMap,
  baselineMap,
  onToggle,
}: {
  groupTitle: string;
  permissions: RbacPermissionDTO[];
  roles: RbacMatrixData["roles"];
  draftMap: Record<string, Set<PermissionCode>>;
  baselineMap: Record<string, Set<PermissionCode>>;
  onToggle: (
    roleId: string,
    roleCode: RoleCode,
    permCode: PermissionCode,
    checked: boolean
  ) => void;
}) {
  return (
    <>
      <TableRow className="border-y border-slate-200 bg-slate-100/90 hover:bg-slate-100/90 dark:border-slate-700 dark:bg-slate-800/90 dark:hover:bg-slate-800/90">
        <TableCell
          colSpan={1 + roles.length}
          className="py-2 text-xs font-extrabold tracking-wide text-slate-800 uppercase dark:text-slate-100"
        >
          {groupTitle}{" "}
          <span className="ml-1 rounded-md bg-white px-1.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700">
            {permissions.length}
          </span>
        </TableCell>
      </TableRow>
      {permissions.map((perm) => (
        <TableRow
          key={perm.id}
          className="border-slate-200 transition-colors hover:bg-slate-50/90 dark:border-slate-800 dark:hover:bg-slate-800/50"
        >
          <TableCell className="py-2.5 whitespace-normal">
            <div className="flex flex-col gap-1">
              <code className="w-fit rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                {perm.code}
              </code>
              {perm.description ? (
                <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                  {perm.description}
                </p>
              ) : null}
            </div>
          </TableCell>
          {roles.map((role) => {
            const isChecked = draftMap[role.id]?.has(perm.code) ?? false;
            const wasChecked = baselineMap[role.id]?.has(perm.code) ?? false;
            const isChanged = isChecked !== wasChecked;
            const isProtected =
              role.code === "SUPER_ADMIN" &&
              LOCKED_SUPER_ADMIN_CODES.has(perm.code);
            const theme = ROLE_THEME[role.code];

            return (
              <TableCell
                key={`${perm.id}-${role.id}`}
                className={cn(
                  "border-l border-slate-200 py-2.5 text-center transition-colors dark:border-slate-800",
                  theme?.columnBg,
                  isChanged && "bg-blue-500/15 dark:bg-blue-500/20"
                )}
              >
                <div className="inline-flex items-center justify-center gap-1.5">
                  <Checkbox
                    checked={isChecked}
                    disabled={isProtected}
                    aria-label={`${perm.code} untuk ${role.code}`}
                    onCheckedChange={(next) =>
                      onToggle(role.id, role.code, perm.code, next)
                    }
                    className={cn(
                      "border-slate-300 dark:border-slate-600",
                      isChanged && "ring-2 ring-blue-500 ring-offset-1"
                    )}
                  />
                  {isProtected ? (
                    <Lock
                      className="size-3.5 text-slate-500 dark:text-slate-400"
                      aria-label="Izin terkunci"
                    />
                  ) : null}
                </div>
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </>
  );
}
