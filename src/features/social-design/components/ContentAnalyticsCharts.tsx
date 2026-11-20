"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Award,
  BarChart3,
  ExternalLink,
  Eye,
  Loader2,
  MousePointerClick,
  Plus,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import {
  DataTable,
  createDataTableColumnHelper,
  type DataTableColumnDef,
} from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { upsertContentAnalyticsAction } from "@/features/social-design/actions/analytics.actions";
import { ChannelPill } from "@/features/social-design/components/StudioPrimitives";
import {
  CONTENT_FORMAT_META,
  SOCIAL_PLATFORM_META,
  getPillarLabel,
} from "@/features/social-design/constants";
import type {
  ContentAnalyticsSummaryDTO,
  PublishedContentAnalyticItemDTO,
} from "@/features/social-design/types";
import {
  formatDateId,
  getTodayDateJakarta,
} from "@/features/social-design/utils";

export interface ContentAnalyticsChartsProps {
  summary: ContentAnalyticsSummaryDTO;
  canManageAnalytics: boolean;
}

const columnHelper =
  createDataTableColumnHelper<PublishedContentAnalyticItemDTO>();

function formatCompactNumber(val: number): string {
  return new Intl.NumberFormat("id-ID").format(val);
}

export function ContentAnalyticsCharts({
  summary,
  canManageAnalytics,
}: ContentAnalyticsChartsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedContentId, setSelectedContentId] = useState<string>(
    summary.publishedContents[0]?.id ?? ""
  );
  const [recordedDate, setRecordedDate] = useState<string>(
    getTodayDateJakarta()
  );
  const [impressions, setImpressions] = useState("0");
  const [reach, setReach] = useState("0");
  const [likes, setLikes] = useState("0");
  const [comments, setComments] = useState("0");
  const [shares, setShares] = useState("0");
  const [saves, setSaves] = useState("0");
  const [clicks, setClicks] = useState("0");
  const [videoViews, setVideoViews] = useState("0");
  const [notes, setNotes] = useState("");

  const openModalForContent = (item?: PublishedContentAnalyticItemDTO) => {
    const target = item ?? summary.publishedContents[0];
    if (!target) {
      toast.error("Belum ada konten PUBLISHED.");
      return;
    }

    setSelectedContentId(target.id);
    const snap = target.latestSnapshot;
    setRecordedDate(getTodayDateJakarta());
    setImpressions(String(snap?.impressions ?? 0));
    setReach(String(snap?.reach ?? 0));
    setLikes(String(snap?.likes ?? 0));
    setComments(String(snap?.comments ?? 0));
    setShares(String(snap?.shares ?? 0));
    setSaves(String(snap?.saves ?? 0));
    setClicks(String(snap?.clicks ?? 0));
    setVideoViews(String(snap?.videoViews ?? 0));
    setNotes(snap?.notes ?? "");
    setModalOpen(true);
  };

  const numImpressions = Math.max(0, Number(impressions) || 0);
  const numReach = Math.max(0, Number(reach) || 0);
  const numLikes = Math.max(0, Number(likes) || 0);
  const numComments = Math.max(0, Number(comments) || 0);
  const numShares = Math.max(0, Number(shares) || 0);
  const numSaves = Math.max(0, Number(saves) || 0);
  const numClicks = Math.max(0, Number(clicks) || 0);
  const numVideoViews = Math.max(0, Number(videoViews) || 0);

  const previewTotalEngagement =
    numLikes + numComments + numShares + numSaves;
  const previewEr =
    numReach > 0
      ? Number(((previewTotalEngagement / numReach) * 100).toFixed(2))
      : 0;
  const previewCtr =
    numImpressions > 0
      ? Number(((numClicks / numImpressions) * 100).toFixed(2))
      : 0;
  const reachWarning = numImpressions > 0 && numReach > numImpressions;

  const contentOptions = useMemo(
    () =>
      summary.publishedContents.map((c) => ({
        value: c.id,
        label: `[${SOCIAL_PLATFORM_META[c.platform].shortLabel}] ${c.title}`,
      })),
    [summary.publishedContents]
  );

  const handleSaveMetrics = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContentId) return;

    startTransition(async () => {
      const res = await upsertContentAnalyticsAction({
        contentItemId: selectedContentId,
        recordedDate,
        impressions: Math.trunc(numImpressions),
        reach: Math.trunc(numReach),
        likes: Math.trunc(numLikes),
        comments: Math.trunc(numComments),
        shares: Math.trunc(numShares),
        saves: Math.trunc(numSaves),
        clicks: Math.trunc(numClicks),
        videoViews: Math.trunc(numVideoViews),
        notes: notes.trim() || null,
      });

      if (!res.success) {
        const firstErr = res.error.fieldErrors
          ? Object.values(res.error.fieldErrors).flat()[0]
          : null;
        toast.error(firstErr ?? res.error.message);
        return;
      }

      toast.success(res.message ?? "Metrik disimpan.");
      setModalOpen(false);
      router.refresh();
    });
  };

  const tableColumns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("title", {
          header: "Konten",
          cell: (info) => {
            const row = info.row.original;
            return (
              <div className="min-w-[200px] max-w-[340px] space-y-0.5">
                <p className="truncate font-medium text-foreground">{row.title}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {CONTENT_FORMAT_META[row.contentFormat].label} ·{" "}
                  {getPillarLabel(row.contentPillar)} ·{" "}
                  {formatDateId(row.publishedAt)}
                </p>
              </div>
            );
          },
        }),
        columnHelper.accessor("platform", {
          header: "Channel",
          cell: (info) => <ChannelPill platform={info.row.original.platform} />,
        }),
        columnHelper.display({
          id: "reach",
          header: "Reach / Impr.",
          cell: (info) => {
            const snap = info.row.original.latestSnapshot;
            if (!snap)
              return (
                <span className="text-xs text-muted-foreground">—</span>
              );
            return (
              <div className="font-mono text-xs tabular-nums">
                <p className="font-semibold text-foreground">
                  {formatCompactNumber(snap.reach)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatCompactNumber(snap.impressions)} impr
                </p>
              </div>
            );
          },
        }),
        columnHelper.display({
          id: "engagement",
          header: "ER %",
          cell: (info) => {
            const snap = info.row.original.latestSnapshot;
            if (!snap)
              return <span className="text-xs text-muted-foreground">—</span>;
            return (
              <Badge
                variant="outline"
                className="border-emerald-200 bg-emerald-500/10 font-mono text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300"
              >
                {snap.engagementRate.toFixed(2)}%
              </Badge>
            );
          },
        }),
        columnHelper.display({
          id: "ctr",
          header: "CTR %",
          cell: (info) => {
            const snap = info.row.original.latestSnapshot;
            if (!snap)
              return <span className="text-xs text-muted-foreground">—</span>;
            return (
              <Badge
                variant="outline"
                className="border-sky-200 bg-sky-500/10 font-mono text-sky-700 dark:border-sky-500/30 dark:text-sky-300"
              >
                {snap.ctr.toFixed(2)}%
              </Badge>
            );
          },
        }),
        columnHelper.display({
          id: "actions",
          header: "",
          cell: (info) => {
            const row = info.row.original;
            return (
              <div className="flex items-center gap-1.5">
                {canManageAnalytics ? (
                  <Button
                    type="button"
                    size="xs"
                    variant="outline"
                    onClick={() => openModalForContent(row)}
                  >
                    {row.latestSnapshot ? "Update" : "Input"}
                  </Button>
                ) : null}
                {row.publishedUrl ? (
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() =>
                      window.open(
                        row.publishedUrl!,
                        "_blank",
                        "noopener,noreferrer"
                      )
                    }
                    aria-label="Buka postingan"
                  >
                    <ExternalLink className="size-3.5" />
                  </Button>
                ) : null}
              </div>
            );
          },
        }),
      ]) as DataTableColumnDef<PublishedContentAnalyticItemDTO>[],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [canManageAnalytics]
  );

  return (
    <div className="space-y-5">
      {/* KPI Metric Bento Row */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="rounded-2xl border-border/70">
          <CardContent className="flex items-center justify-between pt-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Published
              </p>
              <p className="font-heading text-2xl font-bold tabular-nums">
                {summary.totalPublishedCount}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {summary.trackedContentCount} tracked
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <BarChart3 className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70">
          <CardContent className="flex items-center justify-between pt-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Total Reach
              </p>
              <p className="font-heading text-2xl font-bold tabular-nums">
                {formatCompactNumber(summary.totalReach)}
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {formatCompactNumber(summary.totalImpressions)} impr
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Eye className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70">
          <CardContent className="flex items-center justify-between pt-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Avg ER%
              </p>
              <p className="font-heading text-2xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                {summary.avgEngagementRate.toFixed(2)}%
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {formatCompactNumber(summary.totalEngagement)} eng
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="size-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/70">
          <CardContent className="flex items-center justify-between pt-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Avg CTR%
              </p>
              <p className="font-heading text-2xl font-bold tabular-nums text-indigo-600 dark:text-indigo-400">
                {summary.avgCtr.toFixed(2)}%
              </p>
              <p className="font-mono text-[11px] text-muted-foreground">
                {formatCompactNumber(summary.totalClicks)} clicks
              </p>
            </div>
            <div className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <MousePointerClick className="size-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Strip */}
      {canManageAnalytics ? (
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => openModalForContent()}
            disabled={summary.publishedContents.length === 0}
            className="gap-1.5 rounded-xl"
          >
            <Plus className="size-4" />
            <span>Input Metrik</span>
          </Button>
        </div>
      ) : null}

      {/* Charts + Leaderboard */}
      {summary.publishedContents.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Belum ada konten Published"
          description="Publish konten di Calendar untuk mencatat metrik."
        />
      ) : (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="rounded-2xl border-border/70">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Reach &amp; ER% per Channel
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary.byPlatform.length === 0 ? (
                  <p className="py-10 text-center text-xs text-muted-foreground">
                    Belum ada data.
                  </p>
                ) : (
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart
                        data={summary.byPlatform}
                        margin={{ top: 10, right: 16, left: 0, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                        <XAxis dataKey="label" fontSize={12} />
                        <YAxis yAxisId="left" fontSize={12} />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          fontSize={12}
                          unit="%"
                        />
                        <Tooltip />
                        <Legend />
                        <Bar
                          yAxisId="left"
                          dataKey="totalReach"
                          name="Reach"
                          fill="#2563eb"
                          radius={[6, 6, 0, 0]}
                        />
                        <Bar
                          yAxisId="right"
                          dataKey="avgEngagementRate"
                          name="Avg ER (%)"
                          fill="#10b981"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/70">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">
                  Avg ER% per Pilar Konten
                </CardTitle>
              </CardHeader>
              <CardContent>
                {summary.byPillar.length === 0 ? (
                  <p className="py-10 text-center text-xs text-muted-foreground">
                    Belum ada data.
                  </p>
                ) : (
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart
                        data={summary.byPillar}
                        margin={{ top: 10, right: 16, left: 0, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                        <XAxis dataKey="label" fontSize={12} />
                        <YAxis fontSize={12} unit="%" />
                        <Tooltip />
                        <Legend />
                        <Bar
                          dataKey="avgEngagementRate"
                          name="Avg ER (%)"
                          fill="#8b5cf6"
                          radius={[6, 6, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top 5 Performing Content Leaderboard */}
          <Card className="rounded-2xl border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm font-semibold">
                <Award className="size-4 text-amber-500" />
                <span>Top Performing Contents</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {summary.topContents.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground">
                  Belum ada snapshot metrik.
                </p>
              ) : (
                <div className="space-y-2">
                  {summary.topContents.map((item, idx) => {
                    const snap = item.latestSnapshot!;
                    return (
                      <div
                        key={item.id}
                        className="flex flex-col justify-between gap-2 rounded-xl border border-border/60 bg-muted/20 p-3 sm:flex-row sm:items-center"
                      >
                        <div className="flex min-w-0 items-start gap-3">
                          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary">
                            #{idx + 1}
                          </span>
                          <div className="min-w-0 space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <ChannelPill platform={item.platform} compact />
                              <span className="break-words text-sm font-semibold text-foreground">
                                {item.title}
                              </span>
                            </div>
                            <p className="font-mono text-[11px] text-muted-foreground">
                              Reach {formatCompactNumber(snap.reach)} ·{" "}
                              {formatCompactNumber(snap.likes)} likes ·{" "}
                              {formatCompactNumber(snap.comments)} comments ·{" "}
                              {formatCompactNumber(snap.saves)} saves
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <Badge
                            variant="outline"
                            className="border-emerald-200 bg-emerald-500/10 font-mono text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300"
                          >
                            ER {snap.engagementRate.toFixed(2)}%
                          </Badge>
                          <Badge
                            variant="outline"
                            className="border-sky-200 bg-sky-500/10 font-mono text-sky-700 dark:border-sky-500/30 dark:text-sky-300"
                          >
                            CTR {snap.ctr.toFixed(2)}%
                          </Badge>
                          {item.publishedUrl ? (
                            <Button
                              type="button"
                              size="xs"
                              variant="outline"
                              onClick={() =>
                                window.open(
                                  item.publishedUrl!,
                                  "_blank",
                                  "noopener,noreferrer"
                                )
                              }
                            >
                              <ExternalLink className="size-3" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <DataTable
            columns={tableColumns}
            data={summary.publishedContents}
            searchPlaceholder="Cari konten..."
            pagination={{ pageSize: 10 }}
          />
        </>
      )}

      {/* Input / Edit Metrics Dialog */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-heading">Input Metrik Konten</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveMetrics} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="min-w-0 space-y-1.5 sm:col-span-2">
                <Label>Konten *</Label>
                <Select
                  value={selectedContentId}
                  onValueChange={(v) => {
                    if (v) setSelectedContentId(v);
                  }}
                  items={contentOptions}
                >
                  <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                    <SelectValue placeholder="Pilih konten" className="block min-w-0 truncate" />
                  </SelectTrigger>
                  <SelectContent>
                    {contentOptions.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="truncate">{c.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-0 space-y-1.5">
                <Label htmlFor="an-date">Tanggal *</Label>
                <Input
                  id="an-date"
                  type="date"
                  value={recordedDate}
                  onChange={(e) => setRecordedDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="space-y-1">
                <Label htmlFor="an-impr">Impressions</Label>
                <Input
                  id="an-impr"
                  type="number"
                  min={0}
                  value={impressions}
                  onChange={(e) => setImpressions(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="an-reach">Reach</Label>
                <Input
                  id="an-reach"
                  type="number"
                  min={0}
                  value={reach}
                  onChange={(e) => setReach(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="an-views">Views</Label>
                <Input
                  id="an-views"
                  type="number"
                  min={0}
                  value={videoViews}
                  onChange={(e) => setVideoViews(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="an-clicks">Clicks</Label>
                <Input
                  id="an-clicks"
                  type="number"
                  min={0}
                  value={clicks}
                  onChange={(e) => setClicks(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="an-likes">Likes</Label>
                <Input
                  id="an-likes"
                  type="number"
                  min={0}
                  value={likes}
                  onChange={(e) => setLikes(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="an-comments">Comments</Label>
                <Input
                  id="an-comments"
                  type="number"
                  min={0}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="an-shares">Shares</Label>
                <Input
                  id="an-shares"
                  type="number"
                  min={0}
                  value={shares}
                  onChange={(e) => setShares(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="an-saves">Saves</Label>
                <Input
                  id="an-saves"
                  type="number"
                  min={0}
                  value={saves}
                  onChange={(e) => setSaves(e.target.value)}
                />
              </div>
            </div>

            {reachWarning ? (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-500/10 p-2.5 text-xs text-amber-900 dark:border-amber-500/30 dark:text-amber-200">
                <AlertTriangle className="size-4 shrink-0 text-amber-600" />
                <span>Reach melebihi Impressions — periksa kembali angka input.</span>
              </div>
            ) : null}

            <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3 text-xs">
              <span>
                Engagement:{" "}
                <strong className="font-mono text-foreground">
                  {formatCompactNumber(previewTotalEngagement)}
                </strong>
              </span>
              <span>
                ER%:{" "}
                <strong className="font-mono text-emerald-600 dark:text-emerald-400">
                  {previewEr.toFixed(2)}%
                </strong>
              </span>
              <span>
                CTR%:{" "}
                <strong className="font-mono text-sky-600 dark:text-sky-400">
                  {previewCtr.toFixed(2)}%
                </strong>
              </span>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="an-notes">Catatan</Label>
              <Textarea
                id="an-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Insight performa..."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setModalOpen(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  "Simpan"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
