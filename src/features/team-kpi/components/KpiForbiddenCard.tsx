import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface KpiForbiddenCardProps {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}

export function KpiForbiddenCard({
  title = "403 — Akses Ditolak",
  description = "Anda tidak memiliki izin untuk mengakses halaman atau data kinerja ini.",
  backHref = "/",
  backLabel = "Kembali ke Dashboard",
}: KpiForbiddenCardProps) {
  return (
    <div className="mx-auto max-w-lg py-12">
      <Card className="border-destructive/30">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" aria-hidden="true" />
          </div>
          <CardTitle className="text-lg font-bold">{title}</CardTitle>
          <CardDescription className="text-sm">{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Link
            href={backHref}
            className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
          >
            {backLabel}
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
