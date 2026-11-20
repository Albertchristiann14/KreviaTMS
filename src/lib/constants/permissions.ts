export const ROLE_CODES = [
  "SUPER_ADMIN",
  "PROJECT_MANAGER",
  "STAFF_CREATOR",
  "DESIGNER",
] as const;

export type RoleCode = (typeof ROLE_CODES)[number];

export const PERMISSION_CODES = [
  // Modul A: Task Management (11)
  "tasks:project:read",
  "tasks:project:create",
  "tasks:project:update",
  "tasks:project:delete",
  "tasks:item:read",
  "tasks:item:create",
  "tasks:item:update",
  "tasks:item:assign",
  "tasks:item:approve",
  "tasks:item:delete",
  "tasks:comment:create",

  // Modul B: Team Management & KPI (11)
  "kpi:directory:read",
  "kpi:template:manage",
  "kpi:assignment:manage",
  "kpi:performance:read_own",
  "kpi:performance:read_team",
  "kpi:evaluation:create",
  "kpi:evaluation:submit",
  "kpi:evaluation:review",
  "kpi:evaluation:finalize",
  "kpi:evaluation:reopen",
  "kpi:report:export",

  // Modul C: Social Media & Design Management (14)
  "social:idea:read",
  "social:idea:create",
  "social:idea:approve",
  "social:content:read",
  "social:content:manage",
  "social:content:approve",
  "social:content:delete",
  "social:analytics:manage",
  "design:brief:read",
  "design:brief:manage",
  "design:submission:create",
  "design:submission:approve",
  "assets:library:read",
  "assets:library:manage",

  // Modul D: System Management (6)
  "system:user:read",
  "system:user:manage",
  "system:rbac:manage",
  "system:announcement:read",
  "system:announcement:manage",
  "system:audit_log:read",
] as const;

export type PermissionCode = (typeof PERMISSION_CODES)[number];

export const PERMISSIONS = {
  // Modul A: Tasks
  TASKS_PROJECT_READ: "tasks:project:read",
  TASKS_PROJECT_CREATE: "tasks:project:create",
  TASKS_PROJECT_UPDATE: "tasks:project:update",
  TASKS_PROJECT_DELETE: "tasks:project:delete",
  TASKS_ITEM_READ: "tasks:item:read",
  TASKS_ITEM_CREATE: "tasks:item:create",
  TASKS_ITEM_UPDATE: "tasks:item:update",
  TASKS_ITEM_ASSIGN: "tasks:item:assign",
  TASKS_ITEM_APPROVE: "tasks:item:approve",
  TASKS_ITEM_DELETE: "tasks:item:delete",
  TASKS_COMMENT_CREATE: "tasks:comment:create",

  // Modul B: Team & KPI
  KPI_DIRECTORY_READ: "kpi:directory:read",
  KPI_TEMPLATE_MANAGE: "kpi:template:manage",
  KPI_ASSIGNMENT_MANAGE: "kpi:assignment:manage",
  KPI_PERFORMANCE_READ_OWN: "kpi:performance:read_own",
  KPI_PERFORMANCE_READ_TEAM: "kpi:performance:read_team",
  KPI_EVALUATION_CREATE: "kpi:evaluation:create",
  KPI_EVALUATION_SUBMIT: "kpi:evaluation:submit",
  KPI_EVALUATION_REVIEW: "kpi:evaluation:review",
  KPI_EVALUATION_FINALIZE: "kpi:evaluation:finalize",
  KPI_EVALUATION_REOPEN: "kpi:evaluation:reopen",
  KPI_REPORT_EXPORT: "kpi:report:export",

  // Modul C: Social & Design
  SOCIAL_IDEA_READ: "social:idea:read",
  SOCIAL_IDEA_CREATE: "social:idea:create",
  SOCIAL_IDEA_APPROVE: "social:idea:approve",
  SOCIAL_CONTENT_READ: "social:content:read",
  SOCIAL_CONTENT_MANAGE: "social:content:manage",
  SOCIAL_CONTENT_APPROVE: "social:content:approve",
  SOCIAL_CONTENT_DELETE: "social:content:delete",
  SOCIAL_ANALYTICS_MANAGE: "social:analytics:manage",
  DESIGN_BRIEF_READ: "design:brief:read",
  DESIGN_BRIEF_MANAGE: "design:brief:manage",
  DESIGN_SUBMISSION_CREATE: "design:submission:create",
  DESIGN_SUBMISSION_APPROVE: "design:submission:approve",
  ASSETS_LIBRARY_READ: "assets:library:read",
  ASSETS_LIBRARY_MANAGE: "assets:library:manage",

  // Modul D: System
  SYSTEM_USER_READ: "system:user:read",
  SYSTEM_USER_MANAGE: "system:user:manage",
  SYSTEM_RBAC_MANAGE: "system:rbac:manage",
  SYSTEM_ANNOUNCEMENT_READ: "system:announcement:read",
  SYSTEM_ANNOUNCEMENT_MANAGE: "system:announcement:manage",
  SYSTEM_AUDIT_LOG_READ: "system:audit_log:read",
} as const satisfies Record<string, PermissionCode>;

/**
 * Canonical role-to-permission matrix (42 / 36 / 20 / 17).
 * Shared between database seed and server/UI defaults.
 */
export const ROLE_PERMISSION_MAP: Record<RoleCode, readonly PermissionCode[]> = {
  SUPER_ADMIN: [...PERMISSION_CODES],
  PROJECT_MANAGER: [
    // Modul A (10)
    PERMISSIONS.TASKS_PROJECT_READ,
    PERMISSIONS.TASKS_PROJECT_CREATE,
    PERMISSIONS.TASKS_PROJECT_UPDATE,
    PERMISSIONS.TASKS_ITEM_READ,
    PERMISSIONS.TASKS_ITEM_CREATE,
    PERMISSIONS.TASKS_ITEM_UPDATE,
    PERMISSIONS.TASKS_ITEM_ASSIGN,
    PERMISSIONS.TASKS_ITEM_APPROVE,
    PERMISSIONS.TASKS_ITEM_DELETE,
    PERMISSIONS.TASKS_COMMENT_CREATE,
    // Modul B (9)
    PERMISSIONS.KPI_DIRECTORY_READ,
    PERMISSIONS.KPI_TEMPLATE_MANAGE,
    PERMISSIONS.KPI_ASSIGNMENT_MANAGE,
    PERMISSIONS.KPI_PERFORMANCE_READ_OWN,
    PERMISSIONS.KPI_PERFORMANCE_READ_TEAM,
    PERMISSIONS.KPI_EVALUATION_CREATE,
    PERMISSIONS.KPI_EVALUATION_SUBMIT,
    PERMISSIONS.KPI_EVALUATION_REVIEW,
    PERMISSIONS.KPI_REPORT_EXPORT,
    // Modul C (13)
    PERMISSIONS.SOCIAL_IDEA_READ,
    PERMISSIONS.SOCIAL_IDEA_CREATE,
    PERMISSIONS.SOCIAL_IDEA_APPROVE,
    PERMISSIONS.SOCIAL_CONTENT_READ,
    PERMISSIONS.SOCIAL_CONTENT_MANAGE,
    PERMISSIONS.SOCIAL_CONTENT_APPROVE,
    PERMISSIONS.SOCIAL_CONTENT_DELETE,
    PERMISSIONS.SOCIAL_ANALYTICS_MANAGE,
    PERMISSIONS.DESIGN_BRIEF_READ,
    PERMISSIONS.DESIGN_BRIEF_MANAGE,
    PERMISSIONS.DESIGN_SUBMISSION_APPROVE,
    PERMISSIONS.ASSETS_LIBRARY_READ,
    PERMISSIONS.ASSETS_LIBRARY_MANAGE,
    // Modul D (4)
    PERMISSIONS.SYSTEM_USER_READ,
    PERMISSIONS.SYSTEM_ANNOUNCEMENT_READ,
    PERMISSIONS.SYSTEM_ANNOUNCEMENT_MANAGE,
    PERMISSIONS.SYSTEM_AUDIT_LOG_READ,
  ],
  STAFF_CREATOR: [
    // Modul A (5)
    PERMISSIONS.TASKS_PROJECT_READ,
    PERMISSIONS.TASKS_ITEM_READ,
    PERMISSIONS.TASKS_ITEM_CREATE,
    PERMISSIONS.TASKS_ITEM_UPDATE,
    PERMISSIONS.TASKS_COMMENT_CREATE,
    // Modul B (4)
    PERMISSIONS.KPI_DIRECTORY_READ,
    PERMISSIONS.KPI_PERFORMANCE_READ_OWN,
    PERMISSIONS.KPI_EVALUATION_SUBMIT,
    PERMISSIONS.KPI_REPORT_EXPORT,
    // Modul C (10)
    PERMISSIONS.SOCIAL_IDEA_READ,
    PERMISSIONS.SOCIAL_IDEA_CREATE,
    PERMISSIONS.SOCIAL_CONTENT_READ,
    PERMISSIONS.SOCIAL_CONTENT_MANAGE,
    PERMISSIONS.SOCIAL_CONTENT_DELETE,
    PERMISSIONS.SOCIAL_ANALYTICS_MANAGE,
    PERMISSIONS.DESIGN_BRIEF_READ,
    PERMISSIONS.DESIGN_BRIEF_MANAGE,
    PERMISSIONS.ASSETS_LIBRARY_READ,
    PERMISSIONS.ASSETS_LIBRARY_MANAGE,
    // Modul D (1)
    PERMISSIONS.SYSTEM_ANNOUNCEMENT_READ,
  ],
  DESIGNER: [
    // Modul A (5)
    PERMISSIONS.TASKS_PROJECT_READ,
    PERMISSIONS.TASKS_ITEM_READ,
    PERMISSIONS.TASKS_ITEM_CREATE,
    PERMISSIONS.TASKS_ITEM_UPDATE,
    PERMISSIONS.TASKS_COMMENT_CREATE,
    // Modul B (4)
    PERMISSIONS.KPI_DIRECTORY_READ,
    PERMISSIONS.KPI_PERFORMANCE_READ_OWN,
    PERMISSIONS.KPI_EVALUATION_SUBMIT,
    PERMISSIONS.KPI_REPORT_EXPORT,
    // Modul C (7)
    PERMISSIONS.SOCIAL_IDEA_READ,
    PERMISSIONS.SOCIAL_IDEA_CREATE,
    PERMISSIONS.SOCIAL_CONTENT_READ,
    PERMISSIONS.DESIGN_BRIEF_READ,
    PERMISSIONS.DESIGN_SUBMISSION_CREATE,
    PERMISSIONS.ASSETS_LIBRARY_READ,
    PERMISSIONS.ASSETS_LIBRARY_MANAGE,
    // Modul D (1)
    PERMISSIONS.SYSTEM_ANNOUNCEMENT_READ,
  ],
};

function toPermissionSet(
  userPermissions: ReadonlySet<string> | readonly string[]
): ReadonlySet<string> {
  return userPermissions instanceof Set
    ? userPermissions
    : new Set(userPermissions);
}

/**
 * Checks if a user possesses all required permissions.
 * When `roleCode === "SUPER_ADMIN"`, returns true for all standard permissions.
 */
export function hasPermission(
  userPermissions: ReadonlySet<string> | readonly string[],
  required: PermissionCode | readonly PermissionCode[],
  roleCode?: string
): boolean {
  if (roleCode === "SUPER_ADMIN") return true;
  const permSet = toPermissionSet(userPermissions);
  const list = Array.isArray(required) ? required : [required];
  return list.every((perm) => permSet.has(perm));
}

/**
 * Checks if a user possesses at least one of the specified permissions.
 */
export function hasAnyPermission(
  userPermissions: ReadonlySet<string> | readonly string[],
  candidates: readonly PermissionCode[],
  roleCode?: string
): boolean {
  if (roleCode === "SUPER_ADMIN") return true;
  const permSet = toPermissionSet(userPermissions);
  return candidates.some((perm) => permSet.has(perm));
}
