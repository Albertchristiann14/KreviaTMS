"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function GlobalAppError({
  error,
  retry,
  reset,
}: {
  error: unknown;
  retry?: () => void;
  reset?: () => void;
}) {
  useEffect(() => {
    console.error("[KTMS_APP_ERROR_BOUNDARY]", error);
  }, [error]);

  const digest =
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: unknown }).digest === "string"
      ? (error as { digest: string }).digest
      : null;

  const handleRecover = () => {
    if (retry) {
      retry();
    } else if (reset) {
      reset();
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md border-destructive/30 shadow-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-6" />
          </div>
          <CardTitle className="text-xl font-bold">
            Terjadi Gangguan Sistem
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            Maaf, halaman mengalami kendala tak terduga saat memuat data. Silakan
            muat ulang segmen atau kembali ke Overview Dashboard.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {digest ? (
            <div className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-center font-mono text-[11px] text-muted-foreground">
              Reference ID: {digest}
            </div>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              className="flex-1"
              onClick={handleRecover}
            >
              <RotateCcw className="size-4" />
              <span>Coba Lagi</span>
            </Button>
            <Link
              href="/"
              className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Home className="size-4" />
              <span>Ke Dashboard</span>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
