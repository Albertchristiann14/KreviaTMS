import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireSession } from "@/server/auth/rbac";
import { prisma } from "@/server/db/prisma";
import { DomainError } from "@/types/action-result";

export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-cache",
} as const;

const TRANSIENT_CONNECTION_CODES = new Set(["P1001", "P2024"]);

function isTransientPrismaConnectionError(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return TRANSIENT_CONNECTION_CODES.has(err.code);
  }
  return err instanceof Prisma.PrismaClientInitializationError;
}

async function withSingleConnectionRetry<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (err) {
    if (!isTransientPrismaConnectionError(err)) {
      throw err;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
    return await operation();
  }
}

export async function GET() {
  try {
    const { unreadCount, items } = await withSingleConnectionRetry(async () => {
      const ctx = await requireSession();

      const [count, rows] = await Promise.all([
        prisma.notification.count({
          where: {
            recipientId: ctx.userId,
            isRead: false,
          },
        }),
        prisma.notification.findMany({
          where: {
            recipientId: ctx.userId,
            isRead: false,
          },
          orderBy: { createdAt: "desc" },
          take: 15,
          select: {
            id: true,
            type: true,
            title: true,
            message: true,
            entityType: true,
            entityId: true,
            actionUrl: true,
            isRead: true,
            createdAt: true,
          },
        }),
      ]);

      return { unreadCount: count, items: rows };
    });

    return NextResponse.json(
      {
        unreadCount,
        items: items.map((item) => ({
          id: item.id,
          type: item.type,
          title: item.title,
          message: item.message,
          entityType: item.entityType,
          entityId: item.entityId,
          actionUrl: item.actionUrl ?? "/notifications",
          isRead: item.isRead,
          createdAt: item.createdAt.toISOString(),
        })),
      },
      {
        status: 200,
        headers: NO_STORE_HEADERS,
      }
    );
  } catch (err) {
    if (err instanceof DomainError) {
      const status = err.code === "UNAUTHORIZED" ? 401 : 403;
      return NextResponse.json(
        {
          error: {
            code: err.code,
            message: err.message,
          },
        },
        {
          status,
          headers: NO_STORE_HEADERS,
        }
      );
    }

    if (isTransientPrismaConnectionError(err)) {
      console.warn("[KTMS_NOTIFICATIONS_UNREAD_UNAVAILABLE]", err);
      return NextResponse.json(
        {
          error: {
            code: "SERVICE_UNAVAILABLE",
            message:
              "Koneksi database sedang terganggu sementara. Silakan coba lagi sesaat lagi.",
          },
        },
        {
          status: 503,
          headers: NO_STORE_HEADERS,
        }
      );
    }

    console.error("[KTMS_NOTIFICATIONS_UNREAD_ERROR]", err);
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Gagal memuat notifikasi.",
        },
      },
      {
        status: 500,
        headers: NO_STORE_HEADERS,
      }
    );
  }
}
