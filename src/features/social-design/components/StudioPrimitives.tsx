"use client";

import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  AssetSourceType,
  ContentFormat,
  SocialPlatform,
} from "@prisma/client";
import {
  AlertTriangle,
  Film,
  FileText,
  Globe,
  Layers,
  Link2,
  Palette,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchSignedDownloadUrl } from "@/features/social-design/components/SignedMediaPreview";
import {
  ASSET_SOURCE_TYPE_META,
  CONTENT_FORMAT_META,
  SOCIAL_PLATFORM_META,
} from "@/features/social-design/constants";
import { isImageMime } from "@/features/social-design/utils";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Channel Styling & Visual Badges                                           */
/* -------------------------------------------------------------------------- */

export interface ChannelVisualStyle {
  pillClass: string;
  chipClass: string;
  accentBarClass: string;
  dotClass: string;
  iconBgClass: string;
}

export const CHANNEL_VISUAL_STYLE: Record<SocialPlatform, ChannelVisualStyle> = {
  INSTAGRAM: {
    pillClass:
      "border-rose-200/80 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 text-rose-700 dark:border-rose-500/30 dark:from-amber-500/15 dark:via-rose-500/15 dark:to-purple-500/15 dark:text-rose-300",
    chipClass:
      "border-l-rose-500 bg-rose-500/[0.06] hover:bg-rose-500/[0.12] dark:bg-rose-500/10 dark:hover:bg-rose-500/20",
    accentBarClass: "from-amber-400 via-rose-500 to-purple-600",
    dotClass: "bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600",
    iconBgClass: "bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white",
  },
  TIKTOK: {
    pillClass:
      "border-zinc-800 bg-zinc-950 text-white dark:border-cyan-500/40 dark:bg-zinc-900 dark:text-cyan-50",
    chipClass:
      "border-l-cyan-500 bg-zinc-950/[0.05] hover:bg-zinc-950/[0.10] dark:bg-cyan-500/10 dark:hover:bg-cyan-500/20",
    accentBarClass: "from-cyan-400 via-zinc-900 to-rose-500",
    dotClass: "bg-cyan-400",
    iconBgClass: "bg-zinc-950 text-cyan-400 ring-1 ring-cyan-400/40",
  },
  YOUTUBE: {
    pillClass:
      "border-red-200/80 bg-red-500/10 text-red-700 dark:border-red-500/30 dark:bg-red-500/15 dark:text-red-300",
    chipClass:
      "border-l-red-500 bg-red-500/[0.06] hover:bg-red-500/[0.12] dark:bg-red-500/10 dark:hover:bg-red-500/20",
    accentBarClass: "from-red-500 to-rose-600",
    dotClass: "bg-red-500",
    iconBgClass: "bg-red-600 text-white",
  },
  LINKEDIN: {
    pillClass:
      "border-blue-200/80 bg-blue-500/10 text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300",
    chipClass:
      "border-l-blue-600 bg-blue-500/[0.06] hover:bg-blue-500/[0.12] dark:bg-blue-500/10 dark:hover:bg-blue-500/20",
    accentBarClass: "from-blue-600 to-sky-500",
    dotClass: "bg-blue-600",
    iconBgClass: "bg-blue-600 text-white",
  },
  X_TWITTER: {
    pillClass:
      "border-zinc-300/80 bg-zinc-900/[0.06] text-zinc-800 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200",
    chipClass:
      "border-l-zinc-700 bg-zinc-500/[0.06] hover:bg-zinc-500/[0.12] dark:border-l-zinc-400 dark:bg-zinc-800/60 dark:hover:bg-zinc-800",
    accentBarClass: "from-zinc-700 to-zinc-950",
    dotClass: "bg-zinc-800 dark:bg-zinc-300",
    iconBgClass: "bg-zinc-900 text-white",
  },
  FACEBOOK: {
    pillClass:
      "border-indigo-200/80 bg-indigo-500/10 text-indigo-700 dark:border-indigo-500/30 dark:bg-indigo-500/15 dark:text-indigo-300",
    chipClass:
      "border-l-indigo-500 bg-indigo-500/[0.06] hover:bg-indigo-500/[0.12] dark:bg-indigo-500/10 dark:hover:bg-indigo-500/20",
    accentBarClass: "from-indigo-600 to-blue-500",
    dotClass: "bg-indigo-600",
    iconBgClass: "bg-indigo-600 text-white",
  },
  WEBSITE_BLOG: {
    pillClass:
      "border-emerald-200/80 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-300",
    chipClass:
      "border-l-emerald-500 bg-emerald-500/[0.06] hover:bg-emerald-500/[0.12] dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20",
    accentBarClass: "from-emerald-500 to-teal-500",
    dotClass: "bg-emerald-500",
    iconBgClass: "bg-emerald-600 text-white",
  },
};

function ChannelGlyph({
  platform,
  className,
}: {
  platform: SocialPlatform;
  className?: string;
}) {
  switch (platform) {
    case "INSTAGRAM":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
          <rect
            x="2.2"
            y="2.2"
            width="11.6"
            height="11.6"
            rx="3.4"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <circle cx="8" cy="8" r="2.6" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="11.3" cy="4.7" r="0.8" fill="currentColor" />
        </svg>
      );
    case "TIKTOK":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
          <path
            d="M9.6 2.2v7.1a2.6 2.6 0 1 1-2.1-2.55v1.8a.9.9 0 1 0 .5.8V2.2h1.6c.2 1.5 1.3 2.7 2.9 2.9v1.7a4.6 4.6 0 0 1-2.9-1.1Z"
            fill="currentColor"
          />
        </svg>
      );
    case "YOUTUBE":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
          <path
            d="M6.4 5.2 11 8l-4.6 2.8V5.2Z"
            fill="currentColor"
          />
        </svg>
      );
    case "LINKEDIN":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
          <path
            d="M4.3 6.2v6.1M4.3 3.8v.2M7.2 12.3V6.2m0 2c0-1.2.9-2 2-2 1.2 0 1.9.8 1.9 2.1v4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "X_TWITTER":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
          <path
            d="M3.2 3.2 12.8 12.8M12.8 3.2 3.2 12.8"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
        </svg>
      );
    case "FACEBOOK":
      return (
        <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
          <path
            d="M9.4 13.5V8.6h1.7l.3-2h-2V5.4c0-.6.2-1 1-1h1.1V2.6c-.2 0-.9-.1-1.6-.1-1.6 0-2.6 1-2.6 2.7v1.4H5.7v2h1.6v4.9h2.1Z"
            fill="currentColor"
          />
        </svg>
      );
    case "WEBSITE_BLOG":
      return <Globe className={className} aria-hidden="true" />;
  }
}

export function ChannelPill({
  platform,
  compact = false,
  className,
}: {
  platform: SocialPlatform;
  compact?: boolean;
  className?: string;
}) {
  const meta = SOCIAL_PLATFORM_META[platform];
  const style = CHANNEL_VISUAL_STYLE[platform];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-tight whitespace-nowrap transition-colors",
        compact && "px-1.5 py-0 text-[10px]",
        style.pillClass,
        className
      )}
    >
      <span
        className={cn(
          "inline-flex size-3.5 shrink-0 items-center justify-center rounded-full",
          compact && "size-3",
          style.iconBgClass
        )}
      >
        <ChannelGlyph platform={platform} className={compact ? "size-2" : "size-2.5"} />
      </span>
      <span>{compact ? meta.shortLabel : meta.label}</span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Creative Member Avatar                                                    */
/* -------------------------------------------------------------------------- */

const AVATAR_TONES = [
  "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  "bg-rose-500/15 text-rose-700 dark:text-rose-300",
  "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300",
] as const;

function getInitials(name: string): string {
  const cleaned = name.replace(/\([^)]*\)/g, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  const first = parts[0];
  const last = parts[parts.length - 1];
  if (!first) return "KT";
  if (parts.length === 1 || !last) return first.slice(0, 2).toUpperCase();
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

function getToneClass(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return AVATAR_TONES[hash % AVATAR_TONES.length] ?? AVATAR_TONES[0];
}

export function CreativeAvatar({
  name,
  avatarUrl,
  size = "sm",
  className,
}: {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  return (
    <Avatar size={size} className={cn("ring-1 ring-border/70", className)}>
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={name} /> : null}
      <AvatarFallback className={cn("text-[10px] font-semibold", getToneClass(name))}>
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

/* -------------------------------------------------------------------------- */
/*  Design Artboard Dimensions & Preview Stage                                */
/* -------------------------------------------------------------------------- */

export interface ParsedDimensionInfo {
  pxLabel: string;
  ratioLabel: string | null;
  frameClass: string;
}

export function parseDimensionSpec(
  spec: string | null | undefined
): ParsedDimensionInfo {
  if (!spec) {
    return {
      pxLabel: "Custom",
      ratioLabel: null,
      frameClass: "aspect-[4/5] w-20",
    };
  }
  const pxMatch = /(\d{3,4})\s*[x×]\s*(\d{3,4})/i.exec(spec);
  const ratioMatch = /\((\d+(?:\.\d+)?:\d+)/.exec(spec);
  const pxLabel = pxMatch ? `${pxMatch[1]}×${pxMatch[2]}` : spec.slice(0, 18);
  const ratioLabel = ratioMatch?.[1] ?? null;

  let frameClass = "aspect-[4/5] w-20";
  if (pxMatch) {
    const w = Number(pxMatch[1]);
    const h = Number(pxMatch[2]);
    if (w > h * 1.3) {
      frameClass = "aspect-video w-36";
    } else if (h > w * 1.55) {
      frameClass = "aspect-[9/16] w-16";
    } else if (Math.abs(w - h) < 80) {
      frameClass = "aspect-square w-24";
    }
  }

  return { pxLabel, ratioLabel, frameClass };
}

export interface DesignArtboardThumbProps {
  title: string;
  projectCode: string;
  projectColorHex?: string;
  platform?: SocialPlatform | null;
  contentFormat?: ContentFormat | null;
  dimensionsSpec?: string | null;
  versionNumber: number;
  revisionCount: number;
  latestSubmission?: {
    sourceType: AssetSourceType;
    fileUrl: string;
    storageKey: string | null;
    mimeType: string | null;
  } | null;
  overlayRight?: ReactNode;
  className?: string;
}

export function DesignArtboardThumb({
  title,
  projectCode,
  projectColorHex = "#2563eb",
  platform,
  contentFormat,
  dimensionsSpec,
  versionNumber,
  revisionCount,
  latestSubmission,
  overlayRight,
  className,
}: DesignArtboardThumbProps) {
  const isImageUpload = Boolean(
    latestSubmission &&
      latestSubmission.sourceType === "UPLOAD" &&
      latestSubmission.storageKey &&
      isImageMime(latestSubmission.mimeType)
  );

  const previewQuery = useQuery({
    queryKey: [
      "social-design",
      "signed-preview",
      latestSubmission?.storageKey ?? "",
    ],
    enabled: isImageUpload,
    queryFn: async () =>
      fetchSignedDownloadUrl(latestSubmission!.storageKey!, false),
    staleTime: 5 * 60_000,
    retry: 1,
  });

  const signedUrl = previewQuery.data?.downloadUrl ?? null;
  const dim = parseDimensionSpec(dimensionsSpec);
  const sourceLabel = latestSubmission
    ? ASSET_SOURCE_TYPE_META[latestSubmission.sourceType].label
    : null;

  return (
    <div
      className={cn(
        "group/art relative aspect-[16/10] w-full overflow-hidden rounded-t-xl border-b border-border/60 bg-muted/40",
        className
      )}
    >
      {/* Subtle studio dot grid backdrop */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "radial-gradient(color-mix(in oklch, var(--foreground) 14%, transparent) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />

      {signedUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={signedUrl}
          alt={title}
          className="relative z-10 size-full object-cover transition-transform duration-300 group-hover/art:scale-[1.03]"
        />
      ) : (
        <div className="relative z-10 flex size-full items-center justify-center p-4">
          {/* Proportional Miniature Artboard Frame */}
          <div
            className={cn(
              "relative flex flex-col justify-between overflow-hidden rounded-lg border border-border/80 bg-card p-2.5 shadow-sm transition-transform duration-300 group-hover/art:scale-[1.03]",
              dim.frameClass
            )}
          >
            <div
              className="absolute inset-x-0 top-0 h-1"
              style={{ backgroundColor: projectColorHex }}
            />

            <div className="flex items-center justify-between gap-1 pt-0.5">
              <span className="truncate font-mono text-[8px] font-semibold text-muted-foreground">
                {projectCode}
              </span>
              {platform ? (
                <span
                  className={cn(
                    "size-2 shrink-0 rounded-full",
                    CHANNEL_VISUAL_STYLE[platform].dotClass
                  )}
                />
              ) : null}
            </div>

            <div className="my-auto flex flex-col items-center gap-1 text-center">
              {latestSubmission ? (
                latestSubmission.sourceType !== "UPLOAD" ? (
                  <Link2 className="size-4 text-primary" />
                ) : latestSubmission.mimeType === "video/mp4" ? (
                  <Film className="size-4 text-primary" />
                ) : latestSubmission.mimeType === "application/pdf" ? (
                  <FileText className="size-4 text-primary" />
                ) : (
                  <Layers className="size-4 text-primary" />
                )
              ) : (
                <Palette className="size-4 text-muted-foreground/70" />
              )}
              {sourceLabel ? (
                <span className="rounded bg-muted px-1 py-0.5 text-[8px] font-medium text-foreground">
                  {sourceLabel}
                </span>
              ) : contentFormat ? (
                <span className="text-[8px] font-medium text-muted-foreground">
                  {CONTENT_FORMAT_META[contentFormat].label}
                </span>
              ) : null}
            </div>

            <div className="flex items-center justify-center">
              <span className="font-mono text-[8px] text-muted-foreground">
                {dim.ratioLabel ?? dim.pxLabel}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Subtle bottom gradient scrim for contrast */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-10 bg-gradient-to-t from-black/20 to-transparent" />

      {/* Top-left Version Pill */}
      <div className="absolute top-2.5 left-2.5 z-20 flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 rounded-full bg-zinc-950/80 px-2 py-0.5 font-mono text-[10px] font-semibold text-white shadow-xs backdrop-blur-md">
          {versionNumber > 0 ? `v${versionNumber}` : "Draft"}
        </span>
        {revisionCount >= 3 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/95 px-2 py-0.5 text-[10px] font-semibold text-white shadow-xs backdrop-blur-md">
            <AlertTriangle className="size-2.5" />
            <span>{revisionCount}× Rev</span>
          </span>
        ) : null}
      </div>

      {/* Top-right Dimension Badge / Custom Overlay */}
      <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1.5">
        {dimensionsSpec ? (
          <span className="rounded-full bg-background/85 px-2 py-0.5 font-mono text-[10px] font-medium text-foreground ring-1 ring-border/70 backdrop-blur-md">
            {dim.pxLabel}
          </span>
        ) : null}
        {overlayRight}
      </div>

      {/* Bottom-left Format / Platform Accent */}
      {(platform || contentFormat) ? (
        <div className="absolute bottom-2.5 left-2.5 z-20 flex items-center gap-1.5">
          {platform ? <ChannelPill platform={platform} compact /> : null}
          {contentFormat ? (
            <span className="rounded-full bg-background/85 px-2 py-0.5 text-[10px] font-medium text-foreground ring-1 ring-border/70 backdrop-blur-md">
              {CONTENT_FORMAT_META[contentFormat].label}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Compact Studio Header Bar (Punchy, Zero AI-Slop Paragraphs)               */
/* -------------------------------------------------------------------------- */

export function StudioPageHeader({
  title,
  count,
  countLabel,
  icon,
  actions,
}: {
  title: string;
  count?: number;
  countLabel?: string;
  icon?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {icon ? (
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15">
            {icon}
          </div>
        ) : (
          <Sparkles className="size-5 text-primary" />
        )}
        <h1 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        {count != null ? (
          <span className="rounded-full bg-muted px-2.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
            {count}
            {countLabel ? ` ${countLabel}` : ""}
          </span>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}
