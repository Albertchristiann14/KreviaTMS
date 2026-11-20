import { hash } from "@node-rs/argon2";
import {
  KpiCategory,
  KpiMetricSource,
  KpiUnit,
  PrismaClient,
  ProjectMemberRole,
  ProjectStatus,
} from "@prisma/client";
import {
  ROLE_PERMISSION_MAP,
  type PermissionCode,
  type RoleCode,
} from "../src/lib/constants/permissions";

const prisma = new PrismaClient();

const CANONICAL_ROLES: Array<{
  code: RoleCode;
  name: string;
  description: string;
  isSystem: boolean;
}> = [
  {
    code: "SUPER_ADMIN",
    name: "Super Admin / Leadership",
    description:
      "Akses penuh seluruh sistem, konfigurasi RBAC, manajemen user, dan finalisasi KPI.",
    isSystem: true,
  },
  {
    code: "PROJECT_MANAGER",
    name: "Project Manager",
    description:
      "Mengelola proyek, alokasi task, persetujuan konten/desain, dan evaluasi KPI tim.",
    isSystem: true,
  },
  {
    code: "STAFF_CREATOR",
    name: "Staff / Content Creator",
    description:
      "Mengerjakan task, mengusulkan ide konten, menyusun content plan & brief desain, input analitik konten.",
    isSystem: true,
  },
  {
    code: "DESIGNER",
    name: "Designer",
    description:
      "Mengerjakan task desain, mengunggah versi desain di Design Workspace, dan mengelola Asset Library.",
    isSystem: true,
  },
];

const CANONICAL_PERMISSIONS: Array<{
  code: PermissionCode;
  module: string;
  resource: string;
  action: string;
  description: string;
}> = [
  // Modul A: Task Management (11)
  {
    code: "tasks:project:read",
    module: "tasks",
    resource: "project",
    action: "read",
    description: "Melihat daftar & detail proyek",
  },
  {
    code: "tasks:project:create",
    module: "tasks",
    resource: "project",
    action: "create",
    description: "Membuat proyek baru",
  },
  {
    code: "tasks:project:update",
    module: "tasks",
    resource: "project",
    action: "update",
    description:
      "Mengubah info, status (termasuk arsip ARCHIVED) & anggota proyek",
  },
  {
    code: "tasks:project:delete",
    module: "tasks",
    resource: "project",
    action: "delete",
    description: "Menghapus proyek (soft-delete only)",
  },
  {
    code: "tasks:item:read",
    module: "tasks",
    resource: "item",
    action: "read",
    description: "Melihat task di Kanban, My Tasks & Work Calendar",
  },
  {
    code: "tasks:item:create",
    module: "tasks",
    resource: "item",
    action: "create",
    description: "Membuat task baru",
  },
  {
    code: "tasks:item:update",
    module: "tasks",
    resource: "item",
    action: "update",
    description: "Mengubah detail/status task sesuai scope",
  },
  {
    code: "tasks:item:assign",
    module: "tasks",
    resource: "item",
    action: "assign",
    description: "Menugaskan/memindahkan assignee task",
  },
  {
    code: "tasks:item:approve",
    module: "tasks",
    resource: "item",
    action: "approve",
    description:
      "Menyetujui task dari IN_REVIEW ke DONE atau minta REVISION",
  },
  {
    code: "tasks:item:delete",
    module: "tasks",
    resource: "item",
    action: "delete",
    description: "Menghapus (soft-delete) task",
  },
  {
    code: "tasks:comment:create",
    module: "tasks",
    resource: "comment",
    action: "create",
    description: "Menambahkan komentar & mention pada task",
  },

  // Modul B: Team Management & KPI (11)
  {
    code: "kpi:directory:read",
    module: "kpi",
    resource: "directory",
    action: "read",
    description: "Melihat Team Directory internal",
  },
  {
    code: "kpi:template:manage",
    module: "kpi",
    resource: "template",
    action: "manage",
    description: "Membuat/mengubah master KPI templates",
  },
  {
    code: "kpi:assignment:manage",
    module: "kpi",
    resource: "assignment",
    action: "manage",
    description: "Menetapkan target & bobot KPI bulanan per user",
  },
  {
    code: "kpi:performance:read_own",
    module: "kpi",
    resource: "performance",
    action: "read_own",
    description: "Melihat dashboard performa & KPI pribadi",
  },
  {
    code: "kpi:performance:read_team",
    module: "kpi",
    resource: "performance",
    action: "read_team",
    description: "Melihat Team Performance Dashboard seluruh tim",
  },
  {
    code: "kpi:evaluation:create",
    module: "kpi",
    resource: "evaluation",
    action: "create",
    description: "Membuat draft evaluasi bulanan & mengisi skor",
  },
  {
    code: "kpi:evaluation:submit",
    module: "kpi",
    resource: "evaluation",
    action: "submit",
    description: "Mengisi self-assessment / submit evaluasi",
  },
  {
    code: "kpi:evaluation:review",
    module: "kpi",
    resource: "evaluation",
    action: "review",
    description: "Mereview & memberi catatan evaluator",
  },
  {
    code: "kpi:evaluation:finalize",
    module: "kpi",
    resource: "evaluation",
    action: "finalize",
    description: "Mengunci permanen evaluasi bulanan (FINALIZED)",
  },
  {
    code: "kpi:evaluation:reopen",
    module: "kpi",
    resource: "evaluation",
    action: "reopen",
    description: "Membuka kembali evaluasi FINALIZED (khusus Super Admin)",
  },
  {
    code: "kpi:report:export",
    module: "kpi",
    resource: "report",
    action: "export",
    description: "Mengekspor laporan KPI bulanan ke CSV/PDF",
  },

  // Modul C: Social Media & Design Management (14)
  {
    code: "social:idea:read",
    module: "social",
    resource: "idea",
    action: "read",
    description: "Melihat Content Ideas bank",
  },
  {
    code: "social:idea:create",
    module: "social",
    resource: "idea",
    action: "create",
    description: "Mengusulkan ide konten baru",
  },
  {
    code: "social:idea:approve",
    module: "social",
    resource: "idea",
    action: "approve",
    description: "Menyetujui/menolak ide konten & konversi ke kalender",
  },
  {
    code: "social:content:read",
    module: "social",
    resource: "content",
    action: "read",
    description: "Melihat Content Calendar & Content Plan",
  },
  {
    code: "social:content:manage",
    module: "social",
    resource: "content",
    action: "manage",
    description: "Membuat & mengubah Content Plan, caption & jadwal",
  },
  {
    code: "social:content:approve",
    module: "social",
    resource: "content",
    action: "approve",
    description: "Menyetujui konten siap tayang (READY_TO_PUBLISH/SCHEDULED)",
  },
  {
    code: "social:content:delete",
    module: "social",
    resource: "content",
    action: "delete",
    description: "Menghapus (soft-delete) item konten",
  },
  {
    code: "social:analytics:manage",
    module: "social",
    resource: "analytics",
    action: "manage",
    description: "Input & update data Content Performance Analytics",
  },
  {
    code: "design:brief:read",
    module: "design",
    resource: "brief",
    action: "read",
    description: "Melihat daftar & detail Design Brief",
  },
  {
    code: "design:brief:manage",
    module: "design",
    resource: "brief",
    action: "manage",
    description:
      "Membuat & mengubah Design Brief serta menugaskan Designer",
  },
  {
    code: "design:submission:create",
    module: "design",
    resource: "submission",
    action: "create",
    description: "Mengunggah versi desain di Design Workspace",
  },
  {
    code: "design:submission:approve",
    module: "design",
    resource: "submission",
    action: "approve",
    description: "Menyetujui hasil desain atau meminta revisi",
  },
  {
    code: "assets:library:read",
    module: "assets",
    resource: "library",
    action: "read",
    description: "Mencari & mengunduh aset dari Asset Library",
  },
  {
    code: "assets:library:manage",
    module: "assets",
    resource: "library",
    action: "manage",
    description: "Mengunggah, tagging, mempromosikan & menghapus aset",
  },

  // Modul D: System Management (6)
  {
    code: "system:user:read",
    module: "system",
    resource: "user",
    action: "read",
    description: "Melihat daftar akun user & status aktif",
  },
  {
    code: "system:user:manage",
    module: "system",
    resource: "user",
    action: "manage",
    description:
      "Membuat user, reset password, ubah role & nonaktifkan user",
  },
  {
    code: "system:rbac:manage",
    module: "system",
    resource: "rbac",
    action: "manage",
    description: "Mengelola mapping Role & Permission",
  },
  {
    code: "system:announcement:read",
    module: "system",
    resource: "announcement",
    action: "read",
    description: "Membaca Announcements & menandai sudah dibaca",
  },
  {
    code: "system:announcement:manage",
    module: "system",
    resource: "announcement",
    action: "manage",
    description: "Membuat, pin, mengubah & menghapus Announcements",
  },
  {
    code: "system:audit_log:read",
    module: "system",
    resource: "audit_log",
    action: "read",
    description: "Melihat & memfilter Activity Logs (Audit Trail)",
  },
];

const CANONICAL_KPI_TEMPLATES: Array<{
  roleCode: RoleCode;
  code: string;
  name: string;
  category: KpiCategory;
  metricSource: KpiMetricSource;
  unit: KpiUnit;
  defaultWeight: string;
  defaultTargetValue: string;
}> = [
  // PROJECT_MANAGER (30 + 30 + 20 + 20 = 100%)
  {
    roleCode: "PROJECT_MANAGER",
    code: "KPI_PM_TCR",
    name: "Team/Project Task Completion Rate",
    category: KpiCategory.DELIVERY,
    metricSource: KpiMetricSource.AUTO_TCR,
    unit: KpiUnit.PERCENTAGE,
    defaultWeight: "30.00",
    defaultTargetValue: "95.00",
  },
  {
    roleCode: "PROJECT_MANAGER",
    code: "KPI_PM_OTDR",
    name: "Team On-Time Delivery Rate",
    category: KpiCategory.DELIVERY,
    metricSource: KpiMetricSource.AUTO_OTDR,
    unit: KpiUnit.PERCENTAGE,
    defaultWeight: "30.00",
    defaultTargetValue: "90.00",
  },
  {
    roleCode: "PROJECT_MANAGER",
    code: "KPI_PM_PLANNING",
    name: "Kualitas Perencanaan & Mitigasi Risiko",
    category: KpiCategory.QUALITY,
    metricSource: KpiMetricSource.MANUAL_SCORE,
    unit: KpiUnit.SCORE_100,
    defaultWeight: "20.00",
    defaultTargetValue: "85.00",
  },
  {
    roleCode: "PROJECT_MANAGER",
    code: "KPI_PM_COORDINATION",
    name: "Koordinasi Tim & Komunikasi Leadership",
    category: KpiCategory.COLLABORATION,
    metricSource: KpiMetricSource.MANUAL_SCORE,
    unit: KpiUnit.SCORE_100,
    defaultWeight: "20.00",
    defaultTargetValue: "85.00",
  },

  // STAFF_CREATOR (25 + 25 + 25 + 25 = 100%)
  {
    roleCode: "STAFF_CREATOR",
    code: "KPI_SC_TCR",
    name: "Individual Task Completion Rate (TCR)",
    category: KpiCategory.DELIVERY,
    metricSource: KpiMetricSource.AUTO_TCR,
    unit: KpiUnit.PERCENTAGE,
    defaultWeight: "25.00",
    defaultTargetValue: "95.00",
  },
  {
    roleCode: "STAFF_CREATOR",
    code: "KPI_SC_OTDR",
    name: "On-Time Delivery Rate (OTDR)",
    category: KpiCategory.DELIVERY,
    metricSource: KpiMetricSource.AUTO_OTDR,
    unit: KpiUnit.PERCENTAGE,
    defaultWeight: "25.00",
    defaultTargetValue: "90.00",
  },
  {
    roleCode: "STAFF_CREATOR",
    code: "KPI_SC_CPVS",
    name: "Pencapaian Target Output Konten (CPVS)",
    category: KpiCategory.PRODUCTIVITY,
    metricSource: KpiMetricSource.AUTO_CPVS,
    unit: KpiUnit.COUNT,
    defaultWeight: "25.00",
    defaultTargetValue: "20.00",
  },
  {
    roleCode: "STAFF_CREATOR",
    code: "KPI_SC_CREATIVE",
    name: "Kualitas Ide, Copywriting & Konsistensi Brand",
    category: KpiCategory.CREATIVE,
    metricSource: KpiMetricSource.MANUAL_SCORE,
    unit: KpiUnit.SCORE_100,
    defaultWeight: "25.00",
    defaultTargetValue: "85.00",
  },

  // DESIGNER (25 + 25 + 30 + 20 = 100%)
  {
    roleCode: "DESIGNER",
    code: "KPI_DS_TCR",
    name: "Individual Task Completion Rate (TCR)",
    category: KpiCategory.DELIVERY,
    metricSource: KpiMetricSource.AUTO_TCR,
    unit: KpiUnit.PERCENTAGE,
    defaultWeight: "25.00",
    defaultTargetValue: "95.00",
  },
  {
    roleCode: "DESIGNER",
    code: "KPI_DS_OTDR",
    name: "On-Time Delivery Rate (OTDR)",
    category: KpiCategory.DELIVERY,
    metricSource: KpiMetricSource.AUTO_OTDR,
    unit: KpiUnit.PERCENTAGE,
    defaultWeight: "25.00",
    defaultTargetValue: "90.00",
  },
  {
    roleCode: "DESIGNER",
    code: "KPI_DS_DQS",
    name: "Design Quality & Revision Score (DQS)",
    category: KpiCategory.QUALITY,
    metricSource: KpiMetricSource.AUTO_DQS,
    unit: KpiUnit.SCORE_100,
    defaultWeight: "30.00",
    defaultTargetValue: "85.00",
  },
  {
    roleCode: "DESIGNER",
    code: "KPI_DS_VISUAL",
    name: "Kreativitas Visual & Kepatuhan Brief",
    category: KpiCategory.CREATIVE,
    metricSource: KpiMetricSource.MANUAL_SCORE,
    unit: KpiUnit.SCORE_100,
    defaultWeight: "20.00",
    defaultTargetValue: "85.00",
  },
];

const DEMO_ACCOUNTS: Array<{
  roleCode: RoleCode;
  email: string;
  fullName: string;
  displayName: string;
  jobTitle: string;
  department: string;
  projectRole: ProjectMemberRole;
}> = [
  {
    roleCode: "SUPER_ADMIN",
    email: "admin@krevia.digital",
    fullName: "Leadership Krevia (Admin)",
    displayName: "Admin",
    jobTitle: "Executive Director",
    department: "Leadership",
    projectRole: ProjectMemberRole.LEAD,
  },
  {
    roleCode: "PROJECT_MANAGER",
    email: "pm@krevia.digital",
    fullName: "Mhd Yoga Andhika",
    displayName: "Yoga",
    jobTitle: "Project Manager",
    department: "Operations",
    projectRole: ProjectMemberRole.OWNER,
  },
  {
    roleCode: "STAFF_CREATOR",
    email: "creator@krevia.digital",
    fullName: "Nta (Creator Demo)",
    displayName: "Nta",
    jobTitle: "Content Strategist",
    department: "Creative & Social",
    projectRole: ProjectMemberRole.MEMBER,
  },
  {
    roleCode: "DESIGNER",
    email: "designer@krevia.digital",
    fullName: "Raka Pratama",
    displayName: "Raka",
    jobTitle: "Visual Designer",
    department: "Creative & Design",
    projectRole: ProjectMemberRole.MEMBER,
  },
];

async function hashArgon2id(plainPassword: string): Promise<string> {
  return hash(plainPassword, {
    algorithm: 2, // Argon2id
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1,
  });
}

async function main() {
  console.log("[KTMS Seed] Memulai seeding idempoten...");

  // 1. Seed 4 Canonical Roles
  const roleIdByCode = new Map<RoleCode, string>();
  for (const role of CANONICAL_ROLES) {
    const record = await prisma.role.upsert({
      where: { code: role.code },
      update: {
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
      },
      create: role,
    });
    roleIdByCode.set(role.code, record.id);
  }
  console.log(`[KTMS Seed] ${roleIdByCode.size} canonical roles siap.`);

  // 2. Seed 42 Canonical Permissions
  const permissionIdByCode = new Map<PermissionCode, string>();
  for (const perm of CANONICAL_PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { code: perm.code },
      update: {
        module: perm.module,
        resource: perm.resource,
        action: perm.action,
        description: perm.description,
      },
      create: perm,
    });
    permissionIdByCode.set(perm.code, record.id);
  }
  console.log(`[KTMS Seed] ${permissionIdByCode.size} canonical permissions siap.`);

  // 3. Seed Role-Permission Mappings (42 / 36 / 20 / 17)
  const rolePermissionRows: Array<{ roleId: string; permissionId: string }> = [];
  for (const [roleCode, permCodes] of Object.entries(ROLE_PERMISSION_MAP) as Array<
    [RoleCode, readonly PermissionCode[]]
  >) {
    const roleId = roleIdByCode.get(roleCode);
    if (!roleId) {
      throw new Error(`Role ${roleCode} tidak ditemukan saat mapping.`);
    }
    for (const permCode of permCodes) {
      const permissionId = permissionIdByCode.get(permCode);
      if (!permissionId) {
        throw new Error(`Permission ${permCode} tidak ditemukan saat mapping.`);
      }
      rolePermissionRows.push({ roleId, permissionId });
    }
  }

  await prisma.rolePermission.createMany({
    data: rolePermissionRows,
    skipDuplicates: true,
  });
  console.log(
    `[KTMS Seed] ${rolePermissionRows.length} role-permission mappings dipastikan ada.`
  );

  // 4. Guarded Demo Users & Sample Project (Non-Production + ALLOW_DEMO_SEED === "true")
  const allowDemoSeed =
    process.env.NODE_ENV !== "production" &&
    process.env.ALLOW_DEMO_SEED === "true";

  let templateCreatorId: string | null = null;

  if (allowDemoSeed) {
    const demoPassword = process.env.DEMO_SEED_PASSWORD;
    if (!demoPassword || demoPassword.length < 8) {
      throw new Error(
        "ALLOW_DEMO_SEED=true membutuhkan environment variable DEMO_SEED_PASSWORD (min 8 karakter)."
      );
    }

    const passwordHash = await hashArgon2id(demoPassword);
    const seededUsersByRole = new Map<RoleCode, string>();

    for (const account of DEMO_ACCOUNTS) {
      const roleId = roleIdByCode.get(account.roleCode);
      if (!roleId) {
        throw new Error(`Role ${account.roleCode} tidak ditemukan.`);
      }

      const user = await prisma.user.upsert({
        where: { email: account.email.toLowerCase() },
        update: {
          roleId,
          fullName: account.fullName,
          displayName: account.displayName,
          jobTitle: account.jobTitle,
          department: account.department,
          isActive: true,
          deletedAt: null,
        },
        create: {
          roleId,
          email: account.email.toLowerCase(),
          passwordHash,
          fullName: account.fullName,
          displayName: account.displayName,
          jobTitle: account.jobTitle,
          department: account.department,
          isActive: true,
          mustChangePassword: false,
          tokenVersion: 1,
        },
      });
      seededUsersByRole.set(account.roleCode, user.id);
    }

    templateCreatorId =
      seededUsersByRole.get("SUPER_ADMIN") ??
      seededUsersByRole.get("PROJECT_MANAGER") ??
      null;

    const pmUserId = seededUsersByRole.get("PROJECT_MANAGER");
    const adminUserId = seededUsersByRole.get("SUPER_ADMIN");
    if (!pmUserId || !adminUserId) {
      throw new Error("Akun demo PM/Admin gagal dibuat.");
    }

    // 1 Sample Project (KTMS-Q4)
    const sampleProject = await prisma.project.upsert({
      where: { code: "KTMS-Q4" },
      update: {
        name: "Krevia Digital Social & Brand Q4",
        status: ProjectStatus.ACTIVE,
        colorHex: "#2563EB",
        ownerId: pmUserId,
        deletedAt: null,
      },
      create: {
        code: "KTMS-Q4",
        name: "Krevia Digital Social & Brand Q4",
        description:
          "Proyek operasional utama Q4 untuk pengelolaan produksi konten media sosial, aset desain, dan tugas lintas tim Krevia Digital.",
        status: ProjectStatus.ACTIVE,
        colorHex: "#2563EB",
        ownerId: pmUserId,
      },
    });

    // 4 Project Members
    for (const account of DEMO_ACCOUNTS) {
      const memberUserId = seededUsersByRole.get(account.roleCode);
      if (!memberUserId) continue;
      await prisma.projectMember.upsert({
        where: {
          projectId_userId: {
            projectId: sampleProject.id,
            userId: memberUserId,
          },
        },
        update: {
          projectRole: account.projectRole,
        },
        create: {
          projectId: sampleProject.id,
          userId: memberUserId,
          projectRole: account.projectRole,
          addedBy: adminUserId,
        },
      });
    }

    console.log(
      "[KTMS Seed] 4 akun demo, 1 sample project (KTMS-Q4), dan 4 project_members siap."
    );
  } else {
    console.log(
      "[KTMS Seed] Demo seed dilewati (NODE_ENV=production atau ALLOW_DEMO_SEED !== 'true')."
    );
    const existingAdmin = await prisma.user.findFirst({
      where: {
        deletedAt: null,
        role: { code: "SUPER_ADMIN" },
      },
      select: { id: true },
    });
    templateCreatorId = existingAdmin?.id ?? null;
  }

  // 5. Seed 12 Canonical KPI Templates (requires a creator user FK)
  if (templateCreatorId) {
    for (const tpl of CANONICAL_KPI_TEMPLATES) {
      const applicableRoleId = roleIdByCode.get(tpl.roleCode) ?? null;
      await prisma.kpiTemplate.upsert({
        where: { code: tpl.code },
        update: {
          name: tpl.name,
          category: tpl.category,
          applicableRoleId,
          metricSource: tpl.metricSource,
          unit: tpl.unit,
          defaultTargetValue: tpl.defaultTargetValue,
          defaultWeight: tpl.defaultWeight,
          isHigherBetter: true,
          isActive: true,
          deletedAt: null,
        },
        create: {
          code: tpl.code,
          name: tpl.name,
          category: tpl.category,
          applicableRoleId,
          metricSource: tpl.metricSource,
          unit: tpl.unit,
          defaultTargetValue: tpl.defaultTargetValue,
          defaultWeight: tpl.defaultWeight,
          isHigherBetter: true,
          isActive: true,
          createdBy: templateCreatorId,
        },
      });
    }
    console.log(
      `[KTMS Seed] ${CANONICAL_KPI_TEMPLATES.length} canonical KPI templates siap (100% bobot per role).`
    );
  } else {
    console.warn(
      "[KTMS Seed] PERINGATAN: 12 KPI templates belum dapat di-upsert karena belum ada user SUPER_ADMIN di tabel users (kpi_templates.created_by NOT NULL). Buat user admin terlebih dahulu atau jalankan dengan ALLOW_DEMO_SEED=true di staging/dev."
    );
  }

  console.log("[KTMS Seed] Selesai.");
}

main()
  .catch((err) => {
    console.error("[KTMS Seed] Error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
