import { headers } from "next/headers";
import type { Prisma } from "@prisma/client";
import type { AuthContext } from "@/server/auth/rbac";
import { prisma } from "@/server/db/prisma";
import {
  dispatchNotifications,
  type NotificationDraft,
} from "@/server/services/notification-dispatcher";

const REDACTED_KEYS = new Set([
  "password",
  "passwordHash",
  "password_hash",
  "temporaryPassword",
  "temporary_password",
  "tokenVersion",
  "token_version",
  "secret",
  "accessToken",
  "refreshToken",
]);

function redactSensitiveValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitiveValue(item));
  }
  if (typeof value === "object") {
    const clean: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(
      value as Record<string, unknown>
    )) {
      clean[key] = REDACTED_KEYS.has(key)
        ? "[REDACTED]"
        : redactSensitiveValue(nested);
    }
    return clean;
  }
  return value;
}

export type AuditModule = "TASKS" | "TEAM_KPI" | "SOCIAL_DESIGN" | "SYSTEM";

export interface AuditLogInput {
  actorId: string | null;
  module: AuditModule;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuditMeta {
  action: string;
  module: AuditModule;
  entityType: string;
  entityId?: string | null;
  summary: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
}

async function resolveRequestMetadata(): Promise<{
  ipAddress: string | null;
  userAgent: string | null;
}> {
  try {
    const reqHeaders = await headers();
    const ipAddress =
      reqHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      reqHeaders.get("x-real-ip")?.trim() ??
      null;
    const userAgent = reqHeaders.get("user-agent") ?? null;
    return { ipAddress, userAgent };
  } catch {
    // Graceful fallback when called from background scripts/tests outside request scope
    return { ipAddress: null, userAgent: null };
  }
}

/**
 * Writes an immutable audit log entry inside an active `prisma.$transaction`.
 * Recursively redacts sensitive keys (`passwordHash`, `password_hash`, `tokenVersion`, `token_version`).
 */
export async function writeAuditLog(
  tx: Prisma.TransactionClient,
  input: AuditLogInput
): Promise<void> {
  const sanitizedOld =
    input.oldValues != null
      ? (redactSensitiveValue(input.oldValues) as Prisma.InputJsonValue)
      : undefined;
  const sanitizedNew =
    input.newValues != null
      ? (redactSensitiveValue(input.newValues) as Prisma.InputJsonValue)
      : undefined;

  await tx.activityLog.create({
    data: {
      actorId: input.actorId,
      module: input.module,
      action: input.action.slice(0, 80),
      entityType: input.entityType.slice(0, 60),
      entityId: input.entityId ?? null,
      summary: input.summary.slice(0, 255),
      oldValues: sanitizedOld,
      newValues: sanitizedNew,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}

/**
 * Executes a domain mutation, immutable audit log entry, and notifications atomically
 * inside a single PostgreSQL transaction.
 */
export async function executeAuditedMutation<T>(
  ctx: AuthContext,
  work: (tx: Prisma.TransactionClient) => Promise<{
    result: T;
    audit: AuditMeta;
    notifications?: NotificationDraft[];
  }>
): Promise<T> {
  const { ipAddress, userAgent } = await resolveRequestMetadata();

  return prisma.$transaction(
    async (tx) => {
      const { result, audit, notifications } = await work(tx);

      await writeAuditLog(tx, {
        actorId: ctx.userId,
        module: audit.module,
        action: audit.action,
        entityType: audit.entityType,
        entityId: audit.entityId ?? null,
        summary: audit.summary,
        oldValues: audit.oldValues ?? null,
        newValues: audit.newValues ?? null,
        ipAddress,
        userAgent,
      });

      if (notifications && notifications.length > 0) {
        await dispatchNotifications(
          tx,
          ctx.userId,
          notifications.map((n) => ({
            ...n,
            entityType: n.entityType ?? audit.entityType,
            entityId: n.entityId ?? audit.entityId ?? null,
          }))
        );
      }

      return result;
    },
    { maxWait: 10_000, timeout: 25_000 }
  );
}
