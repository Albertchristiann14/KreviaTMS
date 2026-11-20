"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Award,
  BarChart3,
  CalendarDays,
  CalendarRange,
  CheckSquare,
  ClipboardCheck,
  Columns3,
  FileSpreadsheet,
  FolderKanban,
  Images,
  Layers,
  LayoutDashboard,
  Lightbulb,
  Megaphone,
  NotebookPen,
  Palette,
  PanelLeftClose,
  PanelLeftOpen,
  ScrollText,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  UserCheck,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getVisibleNavGroups,
  type NavIconKey,
  type ResolvedNavGroup,
} from "@/lib/constants/navigation";
import { useUIStore } from "@/lib/stores/ui-store";
import { cn } from "@/lib/utils";

const NAV_ICON_MAP: Record<NavIconKey, LucideIcon> = {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Columns3,
  CalendarDays,
  CalendarRange,
  Lightbulb,
  NotebookPen,
  Palette,
  ClipboardCheck,
  Images,
  BarChart3,
  Users,
  UserCheck,
  TrendingUp,
  SlidersHorizontal,
  Award,
  FileSpreadsheet,
  Megaphone,
  UserCog,
  ShieldCheck,
  ScrollText,
};

export interface AppSidebarUser {
  id: string;
  fullName: string;
  roleCode: string;
}

export const ROLE_NAME_MAP: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  PROJECT_MANAGER: "Project Manager",
  STAFF_CREATOR: "Staff / Creator",
  DESIGNER: "Visual Designer",
};

interface AppSidebarProps {
  user: AppSidebarUser;
  permissions: readonly string[];
}

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/") {
    return pathname === "/";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

function formatGroupLabel(label: string): string {
  return label.replace(/^Modul [A-Z]:\s*/i, "");
}

function getInitials(name: string): string {
  const clean = name.replace(/[()[\]{}_.,/\\-]/g, " ").trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "KS";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

function BrandMark({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 text-white shadow-md shadow-blue-500/30 ring-1 ring-white/20",
        size === "sm" ? "size-7 rounded-lg" : "size-8"
      )}
    >
      <Layers className={size === "sm" ? "size-3.5" : "size-4"} />
    </span>
  );
}

function SidebarNavContent({
  groups,
  collapsed,
  pathname,
  pendingHref,
  onSelectHref,
  onNavigate,
}: {
  groups: ResolvedNavGroup[];
  collapsed: boolean;
  pathname: string;
  pendingHref: string | null;
  onSelectHref: (href: string) => void;
  onNavigate?: () => void;
}) {
  return (
    <nav
      aria-label="Navigasi utama Krevia Studio"
      className={cn(
        "flex-1 overflow-y-auto px-2.5 py-2",
        collapsed ? "space-y-2.5 py-3" : "space-y-1.5"
      )}
    >
      {groups.map((group, groupIndex) => (
        <div key={group.id} className="space-y-1">
          {!collapsed ? (
            <p className="px-3 pt-3 pb-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              {formatGroupLabel(group.label)}
            </p>
          ) : groupIndex > 0 ? (
            <div className="mx-auto my-2 h-px w-6 bg-slate-800" />
          ) : null}

          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = NAV_ICON_MAP[item.icon];
              const active = isNavItemActive(pathname, item.href);
              const isPending = pendingHref === item.href;

              const linkElement = (
                <Link
                  href={item.href}
                  prefetch={true}
                  onClick={() => {
                    onSelectHref(item.href);
                    onNavigate?.();
                  }}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-all duration-100 active:scale-[0.98]",
                    collapsed && "mx-auto size-9 justify-center px-0",
                    active
                      ? "bg-blue-600 font-semibold text-white shadow-md shadow-blue-500/20 ring-1 ring-blue-400/30"
                      : "font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-transform duration-150 group-hover:scale-105",
                      active
                        ? "text-white"
                        : "text-slate-400 group-hover:text-white"
                    )}
                    aria-hidden="true"
                  />
                  {!collapsed ? (
                    <>
                      <span className="truncate">{item.label}</span>
                      {active ? (
                        <span
                          aria-hidden="true"
                          className={cn(
                            "ml-auto size-1.5 shrink-0 rounded-full bg-sky-200 shadow-[0_0_8px_2px_rgba(186,230,253,0.85)]",
                            isPending && "animate-pulse"
                          )}
                        />
                      ) : null}
                    </>
                  ) : active ? (
                    <span
                      aria-hidden="true"
                      className={cn(
                        "absolute top-1.5 right-1.5 size-1.5 rounded-full bg-sky-200 shadow-[0_0_6px_rgba(186,230,253,0.95)]",
                        isPending && "animate-pulse"
                      )}
                    />
                  ) : null}
                </Link>
              );

              if (collapsed) {
                return (
                  <li key={item.id}>
                    <Tooltip>
                      <TooltipTrigger render={linkElement} />
                      <TooltipContent
                        side="right"
                        sideOffset={8}
                        className="border border-slate-700 bg-slate-900 font-medium text-white shadow-lg"
                      >
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  </li>
                );
              }

              return <li key={item.id}>{linkElement}</li>;
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function AppSidebar({ user, permissions }: AppSidebarProps) {
  const pathname = usePathname();
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const mobileSidebarOpen = useUIStore((s) => s.mobileSidebarOpen);
  const setMobileSidebarOpen = useUIStore((s) => s.setMobileSidebarOpen);
  const activeDrawer = useUIStore((s) => s.activeDrawer);

  const [pendingNav, setPendingNav] = useState<{
    fromPathname: string;
    targetHref: string;
  } | null>(null);

  const activePathname =
    pendingNav && pendingNav.fromPathname === pathname
      ? pendingNav.targetHref
      : pathname;
  const pendingHref =
    pendingNav &&
    pendingNav.fromPathname === pathname &&
    pendingNav.targetHref !== pathname
      ? pendingNav.targetHref
      : null;

  const handleSelectHref = (href: string) => {
    if (href !== pathname) {
      setPendingNav({ fromPathname: pathname, targetHref: href });
    }
  };

  const navGroups = useMemo(
    () => getVisibleNavGroups(user.roleCode, permissions, user.id),
    [user.roleCode, permissions, user.id]
  );

  return (
    <>
      {/* Desktop Sidebar: 240px expanded / 64px collapsed */}
      <aside
        className={cn(
          "hidden shrink-0 flex-col border-r border-slate-800 bg-slate-900 text-slate-300 transition-all duration-200 lg:sticky lg:top-0 lg:flex lg:h-screen",
          sidebarCollapsed ? "w-16" : "w-60",
          activeDrawer && !sidebarCollapsed && "lg:max-xl:w-16"
        )}
      >
        <div
          className={cn(
            "flex h-14 shrink-0 items-center border-b border-slate-800/90 px-3",
            sidebarCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {!sidebarCollapsed ? (
            <>
              <Link
                href="/"
                prefetch={true}
                onClick={() => handleSelectHref("/")}
                className="group flex min-w-0 items-center gap-2.5 rounded-xl px-1.5 py-1 transition-colors hover:bg-slate-800/70"
              >
                <BrandMark />
                <div className="min-w-0 leading-tight">
                  <span className="block truncate text-sm font-bold tracking-tight text-white">
                    Krevia Studio
                  </span>
                  <p className="truncate text-[10.5px] font-medium text-slate-400">
                    Team Workspace
                  </p>
                </div>
              </Link>
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={toggleSidebar}
                      aria-label="Tutup sidebar (Ctrl+B)"
                      className="size-7 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
                    >
                      <PanelLeftClose className="size-4" />
                    </Button>
                  }
                />
                <TooltipContent
                  side="right"
                  sideOffset={8}
                  className="border border-slate-700 bg-slate-900 font-medium text-white shadow-lg"
                >
                  Tutup sidebar (Ctrl+B)
                </TooltipContent>
              </Tooltip>
            </>
          ) : (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={toggleSidebar}
                    aria-label="Buka sidebar (Ctrl+B)"
                    className="size-9 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-white"
                  >
                    <PanelLeftOpen className="size-5 text-blue-400" />
                  </Button>
                }
              />
              <TooltipContent
                side="right"
                sideOffset={8}
                className="border border-slate-700 bg-slate-900 font-medium text-white shadow-lg"
              >
                Buka sidebar (Ctrl+B)
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <SidebarNavContent
          groups={navGroups}
          collapsed={sidebarCollapsed}
          pathname={activePathname}
          pendingHref={pendingHref}
          onSelectHref={handleSelectHref}
        />

        {sidebarCollapsed ? (
          <div className="flex shrink-0 justify-center border-t border-slate-800/90 p-2.5">
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={toggleSidebar}
                    aria-label="Perlebar sidebar"
                    className="size-8 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white dark:hover:bg-slate-800"
                  />
                }
              >
                <PanelLeftOpen className="size-4" />
              </TooltipTrigger>
              <TooltipContent
                side="right"
                sideOffset={8}
                className="border border-slate-700 bg-slate-900 font-medium text-white shadow-lg"
              >
                Perlebar sidebar
              </TooltipContent>
            </Tooltip>
          </div>
        ) : (
          <div className="shrink-0 border-t border-slate-800/90 p-2.5">
            <Link
              href={`/team/${user.id}`}
              prefetch={true}
              onClick={() => handleSelectHref(`/team/${user.id}`)}
              className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-800/60 px-2.5 py-2 transition-colors hover:border-slate-700 hover:bg-slate-800"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-xs font-bold text-white shadow-xs">
                {getInitials(user.fullName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">
                  {user.fullName}
                </p>
                <p className="truncate text-[10.5px] font-medium text-slate-400">
                  {ROLE_NAME_MAP[user.roleCode] ?? user.roleCode}
                </p>
              </div>
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.85)]"
              />
            </Link>
          </div>
        )}
      </aside>

      {/* Mobile Drawer (< 1024px) */}
      <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
        <SheetContent
          side="left"
          className="w-72 gap-0 border-r border-slate-800 bg-slate-900 p-0 text-slate-300 [&_[data-slot=sheet-close]]:text-slate-400 [&_[data-slot=sheet-close]]:hover:bg-slate-800 [&_[data-slot=sheet-close]]:hover:text-white"
        >
          <SheetHeader className="border-b border-slate-800 px-4 py-3.5">
            <SheetTitle className="flex items-center gap-2.5 text-sm font-bold tracking-tight text-white">
              <BrandMark size="sm" />
              <span>Krevia Studio</span>
            </SheetTitle>
          </SheetHeader>
          <SidebarNavContent
            groups={navGroups}
            collapsed={false}
            pathname={activePathname}
            pendingHref={pendingHref}
            onSelectHref={handleSelectHref}
            onNavigate={() => setMobileSidebarOpen(false)}
          />
          <div className="shrink-0 border-t border-slate-800/90 p-3">
            <Link
              href={`/team/${user.id}`}
              prefetch={true}
              onClick={() => {
                handleSelectHref(`/team/${user.id}`);
                setMobileSidebarOpen(false);
              }}
              className="flex items-center gap-2.5 rounded-xl border border-slate-800 bg-slate-800/60 px-2.5 py-2 transition-colors hover:border-slate-700 hover:bg-slate-800"
            >
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 text-xs font-bold text-white shadow-xs">
                {getInitials(user.fullName)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">
                  {user.fullName}
                </p>
                <p className="truncate text-[10.5px] font-medium text-slate-400">
                  {ROLE_NAME_MAP[user.roleCode] ?? user.roleCode}
                </p>
              </div>
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.85)]"
              />
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
