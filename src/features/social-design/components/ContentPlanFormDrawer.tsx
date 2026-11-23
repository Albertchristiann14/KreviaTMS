"use client";

import { useMemo, useState, useTransition } from "react";
import type { ContentFormat, SocialPlatform } from "@prisma/client";
import {
  Calendar,
  Loader2,
  Palette,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { convertIdeaToPlanAction } from "@/features/social-design/actions/content-idea.actions";
import {
  createContentPlanAction,
  deleteContentPlanAction,
  updateContentPlanAction,
} from "@/features/social-design/actions/content-plan.actions";
import { ChannelPill } from "@/features/social-design/components/StudioPrimitives";
import {
  CAPTION_MAX_LENGTH,
  CONTENT_FORMAT_META,
  CONTENT_FORMAT_VALUES,
  CONTENT_PILLAR_OPTIONS,
  DESIGN_DIMENSIONS_PRESETS,
  SOCIAL_PLATFORM_META,
  SOCIAL_PLATFORM_VALUES,
} from "@/features/social-design/constants";
import type {
  ContentIdeaDTO,
  ContentPlanItemDTO,
  SelectableProjectOption,
  SelectableUserOption,
} from "@/features/social-design/types";
import {
  fromJakartaDatetimeLocalValue,
  parseHashtagsInput,
  toJakartaDatetimeLocalValue,
} from "@/features/social-design/utils";
import { cn } from "@/lib/utils";

export interface ContentPlanFormDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: SelectableProjectOption[];
  creators: SelectableUserOption[];
  designers: SelectableUserOption[];
  currentUserId: string;
  editingItem?: ContentPlanItemDTO | null;
  promotingIdea?: ContentIdeaDTO | null;
  canDelete?: boolean;
  onSuccess?: () => void;
}

function SectionHeading({
  step,
  title,
}: {
  step: string;
  title: string;
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border/50 pb-2">
      <span className="rounded-md bg-primary/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-primary">
        {step}
      </span>
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </span>
    </div>
  );
}

function ContentPlanFormDrawerBody({
  onOpenChange,
  projects,
  creators,
  designers,
  currentUserId,
  editingItem = null,
  promotingIdea = null,
  canDelete = false,
  onSuccess,
}: Omit<ContentPlanFormDrawerProps, "open">) {
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const isEditMode = Boolean(editingItem);
  const isPromoteMode = Boolean(promotingIdea && !editingItem);

  const [projectId, setProjectId] = useState(() =>
    editingItem
      ? editingItem.projectId
      : promotingIdea
        ? promotingIdea.projectId
        : projects[0]?.id ?? ""
  );
  const [title, setTitle] = useState(() =>
    editingItem
      ? editingItem.title
      : promotingIdea
        ? promotingIdea.title
        : ""
  );
  const [platform, setPlatform] = useState<SocialPlatform>(() =>
    editingItem
      ? editingItem.platform
      : promotingIdea
        ? promotingIdea.targetPlatform
        : "INSTAGRAM"
  );
  const [contentFormat, setContentFormat] = useState<ContentFormat>(() =>
    editingItem ? editingItem.contentFormat : "CAROUSEL"
  );
  const [contentPillar, setContentPillar] = useState<string>(() =>
    editingItem
      ? editingItem.contentPillar ?? "EDUCATIONAL"
      : promotingIdea
        ? promotingIdea.contentPillar ?? "EDUCATIONAL"
        : "EDUCATIONAL"
  );
  const [campaignName, setCampaignName] = useState(
    () => editingItem?.campaignName ?? ""
  );
  const [creatorId, setCreatorId] = useState(() => {
    if (editingItem) return editingItem.creatorId;
    const isEligible = (id: string | null | undefined): id is string =>
      Boolean(id) && creators.some((c) => c.id === id);
    if (promotingIdea) {
      return (
        [currentUserId, promotingIdea.proposedBy].find(isEligible) ??
        creators[0]?.id ??
        currentUserId
      );
    }
    return (
      [currentUserId].find(isEligible) ?? creators[0]?.id ?? currentUserId
    );
  });
  const [plannedPublishLocal, setPlannedPublishLocal] = useState(() =>
    editingItem ? toJakartaDatetimeLocalValue(editingItem.plannedPublishAt) : ""
  );
  const [caption, setCaption] = useState(() =>
    editingItem
      ? editingItem.caption ?? ""
      : promotingIdea
        ? promotingIdea.description ?? ""
        : ""
  );
  const [hashtagsRaw, setHashtagsRaw] = useState(() =>
    editingItem ? editingItem.hashtags.join(" ") : ""
  );
  const [ctaText, setCtaText] = useState(() => editingItem?.ctaText ?? "");
  const [requiresDesign, setRequiresDesign] = useState(() =>
    editingItem ? editingItem.requiresDesign : true
  );

  // Brief fields
  const [assignedDesignerId, setAssignedDesignerId] = useState(
    () => designers[0]?.id ?? ""
  );
  const [designDueLocal, setDesignDueLocal] = useState("");
  const [dimensionsSpec, setDimensionsSpec] = useState<string>(
    DESIGN_DIMENSIONS_PRESETS[0]
  );
  const [briefObjective, setBriefObjective] = useState(() =>
    promotingIdea
      ? promotingIdea.description?.trim() ||
        `Desain visual untuk konten ${promotingIdea.title}`
      : ""
  );
  const [copyOnDesign, setCopyOnDesign] = useState("");
  const [brandNotes, setBrandNotes] = useState("");
  const [referenceLinkInput, setReferenceLinkInput] = useState("");
  const [referenceLinks, setReferenceLinks] = useState<string[]>(
    () => promotingIdea?.referenceUrls ?? []
  );

  const projectItems = useMemo(() => {
    const items = projects.map((p) => ({
      value: p.id,
      label: `${p.code} — ${p.name}`,
    }));
    if (
      promotingIdea &&
      !items.some((item) => item.value === promotingIdea.projectId)
    ) {
      items.unshift({
        value: promotingIdea.projectId,
        label: `${promotingIdea.projectCode} — ${promotingIdea.projectName}`,
      });
    }
    return items;
  }, [projects, promotingIdea]);

  const creatorItems = useMemo(() => {
    const items = creators.map((c) => ({
      value: c.id,
      label: `${c.fullName}${c.jobTitle ? ` · ${c.jobTitle}` : ""}`,
    }));
    if (editingItem && !items.some((item) => item.value === editingItem.creatorId)) {
      items.unshift({
        value: editingItem.creatorId,
        label: editingItem.creatorName,
      });
    }
    return items;
  }, [creators, editingItem]);

  const designerItems = useMemo(
    () =>
      designers.map((d) => ({
        value: d.id,
        label: `${d.fullName} · Designer`,
      })),
    [designers]
  );

  const platformMeta = SOCIAL_PLATFORM_META[platform];
  const captionCount = caption.length;
  const isOverPlatformHint = captionCount > platformMeta.recommendedCaptionMax;
  const parsedHashtags = parseHashtagsInput(hashtagsRaw);

  const handleAddReferenceLink = () => {
    const trimmed = referenceLinkInput.trim();
    if (!trimmed) return;
    if (!trimmed.startsWith("https://")) {
      toast.error("Tautan referensi wajib menggunakan https://");
      return;
    }
    if (referenceLinks.length >= 10) {
      toast.error("Maksimal 10 tautan referensi.");
      return;
    }
    if (!referenceLinks.includes(trimmed)) {
      setReferenceLinks((prev) => [...prev, trimmed]);
    }
    setReferenceLinkInput("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const plannedPublishAt = fromJakartaDatetimeLocalValue(plannedPublishLocal);
    const designDueAt = fromJakartaDatetimeLocalValue(designDueLocal);

    if (!isEditMode && !projectId) {
      const msg = "Proyek induk wajib dipilih.";
      setFormError(msg);
      toast.error(msg);
      return;
    }

    if (!creatorId) {
      const msg = "PIC Creator wajib dipilih.";
      setFormError(msg);
      toast.error(msg);
      return;
    }

    if (
      !isEditMode &&
      requiresDesign &&
      designDueAt &&
      plannedPublishAt &&
      new Date(designDueAt).getTime() > new Date(plannedPublishAt).getTime()
    ) {
      const msg =
        "Deadline desain tidak boleh lebih lambat dari jadwal tayang.";
      setFormError(msg);
      toast.error(msg);
      return;
    }

    startTransition(async () => {
      try {
        if (editingItem) {
          const res = await updateContentPlanAction({
            contentItemId: editingItem.id,
            title,
            platform,
            contentFormat,
            contentPillar: contentPillar || null,
            campaignName: campaignName || null,
            caption: caption || null,
            hashtags: parsedHashtags,
            ctaText: ctaText || null,
            creatorId,
            plannedPublishAt,
            requiresDesign,
          });

          if (!res.success) {
            const firstFieldErr = res.error.fieldErrors
              ? Object.values(res.error.fieldErrors).flat()[0]
              : null;
            const errMsg = firstFieldErr ?? res.error.message;
            setFormError(errMsg);
            toast.error(errMsg);
            return;
          }
          toast.success(res.message ?? "Content plan diperbarui.");
          onSuccess?.();
          onOpenChange(false);
          return;
        }

        if (promotingIdea) {
          const res = await convertIdeaToPlanAction({
            ideaId: promotingIdea.id,
            projectId,
            title,
            platform,
            contentFormat,
            contentPillar: contentPillar || null,
            campaignName: campaignName || null,
            caption: caption || null,
            hashtags: parsedHashtags,
            ctaText: ctaText || null,
            creatorId,
            plannedPublishAt,
            requiresDesign,
            designBrief: requiresDesign
              ? {
                  objective:
                    briefObjective.trim() ||
                    caption.trim() ||
                    `Visual desain untuk ${title}`,
                  dimensionsSpec: dimensionsSpec || null,
                  copyText: copyOnDesign || null,
                  brandGuidelinesNotes: brandNotes || null,
                  referenceLinks,
                  assignedDesignerId: assignedDesignerId || null,
                  dueDate: designDueAt,
                }
              : null,
          });

          if (!res.success) {
            const firstFieldErr = res.error.fieldErrors
              ? Object.values(res.error.fieldErrors).flat()[0]
              : null;
            const errMsg = firstFieldErr ?? res.error.message;
            setFormError(errMsg);
            toast.error(errMsg);
            return;
          }
          toast.success(res.message ?? "Ide dipromosikan ke Planner.");
          onSuccess?.();
          onOpenChange(false);
          return;
        }

        const res = await createContentPlanAction({
          projectId,
          title,
          platform,
          contentFormat,
          contentPillar: contentPillar || null,
          campaignName: campaignName || null,
          caption: caption || null,
          hashtags: parsedHashtags,
          ctaText: ctaText || null,
          creatorId,
          plannedPublishAt,
          requiresDesign,
          designBrief: requiresDesign
            ? {
                objective:
                  briefObjective.trim() ||
                  caption.trim() ||
                  `Visual desain untuk ${title}`,
                dimensionsSpec: dimensionsSpec || null,
                copyText: copyOnDesign || null,
                brandGuidelinesNotes: brandNotes || null,
                referenceLinks,
                assignedDesignerId: assignedDesignerId || null,
                dueDate: designDueAt,
              }
            : null,
        });

        if (!res.success) {
          const firstFieldErr = res.error.fieldErrors
            ? Object.values(res.error.fieldErrors).flat()[0]
            : null;
          const errMsg = firstFieldErr ?? res.error.message;
          setFormError(errMsg);
          toast.error(errMsg);
          return;
        }

        toast.success(res.message ?? "Content plan dibuat.");
        onSuccess?.();
        onOpenChange(false);
      } catch {
        const msg = "Gagal menyimpan Content Plan.";
        setFormError(msg);
        toast.error(msg);
      }
    });
  };

  const handleConfirmDelete = async () => {
    if (!editingItem) return;
    setIsDeleting(true);
    try {
      const res = await deleteContentPlanAction({
        contentItemId: editingItem.id,
      });
      if (!res.success) {
        toast.error(res.error.message);
        return;
      }
      toast.success(res.message ?? "Content plan berhasil dihapus.");
      setDeleteDialogOpen(false);
      onSuccess?.();
      onOpenChange(false);
    } catch {
      toast.error("Gagal menghapus Content Plan.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <SheetHeader className="border-b border-border/70 bg-muted/20 px-6 py-4 pr-12">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles className="size-3.5" />
          </div>
          <SheetTitle className="font-heading text-base font-bold">
            {isEditMode
              ? "Edit Content Plan"
              : isPromoteMode
                ? "Promote ke Planner"
                : "Content Plan Baru"}
          </SheetTitle>
          <ChannelPill platform={platform} compact />
          {!isEditMode ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
              Auto-Task
            </span>
          ) : null}
        </div>
      </SheetHeader>

      <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {promotingIdea ? (
            <div className="flex items-center gap-2 rounded-xl border border-indigo-200/80 bg-indigo-500/10 px-3.5 py-2.5 text-xs text-indigo-900 dark:border-indigo-500/30 dark:text-indigo-200">
              <Sparkles className="size-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <span className="truncate font-medium">
                Dari Ide: <strong>{promotingIdea.title}</strong>
              </span>
            </div>
          ) : null}

          {/* Section 01: Core Concept & Channel */}
          <div className="space-y-4">
            <SectionHeading step="01" title="Konsep & Channel" />

            <div className="space-y-1.5">
              <Label htmlFor="cp-title">Judul Konten *</Label>
              <Input
                id="cp-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Carousel 5 Alasan Bisnis Butuh Sistem Terpusat"
                required
                minLength={3}
                maxLength={200}
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Channel *</Label>
              <div className="flex flex-wrap gap-1.5">
                {SOCIAL_PLATFORM_VALUES.map((v) => {
                  const active = platform === v;
                  return (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setPlatform(v)}
                      aria-pressed={active}
                      className={cn(
                        "rounded-full p-0.5 transition-all",
                        active
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                          : "opacity-60 hover:opacity-100"
                      )}
                    >
                      <ChannelPill platform={v} />
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {!isEditMode ? (
                <div className="min-w-0 space-y-1.5 sm:col-span-2">
                  <Label>Proyek *</Label>
                  <Select
                    value={projectId}
                    onValueChange={(val) => {
                      if (val) setProjectId(val);
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
              ) : null}

              <div className="min-w-0 space-y-1.5">
                <Label>Format *</Label>
                <Select
                  value={contentFormat}
                  onValueChange={(val) => {
                    if (val) setContentFormat(val as ContentFormat);
                  }}
                  items={CONTENT_FORMAT_VALUES.map((v) => ({
                    value: v,
                    label: CONTENT_FORMAT_META[v].label,
                  }))}
                >
                  <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                    <SelectValue placeholder="Pilih format" className="block min-w-0 truncate" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_FORMAT_VALUES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {CONTENT_FORMAT_META[v].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-0 space-y-1.5">
                <Label>Pilar</Label>
                <Select
                  value={contentPillar}
                  onValueChange={(val) => {
                    if (val !== null) setContentPillar(val);
                  }}
                  items={CONTENT_PILLAR_OPTIONS.map((p) => ({
                    value: p.value,
                    label: p.label,
                  }))}
                >
                  <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                    <SelectValue placeholder="Pilih pilar" className="block min-w-0 truncate" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONTENT_PILLAR_OPTIONS.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-0 space-y-1.5 sm:col-span-2">
                <Label htmlFor="cp-campaign">Kampanye</Label>
                <Input
                  id="cp-campaign"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="Q4 Brand Awareness"
                  maxLength={150}
                />
              </div>
            </div>
          </div>

          {/* Section 02: Schedule & Copywriting */}
          <div className="space-y-4">
            <SectionHeading step="02" title="Jadwal & Copywriting" />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="min-w-0 space-y-1.5">
                <Label>PIC Creator *</Label>
                <Select
                  value={creatorId}
                  onValueChange={(val) => {
                    if (val) setCreatorId(val);
                  }}
                  items={creatorItems}
                >
                  <SelectTrigger className="w-full min-w-0 overflow-hidden *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                    <SelectValue placeholder="Pilih Creator" className="block min-w-0 truncate" />
                  </SelectTrigger>
                  <SelectContent>
                    {creatorItems.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        <span className="truncate">{c.label}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-0 space-y-1.5">
                <Label
                  htmlFor="cp-publish-at"
                  className="flex items-center gap-1.5"
                >
                  <Calendar className="size-3 text-muted-foreground" />
                  <span>Jadwal Tayang (WIB)</span>
                </Label>
                <Input
                  id="cp-publish-at"
                  type="datetime-local"
                  value={plannedPublishLocal}
                  onChange={(e) => setPlannedPublishLocal(e.target.value)}
                  className="w-full min-w-0 px-2.5 text-xs tabular-nums sm:text-[13px]"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <Label htmlFor="cp-caption">Caption</Label>
                <span
                  className={cn(
                    "font-mono text-[11px]",
                    captionCount > CAPTION_MAX_LENGTH || isOverPlatformHint
                      ? "font-semibold text-destructive"
                      : "text-muted-foreground"
                  )}
                >
                  {captionCount} / {CAPTION_MAX_LENGTH}
                  {platform === "X_TWITTER" ? " (X 280)" : ""}
                </span>
              </div>
              <Textarea
                id="cp-caption"
                rows={4}
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={CAPTION_MAX_LENGTH}
                placeholder="Hook, isi pesan, dan narasi utama..."
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cp-hashtags">Hashtags</Label>
                <Input
                  id="cp-hashtags"
                  value={hashtagsRaw}
                  onChange={(e) => setHashtagsRaw(e.target.value)}
                  placeholder="#krevia #agency"
                />
                {parsedHashtags.length > 0 ? (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {parsedHashtags.slice(0, 6).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-[10px]">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cp-cta">Call-to-Action</Label>
                <Input
                  id="cp-cta"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="Klik link di bio"
                  maxLength={255}
                />
              </div>
            </div>
          </div>

          {/* Section 03: Design Brief */}
          {!isEditMode ? (
            <div className="space-y-4">
              <SectionHeading step="03" title="Design Brief" />

              <div className="space-y-4 rounded-2xl border border-border/70 bg-muted/25 p-4">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <Checkbox
                      id="cp-requires-design"
                      checked={requiresDesign}
                      onCheckedChange={(checked) =>
                        setRequiresDesign(Boolean(checked))
                      }
                      className="after:inset-0"
                    />
                  </div>
                  <label
                    htmlFor="cp-requires-design"
                    className="flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-2"
                  >
                    <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground">
                      <Palette className="size-4 shrink-0 text-primary" />
                      <span className="truncate">Membutuhkan Desain Visual</span>
                    </span>
                    <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      Auto Brief + Task
                    </span>
                  </label>
                </div>

                {requiresDesign ? (
                  <div className="space-y-3 border-t border-border/60 pt-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="min-w-0 space-y-1.5">
                        <Label>Designer</Label>
                        <Select
                          value={assignedDesignerId}
                          onValueChange={(val) => {
                            if (val !== null) setAssignedDesignerId(val);
                          }}
                          items={designerItems}
                        >
                          <SelectTrigger className="w-full min-w-0 overflow-hidden bg-card *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                            <SelectValue placeholder="Pilih Designer" className="block min-w-0 truncate" />
                          </SelectTrigger>
                          <SelectContent>
                            {designerItems.map((d) => (
                              <SelectItem key={d.value} value={d.value}>
                                <span className="truncate">{d.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="min-w-0 space-y-1.5">
                        <Label htmlFor="cp-design-due">
                          Deadline Desain (WIB)
                        </Label>
                        <Input
                          id="cp-design-due"
                          type="datetime-local"
                          value={designDueLocal}
                          onChange={(e) => setDesignDueLocal(e.target.value)}
                          className="w-full min-w-0 bg-card px-2.5 text-xs tabular-nums sm:text-[13px]"
                        />
                      </div>
                    </div>

                    <div className="min-w-0 space-y-1.5">
                      <Label>Dimensi / Rasio</Label>
                      <Select
                        value={dimensionsSpec}
                        onValueChange={(val) => {
                          if (val) setDimensionsSpec(val);
                        }}
                        items={DESIGN_DIMENSIONS_PRESETS.map((p) => ({
                          value: p,
                          label: p,
                        }))}
                      >
                        <SelectTrigger className="w-full min-w-0 overflow-hidden bg-card *:data-[slot=select-value]:block *:data-[slot=select-value]:min-w-0 *:data-[slot=select-value]:truncate">
                          <SelectValue placeholder="Pilih dimensi" className="block min-w-0 truncate" />
                        </SelectTrigger>
                        <SelectContent>
                          {DESIGN_DIMENSIONS_PRESETS.map((preset) => (
                            <SelectItem key={preset} value={preset}>
                              <span className="truncate">{preset}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="cp-brief-obj">Arahan Visual *</Label>
                      <Textarea
                        id="cp-brief-obj"
                        rows={3}
                        value={briefObjective}
                        onChange={(e) => setBriefObjective(e.target.value)}
                        required={requiresDesign}
                        minLength={5}
                        placeholder="Mood visual, jumlah slide, fokus komposisi..."
                        className="bg-card"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="cp-copy-design">Copy on Visual</Label>
                      <Textarea
                        id="cp-copy-design"
                        rows={2}
                        value={copyOnDesign}
                        onChange={(e) => setCopyOnDesign(e.target.value)}
                        placeholder="Slide 1: Headline | Slide 2: Poin..."
                        className="bg-card"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="cp-brand-notes">Brand Notes</Label>
                      <Input
                        id="cp-brand-notes"
                        value={brandNotes}
                        onChange={(e) => setBrandNotes(e.target.value)}
                        placeholder="Navy #0F172A & Accent Blue"
                        className="bg-card"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="cp-ref-link">Moodboard / Link (HTTPS)</Label>
                      <div className="flex gap-2">
                        <Input
                          id="cp-ref-link"
                          type="url"
                          value={referenceLinkInput}
                          onChange={(e) =>
                            setReferenceLinkInput(e.target.value)
                          }
                          placeholder="https://www.figma.com/file/..."
                          className="bg-card"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddReferenceLink}
                        >
                          <Plus className="size-3.5" />
                        </Button>
                      </div>
                      {referenceLinks.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {referenceLinks.map((url) => (
                            <Badge
                              key={url}
                              variant="outline"
                              className="max-w-xs gap-1 bg-card"
                            >
                              <span className="truncate">{url}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setReferenceLinks((prev) =>
                                    prev.filter((u) => u !== url)
                                  )
                                }
                                aria-label="Hapus referensi"
                              >
                                <X className="size-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {formError ? (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2.5 text-xs font-medium text-destructive"
            >
              {formError}
            </div>
          ) : null}
        </div>

        <SheetFooter
          className={cn(
            "border-t border-border/70 bg-background/85 px-6 py-4 backdrop-blur-md sm:flex-row",
            isEditMode && canDelete ? "sm:justify-between" : "sm:justify-end"
          )}
        >
          {isEditMode && editingItem && canDelete ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={isPending || isDeleting}
              className="gap-1.5 border-rose-200 text-destructive hover:bg-rose-50 hover:text-destructive dark:border-rose-500/30 dark:hover:bg-rose-950/50"
            >
              <Trash2 className="size-4" />
              <span>Hapus Plan</span>
            </Button>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending || isDeleting}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isPending || isDeleting}>
              {isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : isEditMode ? (
                "Simpan Perubahan"
              ) : (
                "Simpan & Buat Task"
              )}
            </Button>
          </div>
        </SheetFooter>
      </form>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Hapus Content Plan?"
        description={`Content Plan "${editingItem?.title ?? ""}" akan dihapus. Task produksi terkait akan dilepas sebagai task umum (tidak ikut terhapus), dan Design Brief yang ada tetap tersimpan terpisah.`}
        confirmLabel="Hapus Content Plan"
        variant="destructive"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}

export function ContentPlanFormDrawer({
  open,
  onOpenChange,
  projects,
  creators,
  designers,
  currentUserId,
  editingItem = null,
  promotingIdea = null,
  canDelete = false,
  onSuccess,
}: ContentPlanFormDrawerProps) {
  const formKey = editingItem?.id ?? promotingIdea?.id ?? "new";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 p-0 sm:max-w-[660px]"
      >
        {open ? (
          <ContentPlanFormDrawerBody
            key={formKey}
            onOpenChange={onOpenChange}
            projects={projects}
            creators={creators}
            designers={designers}
            currentUserId={currentUserId}
            editingItem={editingItem}
            promotingIdea={promotingIdea}
            canDelete={canDelete}
            onSuccess={onSuccess}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
