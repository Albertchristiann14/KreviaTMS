"use server";

import { revalidatePath } from "next/cache";
import {
  EvaluationStatus,
  NotificationType,
  Prisma,
} from "@prisma/client";
import {
  hasAnyPermission,
  hasPermission,
  PERMISSIONS,
  type RoleCode,
} from "@/lib/constants/permissions";
import { createProtectedAction } from "@/server/actions/safe-action";
import { executeAuditedMutation } from "@/server/services/audit-logger";
import { DomainError } from "@/types/action-result";
import {
  generateMonthlyEvaluationSchema,
  reopenEvaluationSchema,
  resyncDraftEvaluationSchema,
  transitionEvaluationStatusSchema,
  updateEvaluationScoresSchema,
} from "@/features/team-kpi/schemas/evaluation.schema";
import {
  buildAutoMetricsSnapshot,
  computeUserMonthlyMetrics,
  computeWeightedScoreAndGrade,
  decimalToNumber,
  formatPeriodMonthLabel,
  parsePeriodMonthString,
  resolveItemAchievement,
  round2,
} from "@/features/team-kpi/services/kpi-aggregator.service";

function assertCanEvaluateTarget(params: {
  actorUserId: string;
  actorRole: RoleCode;
  evaluateeUserId: string;
  evaluateeRole: RoleCode;
}) {
  if (params.actorUserId === params.evaluateeUserId) {
    throw new DomainError(
      "FORBIDDEN",
      "Anda tidak dapat membuat, mengubah skor, atau memfinalisasi evaluasi untuk diri sendiri (Separation of Duties)."
    );
  }

  if (
    (params.evaluateeRole === "PROJECT_MANAGER" ||
      params.evaluateeRole === "SUPER_ADMIN") &&
    params.actorRole !== "SUPER_ADMIN"
  ) {
    throw new DomainError(
      "FORBIDDEN",
      "Evaluasi Project Manager dan Leadership wajib dilakukan secara eksklusif oleh Super Admin."
    );
  }
}

export const generateMonthlyEvaluationAction = createProtectedAction({
  permission: PERMISSIONS.KPI_EVALUATION_CREATE,
  schema: generateMonthlyEvaluationSchema,
  handler: async ({ ctx, input }) => {
    const resolvedPeriod = input.periodMonth
      ? parsePeriodMonthString(input.periodMonth)
      : {
          year: input.periodYear!,
          month: input.periodMonthNum!,
          periodMonth: formatPeriodMonthLabel(
            input.periodYear!,
            input.periodMonthNum!
          ),
        };

    const { year, month, periodMonth } = resolvedPeriod;

    const result = await executeAuditedMutation(ctx, async (tx) => {
      const targetUsers = input.userId
        ? await tx.user.findMany({
            where: { id: input.userId, isActive: true, deletedAt: null },
            select: {
              id: true,
              fullName: true,
              managerId: true,
              role: { select: { code: true } },
            },
          })
        : await tx.user.findMany({
            where: { isActive: true, deletedAt: null },
            orderBy: { fullName: "asc" },
            select: {
              id: true,
              fullName: true,
              managerId: true,
              role: { select: { code: true } },
            },
          });

      if (input.userId && targetUsers.length === 0) {
        throw new DomainError(
          "NOT_FOUND",
          "Anggota tim tidak ditemukan atau berstatus non-aktif."
        );
      }

      if (input.userId && targetUsers[0]) {
        assertCanEvaluateTarget({
          actorUserId: ctx.userId,
          actorRole: ctx.roleCode,
          evaluateeUserId: targetUsers[0].id,
          evaluateeRole: targetUsers[0].role.code as RoleCode,
        });
      }

      const candidateUserIds = targetUsers.map((u) => u.id);
      const [existingEvaluations, periodAssignments] = await Promise.all([
        tx.monthlyEvaluation.findMany({
          where: {
            userId: { in: candidateUserIds },
            periodYear: year,
            periodMonth: month,
          },
          select: { id: true, userId: true },
        }),
        tx.kpiAssignment.findMany({
          where: {
            userId: { in: candidateUserIds },
            periodYear: year,
            periodMonth: month,
          },
          include: {
            kpiTemplate: {
              select: {
                id: true,
                name: true,
                metricSource: true,
              },
            },
          },
        }),
      ]);

      const existingByUser = new Set(existingEvaluations.map((e) => e.userId));
      const assignmentsByUser = new Map<
        string,
        typeof periodAssignments
      >();
      for (const a of periodAssignments) {
        const list = assignmentsByUser.get(a.userId) ?? [];
        list.push(a);
        assignmentsByUser.set(a.userId, list);
      }

      const createdEvaluations: Array<{
        id: string;
        userId: string;
        userName: string;
        weightedKpiScore: number;
        grade: string;
      }> = [];
      const skipped: Array<{ userId: string; fullName: string; reason: string }> =
        [];

      for (const target of targetUsers) {
        const targetRole = target.role.code as RoleCode;

        if (target.id === ctx.userId) {
          skipped.push({
            userId: target.id,
            fullName: target.fullName,
            reason: "Tidak dapat membuat evaluasi diri sendiri.",
          });
          continue;
        }

        if (
          (targetRole === "PROJECT_MANAGER" || targetRole === "SUPER_ADMIN") &&
          ctx.roleCode !== "SUPER_ADMIN"
        ) {
          skipped.push({
            userId: target.id,
            fullName: target.fullName,
            reason: "Evaluasi PM/Leadership khusus Super Admin.",
          });
          continue;
        }

        if (existingByUser.has(target.id)) {
          if (input.userId) {
            throw new DomainError(
              "CONFLICT",
              `Evaluasi bulanan ${target.fullName} untuk periode ${periodMonth} sudah pernah dibuat.`
            );
          }
          skipped.push({
            userId: target.id,
            fullName: target.fullName,
            reason: "Evaluasi periode ini sudah ada.",
          });
          continue;
        }

        const userAssignments = assignmentsByUser.get(target.id) ?? [];
        if (userAssignments.length === 0) {
          if (input.userId) {
            throw new DomainError(
              "VALIDATION_ERROR",
              `${target.fullName} belum memiliki penetapan KPI (kpi_assignments) untuk periode ${periodMonth}. Atur di KPI Templates & Targets terlebih dahulu.`
            );
          }
          skipped.push({
            userId: target.id,
            fullName: target.fullName,
            reason: "Belum ada KPI assignment untuk periode ini.",
          });
          continue;
        }

        const weightSumCents = userAssignments.reduce(
          (sum, a) => sum + Math.round(Number(a.weight) * 100),
          0
        );
        if (weightSumCents !== 10000) {
          if (input.userId) {
            throw new DomainError(
              "VALIDATION_ERROR",
              `Total bobot KPI assignment ${target.fullName} periode ${periodMonth} harus tepat 100% (saat ini: ${weightSumCents / 100}%).`
            );
          }
          skipped.push({
            userId: target.id,
            fullName: target.fullName,
            reason: `Total bobot KPI tidak sama dengan 100% (${weightSumCents / 100}%).`,
          });
          continue;
        }

        const cpvsAssignment = userAssignments.find(
          (a) => a.kpiTemplate.metricSource === "AUTO_CPVS"
        );
        const cpvsTargetOverride = cpvsAssignment
          ? (decimalToNumber(cpvsAssignment.targetValue) ?? 0)
          : null;

        const metrics = await computeUserMonthlyMetrics(target.id, year, month, {
          cpvsTargetOverride,
          tx,
        });
        const snapshot = buildAutoMetricsSnapshot(metrics);

        const itemDrafts = userAssignments.map((a) => {
          const targetVal = decimalToNumber(a.targetValue) ?? 0;
          const weightVal = decimalToNumber(a.weight) ?? 0;
          const resolved = resolveItemAchievement({
            metricSource: a.kpiTemplate.metricSource,
            metrics,
            targetValue: targetVal,
            manualActualValue: null,
          });
          const weightedScore =
            resolved.achievementPct !== null
              ? round2((resolved.achievementPct * weightVal) / 100)
              : null;

          return {
            kpiAssignmentId: a.id,
            kpiTemplateId: a.kpiTemplateId,
            indicatorNameSnapshot: a.kpiTemplate.name.slice(0, 150),
            metricSource: a.kpiTemplate.metricSource,
            targetValue: new Prisma.Decimal(targetVal),
            actualValue:
              resolved.actualValue !== null
                ? new Prisma.Decimal(resolved.actualValue)
                : null,
            weight: new Prisma.Decimal(weightVal),
            achievementPct:
              resolved.achievementPct !== null
                ? new Prisma.Decimal(resolved.achievementPct)
                : null,
            weightedScore:
              weightedScore !== null
                ? new Prisma.Decimal(weightedScore)
                : null,
            rawWeight: weightVal,
            rawAchievementPct: resolved.achievementPct,
          };
        });

        const scoreSummary = computeWeightedScoreAndGrade(
          itemDrafts.map((d) => ({
            weight: d.rawWeight,
            achievementPct: d.rawAchievementPct,
          }))
        );

        const created = await tx.monthlyEvaluation.create({
          data: {
            userId: target.id,
            evaluatorId: ctx.userId,
            periodYear: year,
            periodMonth: month,
            status: EvaluationStatus.DRAFT,
            totalTasksAssigned: metrics.totalTasksAssigned,
            totalTasksCompleted: metrics.totalTasksCompleted,
            tasksCompletedOnTime: metrics.tasksCompletedOnTime,
            completionRate:
              metrics.completionRate !== null
                ? new Prisma.Decimal(metrics.completionRate)
                : null,
            onTimeRate:
              metrics.onTimeRate !== null
                ? new Prisma.Decimal(metrics.onTimeRate)
                : null,
            avgRevisionCount:
              metrics.avgRevisionCount !== null
                ? new Prisma.Decimal(metrics.avgRevisionCount)
                : null,
            designQualityScore:
              metrics.designQualityScore !== null
                ? new Prisma.Decimal(metrics.designQualityScore)
                : null,
            weightedKpiScore: new Prisma.Decimal(scoreSummary.weightedKpiScore),
            performanceGrade: scoreSummary.grade,
            autoMetricsSnapshot: snapshot as unknown as Prisma.InputJsonValue,
            items: {
              create: itemDrafts.map((d) => ({
                kpiAssignmentId: d.kpiAssignmentId,
                kpiTemplateId: d.kpiTemplateId,
                indicatorNameSnapshot: d.indicatorNameSnapshot,
                metricSource: d.metricSource,
                targetValue: d.targetValue,
                actualValue: d.actualValue,
                weight: d.weight,
                achievementPct: d.achievementPct,
                weightedScore: d.weightedScore,
              })),
            },
          },
          select: { id: true },
        });

        createdEvaluations.push({
          id: created.id,
          userId: target.id,
          userName: target.fullName,
          weightedKpiScore: scoreSummary.weightedKpiScore,
          grade: scoreSummary.grade,
        });
      }

      if (createdEvaluations.length === 0 && input.generateAll) {
        throw new DomainError(
          "VALIDATION_ERROR",
          "Tidak ada evaluasi baru yang dapat digenerate pada periode ini (periksa assignment KPI 100% atau evaluasi yang sudah ada)."
        );
      }

      return {
        result: {
          periodMonth,
          createdCount: createdEvaluations.length,
          createdEvaluations,
          skipped,
        },
        audit: {
          module: "TEAM_KPI" as const,
          action: "KPI_DRAFT_GENERATED",
          entityType: "MONTHLY_EVALUATION",
          entityId:
            createdEvaluations.length === 1
              ? (createdEvaluations[0]?.id ?? null)
              : null,
          summary: `Generate draft evaluasi KPI periode ${periodMonth} untuk ${createdEvaluations.length} anggota tim.`,
          newValues: {
            periodMonth,
            createdCount: createdEvaluations.length,
            evaluationIds: createdEvaluations.map((e) => e.id),
          },
        },
        notifications: createdEvaluations.map((ev) => ({
          recipientId: ev.userId,
          type: NotificationType.KPI_EVALUATION_OPEN,
          title: `Evaluasi KPI Periode ${periodMonth} Dibuka`,
          message: `Draft evaluasi kinerja bulanan Anda untuk periode ${periodMonth} telah dibuat oleh ${ctx.fullName}.`,
          entityType: "MONTHLY_EVALUATION",
          entityId: ev.id,
          actionUrl: `/kpi/evaluations`,
          metadata: { periodMonth },
        })),
      };
    });

    revalidatePath("/kpi/evaluations");
    revalidatePath("/kpi/dashboard");

    return {
      data: result,
      message:
        result.createdCount === 1
          ? `Draft evaluasi KPI periode ${periodMonth} untuk ${result.createdEvaluations[0]?.userName ?? "anggota"} berhasil dibuat.`
          : `${result.createdCount} draft evaluasi KPI periode ${periodMonth} berhasil dibuat.`,
    };
  },
});

export const resyncDraftEvaluationAction = createProtectedAction({
  permission: PERMISSIONS.KPI_EVALUATION_CREATE,
  schema: resyncDraftEvaluationSchema,
  handler: async ({ ctx, input }) => {
    const updated = await executeAuditedMutation(ctx, async (tx) => {
      const evaluation = await tx.monthlyEvaluation.findUnique({
        where: { id: input.evaluationId },
        include: {
          user: { select: { fullName: true, role: { select: { code: true } } } },
          items: true,
        },
      });

      if (!evaluation) {
        throw new DomainError("NOT_FOUND", "Dokumen evaluasi tidak ditemukan.");
      }

      assertCanEvaluateTarget({
        actorUserId: ctx.userId,
        actorRole: ctx.roleCode,
        evaluateeUserId: evaluation.userId,
        evaluateeRole: evaluation.user.role.code as RoleCode,
      });

      if (evaluation.status === "FINALIZED") {
        throw new DomainError(
          "PERIOD_LOCKED",
          "Evaluasi sudah berstatus FINALIZED dan tidak dapat disinkronkan ulang."
        );
      }

      if (evaluation.status !== "DRAFT") {
        throw new DomainError(
          "INVALID_STATE_TRANSITION",
          "Refresh metrik otomatis hanya dapat dilakukan ketika evaluasi masih berstatus DRAFT."
        );
      }

      const cpvsItem = evaluation.items.find(
        (i) => i.metricSource === "AUTO_CPVS"
      );
      const cpvsTarget = cpvsItem ? decimalToNumber(cpvsItem.targetValue) : null;

      const metrics = await computeUserMonthlyMetrics(
        evaluation.userId,
        evaluation.periodYear,
        evaluation.periodMonth,
        { cpvsTargetOverride: cpvsTarget, tx }
      );
      const snapshot = buildAutoMetricsSnapshot(metrics);

      const recalculatedItems: Array<{
        weight: number;
        achievementPct: number | null;
      }> = [];

      for (const item of evaluation.items) {
        const weightVal = decimalToNumber(item.weight) ?? 0;
        const targetVal = decimalToNumber(item.targetValue) ?? 0;

        if (item.metricSource === "MANUAL_SCORE") {
          const ach = decimalToNumber(item.achievementPct);
          recalculatedItems.push({ weight: weightVal, achievementPct: ach });
          continue;
        }

        const resolved = resolveItemAchievement({
          metricSource: item.metricSource,
          metrics,
          targetValue: targetVal,
          manualActualValue: null,
        });
        const weightedScore =
          resolved.achievementPct !== null
            ? round2((resolved.achievementPct * weightVal) / 100)
            : null;

        await tx.evaluationItem.update({
          where: { id: item.id },
          data: {
            actualValue:
              resolved.actualValue !== null
                ? new Prisma.Decimal(resolved.actualValue)
                : null,
            achievementPct:
              resolved.achievementPct !== null
                ? new Prisma.Decimal(resolved.achievementPct)
                : null,
            weightedScore:
              weightedScore !== null
                ? new Prisma.Decimal(weightedScore)
                : null,
          },
        });

        recalculatedItems.push({
          weight: weightVal,
          achievementPct: resolved.achievementPct,
        });
      }

      const scoreSummary = computeWeightedScoreAndGrade(recalculatedItems);

      const saved = await tx.monthlyEvaluation.update({
        where: { id: evaluation.id },
        data: {
          totalTasksAssigned: metrics.totalTasksAssigned,
          totalTasksCompleted: metrics.totalTasksCompleted,
          tasksCompletedOnTime: metrics.tasksCompletedOnTime,
          completionRate:
            metrics.completionRate !== null
              ? new Prisma.Decimal(metrics.completionRate)
              : null,
          onTimeRate:
            metrics.onTimeRate !== null
              ? new Prisma.Decimal(metrics.onTimeRate)
              : null,
          avgRevisionCount:
            metrics.avgRevisionCount !== null
              ? new Prisma.Decimal(metrics.avgRevisionCount)
              : null,
          designQualityScore:
            metrics.designQualityScore !== null
              ? new Prisma.Decimal(metrics.designQualityScore)
              : null,
          weightedKpiScore: new Prisma.Decimal(scoreSummary.weightedKpiScore),
          performanceGrade: scoreSummary.grade,
          autoMetricsSnapshot: snapshot as unknown as Prisma.InputJsonValue,
        },
        select: {
          id: true,
          weightedKpiScore: true,
          performanceGrade: true,
        },
      });

      const periodLabel = formatPeriodMonthLabel(
        evaluation.periodYear,
        evaluation.periodMonth
      );

      return {
        result: {
          id: saved.id,
          weightedKpiScore: decimalToNumber(saved.weightedKpiScore) ?? 0,
          grade: saved.performanceGrade,
        },
        audit: {
          module: "TEAM_KPI" as const,
          action: "KPI_DRAFT_RESYNCED",
          entityType: "MONTHLY_EVALUATION",
          entityId: evaluation.id,
          summary: `Metrik otomatis evaluasi ${evaluation.user.fullName} (${periodLabel}) disinkronkan ulang.`,
          oldValues: {
            weightedKpiScore: decimalToNumber(evaluation.weightedKpiScore),
            completionRate: decimalToNumber(evaluation.completionRate),
            onTimeRate: decimalToNumber(evaluation.onTimeRate),
          },
          newValues: {
            weightedKpiScore: scoreSummary.weightedKpiScore,
            completionRate: metrics.completionRate,
            onTimeRate: metrics.onTimeRate,
            designQualityScore: metrics.designQualityScore,
          },
        },
      };
    });

    revalidatePath(`/kpi/evaluations/${input.evaluationId}`);
    revalidatePath("/kpi/evaluations");

    return {
      data: updated,
      message: "Metrik otomatis berhasil disinkronkan dari data operasional terbaru.",
    };
  },
});

export const updateEvaluationScoresAction = createProtectedAction({
  permission: PERMISSIONS.KPI_EVALUATION_REVIEW,
  schema: updateEvaluationScoresSchema,
  handler: async ({ ctx, input }) => {
    const saved = await executeAuditedMutation(ctx, async (tx) => {
      const evaluation = await tx.monthlyEvaluation.findUnique({
        where: { id: input.evaluationId },
        include: {
          user: { select: { fullName: true, role: { select: { code: true } } } },
          items: true,
        },
      });

      if (!evaluation) {
        throw new DomainError("NOT_FOUND", "Dokumen evaluasi tidak ditemukan.");
      }

      assertCanEvaluateTarget({
        actorUserId: ctx.userId,
        actorRole: ctx.roleCode,
        evaluateeUserId: evaluation.userId,
        evaluateeRole: evaluation.user.role.code as RoleCode,
      });

      if (evaluation.status === "FINALIZED") {
        throw new DomainError(
          "PERIOD_LOCKED",
          "Evaluasi sudah FINALIZED dan terkunci permanen. Hubungi Super Admin untuk Reopen jika ada koreksi mendesak."
        );
      }

      const inputByItemId = new Map(
        input.items.map((item) => [item.itemId, item])
      );

      for (const submitted of input.items) {
        const dbItem = evaluation.items.find((i) => i.id === submitted.itemId);
        if (!dbItem) {
          throw new DomainError(
            "VALIDATION_ERROR",
            "Item evaluasi tidak ditemukan dalam dokumen ini."
          );
        }
        if (
          dbItem.metricSource !== "MANUAL_SCORE" &&
          submitted.manualScore !== null
        ) {
          throw new DomainError(
            "FORBIDDEN",
            `Indikator '${dbItem.indicatorNameSnapshot}' bertipe ${dbItem.metricSource} (read-only) dan tidak dapat diubah manual.`
          );
        }
      }

      const oldItemSnapshots = evaluation.items.map((i) => ({
        id: i.id,
        metricSource: i.metricSource,
        actualValue: decimalToNumber(i.actualValue),
      }));

      const nextScoreItems: Array<{
        weight: number;
        achievementPct: number | null;
      }> = [];

      for (const dbItem of evaluation.items) {
        const weightVal = decimalToNumber(dbItem.weight) ?? 0;
        const incoming = inputByItemId.get(dbItem.id);

        if (dbItem.metricSource === "MANUAL_SCORE" && incoming) {
          const nextScore =
            incoming.manualScore !== null
              ? round2(Math.max(0, Math.min(100, incoming.manualScore)))
              : null;
          const weightedScore =
            nextScore !== null ? round2((nextScore * weightVal) / 100) : null;

          await tx.evaluationItem.update({
            where: { id: dbItem.id },
            data: {
              actualValue:
                nextScore !== null ? new Prisma.Decimal(nextScore) : null,
              achievementPct:
                nextScore !== null ? new Prisma.Decimal(nextScore) : null,
              weightedScore:
                weightedScore !== null
                  ? new Prisma.Decimal(weightedScore)
                  : null,
              evidenceNotes:
                incoming.evidenceNotes !== undefined
                  ? (incoming.evidenceNotes ?? null)
                  : dbItem.evidenceNotes,
            },
          });

          nextScoreItems.push({ weight: weightVal, achievementPct: nextScore });
        } else {
          if (incoming?.evidenceNotes !== undefined) {
            await tx.evaluationItem.update({
              where: { id: dbItem.id },
              data: { evidenceNotes: incoming.evidenceNotes ?? null },
            });
          }
          nextScoreItems.push({
            weight: weightVal,
            achievementPct: decimalToNumber(dbItem.achievementPct),
          });
        }
      }

      const scoreSummary = computeWeightedScoreAndGrade(nextScoreItems);

      const updatedEval = await tx.monthlyEvaluation.update({
        where: { id: evaluation.id },
        data: {
          evaluatorId: ctx.userId,
          evaluatorNotes:
            input.evaluatorNotes !== undefined
              ? (input.evaluatorNotes ?? null)
              : evaluation.evaluatorNotes,
          selfAssessmentNotes:
            input.selfAssessmentNotes !== undefined
              ? (input.selfAssessmentNotes ?? null)
              : evaluation.selfAssessmentNotes,
          weightedKpiScore: new Prisma.Decimal(scoreSummary.weightedKpiScore),
          performanceGrade: scoreSummary.grade,
        },
        select: {
          id: true,
          weightedKpiScore: true,
          performanceGrade: true,
        },
      });

      const periodLabel = formatPeriodMonthLabel(
        evaluation.periodYear,
        evaluation.periodMonth
      );

      return {
        result: {
          id: updatedEval.id,
          weightedKpiScore: decimalToNumber(updatedEval.weightedKpiScore) ?? 0,
          grade: updatedEval.performanceGrade,
          activeWeightPercent: scoreSummary.activeWeightPercent,
        },
        audit: {
          module: "TEAM_KPI" as const,
          action: "KPI_EVALUATION_SCORES_UPDATED",
          entityType: "MONTHLY_EVALUATION",
          entityId: evaluation.id,
          summary: `Skor manual & catatan evaluasi ${evaluation.user.fullName} (${periodLabel}) diperbarui.`,
          oldValues: {
            weightedKpiScore: decimalToNumber(evaluation.weightedKpiScore),
            evaluatorNotes: evaluation.evaluatorNotes,
            items: oldItemSnapshots,
          },
          newValues: {
            weightedKpiScore: scoreSummary.weightedKpiScore,
            grade: scoreSummary.grade,
            evaluatorNotes:
              input.evaluatorNotes !== undefined
                ? input.evaluatorNotes
                : evaluation.evaluatorNotes,
            items: input.items,
          },
        },
      };
    });

    revalidatePath(`/kpi/evaluations/${input.evaluationId}`);
    revalidatePath("/kpi/evaluations");
    revalidatePath("/kpi/dashboard");

    return {
      data: saved,
      message: "Skor penilaian dan catatan evaluator berhasil disimpan.",
    };
  },
});

export const transitionEvaluationStatusAction = createProtectedAction({
  permission: null,
  schema: transitionEvaluationStatusSchema,
  handler: async ({ ctx, input }) => {
    const outcome = await executeAuditedMutation(ctx, async (tx) => {
      const evaluation = await tx.monthlyEvaluation.findUnique({
        where: { id: input.evaluationId },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              role: { select: { code: true } },
            },
          },
          items: true,
        },
      });

      if (!evaluation) {
        throw new DomainError("NOT_FOUND", "Dokumen evaluasi tidak ditemukan.");
      }

      const evaluateeRole = evaluation.user.role.code as RoleCode;
      assertCanEvaluateTarget({
        actorUserId: ctx.userId,
        actorRole: ctx.roleCode,
        evaluateeUserId: evaluation.userId,
        evaluateeRole,
      });

      const hasEvaluatorPerm =
        ctx.roleCode === "SUPER_ADMIN" ||
        hasAnyPermission(
          ctx.permissions,
          [
            PERMISSIONS.KPI_EVALUATION_CREATE,
            PERMISSIONS.KPI_EVALUATION_REVIEW,
            PERMISSIONS.KPI_EVALUATION_FINALIZE,
          ],
          ctx.roleCode
        );
      if (!hasEvaluatorPerm) {
        throw new DomainError(
          "FORBIDDEN",
          "Anda tidak memiliki izin evaluator (kpi:evaluation:create / kpi:evaluation:review) untuk mengubah status evaluasi anggota tim."
        );
      }

      if (evaluation.status === "FINALIZED") {
        throw new DomainError(
          "PERIOD_LOCKED",
          "Evaluasi sudah FINALIZED. Gunakan aksi Reopen Evaluation khusus Super Admin untuk membuka kembali."
        );
      }

      const currentStatus = evaluation.status;
      const targetStatus = input.targetStatus;
      const periodLabel = formatPeriodMonthLabel(
        evaluation.periodYear,
        evaluation.periodMonth
      );

      const effectiveNotes = (
        input.evaluatorNotes !== undefined
          ? (input.evaluatorNotes ?? "")
          : (evaluation.evaluatorNotes ?? "")
      ).trim();

      // Transition Matrix Validation
      const isForwardSubmit =
        currentStatus === "DRAFT" && targetStatus === "SUBMITTED";
      const isForwardReview =
        (currentStatus === "DRAFT" || currentStatus === "SUBMITTED") &&
        targetStatus === "REVIEWED";
      const isReturnAdjustment =
        (currentStatus === "REVIEWED" &&
          (targetStatus === "SUBMITTED" || targetStatus === "DRAFT")) ||
        (currentStatus === "SUBMITTED" && targetStatus === "DRAFT");
      const isFinalize =
        currentStatus === "REVIEWED" && targetStatus === "FINALIZED";

      if (
        !isForwardSubmit &&
        !isForwardReview &&
        !isReturnAdjustment &&
        !isFinalize
      ) {
        throw new DomainError(
          "INVALID_STATE_TRANSITION",
          `Transisi status dari ${currentStatus} ke ${targetStatus} tidak diizinkan.`
        );
      }

      if (isForwardSubmit) {
        const canSubmit =
          ctx.roleCode === "SUPER_ADMIN" ||
          hasAnyPermission(
            ctx.permissions,
            [
              PERMISSIONS.KPI_EVALUATION_CREATE,
              PERMISSIONS.KPI_EVALUATION_REVIEW,
            ],
            ctx.roleCode
          );
        if (!canSubmit) {
          throw new DomainError(
            "FORBIDDEN",
            "Hanya evaluator berwenang (kpi:evaluation:create / kpi:evaluation:review) yang dapat mengajukan evaluasi anggota tim."
          );
        }
      }

      if (isForwardReview) {
        if (
          !hasPermission(
            ctx.permissions,
            PERMISSIONS.KPI_EVALUATION_REVIEW,
            ctx.roleCode
          )
        ) {
          throw new DomainError(
            "FORBIDDEN",
            "Anda tidak memiliki izin untuk mereview evaluasi (kpi:evaluation:review)."
          );
        }
      }

      if (isReturnAdjustment) {
        if (
          currentStatus === "REVIEWED" &&
          ctx.roleCode !== "SUPER_ADMIN"
        ) {
          throw new DomainError(
            "FORBIDDEN",
            "Hanya Super Admin yang dapat mengembalikan evaluasi berstatus REVIEWED."
          );
        }
        if (
          currentStatus === "SUBMITTED" &&
          !hasPermission(
            ctx.permissions,
            PERMISSIONS.KPI_EVALUATION_REVIEW,
            ctx.roleCode
          )
        ) {
          throw new DomainError(
            "FORBIDDEN",
            "Anda tidak memiliki izin untuk mengembalikan evaluasi."
          );
        }
        if (!input.reason || input.reason.trim().length < 10) {
          throw new DomainError(
            "VALIDATION_ERROR",
            "Catatan alasan pengembalian wajib diisi minimal 10 karakter.",
            { reason: ["Alasan pengembalian minimal 10 karakter."] }
          );
        }
      }

      if (isFinalize) {
        if (
          ctx.roleCode !== "SUPER_ADMIN" ||
          !hasPermission(
            ctx.permissions,
            PERMISSIONS.KPI_EVALUATION_FINALIZE,
            ctx.roleCode
          )
        ) {
          throw new DomainError(
            "FORBIDDEN",
            "Finalisasi evaluasi KPI (FINALIZED) eksklusif hanya dapat dilakukan oleh Super Admin."
          );
        }
        if (input.confirmLock !== true) {
          throw new DomainError(
            "VALIDATION_ERROR",
            "Konfirmasi penguncian permanen wajib dicentang."
          );
        }
      }

      // Completeness check for forward transitions (SUBMITTED / REVIEWED / FINALIZED)
      if (isForwardSubmit || isForwardReview || isFinalize) {
        const missingManual = evaluation.items.filter(
          (i) => i.metricSource === "MANUAL_SCORE" && i.actualValue === null
        );
        if (missingManual.length > 0) {
          throw new DomainError(
            "VALIDATION_ERROR",
            `Semua indikator MANUAL_SCORE wajib diisi (0–100) sebelum melanjutkan status (${missingManual.map((m) => m.indicatorNameSnapshot).join(", ")}).`
          );
        }

        if (effectiveNotes.length < 20) {
          throw new DomainError(
            "VALIDATION_ERROR",
            "Catatan evaluasi (evaluatorNotes) wajib diisi minimal 20 karakter sebelum submit/review/finalisasi.",
            {
              evaluatorNotes: [
                "Catatan evaluator wajib minimal 20 karakter.",
              ],
            }
          );
        }
      }

      // Sync latest auto metrics before SUBMITTED / REVIEWED (from DRAFT) / FINALIZED
      let refreshedSnapshot = evaluation.autoMetricsSnapshot as Prisma.InputJsonValue;
      let nextCompletionRate = evaluation.completionRate;
      let nextOnTimeRate = evaluation.onTimeRate;
      let nextAvgRevisionCount = evaluation.avgRevisionCount;
      let nextDesignQualityScore = evaluation.designQualityScore;
      let nextTotalAssigned = evaluation.totalTasksAssigned;
      let nextTotalCompleted = evaluation.totalTasksCompleted;
      let nextOnTimeCount = evaluation.tasksCompletedOnTime;

      const scoreItems: Array<{ weight: number; achievementPct: number | null }> =
        [];

      if (isForwardSubmit || isForwardReview || isFinalize) {
        const cpvsItem = evaluation.items.find(
          (i) => i.metricSource === "AUTO_CPVS"
        );
        const cpvsTarget = cpvsItem
          ? decimalToNumber(cpvsItem.targetValue)
          : null;

        const latestMetrics = await computeUserMonthlyMetrics(
          evaluation.userId,
          evaluation.periodYear,
          evaluation.periodMonth,
          { cpvsTargetOverride: cpvsTarget, tx }
        );

        refreshedSnapshot = buildAutoMetricsSnapshot(
          latestMetrics
        ) as unknown as Prisma.InputJsonValue;
        nextTotalAssigned = latestMetrics.totalTasksAssigned;
        nextTotalCompleted = latestMetrics.totalTasksCompleted;
        nextOnTimeCount = latestMetrics.tasksCompletedOnTime;
        nextCompletionRate =
          latestMetrics.completionRate !== null
            ? new Prisma.Decimal(latestMetrics.completionRate)
            : null;
        nextOnTimeRate =
          latestMetrics.onTimeRate !== null
            ? new Prisma.Decimal(latestMetrics.onTimeRate)
            : null;
        nextAvgRevisionCount =
          latestMetrics.avgRevisionCount !== null
            ? new Prisma.Decimal(latestMetrics.avgRevisionCount)
            : null;
        nextDesignQualityScore =
          latestMetrics.designQualityScore !== null
            ? new Prisma.Decimal(latestMetrics.designQualityScore)
            : null;

        for (const item of evaluation.items) {
          const weightVal = decimalToNumber(item.weight) ?? 0;
          const targetVal = decimalToNumber(item.targetValue) ?? 0;

          if (item.metricSource === "MANUAL_SCORE") {
            const ach = decimalToNumber(item.achievementPct);
            scoreItems.push({ weight: weightVal, achievementPct: ach });
          } else {
            const resolved = resolveItemAchievement({
              metricSource: item.metricSource,
              metrics: latestMetrics,
              targetValue: targetVal,
              manualActualValue: null,
            });
            const weightedScore =
              resolved.achievementPct !== null
                ? round2((resolved.achievementPct * weightVal) / 100)
                : null;

            await tx.evaluationItem.update({
              where: { id: item.id },
              data: {
                actualValue:
                  resolved.actualValue !== null
                    ? new Prisma.Decimal(resolved.actualValue)
                    : null,
                achievementPct:
                  resolved.achievementPct !== null
                    ? new Prisma.Decimal(resolved.achievementPct)
                    : null,
                weightedScore:
                  weightedScore !== null
                    ? new Prisma.Decimal(weightedScore)
                    : null,
              },
            });

            scoreItems.push({
              weight: weightVal,
              achievementPct: resolved.achievementPct,
            });
          }
        }
      } else {
        for (const item of evaluation.items) {
          scoreItems.push({
            weight: decimalToNumber(item.weight) ?? 0,
            achievementPct: decimalToNumber(item.achievementPct),
          });
        }
      }

      const computed = computeWeightedScoreAndGrade(scoreItems);
      const now = new Date();

      const updatedNotes = isReturnAdjustment && input.reason
        ? `${effectiveNotes ? `${effectiveNotes}\n\n` : ""}[Catatan Kalibrasi ${ctx.fullName}]: ${input.reason.trim()}`
        : effectiveNotes || evaluation.evaluatorNotes;

      const updated = await tx.monthlyEvaluation.update({
        where: { id: evaluation.id },
        data: {
          status: targetStatus,
          evaluatorNotes: updatedNotes,
          totalTasksAssigned: nextTotalAssigned,
          totalTasksCompleted: nextTotalCompleted,
          tasksCompletedOnTime: nextOnTimeCount,
          completionRate: nextCompletionRate,
          onTimeRate: nextOnTimeRate,
          avgRevisionCount: nextAvgRevisionCount,
          designQualityScore: nextDesignQualityScore,
          weightedKpiScore: new Prisma.Decimal(computed.weightedKpiScore),
          performanceGrade: computed.grade,
          autoMetricsSnapshot: refreshedSnapshot,
          submittedAt: isForwardSubmit
            ? now
            : isForwardReview
              ? (evaluation.submittedAt ?? now)
              : evaluation.submittedAt,
          reviewedAt: isForwardReview ? now : evaluation.reviewedAt,
          finalizedAt: isFinalize ? now : null,
          finalizedBy: isFinalize ? ctx.userId : null,
        },
        select: {
          id: true,
          status: true,
          weightedKpiScore: true,
          performanceGrade: true,
          finalizedAt: true,
        },
      });

      const notifications: Array<{
        recipientId: string;
        type: NotificationType;
        title: string;
        message: string;
        actionUrl: string;
        metadata: Prisma.InputJsonValue;
      }> = [];

      if (isForwardSubmit || (isForwardReview && ctx.roleCode !== "SUPER_ADMIN")) {
        const superAdmins = await tx.user.findMany({
          where: {
            isActive: true,
            deletedAt: null,
            role: { code: "SUPER_ADMIN" },
          },
          select: { id: true },
        });
        for (const admin of superAdmins) {
          notifications.push({
            recipientId: admin.id,
            type: NotificationType.KPI_EVALUATION_SUBMITTED,
            title: `Evaluasi KPI ${evaluation.user.fullName} (${periodLabel}) Diajukan`,
            message: `${ctx.fullName} mengajukan evaluasi KPI ${evaluation.user.fullName} dengan skor ${computed.weightedKpiScore.toFixed(2)} (Grade ${computed.grade}) untuk ditinjau.`,
            actionUrl: `/kpi/evaluations/${evaluation.id}`,
            metadata: { periodMonth: periodLabel, status: targetStatus },
          });
        }
      } else if (isReturnAdjustment && input.reason) {
        notifications.push({
          recipientId: evaluation.evaluatorId,
          type: NotificationType.SYSTEM_ALERT,
          title: `Evaluasi ${evaluation.user.fullName} (${periodLabel}) Dikembalikan`,
          message: `${ctx.fullName} mengembalikan evaluasi untuk penyesuaian: "${input.reason.trim()}"`,
          actionUrl: `/kpi/evaluations/${evaluation.id}`,
          metadata: { periodMonth: periodLabel, status: targetStatus },
        });
      } else if (isFinalize) {
        notifications.push({
          recipientId: evaluation.userId,
          type: NotificationType.KPI_EVALUATION_FINALIZED,
          title: `Evaluasi KPI Periode ${periodLabel} Telah Difinalisasi`,
          message: `Rapor KPI bulanan Anda untuk periode ${periodLabel} telah dikunci final oleh ${ctx.fullName} dengan nilai ${computed.weightedKpiScore.toFixed(2)} (Grade ${computed.grade}).`,
          actionUrl: `/kpi/evaluations/${evaluation.id}`,
          metadata: {
            periodMonth: periodLabel,
            weightedKpiScore: computed.weightedKpiScore,
            grade: computed.grade,
          },
        });
      }

      const auditAction = isFinalize
        ? "KPI_EVALUATION_FINALIZED"
        : isForwardSubmit
          ? "KPI_EVALUATION_SUBMITTED"
          : isForwardReview
            ? "KPI_EVALUATION_REVIEWED"
            : "KPI_EVALUATION_RETURNED";

      return {
        result: {
          id: updated.id,
          status: updated.status,
          weightedKpiScore: decimalToNumber(updated.weightedKpiScore) ?? 0,
          grade: updated.performanceGrade,
          finalizedAt: updated.finalizedAt
            ? updated.finalizedAt.toISOString()
            : null,
        },
        audit: {
          module: "TEAM_KPI" as const,
          action: auditAction,
          entityType: "MONTHLY_EVALUATION",
          entityId: evaluation.id,
          summary: `Status evaluasi ${evaluation.user.fullName} (${periodLabel}) berubah dari ${currentStatus} menjadi ${targetStatus} (Skor: ${computed.weightedKpiScore.toFixed(2)}, Grade ${computed.grade}).`,
          oldValues: {
            status: currentStatus,
            weightedKpiScore: decimalToNumber(evaluation.weightedKpiScore),
            performanceGrade: evaluation.performanceGrade,
          },
          newValues: {
            status: targetStatus,
            weightedKpiScore: computed.weightedKpiScore,
            performanceGrade: computed.grade,
            ...(input.reason ? { reason: input.reason.trim() } : {}),
          },
        },
        notifications,
      };
    });

    revalidatePath(`/kpi/evaluations/${input.evaluationId}`);
    revalidatePath("/kpi/evaluations");
    revalidatePath("/kpi/dashboard");
    revalidatePath("/kpi/reports");

    return {
      data: outcome,
      message:
        outcome.status === "FINALIZED"
          ? "Evaluasi berhasil difinalisasi dan dikunci secara permanen."
          : `Status evaluasi berhasil diubah ke ${outcome.status}.`,
    };
  },
});

export const reopenEvaluationAction = createProtectedAction({
  permission: PERMISSIONS.KPI_EVALUATION_REOPEN,
  schema: reopenEvaluationSchema,
  handler: async ({ ctx, input }) => {
    if (ctx.roleCode !== "SUPER_ADMIN") {
      throw new DomainError(
        "FORBIDDEN",
        "Pembukaan kembali evaluasi FINALIZED hanya dapat dilakukan secara eksklusif oleh Super Admin."
      );
    }

    const reopened = await executeAuditedMutation(ctx, async (tx) => {
      const evaluation = await tx.monthlyEvaluation.findUnique({
        where: { id: input.evaluationId },
        include: {
          user: { select: { id: true, fullName: true } },
        },
      });

      if (!evaluation) {
        throw new DomainError("NOT_FOUND", "Dokumen evaluasi tidak ditemukan.");
      }

      if (evaluation.userId === ctx.userId) {
        throw new DomainError(
          "FORBIDDEN",
          "Anda tidak dapat membuka kembali evaluasi milik diri sendiri."
        );
      }

      if (evaluation.status !== "FINALIZED") {
        throw new DomainError(
          "INVALID_STATE_TRANSITION",
          "Hanya evaluasi berstatus FINALIZED yang dapat dibuka kembali melalui Reopen."
        );
      }

      const periodLabel = formatPeriodMonthLabel(
        evaluation.periodYear,
        evaluation.periodMonth
      );

      const nextNotes = `${evaluation.evaluatorNotes ? `${evaluation.evaluatorNotes}\n\n` : ""}[Reopened oleh ${ctx.fullName}]: ${input.reason}`;

      const updated = await tx.monthlyEvaluation.update({
        where: { id: evaluation.id },
        data: {
          status: input.targetStatus,
          finalizedAt: null,
          finalizedBy: null,
          evaluatorNotes: nextNotes,
        },
        select: {
          id: true,
          status: true,
        },
      });

      return {
        result: {
          id: updated.id,
          status: updated.status,
          reason: input.reason,
        },
        audit: {
          module: "TEAM_KPI" as const,
          action: "KPI_EVALUATION_REOPENED",
          entityType: "MONTHLY_EVALUATION",
          entityId: evaluation.id,
          summary: `Super Admin ${ctx.fullName} membuka kembali evaluasi FINALIZED ${evaluation.user.fullName} (${periodLabel}) ke ${input.targetStatus}.`,
          oldValues: {
            status: "FINALIZED",
            finalizedAt: evaluation.finalizedAt?.toISOString() ?? null,
            finalizedBy: evaluation.finalizedBy,
          },
          newValues: {
            status: input.targetStatus,
            reopenReason: input.reason,
          },
        },
        notifications: [
          {
            recipientId: evaluation.evaluatorId,
            type: NotificationType.SYSTEM_ALERT,
            title: `Evaluasi ${evaluation.user.fullName} (${periodLabel}) Dibuka Kembali`,
            message: `Super Admin ${ctx.fullName} membuka kembali evaluasi FINALIZED menjadi ${input.targetStatus}. Alasan: "${input.reason}"`,
            actionUrl: `/kpi/evaluations/${evaluation.id}`,
            metadata: { periodMonth: periodLabel, status: input.targetStatus },
          },
          {
            recipientId: evaluation.userId,
            type: NotificationType.SYSTEM_ALERT,
            title: `Evaluasi KPI (${periodLabel}) Dibuka Kembali untuk Peninjauan`,
            message: `Evaluasi KPI periode ${periodLabel} dibuka kembali oleh ${ctx.fullName} untuk peninjauan ulang.`,
            actionUrl: `/kpi/evaluations`,
            metadata: { periodMonth: periodLabel, status: input.targetStatus },
          },
        ],
      };
    });

    revalidatePath(`/kpi/evaluations/${input.evaluationId}`);
    revalidatePath("/kpi/evaluations");
    revalidatePath("/kpi/dashboard");
    revalidatePath("/kpi/reports");

    return {
      data: reopened,
      message: `Evaluasi berhasil dibuka kembali ke status ${reopened.status} dan tercatat di Activity Logs.`,
    };
  },
});
