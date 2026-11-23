"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Award,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  FileCheck2,
  Loader2,
  Lock,
  Palette,
  Printer,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  ShieldAlert,
  Sparkles,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/shared/EmptyState";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  reopenEvaluationAction,
  resyncDraftEvaluationAction,
  transitionEvaluationStatusAction,
  updateEvaluationScoresAction,
} from "@/features/team-kpi/actions/evaluation.actions";
import type { EvaluationDetailPermissions } from "@/features/team-kpi/queries/kpi.queries";
import type { KpiGrade, MonthlyEvaluationDTO } from "@/features/team-kpi/types";
import {
  computeWeightedScoreAndGrade,
  formatKpiPercent,
  formatKpiScore,
  formatPeriodLabelId,
  formatWibDateTime,
  getInitials,
  KPI_GRADE_META,
  KPI_UNIT_LABELS,
  METRIC_SOURCE_META,
  ROLE_DISPLAY_META,
  round2,
} from "@/features/team-kpi/utils/kpi-ui";
import { cn } from "@/lib/utils";

export interface EvaluationScoreFormProps {
  evaluation: MonthlyEvaluationDTO;
  permissions: EvaluationDetailPermissions;
}

const GRADE_HERO_STYLE: Record<
  KpiGrade,
  {
    container: string;
    ribbon: string;
    pill: string;
    glow: string;
    bar: string;
    accentText: string;
  }
> = {
  A: {
    container:
      "border-emerald-300 bg-emerald-50/75 dark:border-emerald-500/40 dark:bg-emerald-950/40",
    ribbon: "from-emerald-500 via-teal-500 to-cyan-500",
    pill: "border-emerald-600 bg-emerald-600 text-white shadow-sm",
    glow: "shadow-[0_12px_32px_-10px_rgba(16,185,129,0.45)]",
    bar: "bg-gradient-to-r from-emerald-600 to-teal-500",
    accentText: "text-emerald-700 dark:text-emerald-300",
  },
  B: {
    container:
      "border-blue-300 bg-blue-50/75 dark:border-blue-500/40 dark:bg-blue-950/40",
    ribbon: "from-blue-600 via-indigo-500 to-cyan-500",
    pill: "border-blue-600 bg-blue-600 text-white shadow-sm",
    glow: "shadow-[0_12px_32px_-10px_rgba(37,99,235,0.45)]",
    bar: "bg-gradient-to-r from-blue-600 to-cyan-500",
    accentText: "text-blue-700 dark:text-blue-300",
  },
  C: {
    container:
      "border-amber-300 bg-amber-50/75 dark:border-amber-500/40 dark:bg-amber-950/40",
    ribbon: "from-amber-500 via-orange-500 to-yellow-500",
    pill: "border-amber-500 bg-amber-500 text-white shadow-sm",
    glow: "shadow-[0_12px_32px_-10px_rgba(245,158,11,0.45)]",
    bar: "bg-gradient-to-r from-amber-500 to-orange-500",
    accentText: "text-amber-800 dark:text-amber-300",
  },
  D: {
    container:
      "border-rose-300 bg-rose-50/75 dark:border-rose-500/40 dark:bg-rose-950/40",
    ribbon: "from-rose-600 via-pink-500 to-red-500",
    pill: "border-rose-600 bg-rose-600 text-white shadow-sm",
    glow: "shadow-[0_12px_32px_-10px_rgba(244,63,94,0.45)]",
    bar: "bg-gradient-to-r from-rose-600 to-pink-500",
    accentText: "text-rose-700 dark:text-rose-300",
  },
};

function getAchievementBarColor(score: number | null): string {
  if (score === null) return "bg-slate-300 dark:bg-slate-700";
  if (score >= 90) return "bg-emerald-500";
  if (score >= 80) return "bg-blue-600";
  if (score >= 70) return "bg-amber-500";
  return "bg-rose-500";
}

export function EvaluationScoreForm({
  evaluation,
  permissions,
}: EvaluationScoreFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [manualScores, setManualScores] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const item of evaluation.items) {
      if (item.metricSource === "MANUAL_SCORE") {
        initial[item.id] =
          item.actualValue !== null ? String(item.actualValue) : "";
      }
    }
    return initial;
  });

  const [evidenceNotesMap, setEvidenceNotesMap] = useState<
    Record<string, string>
  >(() => {
    const initial: Record<string, string> = {};
    for (const item of evaluation.items) {
      initial[item.id] = item.evidenceNotes ?? "";
    }
    return initial;
  });

  const [evaluatorNotes, setEvaluatorNotes] = useState<string>(
    evaluation.evaluatorNotes ?? ""
  );

  // Modal States
  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [confirmLockChecked, setConfirmLockChecked] = useState(false);

  const [returnOpen, setReturnOpen] = useState(false);
  const [returnReason, setReturnReason] = useState("");

  const [reopenOpen, setReopenOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState("");

  const isLocked = evaluation.status === "FINALIZED";

  // Live preview of Weighted Score + Grade using N/A weight re-normalization
  const liveScoreSummary = useMemo(() => {
    const normalized = evaluation.items.map((item) => {
      if (item.metricSource === "MANUAL_SCORE") {
        const raw = manualScores[item.id] ?? "";
        const trimmed = raw.trim();
        if (trimmed === "") {
          return { weight: item.weightPercent, achievementPct: null };
        }
        const parsed = Number(trimmed);
        if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
          return { weight: item.weightPercent, achievementPct: null };
        }
        return {
          weight: item.weightPercent,
          achievementPct: round2(Math.max(0, Math.min(100, parsed))),
        };
      }
      return {
        weight: item.weightPercent,
        achievementPct: item.achievementScore,
      };
    });

    return computeWeightedScoreAndGrade(normalized);
  }, [evaluation.items, manualScores]);

  const buildScorePayloadItems = () =>
    evaluation.items.map((item) => {
      if (item.metricSource !== "MANUAL_SCORE") {
        return {
          itemId: item.id,
          manualScore: null,
          evidenceNotes: evidenceNotesMap[item.id] ?? null,
        };
      }
      const raw = (manualScores[item.id] ?? "").trim();
      const parsed = raw === "" ? null : Number(raw);
      return {
        itemId: item.id,
        manualScore:
          parsed !== null && Number.isFinite(parsed) ? parsed : null,
        evidenceNotes: evidenceNotesMap[item.id] ?? null,
      };
    });

  const validateManualInputsClient = (): boolean => {
    for (const item of evaluation.items) {
      if (item.metricSource !== "MANUAL_SCORE") continue;
      const raw = (manualScores[item.id] ?? "").trim();
      if (raw !== "") {
        const val = Number(raw);
        if (!Number.isFinite(val) || val < 0 || val > 100) {
          toast.error(
            `Skor '${item.indicatorName}' harus dalam rentang 0–100.`
          );
          return false;
        }
      }
    }
    return true;
  };

  const handleSaveDraft = () => {
    if (!permissions.canEditScores || isLocked) return;
    if (!validateManualInputsClient()) return;

    startTransition(async () => {
      const res = await updateEvaluationScoresAction({
        evaluationId: evaluation.id,
        evaluatorNotes,
        items: buildScorePayloadItems(),
      });

      if (!res.success) {
        toast.error(res.error.message);
        return;
      }

      toast.success(res.message ?? "Penilaian berhasil disimpan.");
      router.refresh();
    });
  };

  const handleResyncDraft = () => {
    if (!permissions.canResyncDraft || isLocked) return;
    startTransition(async () => {
      const res = await resyncDraftEvaluationAction({
        evaluationId: evaluation.id,
      });

      if (!res.success) {
        toast.error(res.error.message);
        return;
      }

      toast.success(res.message ?? "Metrik otomatis diperbarui.");
      router.refresh();
    });
  };

  const handleSaveAndTransition = (
    targetStatus: "SUBMITTED" | "REVIEWED"
  ) => {
    if (!validateManualInputsClient()) return;

    startTransition(async () => {
      if (permissions.canEditScores) {
        const saveRes = await updateEvaluationScoresAction({
          evaluationId: evaluation.id,
          evaluatorNotes,
          items: buildScorePayloadItems(),
        });
        if (!saveRes.success) {
          toast.error(saveRes.error.message);
          return;
        }
      }

      const transRes = await transitionEvaluationStatusAction({
        evaluationId: evaluation.id,
        targetStatus,
        evaluatorNotes,
      });

      if (!transRes.success) {
        toast.error(transRes.error.message);
        return;
      }

      toast.success(transRes.message ?? `Status berubah ke ${targetStatus}.`);
      router.refresh();
    });
  };

  const handleConfirmReturn = () => {
    startTransition(async () => {
      const res = await transitionEvaluationStatusAction({
        evaluationId: evaluation.id,
        targetStatus: "SUBMITTED",
        reason: returnReason,
      });

      if (!res.success) {
        toast.error(res.error.message);
        return;
      }

      toast.success(res.message ?? "Evaluasi dikembalikan.");
      setReturnOpen(false);
      setReturnReason("");
      router.refresh();
    });
  };

  const handleConfirmFinalize = () => {
    if (!confirmLockChecked) {
      toast.error("Centang konfirmasi penguncian permanen terlebih dahulu.");
      return;
    }

    startTransition(async () => {
      const res = await transitionEvaluationStatusAction({
        evaluationId: evaluation.id,
        targetStatus: "FINALIZED",
        evaluatorNotes,
        confirmLock: true,
      });

      if (!res.success) {
        toast.error(res.error.message);
        return;
      }

      toast.success(
        res.message ?? "Evaluasi difinalisasi & dikunci permanen."
      );
      setFinalizeOpen(false);
      setConfirmLockChecked(false);
      router.refresh();
    });
  };

  const handleConfirmReopen = () => {
    startTransition(async () => {
      const res = await reopenEvaluationAction({
        evaluationId: evaluation.id,
        reason: reopenReason,
        targetStatus: "DRAFT",
      });

      if (!res.success) {
        toast.error(res.error.message);
        return;
      }

      toast.success(res.message ?? "Evaluasi dibuka kembali.");
      setReopenOpen(false);
      setReopenReason("");
      router.refresh();
    });
  };

  const gradeMeta = KPI_GRADE_META[liveScoreSummary.grade];
  const heroStyle = GRADE_HERO_STYLE[liveScoreSummary.grade];
  const roleMeta = ROLE_DISPLAY_META[evaluation.userRole];
  const snap = evaluation.autoMetricsSnapshot;
  const notesLength = evaluatorNotes.trim().length;
  const hasActionBar =
    (permissions.canEditScores && !isLocked) ||
    permissions.canReturnToSubmitted ||
    permissions.canSubmit ||
    permissions.canMarkReviewed ||
    permissions.canFinalize;

  return (
    <div className="space-y-6 pb-8">
      {/* Global Print Isolation Styles */}
      <style>{`
        @media print {
          aside, header, [data-print-hide="true"] {
            display: none !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
        }
      `}</style>

      {/* Print-Only Branded Header */}
      <div className="hidden border-b-2 border-slate-900 pb-4 print:block">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold tracking-widest text-blue-700 uppercase">
              Krevia Digital · Performance Appraisal
            </p>
            <h1 className="text-2xl font-bold text-slate-950">
              Rapor Evaluasi KPI —{" "}
              {formatPeriodLabelId(
                evaluation.periodYear,
                evaluation.periodMonth
              )}
            </h1>
          </div>
          <div className="text-right text-xs text-slate-600">
            <p>Status: {evaluation.status}</p>
            <p>Dicetak: {formatWibDateTime(new Date().toISOString())}</p>
          </div>
        </div>
      </div>

      {/* Top Action Strip */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 print:hidden"
        data-print-hide="true"
      >
        <Link
          href={`/kpi/evaluations?period=${evaluation.periodMonthLabel}`}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "gap-1.5 rounded-xl border-slate-200 bg-white px-3 font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          )}
        >
          <ArrowLeft className="size-3.5" />
          <span>Evaluasi KPI</span>
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          {permissions.canResyncDraft ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={handleResyncDraft}
              className="gap-1.5 rounded-xl border-slate-200 bg-white font-bold text-slate-800 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <RefreshCw className="size-3.5 text-blue-600 dark:text-blue-400" />
              )}
              <span>Sync Metrik</span>
            </Button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5 rounded-xl border-slate-200 bg-white font-bold text-slate-800 shadow-2xs hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          >
            <Printer className="size-3.5 text-slate-600 dark:text-slate-300" />
            <span>Cetak PDF</span>
          </Button>
        </div>
      </div>

      {/* Slim Finalized Padlock Banner */}
      {isLocked ? (
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-xs shadow-xs sm:flex-row sm:items-center dark:border-emerald-500/40 dark:bg-emerald-950/40">
          <div className="flex items-center gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
              <Lock className="size-4" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-emerald-950 dark:text-emerald-200">
                Snapshot Finalized · Terkunci Permanen
              </p>
              <p className="font-medium text-emerald-800 dark:text-emerald-300/90">
                Oleh {evaluation.finalizedByName ?? "Super Admin"} ·{" "}
                {formatWibDateTime(evaluation.finalizedAt)}
              </p>
            </div>
          </div>

          {permissions.canReopen ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => setReopenOpen(true)}
              className="w-fit shrink-0 gap-1.5 rounded-xl border-amber-400 bg-white font-bold text-amber-800 hover:bg-amber-50 dark:border-amber-500/40 dark:bg-slate-900 dark:text-amber-300 print:hidden"
            >
              <Unlock className="size-3.5" />
              <span>Reopen</span>
            </Button>
          ) : null}
        </div>
      ) : null}

      {/* Executive Scorecard Hero */}
      <Card className="overflow-hidden rounded-2xl border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className={cn("h-1.5 w-full bg-gradient-to-r", heroStyle.ribbon)} />
        <CardContent className="flex flex-col justify-between gap-6 p-5 sm:p-6 lg:flex-row lg:items-center">
          {/* Member Identity */}
          <div className="flex min-w-0 items-start gap-4">
            <Avatar
              size="lg"
              className="size-16 shrink-0 ring-2 ring-slate-200 dark:ring-slate-700"
            >
              {evaluation.userAvatarUrl ? (
                <AvatarImage
                  src={evaluation.userAvatarUrl}
                  alt={evaluation.userName}
                />
              ) : null}
              <AvatarFallback className="bg-slate-100 text-base font-extrabold text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                {getInitials(evaluation.userName)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="break-words text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl dark:text-white">
                  {evaluation.userName}
                </h1>
                <Badge
                  variant="outline"
                  className={cn(
                    "font-mono text-[11px] font-bold",
                    roleMeta?.badgeClass
                  )}
                >
                  {roleMeta?.label ?? evaluation.userRole}
                </Badge>
                <StatusBadge domain="evaluation" value={evaluation.status} />
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {evaluation.userJobTitle}
                </span>
                <span>·</span>
                <span className="font-medium">{evaluation.userDepartment}</span>
                <span>·</span>
                <span className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {formatPeriodLabelId(
                    evaluation.periodYear,
                    evaluation.periodMonth
                  )}
                </span>
                <span>·</span>
                <span className="font-medium">
                  Evaluator:{" "}
                  <strong className="text-slate-900 dark:text-white">
                    {evaluation.evaluatorName}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          {/* Sleek Glowing Grade Badge Hero */}
          <div
            className={cn(
              "flex flex-col gap-3.5 rounded-2xl border-2 p-5 sm:min-w-[330px]",
              heroStyle.container,
              heroStyle.glow
            )}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold tracking-wider text-slate-600 uppercase dark:text-slate-300">
                  Skor Akhir
                </span>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="font-mono text-4xl font-extrabold tracking-tight tabular-nums text-slate-900 dark:text-white">
                    {liveScoreSummary.weightedKpiScore.toFixed(2)}
                  </span>
                  <span className="font-mono text-sm font-bold text-slate-500 dark:text-slate-400">
                    / 100
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5">
                <div
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-extrabold tracking-tight",
                    heroStyle.pill
                  )}
                >
                  <Sparkles className="size-3.5" aria-hidden="true" />
                  <span>{gradeMeta.label}</span>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 font-mono text-[10px] font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                  {isLocked ? (
                    <>
                      <Lock className="size-2.5 text-emerald-600" />
                      <span>Snapshot Terkunci</span>
                    </>
                  ) : (
                    <span>Bobot Aktif {liveScoreSummary.activeWeightPercent}%</span>
                  )}
                </span>
              </div>
            </div>

            {/* Score Progress Meter */}
            <div className="space-y-1.5">
              <div className="h-3 w-full overflow-hidden rounded-full border border-slate-200/80 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-800">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    heroStyle.bar
                  )}
                  style={{
                    width: `${Math.min(100, Math.max(0, liveScoreSummary.weightedKpiScore))}%`,
                  }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {gradeMeta.description}
                </span>
                <span
                  className={cn(
                    "font-mono font-extrabold",
                    heroStyle.accentText
                  )}
                >
                  {liveScoreSummary.weightedKpiScore.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Auto Metrics Snapshot Bento */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl border-slate-200 bg-white shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="flex items-start justify-between gap-3 p-4">
            <div className="space-y-1">
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                TCR · Penyelesaian
              </p>
              <p className="font-mono text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {formatKpiPercent(snap.taskCompletionRate)}
              </p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {snap.completedTasks} / {snap.totalAssignedTasks} tugas
              </p>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-400">
              <CheckCircle2 className="size-5" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200 bg-white shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="flex items-start justify-between gap-3 p-4">
            <div className="space-y-1">
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                OTDR · Ketepatan
              </p>
              <p className="font-mono text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {formatKpiPercent(snap.onTimeDeliveryRate)}
              </p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {snap.onTimeCompletedTasks} / {snap.datedCompletedTasks} tepat
                waktu
              </p>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-cyan-200 bg-cyan-50 text-cyan-600 dark:border-cyan-500/30 dark:bg-cyan-500/15 dark:text-cyan-400">
              <Clock className="size-5" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200 bg-white shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="flex items-start justify-between gap-3 p-4">
            <div className="space-y-1">
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                DQS · Kualitas Desain
              </p>
              <p className="font-mono text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {formatKpiScore(snap.designQualityScore)}
              </p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {snap.designBriefsApproved} brief · FPAR{" "}
                {formatKpiPercent(snap.firstPassApprovalRate)}
              </p>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-sky-200 bg-sky-50 text-sky-600 dark:border-sky-500/30 dark:bg-sky-500/15 dark:text-sky-400">
              <Palette className="size-5" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200 bg-white shadow-xs transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
          <CardContent className="flex items-start justify-between gap-3 p-4">
            <div className="space-y-1">
              <p className="text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                CPVS · Output Konten
              </p>
              <p className="font-mono text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {snap.contentDeliveredCount}
              </p>
              <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                Konten terjadwal / tayang
              </p>
            </div>
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-violet-200 bg-violet-50 text-violet-600 dark:border-violet-500/30 dark:bg-violet-500/15 dark:text-violet-400">
              <FileCheck2 className="size-5" aria-hidden="true" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPI Metrics Card Rows */}
      <Card className="rounded-2xl border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200/80 pb-3.5 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="h-4 w-1 rounded-full bg-blue-600" />
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
              Penilaian Indikator ({evaluation.items.length})
            </CardTitle>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 font-mono text-xs font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
            Total bobot aktif {liveScoreSummary.activeWeightPercent}%
          </span>
        </CardHeader>

        <CardContent className="space-y-3 pt-4">
          {evaluation.items.map((item) => {
            const isManual = item.metricSource === "MANUAL_SCORE";
            const unitLabel = KPI_UNIT_LABELS[item.unit];

            const liveManualRaw = manualScores[item.id] ?? "";
            const liveManualNum =
              isManual && liveManualRaw.trim() !== ""
                ? Number(liveManualRaw)
                : null;
            const displayAchievement = isManual
              ? liveManualNum !== null &&
                Number.isFinite(liveManualNum) &&
                liveManualNum >= 0 &&
                liveManualNum <= 100
                ? round2(liveManualNum)
                : null
              : item.achievementScore;
            const displayWeighted =
              displayAchievement !== null
                ? round2((displayAchievement * item.weightPercent) / 100)
                : null;

            const actualValueDisplay = isManual
              ? liveManualNum !== null && Number.isFinite(liveManualNum)
                ? liveManualNum.toFixed(1)
                : "—"
              : item.actualValue !== null
                ? item.actualValue.toFixed(2)
                : "N/A";

            const actualUnitSuffix =
              actualValueDisplay !== "—" &&
              actualValueDisplay !== "N/A" &&
              item.unit === "PERCENTAGE"
                ? "%"
                : "";

            const barWidth = Math.min(
              100,
              Math.max(0, displayAchievement ?? 0)
            );
            const showTargetMarker =
              (item.unit === "PERCENTAGE" || item.unit === "SCORE_100") &&
              item.targetValue > 0 &&
              item.targetValue <= 100;

            return (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 transition-colors hover:border-blue-300 dark:border-slate-800 dark:bg-slate-950/40 dark:hover:border-blue-500/40"
              >
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  {/* Left: Title + Readable Numeric Chips + Target vs Actual Bar */}
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="break-words text-[15px] font-bold text-slate-900 dark:text-white">
                        {item.indicatorName}
                      </h3>

                      <Badge
                        variant="outline"
                        className={cn(
                          "gap-1 font-mono text-[11px] font-bold",
                          isManual
                            ? "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300"
                            : "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-500/40 dark:bg-blue-500/15 dark:text-blue-300"
                        )}
                      >
                        {!isManual ? (
                          <Lock className="size-2.5" aria-hidden="true" />
                        ) : null}
                        <span>
                          {isManual ? "Manual" : (METRIC_SOURCE_META[item.metricSource]?.shortLabel ?? "Sistem")}:{" "}
                          {actualValueDisplay}
                          {actualUnitSuffix}
                        </span>
                      </Badge>

                      <Badge
                        variant="secondary"
                        className="border border-indigo-200 bg-indigo-50 font-mono text-[11px] font-bold text-indigo-800 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300"
                      >
                        Bobot {item.weightPercent}%
                      </Badge>
                    </div>

                    {/* Target vs Actual Comparison Bar */}
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex flex-wrap items-center gap-2 font-mono">
                          <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-bold text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100">
                            Target: {item.targetValue}
                            {unitLabel === "%" ? "%" : ` ${unitLabel}`}
                          </span>
                          <span className="rounded-md border border-slate-200 bg-slate-100 px-2 py-0.5 font-bold text-slate-900 dark:border-slate-700 dark:bg-slate-800/80 dark:text-white">
                            Aktual: {actualValueDisplay}
                            {actualUnitSuffix}
                          </span>
                        </div>
                        <span className="rounded-md border border-slate-200 bg-white px-2 py-0.5 font-mono text-xs font-extrabold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white">
                          {displayAchievement !== null
                            ? `${displayAchievement.toFixed(1)}% Capaian`
                            : "N/A"}
                        </span>
                      </div>

                      <div className="relative h-3 w-full overflow-hidden rounded-full border border-slate-300/70 bg-slate-200 dark:border-slate-700 dark:bg-slate-800">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-300",
                            getAchievementBarColor(displayAchievement)
                          )}
                          style={{ width: `${barWidth}%` }}
                        />
                        {showTargetMarker ? (
                          <div
                            title={`Target ${item.targetValue}%`}
                            className="absolute inset-y-0 z-10 w-0.5 bg-slate-900 dark:bg-white"
                            style={{ left: `${item.targetValue}%` }}
                          />
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* Right: Score Input / Readout + Contribution */}
                  <div className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 pt-3 lg:justify-end lg:border-t-0 lg:pt-0 dark:border-slate-800">
                    {isManual && permissions.canEditScores && !isLocked ? (
                      <div className="flex items-center gap-2">
                        <div className="relative w-32">
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step="0.5"
                            placeholder="0–100"
                            value={manualScores[item.id] ?? ""}
                            onChange={(e) =>
                              setManualScores((prev) => ({
                                ...prev,
                                [item.id]: e.target.value,
                              }))
                            }
                            className="h-10 rounded-xl border-slate-300 bg-white pr-11 font-mono text-base font-extrabold tabular-nums text-slate-900 focus-visible:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                            aria-label={`Skor manual ${item.indicatorName}`}
                          />
                          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                            /100
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-right dark:border-slate-700 dark:bg-slate-900">
                        <p className="text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                          Skor
                        </p>
                        <p className="font-mono text-base font-extrabold tabular-nums text-slate-900 dark:text-white">
                          {displayAchievement !== null
                            ? displayAchievement.toFixed(1)
                            : "N/A"}
                        </p>
                      </div>
                    )}

                    <div className="min-w-[84px] rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-right dark:border-slate-700 dark:bg-slate-900">
                      <p className="text-[10px] font-bold text-slate-500 uppercase dark:text-slate-400">
                        Kontribusi
                      </p>
                      <p className="font-mono text-sm font-extrabold tabular-nums text-blue-700 dark:text-blue-400">
                        {displayWeighted !== null
                          ? `+${displayWeighted.toFixed(2)}`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Evidence Note */}
                {permissions.canEditScores && !isLocked ? (
                  <div className="mt-3 border-t border-slate-200/80 pt-2.5 dark:border-slate-800">
                    <Input
                      value={evidenceNotesMap[item.id] ?? ""}
                      onChange={(e) =>
                        setEvidenceNotesMap((prev) => ({
                          ...prev,
                          [item.id]: e.target.value,
                        }))
                      }
                      placeholder="Catatan bukti / konteks penilaian (opsional)..."
                      className="h-9 rounded-lg border-slate-200 bg-white text-xs font-medium text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </div>
                ) : item.evidenceNotes ? (
                  <p className="mt-2.5 border-t border-slate-200/80 pt-2 text-xs font-medium break-words text-slate-700 dark:border-slate-800 dark:text-slate-300">
                    {item.evidenceNotes}
                  </p>
                ) : null}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Evaluator Qualitative Notes */}
      <Card className="rounded-2xl border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-200/80 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="h-4 w-1 rounded-full bg-blue-600" />
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
              Catatan Evaluator
            </CardTitle>
          </div>
          <Badge
            variant="outline"
            className={cn(
              "font-mono text-[11px] font-bold",
              notesLength >= 20
                ? "border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-500/40 dark:bg-emerald-500/15 dark:text-emerald-300"
                : "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            {notesLength} / 20 min
          </Badge>
        </CardHeader>
        <CardContent className="pt-4">
          {permissions.canEditScores && !isLocked ? (
            <Textarea
              id="evaluator-notes"
              rows={3}
              value={evaluatorNotes}
              onChange={(e) => setEvaluatorNotes(e.target.value)}
              placeholder="Ringkasan capaian, kekuatan, dan area perbaikan..."
              className="resize-y border-slate-200 bg-slate-50 font-medium text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-100"
            />
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm font-medium whitespace-pre-wrap break-words text-slate-800 dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-100">
              {evaluation.evaluatorNotes || "Belum ada catatan evaluator."}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Snapshot Evidence Breakdown */}
      <Card className="rounded-2xl border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <CardHeader className="border-b border-slate-200/80 pb-3 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="h-4 w-1 rounded-full bg-slate-800 dark:bg-slate-200" />
            <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
              Lampiran Snapshot ({evaluation.periodMonthLabel})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <Tabs defaultValue="tasks">
            <TabsList className="mb-4 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
              <TabsTrigger value="tasks" className="font-bold">
                Tasks ({snap.tasksBreakdown.length})
              </TabsTrigger>
              <TabsTrigger value="designs" className="font-bold">
                Design Briefs ({snap.designBriefsBreakdown.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tasks">
              {snap.tasksBreakdown.length === 0 ? (
                <EmptyState
                  title="Belum ada task di snapshot"
                  className="py-8"
                />
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                  <Table>
                    <TableHeader className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/70">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs font-bold text-slate-700 uppercase dark:text-slate-200">
                          Kode
                        </TableHead>
                        <TableHead className="text-xs font-bold text-slate-700 uppercase dark:text-slate-200">
                          Judul
                        </TableHead>
                        <TableHead className="text-xs font-bold text-slate-700 uppercase dark:text-slate-200">
                          Proyek
                        </TableHead>
                        <TableHead className="text-xs font-bold text-slate-700 uppercase dark:text-slate-200">
                          Status
                        </TableHead>
                        <TableHead className="text-xs font-bold text-slate-700 uppercase dark:text-slate-200">
                          Due Date
                        </TableHead>
                        <TableHead className="text-xs font-bold text-slate-700 uppercase dark:text-slate-200">
                          Selesai
                        </TableHead>
                        <TableHead className="text-xs font-bold text-slate-700 uppercase dark:text-slate-200">
                          Ketepatan
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {snap.tasksBreakdown.map((t) => (
                        <TableRow
                          key={t.taskId}
                          className="border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                        >
                          <TableCell className="font-mono text-xs font-bold text-slate-800 dark:text-slate-100">
                            {t.taskCode}
                          </TableCell>
                          <TableCell className="max-w-xs truncate font-semibold text-slate-900 dark:text-white">
                            {t.title}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                            {t.projectCode || "Tanpa Proyek"}
                          </TableCell>
                          <TableCell>
                            <StatusBadge domain="task" value={t.status} />
                          </TableCell>
                          <TableCell className="font-mono text-xs font-medium text-slate-600 dark:text-slate-300">
                            {formatWibDateTime(t.dueDate)}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-medium text-slate-600 dark:text-slate-300">
                            {formatWibDateTime(t.effectiveCompletionTime)}
                          </TableCell>
                          <TableCell>
                            {t.isOnTime === true ? (
                              <Badge
                                variant="outline"
                                className="border-emerald-300 bg-emerald-50 font-bold text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300"
                              >
                                Tepat Waktu
                              </Badge>
                            ) : t.isOnTime === false ? (
                              <Badge
                                variant="outline"
                                className="border-rose-300 bg-rose-50 font-bold text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300"
                              >
                                Terlambat
                              </Badge>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="designs">
              {snap.designBriefsBreakdown.length === 0 ? (
                <EmptyState
                  title="Belum ada Design Brief disetujui"
                  className="py-8"
                />
              ) : (
                <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                  <Table>
                    <TableHeader className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/70">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-xs font-bold text-slate-700 uppercase dark:text-slate-200">
                          Judul Brief
                        </TableHead>
                        <TableHead className="text-xs font-bold text-slate-700 uppercase dark:text-slate-200">
                          Proyek
                        </TableHead>
                        <TableHead className="text-xs font-bold text-slate-700 uppercase dark:text-slate-200">
                          Revisi
                        </TableHead>
                        <TableHead className="text-xs font-bold text-slate-700 uppercase dark:text-slate-200">
                          Skor DQS
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {snap.designBriefsBreakdown.map((b) => (
                        <TableRow
                          key={b.designBriefId}
                          className="border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"
                        >
                          <TableCell className="font-semibold text-slate-900 dark:text-white">
                            {b.title}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                            {b.projectCode}
                          </TableCell>
                          <TableCell className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">
                            {b.revisionCount}x
                          </TableCell>
                          <TableCell className="font-mono font-extrabold text-slate-900 dark:text-white">
                            {b.briefDqs}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Sticky Workflow Action Bar */}
      {hasActionBar ? (
        <div
          className="sticky bottom-3 z-20 flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 px-5 py-3.5 shadow-xl backdrop-blur-md sm:flex-row sm:items-center dark:border-slate-700 dark:bg-slate-900/95 print:hidden"
          data-print-hide="true"
        >
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className={cn("font-extrabold", heroStyle.pill)}
            >
              {gradeMeta.label}
            </Badge>
            <span className="font-mono text-base font-extrabold tabular-nums text-slate-900 dark:text-white">
              {liveScoreSummary.weightedKpiScore.toFixed(2)} / 100
            </span>
            <StatusBadge domain="evaluation" value={evaluation.status} />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {permissions.canEditScores && !isLocked ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={handleSaveDraft}
                className="gap-1.5 rounded-xl border-slate-300 bg-white font-bold text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              >
                {isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Save className="size-3.5" />
                )}
                <span>Simpan Draft</span>
              </Button>
            ) : null}

            {permissions.canReturnToSubmitted ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setReturnOpen(true)}
                className="gap-1.5 rounded-xl border-amber-300 bg-amber-50 font-bold text-amber-800 hover:bg-amber-100 dark:border-amber-500/40 dark:bg-amber-500/15 dark:text-amber-300"
              >
                <RotateCcw className="size-3.5" />
                <span>Kembalikan</span>
              </Button>
            ) : null}

            {permissions.canSubmit ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={isPending}
                onClick={() => handleSaveAndTransition("SUBMITTED")}
                className="gap-1.5 rounded-xl border border-slate-200 bg-slate-100 font-bold text-slate-900 hover:bg-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <Send className="size-3.5" />
                <span>Submit</span>
              </Button>
            ) : null}

            {permissions.canMarkReviewed ? (
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={() => handleSaveAndTransition("REVIEWED")}
                className="gap-1.5 rounded-xl bg-blue-600 font-bold text-white shadow-sm hover:bg-blue-700"
              >
                <ClipboardCheck className="size-3.5" />
                <span>Tandai Reviewed</span>
              </Button>
            ) : null}

            {permissions.canFinalize ? (
              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={() => {
                  setConfirmLockChecked(false);
                  setFinalizeOpen(true);
                }}
                className="gap-1.5 rounded-xl bg-emerald-600 font-bold text-white shadow-sm hover:bg-emerald-700"
              >
                <Lock className="size-3.5" />
                <span>Finalize &amp; Lock</span>
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Print-Only Signature Block */}
      <div className="hidden grid-cols-2 gap-12 pt-8 print:grid">
        <div className="space-y-12 text-center text-xs">
          <p className="font-semibold">Penilai / Evaluator</p>
          <div className="border-t border-slate-400 pt-1">
            <p className="font-semibold">{evaluation.evaluatorName}</p>
          </div>
        </div>
        <div className="space-y-12 text-center text-xs">
          <p className="font-semibold">Disetujui Oleh (Leadership)</p>
          <div className="border-t border-slate-400 pt-1">
            <p className="font-semibold">
              {evaluation.finalizedByName ?? "Super Admin Krevia Digital"}
            </p>
          </div>
        </div>
      </div>

      {/* Modal: Finalize & Lock Evaluation */}
      <Dialog open={finalizeOpen} onOpenChange={setFinalizeOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="size-5 text-emerald-600" />
              <span>Finalize &amp; Lock Evaluasi</span>
            </DialogTitle>
            <DialogDescription>
              Skor akhir{" "}
              <strong>
                {liveScoreSummary.weightedKpiScore.toFixed(2)} (
                {gradeMeta.label})
              </strong>{" "}
              untuk <strong>{evaluation.userName}</strong> akan dikunci permanen.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-1">
            <Label className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border bg-muted/30 p-3 text-xs">
              <Checkbox
                checked={confirmLockChecked}
                onCheckedChange={(checked) =>
                  setConfirmLockChecked(Boolean(checked))
                }
              />
              <span>
                Konfirmasi penguncian permanen snapshot &amp; kirim notifikasi
                ke anggota tim.
              </span>
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setFinalizeOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isPending || !confirmLockChecked}
              onClick={handleConfirmFinalize}
              className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <CheckCircle2 className="size-4" />
              )}
              <span>Finalize &amp; Lock</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Return for Adjustment */}
      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="size-4 text-amber-600" />
              <span>Kembalikan Evaluasi</span>
            </DialogTitle>
            <DialogDescription>
              Kembalikan ke status SUBMITTED untuk penyesuaian nilai oleh PM.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-1">
            <Label htmlFor="return-reason">Alasan (min. 10 karakter)</Label>
            <Textarea
              id="return-reason"
              rows={3}
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="Catatan kalibrasi..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setReturnOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isPending || returnReason.trim().length < 10}
              onClick={handleConfirmReturn}
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "Kembalikan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Reopen Finalized Evaluation */}
      <Dialog open={reopenOpen} onOpenChange={setReopenOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlert className="size-5 text-amber-600" />
              <span>Reopen Evaluasi</span>
            </DialogTitle>
            <DialogDescription>
              Status akan kembali ke DRAFT dan tercatat di Activity Logs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-1">
            <div className="flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 p-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="size-4 shrink-0" />
              <span>Khusus pengecualian Super Admin.</span>
            </div>
            <Label htmlFor="reopen-reason">Alasan (min. 20 karakter)</Label>
            <Textarea
              id="reopen-reason"
              rows={3}
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="Jelaskan alasan pembukaan kembali..."
            />
            <p className="text-right font-mono text-[11px] text-muted-foreground">
              {reopenReason.trim().length} / 20
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => setReopenOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isPending || reopenReason.trim().length < 20}
              onClick={handleConfirmReopen}
              className="gap-1.5"
            >
              {isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Unlock className="size-4" />
              )}
              <span>Reopen</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
