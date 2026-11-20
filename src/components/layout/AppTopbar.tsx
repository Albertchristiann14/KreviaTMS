"use client";

import { Fragment, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  ArrowRight,
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search,
  User as UserIcon,
} from "lucide-react";
import { NotificationBellPopover } from "@/components/layout/NotificationBellPopover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useUnreadNotifications } from "@/features/system/hooks/useUnreadNotifications";
import {
  getVisibleNavGroups,
  getVisibleQuickCreateItems,
  ROUTE_BREADCRUMB_LABELS,
} from "@/lib/constants/navigation";
import { useUIStore } from "@/lib/stores/ui-store";

export interface AppTopbarUser {
  id: string;
  fullName: string;
  email: string;
  roleCode: string;
  avatarUrl?: string | null;
}

const ROLE_NAME_MAP: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  PROJECT_MANAGER: "Project Manager",
  STAFF_CREATOR: "Staff / Creator",
  DESIGNER: "Visual Designer",
};

export interface AppTopbarProps {
  user: AppTopbarUser;
  permissions: readonly string[];
}

function getInitials(name: string): string {
  const cleanTokens = (input: string) =>
    input
      .trim()
      .split(/\s+/)
      .map((part) => part.replace(/[^\p{L}\p{N}]/gu, ""))
      .filter(Boolean);

  const withoutParens = name.replace(/\([^)]*\)/g, " ");
  let parts = cleanTokens(withoutParens);
  if (parts.length === 0) {
    parts = cleanTokens(name);
  }
  if (parts.length === 0) return "KT";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function formatGroupName(group: string): string {
  return group.replace(/^Modul [A-Z]:\s*/i, "");
}

const UUID_SEGMENT_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DYNAMIC_SEGMENT_LABELS: Record<string, string> = {
  projects: "Detail Proyek",
  team: "Profil Anggota",
  evaluations: "Detail Evaluasi",
};

function buildBreadcrumbs(
  pathname: string
): Array<{ label: string; href: string }> {
  if (pathname === "/") {
    return [{ label: "Overview", href: "/" }];
  }

  const segments = pathname.split("/").filter(Boolean);
  const crumbs: Array<{ label: string; href: string }> = [];
  let acc = "";

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]!;
    const prevSegment = i > 0 ? segments[i - 1] : undefined;
    acc += `/${segment}`;

    const mapped = ROUTE_BREADCRUMB_LABELS[segment];
    let label = mapped;

    if (!label) {
      if (prevSegment && DYNAMIC_SEGMENT_LABELS[prevSegment]) {
        label = DYNAMIC_SEGMENT_LABELS[prevSegment]!;
      } else if (UUID_SEGMENT_REGEX.test(segment) || segment.length > 20) {
        label = "Detail";
      } else {
        label = segment;
      }
    }

    crumbs.push({ label, href: acc });
  }

  return crumbs;
}

export function AppTopbar({ user, permissions }: AppTopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const { data: unreadData } = useUnreadNotifications();
  const unreadCount = unreadData?.unreadCount ?? 0;

  const [commandOpen, setCommandOpen] = useState(false);
  const [commandSearch, setCommandSearch] = useState("");
  const [isNavigating, startTransition] = useTransition();

  const breadcrumbs = useMemo(() => buildBreadcrumbs(pathname), [pathname]);
  const quickCreateItems = useMemo(
    () => getVisibleQuickCreateItems(user.roleCode, permissions),
    [user.roleCode, permissions]
  );

  const commandEntries = useMemo(() => {
    const groups = getVisibleNavGroups(user.roleCode, permissions, user.id);
    const navItems = groups.flatMap((group) =>
      group.items.map((item) => ({
        id: `nav-${item.id}`,
        group: formatGroupName(group.label),
        label: item.label,
        href: item.href,
      }))
    );

    navItems.push({
      id: "nav-notifications",
      group: "System",
      label: "Notification Center",
      href: "/notifications",
    });

    const quickItems = quickCreateItems.map((item) => ({
      id: `quick-${item.id}`,
      group: "Quick Create",
      label: item.label,
      href: item.href,
    }));

    return [...quickItems, ...navItems];
  }, [user.roleCode, user.id, permissions, quickCreateItems]);

  const filteredCommandEntries = useMemo(() => {
    const q = commandSearch.trim().toLowerCase();
    if (!q) return commandEntries.slice(0, 12);
    return commandEntries.filter((entry) =>
      `${entry.label} ${entry.group} ${entry.href}`.toLowerCase().includes(q)
    );
  }, [commandEntries, commandSearch]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((prev) => !prev);
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "b") {
        event.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [toggleSidebar]);

  const navigateWithTransition = (href: string) => {
    startTransition(() => {
      router.push(href);
    });
  };

  const navigateFromCommand = (href: string) => {
    setCommandOpen(false);
    setCommandSearch("");
    navigateWithTransition(href);
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900 lg:px-6">
        {isNavigating ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-0.5 animate-pulse bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400"
          />
        ) : null}
        {/* Left: Desktop sidebar toggle + Mobile drawer trigger + Crisp Breadcrumbs */}
        <div className="flex min-w-0 items-center gap-2">
          {/* Mobile drawer trigger */}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white lg:hidden"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Buka menu navigasi"
          >
            <Menu className="size-4" />
          </Button>

          {/* Desktop sidebar toggle button */}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="hidden rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white lg:inline-flex"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? "Buka sidebar (Ctrl+B)" : "Tutup sidebar (Ctrl+B)"}
            title={sidebarCollapsed ? "Buka sidebar (Ctrl+B)" : "Tutup sidebar (Ctrl+B)"}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="size-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <PanelLeftClose className="size-4" />
            )}
          </Button>

          <nav
            aria-label="Breadcrumb"
            className="flex min-w-0 items-center gap-1.5 text-sm"
          >
            <Link
              href="/"
              prefetch={true}
              className="hidden text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white sm:inline"
            >
              Krevia
            </Link>
            {breadcrumbs.map((crumb, idx) => {
              const isLast = idx === breadcrumbs.length - 1;
              return (
                <Fragment key={crumb.href}>
                  <span
                    className="hidden text-xs font-medium text-slate-300 select-none dark:text-slate-600 sm:inline"
                    aria-hidden="true"
                  >
                    /
                  </span>
                  {isLast ? (
                    <span className="truncate text-sm font-bold tracking-tight text-slate-900 dark:text-white">
                      {crumb.label}
                    </span>
                  ) : (
                    <Link
                      href={crumb.href}
                      prefetch={true}
                      className="hidden truncate text-xs font-medium text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white sm:inline"
                    >
                      {crumb.label}
                    </Link>
                  )}
                </Fragment>
              );
            })}
          </nav>
        </div>

        {/* Right: ⌘K Search Trigger, Quick Create (+ Buat), Notifications, User Menu */}
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setCommandOpen(true)}
            aria-label="Buka pencarian cepat"
            className="rounded-lg border border-slate-200 bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 md:hidden"
          >
            <Search className="size-4" />
          </Button>

          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            className="hidden h-8.5 w-48 items-center justify-between rounded-lg border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-200 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white md:inline-flex lg:w-56"
          >
            <span className="flex items-center gap-1.5">
              <Search
                className="size-3.5 text-slate-500 dark:text-slate-400"
                aria-hidden="true"
              />
              <span>Cari cepat...</span>
            </span>
            <kbd className="inline-flex h-5 items-center rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-semibold text-slate-600 shadow-2xs dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300">
              ⌘K
            </kbd>
          </button>

          {quickCreateItems.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    size="sm"
                    className="h-8.5 gap-1.5 rounded-lg bg-blue-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-blue-700"
                    aria-label="Quick Create"
                  />
                }
              >
                <Plus className="size-3.5" />
                <span className="hidden sm:inline">Buat</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900"
              >
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="px-2 py-1 text-[10.5px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                    Quick Create
                  </DropdownMenuLabel>
                  {quickCreateItems.map((item) => (
                    <DropdownMenuItem
                      key={item.id}
                      onClick={() => navigateWithTransition(item.href)}
                      className="rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-700 focus:bg-blue-50 focus:text-blue-700 dark:text-slate-200 dark:focus:bg-slate-800 dark:focus:text-white"
                    >
                      <Plus className="size-3.5 text-blue-600 dark:text-blue-400" />
                      <span>{item.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}

          <div className="relative flex items-center [&_button[aria-label='Notifikasi']]:size-8.5 [&_button[aria-label='Notifikasi']]:rounded-lg [&_button[aria-label='Notifikasi']]:border [&_button[aria-label='Notifikasi']]:border-slate-200 [&_button[aria-label='Notifikasi']]:bg-white [&_button[aria-label='Notifikasi']]:text-slate-600 [&_button[aria-label='Notifikasi']]:hover:bg-slate-100 [&_button[aria-label='Notifikasi']]:hover:text-slate-900 dark:[&_button[aria-label='Notifikasi']]:border-slate-700 dark:[&_button[aria-label='Notifikasi']]:bg-slate-800 dark:[&_button[aria-label='Notifikasi']]:text-slate-300 dark:[&_button[aria-label='Notifikasi']]:hover:bg-slate-700 [&_[data-slot='badge']]:-top-1 [&_[data-slot='badge']]:-right-1 [&_[data-slot='badge']]:h-4 [&_[data-slot='badge']]:min-w-4 [&_[data-slot='badge']]:bg-blue-600 [&_[data-slot='badge']]:px-1 [&_[data-slot='badge']]:text-[9.5px] [&_[data-slot='badge']]:font-bold [&_[data-slot='badge']]:text-white [&_[data-slot='badge']]:ring-2 [&_[data-slot='badge']]:ring-white dark:[&_[data-slot='badge']]:ring-slate-900">
            {unreadCount > 0 ? (
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-0.5 -right-0.5 size-3 animate-ping rounded-full bg-blue-500/45"
              />
            ) : null}
            <NotificationBellPopover />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  className="h-8.5 gap-2 rounded-full border border-slate-200 bg-white pr-3 pl-1 text-slate-900 shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-slate-600 dark:hover:bg-slate-700/80"
                  aria-label="Menu akun pengguna"
                />
              }
            >
              <Avatar
                size="sm"
                className="ring-1 ring-slate-200 dark:ring-slate-700"
              >
                {user.avatarUrl ? (
                  <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                ) : null}
                <AvatarFallback className="bg-blue-600 text-[10px] font-bold text-white">
                  {getInitials(user.fullName)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden max-w-28 truncate text-xs font-semibold text-slate-800 dark:text-slate-100 sm:inline">
                {user.fullName}
              </span>
              <ChevronDown
                className="hidden size-3.5 text-slate-500 dark:text-slate-400 sm:inline"
                aria-hidden="true"
              />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              align="end"
              className="w-60 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="space-y-1.5 px-2 py-2">
                  <p className="truncate text-xs font-bold text-slate-900 dark:text-white">
                    {user.fullName}
                  </p>
                  <p className="truncate text-[11px] font-medium text-slate-600 dark:text-slate-400">
                    {user.email}
                  </p>
                  <Badge
                    variant="outline"
                    className="border-blue-200 bg-blue-50 text-[10px] font-semibold text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-300"
                  >
                    {ROLE_NAME_MAP[user.roleCode] ?? user.roleCode}
                  </Badge>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800" />
              <DropdownMenuItem
                onClick={() => navigateWithTransition(`/team/${user.id}`)}
                className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-700 focus:bg-slate-100 focus:text-slate-900 dark:text-slate-200 dark:focus:bg-slate-800 dark:focus:text-white"
              >
                <UserIcon className="size-3.5 text-slate-500 dark:text-slate-400" />
                <span>Profil & Performa</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigateWithTransition("/notifications")}
                className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-700 focus:bg-slate-100 focus:text-slate-900 dark:text-slate-200 dark:focus:bg-slate-800 dark:focus:text-white"
              >
                <Bell className="size-3.5 text-slate-500 dark:text-slate-400" />
                <span>Pusat Notifikasi</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-slate-200 dark:bg-slate-800" />
              <DropdownMenuItem
                variant="destructive"
                onClick={() => void signOut({ redirectTo: "/login" })}
                className="rounded-lg px-2 py-1.5 text-xs font-semibold"
              >
                <LogOut className="size-3.5" />
                <span>Keluar</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Dialog
        open={commandOpen}
        onOpenChange={(open) => {
          setCommandOpen(open);
          if (!open) setCommandSearch("");
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="gap-0 overflow-hidden border border-slate-200 bg-white p-0 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:max-w-lg"
        >
          <DialogTitle className="sr-only">Navigasi Cepat Krevia</DialogTitle>
          <DialogDescription className="sr-only">
            Cari halaman atau aksi cepat
          </DialogDescription>

          <div className="flex items-center gap-2.5 border-b border-slate-200 px-3.5 py-2.5 dark:border-slate-800">
            <Search
              className="size-4 shrink-0 text-slate-500 dark:text-slate-400"
              aria-hidden="true"
            />
            <Input
              autoFocus
              value={commandSearch}
              onChange={(e) => setCommandSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && filteredCommandEntries[0]) {
                  e.preventDefault();
                  navigateFromCommand(filteredCommandEntries[0].href);
                }
              }}
              placeholder="Cari halaman atau aksi cepat..."
              className="h-8 border-0 bg-transparent px-0 text-sm font-medium text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:ring-0 dark:bg-transparent dark:text-white dark:placeholder:text-slate-500"
            />
            <kbd className="hidden shrink-0 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 sm:inline">
              ESC
            </kbd>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {filteredCommandEntries.length === 0 ? (
              <p className="py-10 text-center text-xs font-medium text-slate-600 dark:text-slate-400">
                Tidak ada hasil untuk &ldquo;{commandSearch}&rdquo;
              </p>
            ) : (
              <ul className="space-y-0.5">
                {filteredCommandEntries.map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      onClick={() => navigateFromCommand(entry.href)}
                      className="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-xs transition-colors hover:bg-blue-50 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-white"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 dark:text-white">
                          {entry.label}
                        </p>
                        <p className="truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                          {entry.group} ·{" "}
                          <span className="font-mono text-[10.5px]">
                            {entry.href}
                          </span>
                        </p>
                      </div>
                      <ArrowRight className="size-3.5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
