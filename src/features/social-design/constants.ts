import type {
  AssetCategory,
  AssetSourceType,
  ContentFormat,
  ContentIdeaStatus,
  SocialPlatform,
} from "@prisma/client";

export const SOCIAL_PLATFORM_VALUES = [
  "INSTAGRAM",
  "TIKTOK",
  "LINKEDIN",
  "YOUTUBE",
  "X_TWITTER",
  "FACEBOOK",
  "WEBSITE_BLOG",
] as const satisfies readonly SocialPlatform[];

export const CONTENT_FORMAT_VALUES = [
  "REELS",
  "CAROUSEL",
  "SINGLE_POST",
  "STORY",
  "SHORT_VIDEO",
  "LONG_VIDEO",
  "ARTICLE",
  "INFOGRAPHIC",
] as const satisfies readonly ContentFormat[];

export const ASSET_CATEGORY_VALUES = [
  "BRAND_KIT",
  "SOCIAL_MEDIA",
  "CAMPAIGN",
  "TEMPLATE",
  "PHOTO_VIDEO",
  "DOCUMENT",
  "OTHER",
] as const satisfies readonly AssetCategory[];

export const ASSET_SOURCE_TYPE_VALUES = [
  "UPLOAD",
  "FIGMA",
  "CANVA",
  "GOOGLE_DRIVE",
  "OTHER_LINK",
] as const satisfies readonly AssetSourceType[];

export const CONTENT_PILLAR_OPTIONS = [
  { value: "EDUCATIONAL", label: "Educational" },
  { value: "PROMOTIONAL", label: "Promotional" },
  { value: "ENGAGEMENT", label: "Engagement" },
  { value: "BRAND_STORY", label: "Brand Story" },
  { value: "TESTIMONIAL", label: "Testimonial" },
] as const;

export const SOCIAL_PLATFORM_META: Record<
  SocialPlatform,
  {
    label: string;
    shortLabel: string;
    badgeClass: string;
    recommendedCaptionMax: number;
    chartColor: string;
  }
> = {
  INSTAGRAM: {
    label: "Instagram",
    shortLabel: "IG",
    badgeClass: "bg-pink-50 text-pink-700 border-pink-200",
    recommendedCaptionMax: 2200,
    chartColor: "#ec4899",
  },
  TIKTOK: {
    label: "TikTok",
    shortLabel: "TT",
    badgeClass: "bg-slate-900 text-white border-slate-800",
    recommendedCaptionMax: 2200,
    chartColor: "#0f172a",
  },
  LINKEDIN: {
    label: "LinkedIn",
    shortLabel: "IN",
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    recommendedCaptionMax: 2200,
    chartColor: "#0284c7",
  },
  YOUTUBE: {
    label: "YouTube",
    shortLabel: "YT",
    badgeClass: "bg-red-50 text-red-700 border-red-200",
    recommendedCaptionMax: 2200,
    chartColor: "#dc2626",
  },
  X_TWITTER: {
    label: "X (Twitter)",
    shortLabel: "X",
    badgeClass: "bg-zinc-100 text-zinc-800 border-zinc-300",
    recommendedCaptionMax: 280,
    chartColor: "#52525b",
  },
  FACEBOOK: {
    label: "Facebook",
    shortLabel: "FB",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
    recommendedCaptionMax: 2200,
    chartColor: "#2563eb",
  },
  WEBSITE_BLOG: {
    label: "Website / Blog",
    shortLabel: "WEB",
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    recommendedCaptionMax: 2200,
    chartColor: "#10b981",
  },
};

export const CONTENT_FORMAT_META: Record<ContentFormat, { label: string }> = {
  REELS: { label: "Reels" },
  CAROUSEL: { label: "Carousel" },
  SINGLE_POST: { label: "Single Post" },
  STORY: { label: "Story" },
  SHORT_VIDEO: { label: "Short Video" },
  LONG_VIDEO: { label: "Long Video" },
  ARTICLE: { label: "Article / Blog" },
  INFOGRAPHIC: { label: "Infographic" },
};

export const CONTENT_IDEA_STATUS_META: Record<
  ContentIdeaStatus,
  { label: string; className: string }
> = {
  IDEA: {
    label: "Menunggu Kurasi",
    className: "bg-violet-100 text-violet-700 border-violet-200",
  },
  APPROVED_IDEA: {
    label: "Disetujui",
    className: "bg-indigo-100 text-indigo-700 border-indigo-200",
  },
  CONVERTED: {
    label: "Sudah di Planner",
    className: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  ARCHIVED: {
    label: "Diarsipkan / Ditolak",
    className: "bg-slate-100 text-slate-600 border-slate-200",
  },
};

export const ASSET_CATEGORY_META: Record<
  AssetCategory,
  { label: string; badgeClass: string }
> = {
  BRAND_KIT: {
    label: "Brand Kit",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200",
  },
  SOCIAL_MEDIA: {
    label: "Social Media",
    badgeClass: "bg-pink-50 text-pink-700 border-pink-200",
  },
  CAMPAIGN: {
    label: "Campaign",
    badgeClass: "bg-violet-50 text-violet-700 border-violet-200",
  },
  TEMPLATE: {
    label: "Template",
    badgeClass: "bg-amber-50 text-amber-800 border-amber-200",
  },
  PHOTO_VIDEO: {
    label: "Photo & Video",
    badgeClass: "bg-cyan-50 text-cyan-700 border-cyan-200",
  },
  DOCUMENT: {
    label: "Document",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
  },
  OTHER: {
    label: "Lainnya",
    badgeClass: "bg-zinc-100 text-zinc-700 border-zinc-200",
  },
};

export const ASSET_SOURCE_TYPE_META: Record<
  AssetSourceType,
  { label: string; isExternal: boolean }
> = {
  UPLOAD: { label: "Direct Upload", isExternal: false },
  FIGMA: { label: "Figma", isExternal: true },
  CANVA: { label: "Canva", isExternal: true },
  GOOGLE_DRIVE: { label: "Google Drive", isExternal: true },
  OTHER_LINK: { label: "External Link", isExternal: true },
};

export const DESIGN_DIMENSIONS_PRESETS = [
  "1080x1350 px (4:5 Portrait IG)",
  "1080x1920 px (9:16 Reels/Story/TikTok)",
  "1080x1080 px (1:1 Square)",
  "1920x1080 px (16:9 YouTube/Presentation)",
  "1200x628 px (Link/LinkedIn Banner)",
] as const;

export const CAPTION_MAX_LENGTH = 2200;

export function getPillarLabel(pillar: string | null | undefined): string {
  if (!pillar) return "Tanpa Pilar";
  const found = CONTENT_PILLAR_OPTIONS.find((opt) => opt.value === pillar);
  return found ? found.label : pillar;
}
