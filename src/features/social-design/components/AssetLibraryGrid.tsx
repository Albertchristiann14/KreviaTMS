"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AssetCategory } from "@prisma/client";
import {
  Archive,
  BadgeCheck,
  Check,
  Copy,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  Images,
  LayoutGrid,
  Loader2,
  Plus,
  Search,
  Table as TableIcon,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import {
  DataTable,
  createDataTableColumnHelper,
  type DataTableColumnDef,
} from "@/components/shared/DataTable";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  FileUploadDropzone,
  type FileDropzonePayload,
} from "@/components/shared/FileUploadDropzone";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  archiveAssetAction,
  upsertAssetAction,
} from "@/features/social-design/actions/asset.actions";
import {
  FileTypeBadge,
  SignedMediaPreviewDialog,
  openAssetOrSubmissionLink,
} from "@/features/social-design/components/SignedMediaPreview";
import {
  ChannelPill,
  CreativeAvatar,
  DesignArtboardThumb,
} from "@/features/social-design/components/StudioPrimitives";
import {
  ASSET_CATEGORY_META,
  ASSET_CATEGORY_VALUES,
} from "@/features/social-design/constants";
import type {
  AssetDTO,
  AssetsApiResponse,
  SelectableProjectOption,
} from "@/features/social-design/types";
import {
  formatBytes,
  formatDateId,
  parseTagsInput,
} from "@/features/social-design/utils";
import { cn } from "@/lib/utils";

export interface AssetLibraryGridProps {
  initialData: AssetsApiResponse;
  projects: SelectableProjectOption[];
  currentUserId: string;
  isAdminOrPm: boolean;
  canManageAssets: boolean;
}

const columnHelper = createDataTableColumnHelper<AssetDTO>();

export function AssetLibraryGrid({
  initialData,
  projects,
  currentUserId,
  isAdminOrPm,
  canManageAssets,
}: AssetLibraryGridProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [projectFilter, setProjectFilter] = useState<string>("ALL");
  const [selectedTag, setSelectedTag] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  // Preview modal
  const [previewAsset, setPreviewAsset] = useState<AssetDTO | null>(null);

  // Create/Edit Asset modal
  const [formOpen, setFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<AssetDTO | null>(null);
  const [assetTitle, setAssetTitle] = useState("");
  const [assetDesc, setAssetDesc] = useState("");
  const [assetCategory, setAssetCategory] =
    useState<AssetCategory>("BRAND_KIT");
  const [assetProjectId, setAssetProjectId] = useState<string>("NONE");
  const [assetTagsRaw, setAssetTagsRaw] = useState("");
  const [assetIsBrand, setAssetIsBrand] = useState(true);
  const [dropzonePayload, setDropzonePayload] =
    useState<FileDropzonePayload | null>(null);

  // Confirm Archive
  const [archiveTarget, setArchiveTarget] = useState<AssetDTO | null>(null);

  const isInitialQuery =
    searchQuery.trim() === "" &&
    categoryFilter === "ALL" &&
    projectFilter === "ALL" &&
    selectedTag === "ALL" &&
    page === 1;

  const query = useQuery<AssetsApiResponse>({
    queryKey: [
      "social-design",
      "assets",
      searchQuery.trim(),
      categoryFilter,
      projectFilter,
      selectedTag,
      page,
    ],
    queryFn: async () => {
      const sp = new URLSearchParams();
      if (searchQuery.trim()) sp.set("q", searchQuery.trim());
      if (categoryFilter !== "ALL") sp.set("category", categoryFilter);
      if (projectFilter !== "ALL") sp.set("projectId", projectFilter);
      if (selectedTag !== "ALL") sp.set("tags", selectedTag);
      sp.set("page", String(page));
      sp.set("limit", "24");

      const res = await fetch(`/api/assets?${sp.toString()}`, {
        cache: "no-cache",
      });
      if (!res.ok) {
        throw new Error("Gagal memuat Asset Library.");
      }
      return (await res.json()) as AssetsApiResponse;
    },
    initialData: isInitialQuery ? initialData : undefined,
    placeholderData: keepPreviousData,
    staleTime: 20_000,
  });

  const data = query.data ?? initialData;
  const items = data.items;

  const projectItems = useMemo(
    () => [
      { value: "NONE", label: "Umum (Tanpa Proyek)" },
      ...projects.map((p) => ({
        value: p.id,
        label: `${p.code} — ${p.name}`,
      })),
    ],
    [projects]
  );

  const openCreateModal = () => {
    setEditingAsset(null);
    setAssetTitle("");
    setAssetDesc("");
    setAssetCategory("BRAND_KIT");
    setAssetProjectId("NONE");
    setAssetTagsRaw("");
    setAssetIsBrand(true);
    setDropzonePayload(null);
    setFormOpen(true);
  };

  const openEditModal = (asset: AssetDTO) => {
    setEditingAsset(asset);
    setAssetTitle(asset.title);
    setAssetDesc(asset.description ?? "");
    setAssetCategory(asset.category);
    setAssetProjectId(asset.projectId ?? "NONE");
    setAssetTagsRaw(asset.tags.join(", "));
    setAssetIsBrand(asset.isApprovedBrandAsset);
    setDropzonePayload(null);
    setFormOpen(true);
  };

  const handleSaveAsset = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAsset && !dropzonePayload) {
      toast.error("Unggah file atau simpan tautan aset terlebih dahulu.");
      return;
    }

    startTransition(async () => {
      const sourceType = dropzonePayload
        ? dropzonePayload.sourceType
        : editingAsset!.sourceType;

      const res = await upsertAssetAction({
        id: editingAsset?.id,
        projectId: assetProjectId === "NONE" ? null : assetProjectId,
        contentItemId: editingAsset?.contentItemId ?? null,
        title: assetTitle,
        description: assetDesc || null,
        category: assetCategory,
        sourceType,
        storageKey:
          dropzonePayload?.sourceType === "UPLOAD"
            ? dropzonePayload.storageKey
            : editingAsset?.storageKey ?? null,
        externalUrl:
          dropzonePayload && dropzonePayload.sourceType !== "UPLOAD"
            ? dropzonePayload.fileUrl
            : editingAsset && editingAsset.sourceType !== "UPLOAD"
              ? editingAsset.fileUrl
              : null,
        mimeType: dropzonePayload
          ? dropzonePayload.mimeType
          : editingAsset?.mimeType ?? null,
        fileSizeBytes: dropzonePayload
          ? dropzonePayload.fileSizeBytes
          : editingAsset?.fileSizeBytes ?? null,
        tags: parseTagsInput(assetTagsRaw),
        isApprovedBrandAsset: assetIsBrand,
      });

      if (!res.success) {
        const firstErr = res.error.fieldErrors
          ? Object.values(res.error.fieldErrors).flat()[0]
          : null;
        toast.error(firstErr ?? res.error.message);
        return;
      }

      toast.success(res.message ?? "Aset tersimpan.");
      setFormOpen(false);
      void queryClient.invalidateQueries({
        queryKey: ["social-design", "assets"],
      });
      router.refresh();
    });
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    const res = await archiveAssetAction({ assetId: archiveTarget.id });
    if (!res.success) {
      toast.error(res.error.message);
      return;
    }
    toast.success(res.message ?? "Aset diarsipkan.");
    setArchiveTarget(null);
    void queryClient.invalidateQueries({
      queryKey: ["social-design", "assets"],
    });
    router.refresh();
  };

  const handleCopyLink = async (asset: AssetDTO) => {
    try {
      const targetUrl =
        asset.sourceType === "UPLOAD"
          ? `${window.location.origin}/api/uploads/download-url?storageKey=${encodeURIComponent(asset.storageKey ?? "")}`
          : asset.fileUrl;
      await navigator.clipboard.writeText(targetUrl);
      toast.success("Tautan disalin.");
    } catch {
      toast.error("Gagal menyalin tautan.");
    }
  };

  const columns = useMemo(
    () =>
      columnHelper.columns([
        columnHelper.accessor("title", {
          header: "Aset",
          cell: (info) => {
            const row = info.row.original;
            return (
              <div className="min-w-[200px] max-w-[340px] space-y-1">
                <div className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate font-medium text-foreground">{row.title}</span>
                  {row.isApprovedBrandAsset ? (
                    <Badge
                      variant="outline"
                      className="shrink-0 gap-1 border-emerald-200 bg-emerald-500/10 text-[10px] text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-300"
                    >
                      <BadgeCheck className="size-2.5" />
                      <span>Approved</span>
                    </Badge>
                  ) : null}
                </div>
                {row.tags.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {row.tags.slice(0, 4).map((t) => (
                      <Badge key={t} variant="secondary" className="text-[10px]">
                        #{t}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          },
        }),
        columnHelper.accessor("category", {
          header: "Kategori",
          cell: (info) => {
            const cat = info.row.original.category;
            const meta = ASSET_CATEGORY_META[cat];
            return (
              <Badge variant="outline" className={meta.badgeClass}>
                {meta.label}
              </Badge>
            );
          },
        }),
        columnHelper.display({
          id: "source",
          header: "Format",
          cell: (info) => {
            const row = info.row.original;
            return (
              <FileTypeBadge
                sourceType={row.sourceType}
                mimeType={row.mimeType}
                fileSizeBytes={row.fileSizeBytes}
              />
            );
          },
        }),
        columnHelper.accessor("uploaderName", {
          header: "Uploader",
          cell: (info) => {
            const row = info.row.original;
            return (
              <div className="flex min-w-0 items-center gap-2">
                <CreativeAvatar
                  name={row.uploaderName}
                  avatarUrl={row.uploaderAvatarUrl}
                  size="sm"
                />
                <span className="truncate text-xs font-medium text-foreground">
                  {row.uploaderName}
                </span>
              </div>
            );
          },
        }),
        columnHelper.accessor("createdAt", {
          header: "Tanggal",
          cell: (info) => (
            <span className="font-mono text-xs tabular-nums text-muted-foreground">
              {formatDateId(info.row.original.createdAt)}
            </span>
          ),
        }),
        columnHelper.display({
          id: "actions",
          header: "",
          cell: (info) => {
            const row = info.row.original;
            const canEditOrDelete =
              canManageAssets &&
              (isAdminOrPm || row.uploadedBy === currentUserId);

            return (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => setPreviewAsset(row)}
                >
                  <Eye className="size-3" />
                </Button>
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() =>
                    void openAssetOrSubmissionLink({
                      sourceType: row.sourceType,
                      fileUrl: row.fileUrl,
                      storageKey: row.storageKey,
                      forceDownload: row.sourceType === "UPLOAD",
                    })
                  }
                >
                  {row.sourceType === "UPLOAD" ? (
                    <Download className="size-3" />
                  ) : (
                    <ExternalLink className="size-3" />
                  )}
                </Button>
                {canEditOrDelete ? (
                  <Button
                    type="button"
                    size="xs"
                    variant="ghost"
                    onClick={() => openEditModal(row)}
                  >
                    <Edit3 className="size-3" />
                  </Button>
                ) : null}
              </div>
            );
          },
        }),
      ]) as DataTableColumnDef<AssetDTO>[],
    [canManageAssets, isAdminOrPm, currentUserId]
  );

  return (
    <div className="space-y-5">
      {/* Studio Search, Filters & View Toggle */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/90 p-3 shadow-2xs">
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-2">
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari aset atau tag..."
                className="h-8 bg-background pl-8 text-xs"
              />
            </div>

            <Select
              value={categoryFilter}
              onValueChange={(v) => {
                setCategoryFilter(v ?? "ALL");
                setPage(1);
              }}
              items={[
                { value: "ALL", label: "Semua Kategori" },
                ...ASSET_CATEGORY_VALUES.map((c) => ({
                  value: c,
                  label: ASSET_CATEGORY_META[c].label,
                })),
              ]}
            >
              <SelectTrigger className="h-8 w-40 min-w-0 overflow-hidden bg-background text-xs *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                <SelectValue placeholder="Kategori" className="block min-w-0 truncate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Kategori</SelectItem>
                {ASSET_CATEGORY_VALUES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {ASSET_CATEGORY_META[c].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={projectFilter}
              onValueChange={(v) => {
                setProjectFilter(v ?? "ALL");
                setPage(1);
              }}
              items={[
                { value: "ALL", label: "Semua Proyek" },
                ...projects.map((p) => ({
                  value: p.id,
                  label: `${p.code} — ${p.name}`,
                })),
              ]}
            >
              <SelectTrigger className="h-8 w-44 min-w-0 overflow-hidden bg-background text-xs *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                <SelectValue placeholder="Proyek" className="block min-w-0 truncate" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Semua Proyek</SelectItem>
                {projects.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    <span className="truncate">
                      {p.code} — {p.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-xl border border-border/70 bg-muted/60 p-0.5">
              <Button
                type="button"
                size="sm"
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                onClick={() => setViewMode("grid")}
                className="gap-1.5 rounded-lg"
              >
                <LayoutGrid className="size-3.5" />
                <span>Grid</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant={viewMode === "table" ? "secondary" : "ghost"}
                onClick={() => setViewMode("table")}
                className="gap-1.5 rounded-lg"
              >
                <TableIcon className="size-3.5" />
                <span>Tabel</span>
              </Button>
            </div>

            {canManageAssets ? (
              <Button
                type="button"
                onClick={openCreateModal}
                className="gap-1.5 rounded-xl"
              >
                <Plus className="size-4" />
                <span>Aset Baru</span>
              </Button>
            ) : null}
          </div>
        </div>

        {data.availableTags.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5 border-t border-border/50 pt-2.5">
            <span className="text-[11px] font-medium text-muted-foreground">
              Tags:
            </span>
            <button
              type="button"
              onClick={() => {
                setSelectedTag("ALL");
                setPage(1);
              }}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                selectedTag === "ALL"
                  ? "border-foreground/20 bg-foreground text-background"
                  : "border-border/70 bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              Semua
            </button>
            {data.availableTags.slice(0, 15).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setSelectedTag(selectedTag === tag ? "ALL" : tag);
                  setPage(1);
                }}
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
                  selectedTag === tag
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border/70 bg-background text-muted-foreground hover:text-foreground"
                )}
              >
                #{tag}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Grid or DataTable View */}
      {viewMode === "table" ? (
        <DataTable
          columns={columns}
          data={items}
          searchable={false}
          isLoading={query.isLoading}
          pagination={{
            page: data.meta.page,
            limit: data.meta.limit,
            totalItems: data.meta.totalItems,
            totalPages: data.meta.totalPages,
            onPageChange: (nextPage) => setPage(nextPage),
          }}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={Images}
          title="Belum ada aset"
          description="Desain approved otomatis tersimpan di sini."
          action={
            canManageAssets ? (
              <Button type="button" size="sm" onClick={openCreateModal}>
                <Plus className="size-4" />
                <span>Tambah Aset</span>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((asset) => {
              const catMeta = ASSET_CATEGORY_META[asset.category];
              const canEditOrDelete =
                canManageAssets &&
                (isAdminOrPm || asset.uploadedBy === currentUserId);

              return (
                <div
                  key={asset.id}
                  className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-border/70 bg-card shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <button
                    type="button"
                    onClick={() => setPreviewAsset(asset)}
                    className="block w-full text-left focus:outline-none"
                  >
                    <DesignArtboardThumb
                      title={asset.title}
                      projectCode={asset.projectCode ?? "BRAND"}
                      platform={asset.contentPlatform}
                      versionNumber={asset.designVersionNumber ?? 1}
                      revisionCount={0}
                      latestSubmission={{
                        sourceType: asset.sourceType,
                        fileUrl: asset.fileUrl,
                        storageKey: asset.storageKey,
                        mimeType: asset.mimeType,
                      }}
                      overlayRight={
                        asset.isApprovedBrandAsset ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-xs backdrop-blur-md">
                            <BadgeCheck className="size-2.5" />
                            <span>Final</span>
                          </span>
                        ) : undefined
                      }
                    />
                  </button>

                  <div className="flex flex-1 flex-col gap-2 p-3.5">
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <Badge variant="outline" className={catMeta.badgeClass}>
                        {catMeta.label}
                      </Badge>
                      {asset.contentPlatform ? (
                        <ChannelPill platform={asset.contentPlatform} compact />
                      ) : null}
                    </div>

                    <h3 className="line-clamp-2 break-words font-heading text-sm font-semibold leading-snug text-foreground">
                      {asset.title}
                    </h3>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="font-mono">
                        {asset.projectCode ?? "Umum"}
                      </span>
                      <span className="font-mono">
                        {asset.fileSizeBytes != null
                          ? formatBytes(asset.fileSizeBytes)
                          : asset.sourceType}
                      </span>
                    </div>

                    {asset.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {asset.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="flex items-center justify-between gap-1.5 border-t border-border/50 bg-muted/20 px-3.5 py-2.5">
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() => setPreviewAsset(asset)}
                        title="Preview"
                        className="rounded-lg"
                      >
                        <Eye className="size-3.5" />
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        onClick={() =>
                          void openAssetOrSubmissionLink({
                            sourceType: asset.sourceType,
                            fileUrl: asset.fileUrl,
                            storageKey: asset.storageKey,
                            forceDownload: asset.sourceType === "UPLOAD",
                          })
                        }
                        title={
                          asset.sourceType === "UPLOAD"
                            ? "Unduh"
                            : "Buka Tautan"
                        }
                        className="rounded-lg"
                      >
                        {asset.sourceType === "UPLOAD" ? (
                          <Download className="size-3.5" />
                        ) : (
                          <ExternalLink className="size-3.5" />
                        )}
                      </Button>
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        onClick={() => void handleCopyLink(asset)}
                        title="Salin Link"
                        className="rounded-lg"
                      >
                        <Copy className="size-3.5" />
                      </Button>
                    </div>

                    {canEditOrDelete ? (
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          onClick={() => openEditModal(asset)}
                          title="Edit"
                        >
                          <Edit3 className="size-3.5" />
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => setArchiveTarget(asset)}
                          title="Arsipkan"
                        >
                          <Archive className="size-3.5" />
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          {data.meta.totalPages > 1 ? (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Halaman {data.meta.page} / {data.meta.totalPages} (
                {data.meta.totalItems})
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Sebelumnya
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={page >= data.meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Berikutnya
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Preview Dialog */}
      {previewAsset ? (
        <SignedMediaPreviewDialog
          open={Boolean(previewAsset)}
          onOpenChange={(open) => {
            if (!open) setPreviewAsset(null);
          }}
          title={previewAsset.title}
          subtitle={`${previewAsset.uploaderName} · ${formatDateId(previewAsset.createdAt)}`}
          sourceType={previewAsset.sourceType}
          fileUrl={previewAsset.fileUrl}
          storageKey={previewAsset.storageKey}
          mimeType={previewAsset.mimeType}
          fileSizeBytes={previewAsset.fileSizeBytes}
        />
      ) : null}

      {/* Upload / Edit Asset Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-heading">
              {editingAsset ? "Edit Metadata Aset" : "Aset Baru"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveAsset} className="space-y-4">
            {!editingAsset ? (
              <div className="space-y-2">
                <FileUploadDropzone
                  bucketFolder="assets"
                  allowExternalLink={true}
                  onComplete={(payload) => {
                    setDropzonePayload(payload);
                    if (!assetTitle.trim()) {
                      setAssetTitle(payload.fileName);
                    }
                  }}
                />
                {dropzonePayload ? (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-500/30 dark:text-emerald-200">
                    <Check className="size-4 shrink-0" />
                    <span className="truncate font-medium">
                      {dropzonePayload.fileName}
                    </span>
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="asset-title">Judul Aset *</Label>
              <Input
                id="asset-title"
                value={assetTitle}
                onChange={(e) => setAssetTitle(e.target.value)}
                required
                minLength={2}
                maxLength={200}
                placeholder="Logo Krevia Digital Primary Navy"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="min-w-0 space-y-1.5">
                <Label>Kategori *</Label>
                <Select
                  value={assetCategory}
                  onValueChange={(v) => {
                    if (v) setAssetCategory(v as AssetCategory);
                  }}
                  items={ASSET_CATEGORY_VALUES.map((c) => ({
                    value: c,
                    label: ASSET_CATEGORY_META[c].label,
                  }))}
                >
                  <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                    <SelectValue placeholder="Pilih kategori" className="block min-w-0 truncate" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_CATEGORY_VALUES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {ASSET_CATEGORY_META[c].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-0 space-y-1.5">
                <Label>Proyek</Label>
                <Select
                  value={assetProjectId}
                  onValueChange={(v) => {
                    if (v) setAssetProjectId(v);
                  }}
                  items={projectItems}
                >
                  <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                    <SelectValue placeholder="Pilih proyek" className="block min-w-0 truncate" />
                  </SelectTrigger>
                  <SelectContent>
                    {projectItems.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <span className="truncate">{p.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="asset-tags">Tags (koma)</Label>
              <Input
                id="asset-tags"
                value={assetTagsRaw}
                onChange={(e) => setAssetTagsRaw(e.target.value)}
                placeholder="logo, brand-kit, vector, q4"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="asset-desc">Catatan Penggunaan</Label>
              <Textarea
                id="asset-desc"
                rows={2}
                value={assetDesc}
                onChange={(e) => setAssetDesc(e.target.value)}
                placeholder="Catatan singkat aset..."
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
              <Checkbox
                checked={assetIsBrand}
                onCheckedChange={(c) => setAssetIsBrand(Boolean(c))}
              />
              <span>Tandai sebagai Brand Asset Resmi</span>
            </label>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormOpen(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isPending || (!editingAsset && !dropzonePayload)}
              >
                {isPending ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : editingAsset ? (
                  "Simpan"
                ) : (
                  "Simpan Aset"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Archive Dialog */}
      <ConfirmDialog
        open={Boolean(archiveTarget)}
        onOpenChange={(open) => {
          if (!open) setArchiveTarget(null);
        }}
        title="Arsipkan Aset?"
        description={`Aset "${archiveTarget?.title ?? ""}" akan diarsipkan.`}
        confirmLabel="Arsipkan"
        variant="destructive"
        isLoading={isPending}
        onConfirm={() => {
          startTransition(async () => {
            await handleConfirmArchive();
          });
        }}
      />
    </div>
  );
}
