import type { Prisma } from "@prisma/client";
import type { RoleCode } from "@/lib/constants/permissions";
import type { AuthContext } from "@/server/auth/rbac";
import { prisma } from "@/server/db/prisma";
import { DomainError } from "@/types/action-result";
import type {
  ActivityLogActorOptionDTO,
  ActivityLogRowDTO,
  ActivityLogsPageResult,
  AuditModule,
} from "@/features/system/types";

export const OPERATIONAL_AUDIT_MODULES: readonly AuditModule[] = [
  "TASKS",
  "TEAM_KPI",
  "SOCIAL_DESIGN",
];

export const ALL_AUDIT_MODULES: readonly AuditModule[] = [
  "TASKS",
  "TEAM_KPI",
  "SOCIAL_DESIGN",
  "SYSTEM",
];

export interface ActivityLogFilters {
  module?: string | null;
  actorId?: string | null;
  entityType?: string | null;
  action?: string | null;
  q?: string | null;
  from?: string | null;
  to?: string | null;
  page?: number;
  limit?: number;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseDateBoundary(
  raw: string | null | undefined,
  endOfDay: boolean
): Date | null {
  if (!raw || !raw.trim()) return null;
  const trimmed = raw.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const suffix = endOfDay ? "T23:59:59.999+07:00" : "T00:00:00.000+07:00";
    const parsed = new Date(`${trimmed}${suffix}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function asJsonRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function buildActivityLogsWhere(
  ctx: AuthContext,
  filters: ActivityLogFilters
): Prisma.ActivityLogWhereInput {
  const isSuperAdmin = ctx.roleCode === "SUPER_ADMIN";
  const allowedModules = isSuperAdmin
    ? ALL_AUDIT_MODULES
    : OPERATIONAL_AUDIT_MODULES;

  const requestedModule = filters.module?.trim().toUpperCase();
  if (requestedModule && requestedModule !== "ALL") {
    if (!ALL_AUDIT_MODULES.includes(requestedModule as AuditModule)) {
      throw new DomainError(
        "VALIDATION_ERROR",
        `Filter modul audit '${requestedModule}' tidak valid.`
      );
    }
    if (!isSuperAdmin && requestedModule === "SYSTEM") {
      throw new DomainError(
        "FORBIDDEN",
        "Project Manager hanya memiliki akses log aktivitas modul operasional (TASKS, TEAM_KPI, SOCIAL_DESIGN)."
      );
    }
  }

  const where: Prisma.ActivityLogWhereInput = {};

  if (requestedModule && requestedModule !== "ALL") {
    where.module = requestedModule;
  } else if (!isSuperAdmin) {
    where.module = { in: [...allowedModules] };
  }

  if (filters.actorId && filters.actorId !== "ALL") {
    if (filters.actorId === "SYSTEM_ACTOR") {
      where.actorId = null;
    } else if (UUID_REGEX.test(filters.actorId)) {
      where.actorId = filters.actorId;
    }
  }

  if (filters.entityType && filters.entityType !== "ALL") {
    where.entityType = filters.entityType.trim();
  }

  if (filters.action && filters.action.trim()) {
    where.action = {
      contains: filters.action.trim(),
      mode: "insensitive",
    };
  }

  if (filters.q && filters.q.trim()) {
    const keyword = filters.q.trim();
    where.OR = [
      { summary: { contains: keyword, mode: "insensitive" } },
      { action: { contains: keyword, mode: "insensitive" } },
      { entityType: { contains: keyword, mode: "insensitive" } },
      { actor: { fullName: { contains: keyword, mode: "insensitive" } } },
    ];
  }

  const fromDate = parseDateBoundary(filters.from, false);
  const toDate = parseDateBoundary(filters.to, true);
  if (fromDate || toDate) {
    where.createdAt = {
      ...(fromDate ? { gte: fromDate } : {}),
      ...(toDate ? { lte: toDate } : {}),
    };
  }

  return where;
}

export async function queryActivityLogs(
  ctx: AuthContext,
  filters: ActivityLogFilters
): Promise<ActivityLogsPageResult> {
  const where = buildActivityLogsWhere(ctx, filters);
  const page = Math.max(1, Math.floor(filters.page ?? 1));
  const limit = Math.min(100, Math.max(1, Math.floor(filters.limit ?? 20)));
  const skip = (page - 1) * limit;

  const [totalItems, rows] = await Promise.all([
    prisma.activityLog.count({ where }),
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        module: true,
        action: true,
        entityType: true,
        entityId: true,
        summary: true,
        oldValues: true,
        newValues: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        actor: {
          select: {
            id: true,
            fullName: true,
            role: {
              select: { code: true },
            },
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalItems / limit));

  const items: ActivityLogRowDTO[] = rows.map((row) => ({
    id: row.id,
    actor: row.actor
      ? {
          id: row.actor.id,
          name: row.actor.fullName,
          role: row.actor.role.code,
        }
      : null,
    module: row.module as AuditModule,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    summary: row.summary,
    oldValues: asJsonRecord(row.oldValues),
    newValues: asJsonRecord(row.newValues),
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    createdAt: row.createdAt.toISOString(),
  }));

  return {
    meta: {
      page,
      limit,
      totalItems,
      totalPages,
    },
    items,
  };
}

export async function queryActivityLogsForCsv(
  ctx: AuthContext,
  filters: ActivityLogFilters,
  maxRows = 5000
): Promise<ActivityLogRowDTO[]> {
  const where = buildActivityLogsWhere(ctx, filters);
  const rows = await prisma.activityLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: maxRows,
    select: {
      id: true,
      module: true,
      action: true,
      entityType: true,
      entityId: true,
      summary: true,
      oldValues: true,
      newValues: true,
      ipAddress: true,
      userAgent: true,
      createdAt: true,
      actor: {
        select: {
          id: true,
          fullName: true,
          role: {
            select: { code: true },
          },
        },
      },
    },
  });

  return rows.map((row) => ({
    id: row.id,
    actor: row.actor
      ? {
          id: row.actor.id,
          name: row.actor.fullName,
          role: row.actor.role.code,
        }
      : null,
    module: row.module as AuditModule,
    action: row.action,
    entityType: row.entityType,
    entityId: row.entityId,
    summary: row.summary,
    oldValues: asJsonRecord(row.oldValues),
    newValues: asJsonRecord(row.newValues),
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    createdAt: row.createdAt.toISOString(),
  }));
}

export async function getActivityLogFilterOptions(ctx: AuthContext): Promise<{
  actors: ActivityLogActorOptionDTO[];
  entityTypes: string[];
  allowedModules: AuditModule[];
}> {
  const isSuperAdmin = ctx.roleCode === "SUPER_ADMIN";
  const allowedModules = isSuperAdmin
    ? [...ALL_AUDIT_MODULES]
    : [...OPERATIONAL_AUDIT_MODULES];

  const [actors, entityGroups] = await Promise.all([
    prisma.user.findMany({
      where: { deletedAt: null },
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        role: { select: { code: true } },
      },
    }),
    prisma.activityLog.groupBy({
      by: ["entityType"],
      where: isSuperAdmin
        ? undefined
        : { module: { in: [...OPERATIONAL_AUDIT_MODULES] } },
      orderBy: { entityType: "asc" },
    }),
  ]);

  return {
    actors: actors.map((a) => ({
      id: a.id,
      fullName: a.fullName,
      roleCode: a.role.code as RoleCode,
    })),
    entityTypes: entityGroups.map((g) => g.entityType),
    allowedModules,
  };
}
