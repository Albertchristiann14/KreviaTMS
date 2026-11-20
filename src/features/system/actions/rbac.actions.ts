"use server";

import { revalidatePath } from "next/cache";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { createProtectedAction } from "@/server/actions/safe-action";
import { prisma } from "@/server/db/prisma";
import { executeAuditedMutation } from "@/server/services/audit-logger";
import { DomainError } from "@/types/action-result";
import { updateRolePermissionsSchema } from "@/features/system/schemas/rbac.schema";

const PROTECTED_SUPER_ADMIN_PERMISSIONS = [
  PERMISSIONS.SYSTEM_RBAC_MANAGE,
  PERMISSIONS.SYSTEM_USER_MANAGE,
] as const;

export const updateRolePermissionsAction = createProtectedAction({
  permission: PERMISSIONS.SYSTEM_RBAC_MANAGE,
  schema: updateRolePermissionsSchema,
  handler: async ({ ctx, input }) => {
    if (ctx.roleCode !== "SUPER_ADMIN") {
      throw new DomainError(
        "FORBIDDEN",
        "Hanya SUPER_ADMIN yang dapat mengubah matriks izin RBAC."
      );
    }

    const role = await prisma.role.findUnique({
      where: { id: input.roleId },
      select: {
        id: true,
        code: true,
        name: true,
      },
    });

    if (!role) {
      throw new DomainError("NOT_FOUND", "Peran (role) tidak ditemukan.");
    }

    if (role.code === "SUPER_ADMIN") {
      const requestedSet = new Set<string>(input.permissionCodes);
      const missingCritical = PROTECTED_SUPER_ADMIN_PERMISSIONS.filter(
        (code) => !requestedSet.has(code)
      );

      if (missingCritical.length > 0) {
        throw new DomainError(
          "VALIDATION_ERROR",
          `Peran SUPER_ADMIN tidak boleh kehilangan izin inti: ${missingCritical.join(", ")}.`
        );
      }
    }

    const permissionRecords = await prisma.permission.findMany({
      where: {
        code: { in: input.permissionCodes },
      },
      select: {
        id: true,
        code: true,
      },
    });

    if (permissionRecords.length !== input.permissionCodes.length) {
      throw new DomainError(
        "VALIDATION_ERROR",
        "Sebagian kode izin tidak ditemukan di database."
      );
    }

    const mutationResult = await executeAuditedMutation(ctx, async (tx) => {
      const existingRows = await tx.rolePermission.findMany({
        where: { roleId: role.id },
        select: {
          permission: {
            select: { code: true },
          },
        },
      });

      const oldCodes = existingRows.map((r) => r.permission.code).sort();
      const nextCodes = permissionRecords.map((p) => p.code).sort();

      const oldSet = new Set(oldCodes);
      const nextSet = new Set(nextCodes);

      const added = nextCodes.filter((code) => !oldSet.has(code));
      const removed = oldCodes.filter((code) => !nextSet.has(code));

      await tx.rolePermission.deleteMany({
        where: { roleId: role.id },
      });

      if (permissionRecords.length > 0) {
        await tx.rolePermission.createMany({
          data: permissionRecords.map((perm) => ({
            roleId: role.id,
            permissionId: perm.id,
            grantedBy: ctx.userId,
          })),
          skipDuplicates: true,
        });
      }

      return {
        result: {
          roleId: role.id,
          roleCode: role.code,
          totalPermissions: nextCodes.length,
          added,
          removed,
        },
        audit: {
          module: "SYSTEM" as const,
          action: "system:rbac:permissions_updated",
          entityType: "ROLE",
          entityId: role.id,
          summary: `${ctx.fullName} memperbarui matriks RBAC untuk ${role.code} (+${added.length} / -${removed.length} izin)`,
          oldValues: {
            roleCode: role.code,
            count: oldCodes.length,
            removed,
          },
          newValues: {
            roleCode: role.code,
            count: nextCodes.length,
            added,
          },
        },
      };
    });

    revalidatePath("/system/roles");
    revalidatePath("/", "layout");

    return {
      data: mutationResult,
      message: `Izin untuk peran ${role.name} (${mutationResult.totalPermissions} izin) berhasil disimpan.`,
    };
  },
});
