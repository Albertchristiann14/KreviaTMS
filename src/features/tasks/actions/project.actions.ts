"use server";

import { revalidatePath } from "next/cache";
import { ProjectMemberRole, ProjectStatus, TaskStatus } from "@prisma/client";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { createProtectedAction } from "@/server/actions/safe-action";
import { prisma } from "@/server/db/prisma";
import { executeAuditedMutation } from "@/server/services/audit-logger";
import { DomainError } from "@/types/action-result";
import {
  createProjectSchema,
  deleteProjectSchema,
  manageProjectMembersSchema,
  updateProjectSchema,
} from "@/features/tasks/schemas/project.schema";
import { parseDateOnlyUtc } from "@/features/tasks/utils/date-wib";

function revalidateProjectRoutes(projectId?: string | null) {
  revalidatePath("/projects");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
  revalidatePath("/tasks/board");
  revalidatePath("/tasks/my-tasks");
  revalidatePath("/tasks/calendar");
  revalidatePath("/");
}

export const createProjectAction = createProtectedAction({
  permission: PERMISSIONS.TASKS_PROJECT_CREATE,
  schema: createProjectSchema,
  handler: async ({ ctx, input }) => {
    const existingCode = await prisma.project.findUnique({
      where: { code: input.code },
      select: { id: true, deletedAt: true },
    });

    if (existingCode) {
      throw new DomainError(
        "CONFLICT",
        `Kode proyek '${input.code}' sudah digunakan. Gunakan kode unik lainnya.`,
        { code: [`Kode '${input.code}' sudah terdaftar.`] }
      );
    }

    const memberRoleByUserId = new Map<string, ProjectMemberRole>();
    for (const member of input.members) {
      if (member.userId === ctx.userId) continue;
      memberRoleByUserId.set(
        member.userId,
        member.projectRole as ProjectMemberRole
      );
    }

    if (memberRoleByUserId.size > 0) {
      const validUsers = await prisma.user.findMany({
        where: {
          id: { in: Array.from(memberRoleByUserId.keys()) },
          isActive: true,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (validUsers.length !== memberRoleByUserId.size) {
        throw new DomainError(
          "VALIDATION_ERROR",
          "Sebagian anggota yang dipilih tidak ditemukan atau tidak aktif."
        );
      }
    }

    const startDate = parseDateOnlyUtc(input.startDate);
    const targetEndDate = parseDateOnlyUtc(input.targetEndDate);
    const status = input.status as ProjectStatus;

    const created = await executeAuditedMutation(ctx, async (tx) => {
      const project = await tx.project.create({
        data: {
          code: input.code,
          name: input.name,
          description: input.description ?? null,
          status,
          colorHex: input.colorHex,
          ownerId: ctx.userId,
          startDate,
          targetEndDate,
          archivedAt: status === ProjectStatus.ARCHIVED ? new Date() : null,
        },
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
          colorHex: true,
        },
      });

      const memberRows: Array<{
        projectId: string;
        userId: string;
        projectRole: ProjectMemberRole;
        addedBy: string;
      }> = [
        {
          projectId: project.id,
          userId: ctx.userId,
          projectRole: ProjectMemberRole.OWNER,
          addedBy: ctx.userId,
        },
      ];

      for (const [userId, projectRole] of memberRoleByUserId.entries()) {
        memberRows.push({
          projectId: project.id,
          userId,
          projectRole,
          addedBy: ctx.userId,
        });
      }

      await tx.projectMember.createMany({
        data: memberRows,
        skipDuplicates: true,
      });

      return {
        result: project,
        audit: {
          module: "TASKS",
          action: "tasks:project:created",
          entityType: "PROJECT",
          entityId: project.id,
          summary: `Proyek baru ${project.code} (${project.name}) dibuat`,
          newValues: {
            code: project.code,
            name: project.name,
            status: project.status,
            colorHex: project.colorHex,
            memberCount: memberRows.length,
          },
        },
      };
    });

    revalidateProjectRoutes(created.id);

    return {
      data: created,
      message: `Proyek "${created.name}" (${created.code}) berhasil dibuat.`,
    };
  },
});

export const updateProjectAction = createProtectedAction({
  permission: PERMISSIONS.TASKS_PROJECT_UPDATE,
  schema: updateProjectSchema,
  handler: async ({ ctx, input }) => {
    const existing = await prisma.project.findFirst({
      where: {
        id: input.projectId,
        deletedAt: null,
      },
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        status: true,
        colorHex: true,
        startDate: true,
        targetEndDate: true,
        archivedAt: true,
      },
    });

    if (!existing) {
      throw new DomainError("NOT_FOUND", "Proyek tidak ditemukan.");
    }

    const nextStatus = (input.status ?? existing.status) as ProjectStatus;

    if (
      nextStatus === ProjectStatus.ARCHIVED &&
      existing.status !== ProjectStatus.ARCHIVED
    ) {
      const activeTaskCount = await prisma.task.count({
        where: {
          projectId: existing.id,
          deletedAt: null,
          status: {
            in: [
              TaskStatus.TODO,
              TaskStatus.IN_PROGRESS,
              TaskStatus.IN_REVIEW,
              TaskStatus.REVISION,
            ],
          },
        },
      });

      if (activeTaskCount > 0 && !input.confirmArchiveWithActiveTasks) {
        throw new DomainError(
          "CONFLICT",
          `Proyek masih memiliki ${activeTaskCount} task aktif. Konfirmasi pengarsipan diperlukan agar task historis tetap terjaga.`
        );
      }
    }

    const nextStartDate =
      input.startDate !== undefined
        ? parseDateOnlyUtc(input.startDate)
        : existing.startDate;
    const nextEndDate =
      input.targetEndDate !== undefined
        ? parseDateOnlyUtc(input.targetEndDate)
        : existing.targetEndDate;

    if (nextStartDate && nextEndDate && nextEndDate < nextStartDate) {
      throw new DomainError(
        "VALIDATION_ERROR",
        "Tanggal target selesai tidak boleh lebih awal dari tanggal mulai.",
        {
          targetEndDate: [
            "Tanggal target selesai tidak boleh lebih awal dari tanggal mulai.",
          ],
        }
      );
    }

    const nextArchivedAt =
      nextStatus === ProjectStatus.ARCHIVED
        ? (existing.archivedAt ?? new Date())
        : null;

    const updated = await executeAuditedMutation(ctx, async (tx) => {
      const record = await tx.project.update({
        where: { id: existing.id },
        data: {
          name: input.name ?? existing.name,
          description:
            input.description !== undefined
              ? input.description
              : existing.description,
          status: nextStatus,
          colorHex: input.colorHex ?? existing.colorHex,
          startDate: nextStartDate,
          targetEndDate: nextEndDate,
          archivedAt: nextArchivedAt,
        },
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
          colorHex: true,
          archivedAt: true,
        },
      });

      return {
        result: record,
        audit: {
          module: "TASKS",
          action:
            nextStatus === ProjectStatus.ARCHIVED &&
            existing.status !== ProjectStatus.ARCHIVED
              ? "tasks:project:archived"
              : "tasks:project:updated",
          entityType: "PROJECT",
          entityId: record.id,
          summary: `Proyek ${record.code} diperbarui (${record.status})`,
          oldValues: {
            name: existing.name,
            status: existing.status,
            colorHex: existing.colorHex,
            startDate: existing.startDate?.toISOString().slice(0, 10) ?? null,
            targetEndDate:
              existing.targetEndDate?.toISOString().slice(0, 10) ?? null,
          },
          newValues: {
            name: record.name,
            status: record.status,
            colorHex: record.colorHex,
            startDate: nextStartDate?.toISOString().slice(0, 10) ?? null,
            targetEndDate: nextEndDate?.toISOString().slice(0, 10) ?? null,
          },
        },
      };
    });

    revalidateProjectRoutes(updated.id);

    return {
      data: updated,
      message:
        nextStatus === ProjectStatus.ARCHIVED
          ? `Proyek ${updated.code} berhasil diarsipkan.`
          : `Proyek "${updated.name}" berhasil diperbarui.`,
    };
  },
});

export interface ManageProjectMembersResult {
  projectId: string;
  userId: string;
  removed: boolean;
  projectRole?: ProjectMemberRole;
}

export const manageProjectMembersAction = createProtectedAction({
  permission: PERMISSIONS.TASKS_PROJECT_UPDATE,
  schema: manageProjectMembersSchema,
  handler: async ({
    ctx,
    input,
  }): Promise<{ data: ManageProjectMembersResult; message: string }> => {
    const project = await prisma.project.findFirst({
      where: {
        id: input.projectId,
        deletedAt: null,
      },
      select: {
        id: true,
        code: true,
        name: true,
        ownerId: true,
      },
    });

    if (!project) {
      throw new DomainError("NOT_FOUND", "Proyek tidak ditemukan.");
    }

    if (input.userId === project.ownerId) {
      throw new DomainError(
        "FORBIDDEN",
        "Pemilik proyek (Owner) dilindungi dan tidak dapat dihapus atau diubah perannya."
      );
    }

    if (input.operation === "REMOVE") {
      const existingMember = await prisma.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: project.id,
            userId: input.userId,
          },
        },
        select: {
          id: true,
          projectRole: true,
          user: { select: { fullName: true } },
        },
      });

      if (!existingMember) {
        throw new DomainError("NOT_FOUND", "Anggota proyek tidak ditemukan.");
      }

      if (existingMember.projectRole === ProjectMemberRole.OWNER) {
        throw new DomainError(
          "FORBIDDEN",
          "Anggota dengan peran OWNER tidak dapat dihapus."
        );
      }

      await executeAuditedMutation(ctx, async (tx) => {
        await tx.projectMember.delete({
          where: { id: existingMember.id },
        });

        return {
          result: { removedUserId: input.userId },
          audit: {
            module: "TASKS",
            action: "tasks:project_member:removed",
            entityType: "PROJECT",
            entityId: project.id,
            summary: `${existingMember.user.fullName} dikeluarkan dari proyek ${project.code}`,
            oldValues: {
              userId: input.userId,
              projectRole: existingMember.projectRole,
            },
          },
        };
      });

      revalidateProjectRoutes(project.id);
      return {
        data: { projectId: project.id, userId: input.userId, removed: true },
        message: `${existingMember.user.fullName} berhasil dikeluarkan dari proyek.`,
      };
    }

    const targetUser = await prisma.user.findFirst({
      where: {
        id: input.userId,
        isActive: true,
        deletedAt: null,
      },
      select: {
        id: true,
        fullName: true,
      },
    });

    if (!targetUser) {
      throw new DomainError(
        "VALIDATION_ERROR",
        "User tidak ditemukan atau berstatus nonaktif."
      );
    }

    const nextRole = input.projectRole as ProjectMemberRole;

    const upserted = await executeAuditedMutation(ctx, async (tx) => {
      const prev = await tx.projectMember.findUnique({
        where: {
          projectId_userId: {
            projectId: project.id,
            userId: targetUser.id,
          },
        },
        select: { projectRole: true },
      });

      const member = await tx.projectMember.upsert({
        where: {
          projectId_userId: {
            projectId: project.id,
            userId: targetUser.id,
          },
        },
        update: {
          projectRole: nextRole,
        },
        create: {
          projectId: project.id,
          userId: targetUser.id,
          projectRole: nextRole,
          addedBy: ctx.userId,
        },
        select: {
          id: true,
          userId: true,
          projectRole: true,
        },
      });

      return {
        result: member,
        audit: {
          module: "TASKS",
          action: prev
            ? "tasks:project_member:updated"
            : "tasks:project_member:added",
          entityType: "PROJECT",
          entityId: project.id,
          summary: `${targetUser.fullName} ditetapkan sebagai ${nextRole} di proyek ${project.code}`,
          oldValues: prev ? { projectRole: prev.projectRole } : null,
          newValues: { userId: targetUser.id, projectRole: nextRole },
        },
      };
    });

    revalidateProjectRoutes(project.id);
    return {
      data: {
        projectId: project.id,
        userId: upserted.userId,
        removed: false,
        projectRole: upserted.projectRole,
      },
      message: `Anggota ${targetUser.fullName} berhasil diperbarui sebagai ${nextRole}.`,
    };
  },
});

export interface DeleteProjectResult {
  id: string;
  detachedTaskCount: number;
}

export const deleteProjectAction = createProtectedAction({
  permission: PERMISSIONS.TASKS_PROJECT_DELETE,
  schema: deleteProjectSchema,
  handler: async ({
    ctx,
    input,
  }): Promise<{ data: DeleteProjectResult; message: string }> => {
    const deleted = await executeAuditedMutation(ctx, async (tx) => {
      const existing = await tx.project.findFirst({
        where: {
          id: input.projectId,
          deletedAt: null,
        },
        select: {
          id: true,
          code: true,
          name: true,
          status: true,
        },
      });

      if (!existing) {
        throw new DomainError("NOT_FOUND", "Proyek tidak ditemukan.");
      }

      const detachedTaskCount = await tx.task.count({
        where: {
          projectId: existing.id,
          deletedAt: null,
        },
      });

      if (detachedTaskCount > 0) {
        await tx.task.updateMany({
          where: {
            projectId: existing.id,
            deletedAt: null,
          },
          data: {
            projectId: null,
          },
        });
      }

      await tx.project.update({
        where: { id: existing.id },
        data: {
          deletedAt: new Date(),
        },
      });

      return {
        result: {
          id: existing.id,
          code: existing.code,
          name: existing.name,
          detachedTaskCount,
        },
        audit: {
          module: "TASKS",
          action: "tasks:project:deleted",
          entityType: "PROJECT",
          entityId: existing.id,
          summary: `Proyek ${existing.code} (${existing.name}) dihapus (${detachedTaskCount} task dilepas menjadi standalone)`,
          oldValues: {
            code: existing.code,
            name: existing.name,
            status: existing.status,
          },
          newValues: {
            deletedAt: true,
            detachedTaskCount,
          },
        },
      };
    });

    revalidateProjectRoutes(deleted.id);

    return {
      data: {
        id: deleted.id,
        detachedTaskCount: deleted.detachedTaskCount,
      },
      message:
        deleted.detachedTaskCount > 0
          ? `Proyek "${deleted.name}" (${deleted.code}) dihapus. ${deleted.detachedTaskCount} task tetap dipertahankan sebagai task standalone.`
          : `Proyek "${deleted.name}" (${deleted.code}) berhasil dihapus.`,
    };
  },
});
