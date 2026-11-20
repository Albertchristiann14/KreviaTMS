import { cache } from "react";
import {
  hasAnyPermission,
  hasPermission,
  type PermissionCode,
  type RoleCode,
} from "@/lib/constants/permissions";
import { auth } from "@/server/auth/auth";
import { prisma } from "@/server/db/prisma";
import { DomainError } from "@/types/action-result";

export interface AuthContext {
  id: string;
  userId: string;
  email: string;
  name: string;
  fullName: string;
  avatarUrl: string | null;
  jobTitle: string;
  department: string;
  roleId: string;
  role: RoleCode;
  roleCode: RoleCode;
  tokenVersion: number;
  mustChangePassword: boolean;
  permissions: ReadonlySet<PermissionCode>;
}

export type AuthenticatedUser = AuthContext;

/**
 * Request-scoped memoized auth context via React `cache()`.
 * Validates active status, non-deleted state, and `tokenVersion` against PostgreSQL
 * for instant session revocation. Returns `null` when unauthenticated or revoked.
 */
export const getAuthContext = cache(async (): Promise<AuthContext | null> => {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      avatarUrl: true,
      jobTitle: true,
      department: true,
      roleId: true,
      tokenVersion: true,
      mustChangePassword: true,
      isActive: true,
      deletedAt: true,
      role: {
        select: {
          code: true,
          rolePermissions: {
            select: {
              permission: {
                select: { code: true },
              },
            },
          },
        },
      },
    },
  });

  if (
    !dbUser ||
    !dbUser.isActive ||
    dbUser.deletedAt !== null ||
    dbUser.tokenVersion !== session.user.tokenVersion
  ) {
    return null;
  }

  const roleCode = dbUser.role.code as RoleCode;
  const permissions = new Set<PermissionCode>(
    dbUser.role.rolePermissions.map((rp) => rp.permission.code as PermissionCode)
  );

  return {
    id: dbUser.id,
    userId: dbUser.id,
    email: dbUser.email,
    name: dbUser.fullName,
    fullName: dbUser.fullName,
    avatarUrl: dbUser.avatarUrl,
    jobTitle: dbUser.jobTitle,
    department: dbUser.department,
    roleId: dbUser.roleId,
    role: roleCode,
    roleCode,
    tokenVersion: dbUser.tokenVersion,
    mustChangePassword: dbUser.mustChangePassword,
    permissions,
  };
});

/**
 * Requires an active, non-revoked session. Throws `DomainError("UNAUTHORIZED")` otherwise.
 */
export async function requireSession(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) {
    throw new DomainError(
      "UNAUTHORIZED",
      "Sesi login tidak valid atau telah dicabut. Silakan login kembali."
    );
  }
  return ctx;
}

/**
 * Requires all specified permissions (with SUPER_ADMIN bypass and optional scope check).
 */
export async function requirePermission(
  required: PermissionCode | readonly PermissionCode[],
  scopeValidator?: (ctx: AuthContext) => Promise<boolean> | boolean
): Promise<AuthContext> {
  const ctx = await requireSession();
  const allowed = hasPermission(ctx.permissions, required, ctx.roleCode);

  if (!allowed) {
    const list = Array.isArray(required) ? required : [required];
    throw new DomainError(
      "FORBIDDEN",
      `Akses ditolak. Peran ${ctx.roleCode} tidak memiliki izin: ${list.join(", ")}.`
    );
  }

  if (scopeValidator) {
    const scopeAllowed = await scopeValidator(ctx);
    if (!scopeAllowed) {
      throw new DomainError(
        "FORBIDDEN",
        "Akses ditolak. Anda tidak memiliki hak cakupan atas data ini."
      );
    }
  }

  return ctx;
}

/**
 * Requires at least one of the specified permissions (OR check).
 */
export async function requireAnyPermission(
  candidates: readonly PermissionCode[]
): Promise<AuthContext> {
  const ctx = await requireSession();
  if (!hasAnyPermission(ctx.permissions, candidates, ctx.roleCode)) {
    throw new DomainError(
      "FORBIDDEN",
      `Akses ditolak. Membutuhkan salah satu izin: ${candidates.join(", ")}.`
    );
  }
  return ctx;
}

/**
 * Verifies resource ownership or an administrative override permission.
 */
export function assertOwnershipOrPermission(
  ctx: AuthContext,
  ownerId: string | null | undefined,
  overridePermission: PermissionCode
): void {
  if (ctx.roleCode === "SUPER_ADMIN") return;
  if (ownerId && ownerId === ctx.userId) return;
  if (ctx.permissions.has(overridePermission)) return;
  throw new DomainError(
    "FORBIDDEN",
    "Anda hanya dapat mengubah data milik sendiri atau memerlukan izin manajemen."
  );
}
