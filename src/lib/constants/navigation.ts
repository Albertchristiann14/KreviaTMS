import {
  hasAnyPermission,
  PERMISSIONS,
  type PermissionCode,
  type RoleCode,
} from "@/lib/constants/permissions";

export type NavIconKey =
  | "LayoutDashboard"
  | "CheckSquare"
  | "FolderKanban"
  | "Columns3"
  | "CalendarDays"
  | "CalendarRange"
  | "Lightbulb"
  | "NotebookPen"
  | "Palette"
  | "ClipboardCheck"
  | "Images"
  | "BarChart3"
  | "Users"
  | "UserCheck"
  | "TrendingUp"
  | "SlidersHorizontal"
  | "Award"
  | "FileSpreadsheet"
  | "Megaphone"
  | "UserCog"
  | "ShieldCheck"
  | "ScrollText";

export interface NavItemConfig {
  id: string;
  label: string;
  href: string | ((userId: string) => string);
  icon: NavIconKey;
  /**
   * User is shown this item if `roleCode === "SUPER_ADMIN"` or they hold
   * at least one permission in `anyPermissions`. Empty array = all authenticated users.
   */
  anyPermissions: readonly PermissionCode[];
}

export interface NavGroupConfig {
  id: string;
  label: string;
  items: readonly NavItemConfig[];
}

export interface ResolvedNavItem {
  id: string;
  label: string;
  href: string;
  icon: NavIconKey;
}

export interface ResolvedNavGroup {
  id: string;
  label: string;
  items: ResolvedNavItem[];
}

export const SIDEBAR_NAV_GROUPS: readonly NavGroupConfig[] = [
  {
    id: "utama",
    label: "Utama",
    items: [
      {
        id: "overview-dashboard",
        label: "Overview Dashboard",
        href: "/",
        icon: "LayoutDashboard",
        anyPermissions: [],
      },
    ],
  },
  {
    id: "modul-a-tasks",
    label: "Modul A: Tasks",
    items: [
      {
        id: "my-tasks",
        label: "My Tasks",
        href: "/tasks/my-tasks",
        icon: "CheckSquare",
        anyPermissions: [PERMISSIONS.TASKS_ITEM_READ],
      },
      {
        id: "projects",
        label: "Projects",
        href: "/projects",
        icon: "FolderKanban",
        anyPermissions: [PERMISSIONS.TASKS_PROJECT_READ],
      },
      {
        id: "kanban-board",
        label: "Kanban Board",
        href: "/tasks/board",
        icon: "Columns3",
        anyPermissions: [PERMISSIONS.TASKS_ITEM_READ],
      },
      {
        id: "work-calendar",
        label: "Work Calendar",
        href: "/tasks/calendar",
        icon: "CalendarDays",
        anyPermissions: [PERMISSIONS.TASKS_ITEM_READ],
      },
    ],
  },
  {
    id: "modul-c-social-design",
    label: "Modul C: Social & Design",
    items: [
      {
        id: "content-calendar",
        label: "Content Calendar",
        href: "/content/calendar",
        icon: "CalendarRange",
        anyPermissions: [PERMISSIONS.SOCIAL_CONTENT_READ],
      },
      {
        id: "content-ideas",
        label: "Content Ideas",
        href: "/content/ideas",
        icon: "Lightbulb",
        anyPermissions: [PERMISSIONS.SOCIAL_IDEA_READ],
      },
      {
        id: "content-planner",
        label: "Content Planner",
        href: "/content/planner",
        icon: "NotebookPen",
        anyPermissions: [PERMISSIONS.SOCIAL_CONTENT_MANAGE],
      },
      {
        id: "design-workspace",
        label: "Design Workspace",
        href: "/design/workspace",
        icon: "Palette",
        anyPermissions: [PERMISSIONS.DESIGN_BRIEF_READ],
      },
      {
        id: "design-reviews",
        label: "Design Review Queue",
        href: "/design/reviews",
        icon: "ClipboardCheck",
        anyPermissions: [
          PERMISSIONS.DESIGN_SUBMISSION_APPROVE,
          PERMISSIONS.SOCIAL_CONTENT_MANAGE,
        ],
      },
      {
        id: "asset-library",
        label: "Asset Library",
        href: "/assets",
        icon: "Images",
        anyPermissions: [PERMISSIONS.ASSETS_LIBRARY_READ],
      },
      {
        id: "content-analytics",
        label: "Content Analytics",
        href: "/content/analytics",
        icon: "BarChart3",
        anyPermissions: [PERMISSIONS.SOCIAL_CONTENT_READ],
      },
    ],
  },
  {
    id: "modul-b-team-kpi",
    label: "Modul B: Team & KPI",
    items: [
      {
        id: "team-directory",
        label: "Team Directory",
        href: "/team",
        icon: "Users",
        anyPermissions: [PERMISSIONS.KPI_DIRECTORY_READ],
      },
      {
        id: "individual-performance",
        label: "Individual Performance",
        href: (userId: string) => `/team/${userId}`,
        icon: "UserCheck",
        anyPermissions: [PERMISSIONS.KPI_PERFORMANCE_READ_OWN],
      },
      {
        id: "team-kpi-dashboard",
        label: "Team KPI Dashboard",
        href: "/kpi/dashboard",
        icon: "TrendingUp",
        anyPermissions: [PERMISSIONS.KPI_PERFORMANCE_READ_TEAM],
      },
      {
        id: "kpi-templates",
        label: "KPI Templates & Targets",
        href: "/kpi/templates",
        icon: "SlidersHorizontal",
        anyPermissions: [PERMISSIONS.KPI_TEMPLATE_MANAGE],
      },
      {
        id: "monthly-evaluations",
        label: "Monthly Evaluations",
        href: "/kpi/evaluations",
        icon: "Award",
        anyPermissions: [
          PERMISSIONS.KPI_EVALUATION_SUBMIT,
          PERMISSIONS.KPI_EVALUATION_REVIEW,
        ],
      },
      {
        id: "kpi-reports",
        label: "Reports & Analytics",
        href: "/kpi/reports",
        icon: "FileSpreadsheet",
        anyPermissions: [PERMISSIONS.KPI_PERFORMANCE_READ_TEAM],
      },
    ],
  },
  {
    id: "modul-d-system",
    label: "Modul D: System",
    items: [
      {
        id: "announcements",
        label: "Announcements",
        href: "/announcements",
        icon: "Megaphone",
        anyPermissions: [PERMISSIONS.SYSTEM_ANNOUNCEMENT_READ],
      },
      {
        id: "user-management",
        label: "User Management",
        href: "/system/users",
        icon: "UserCog",
        anyPermissions: [PERMISSIONS.SYSTEM_USER_MANAGE],
      },
      {
        id: "roles-permissions",
        label: "Roles & Permissions",
        href: "/system/roles",
        icon: "ShieldCheck",
        anyPermissions: [PERMISSIONS.SYSTEM_RBAC_MANAGE],
      },
      {
        id: "activity-logs",
        label: "Activity Logs",
        href: "/system/activity-logs",
        icon: "ScrollText",
        anyPermissions: [PERMISSIONS.SYSTEM_AUDIT_LOG_READ],
      },
    ],
  },
];

/**
 * Deterministic RBAC sidebar filter across all 22 canonical menu items.
 */
export function getVisibleNavGroups(
  roleCode: RoleCode | string,
  permissions: ReadonlySet<string> | readonly string[],
  userId: string
): ResolvedNavGroup[] {
  const groups: ResolvedNavGroup[] = [];

  for (const group of SIDEBAR_NAV_GROUPS) {
    const visibleItems: ResolvedNavItem[] = [];

    for (const item of group.items) {
      const allowed =
        item.anyPermissions.length === 0 ||
        hasAnyPermission(permissions, item.anyPermissions, roleCode);

      if (!allowed) continue;

      visibleItems.push({
        id: item.id,
        label: item.label,
        href: typeof item.href === "function" ? item.href(userId) : item.href,
        icon: item.icon,
      });
    }

    if (visibleItems.length > 0) {
      groups.push({
        id: group.id,
        label: group.label,
        items: visibleItems,
      });
    }
  }

  return groups;
}

export interface QuickCreateItem {
  id: string;
  label: string;
  href: string;
  anyPermissions: readonly PermissionCode[];
}

export const QUICK_CREATE_ITEMS: readonly QuickCreateItem[] = [
  {
    id: "quick-task",
    label: "Buat Task Baru",
    href: "/tasks/board",
    anyPermissions: [PERMISSIONS.TASKS_ITEM_CREATE],
  },
  {
    id: "quick-project",
    label: "Buat Project",
    href: "/projects",
    anyPermissions: [PERMISSIONS.TASKS_PROJECT_CREATE],
  },
  {
    id: "quick-idea",
    label: "Ajukan Content Idea",
    href: "/content/ideas",
    anyPermissions: [PERMISSIONS.SOCIAL_IDEA_CREATE],
  },
  {
    id: "quick-design-upload",
    label: "Upload Desain / Asset",
    href: "/design/workspace",
    anyPermissions: [
      PERMISSIONS.DESIGN_SUBMISSION_CREATE,
      PERMISSIONS.ASSETS_LIBRARY_MANAGE,
    ],
  },
  {
    id: "quick-announcement",
    label: "Buat Pengumuman",
    href: "/announcements",
    anyPermissions: [PERMISSIONS.SYSTEM_ANNOUNCEMENT_MANAGE],
  },
];

export function getVisibleQuickCreateItems(
  roleCode: RoleCode | string,
  permissions: ReadonlySet<string> | readonly string[]
): QuickCreateItem[] {
  return QUICK_CREATE_ITEMS.filter((item) =>
    hasAnyPermission(permissions, item.anyPermissions, roleCode)
  );
}

export const ROUTE_BREADCRUMB_LABELS: Record<string, string> = {
  "": "Overview Dashboard",
  projects: "Projects",
  tasks: "Tasks",
  "my-tasks": "My Tasks",
  board: "Kanban Board",
  calendar: "Calendar",
  team: "Team Directory",
  kpi: "KPI & Evaluasi",
  templates: "Templates & Targets",
  dashboard: "Team KPI Dashboard",
  evaluations: "Monthly Evaluations",
  reports: "Reports & Analytics",
  content: "Social Content",
  ideas: "Content Ideas",
  planner: "Content Planner",
  analytics: "Content Analytics",
  design: "Design",
  workspace: "Design Workspace",
  reviews: "Design Review Queue",
  assets: "Asset Library",
  announcements: "Announcements",
  notifications: "Notifications",
  system: "System",
  users: "User Management",
  roles: "Roles & Permissions",
  "activity-logs": "Activity Logs",
};
