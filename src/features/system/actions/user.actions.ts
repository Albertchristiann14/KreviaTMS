"use server";

import { revalidatePath } from "next/cache";
import { hash } from "@node-rs/argon2";
import { NotificationType, TaskStatus } from "@prisma/client";
import { z } from "zod";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { createProtectedAction } from "@/server/actions/safe-action";
import { prisma } from "@/server/db/prisma";
import { executeAuditedMutation } from "@/server/services/audit-logger";
import { DomainError } from "@/types/action-result";
import {
  createUserSchema,
  resetUserPasswordSchema,
  updateUserSchema,
} from "@/features/system/schemas/user.schema";
import type { ActiveTaskBriefDTO } from "@/features/system/types";

const ACTIVE_TASK_STATUSES: TaskStatus[] = [
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.REVISION,
];

async function hashArgon2id(plainPassword: string): Promise<string> {
  return hash(plainPassword, {
    algorithm: 2, // Argon2id
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

function normalizeNullableString(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export const createUserAction = createProtectedAction({
  permission: PERMISSIONS.SYSTEM_USER_MANAGE,
  schema: createUserSchema,
  handler: async ({ ctx, input }) => {
    const [existingByEmail, role, manager] = await Promise.all([
      prisma.user.findUnique({
        where: { email: input.email },
        select: { id: true },
      }),
      prisma.role.findUnique({
        where: { id: input.roleId },
        select: { id: true, code: true, name: true },
      }),
      input.managerId && input.managerId.trim() !== ""
        ? prisma.user.findFirst({
            where: {
              id: input.managerId,
              deletedAt: null,
              isActive: true,
            },
            select: { id: true, fullName: true },
          })
        : Promise.resolve(null),
    ]);

    if (existingByEmail) {
      throw new DomainError(
        "CONFLICT",
        "Email sudah digunakan oleh akun lain.",
        { email: ["Email kerja sudah terdaftar."] }
      );
    }

    if (!role) {
      throw new DomainError(
        "NOT_FOUND",
        "Peran (role) yang dipilih tidak ditemukan.",
        { roleId: ["Peran tidak valid."] }
      );
    }

    if (input.managerId && input.managerId.trim() !== "" && !manager) {
      throw new DomainError(
        "NOT_FOUND",
        "Atasan (manager) yang dipilih tidak ditemukan atau nonaktif.",
        { managerId: ["Atasan tidak valid."] }
      );
    }

    const passwordHash = await hashArgon2id(input.temporaryPassword);
    const displayName = normalizeNullableString(input.displayName);
    const phone = normalizeNullableString(input.phone);
    const managerId = manager ? manager.id : null;

    const created = await executeAuditedMutation(ctx, async (tx) => {
      const user = await tx.user.create({
        data: {
          email: input.email,
          passwordHash,
          fullName: input.fullName,
          displayName,
          roleId: role.id,
          managerId,
          jobTitle: input.jobTitle,
          department: input.department,
          employmentStatus: input.employmentStatus,
          phone,
          isActive: true,
          mustChangePassword: true,
          tokenVersion: 1,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          jobTitle: true,
          department: true,
          employmentStatus: true,
          isActive: true,
          mustChangePassword: true,
          tokenVersion: true,
        },
      });

      return {
        result: user,
        audit: {
          module: "SYSTEM" as const,
          action: "system:user:created",
          entityType: "USER",
          entityId: user.id,
          summary: `${ctx.fullName} membuat akun internal baru untuk ${user.fullName} (${role.code})`,
          newValues: {
            email: user.email,
            fullName: user.fullName,
            roleCode: role.code,
            jobTitle: user.jobTitle,
            department: user.department,
            employmentStatus: user.employmentStatus,
            managerId,
            isActive: true,
            mustChangePassword: true,
          },
        },
        notifications: [
          {
            recipientId: user.id,
            type: NotificationType.SYSTEM_ALERT,
            title: "Selamat Datang di Krevia TMS",
            message: `Akun Anda telah dibuat dengan peran ${role.name}. Segera perbarui kata sandi sementara Anda.`,
            actionUrl: "/announcements",
          },
        ],
      };
    });

    revalidatePath("/system/users");
    revalidatePath("/team");

    return {
      data: {
        id: created.id,
        email: created.email,
        fullName: created.fullName,
        roleCode: role.code,
      },
      message: `Akun ${created.fullName} berhasil dibuat dengan status wajib ganti password saat login pertama.`,
    };
  },
});

export const updateUserAction = createProtectedAction({
  permission: PERMISSIONS.SYSTEM_USER_MANAGE,
  schema: updateUserSchema,
  handler: async ({ ctx, input }) => {
    const requestedManagerId = normalizeNullableString(input.managerId);

    const [existing, targetRole, manager] = await Promise.all([
      prisma.user.findFirst({
        where: { id: input.userId, deletedAt: null },
        select: {
          id: true,
          email: true,
          fullName: true,
          displayName: true,
          jobTitle: true,
          department: true,
          phone: true,
          employmentStatus: true,
          managerId: true,
          roleId: true,
          isActive: true,
          tokenVersion: true,
          role: {
            select: {
              id: true,
              code: true,
              name: true,
            },
          },
        },
      }),
      prisma.role.findUnique({
        where: { id: input.roleId },
        select: { id: true, code: true, name: true },
      }),
      requestedManagerId
        ? prisma.user.findFirst({
            where: {
              id: requestedManagerId,
              deletedAt: null,
            },
            select: { id: true, fullName: true, isActive: true },
          })
        : Promise.resolve(null),
    ]);

    if (!existing) {
      throw new DomainError("NOT_FOUND", "Akun pengguna tidak ditemukan.");
    }

    if (!targetRole) {
      throw new DomainError("NOT_FOUND", "Peran tujuan tidak ditemukan.", {
        roleId: ["Peran tidak valid."],
      });
    }

    if (requestedManagerId && requestedManagerId === existing.id) {
      throw new DomainError(
        "VALIDATION_ERROR",
        "Pengguna tidak dapat ditetapkan sebagai atasan dirinya sendiri.",
        { managerId: ["Atasan tidak boleh sama dengan pengguna."] }
      );
    }

    const isKeepingExistingManager =
      requestedManagerId !== null && requestedManagerId === existing.managerId;

    if (requestedManagerId) {
      if (!manager && !isKeepingExistingManager) {
        throw new DomainError(
          "NOT_FOUND",
          "Atasan (manager) tidak ditemukan.",
          { managerId: ["Atasan tidak valid."] }
        );
      }

      if (manager && !manager.isActive && !isKeepingExistingManager) {
        throw new DomainError(
          "VALIDATION_ERROR",
          "Atasan (manager) yang dipilih sedang nonaktif.",
          { managerId: ["Pilih atasan dengan status akun aktif."] }
        );
      }
    }

    if (existing.id === ctx.userId && !input.isActive) {
      throw new DomainError(
        "CONFLICT",
        "Anda tidak dapat menonaktifkan akun Anda sendiri."
      );
    }

    // Last Super Admin protection (FR-D01)
    const isDemotingLastAdmin =
      existing.role.code === "SUPER_ADMIN" && targetRole.code !== "SUPER_ADMIN";
    const isDeactivatingLastAdmin =
      existing.role.code === "SUPER_ADMIN" &&
      existing.isActive &&
      !input.isActive;

    if (isDemotingLastAdmin || isDeactivatingLastAdmin) {
      const otherActiveAdminsCount = await prisma.user.count({
        where: {
          id: { not: existing.id },
          deletedAt: null,
          isActive: true,
          role: { code: "SUPER_ADMIN" },
        },
      });

      if (otherActiveAdminsCount < 1) {
        throw new DomainError(
          "CONFLICT",
          "Operasi ditolak: sistem wajib memiliki minimal 1 akun SUPER_ADMIN aktif."
        );
      }
    }

    const roleChanged = existing.roleId !== targetRole.id;
    const activeStatusChanged = existing.isActive !== input.isActive;
    const shouldRevokeSession = roleChanged || activeStatusChanged;

    const displayName = normalizeNullableString(input.displayName);
    const phone = normalizeNullableString(input.phone);
    const managerId = manager
      ? manager.id
      : isKeepingExistingManager
        ? existing.managerId
        : null;

    let activeTasksWarning: ActiveTaskBriefDTO[] = [];
    if (existing.isActive && !input.isActive) {
      activeTasksWarning = await prisma.task.findMany({
        where: {
          assigneeId: existing.id,
          deletedAt: null,
          status: { in: ACTIVE_TASK_STATUSES },
        },
        orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
        take: 25,
        select: {
          id: true,
          taskCode: true,
          title: true,
          status: true,
        },
      });
    }

    const updated = await executeAuditedMutation(ctx, async (tx) => {
      const nextUser = await tx.user.update({
        where: { id: existing.id },
        data: {
          fullName: input.fullName,
          displayName,
          roleId: targetRole.id,
          jobTitle: input.jobTitle,
          department: input.department,
          employmentStatus: input.employmentStatus,
          phone,
          managerId,
          isActive: input.isActive,
          ...(shouldRevokeSession
            ? { tokenVersion: { increment: 1 } }
            : {}),
        },
        select: {
          id: true,
          fullName: true,
          email: true,
          isActive: true,
          tokenVersion: true,
        },
      });

      const actionName = roleChanged
        ? "system:user:role_updated"
        : activeStatusChanged
          ? "system:user:status_updated"
          : "system:user:updated";

      const summaryParts: string[] = [];
      if (roleChanged) {
        summaryParts.push(`ubah role ${existing.role.code} -> ${targetRole.code}`);
      }
      if (activeStatusChanged) {
        summaryParts.push(
          input.isActive ? "aktifkan kembali akun" : "nonaktifkan akun"
        );
      }
      const actionSummary =
        summaryParts.length > 0
          ? `${ctx.fullName} memperbarui ${existing.fullName}: ${summaryParts.join(", ")}`
          : `${ctx.fullName} memperbarui profil akun ${existing.fullName}`;

      return {
        result: nextUser,
        audit: {
          module: "SYSTEM" as const,
          action: actionName,
          entityType: "USER",
          entityId: existing.id,
          summary: actionSummary,
          oldValues: {
            fullName: existing.fullName,
            roleCode: existing.role.code,
            jobTitle: existing.jobTitle,
            department: existing.department,
            employmentStatus: existing.employmentStatus,
            managerId: existing.managerId,
            isActive: existing.isActive,
          },
          newValues: {
            fullName: input.fullName,
            roleCode: targetRole.code,
            jobTitle: input.jobTitle,
            department: input.department,
            employmentStatus: input.employmentStatus,
            managerId,
            isActive: input.isActive,
            sessionRevoked: shouldRevokeSession,
          },
        },
        notifications:
          roleChanged && input.isActive
            ? [
                {
                  recipientId: existing.id,
                  type: NotificationType.SYSTEM_ALERT,
                  title: "Peran Akses Diperbarui",
                  message: `Peran Anda di Krevia TMS diubah menjadi ${targetRole.name}. Silakan login ulang jika sesi diminta.`,
                  actionUrl: "/",
                },
              ]
            : undefined,
      };
    });

    revalidatePath("/system/users");
    revalidatePath("/team");
    revalidatePath(`/team/${existing.id}`);
    revalidatePath("/");

    const warningNote =
      activeTasksWarning.length > 0
        ? ` Catatan: user masih memegang ${activeTasksWarning.length} task aktif yang perlu di-reassign.`
        : "";

    return {
      data: {
        id: updated.id,
        sessionRevoked: shouldRevokeSession,
        activeTasksWarning,
      },
      message: `Data pengguna ${updated.fullName} berhasil diperbarui.${shouldRevokeSession ? " Sesi aktif user langsung dicabut." : ""}${warningNote}`,
    };
  },
});

export const resetUserPasswordAction = createProtectedAction({
  permission: PERMISSIONS.SYSTEM_USER_MANAGE,
  schema: resetUserPasswordSchema,
  handler: async ({ ctx, input }) => {
    const existing = await prisma.user.findFirst({
      where: { id: input.userId, deletedAt: null },
      select: {
        id: true,
        fullName: true,
        email: true,
        mustChangePassword: true,
      },
    });

    if (!existing) {
      throw new DomainError("NOT_FOUND", "Akun pengguna tidak ditemukan.");
    }

    const passwordHash = await hashArgon2id(input.temporaryPassword);

    await executeAuditedMutation(ctx, async (tx) => {
      const updated = await tx.user.update({
        where: { id: existing.id },
        data: {
          passwordHash,
          mustChangePassword: true,
          tokenVersion: { increment: 1 },
        },
        select: {
          id: true,
          tokenVersion: true,
        },
      });

      return {
        result: updated,
        audit: {
          module: "SYSTEM" as const,
          action: "system:user:password_reset",
          entityType: "USER",
          entityId: existing.id,
          summary: `${ctx.fullName} menerbitkan kata sandi sementara baru untuk ${existing.fullName}`,
          oldValues: {
            mustChangePassword: existing.mustChangePassword,
          },
          newValues: {
            mustChangePassword: true,
            sessionRevoked: true,
          },
        },
        notifications: [
          {
            recipientId: existing.id,
            type: NotificationType.SYSTEM_ALERT,
            title: "Kata Sandi Direset oleh Admin",
            message:
              "Kata sandi akun Anda telah direset oleh Super Admin. Gunakan kata sandi sementara untuk masuk dan segera ganti sandi Anda.",
            actionUrl: "/",
          },
        ],
      };
    });

    revalidatePath("/system/users");

    return {
      data: {
        userId: existing.id,
        mustChangePassword: true,
        sessionRevoked: true,
      },
      message: `Kata sandi sementara untuk ${existing.fullName} berhasil diperbarui dan sesi aktif telah dicabut.`,
    };
  },
});

const deleteUserSchema = z.object({
  userId: z.string().uuid("ID pengguna tidak valid."),
});

export const deleteUserAction = createProtectedAction({
  permission: PERMISSIONS.SYSTEM_USER_MANAGE,
  schema: deleteUserSchema,
  handler: async ({ ctx, input }) => {
    const existing = await prisma.user.findFirst({
      where: { id: input.userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        fullName: true,
        isActive: true,
        role: {
          select: {
            code: true,
            name: true,
          },
        },
      },
    });

    if (!existing) {
      throw new DomainError("NOT_FOUND", "Akun pengguna tidak ditemukan.");
    }

    if (existing.id === ctx.userId) {
      throw new DomainError(
        "CONFLICT",
        "Anda tidak dapat menghapus akun Anda sendiri."
      );
    }

    if (existing.role.code === "SUPER_ADMIN") {
      const otherActiveAdminsCount = await prisma.user.count({
        where: {
          id: { not: existing.id },
          deletedAt: null,
          isActive: true,
          role: { code: "SUPER_ADMIN" },
        },
      });

      if (otherActiveAdminsCount < 1) {
        throw new DomainError(
          "CONFLICT",
          "Operasi ditolak: sistem wajib memiliki minimal 1 akun SUPER_ADMIN aktif."
        );
      }
    }

    const activeTasksWarning: ActiveTaskBriefDTO[] = await prisma.task.findMany({
      where: {
        assigneeId: existing.id,
        deletedAt: null,
        status: { in: ACTIVE_TASK_STATUSES },
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 25,
      select: {
        id: true,
        taskCode: true,
        title: true,
        status: true,
      },
    });

    const deleted = await executeAuditedMutation(ctx, async (tx) => {
      const now = new Date();
      const updated = await tx.user.update({
        where: { id: existing.id },
        data: {
          deletedAt: now,
          isActive: false,
          tokenVersion: { increment: 1 },
        },
        select: {
          id: true,
          fullName: true,
          deletedAt: true,
        },
      });

      return {
        result: updated,
        audit: {
          module: "SYSTEM" as const,
          action: "system:user:deleted",
          entityType: "USER",
          entityId: existing.id,
          summary: `${ctx.fullName} menghapus akun pengguna ${existing.fullName} (${existing.role.code})`,
          oldValues: {
            email: existing.email,
            fullName: existing.fullName,
            roleCode: existing.role.code,
            isActive: existing.isActive,
            deletedAt: null,
          },
          newValues: {
            isActive: false,
            deletedAt: updated.deletedAt?.toISOString() ?? now.toISOString(),
            sessionRevoked: true,
          },
        },
      };
    });

    revalidatePath("/system/users");
    revalidatePath("/team");
    revalidatePath(`/team/${existing.id}`);
    revalidatePath("/");

    const warningNote =
      activeTasksWarning.length > 0
        ? ` Catatan: user masih memiliki ${activeTasksWarning.length} task aktif yang perlu di-reassign.`
        : "";

    return {
      data: {
        id: deleted.id,
        activeTasksWarning,
      },
      message: `Akun ${deleted.fullName} berhasil dihapus dan sesi login langsung dicabut.${warningNote}`,
    };
  },
});
