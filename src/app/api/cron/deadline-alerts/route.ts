import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { NotificationType, Prisma, TaskStatus } from "@prisma/client";
import { getServerEnv } from "@/lib/env";
import { prisma } from "@/server/db/prisma";
import {
  dispatchNotifications,
  type NotificationDraft,
} from "@/server/services/notification-dispatcher";
import {
  diffWibDays,
  formatDateKeyWib,
  formatDisplayDateWib,
} from "@/features/tasks/utils/date-wib";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache",
} as const;

function isAuthorizedCronRequest(
  request: Request,
  configuredSecret: string
): boolean {
  const authHeader = request.headers.get("authorization") ?? "";
  const expectedHeader = `Bearer ${configuredSecret}`;

  const actualBuf = Buffer.from(authHeader, "utf8");
  const expectedBuf = Buffer.from(expectedHeader, "utf8");
  if (actualBuf.length !== expectedBuf.length) {
    return false;
  }

  return timingSafeEqual(actualBuf, expectedBuf);
}

interface CandidateAlert {
  alertKey: string;
  draft: NotificationDraft;
}

async function runDeadlineAlertsCron(request: Request) {
  try {
    const configuredSecret = getServerEnv().CRON_SECRET;
    if (!configuredSecret) {
      return NextResponse.json(
        {
          error: "CRON_SECRET belum dikonfigurasi pada server.",
          code: "SERVICE_UNAVAILABLE",
        },
        { status: 503, headers: NO_STORE_HEADERS }
      );
    }

    if (!isAuthorizedCronRequest(request, configuredSecret)) {
      return NextResponse.json(
        { error: "Unauthorized cron invocation.", code: "UNAUTHORIZED" },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    const now = new Date();
    const todayWib = formatDateKeyWib(now);

    const activeTasks = await prisma.task.findMany({
      where: {
        deletedAt: null,
        dueDate: { not: null },
        assigneeId: { not: null },
        status: {
          notIn: [TaskStatus.DONE, TaskStatus.CANCELLED],
        },
        OR: [{ projectId: null }, { project: { is: { deletedAt: null } } }],
      },
      select: {
        id: true,
        taskCode: true,
        title: true,
        dueDate: true,
        assigneeId: true,
        project: {
          select: {
            id: true,
            code: true,
            name: true,
            ownerId: true,
          },
        },
      },
    });

    const candidates: CandidateAlert[] = [];

    for (const task of activeTasks) {
      if (!task.dueDate || !task.assigneeId) continue;

      const dayDiff = diffWibDays(task.dueDate, now);
      const dueLabel = formatDisplayDateWib(task.dueDate, "datetime");
      const actionUrl = `/tasks/board?drawer=task&id=${task.id}`;
      const projectCodeLabel = task.project?.code ?? "Umum";

      if (dayDiff === 2) {
        const alertKey = `${task.id}:H-2:${todayWib}:${task.assigneeId}`;
        candidates.push({
          alertKey,
          draft: {
            recipientId: task.assigneeId,
            type: NotificationType.TASK_DEADLINE_SOON,
            title: `Pengingat H-2 Deadline: ${task.taskCode}`,
            message: `Task "${task.title}" (${projectCodeLabel}) akan jatuh tempo dalam 2 hari (${dueLabel}).`,
            entityType: "TASK",
            entityId: task.id,
            actionUrl,
            metadata: {
              alertKey,
              stage: "H-2",
              wibDate: todayWib,
              taskCode: task.taskCode,
            },
          },
        });
      } else if (dayDiff === 0) {
        const alertKey = `${task.id}:H-0:${todayWib}:${task.assigneeId}`;
        candidates.push({
          alertKey,
          draft: {
            recipientId: task.assigneeId,
            type: NotificationType.TASK_DEADLINE_TODAY,
            title: `Deadline Hari Ini: ${task.taskCode}`,
            message: `Task "${task.title}" (${projectCodeLabel}) jatuh tempo hari ini (${dueLabel}).`,
            entityType: "TASK",
            entityId: task.id,
            actionUrl,
            metadata: {
              alertKey,
              stage: "H-0",
              wibDate: todayWib,
              taskCode: task.taskCode,
            },
          },
        });
      } else if (dayDiff === -1 || dayDiff === -3) {
        const stage = dayDiff === -1 ? "H+1" : "H+3";
        const overdueDays = Math.abs(dayDiff);
        const recipients = new Set<string>([task.assigneeId]);
        if (task.project?.ownerId) {
          recipients.add(task.project.ownerId);
        }

        for (const recipientId of recipients) {
          const isManagerEscalation =
            recipientId !== task.assigneeId &&
            recipientId === task.project?.ownerId;
          const alertKey = `${task.id}:${stage}:${todayWib}:${recipientId}`;

          candidates.push({
            alertKey,
            draft: {
              recipientId,
              type: NotificationType.TASK_OVERDUE,
              title: isManagerEscalation
                ? `Eskalasi Overdue ${stage}: ${task.taskCode}`
                : `Task Terlambat (${stage}): ${task.taskCode}`,
              message: isManagerEscalation
                ? `Task "${task.title}" di proyek ${projectCodeLabel} telah melewati tenggat ${overdueDays} hari (${dueLabel}).`
                : `Task "${task.title}" (${projectCodeLabel}) telah melewati batas waktu ${overdueDays} hari (${dueLabel}). Segera selesaikan atau koordinasikan dengan PM.`,
              entityType: "TASK",
              entityId: task.id,
              actionUrl,
              metadata: {
                alertKey,
                stage,
                wibDate: todayWib,
                taskCode: task.taskCode,
                escalatedToOwner: isManagerEscalation,
              },
            },
          });
        }
      }
    }

    if (candidates.length === 0) {
      return NextResponse.json(
        {
          ok: true,
          wibDate: todayWib,
          scannedCount: activeTasks.length,
          dispatchedCount: 0,
          skippedDuplicateCount: 0,
        },
        { status: 200, headers: NO_STORE_HEADERS }
      );
    }

    const candidateKeys = candidates.map((c) => c.alertKey);

    const existingAlertRows = await prisma.$queryRaw<
      Array<{ alert_key: string | null }>
    >`
      SELECT metadata->>'alertKey' AS alert_key
      FROM notifications
      WHERE metadata->>'alertKey' IN (${Prisma.join(candidateKeys)})
    `;

    const alreadySentKeys = new Set(
      existingAlertRows
        .map((r) => r.alert_key)
        .filter((k): k is string => Boolean(k))
    );

    const toDispatch = candidates
      .filter((c) => !alreadySentKeys.has(c.alertKey))
      .map((c) => c.draft);

    const dispatchedCount =
      toDispatch.length > 0
        ? await prisma.$transaction(
            async (tx) => {
              return dispatchNotifications(tx, null, toDispatch);
            },
            { maxWait: 10_000, timeout: 25_000 }
          )
        : 0;

    return NextResponse.json(
      {
        ok: true,
        wibDate: todayWib,
        scannedCount: activeTasks.length,
        dispatchedCount,
        skippedDuplicateCount: candidates.length - toDispatch.length,
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("[KTMS_ENV_ERROR]")) {
      console.error("[KTMS_DEADLINE_CRON_ENV_ERROR]", err.message);
      return NextResponse.json(
        {
          error: "Konfigurasi environment server belum lengkap.",
          code: "SERVICE_UNAVAILABLE",
        },
        { status: 503, headers: NO_STORE_HEADERS }
      );
    }

    console.error("[KTMS_DEADLINE_CRON_ERROR]", err);
    return NextResponse.json(
      {
        error: "Gagal menjalankan pemeriksaan deadline task.",
        code: "INTERNAL_ERROR",
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

export async function GET(request: Request) {
  return runDeadlineAlertsCron(request);
}

export async function POST(request: Request) {
  return runDeadlineAlertsCron(request);
}
