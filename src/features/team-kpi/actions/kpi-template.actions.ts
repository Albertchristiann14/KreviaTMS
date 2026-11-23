"use server";

import { revalidatePath } from "next/cache";
import { NotificationType, Prisma } from "@prisma/client";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { createProtectedAction } from "@/server/actions/safe-action";
import { prisma } from "@/server/db/prisma";
import { executeAuditedMutation } from "@/server/services/audit-logger";
import { DomainError } from "@/types/action-result";
import {
  assignKpiMonthlySchema,
  clonePreviousMonthAssignmentsSchema,
  deleteKpiTemplateSchema,
  toggleKpiTemplateActiveSchema,
  upsertKpiTemplateSchema,
} from "@/features/team-kpi/schemas/kpi-template.schema";
import {
  decimalToNumber,
  formatPeriodMonthLabel,
  getPreviousYearMonth,
  round2,
} from "@/features/team-kpi/services/kpi-aggregator.service";

export const upsertKpiTemplateAction = createProtectedAction({
  permission: PERMISSIONS.KPI_TEMPLATE_MANAGE,
  schema: upsertKpiTemplateSchema,
  handler: async ({ ctx, input }) => {
    if (input.applicableRoleId) {
      const role = await prisma.role.findUnique({
        where: { id: input.applicableRoleId },
        select: { id: true },
      });
      if (!role) {
        throw new DomainError(
          "VALIDATION_ERROR",
          "Peran target (applicableRoleId) tidak ditemukan.",
          { applicableRoleId: ["Peran tidak valid."] }
        );
      }
    }

    const result = await executeAuditedMutation(ctx, async (tx) => {
      if (input.id) {
        const existing = await tx.kpiTemplate.findFirst({
          where: { id: input.id, deletedAt: null },
        });
        if (!existing) {
          throw new DomainError("NOT_FOUND", "Template KPI tidak ditemukan.");
        }

        const duplicateCode = await tx.kpiTemplate.findFirst({
          where: {
            code: input.code,
            id: { not: input.id },
          },
          select: { id: true },
        });
        if (duplicateCode) {
          throw new DomainError(
            "CONFLICT",
            `Kode template '${input.code}' sudah digunakan indikator lain.`,
            { code: ["Kode template sudah digunakan."] }
          );
        }

        const updated = await tx.kpiTemplate.update({
          where: { id: input.id },
          data: {
            code: input.code,
            name: input.name,
            description: input.description ?? null,
            category: input.category,
            applicableRoleId: input.applicableRoleId ?? null,
            metricSource: input.metricSource,
            unit: input.unit,
            defaultTargetValue: new Prisma.Decimal(input.defaultTargetValue),
            defaultWeight: new Prisma.Decimal(input.defaultWeight),
            isHigherBetter: input.isHigherBetter,
            isActive: input.isActive,
          },
        });

        return {
          result: { id: updated.id, code: updated.code },
          audit: {
            module: "TEAM_KPI" as const,
            action: "KPI_TEMPLATE_UPDATED",
            entityType: "KPI_TEMPLATE",
            entityId: updated.id,
            summary: `Template KPI ${updated.code} (${updated.name}) diperbarui.`,
            oldValues: {
              code: existing.code,
              name: existing.name,
              category: existing.category,
              applicableRoleId: existing.applicableRoleId,
              metricSource: existing.metricSource,
              unit: existing.unit,
              defaultTargetValue: decimalToNumber(existing.defaultTargetValue),
              defaultWeight: decimalToNumber(existing.defaultWeight),
              isActive: existing.isActive,
            },
            newValues: {
              code: updated.code,
              name: updated.name,
              category: updated.category,
              applicableRoleId: updated.applicableRoleId,
              metricSource: updated.metricSource,
              unit: updated.unit,
              defaultTargetValue: decimalToNumber(updated.defaultTargetValue),
              defaultWeight: decimalToNumber(updated.defaultWeight),
              isActive: updated.isActive,
            },
          },
        };
      }

      const duplicate = await tx.kpiTemplate.findUnique({
        where: { code: input.code },
        select: { id: true },
      });
      if (duplicate) {
        throw new DomainError(
          "CONFLICT",
          `Kode template '${input.code}' sudah terdaftar.`,
          { code: ["Kode template sudah ada."] }
        );
      }

      const created = await tx.kpiTemplate.create({
        data: {
          code: input.code,
          name: input.name,
          description: input.description ?? null,
          category: input.category,
          applicableRoleId: input.applicableRoleId ?? null,
          metricSource: input.metricSource,
          unit: input.unit,
          defaultTargetValue: new Prisma.Decimal(input.defaultTargetValue),
          defaultWeight: new Prisma.Decimal(input.defaultWeight),
          isHigherBetter: input.isHigherBetter,
          isActive: input.isActive,
          createdBy: ctx.userId,
        },
      });

      return {
        result: { id: created.id, code: created.code },
        audit: {
          module: "TEAM_KPI" as const,
          action: "KPI_TEMPLATE_CREATED",
          entityType: "KPI_TEMPLATE",
          entityId: created.id,
          summary: `Template KPI baru ${created.code} (${created.name}) dibuat.`,
          newValues: {
            code: created.code,
            name: created.name,
            category: created.category,
            applicableRoleId: created.applicableRoleId,
            metricSource: created.metricSource,
            unit: created.unit,
            defaultTargetValue: decimalToNumber(created.defaultTargetValue),
            defaultWeight: decimalToNumber(created.defaultWeight),
            isActive: created.isActive,
          },
        },
      };
    });

    revalidatePath("/kpi/templates");
    return {
      data: result,
      message: input.id
        ? "Template KPI berhasil diperbarui."
        : "Template KPI baru berhasil ditambahkan.",
    };
  },
});

export const toggleKpiTemplateActiveAction = createProtectedAction({
  permission: PERMISSIONS.KPI_TEMPLATE_MANAGE,
  schema: toggleKpiTemplateActiveSchema,
  handler: async ({ ctx, input }) => {
    const updated = await executeAuditedMutation(ctx, async (tx) => {
      const existing = await tx.kpiTemplate.findFirst({
        where: { id: input.templateId, deletedAt: null },
      });
      if (!existing) {
        throw new DomainError("NOT_FOUND", "Template KPI tidak ditemukan.");
      }

      const next = await tx.kpiTemplate.update({
        where: { id: existing.id },
        data: { isActive: input.isActive },
      });

      return {
        result: { id: next.id, isActive: next.isActive },
        audit: {
          module: "TEAM_KPI" as const,
          action: input.isActive
            ? "KPI_TEMPLATE_ACTIVATED"
            : "KPI_TEMPLATE_DEACTIVATED",
          entityType: "KPI_TEMPLATE",
          entityId: next.id,
          summary: `Template KPI ${next.code} diubah menjadi ${input.isActive ? "Aktif" : "Non-Aktif"}.`,
          oldValues: { isActive: existing.isActive },
          newValues: { isActive: next.isActive },
        },
      };
    });

    revalidatePath("/kpi/templates");
    return {
      data: updated,
      message: updated.isActive
        ? "Template KPI diaktifkan."
        : "Template KPI dinonaktifkan.",
    };
  },
});

export const deleteKpiTemplateAction = createProtectedAction({
  permission: PERMISSIONS.KPI_TEMPLATE_MANAGE,
  schema: deleteKpiTemplateSchema,
  handler: async ({ ctx, input }) => {
    const deleted = await executeAuditedMutation(ctx, async (tx) => {
      const existing = await tx.kpiTemplate.findFirst({
        where: { id: input.templateId, deletedAt: null },
      });
      if (!existing) {
        throw new DomainError("NOT_FOUND", "Template KPI tidak ditemukan.");
      }

      const now = new Date();
      const next = await tx.kpiTemplate.update({
        where: { id: existing.id },
        data: {
          deletedAt: now,
          isActive: false,
        },
        select: {
          id: true,
          code: true,
          name: true,
          deletedAt: true,
        },
      });

      return {
        result: { id: next.id, code: next.code, name: next.name },
        audit: {
          module: "TEAM_KPI" as const,
          action: "KPI_TEMPLATE_DELETED",
          entityType: "KPI_TEMPLATE",
          entityId: next.id,
          summary: `Template KPI ${next.code} (${next.name}) dihapus (soft-delete).`,
          oldValues: {
            code: existing.code,
            name: existing.name,
            isActive: existing.isActive,
            deletedAt: null,
          },
          newValues: {
            isActive: false,
            deletedAt: next.deletedAt?.toISOString() ?? now.toISOString(),
          },
        },
      };
    });

    revalidatePath("/kpi/templates");
    revalidatePath("/kpi/evaluations");
    return {
      data: deleted,
      message: `Template KPI ${deleted.code} berhasil dihapus.`,
    };
  },
});

export const assignKpiMonthlyAction = createProtectedAction({
  permission: PERMISSIONS.KPI_ASSIGNMENT_MANAGE,
  schema: assignKpiMonthlySchema,
  handler: async ({ ctx, input }) => {
    const totalWeightCents = input.items.reduce(
      (sum, item) => sum + Math.round(item.weight * 100),
      0
    );
    if (totalWeightCents !== 10000) {
      throw new DomainError(
        "VALIDATION_ERROR",
        `Total bobot seluruh indikator KPI wajib tepat 100% (saat ini: ${totalWeightCents / 100}%).`,
        {
          items: [
            `Total bobot saat ini ${totalWeightCents / 100}%, harus tepat 100%.`,
          ],
        }
      );
    }

    const periodLabel = formatPeriodMonthLabel(
      input.periodYear,
      input.periodMonth
    );

    const saved = await executeAuditedMutation(ctx, async (tx) => {
      const targetUser = await tx.user.findFirst({
        where: { id: input.userId, isActive: true, deletedAt: null },
        select: { id: true, fullName: true },
      });
      if (!targetUser) {
        throw new DomainError(
          "NOT_FOUND",
          "Anggota tim tidak ditemukan atau berstatus non-aktif."
        );
      }

      const finalizedEval = await tx.monthlyEvaluation.findUnique({
        where: {
          userId_periodYear_periodMonth: {
            userId: input.userId,
            periodYear: input.periodYear,
            periodMonth: input.periodMonth,
          },
        },
        select: { id: true, status: true },
      });

      if (finalizedEval?.status === "FINALIZED") {
        throw new DomainError(
          "PERIOD_LOCKED",
          `Evaluasi KPI ${targetUser.fullName} untuk periode ${periodLabel} sudah berstatus FINALIZED sehingga target & bobot tidak dapat diubah.`
        );
      }

      const templateIds = input.items.map((i) => i.kpiTemplateId);
      const templates = await tx.kpiTemplate.findMany({
        where: {
          id: { in: templateIds },
          deletedAt: null,
          isActive: true,
        },
        select: { id: true, code: true, name: true },
      });
      if (templates.length !== templateIds.length) {
        throw new DomainError(
          "VALIDATION_ERROR",
          "Satu atau lebih template KPI tidak aktif atau tidak ditemukan."
        );
      }

      const oldAssignments = await tx.kpiAssignment.findMany({
        where: {
          userId: input.userId,
          periodYear: input.periodYear,
          periodMonth: input.periodMonth,
        },
        select: {
          kpiTemplateId: true,
          targetValue: true,
          weight: true,
        },
      });

      await tx.kpiAssignment.deleteMany({
        where: {
          userId: input.userId,
          periodYear: input.periodYear,
          periodMonth: input.periodMonth,
          kpiTemplateId: { notIn: templateIds },
        },
      });

      const upsertedIds: string[] = [];
      for (const item of input.items) {
        const record = await tx.kpiAssignment.upsert({
          where: {
            userId_kpiTemplateId_periodYear_periodMonth: {
              userId: input.userId,
              kpiTemplateId: item.kpiTemplateId,
              periodYear: input.periodYear,
              periodMonth: input.periodMonth,
            },
          },
          update: {
            targetValue: new Prisma.Decimal(round2(item.targetValue)),
            weight: new Prisma.Decimal(round2(item.weight)),
            assignedBy: ctx.userId,
          },
          create: {
            userId: input.userId,
            kpiTemplateId: item.kpiTemplateId,
            periodYear: input.periodYear,
            periodMonth: input.periodMonth,
            targetValue: new Prisma.Decimal(round2(item.targetValue)),
            weight: new Prisma.Decimal(round2(item.weight)),
            assignedBy: ctx.userId,
          },
          select: { id: true },
        });
        upsertedIds.push(record.id);
      }

      return {
        result: {
          userId: input.userId,
          periodMonth: periodLabel,
          assignedCount: upsertedIds.length,
        },
        audit: {
          module: "TEAM_KPI" as const,
          action: "KPI_ASSIGNMENTS_SAVED",
          entityType: "KPI_ASSIGNMENT",
          entityId: input.userId,
          summary: `Penetapan target KPI ${targetUser.fullName} periode ${periodLabel} (${upsertedIds.length} indikator, total 100%) disimpan.`,
          oldValues: {
            periodMonth: periodLabel,
            items: oldAssignments.map((a) => ({
              kpiTemplateId: a.kpiTemplateId,
              targetValue: decimalToNumber(a.targetValue),
              weight: decimalToNumber(a.weight),
            })),
          },
          newValues: {
            periodMonth: periodLabel,
            items: input.items,
          },
        },
        notifications: [
          {
            recipientId: input.userId,
            type: NotificationType.SYSTEM_ALERT,
            title: `Target KPI Periode ${periodLabel} Ditetapkan`,
            message: `${ctx.fullName} telah menetapkan ${upsertedIds.length} indikator KPI (total bobot 100%) untuk Anda pada periode ${periodLabel}.`,
            actionUrl: `/team/${input.userId}?period=${periodLabel}`,
            metadata: { periodMonth: periodLabel },
          },
        ],
      };
    });

    revalidatePath("/kpi/templates");
    revalidatePath("/kpi/evaluations");
    revalidatePath(`/team/${input.userId}`);

    return {
      data: saved,
      message: `Target & bobot KPI periode ${periodLabel} berhasil disimpan (100%).`,
    };
  },
});

export const clonePreviousMonthAssignmentsAction = createProtectedAction({
  permission: PERMISSIONS.KPI_ASSIGNMENT_MANAGE,
  schema: clonePreviousMonthAssignmentsSchema,
  handler: async ({ ctx, input }) => {
    const prev = getPreviousYearMonth(input.targetYear, input.targetMonth);
    const targetPeriodLabel = formatPeriodMonthLabel(
      input.targetYear,
      input.targetMonth
    );

    const outcome = await executeAuditedMutation(ctx, async (tx) => {
      const [
        sourceAssignments,
        existingTargetAssignments,
        finalizedEvaluations,
        activeUsers,
      ] = await Promise.all([
        tx.kpiAssignment.findMany({
          where: {
            periodYear: prev.year,
            periodMonth: prev.month,
            ...(input.userId ? { userId: input.userId } : {}),
            kpiTemplate: {
              isActive: true,
              deletedAt: null,
            },
          },
          select: {
            userId: true,
            kpiTemplateId: true,
            targetValue: true,
            weight: true,
          },
        }),
        tx.kpiAssignment.findMany({
          where: {
            periodYear: input.targetYear,
            periodMonth: input.targetMonth,
            ...(input.userId ? { userId: input.userId } : {}),
          },
          select: { userId: true },
        }),
        tx.monthlyEvaluation.findMany({
          where: {
            periodYear: input.targetYear,
            periodMonth: input.targetMonth,
            status: "FINALIZED",
            ...(input.userId ? { userId: input.userId } : {}),
          },
          select: { userId: true },
        }),
        tx.user.findMany({
          where: {
            isActive: true,
            deletedAt: null,
            ...(input.userId ? { id: input.userId } : {}),
          },
          select: { id: true, fullName: true },
        }),
      ]);

      if (sourceAssignments.length === 0) {
        throw new DomainError(
          "NOT_FOUND",
          `Tidak ditemukan assignment KPI aktif pada bulan sebelumnya (${prev.periodMonth}) untuk disalin.`
        );
      }

      const activeUserSet = new Set(activeUsers.map((u) => u.id));
      const existingTargetUsers = new Set(
        existingTargetAssignments.map((a) => a.userId)
      );
      const finalizedUsers = new Set(
        finalizedEvaluations.map((e) => e.userId)
      );

      const sourceByUser = new Map<
        string,
        Array<{
          kpiTemplateId: string;
          targetValue: Prisma.Decimal;
          weight: Prisma.Decimal;
        }>
      >();
      for (const sa of sourceAssignments) {
        if (!activeUserSet.has(sa.userId)) continue;
        const list = sourceByUser.get(sa.userId) ?? [];
        list.push({
          kpiTemplateId: sa.kpiTemplateId,
          targetValue: sa.targetValue,
          weight: sa.weight,
        });
        sourceByUser.set(sa.userId, list);
      }

      let clonedUsersCount = 0;
      let clonedItemsCount = 0;
      let skippedExistingCount = 0;
      let skippedFinalizedCount = 0;
      let skippedInvalidWeightCount = 0;

      const toInsert: Array<{
        userId: string;
        kpiTemplateId: string;
        periodYear: number;
        periodMonth: number;
        targetValue: Prisma.Decimal;
        weight: Prisma.Decimal;
        assignedBy: string;
      }> = [];
      const usersToOverwrite: string[] = [];

      for (const [uid, items] of sourceByUser.entries()) {
        if (finalizedUsers.has(uid)) {
          skippedFinalizedCount += 1;
          continue;
        }
        if (existingTargetUsers.has(uid) && !input.overwriteExisting) {
          skippedExistingCount += 1;
          continue;
        }
        const weightSumCents = items.reduce(
          (sum, item) => sum + Math.round(Number(item.weight) * 100),
          0
        );
        if (weightSumCents !== 10000) {
          skippedInvalidWeightCount += 1;
          continue;
        }

        if (existingTargetUsers.has(uid) && input.overwriteExisting) {
          usersToOverwrite.push(uid);
        }

        clonedUsersCount += 1;
        for (const item of items) {
          clonedItemsCount += 1;
          toInsert.push({
            userId: uid,
            kpiTemplateId: item.kpiTemplateId,
            periodYear: input.targetYear,
            periodMonth: input.targetMonth,
            targetValue: item.targetValue,
            weight: item.weight,
            assignedBy: ctx.userId,
          });
        }
      }

      if (usersToOverwrite.length > 0) {
        await tx.kpiAssignment.deleteMany({
          where: {
            userId: { in: usersToOverwrite },
            periodYear: input.targetYear,
            periodMonth: input.targetMonth,
          },
        });
      }

      if (toInsert.length > 0) {
        await tx.kpiAssignment.createMany({
          data: toInsert,
          skipDuplicates: true,
        });
      }

      return {
        result: {
          sourcePeriod: prev.periodMonth,
          targetPeriod: targetPeriodLabel,
          clonedUsersCount,
          clonedItemsCount,
          skippedExistingCount,
          skippedFinalizedCount,
          skippedInvalidWeightCount,
        },
        audit: {
          module: "TEAM_KPI" as const,
          action: "KPI_ASSIGNMENTS_CLONED",
          entityType: "KPI_ASSIGNMENT",
          entityId: input.userId ?? null,
          summary: `Clone KPI assignment dari ${prev.periodMonth} ke ${targetPeriodLabel}: ${clonedUsersCount} anggota (${clonedItemsCount} item) disalin.`,
          newValues: {
            sourcePeriod: prev.periodMonth,
            targetPeriod: targetPeriodLabel,
            clonedUsersCount,
            clonedItemsCount,
            skippedExistingCount,
            skippedFinalizedCount,
            skippedInvalidWeightCount,
          },
        },
      };
    });

    revalidatePath("/kpi/templates");
    revalidatePath("/kpi/evaluations");

    return {
      data: outcome,
      message:
        outcome.clonedUsersCount > 0
          ? `Berhasil menyalin assignment KPI dari ${prev.periodMonth} ke ${targetPeriodLabel} untuk ${outcome.clonedUsersCount} anggota.`
          : `Tidak ada assignment baru disalin (${outcome.skippedExistingCount} anggota sudah memiliki konfigurasi pada ${targetPeriodLabel}).`,
    };
  },
});
