"use client";

import dynamic from "next/dynamic";

export const GlobalSlideOverHost = dynamic(
  () =>
    import("@/components/layout/GlobalSlideOverHost").then(
      (mod) => mod.GlobalSlideOverHost
    ),
  { ssr: false }
);
