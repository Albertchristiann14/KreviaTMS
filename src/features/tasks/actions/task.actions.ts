"use server";

import { revalidatePath } from "next/cache";
import {
  AssetSourceType,
  DesignSubmissionStatus,
  NotificationType,
  Prisma,
  ProjectStatus,
  TaskPriority,
  TaskStatus,
  TaskType,
} from "@prisma/client";
import {
  hasAnyPermission,
  hasPermission,
  PERMISSIONS,
} from "@/lib/constants/permissions";
import { validateSafeExternalHttpsUrl } from "@/lib/validations/common";
import { createProtectedAction } from "@/server/actions/safe-action";
import { prisma } from "@/server/db/prisma";
import { executeAuditedMutation, writeAuditLog } from "@/server/services/audit-logger";
import {
  dispatchNotifications,
  type NotificationDraft,
} from "@/server/services/notification-dispatcher";
import { validateStorageKeyPath } from "@/server/storage/presigned";
import { DomainError } from "@/types/action-result";
import {
  addTaskAttachmentSchema,
  addTaskChecklistItemSchema,
  addTaskCommentSchema,
  createTaskSchema,
  deleteTaskChecklistItemSchema,
  moveKanbanTaskSchema,
  softDeleteTaskSchema,
  toggleTaskChecklistSchema,
  updateTaskSchema,
} from "@/features/tasks/schemas/task.schema";
import {
  resolveKanbanTargetPosition,
  spawnLinkedTask,
} from "@/features/tasks/services/task.service";
import {
  mapTaskRowToBoardCardDto,
  TASK_BOARD_CARD_SELECT,
} from "@/features/tasks/queries/task-mappers";
import type {
  TaskAttachmentDto,
  TaskBoardCardDto,
  TaskChecklistItemDto,
  TaskCommentDto,
} from "@/features/tasks/types";
import {
  parseDateOnlyUtc,
  parseDueDateWib,
} from "@/features/tasks/utils/date-wib";

function revalidateTaskRoutes(projectId?: string) {
  revalidatePath("/tasks/board");
  revalidatePath("/tasks/my-tasks");
  revalidatePath("/tasks/calendar");
  revalidatePath("/projects");
  if (projectId) {
    revalidatePath(`/projects/${projectId}`);
  }
  revalidatePath("/");
}

/**
 * Extracts `@mention` tokens from comment body and resolves matching active user IDs.
 */
async function resolveMentionedUserIds(
  body: string,
  explicitIds: readonly string[]
): Promise<string[]> {
  const resultIds = new Set<string>(explicitIds);
  const mentionMatches = Array.from(body.matchAll(/@([a-zA-Z0-9._-]{2,50})/g));
  const tokens = mentionMatches
    .map((m) => m[1]?.toLowerCase())
    .filter((t): t is string => Boolean(t));

  if (tokens.length === 0) {
    return Array.from(resultIds);
  }

  const activeUsers = await prisma.user.findMany({
    where: {
      isActive: true,
      deletedAt: null,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      displayName: true,
    },
  });

  for (const user of activeUsers) {
    const emailLocal = user.email.split("@")[0]?.toLowerCase() ?? "";
    const displaySlug =
      user.displayName?.toLowerCase().replace(/\s+/g, "") ?? "";
    const fullSlug = user.fullName.toLowerCase().replace(/\s+/g, "");
    const firstName = user.fullName.split(/\s+/)[0]?.toLowerCase() ?? "";

    const matched = tokens.some(
      (token) =>
        token === emailLocal ||
        (displaySlug.length > 0 && token === displaySlug) ||
        token === fullSlug ||
        (firstName.length >= 2 && token === firstName)
    );

    if (matched) {
      resultIds.add(user.id);
    }
  }

  return Array.from(resultIds);
}

export const createTaskAction = createProtectedAction({
  permission: PERMISSIONS.TASKS_ITEM_CREATE,
  schema: createTaskSchema,
  handler: async ({ ctx, input }) => {
    const project = await prisma.project.findFirst({
      where: {
        id: input.projectId,
        deletedAt: null,
      },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
        ownerId: true,
        members: {
          where: { userId: ctx.userId },
          select: { userId: true },
        },
      },
    });

    if (!project) {
      throw new DomainError("NOT_FOUND", "Proyek tidak ditemukan.");
    }

    if (project.status === ProjectStatus.ARCHIVED) {
      throw new DomainError(
        "INVALID_STATE_TRANSITION",
        "Tidak dapat membuat task baru pada proyek yang sudah diarsipkan."
      );
    }

    const canAssignOthers = hasPermission(
      ctx.permissions,
      PERMISSIONS.TASKS_ITEM_ASSIGN,
      ctx.roleCode
    );
    const isProjectParticipant =
      project.ownerId === ctx.userId || project.members.length > 0;

    if (!canAssignOthers && !isProjectParticipant) {
      throw new DomainError(
        "FORBIDDEN",
        "Anda hanya dapat membuat task pada proyek yang Anda ikuti."
      );
    }

    const targetAssigneeId = input.assigneeId ?? null;
    if (!canAssignOthers && targetAssigneeId && targetAssigneeId !== ctx.userId) {
      throw new DomainError(
        "FORBIDDEN",
        "Anda tidak memiliki izin menugaskan task kepada anggota lain.",
        {
          assigneeId: [
            "Peran Anda hanya dapat membuat task untuk diri sendiri atau ke Backlog.",
          ],
        }
      );
    }

    if (targetAssigneeId) {
      const assigneeUser = await prisma.user.findFirst({
        where: {
          id: targetAssigneeId,
          isActive: true,
          deletedAt: null,
        },
        select: { id: true },
      });
      if (!assigneeUser) {
        throw new DomainError(
          "VALIDATION_ERROR",
          "Assignee tidak ditemukan atau sudah tidak aktif.",
          { assigneeId: ["Pilih anggota tim yang masih aktif."] }
        );
      }
    }

    let resolvedReviewerId = input.reviewerId ?? null;
    if (resolvedReviewerId) {
      const reviewerUser = await prisma.user.findFirst({
        where: {
          id: resolvedReviewerId,
          isActive: true,
          deletedAt: null,
        },
        select: { id: true },
      });
      if (!reviewerUser) {
        throw new DomainError(
          "VALIDATION_ERROR",
          "Reviewer yang dipilih tidak aktif.",
          { reviewerId: ["Reviewer harus user aktif."] }
        );
      }
    } else if (input.requiresReview) {
      resolvedReviewerId = project.ownerId;
    }

    const parsedDueDate = parseDueDateWib(input.dueDate);
    const parsedStartDate = parseDateOnlyUtc(input.startDate);

    if (input.status !== "BACKLOG" && !parsedDueDate) {
      throw new DomainError(
        "VALIDATION_ERROR",
        "Due date tidak valid atau wajib diisi untuk task aktif.",
        { dueDate: ["Tenggat waktu wajib diisi."] }
      );
    }

    const createdCard = await prisma.$transaction(
      async (tx) => {
        const created = await spawnLinkedTask(tx, {
          projectId: project.id,
          title: input.title,
          description: input.description ?? null,
          taskType: input.taskType as TaskType,
          status: input.status as Extract<
            TaskStatus,
            "BACKLOG" | "TODO" | "IN_PROGRESS"
          >,
          priority: input.priority as TaskPriority,
          requiresReview: input.requiresReview,
          assigneeId: targetAssigneeId,
          reporterId: ctx.userId,
          actorId: ctx.userId,
          reviewerId: resolvedReviewerId,
          contentItemId: input.contentItemId ?? null,
          designBriefId: input.designBriefId ?? null,
          startDate: parsedStartDate,
          dueDate: parsedDueDate,
          estimatedHours: input.estimatedHours ?? null,
          tags: input.tags,
          auditModule: "TASKS",
        });

        if (input.checklists.length > 0) {
          await tx.taskChecklist.createMany({
            data: input.checklists.map((item, idx) => ({
              taskId: created.id,
              title: item.title.trim().slice(0, 255),
              sortOrder: idx,
            })),
          });
        }

        const fullRow = await tx.task.findUniqueOrThrow({
          where: { id: created.id },
          select: TASK_BOARD_CARD_SELECT,
        });

        return mapTaskRowToBoardCardDto(fullRow);
      },
      { maxWait: 10_000, timeout: 25_000 }
    );

    revalidateTaskRoutes(project.id);

    return {
      data: createdCard,
      message: `Task ${createdCard.taskCode} berhasil dibuat.`,
    };
  },
});

export const updateTaskAction = createProtectedAction({
  permission: PERMISSIONS.TASKS_ITEM_UPDATE,
  schema: updateTaskSchema,
  handler: async ({ ctx, input }): Promise<{ data: TaskBoardCardDto; message: string }> => {
    const existing = await prisma.task.findFirst({
      where: {
        id: input.taskId,
        deletedAt: null,
        project: { deletedAt: null },
      },
      select: {
        id: true,
        taskCode: true,
        projectId: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        version: true,
        requiresReview: true,
        assigneeId: true,
        reporterId: true,
        reviewerId: true,
        startDate: true,
        dueDate: true,
        completedAt: true,
        firstSubmittedAt: true,
        revisionCount: true,
        estimatedHours: true,
        actualHours: true,
        tags: true,
      },
    });

    if (!existing) {
      throw new DomainError("NOT_FOUND", "Task tidak ditemukan.");
    }

    const canAssign = hasPermission(
      ctx.permissions,
      PERMISSIONS.TASKS_ITEM_ASSIGN,
      ctx.roleCode
    );
    const canApprove = hasPermission(
      ctx.permissions,
      PERMISSIONS.TASKS_ITEM_APPROVE,
      ctx.roleCode
    );
    const isAssigneeOrReporter =
      existing.assigneeId === ctx.userId || existing.reporterId === ctx.userId;

    if (!canAssign && !canApprove && !isAssigneeOrReporter) {
      throw new DomainError(
        "FORBIDDEN",
        "Anda tidak memiliki akses untuk mengubah detail task ini."
      );
    }

    if (
      input.expectedVersion !== undefined &&
      existing.version !== input.expectedVersion
    ) {
      throw new DomainError(
        "CONFLICT",
        "Task baru saja diperbarui oleh anggota lain. Muat ulang data terbaru."
      );
    }

    // Reassignment check
    const isChangingAssignee =
      input.assigneeId !== undefined && input.assigneeId !== existing.assigneeId;

    if (isChangingAssignee) {
      if (!canAssign) {
        throw new DomainError(
          "FORBIDDEN",
          "Hanya Project Manager atau Super Admin yang dapat mengalihkan assignee task."
        );
      }

      if (input.assigneeId) {
        const nextAssignee = await prisma.user.findFirst({
          where: {
            id: input.assigneeId,
            isActive: true,
            deletedAt: null,
          },
          select: { id: true },
        });
        if (!nextAssignee) {
          throw new DomainError(
            "VALIDATION_ERROR",
            "Assignee baru tidak ditemukan atau nonaktif."
          );
        }
      }
    }

    // Due date tampering protection (FR-A07):
    // Block STAFF_CREATOR / DESIGNER from changing dueDate on tasks they did not report unless they hold assign/approve permissions
    const nextDueDate =
      input.dueDate !== undefined
        ? parseDueDateWib(input.dueDate)
        : existing.dueDate;

    const dueDateChanged =
      (nextDueDate?.getTime() ?? null) !== (existing.dueDate?.getTime() ?? null);

    if (dueDateChanged) {
      const canEditDueDate =
        hasAnyPermission(
          ctx.permissions,
          [PERMISSIONS.TASKS_ITEM_ASSIGN, PERMISSIONS.TASKS_ITEM_APPROVE],
          ctx.roleCode
        ) || existing.reporterId === ctx.userId;

      if (!canEditDueDate) {
        throw new DomainError(
          "FORBIDDEN",
          "Anda tidak diizinkan mengubah tenggat waktu (due date) task yang ditugaskan oleh PM/Admin."
        );
      }
    }

    const nextStartDate =
      input.startDate !== undefined
        ? parseDateOnlyUtc(input.startDate)
        : existing.startDate;

    if (nextStartDate && nextDueDate && nextDueDate < nextStartDate) {
      throw new DomainError(
        "VALIDATION_ERROR",
        "Due date tidak boleh lebih awal dari tanggal mulai."
      );
    }

    const nextAssigneeId =
      input.assigneeId !== undefined ? input.assigneeId : existing.assigneeId;
    const nextReviewerId =
      input.reviewerId !== undefined ? input.reviewerId : existing.reviewerId;

    let nextIsOnTime: boolean | null | undefined = undefined;
    if (dueDateChanged && existing.status === TaskStatus.DONE && existing.completedAt) {
      const effectiveCompletionTime =
        existing.revisionCount === 0
          ? (existing.firstSubmittedAt ?? existing.completedAt)
          : existing.completedAt;
      nextIsOnTime = nextDueDate
        ? effectiveCompletionTime.getTime() <= nextDueDate.getTime()
        : null;
    }

    const updatedCard = await executeAuditedMutation(ctx, async (tx) => {
      const whereLock: Prisma.TaskWhereInput = {
        id: existing.id,
        deletedAt: null,
        ...(input.expectedVersion !== undefined
          ? { version: input.expectedVersion }
          : {}),
      };

      const res = await tx.task.updateMany({
        where: whereLock,
        data: {
          title: input.title ?? existing.title,
          description:
            input.description !== undefined
              ? input.description
              : existing.description,
          priority: (input.priority ?? existing.priority) as TaskPriority,
          requiresReview:
            input.requiresReview !== undefined
              ? input.requiresReview
              : existing.requiresReview,
          assigneeId: nextAssigneeId,
          reviewerId: nextReviewerId,
          startDate: nextStartDate,
          dueDate: nextDueDate,
          ...(nextIsOnTime !== undefined ? { isOnTime: nextIsOnTime } : {}),
          estimatedHours:
            input.estimatedHours !== undefined
              ? input.estimatedHours !== null
                ? new Prisma.Decimal(input.estimatedHours)
                : null
              : existing.estimatedHours,
          actualHours:
            input.actualHours !== undefined
              ? input.actualHours !== null
                ? new Prisma.Decimal(input.actualHours)
                : null
              : existing.actualHours,
          tags: input.tags ?? existing.tags,
          version: { increment: 1 },
        },
      });

      if (res.count === 0) {
        throw new DomainError(
          "CONFLICT",
          "Task telah dimodifikasi oleh pengguna lain. Sinkronkan ulang data."
        );
      }

      const refreshed = await tx.task.findUniqueOrThrow({
        where: { id: existing.id },
        select: TASK_BOARD_CARD_SELECT,
      });

      const notifications: NotificationDraft[] = [];
      if (isChangingAssignee) {
        if (nextAssigneeId) {
          notifications.push({
            recipientId: nextAssigneeId,
            type: NotificationType.TASK_REASSIGNED,
            title: `Task Dialihkan Kepada Anda: ${existing.taskCode}`,
            message: `Anda sekarang menjadi penanggung jawab task "${refreshed.title}"${
              input.reassignReason ? ` (Alasan: ${input.reassignReason})` : ""
            }.`,
            entityType: "TASK",
            entityId: existing.id,
            actionUrl: `/tasks/board?drawer=task&id=${existing.id}`,
            metadata: {
              taskCode: existing.taskCode,
              oldAssigneeId: existing.assigneeId,
              newAssigneeId: nextAssigneeId,
              reason: input.reassignReason ?? null,
            },
          });
        }
        if (existing.assigneeId) {
          notifications.push({
            recipientId: existing.assigneeId,
            type: NotificationType.TASK_REASSIGNED,
            title: `Task Dialihkan: ${existing.taskCode}`,
            message: `Task "${refreshed.title}" telah dialihkan kepada anggota tim lain${
              input.reassignReason ? ` (${input.reassignReason})` : ""
            }.`,
            entityType: "TASK",
            entityId: existing.id,
            actionUrl: `/tasks/board?drawer=task&id=${existing.id}`,
            metadata: {
              taskCode: existing.taskCode,
              oldAssigneeId: existing.assigneeId,
              newAssigneeId: nextAssigneeId,
              reason: input.reassignReason ?? null,
            },
          });
        }
      } else if (dueDateChanged && nextAssigneeId) {
        notifications.push({
          recipientId: nextAssigneeId,
          type: NotificationType.TASK_STATUS_CHANGED,
          title: `Perubahan Tenggat Task: ${existing.taskCode}`,
          message: `Tenggat waktu task "${refreshed.title}" telah diperbarui.`,
          entityType: "TASK",
          entityId: existing.id,
          actionUrl: `/tasks/board?drawer=task&id=${existing.id}`,
        });
      }

      return {
        result: mapTaskRowToBoardCardDto(refreshed),
        audit: {
          module: "TASKS",
          action: isChangingAssignee
            ? "tasks:item:reassigned"
            : "tasks:item:updated",
          entityType: "TASK",
          entityId: existing.id,
          summary: `Task ${existing.taskCode} diperbarui`,
          oldValues: {
            title: existing.title,
            priority: existing.priority,
            assigneeId: existing.assigneeId,
            dueDate: existing.dueDate?.toISOString() ?? null,
          },
          newValues: {
            title: refreshed.title,
            priority: refreshed.priority,
            assigneeId: nextAssigneeId,
            dueDate: nextDueDate?.toISOString() ?? null,
            reassignReason: input.reassignReason ?? null,
          },
        },
        notifications,
      };
    });

    revalidateTaskRoutes(existing.projectId);

    return {
      data: updatedCard,
      message: `Task ${updatedCard.taskCode} berhasil diperbarui.`,
    };
  },
});

export const moveKanbanTaskAction = createProtectedAction({
  permission: PERMISSIONS.TASKS_ITEM_UPDATE,
  schema: moveKanbanTaskSchema,
  handler: async ({ ctx, input }): Promise<{ data: TaskBoardCardDto; message: string }> => {
    const targetStatus = input.targetStatus as TaskStatus;

    const existing = await prisma.task.findFirst({
      where: {
        id: input.taskId,
        deletedAt: null,
        project: { deletedAt: null },
      },
      select: {
        id: true,
        taskCode: true,
        projectId: true,
        title: true,
        taskType: true,
        status: true,
        position: true,
        version: true,
        requiresReview: true,
        assigneeId: true,
        reporterId: true,
        reviewerId: true,
        startedAt: true,
        firstSubmittedAt: true,
        dueDate: true,
        completedAt: true,
        isOnTime: true,
        revisionCount: true,
        designBriefId: true,
        project: {
          select: {
            id: true,
            ownerId: true,
            members: {
              where: { userId: ctx.userId },
              select: { userId: true },
            },
          },
        },
        designBrief: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    });

    if (!existing) {
      throw new DomainError("NOT_FOUND", "Task tidak ditemukan.");
    }

    const hasManageScope = hasAnyPermission(
      ctx.permissions,
      [PERMISSIONS.TASKS_ITEM_ASSIGN, PERMISSIONS.TASKS_ITEM_APPROVE],
      ctx.roleCode
    );
    const isTaskOwnerOrParticipant =
      existing.assigneeId === ctx.userId ||
      existing.reporterId === ctx.userId ||
      existing.reviewerId === ctx.userId;

    if (!hasManageScope && !isTaskOwnerOrParticipant) {
      throw new DomainError(
        "FORBIDDEN",
        "Anda hanya dapat memindahkan task yang ditugaskan atau dilaporkan oleh Anda."
      );
    }

    if (existing.version !== input.expectedVersion) {
      throw new DomainError(
        "CONFLICT",
        "Task baru saja diperbarui oleh anggota tim lain. Board disinkronkan ulang."
      );
    }

    const isSameColumnReorder = existing.status === targetStatus;
    const canApprove = hasPermission(
      ctx.permissions,
      PERMISSIONS.TASKS_ITEM_APPROVE,
      ctx.roleCode
    );

    if (!isSameColumnReorder) {
      // Leaving Backlog requires an assignee (unless cancelling)
      if (
        existing.status === TaskStatus.BACKLOG &&
        targetStatus !== TaskStatus.CANCELLED &&
        !existing.assigneeId
      ) {
        throw new DomainError(
          "INVALID_STATE_TRANSITION",
          "Tetapkan assignee terlebih dahulu sebelum memindahkan task keluar dari Backlog."
        );
      }

      // Leaving DONE (Reopen) requires approve permission
      if (existing.status === TaskStatus.DONE && !canApprove) {
        throw new DomainError(
          "FORBIDDEN",
          "Hanya Project Manager atau Super Admin yang dapat membuka kembali task yang sudah Done."
        );
      }

      // IN_REVIEW -> DONE or IN_REVIEW -> REVISION requires tasks:item:approve unless personal non-review task
      if (
        existing.status === TaskStatus.IN_REVIEW &&
        (targetStatus === TaskStatus.DONE ||
          targetStatus === TaskStatus.REVISION)
      ) {
        const allowSelfClose =
          existing.requiresReview === false &&
          existing.taskType === TaskType.GENERAL &&
          existing.assigneeId === ctx.userId;

        if (!canApprove && !allowSelfClose) {
          throw new DomainError(
            "FORBIDDEN",
            "Transisi dari In Review ke Done atau Revision membutuhkan izin approval (Project Manager / Super Admin)."
          );
        }
      }

      // Direct move to DONE from TODO/IN_PROGRESS/REVISION when requiresReview is enabled
      if (
        targetStatus === TaskStatus.DONE &&
        existing.status !== TaskStatus.IN_REVIEW &&
        existing.requiresReview &&
        !canApprove
      ) {
        throw new DomainError(
          "INVALID_STATE_TRANSITION",
          "Task ini memerlukan review. Pindahkan ke kolom In Review terlebih dahulu."
        );
      }

      // DESIGN_TASK integrity with Modul C Design Approval
      if (
        targetStatus === TaskStatus.DONE &&
        existing.taskType === TaskType.DESIGN_TASK &&
        existing.designBrief &&
        existing.designBrief.status !== DesignSubmissionStatus.APPROVED
      ) {
        throw new DomainError(
          "INVALID_STATE_TRANSITION",
          "Task desain wajib disetujui melalui antrean Design Review agar Asset Library dan status konten tersinkronisasi."
        );
      }

      // Moving to REVISION requires >= 10 char feedback
      if (targetStatus === TaskStatus.REVISION) {
        const notes = input.revisionNotes?.trim() ?? "";
        if (notes.length < 10) {
          throw new DomainError(
            "VALIDATION_ERROR",
            "Catatan revisi wajib diisi minimal 10 karakter saat mengembalikan task ke Revision.",
            {
              revisionNotes: ["Catatan revisi wajib minimal 10 karakter."],
            }
          );
        }
      }

      // Cancelling requires approve permission or reporter ownership
      if (
        targetStatus === TaskStatus.CANCELLED &&
        !canApprove &&
        existing.reporterId !== ctx.userId
      ) {
        throw new DomainError(
          "FORBIDDEN",
          "Anda tidak memiliki izin membatalkan task ini."
        );
      }
    }

    const now = new Date();
    const nextStartedAt =
      !isSameColumnReorder && targetStatus === TaskStatus.IN_PROGRESS
        ? (existing.startedAt ?? now)
        : existing.startedAt;
    const nextFirstSubmittedAt =
      !isSameColumnReorder && targetStatus === TaskStatus.IN_REVIEW
        ? (existing.firstSubmittedAt ?? now)
        : existing.firstSubmittedAt;
    const nextRevisionCount =
      !isSameColumnReorder && targetStatus === TaskStatus.REVISION
        ? existing.revisionCount + 1
        : existing.revisionCount;

    let nextCompletedAt: Date | null = existing.completedAt;
    let nextIsOnTime: boolean | null = existing.isOnTime;

    if (!isSameColumnReorder) {
      if (targetStatus === TaskStatus.DONE) {
        const completedAt = now;
        const effectiveCompletionTime =
          nextRevisionCount === 0
            ? (nextFirstSubmittedAt ?? completedAt)
            : completedAt;
        nextCompletedAt = completedAt;
        nextIsOnTime = existing.dueDate
          ? effectiveCompletionTime.getTime() <= existing.dueDate.getTime()
          : null;
      } else if (
        existing.status === TaskStatus.DONE ||
        targetStatus === TaskStatus.CANCELLED
      ) {
        nextCompletedAt = null;
        nextIsOnTime = null;
      }
    } else if (targetStatus === TaskStatus.DONE && !existing.completedAt) {
      nextCompletedAt = now;
    }

    const movedCard = await executeAuditedMutation(ctx, async (tx) => {
      const hasNeighborHint =
        input.prevTaskId !== undefined ||
        input.nextTaskId !== undefined ||
        input.prevPos !== undefined ||
        input.nextPos !== undefined;

      const resolvedPosition = hasNeighborHint
        ? await resolveKanbanTargetPosition(tx, {
            projectId: existing.projectId,
            status: targetStatus,
            prevTaskId: input.prevTaskId ?? null,
            nextTaskId: input.nextTaskId ?? null,
            prevPos: input.prevPos ?? null,
            nextPos: input.nextPos ?? null,
          })
        : input.targetPosition !== undefined
          ? input.targetPosition
          : await resolveKanbanTargetPosition(tx, {
              projectId: existing.projectId,
              status: targetStatus,
            });

      const lockResult = await tx.task.updateMany({
        where: {
          id: existing.id,
          version: input.expectedVersion,
          deletedAt: null,
        },
        data: {
          status: targetStatus,
          position: resolvedPosition,
          version: { increment: 1 },
          startedAt: nextStartedAt,
          firstSubmittedAt: nextFirstSubmittedAt,
          completedAt: nextCompletedAt,
          isOnTime: nextIsOnTime,
          revisionCount: nextRevisionCount,
        },
      });

      if (lockResult.count === 0) {
        throw new DomainError(
          "CONFLICT",
          "Task baru saja diperbarui oleh anggota tim lain. Board disinkronkan ulang."
        );
      }

      if (
        !isSameColumnReorder &&
        targetStatus === TaskStatus.IN_PROGRESS &&
        existing.taskType === TaskType.DESIGN_TASK &&
        existing.designBriefId &&
        existing.designBrief?.status === DesignSubmissionStatus.PENDING_BRIEF
      ) {
        await tx.designBrief.update({
          where: { id: existing.designBriefId },
          data: { status: DesignSubmissionStatus.IN_PROGRESS },
        });
      }

      if (
        !isSameColumnReorder &&
        targetStatus === TaskStatus.REVISION &&
        input.revisionNotes?.trim()
      ) {
        await tx.taskComment.create({
          data: {
            taskId: existing.id,
            authorId: ctx.userId,
            body: `[Permintaan Revisi] ${input.revisionNotes.trim()}`,
            mentionedUserIds: existing.assigneeId ? [existing.assigneeId] : [],
          },
        });
      }

      const refreshed = await tx.task.findUniqueOrThrow({
        where: { id: existing.id },
        select: TASK_BOARD_CARD_SELECT,
      });

      const notifications: NotificationDraft[] = [];
      if (!isSameColumnReorder) {
        if (targetStatus === TaskStatus.IN_REVIEW) {
          const reviewerTarget =
            existing.reviewerId ?? existing.project.ownerId;
          if (reviewerTarget) {
            notifications.push({
              recipientId: reviewerTarget,
              type: NotificationType.TASK_SUBMITTED_REVIEW,
              title: `Siap Direview: ${existing.taskCode}`,
              message: `Task "${existing.title}" telah diserahkan untuk review.`,
              entityType: "TASK",
              entityId: existing.id,
              actionUrl: `/tasks/board?drawer=task&id=${existing.id}`,
            });
          }
        } else if (targetStatus === TaskStatus.REVISION && existing.assigneeId) {
          notifications.push({
            recipientId: existing.assigneeId,
            type: NotificationType.TASK_REVISION_REQUESTED,
            title: `Revisi Diminta: ${existing.taskCode}`,
            message: `Task "${existing.title}" memerlukan revisi: ${input.revisionNotes?.trim()}`,
            entityType: "TASK",
            entityId: existing.id,
            actionUrl: `/tasks/board?drawer=task&id=${existing.id}`,
            metadata: {
              revisionCount: nextRevisionCount,
              revisionNotes: input.revisionNotes?.trim() ?? null,
            },
          });
        } else if (targetStatus === TaskStatus.DONE && existing.assigneeId) {
          notifications.push({
            recipientId: existing.assigneeId,
            type: NotificationType.TASK_COMPLETED,
            title: `Task Selesai: ${existing.taskCode}`,
            message: `Task "${existing.title}" telah disetujui dan berstatus DONE.`,
            entityType: "TASK",
            entityId: existing.id,
            actionUrl: `/tasks/board?drawer=task&id=${existing.id}`,
            metadata: {
              isOnTime: nextIsOnTime,
            },
          });
        } else if (existing.assigneeId) {
          notifications.push({
            recipientId: existing.assigneeId,
            type: NotificationType.TASK_STATUS_CHANGED,
            title: `Status Task Berubah: ${existing.taskCode}`,
            message: `Task "${existing.title}" berpindah dari ${existing.status} ke ${targetStatus}.`,
            entityType: "TASK",
            entityId: existing.id,
            actionUrl: `/tasks/board?drawer=task&id=${existing.id}`,
          });
        }
      }

      return {
        result: mapTaskRowToBoardCardDto(refreshed),
        audit: {
          module: "TASKS",
          action: isSameColumnReorder
            ? "tasks:item:reordered"
            : `tasks:item:moved_${targetStatus.toLowerCase()}`,
          entityType: "TASK",
          entityId: existing.id,
          summary: isSameColumnReorder
            ? `Urutan task ${existing.taskCode} di kolom ${targetStatus} diperbarui`
            : `Task ${existing.taskCode} dipindahkan dari ${existing.status} ke ${targetStatus}`,
          oldValues: {
            status: existing.status,
            position: existing.position,
            revisionCount: existing.revisionCount,
          },
          newValues: {
            status: targetStatus,
            position: resolvedPosition,
            revisionCount: nextRevisionCount,
            isOnTime: nextIsOnTime,
            revisionNotes: input.revisionNotes?.trim() ?? null,
            reason: input.cancelOrReopenReason?.trim() ?? null,
          },
        },
        notifications,
      };
    });

    revalidateTaskRoutes(existing.projectId);

    return {
      data: movedCard,
      message: isSameColumnReorder
        ? `Urutan task ${movedCard.taskCode} diperbarui.`
        : `Status task berhasil dipindahkan ke ${targetStatus}.`,
    };
  },
});

export const toggleTaskChecklistAction = createProtectedAction({
  permission: PERMISSIONS.TASKS_ITEM_UPDATE,
  schema: toggleTaskChecklistSchema,
  handler: async ({ ctx, input }): Promise<{ data: TaskChecklistItemDto; message: string }> => {
    const checklist = await prisma.taskChecklist.findUnique({
      where: { id: input.checklistId },
      select: {
        id: true,
        taskId: true,
        title: true,
        isCompleted: true,
        sortOrder: true,
        task: {
          select: {
            id: true,
            taskCode: true,
            projectId: true,
            assigneeId: true,
            reporterId: true,
            deletedAt: true,
            project: {
              select: {
                ownerId: true,
                members: {
                  where: { userId: ctx.userId },
                  select: { userId: true },
                },
              },
            },
          },
        },
      },
    });

    if (!checklist || checklist.task.deletedAt) {
      throw new DomainError("NOT_FOUND", "Item checklist tidak ditemukan.");
    }

    const canManage = hasAnyPermission(
      ctx.permissions,
      [PERMISSIONS.TASKS_ITEM_ASSIGN, PERMISSIONS.TASKS_ITEM_APPROVE],
      ctx.roleCode
    );
    const isTaskParticipant =
      checklist.task.assigneeId === ctx.userId ||
      checklist.task.reporterId === ctx.userId ||
      checklist.task.project.ownerId === ctx.userId ||
      checklist.task.project.members.length > 0;

    if (!canManage && !isTaskParticipant) {
      throw new DomainError(
        "FORBIDDEN",
        "Anda tidak memiliki izin mengubah checklist pada task ini."
      );
    }

    const updatedItem = await executeAuditedMutation(ctx, async (tx) => {
      const updated = await tx.taskChecklist.update({
        where: { id: checklist.id },
        data: {
          isCompleted: input.isCompleted,
          completedBy: input.isCompleted ? ctx.userId : null,
          completedAt: input.isCompleted ? new Date() : null,
        },
        select: {
          id: true,
          taskId: true,
          title: true,
          isCompleted: true,
          completedBy: true,
          completedAt: true,
          sortOrder: true,
          completer: {
            select: { fullName: true },
          },
        },
      });

      return {
        result: {
          id: updated.id,
          taskId: updated.taskId,
          title: updated.title,
          isCompleted: updated.isCompleted,
          completedBy: updated.completedBy,
          completerName: updated.completer?.fullName ?? null,
          completedAt: updated.completedAt
            ? updated.completedAt.toISOString()
            : null,
          sortOrder: updated.sortOrder,
        },
        audit: {
          module: "TASKS",
          action: "tasks:checklist:toggled",
          entityType: "TASK",
          entityId: checklist.taskId,
          summary: `Checklist "${checklist.title}" pada ${checklist.task.taskCode} ditandai ${
            input.isCompleted ? "selesai" : "belum selesai"
          }`,
          oldValues: { isCompleted: checklist.isCompleted },
          newValues: { isCompleted: input.isCompleted },
        },
      };
    });

    revalidateTaskRoutes(checklist.task.projectId);

    return {
      data: updatedItem,
      message: input.isCompleted
        ? "Item checklist selesai."
        : "Item checklist dibuka kembali.",
    };
  },
});

export const addTaskChecklistItemAction = createProtectedAction({
  permission: PERMISSIONS.TASKS_ITEM_UPDATE,
  schema: addTaskChecklistItemSchema,
  handler: async ({ ctx, input }): Promise<{ data: TaskChecklistItemDto; message: string }> => {
    const task = await prisma.task.findFirst({
      where: {
        id: input.taskId,
        deletedAt: null,
        project: { deletedAt: null },
      },
      select: {
        id: true,
        taskCode: true,
        projectId: true,
        assigneeId: true,
        reporterId: true,
        project: {
          select: {
            ownerId: true,
            members: {
              where: { userId: ctx.userId },
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!task) {
      throw new DomainError("NOT_FOUND", "Task tidak ditemukan.");
    }

    const canManage = hasAnyPermission(
      ctx.permissions,
      [PERMISSIONS.TASKS_ITEM_ASSIGN, PERMISSIONS.TASKS_ITEM_APPROVE],
      ctx.roleCode
    );
    const isTaskParticipant =
      task.assigneeId === ctx.userId ||
      task.reporterId === ctx.userId ||
      task.project.ownerId === ctx.userId ||
      task.project.members.length > 0;

    if (!canManage && !isTaskParticipant) {
      throw new DomainError(
        "FORBIDDEN",
        "Anda tidak memiliki izin menambah checklist pada task ini."
      );
    }

    const existingCount = await prisma.taskChecklist.count({
      where: { taskId: task.id },
    });

    if (existingCount >= 30) {
      throw new DomainError(
        "VALIDATION_ERROR",
        "Maksimal 30 item checklist per task."
      );
    }

    const createdItem = await executeAuditedMutation(ctx, async (tx) => {
      const agg = await tx.taskChecklist.aggregate({
        where: { taskId: task.id },
        _max: { sortOrder: true },
      });
      const nextSortOrder = (agg._max.sortOrder ?? -1) + 1;

      const created = await tx.taskChecklist.create({
        data: {
          taskId: task.id,
          title: input.title,
          sortOrder: nextSortOrder,
        },
        select: {
          id: true,
          taskId: true,
          title: true,
          isCompleted: true,
          completedBy: true,
          completedAt: true,
          sortOrder: true,
        },
      });

      return {
        result: {
          id: created.id,
          taskId: created.taskId,
          title: created.title,
          isCompleted: created.isCompleted,
          completedBy: created.completedBy,
          completerName: null,
          completedAt: null,
          sortOrder: created.sortOrder,
        },
        audit: {
          module: "TASKS",
          action: "tasks:checklist:added",
          entityType: "TASK",
          entityId: task.id,
          summary: `Item checklist ditambahkan ke ${task.taskCode}: ${created.title}`,
          newValues: { title: created.title },
        },
      };
    });

    revalidateTaskRoutes(task.projectId);

    return {
      data: createdItem,
      message: "Item checklist berhasil ditambahkan.",
    };
  },
});

export const deleteTaskChecklistItemAction = createProtectedAction({
  permission: PERMISSIONS.TASKS_ITEM_UPDATE,
  schema: deleteTaskChecklistItemSchema,
  handler: async ({ ctx, input }) => {
    const checklist = await prisma.taskChecklist.findUnique({
      where: { id: input.checklistId },
      select: {
        id: true,
        taskId: true,
        title: true,
        task: {
          select: {
            taskCode: true,
            projectId: true,
            assigneeId: true,
            reporterId: true,
            deletedAt: true,
          },
        },
      },
    });

    if (!checklist || checklist.task.deletedAt) {
      throw new DomainError("NOT_FOUND", "Item checklist tidak ditemukan.");
    }

    const canManage = hasAnyPermission(
      ctx.permissions,
      [PERMISSIONS.TASKS_ITEM_ASSIGN, PERMISSIONS.TASKS_ITEM_APPROVE],
      ctx.roleCode
    );
    if (
      !canManage &&
      checklist.task.assigneeId !== ctx.userId &&
      checklist.task.reporterId !== ctx.userId
    ) {
      throw new DomainError(
        "FORBIDDEN",
        "Anda tidak memiliki izin menghapus item checklist ini."
      );
    }

    await executeAuditedMutation(ctx, async (tx) => {
      await tx.taskChecklist.delete({ where: { id: checklist.id } });
      return {
        result: { deletedId: checklist.id },
        audit: {
          module: "TASKS",
          action: "tasks:checklist:deleted",
          entityType: "TASK",
          entityId: checklist.taskId,
          summary: `Item checklist "${checklist.title}" dihapus dari ${checklist.task.taskCode}`,
        },
      };
    });

    revalidateTaskRoutes(checklist.task.projectId);
    return {
      data: { id: checklist.id },
      message: "Item checklist berhasil dihapus.",
    };
  },
});

export const addTaskCommentAction = createProtectedAction({
  permission: PERMISSIONS.TASKS_COMMENT_CREATE,
  schema: addTaskCommentSchema,
  handler: async ({ ctx, input }): Promise<{ data: TaskCommentDto; message: string }> => {
    const task = await prisma.task.findFirst({
      where: {
        id: input.taskId,
        deletedAt: null,
        project: { deletedAt: null },
      },
      select: {
        id: true,
        taskCode: true,
        title: true,
        projectId: true,
        assigneeId: true,
        reporterId: true,
        reviewerId: true,
        project: {
          select: {
            ownerId: true,
            members: {
              where: { userId: ctx.userId },
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!task) {
      throw new DomainError("NOT_FOUND", "Task tidak ditemukan.");
    }

    const canViewAll = hasAnyPermission(
      ctx.permissions,
      [PERMISSIONS.TASKS_ITEM_ASSIGN, PERMISSIONS.TASKS_ITEM_APPROVE],
      ctx.roleCode
    );
    const isMemberOrParticipant =
      task.assigneeId === ctx.userId ||
      task.reporterId === ctx.userId ||
      task.reviewerId === ctx.userId ||
      task.project.ownerId === ctx.userId ||
      task.project.members.length > 0;

    if (!canViewAll && !isMemberOrParticipant) {
      throw new DomainError(
        "FORBIDDEN",
        "Anda tidak memiliki akses ke task ini."
      );
    }

    const mentionedUserIds = await resolveMentionedUserIds(
      input.body,
      input.mentionedUserIds
    );

    const createdComment = await prisma.$transaction(
      async (tx) => {
        const comment = await tx.taskComment.create({
          data: {
            taskId: task.id,
            authorId: ctx.userId,
            parentCommentId: input.parentCommentId ?? null,
            body: input.body,
            mentionedUserIds,
          },
          select: {
            id: true,
            taskId: true,
            authorId: true,
            parentCommentId: true,
            body: true,
            mentionedUserIds: true,
            createdAt: true,
            updatedAt: true,
            author: {
              select: {
                id: true,
                fullName: true,
                avatarUrl: true,
                jobTitle: true,
              },
            },
          },
        });

        const recipientSet = new Set<string>(mentionedUserIds);
        if (task.assigneeId && task.assigneeId !== ctx.userId) {
          recipientSet.add(task.assigneeId);
        }

        const notifications: NotificationDraft[] = [];
        for (const recipientId of recipientSet) {
          const isExplicitMention = mentionedUserIds.includes(recipientId);
          notifications.push({
            recipientId,
            type: NotificationType.TASK_COMMENT_MENTION,
            title: isExplicitMention
              ? `Anda disebut di ${task.taskCode}`
              : `Komentar baru di ${task.taskCode}`,
            message: `${ctx.fullName} berkomentar pada "${task.title}": "${input.body.slice(
              0,
              120
            )}${input.body.length > 120 ? "..." : ""}"`,
            entityType: "TASK",
            entityId: task.id,
            actionUrl: `/tasks/board?drawer=task&id=${task.id}`,
            metadata: {
              commentId: comment.id,
              taskCode: task.taskCode,
              explicitMention: isExplicitMention,
            },
          });
        }

        if (notifications.length > 0) {
          await dispatchNotifications(tx, ctx.userId, notifications);
        }

        await writeAuditLog(tx, {
          actorId: ctx.userId,
          module: "TASKS",
          action: "tasks:comment:created",
          entityType: "TASK",
          entityId: task.id,
          summary: `Komentar baru pada task ${task.taskCode}`,
          newValues: {
            commentId: comment.id,
            mentionedCount: mentionedUserIds.length,
          },
        });

        return {
          id: comment.id,
          taskId: comment.taskId,
          authorId: comment.authorId,
          author: comment.author,
          parentCommentId: comment.parentCommentId,
          body: comment.body,
          mentionedUserIds: comment.mentionedUserIds,
          createdAt: comment.createdAt.toISOString(),
          updatedAt: comment.updatedAt.toISOString(),
          isEdited: false,
        };
      },
      { maxWait: 10_000, timeout: 25_000 }
    );

    revalidateTaskRoutes(task.projectId);

    return {
      data: createdComment,
      message: "Komentar berhasil dikirim.",
    };
  },
});

export const addTaskAttachmentAction = createProtectedAction({
  permission: PERMISSIONS.TASKS_ITEM_UPDATE,
  schema: addTaskAttachmentSchema,
  handler: async ({ ctx, input }): Promise<{ data: TaskAttachmentDto; message: string }> => {
    const task = await prisma.task.findFirst({
      where: {
        id: input.taskId,
        deletedAt: null,
        project: { deletedAt: null },
      },
      select: {
        id: true,
        taskCode: true,
        projectId: true,
        assigneeId: true,
        reporterId: true,
        project: {
          select: {
            ownerId: true,
            members: {
              where: { userId: ctx.userId },
              select: { userId: true },
            },
          },
        },
      },
    });

    if (!task) {
      throw new DomainError("NOT_FOUND", "Task tidak ditemukan.");
    }

    const canManage = hasAnyPermission(
      ctx.permissions,
      [PERMISSIONS.TASKS_ITEM_ASSIGN, PERMISSIONS.TASKS_ITEM_APPROVE],
      ctx.roleCode
    );
    const isParticipant =
      task.assigneeId === ctx.userId ||
      task.reporterId === ctx.userId ||
      task.project.ownerId === ctx.userId ||
      task.project.members.length > 0;

    if (!canManage && !isParticipant) {
      throw new DomainError(
        "FORBIDDEN",
        "Anda tidak memiliki izin menambahkan lampiran pada task ini."
      );
    }

    const activeAttachmentCount = await prisma.taskAttachment.count({
      where: {
        taskId: task.id,
        deletedAt: null,
      },
    });

    if (activeAttachmentCount >= 5) {
      throw new DomainError(
        "VALIDATION_ERROR",
        "Maksimal 5 lampiran aktif per task."
      );
    }

    let resolvedFileUrl = "";
    let resolvedStorageKey: string | null = null;

    if (input.sourceType === "UPLOAD") {
      const cleanKey = input.storageKey?.trim() ?? "";
      const parsedKey = validateStorageKeyPath(cleanKey);
      if (!parsedKey) {
        throw new DomainError(
          "VALIDATION_ERROR",
          "storageKey file unggahan tidak valid.",
          { storageKey: ["storageKey file unggahan tidak valid."] }
        );
      }
      resolvedStorageKey = cleanKey;
      resolvedFileUrl = `/api/uploads/download-url?storageKey=${encodeURIComponent(cleanKey)}`;
    } else {
      const urlCheck = validateSafeExternalHttpsUrl(input.fileUrl ?? "");
      if (!urlCheck.valid || !urlCheck.normalizedUrl) {
        throw new DomainError(
          "VALIDATION_ERROR",
          urlCheck.error ?? "Tautan eksternal harus HTTPS publik yang valid.",
          { fileUrl: [urlCheck.error ?? "URL eksternal tidak valid."] }
        );
      }
      resolvedFileUrl = urlCheck.normalizedUrl;
    }

    const createdAttachment = await executeAuditedMutation(ctx, async (tx) => {
      const attachment = await tx.taskAttachment.create({
        data: {
          taskId: task.id,
          uploadedBy: ctx.userId,
          sourceType: input.sourceType as AssetSourceType,
          fileName: input.fileName,
          fileUrl: resolvedFileUrl,
          storageKey: resolvedStorageKey,
          mimeType: input.mimeType ?? null,
          fileSizeBytes:
            input.fileSizeBytes !== null && input.fileSizeBytes !== undefined
              ? BigInt(input.fileSizeBytes)
              : null,
        },
        select: {
          id: true,
          taskId: true,
          uploadedBy: true,
          sourceType: true,
          fileName: true,
          fileUrl: true,
          storageKey: true,
          mimeType: true,
          fileSizeBytes: true,
          createdAt: true,
          uploader: { select: { fullName: true } },
        },
      });

      return {
        result: {
          id: attachment.id,
          taskId: attachment.taskId,
          uploadedBy: attachment.uploadedBy,
          uploaderName: attachment.uploader.fullName,
          sourceType: attachment.sourceType,
          fileName: attachment.fileName,
          fileUrl: attachment.fileUrl,
          storageKey: attachment.storageKey,
          mimeType: attachment.mimeType,
          fileSizeBytes:
            attachment.fileSizeBytes !== null
              ? Number(attachment.fileSizeBytes)
              : null,
          createdAt: attachment.createdAt.toISOString(),
        },
        audit: {
          module: "TASKS",
          action: "tasks:attachment:added",
          entityType: "TASK",
          entityId: task.id,
          summary: `Lampiran "${attachment.fileName}" ditambahkan ke ${task.taskCode}`,
          newValues: {
            sourceType: attachment.sourceType,
            fileName: attachment.fileName,
          },
        },
      };
    });

    revalidateTaskRoutes(task.projectId);

    return {
      data: createdAttachment,
      message: "Lampiran berhasil disimpan.",
    };
  },
});

export const softDeleteTaskAction = createProtectedAction({
  permission: PERMISSIONS.TASKS_ITEM_DELETE,
  schema: softDeleteTaskSchema,
  handler: async ({ ctx, input }) => {
    const existing = await prisma.task.findFirst({
      where: {
        id: input.taskId,
        deletedAt: null,
      },
      select: {
        id: true,
        taskCode: true,
        title: true,
        projectId: true,
      },
    });

    if (!existing) {
      throw new DomainError("NOT_FOUND", "Task tidak ditemukan.");
    }

    await executeAuditedMutation(ctx, async (tx) => {
      await tx.task.update({
        where: { id: existing.id },
        data: { deletedAt: new Date() },
      });

      return {
        result: { id: existing.id },
        audit: {
          module: "TASKS",
          action: "tasks:item:deleted",
          entityType: "TASK",
          entityId: existing.id,
          summary: `Task ${existing.taskCode} (${existing.title}) dihapus (soft delete)`,
          oldValues: {
            taskCode: existing.taskCode,
            title: existing.title,
          },
        },
      };
    });

    revalidateTaskRoutes(existing.projectId);

    return {
      data: { id: existing.id },
      message: `Task ${existing.taskCode} berhasil dihapus.`,
    };
  },
});
