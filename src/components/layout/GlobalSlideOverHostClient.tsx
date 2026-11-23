"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useUIStore } from "@/lib/stores/ui-store";

const LazyGlobalSlideOverHost = dynamic(
  () =>
    import("@/components/layout/GlobalSlideOverHost").then(
      (mod) => mod.GlobalSlideOverHost
    ),
  { ssr: false }
);

export function GlobalSlideOverHost() {
  const activeDrawer = useUIStore((s) => s.activeDrawer);
  const searchParams = useSearchParams();
  const hasDrawerParam = Boolean(
    searchParams.get("drawer") && searchParams.get("id")
  );

  if (!activeDrawer && !hasDrawerParam) {
    return null;
  }

  return <LazyGlobalSlideOverHost />;
}
