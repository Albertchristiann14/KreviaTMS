import Link from "next/link";
import { CheckSquare, Home, Layers, SearchX } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="items-center text-center">
          <div className="mb-2 flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Layers className="size-4" />
            </div>
            <span className="text-sm font-bold tracking-tight text-foreground">
              Krevia TMS
            </span>
          </div>

          <Badge variant="outline" className="font-mono text-xs">
            404 · PAGE NOT FOUND
          </Badge>

          <div className="mt-3 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <SearchX className="size-6" />
          </div>

          <CardTitle className="mt-2 text-xl font-bold">
            Halaman Tidak Ditemukan
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            URL atau resource yang Anda tuju tidak tersedia, telah dipindahkan,
            atau Anda tidak memiliki akses ke entitas tersebut.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Home className="size-4" />
            <span>Overview Dashboard</span>
          </Link>
          <Link
            href="/tasks/my-tasks"
            className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <CheckSquare className="size-4" />
            <span>My Tasks</span>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
