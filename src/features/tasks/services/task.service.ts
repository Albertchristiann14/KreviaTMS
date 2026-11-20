import {
  NotificationType,
  Prisma,
  TaskPriority,
  TaskStatus,
  TaskType,
  type Task,
} from "@prisma/client";
import {
  writeAuditLog,
  type AuditModule,
} from "@/server/services/audit-logger";
import { dispatchNotifications } from "@/server/services/notification-dispatcher";
import { DomainError } from "@/types/action-result";

export const POSITION_GAP = 65536;
export const MIN_POSITION_DELTA = 1e-5;

export interface MidpointPositionResult {
  position: number;
  needsReindex: boolean;
}

export interface SpawnLinkedTaskInput {
  projectId: string;
  title: string;
  description?: string | null;
  taskType: TaskType;
  status?: Extract<TaskStatus, "BACKLOG" | "TODO" | "IN_PROGRESS">;
  priority?: TaskPriority;
  requiresReview?: boolean;
  assigneeId?: string | null;
  reporterId: string;
  actorId?: string | null;
  reviewerId?: string | null;
  parentTaskId?: string | null;
  contentItemId?: string | null;
  designBriefId?: string | null;
  startDate?: Date | null;
  dueDate?: Date | null;
  estimatedHours?: number | null;
  tags?: string[];
  actionUrl?: string;
  auditModule?: AuditModule;
}

/**
 * Generates the next human-readable task code (`KTMS-1001`, `KTMS-1002`, ...)
 * using PostgreSQL sequence `seq_task_code_num`.
 */
export async function generateNextTaskCode(
  tx: Prisma.TransactionClient
): Promise<string> {
  const rows = await tx.$queryRaw<
    Array<{ nextval: bigint | number | string }>
  >`SELECT nextval('seq_task_code_num') AS nextval`;

  const seq = rows[0]?.nextval;
  if (seq === undefined || seq === null) {
    throw new DomainError(
      "INTERNAL_ERROR",
      "Gagal menghasilkan nomor urut kode task dari sequence."
    );
  }

  return `KTMS-${seq.toString()}`;
}

/**
 * Computes the position at the end of a Kanban column (`MAX(position) + 65536`, or `65536` if empty).
 */
export async function computeColumnEndPosition(
  tx: Prisma.TransactionClient,
  projectId: string,
  status: TaskStatus
): Promise<number> {
  const agg = await tx.task.aggregate({
    where: {
      projectId,
      status,
      deletedAt: null,
    },
    _max: { position: true },
  });

  const maxPos = agg._max.position;
  if (maxPos === null || !Number.isFinite(maxPos)) {
    return POSITION_GAP;
  }

  return maxPos + POSITION_GAP;
}

/**
 * Computes the midpoint position between two Kanban cards and flags when
 * the gap has collapsed below `1e-5` and requires column re-indexing.
 */
export function computeMidpointPosition(
  prevPos: number | null,
  nextPos: number | null
): MidpointPositionResult {
  if (prevPos === null && nextPos === null) {
    return { position: POSITION_GAP, needsReindex: false };
  }

  if (prevPos === null && nextPos !== null) {
    const candidate = nextPos / 2;
    const needsReindex =
      nextPos <= MIN_POSITION_DELTA || candidate < MIN_POSITION_DELTA;
    return { position: candidate, needsReindex };
  }

  if (prevPos !== null && nextPos === null) {
    return { position: prevPos + POSITION_GAP, needsReindex: false };
  }

  // Both prevPos and nextPos are numbers here
  const prev = prevPos as number;
  const next = nextPos as number;
  const delta = Math.abs(next - prev);

  return {
    position: (prev + next) / 2,
    needsReindex: delta < MIN_POSITION_DELTA,
  };
}

/**
 * Re-indexes all active tasks in a `(projectId, status)` column using clean
 * `65536, 131072, ...` spacing inside the caller's transaction.
 */
export async function reindexColumnPositions(
  tx: Prisma.TransactionClient,
  projectId: string,
  status: TaskStatus
): Promise<Map<string, number>> {
  const tasksInColumn = await tx.task.findMany({
    where: {
      projectId,
      status,
      deletedAt: null,
    },
    orderBy: [{ position: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    select: { id: true },
  });

  const reindexed = new Map<string, number>();

  for (let i = 0; i < tasksInColumn.length; i += 1) {
    const item = tasksInColumn[i];
    if (!item) continue;
    const newPosition = (i + 1) * POSITION_GAP;
    await tx.task.update({
      where: { id: item.id },
      data: { position: newPosition },
    });
    reindexed.set(item.id, newPosition);
  }

  return reindexed;
}

/**
 * Resolves a safe Kanban insert/move position between optional neighbors,
 * automatically re-indexing the column when the gap falls below `1e-5`.
 */
export async function resolveKanbanTargetPosition(
  tx: Prisma.TransactionClient,
  params: {
    projectId: string;
    status: TaskStatus;
    prevTaskId?: string | null;
    nextTaskId?: string | null;
    prevPos?: number | null;
    nextPos?: number | null;
  }
): Promise<number> {
  let prevPos = params.prevPos ?? null;
  let nextPos = params.nextPos ?? null;

  if (prevPos === null && params.prevTaskId) {
    const prevTask = await tx.task.findFirst({
      where: {
        id: params.prevTaskId,
        projectId: params.projectId,
        status: params.status,
        deletedAt: null,
      },
      select: { position: true },
    });
    prevPos = prevTask?.position ?? null;
  }

  if (nextPos === null && params.nextTaskId) {
    const nextTask = await tx.task.findFirst({
      where: {
        id: params.nextTaskId,
        projectId: params.projectId,
        status: params.status,
        deletedAt: null,
      },
      select: { position: true },
    });
    nextPos = nextTask?.position ?? null;
  }

  if (prevPos === null && nextPos === null) {
    return computeColumnEndPosition(tx, params.projectId, params.status);
  }

  const initial = computeMidpointPosition(prevPos, nextPos);
  if (!initial.needsReindex) {
    return initial.position;
  }

  const reindexed = await reindexColumnPositions(
    tx,
    params.projectId,
    params.status
  );

  const updatedPrev = params.prevTaskId
    ? (reindexed.get(params.prevTaskId) ?? null)
    : prevPos;
  const updatedNext = params.nextTaskId
    ? (reindexed.get(params.nextTaskId) ?? null)
    : nextPos;

  return computeMidpointPosition(updatedPrev, updatedNext).position;
}

/**
 * Atomically spawns a unified task (GENERAL, CONTENT_PRODUCTION, or DESIGN_TASK)
 * inside the caller's Prisma transaction, enforcing cross-module FK/uniqueness contracts,
 * writing an activity log entry, and dispatching an assignment notification.
 */
export async function spawnLinkedTask(
  tx: Prisma.TransactionClient,
  input: SpawnLinkedTaskInput
): Promise<Task> {
  if (input.taskType === TaskType.DESIGN_TASK && !input.designBriefId) {
    throw new DomainError(
      "VALIDATION_ERROR",
      "Task bertipe DESIGN_TASK wajib terhubung ke designBriefId."
    );
  }

  if (
    input.taskType === TaskType.CONTENT_PRODUCTION &&
    !input.contentItemId
  ) {
    throw new DomainError(
      "VALIDATION_ERROR",
      "Task bertipe CONTENT_PRODUCTION wajib terhubung ke contentItemId."
    );
  }

  // Proactive guard matching partial unique indexes before hitting DB constraint
  if (input.taskType === TaskType.DESIGN_TASK && input.designBriefId) {
    const existingBriefTask = await tx.task.findFirst({
      where: {
        designBriefId: input.designBriefId,
        deletedAt: null,
      },
      select: { id: true, taskCode: true },
    });
    if (existingBriefTask) {
      throw new DomainError(
        "CONFLICT",
        `Design Brief ini sudah memiliki task desain aktif (${existingBriefTask.taskCode}).`
      );
    }
  }

  if (
    input.taskType === TaskType.CONTENT_PRODUCTION &&
    input.contentItemId
  ) {
    const existingContentTask = await tx.task.findFirst({
      where: {
        contentItemId: input.contentItemId,
        taskType: TaskType.CONTENT_PRODUCTION,
        deletedAt: null,
      },
      select: { id: true, taskCode: true },
    });
    if (existingContentTask) {
      throw new DomainError(
        "CONFLICT",
        `Content Item ini sudah memiliki task produksi aktif (${existingContentTask.taskCode}).`
      );
    }
  }

  const targetStatus = input.status ?? TaskStatus.TODO;
  const actorId =
    input.actorId !== undefined ? input.actorId : input.reporterId;

  const [taskCode, position] = await Promise.all([
    generateNextTaskCode(tx),
    computeColumnEndPosition(tx, input.projectId, targetStatus),
  ]);

  const createdTask = await tx.task.create({
    data: {
      taskCode,
      projectId: input.projectId,
      parentTaskId: input.parentTaskId ?? null,
      contentItemId: input.contentItemId ?? null,
      designBriefId: input.designBriefId ?? null,
      title: input.title.trim().slice(0, 200),
      description: input.description ?? null,
      taskType: input.taskType,
      status: targetStatus,
      priority: input.priority ?? TaskPriority.MEDIUM,
      position,
      version: 1,
      requiresReview: input.requiresReview ?? true,
      assigneeId: input.assigneeId ?? null,
      reporterId: input.reporterId,
      reviewerId: input.reviewerId ?? null,
      startDate: input.startDate ?? null,
      startedAt: targetStatus === TaskStatus.IN_PROGRESS ? new Date() : null,
      dueDate: input.dueDate ?? null,
      estimatedHours:
        input.estimatedHours !== undefined && input.estimatedHours !== null
          ? new Prisma.Decimal(input.estimatedHours)
          : null,
      tags: input.tags ?? [],
    },
  });

  const auditModule: AuditModule =
    input.auditModule ??
    (input.taskType === TaskType.GENERAL ? "TASKS" : "SOCIAL_DESIGN");

  await writeAuditLog(tx, {
    actorId,
    module: auditModule,
    action:
      input.taskType === TaskType.GENERAL
        ? "tasks:item:created"
        : "tasks:linked_task:spawned",
    entityType: "TASK",
    entityId: createdTask.id,
    summary: `Task ${createdTask.taskCode} (${createdTask.taskType}) dibuat: ${createdTask.title}`,
    newValues: {
      taskCode: createdTask.taskCode,
      projectId: createdTask.projectId,
      taskType: createdTask.taskType,
      status: createdTask.status,
      priority: createdTask.priority,
      position: createdTask.position,
      assigneeId: createdTask.assigneeId,
      contentItemId: createdTask.contentItemId,
      designBriefId: createdTask.designBriefId,
      dueDate: createdTask.dueDate?.toISOString() ?? null,
    },
  });

  if (createdTask.assigneeId) {
    const isDesignTask = createdTask.taskType === TaskType.DESIGN_TASK;
    const defaultActionUrl = isDesignTask
      ? `/design/workspace?briefId=${createdTask.designBriefId ?? ""}`
      : `/tasks/board?drawer=task&id=${createdTask.id}`;

    await dispatchNotifications(tx, actorId, [
      {
        recipientId: createdTask.assigneeId,
        type: isDesignTask
          ? NotificationType.DESIGN_BRIEF_ASSIGNED
          : NotificationType.TASK_ASSIGNED,
        title: isDesignTask
          ? `Brief Desain Baru: ${createdTask.title}`
          : `Task Baru Ditugaskan: ${createdTask.taskCode}`,
        message: isDesignTask
          ? `Anda ditugaskan mengerjakan brief desain "${createdTask.title}" (${createdTask.taskCode}).`
          : `Anda ditugaskan mengerjakan task "${createdTask.title}" (${createdTask.taskCode}).`,
        entityType: "TASK",
        entityId: createdTask.id,
        actionUrl: input.actionUrl ?? defaultActionUrl,
        metadata: {
          taskCode: createdTask.taskCode,
          taskType: createdTask.taskType,
          contentItemId: createdTask.contentItemId,
          designBriefId: createdTask.designBriefId,
        },
      },
    ]);
  }

  return createdTask;
}
