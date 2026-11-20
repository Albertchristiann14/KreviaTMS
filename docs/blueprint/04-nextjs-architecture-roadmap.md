# Dokumen 04: Arsitektur Next.js (App Router), Kontrak API & Roadmap Eksekusi 14 Hari

> **Proyek:** Krevia Team Management System (KTMS) — V1 Internal Web Application
> **Organisasi:** Krevia Digital (*"Build Smarter. Operate Better."*)
> **Tim Pengembang:** Mhd Yoga Andhika & Nta (2 Full-Stack Developers)
> **Durasi Eksekusi:** 14 Hari Kalender (Minggu 1: Perencanaan, Desain & Fondasi | Minggu 2: Sprint Development, Integrasi, QA & Production Go-Live)
> **Target Pembaca:** Leadership Krevia Digital (Milestones, Akuntabilitas & Demo Checkpoints) dan Tim Engineering (Struktur Kode, Kontrak TypeScript/JSON & Eksekusi Harian)
> **V1 Scope Guardrails:** Desktop-first responsive internal web app. **OUT OF SCOPE V1:** Native Mobile App, External Client Portal, Full HRIS (payroll, slip gaji, absensi geofencing/biometrik, rekrutmen).

---

## Ringkasan Eksekutif untuk Leadership

Dokumen ini menjadi **panduan teknis dan eksekusi harian** yang menjembatani seluruh blueprint KTMS (`01-product-srs.md`, `02-system-flows-use-cases.md`, dan `03-database-backend.md`) menjadi aplikasi produksi nyata dalam **14 hari** oleh **2 developer (Mhd Yoga Andhika dan Nta)** dengan tiga prinsip operasional utama:

1. **Arsitektur Zero-Friction untuk Velocity 2 Minggu:** Menggunakan **Next.js 15+ (App Router) Hybrid Full-Stack** (Server Actions + Route Handlers `/api/**`), **PostgreSQL 16 (Supabase)**, **Prisma ORM**, dan **Auth.js v5**. Satu codebase TypeScript end-to-end menghilangkan duplikasi DTO/serializer antara frontend dan backend sehingga 2 developer dapat menyelesaikan seluruh 4 modul inti secara realistis.
2. **Pembagian Ownership Anti-Konflik:** Codebase disusun menggunakan **Feature-Sliced Modular Architecture** (`src/features/tasks`, `src/features/team-kpi`, `src/features/social-design`, `src/features/system`) sehingga Yoga dan Nta bekerja secara paralel pada *vertical slice* berbeda dengan gesekan *merge conflict* minimal.
3. **Akuntabilitas Terukur & Transparan ke Leadership:** Setiap hari (Hari 1 s/d Hari 14) memiliki **Deliverable Terukur** (dokumen, Figma, Preview URL Vercel, atau video/screenshot uji coba nyata — bukan status verbal *"masih dikerjakan"*), dilengkapi **Laporan Harian 17:30 WIB** dan **3 Formal Demo Gate** (Hari 4, Hari 10, Hari 14).

---

## Bagian 1: Arsitektur Proyek & Struktur Folder Next.js (App Router + Feature-Sliced Modular)

### 1.1 Arsitektur 5 Lapis KTMS

KTMS menerapkan pola **Layered Feature-Sliced Modular Architecture** di atas Next.js 15+ App Router. Direktori `src/app/` dijaga tetap tipis (*thin routing & layout layer*), sementara seluruh logika bisnis, validasi Zod, Server Actions, dan komponen UI per domain terisolasi di dalam `src/features/<domain>/`. Infrastruktur lintas modul (Prisma client, Auth.js v5, RBAC guard, Audit Logger, Notification Dispatcher, dan Presigned Storage) dipusatkan di `src/server/`.

```mermaid
flowchart TD
    UI["Client & RSC UI Layer (Next.js 15 App Router, React 19, shadcn/ui, dnd-kit, Recharts)"]
    STATE["Client State & Cache (TanStack Query v5, Zustand UI Store, nuqs URL Params)"]
    ENTRY["Entry Layer: Server Actions (Mutations) & Route Handlers /api/** (Reads, Exports, Presign)"]
    GUARD["Protection Middleware: Auth.js v5 Session -> RBAC requirePermission -> Zod Schema Validation"]
    SERVICE["Domain Service Layer (src/features/*/services + Cross-Module Hooks)"]
    INFRA["Shared Cross-Cutting Services (Audit Logger + Notification Dispatcher + Supabase Presigned Storage)"]
    ORM["Prisma ORM (Atomic $transaction + Typed Queries)"]
    DB["PostgreSQL 16 (Supabase Managed) & S3/Supabase Object Storage"]

    UI --> STATE
    UI --> ENTRY
    STATE --> ENTRY
    ENTRY --> GUARD
    GUARD --> SERVICE
    SERVICE --> INFRA
    SERVICE --> ORM
    INFRA --> ORM
    ORM --> DB
```

### 1.2 Pohon Folder Proyek Lengkap (Copy-Paste Ready)

Struktur berikut dirancang agar Yoga dan Nta dapat langsung menginisialisasi proyek pada Hari 5 tanpa kebingungan penempatan file.

```text
krevia-team-management-system/
├── .github/
│   └── workflows/
│       └── ci.yml                              # Lint, Typecheck (tsc --noEmit), Prisma Validate & Build check
├── docs/
│   └── blueprint/
│       ├── 01-product-srs.md
│       ├── 02-system-flows-use-cases.md
│       ├── 03-database-backend.md
│       └── 04-nextjs-architecture-roadmap.md
├── prisma/
│   ├── schema.prisma                           # Master PostgreSQL 16 schema (4 modul + enums + composite indexes)
│   ├── seed.ts                                 # Seeder 4 roles, permissions matrix, akun tim Krevia, sample data
│   └── migrations/                             # Prisma versioned SQL migrations
├── public/
│   ├── brand/
│   │   ├── krevia-logo-dark.svg
│   │   └── krevia-logo-light.svg
│   └── placeholders/
│       └── avatar-default.png
├── src/
│   ├── middleware.ts                           # Auth session gate + redirect unauthenticated -> /login
│   ├── app/
│   │   ├── layout.tsx                          # Root HTML, Inter/Plus Jakarta Sans font, Providers (Query, Toaster, Nuqs)
│   │   ├── globals.css                         # Tailwind CSS + shadcn/ui CSS variables (Krevia brand tokens)
│   │   ├── error.tsx                           # Global Error Boundary
│   │   ├── not-found.tsx                       # Global 404 Page
│   │   ├── (auth)/
│   │   │   ├── layout.tsx                      # Split/centered minimalist auth layout (tanpa sidebar)
│   │   │   └── login/
│   │   │       └── page.tsx                    # Form Login Credentials (Auth.js v5)
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx                      # Authenticated App Shell: Sidebar RBAC + Topbar + AnnouncementBanner + Global Drawer
│   │   │   ├── loading.tsx                     # Dashboard skeleton fallback
│   │   │   ├── page.tsx                        # Executive & Personal Overview Dashboard (/)
│   │   │   ├── projects/
│   │   │   │   ├── page.tsx                    # Daftar Project + progress bar (/projects)
│   │   │   │   └── [projectId]/
│   │   │   │       └── page.tsx                # Detail Project: Overview, Members, Linked Tasks (/projects/:id)
│   │   │   ├── tasks/
│   │   │   │   ├── my-tasks/
│   │   │   │   │   └── page.tsx                # My Tasks pribadi + filter deadline/status (/tasks/my-tasks)
│   │   │   │   ├── board/
│   │   │   │   │   └── page.tsx                # Unified Kanban Board (@dnd-kit) (/tasks/board)
│   │   │   │   └── calendar/
│   │   │   │       └── page.tsx                # Work Calendar deadline & workload (/tasks/calendar)
│   │   │   ├── team/
│   │   │   │   ├── page.tsx                    # Team Directory & beban kerja aktif (/team)
│   │   │   │   └── [userId]/
│   │   │   │       └── page.tsx                # Individual Performance Profile (/team/:userId)
│   │   │   ├── kpi/
│   │   │   │   ├── templates/
│   │   │   │   │   └── page.tsx                # Manajemen Template & Bobot KPI (/kpi/templates)
│   │   │   │   ├── dashboard/
│   │   │   │   │   └── page.tsx                # Team Performance Dashboard & Recharts (/kpi/dashboard)
│   │   │   │   ├── evaluations/
│   │   │   │   │   ├── page.tsx                # Daftar Monthly Evaluation per periode (/kpi/evaluations)
│   │   │   │   │   └── [evaluationId]/
│   │   │   │   │       └── page.tsx            # Detail & Form Review/Finalisasi Evaluasi (/kpi/evaluations/:id)
│   │   │   │   └── reports/
│   │   │   │       └── page.tsx                # Reports & Analytics + Export CSV (/kpi/reports)
│   │   │   ├── content/
│   │   │   │   ├── calendar/
│   │   │   │   │   └── page.tsx                # Content Calendar pengganti spreadsheet (/content/calendar)
│   │   │   │   ├── ideas/
│   │   │   │   │   └── page.tsx                # Content Ideas Bank & Approval (/content/ideas)
│   │   │   │   ├── planner/
│   │   │   │   │   └── page.tsx                # Content Planning & Auto-Spawn Design Brief (/content/planner)
│   │   │   │   └── analytics/
│   │   │   │       └── page.tsx                # Content Performance Analytics (/content/analytics)
│   │   │   ├── design/
│   │   │   │   ├── workspace/
│   │   │   │   │   └── page.tsx                # Design Workspace: antrean brief, upload/link & revisi (/design/workspace)
│   │   │   │   └── reviews/
│   │   │   │       └── page.tsx                # Design Approval Queue untuk PM & Leadership (/design/reviews)
│   │   │   ├── assets/
│   │   │   │   └── page.tsx                    # Asset Library searchable + tag filter (/assets)
│   │   │   ├── announcements/
│   │   │   │   └── page.tsx                    # Papan Pengumuman Internal (/announcements)
│   │   │   ├── notifications/
│   │   │   │   └── page.tsx                    # Full Notification Center (/notifications)
│   │   │   └── system/
│   │   │       ├── users/
│   │   │       │   └── page.tsx                # User Management CRUD & Reset Password (/system/users)
│   │   │       ├── roles/
│   │   │       │   └── page.tsx                # RBAC Matrix Viewer & Permission Manager (/system/roles)
│   │   │       └── activity-logs/
│   │   │           └── page.tsx                # Immutable Audit Trail Explorer (/system/activity-logs)
│   │   └── api/
│   │       ├── auth/
│   │       │   └── [...nextauth]/route.ts      # Auth.js v5 handler
│   │       ├── health/route.ts                 # Liveness + DB ping check
│   │       ├── tasks/
│   │       │   ├── board/route.ts              # GET Kanban board grouped tasks (filterable)
│   │       │   ├── calendar/route.ts           # GET Work Calendar tasks by date range
│   │       │   └── [taskId]/route.ts           # GET Full Task detail (comments, checklists, linked brief)
│   │       ├── content/
│   │       │   ├── calendar/route.ts           # GET Content Calendar items by month/channel/status
│   │       │   └── analytics/summary/route.ts  # GET Content engagement aggregates & chart series
│   │       ├── assets/route.ts                 # GET Paginated Asset Library search/tags
│   │       ├── kpi/
│   │       │   ├── dashboard/route.ts          # GET Team KPI trend & leaderboard metrics
│   │       │   └── reports/export/route.ts     # GET Stream CSV/printable report download
│   │       ├── uploads/
│   │       │   ├── presign/route.ts            # POST Generate Supabase Storage/S3 signed PUT URL (TTL 300s)
│   │       │   └── download-url/route.ts       # GET Generate signed GET URL untuk private bucket preview/download
│   │       ├── notifications/
│   │       │   └── unread/route.ts             # GET Unread count + 15 latest items (30s polling)
│   │       ├── activity-logs/route.ts          # GET Paginated/filtered Activity Logs + CSV export
│   │       └── cron/
│   │           └── deadline-alerts/route.ts    # POST/GET Daily 08:00 WIB cron (H-2/H-0/H+1&H+3, CRON_SECRET)
│   ├── features/
│   │   ├── tasks/                              # === MODUL A: TASK MANAGEMENT (Owner: Yoga) ===
│   │   │   ├── actions/
│   │   │   │   ├── project.actions.ts          # createProject, updateProject, archiveProject, manageMembers
│   │   │   │   └── task.actions.ts             # createTask, updateTask, moveKanbanTask, deleteTask, checklist/comment
│   │   │   ├── components/
│   │   │   │   ├── ProjectGrid.tsx
│   │   │   │   ├── ProjectFormDialog.tsx
│   │   │   │   ├── MyTasksTable.tsx
│   │   │   │   ├── KanbanBoard.tsx             # @dnd-kit DndContext + optimistic state
│   │   │   │   ├── KanbanColumn.tsx
│   │   │   │   ├── KanbanTaskCard.tsx
│   │   │   │   ├── WorkCalendarView.tsx
│   │   │   │   └── TaskDetailDrawer.tsx        # Slide-over detail tanpa meninggalkan Kanban/Calendar
│   │   │   ├── hooks/
│   │   │   │   ├── useKanbanBoard.ts           # TanStack Query + optimistic drag-and-drop rollback
│   │   │   │   └── useTaskFilters.ts           # nuqs URL search params sync
│   │   │   ├── queries/
│   │   │   │   ├── project.queries.ts          # Server-only Prisma queries untuk RSC
│   │   │   │   └── task.queries.ts
│   │   │   ├── schemas/
│   │   │   │   ├── project.schema.ts           # Zod schemas
│   │   │   │   └── task.schema.ts
│   │   │   ├── services/
│   │   │   │   └── task.service.ts             # Shared service: spawnLinkedTask(tx), computePosition()
│   │   │   └── types.ts
│   │   ├── team-kpi/                           # === MODUL B: TEAM & KPI (Owner: Nta) ===
│   │   │   ├── actions/
│   │   │   │   ├── kpi-template.actions.ts     # createTemplate, updateTemplate, assignKpiToUser
│   │   │   │   └── evaluation.actions.ts       # generateMonthlyEvaluation, updateScores, submit, review, finalize
│   │   │   ├── components/
│   │   │   │   ├── TeamDirectoryTable.tsx
│   │   │   │   ├── IndividualMetricsHeader.tsx
│   │   │   │   ├── KpiTemplateBuilder.tsx
│   │   │   │   ├── TeamPerformanceCharts.tsx   # Recharts Bar/Line/Radar charts
│   │   │   │   ├── EvaluationScoreForm.tsx
│   │   │   │   └── ReportExportToolbar.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useKpiDashboard.ts
│   │   │   ├── queries/
│   │   │   │   ├── team.queries.ts
│   │   │   │   └── kpi.queries.ts
│   │   │   ├── schemas/
│   │   │   │   ├── kpi-template.schema.ts
│   │   │   │   └── evaluation.schema.ts
│   │   │   ├── services/
│   │   │   │   └── kpi-aggregator.service.ts   # Kalkulasi otomatis completionRate, onTimeRate, revisionScore
│   │   │   └── types.ts
│   │   ├── social-design/                      # === MODUL C: SOCIAL MEDIA & DESIGN (Owner: Nta) ===
│   │   │   ├── actions/
│   │   │   │   ├── content-idea.actions.ts     # createIdea, approveIdea, rejectIdea, convertToPlan
│   │   │   │   ├── content-plan.actions.ts     # createContentPlan (+auto-spawn task), updateSchedule, markPublished
│   │   │   │   ├── design.actions.ts           # submitDesign, reviewDesignSubmission (approve/revise)
│   │   │   │   ├── asset.actions.ts            # registerAsset, updateAssetTags, archiveAsset
│   │   │   │   └── analytics.actions.ts        # upsertContentMetrics
│   │   │   ├── components/
│   │   │   │   ├── ContentCalendarGrid.tsx     # Pengganti spreadsheet konten (Month/List toggle)
│   │   │   │   ├── ContentIdeaBoard.tsx
│   │   │   │   ├── ContentPlanFormDrawer.tsx
│   │   │   │   ├── DesignWorkspaceList.tsx
│   │   │   │   ├── DesignSubmissionModal.tsx   # Hybrid: Upload Supabase Storage atau External Link (Figma/Canva)
│   │   │   │   ├── DesignApprovalDrawer.tsx    # Version history + Approve / Request Revision feedback
│   │   │   │   ├── AssetLibraryGrid.tsx        # TanStack Table + Grid toggle + Tag filter
│   │   │   │   └── ContentAnalyticsCharts.tsx  # Recharts Engagement & Reach breakdown
│   │   │   ├── hooks/
│   │   │   │   ├── useContentCalendar.ts
│   │   │   │   └── usePresignedUpload.ts
│   │   │   ├── queries/
│   │   │   │   ├── content.queries.ts
│   │   │   │   ├── design.queries.ts
│   │   │   │   └── asset.queries.ts
│   │   │   ├── schemas/
│   │   │   │   ├── content.schema.ts
│   │   │   │   ├── design.schema.ts
│   │   │   │   └── analytics.schema.ts
│   │   │   ├── services/
│   │   │   │   └── content-workflow.service.ts # Orchestrates Content -> DesignBrief -> Task sync -> Asset promote
│   │   │   └── types.ts
│   │   └── system/                             # === MODUL D: SYSTEM MANAGEMENT (Owner: Yoga) ===
│   │       ├── actions/
│   │       │   ├── user.actions.ts             # createUser, updateUser, deactivateUser, resetPassword
│   │       │   ├── rbac.actions.ts             # updateRolePermissions
│   │       │   ├── announcement.actions.ts     # publishAnnouncement, togglePin, markRead, archive
│   │       │   └── notification.actions.ts     # markNotificationRead, markAllRead
│   │       ├── components/
│   │       │   ├── UsersDataTable.tsx
│   │       │   ├── UserFormDialog.tsx
│   │       │   ├── RbacMatrixEditor.tsx
│   │       │   ├── AnnouncementList.tsx
│   │       │   ├── AnnouncementEditorDialog.tsx
│   │       │   ├── NotificationFeed.tsx
│   │       │   └── ActivityLogsTable.tsx       # TanStack Table + JSONB diff viewer
│   │       ├── hooks/
│   │       │   └── useUnreadNotifications.ts   # Polling 30s via TanStack Query
│   │       ├── queries/
│   │       │   ├── user.queries.ts
│   │       │   ├── announcement.queries.ts
│   │       │   └── audit.queries.ts
│   │       ├── schemas/
│   │       │   ├── user.schema.ts
│   │       │   └── announcement.schema.ts
│   │       └── types.ts
│   ├── components/
│   │   ├── ui/                                 # shadcn/ui primitives (button, badge, card, dialog, sheet, table, tabs, select, popover, calendar, dropdown-menu, toast, skeleton, tooltip, avatar, checkbox, separator)
│   │   ├── layout/
│   │   │   ├── AppSidebar.tsx                  # Menu dinamis berdasarkan role & permissions
│   │   │   ├── AppTopbar.tsx                   # Breadcrumb, Quick Create, NotificationBell, UserMenu
│   │   │   ├── NotificationBellPopover.tsx     # Badge count + quick mark-read
│   │   │   ├── PinnedAnnouncementBanner.tsx    # Banner dismissible untuk pengumuman pinned aktif
│   │   │   └── GlobalSlideOverHost.tsx         # Render TaskDetailDrawer / DesignApprovalDrawer dari Zustand
│   │   ├── providers/
│   │   │   ├── QueryProvider.tsx               # TanStack QueryClientProvider
│   │   │   └── AppProviders.tsx                # SessionProvider + QueryProvider + NuqsAdapter + Sonner Toaster
│   │   └── shared/
│   │       ├── StatusBadge.tsx                 # Mapping warna konsisten untuk semua Enum status
│   │       ├── PriorityBadge.tsx
│   │       ├── DataTable.tsx                   # Reusable TanStack Table wrapper (sorting, pagination, toolbar)
│   │       ├── EmptyState.tsx
│   │       ├── ConfirmDialog.tsx
│   │       └── FileUploadDropzone.tsx          # Hybrid file upload + external URL validator
│   ├── lib/
│   │   ├── env.ts                              # Zod validation untuk process.env saat boot
│   │   ├── utils.ts                            # cn() Tailwind merge & helper murni
│   │   ├── formatters.ts                       # Format tanggal WIB (id-ID), persentase KPI, ukuran file
│   │   ├── query-client.ts                     # Default staleTime, gcTime, retry config
│   │   ├── constants/
│   │   │   ├── enums.ts                        # Canonical Enums + Indonesian display labels + badge colors
│   │   │   ├── navigation.ts                   # Sidebar nav items + required permissions/roles
│   │   │   └── permissions.ts                  # Daftar kode permission kanonik (module:resource:action)
│   │   ├── validations/
│   │   │   └── common.ts                       # Shared Zod schemas (uuid, pagination, dateRange, safeUrl)
│   │   └── stores/
│   │       └── ui-store.ts                     # Zustand store minimal (sidebar, active drawer, modal)
│   ├── server/
│   │   ├── db/
│   │   │   └── prisma.ts                       # PrismaClient singleton (hot-reload safe + connection pool)
│   │   ├── auth/
│   │   │   ├── auth.config.ts                  # Edge-compatible Auth.js v5 config (untuk middleware.ts)
│   │   │   ├── auth.ts                         # Full Auth.js v5 (Credentials + Argon2id/Bcrypt + DB RBAC)
│   │   │   └── rbac.ts                         # requireSession(), requirePermission(), assertOwnershipOrPermission()
│   │   ├── actions/
│   │   │   └── safe-action.ts                  # createProtectedAction() wrapper (Auth + RBAC + Zod + Error map)
│   │   ├── services/
│   │   │   ├── audit-logger.ts                 # writeAuditLog(tx, ...) immutable JSONB logger
│   │   │   └── notification-dispatcher.ts      # dispatchNotifications(tx, ...) batch insert helper
│   │   └── storage/
│   │       └── presigned.ts                    # Supabase Storage / S3 signed PUT & signed GET generator
│   └── types/
│       ├── action-result.ts                    # ActionResult<T>, ActionErrorCode, ok(), fail()
│       ├── pagination.ts                       # PaginatedResponse<T>, PaginationMeta
│       └── next-auth.d.ts                      # Augmentation Session.user (id, role, permissions[], department)
├── .env.example                                # Template lengkap environment variables
├── components.json                             # shadcn/ui config
├── next.config.ts                              # remotePatterns (Supabase Storage), serverActions bodySizeLimit
├── package.json
├── tailwind.config.ts
└── tsconfig.json                               # strict: true, noUncheckedIndexedAccess: true
```

---

### 1.3 Arsitektur Data Fetching, Caching & State Management

Untuk menghindari *over-fetching*, *waterfall*, atau sinkronisasi state ganda antara server dan client, KTMS menerapkan aturan tegas pada 4 lapisan berikut:

#### A. Kapan Memakai RSC vs TanStack Query (React Query v5)

| Skenario Penggunaan | Mekanisme Wajib | Alasan Teknis & Pola Implementasi |
| :--- | :--- | :--- |
| **Initial Page Load** (`/`, `/projects`, `/team`, `/kpi/evaluations`, `/system/users`, `/announcements`) | **React Server Components (RSC)** | Query Prisma dieksekusi langsung di server tanpa *client bundle overhead* dan tanpa waterfall `useEffect`. Halaman merender HTML siap pakai dengan sesi RBAC sudah terverifikasi di server. |
| **Kanban Board Drag-and-Drop** (`/tasks/board`) | **RSC Initial Hydration + TanStack Query (`useQuery` + `useMutation`)** | RSC mengirim `initialData` ke `KanbanBoard` client component; perpindahan kartu memakai `onMutate` *optimistic update* di cache React Query dan *automatic rollback* bila Server Action mengembalikan error validasi/konflik versi. |
| **Work Calendar & Content Calendar** (`/tasks/calendar`, `/content/calendar`) | **RSC Initial Month + TanStack Query** | Navigasi antar bulan (Prev/Next Month) dan toggle filter channel/assignee di-fetch cepat melalui Route Handler `GET /api/tasks/calendar` atau `GET /api/content/calendar` dengan `placeholderData: keepPreviousData` agar grid kalender tidak berkedip. |
| **Slide-Over Detail Drawer** (Task Detail / Design Review) | **TanStack Query on-demand (`enabled: Boolean(drawerId)`)** | Membuka detail task atau riwayat revisi desain dari Kanban/Calendar tidak memicu *full page navigation*; data di-fetch dari `GET /api/tasks/[taskId]` dan di-cache selama 30 detik (`staleTime: 30_000`). |
| **Notification Bell Polling** (Global Topbar) | **TanStack Query Polling (`refetchInterval: 30_000`)** | Memanggil `GET /api/notifications/unread` setiap 30 detik dengan `refetchIntervalInBackground: false` dan `refetchOnWindowFocus: true`. Solusi ringan tanpa biaya kompleksitas WebSocket server tambahan untuk V1 2 minggu. |

#### B. Kapan Memakai Server Actions vs Route Handlers (`/api/**`)

| Dimensi | Next.js Server Actions (`src/features/*/actions/*.ts`) | Route Handlers (`src/app/api/**/route.ts`) |
| :--- | :--- | :--- |
| **Tujuan Utama** | **Seluruh mutasi internal (Create, Update, Delete, Status Transition, Approval, Finalize)** yang dipicu form/tombol UI aplikasi KTMS. | **Complex Read Queries** (untuk TanStack Query client filtering/polling), **File Download/Export** (CSV/PDF stream), **Presigned Upload URL**, **Auth.js endpoint**, dan **Healthcheck**. |
| **Keunggulan** | End-to-end TypeScript inference otomatis, integrasi langsung `revalidatePath`/`revalidateTag`, nol boilerplate `fetch()` + JSON serialization di UI. | Mendukung HTTP GET cache headers, streaming binary (`Content-Disposition: attachment`), HTTP status codes standar (200/400/401/403/404), dan inspeksi Network tab yang mudah untuk polling/pagination. |
| **Strategi Invalidasi Cache** | Setelah mutasi sukses: panggil `revalidatePath()` atau `revalidateTag()` di server **DAN** `queryClient.invalidateQueries()` di `onSuccess` hook client bila halaman memakai React Query. | Endpoint `GET` selalu menyertakan `export const dynamic = "force-dynamic"` atau `Cache-Control: private, no-store` untuk data operasional sensitif RBAC agar tidak bocor antar user di edge cache. |

#### C. Client UI State (Zustand) vs URL SearchParams (`nuqs`)

KTMS **melarang** penyimpanan data entitas database (daftar task, daftar konten, daftar user) di dalam Zustand. Data server sepenuhnya dikelola RSC + TanStack Query.

- **Zustand (`src/lib/stores/ui-store.ts`) — HANYA untuk transient UI state lokal:**
  - `sidebarCollapsed: boolean` (di-persist ringan di `localStorage`)
  - `activeDrawer: { type: "TASK_DETAIL" | "CONTENT_DETAIL" | "DESIGN_REVIEW"; id: string } | null`
  - `quickCreateModal: "TASK" | "CONTENT_IDEA" | "ANNOUNCEMENT" | null`
- **URL SearchParams (`nuqs`) — untuk seluruh filter, pencarian, tab, dan pagination yang shareable:**
  - Contoh: `/tasks/board?project=prj_q4&assignee=usr_nta&priority=HIGH&type=DESIGN_TASK`
  - Contoh: `/content/calendar?month=2026-11&platform=INSTAGRAM&status=DESIGN_REVIEW`
  - Keuntungan: PM atau Leadership dapat menyalin URL filter tertentu dan mengirimkannya ke anggota tim lewat chat; halaman akan terbuka dengan kondisi filter identik.

```typescript
// src/lib/stores/ui-store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ActiveDrawer =
  | { type: "TASK_DETAIL"; id: string }
  | { type: "CONTENT_DETAIL"; id: string }
  | { type: "DESIGN_REVIEW"; id: string }
  | null;

interface UIState {
  sidebarCollapsed: boolean;
  activeDrawer: ActiveDrawer;
  toggleSidebar: () => void;
  openDrawer: (drawer: NonNullable<ActiveDrawer>) => void;
  closeDrawer: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      activeDrawer: null,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      openDrawer: (activeDrawer) => set({ activeDrawer }),
      closeDrawer: () => set({ activeDrawer: null }),
    }),
    {
      name: "ktms-ui-prefs",
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    }
  )
);
```

---

### 1.4 Standardisasi Error Handling, Validasi Zod, RBAC Wrapper & Atomic Audit Hook

Semua Server Actions di seluruh 4 modul **wajib** memakai pola standar di bawah ini sehingga error handling di UI seragam, keamanan RBAC tidak mungkin terlewat, dan setiap perubahan data tercatat atomik di `activity_logs`.

#### 1. Response Wrapper Standar (`src/types/action-result.ts`)

```typescript
// src/types/action-result.ts
export type ActionErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVALID_STATE_TRANSITION"
  | "PERIOD_LOCKED"
  | "INTERNAL_ERROR";

export type FieldErrors = Record<string, string[]>;

export type ActionResult<T> =
  | {
      success: true;
      data: T;
      message?: string;
    }
  | {
      success: false;
      error: {
        code: ActionErrorCode;
        message: string;
        fieldErrors?: FieldErrors;
      };
    };

export function ok<T>(data: T, message?: string): ActionResult<T> {
  return { success: true, data, message };
}

export function fail(
  code: ActionErrorCode,
  message: string,
  fieldErrors?: FieldErrors
): ActionResult<never> {
  return {
    success: false,
    error: { code, message, fieldErrors },
  };
}

export class DomainError extends Error {
  constructor(
    public readonly code: ActionErrorCode,
    message: string,
    public readonly fieldErrors?: FieldErrors
  ) {
    super(message);
    this.name = "DomainError";
  }
}
```

#### 2. RBAC Guard & Session Helper (`src/server/auth/rbac.ts`)

```typescript
// src/server/auth/rbac.ts
import { cache } from "react";
import { auth } from "@/server/auth/auth"; // Auth.js v5 (7-day sliding session + tokenVersion)
import { prisma } from "@/server/db/prisma";
import { DomainError } from "@/types/action-result";
import type { PermissionCode } from "@/lib/constants/permissions";

export type RoleCode = "SUPER_ADMIN" | "PROJECT_MANAGER" | "STAFF_CREATOR" | "DESIGNER";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  roleId: string;
  role: RoleCode;
  permissions: ReadonlySet<PermissionCode>;
}

/**
 * Request-scoped memoized auth context (selaras dengan Dokumen 03 §4.3).
 * Memvalidasi isActive, deletedAt, dan tokenVersion dari DB untuk instant session revocation
 * (ketika role berubah, password direset, atau akun dinonaktifkan).
 */
export const getAuthContext = cache(async (): Promise<AuthenticatedUser> => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new DomainError("UNAUTHORIZED", "Sesi login tidak valid atau telah berakhir.");
  }

  const dbUser = await prisma.user.findFirst({
    where: {
      id: session.user.id,
      deletedAt: null,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      roleId: true,
      tokenVersion: true,
      role: {
        select: {
          code: true,
          rolePermissions: {
            select: {
              permission: { select: { code: true } },
            },
          },
        },
      },
    },
  });

  if (!dbUser || dbUser.tokenVersion !== session.user.tokenVersion) {
    throw new DomainError("UNAUTHORIZED", "Sesi telah dicabut. Silakan login kembali.");
  }

  return {
    id: dbUser.id,
    email: dbUser.email,
    name: dbUser.fullName,
    roleId: dbUser.roleId,
    role: dbUser.role.code as RoleCode,
    permissions: new Set(
      dbUser.role.rolePermissions.map((rp) => rp.permission.code as PermissionCode)
    ),
  };
});

export async function requireSession(): Promise<AuthenticatedUser> {
  return getAuthContext();
}

export async function requirePermission(
  required: PermissionCode | PermissionCode[]
): Promise<AuthenticatedUser> {
  const user = await requireSession();
  if (user.role === "SUPER_ADMIN") return user;

  const list = Array.isArray(required) ? required : [required];
  const hasAll = list.every((perm) => user.permissions.has(perm));
  if (!hasAll) {
    throw new DomainError(
      "FORBIDDEN",
      `Akses ditolak. Peran ${user.role} tidak memiliki izin: ${list.join(", ")}.`
    );
  }
  return user;
}

export function assertOwnershipOrPermission(
  user: AuthenticatedUser,
  ownerId: string | null | undefined,
  overridePermission: PermissionCode
): void {
  if (user.role === "SUPER_ADMIN") return;
  if (ownerId && ownerId === user.id) return;
  if (user.permissions.has(overridePermission)) return;
  throw new DomainError(
    "FORBIDDEN",
    "Anda hanya dapat mengubah data milik sendiri atau memerlukan izin manajemen."
  );
}
```

#### 3. Safe Server Action Wrapper (`src/server/actions/safe-action.ts`)

```typescript
// src/server/actions/safe-action.ts
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { requirePermission, type AuthenticatedUser } from "@/server/auth/rbac";
import type { PermissionCode } from "@/lib/constants/permissions";
import { DomainError, fail, ok, type ActionResult } from "@/types/action-result";

interface ProtectedActionOptions<TSchema extends z.ZodTypeAny, TOutput> {
  permission: PermissionCode | PermissionCode[];
  schema: TSchema;
  handler: (ctx: {
    user: AuthenticatedUser;
    input: z.infer<TSchema>;
  }) => Promise<{ data: TOutput; message?: string }>;
}

export function createProtectedAction<TSchema extends z.ZodTypeAny, TOutput>(
  options: ProtectedActionOptions<TSchema, TOutput>
) {
  return async (rawInput: z.input<TSchema>): Promise<ActionResult<TOutput>> => {
    try {
      const user = await requirePermission(options.permission);
      const parsed = options.schema.safeParse(rawInput);

      if (!parsed.success) {
        return fail(
          "VALIDATION_ERROR",
          "Input tidak valid. Periksa kembali kolom yang ditandai.",
          parsed.error.flatten().fieldErrors as Record<string, string[]>
        );
      }

      const result = await options.handler({ user, input: parsed.data });
      return ok(result.data, result.message);
    } catch (err) {
      if (err instanceof DomainError) {
        return fail(err.code, err.message, err.fieldErrors);
      }
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
          return fail("CONFLICT", "Data duplikat terdeteksi pada kolom unik.");
        }
        if (err.code === "P2025") {
          return fail("NOT_FOUND", "Data yang diminta tidak ditemukan atau sudah dihapus.");
        }
      }
      console.error("[KTMS_ACTION_ERROR]", err);
      return fail("INTERNAL_ERROR", "Terjadi kesalahan sistem internal. Silakan coba lagi.");
    }
  };
}
```

#### 4. Atomic Prisma Transaction + Audit Log & Notification Hook (`src/server/services/audit-logger.ts`)

```typescript
// src/server/services/audit-logger.ts
import type { Prisma } from "@prisma/client";

export interface AuditLogInput {
  actorId: string | null; // null untuk aksi sistem/cron otomatis
  module: "TASKS" | "TEAM_KPI" | "SOCIAL_DESIGN" | "SYSTEM";
  action: string; // contoh: "tasks:item:status_changed", "design:submission:approved", "kpi:evaluation:finalized"
  entityType: string; // contoh: "TASK", "CONTENT_ITEM", "DESIGN_SUBMISSION", "MONTHLY_EVALUATION"
  entityId?: string | null;
  summary: string; // Wajib NOT NULL (maks 255 karakter), terbaca manusia
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Wajib dipanggil DI DALAM prisma.$transaction(async (tx) => { ... })
 * agar audit trail bersifat atomik bersama mutasi bisnis utama (tabel activity_logs append-only).
 */
export async function writeAuditLog(
  tx: Prisma.TransactionClient,
  input: AuditLogInput
): Promise<void> {
  await tx.activityLog.create({
    data: {
      actorId: input.actorId,
      module: input.module,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      summary: input.summary.slice(0, 255),
      oldValues: (input.oldValues ?? undefined) as Prisma.InputJsonValue | undefined,
      newValues: (input.newValues ?? undefined) as Prisma.InputJsonValue | undefined,
      ipAddress: input.ipAddress ?? null,
      userAgent: input.userAgent ?? null,
    },
  });
}
```

---

## Bagian 2: Daftar Route Aplikasi, API Endpoints & Server Actions + Kontrak Payload

### 2.1 App Router Page Routes Table (Seluruh 4 Modul + Auth & Overview)

Seluruh halaman dashboard mewarisi `src/app/(dashboard)/layout.tsx` yang melakukan pengecekan sesi Auth.js di server, merender `AppSidebar` berdasarkan hak akses role, menampilkan `PinnedAnnouncementBanner`, dan menyediakan `GlobalSlideOverHost` untuk membuka detail Task/Brief tanpa pindah halaman.

| Modul | Route Path | App Router File | Layout Group | Allowed Roles | Rendering & Hydration Strategy | Catatan UX & Interaksi |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Auth** | `/login` | `(auth)/login/page.tsx` | `(auth)` | Public (Guest) | Static Shell + Client Form | Redirect otomatis ke `/` jika sesi aktif |
| **Home** | `/` | `(dashboard)/page.tsx` | `(dashboard)` | Semua Role | RSC Dynamic (`force-dynamic`) | Role-aware dashboard: My Tasks due soon, Pinned Announcements, KPI/Pipeline summary |
| **Modul A** | `/projects` | `(dashboard)/projects/page.tsx` | `(dashboard)` | Semua Role (Create/Edit: `SUPER_ADMIN`, `PROJECT_MANAGER`) | RSC Dynamic + `nuqs` filter | Card grid proyek + progress bar (`DONE / total tasks`) |
| **Modul A** | `/projects/[projectId]` | `(dashboard)/projects/[projectId]/page.tsx` | `(dashboard)` | Semua Role (Member/PM/Admin) | RSC Dynamic | Tab: Overview, Daftar Task Proyek, Anggota Proyek |
| **Modul A** | `/tasks/my-tasks` | `(dashboard)/tasks/my-tasks/page.tsx` | `(dashboard)` | Semua Role | RSC Dynamic + TanStack Table | Fokus task ter-assign ke user login (termasuk auto-task konten/desain) + highlight overdue |
| **Modul A** | `/tasks/board` | `(dashboard)/tasks/board/page.tsx` | `(dashboard)` | Semua Role | RSC Initial + TanStack Query (`@dnd-kit`) | Kanban 6 kolom (`BACKLOG`..`DONE`), optimistic drag-and-drop, klik kartu buka `TaskDetailDrawer` |
| **Modul A** | `/tasks/calendar` | `(dashboard)/tasks/calendar/page.tsx` | `(dashboard)` | Semua Role | RSC Initial Month + TanStack Query | Grid bulanan/mingguan berdasarkan `dueDate`, color-coded `taskType` & `priority` |
| **Modul B** | `/team` | `(dashboard)/team/page.tsx` | `(dashboard)` | Semua Role | RSC Dynamic + TanStack Table | Direktori tim, divisi, role, dan jumlah active task saat ini |
| **Modul B** | `/team/[userId]` | `(dashboard)/team/[userId]/page.tsx` | `(dashboard)` | `SUPER_ADMIN`, `PROJECT_MANAGER`, atau diri sendiri (`self`) | RSC Dynamic | Individual Performance: Completion Rate, On-Time Rate, Avg Revision, Riwayat Evaluasi |
| **Modul B** | `/kpi/templates` | `(dashboard)/kpi/templates/page.tsx` | `(dashboard)` | `SUPER_ADMIN`, `PROJECT_MANAGER` | RSC Dynamic + Client Builder | Konfigurasi indikator KPI, bobot (total wajib 100%), target per role |
| **Modul B** | `/kpi/dashboard` | `(dashboard)/kpi/dashboard/page.tsx` | `(dashboard)` | `SUPER_ADMIN`, `PROJECT_MANAGER` | RSC Initial + TanStack Query (`Recharts`) | Perbandingan performa tim, tren bulanan, ranking ketepatan deadline |
| **Modul B** | `/kpi/evaluations` | `(dashboard)/kpi/evaluations/page.tsx` | `(dashboard)` | Semua Role (Staff/Designer hanya lihat miliknya) | RSC Dynamic + `nuqs` period filter | Daftar evaluasi bulanan beserta status (`DRAFT` -> `FINALIZED`) |
| **Modul B** | `/kpi/evaluations/[evaluationId]` | `(dashboard)/kpi/evaluations/[evaluationId]/page.tsx` | `(dashboard)` | `SUPER_ADMIN`, `PROJECT_MANAGER`, atau employee terkait | RSC Dynamic + Client Score Form | Auto-populated metrik objektif (`TCR/OTDR/DQS/CPVS`) + skor `MANUAL_SCORE` (0–100) + Submit/Review/Finalize (`FINALIZED` khusus `SUPER_ADMIN`) |
| **Modul B** | `/kpi/reports` | `(dashboard)/kpi/reports/page.tsx` | `(dashboard)` | `SUPER_ADMIN`, `PROJECT_MANAGER` | RSC Dynamic + CSV Download Trigger | Filter periode & divisi, pratinjau ringkasan eksekutif, export CSV/print PDF |
| **Modul C** | `/content/calendar` | `(dashboard)/content/calendar/page.tsx` | `(dashboard)` | Semua Role | RSC Initial Month + TanStack Query | Pengganti spreadsheet konten: filter platform (IG/TikTok/LinkedIn/YT), status & pillar |
| **Modul C** | `/content/ideas` | `(dashboard)/content/ideas/page.tsx` | `(dashboard)` | Semua Role (Approve: `SUPER_ADMIN`, `PROJECT_MANAGER`) | RSC Dynamic + Client Action Cards | Bank ide konten, tombol Approve/Reject, tombol *Convert to Content Plan* |
| **Modul C** | `/content/planner` | `(dashboard)/content/planner/page.tsx` | `(dashboard)` | `SUPER_ADMIN`, `PROJECT_MANAGER`, `STAFF_CREATOR` | RSC Dynamic + Form Drawer | Penyusunan caption, hook, jadwal tayang, dan **Auto-Spawn Design Brief & Task** |
| **Modul C** | `/design/workspace` | `(dashboard)/design/workspace/page.tsx` | `(dashboard)` | `SUPER_ADMIN`, `PROJECT_MANAGER`, `DESIGNER`, `STAFF_CREATOR` (read) | RSC Dynamic + Upload Modal | Antrean brief desain, upload file (Supabase Storage) atau link Figma/Canva, tracking versi v1/v2/v3 |
| **Modul C** | `/design/reviews` | `(dashboard)/design/reviews/page.tsx` | `(dashboard)` | `SUPER_ADMIN`, `PROJECT_MANAGER`, `STAFF_CREATOR` (read-only) | RSC Dynamic + `DesignApprovalDrawer` | Antrean `SUBMITTED` siap direview, aksi Approve (auto-save ke Asset Library) atau Request Revision |
| **Modul C** | `/assets` | `(dashboard)/assets/page.tsx` | `(dashboard)` | Semua Role | RSC Initial + TanStack Query | Asset Library grid/table dengan pencarian judul, filter tag, format, & link ke konten asal |
| **Modul C** | `/content/analytics` | `(dashboard)/content/analytics/page.tsx` | `(dashboard)` | `SUPER_ADMIN`, `PROJECT_MANAGER`, `STAFF_CREATOR` | RSC Initial + TanStack Query (`Recharts`) | Input & grafik Reach, Impressions, Views, Likes, Comments, Shares, Saves, Clicks, `ER%` & `CTR%` per konten |
| **Modul D** | `/announcements` | `(dashboard)/announcements/page.tsx` | `(dashboard)` | Semua Role (Publish: `SUPER_ADMIN`, `PROJECT_MANAGER`) | RSC Dynamic | Feed pengumuman internal, status pinned, indikator *read receipt* |
| **Modul D** | `/notifications` | `(dashboard)/notifications/page.tsx` | `(dashboard)` | Semua Role | RSC Dynamic + Client Read Actions | Seluruh riwayat notifikasi in-app (filter Unread/All, deep-link ke entity) |
| **Modul D** | `/system/users` | `(dashboard)/system/users/page.tsx` | `(dashboard)` | `SUPER_ADMIN` | RSC Dynamic + TanStack Table | CRUD akun tim internal, assign role, toggle active/inactive, reset password |
| **Modul D** | `/system/roles` | `(dashboard)/system/roles/page.tsx` | `(dashboard)` | `SUPER_ADMIN` | RSC Dynamic + Client Matrix | Matriks RBAC 4 peran terhadap daftar permission (`module:resource:action`) |
| **Modul D** | `/system/activity-logs` | `(dashboard)/system/activity-logs/page.tsx` | `(dashboard)` | `SUPER_ADMIN`, `PROJECT_MANAGER` (read-only scope operasional) | RSC Initial + TanStack Query | Immutable Audit Trail viewer (filter aktor, modul, rentang tanggal, diff JSONB old vs new) |

---

### 2.2 Katalog Lengkap Server Actions & Route Handlers (`/api/**`)

#### 2.2.1 Server Actions Catalog (Mutasi Internal Terproteksi)

Seluruh kode izin pada tabel berikut merujuk langsung kepada **42 kode izin kanonik (`module:resource:action`)** pada Dokumen 03 §4.1–4.2.

| Modul | Server Action Name | File Path (`src/features/...`) | Required Permission | Deskripsi & Side-Effects Utama |
| :--- | :--- | :--- | :--- | :--- |
| **A** | `createProjectAction` | `tasks/actions/project.actions.ts` | `tasks:project:create` | Buat project + insert `project_members` + `writeAuditLog` + `revalidatePath("/projects")` |
| **A** | `updateProjectAction` | `tasks/actions/project.actions.ts` | `tasks:project:update` | Update metadata/status project (termasuk arsip) + sinkronisasi anggota + audit log |
| **A** | `createTaskAction` | `tasks/actions/task.actions.ts` | `tasks:item:create` | Buat task baru + hitung `position` akhir kolom (`65536` gap) + notif `TASK_ASSIGNED` ke assignee + audit log |
| **A** | `updateTaskAction` | `tasks/actions/task.actions.ts` | `tasks:item:update` (reassign: `tasks:item:assign`) | Update detail, priority, deadline, reassign assignee (trigger notif `TASK_REASSIGNED`) + audit log |
| **A** | `moveKanbanTaskAction` | `tasks/actions/task.actions.ts` | `tasks:item:update` (`IN_REVIEW -> DONE`/`REVISION`: `tasks:item:approve`) | Transisi status Kanban + reorder `position` (`DOUBLE PRECISION`) + set `firstSubmittedAt` saat pertama masuk `IN_REVIEW` + hitung `isOnTime` via `effective_completion_time` saat `DONE` + optimistic `version` check + audit log |
| **A** | `toggleTaskChecklistAction` | `tasks/actions/task.actions.ts` | `tasks:item:update` | Centang/hapus sub-item checklist untuk kalkulasi progress persentase task |
| **A** | `addTaskCommentAction` | `tasks/actions/task.actions.ts` | `tasks:comment:create` | Tambah komentar task + notif `TASK_COMMENT_MENTION` ke assignee/creator/mentioned users |
| **A** | `softDeleteTaskAction` | `tasks/actions/task.actions.ts` | `tasks:item:delete` | Set `deletedAt = now()` (soft delete) + audit log |
| **B** | `upsertKpiTemplateAction` | `team-kpi/actions/kpi-template.actions.ts` | `kpi:template:manage` | Buat/ubah master template indikator KPI (`AUTO_TCR`, `AUTO_OTDR`, `AUTO_DQS`, `AUTO_CPVS`, `MANUAL_SCORE`) + audit log |
| **B** | `assignKpiMonthlyAction` | `team-kpi/actions/kpi-template.actions.ts` | `kpi:assignment:manage` | Tetapkan target & bobot `kpi_assignments` user per bulan (validasi total bobot = 100%, mendukung *Clone Previous Month*) + audit log |
| **B** | `generateMonthlyEvaluationAction` | `team-kpi/actions/evaluation.actions.ts` | `kpi:evaluation:create` | Tarik `kpi_assignments` user periode `YYYY-MM` + agregasi otomatis `AUTO_TCR`, `AUTO_OTDR`, `AUTO_DQS`, `AUTO_CPVS` dari `tasks`, `design_briefs`, & `content_items` -> simpan snapshot `DRAFT` |
| **B** | `updateEvaluationScoresAction` | `team-kpi/actions/evaluation.actions.ts` | `kpi:evaluation:review` | Isi/ubah skor kualitatif (`MANUAL_SCORE` skala 0–100) & `evaluatorNotes` saat status `DRAFT`/`SUBMITTED`/`REVIEWED` |
| **B** | `transitionEvaluationStatusAction` | `team-kpi/actions/evaluation.actions.ts` | `kpi:evaluation:submit` / `kpi:evaluation:review` (`FINALIZED`: `kpi:evaluation:finalize` — **`SUPER_ADMIN` ONLY**) | Transisi `DRAFT -> SUBMITTED -> REVIEWED -> FINALIZED` (kunci permanen snapshot + notif `KPI_EVALUATION_FINALIZED` + audit log) |
| **C** | `createContentIdeaAction` | `social-design/actions/content-idea.actions.ts` | `social:idea:create` | Ajukan ide konten ke `content_ideas` (`status: IDEA`) + notif ke PM |
| **C** | `reviewContentIdeaAction` | `social-design/actions/content-idea.actions.ts` | `social:idea:approve` | Approve (`APPROVED_IDEA`) atau arsipkan (`ARCHIVED`) ide konten + notif `CONTENT_IDEA_REVIEWED` ke pembuat ide + audit log |
| **C** | `createContentPlanAction` | `social-design/actions/content-plan.actions.ts` | `social:content:manage` (+ `design:brief:manage` bila ada brief) | **Atomic cross-module:** buat `content_items` (+ tandai ide asal `CONVERTED`), opsional `design_briefs` (`PENDING_BRIEF`), & auto-spawn linked `tasks` (`CONTENT_PRODUCTION` & `DESIGN_TASK`) + notif `DESIGN_BRIEF_ASSIGNED` + audit log |
| **C** | `updateContentScheduleAction` | `social-design/actions/content-plan.actions.ts` | `social:content:manage` (approve tayang: `social:content:approve`) | Ubah `plannedPublishAt`/status (`READY_TO_PUBLISH -> SCHEDULED -> PUBLISHED`) + sinkronisasi `dueDate` linked task |
| **C** | `submitDesignAction` | `social-design/actions/design.actions.ts` | `design:submission:create` | Designer submit versi `v(n+1)` via Storage file key atau link Figma/Canva -> status `SUBMITTED`, content `DESIGN_REVIEW`, linked task `IN_REVIEW` (+ `firstSubmittedAt`) + notif `DESIGN_SUBMITTED` |
| **C** | `reviewDesignSubmissionAction` | `social-design/actions/design.actions.ts` | `design:submission:approve` (**`SUPER_ADMIN` & `PROJECT_MANAGER` ONLY**) | **`APPROVE`:** submission `APPROVED`, content `READY_TO_PUBLISH`, linked design task `DONE` (`isOnTime` via `effective_completion_time`), **auto-promote ke `assets`** + notif `DESIGN_APPROVED`/`CONTENT_READY_TO_PUBLISH`; **`REQUEST_REVISION`:** notes min. 10 karakter, increment `revisionCount`, submission `REVISION_REQUESTED`, content `DESIGN_REVISION`, task `REVISION` + notif `DESIGN_REVISION_REQUESTED` |
| **C** | `upsertAssetAction` | `social-design/actions/asset.actions.ts` | `assets:library:manage` | Upload aset manual ke Asset Library atau update tags/kategori (`asset_category_enum`) + audit log |
| **C** | `upsertContentAnalyticsAction` | `social-design/actions/analytics.actions.ts` | `social:analytics:manage` | Catat/update metrik pasca-tayang (`reach`, `impressions`, `videoViews`, `likes`, `comments`, `shares`, `saves`, `clicks`) -> PostgreSQL generated columns hitung `engagement_rate` & `ctr` (`NUMERIC(6,2)`) otomatis |
| **D** | `createUserAction` | `system/actions/user.actions.ts` | `system:user:manage` | Buat user baru (hash password Argon2id/Bcrypt, `mustChangePassword = true`) + assign role + audit log |
| **D** | `updateUserAction` | `system/actions/user.actions.ts` | `system:user:manage` | Edit profil/divisi/role/status aktif user + increment `tokenVersion` untuk instant revocation jika role berubah atau dinonaktifkan + audit log |
| **D** | `resetUserPasswordAction` | `system/actions/user.actions.ts` | `system:user:manage` | Set temporary password ter-hash + `mustChangePassword = true` + increment `tokenVersion` + audit log (tanpa menyimpan plaintext di log!) |
| **D** | `updateRolePermissionsAction` | `system/actions/rbac.actions.ts` | `system:rbac:manage` | Sinkronisasi mapping `role_permissions` (guard proteksi agar `SUPER_ADMIN` tidak dapat kehilangan izin RBAC) |
| **D** | `publishAnnouncementAction` | `system/actions/announcement.actions.ts` | `system:announcement:manage` | Publikasi pengumuman (opsional `isPinned`, batas maks. **3 pinned aktif**, & target roles) + fan-out notif `ANNOUNCEMENT_PUBLISHED` ke target user aktif + audit log |
| **D** | `markAnnouncementReadAction` | `system/actions/announcement.actions.ts` | `system:announcement:read` | Catat `announcement_reads` (`readAt`) untuk user login |
| **D** | `markNotificationsReadAction` | `system/actions/notification.actions.ts` | `Authenticated (Self)` | Tandai 1 notifikasi atau semua notifikasi milik user login sebagai terbaca |

#### 2.2.2 Route Handlers (`/api/**`) Catalog (Read Queries, Export, Presign, Cron & Health)

| HTTP Method | Endpoint Path | File Path (`src/app/api/...`) | Auth / Permission | Tujuan & Format Respons |
| :--- | :--- | :--- | :--- | :--- |
| `GET, POST` | `/api/auth/[...nextauth]` | `auth/[...nextauth]/route.ts` | Public | Auth.js v5 Credentials sign-in, session check (maks. 7 hari sliding + `tokenVersion`), sign-out |
| `GET` | `/api/health` | `health/route.ts` | Public (no secret) | Liveness probe: `{ status: "ok", db: "connected", timestamp }` |
| `GET` | `/api/tasks/board` | `tasks/board/route.ts` | `tasks:item:read` | Query Kanban grouped by `TaskStatus` (filter: `projectId`, `assigneeId`, `priority`, `taskType`, `q`) |
| `GET` | `/api/tasks/calendar` | `tasks/calendar/route.ts` | `tasks:item:read` | Query task berdasarkan rentang `from`..`to` (ISO date) untuk Work Calendar |
| `GET` | `/api/tasks/[taskId]` | `tasks/[taskId]/route.ts` | `tasks:item:read` | Full detail task (checklists, comments, linked content item & design brief) untuk `TaskDetailDrawer` |
| `GET` | `/api/content/calendar` | `content/calendar/route.ts` | `social:content:read` | Query `content_items` berdasarkan `month` (`YYYY-MM`), `platform`, `status`, `creatorId` |
| `GET` | `/api/content/analytics/summary` | `content/analytics/summary/route.ts` | `social:content:read` | Agregasi KPI konten (total reach, impressions, avg ER%, avg CTR%, top 5 konten, breakdown per platform) untuk Recharts |
| `GET` | `/api/assets` | `assets/route.ts` | `assets:library:read` | Paginated search Asset Library (`q`, `tags`, `category`, `page`, `limit`) |
| `GET` | `/api/kpi/dashboard` | `kpi/dashboard/route.ts` | `kpi:performance:read_team` | Agregasi metrik tim bulanan/kuartalan untuk Team Performance Dashboard (`Recharts`) |
| `GET` | `/api/kpi/reports/export` | `kpi/reports/export/route.ts` | `kpi:report:export` | Stream file `text/csv; charset=utf-8` laporan KPI bulanan dengan BOM agar rapi saat dibuka di Excel |
| `POST` | `/api/uploads/presign` | `uploads/presign/route.ts` | `design:submission:create`, `assets:library:manage`, atau `tasks:item:update` (Avatar: `Authenticated (Self)`) | Validasi MIME (`PNG/JPG/WEBP/SVG/PDF/MP4`) & ukuran file (maks **25 MB**, Avatar **2 MB**), mengembalikan Supabase Storage signed PUT URL (TTL **300 detik / 5 menit**) + `storageKey` |
| `GET` | `/api/uploads/download-url` | `uploads/download-url/route.ts` | Authenticated (RBAC cek akses entitas terkait) | Generate signed GET URL berumur pendek untuk preview/download file private bucket (memaksa `Content-Disposition: attachment` untuk `image/svg+xml` guna mencegah XSS) |
| `GET` | `/api/notifications/unread` | `notifications/unread/route.ts` | Authenticated (Self) | Polling ringan **30 detik**: `{ unreadCount, items[] }` (maks 15 item terbaru) |
| `GET` | `/api/activity-logs` | `activity-logs/route.ts` | `system:audit_log:read` | Paginated immutable audit trail (`module`, `actorId`, `entityType`, `from`, `to`, `format=json\|csv`) |
| `POST, GET` | `/api/cron/deadline-alerts` | `cron/deadline-alerts/route.ts` | Header `Authorization: Bearer <CRON_SECRET>` | Vercel Cron harian **08:00 WIB**: scan task aktif mendekati/melewati deadline lalu dispatch notifikasi idempoten H-2 (`TASK_DEADLINE_SOON`), H-0 (`TASK_DEADLINE_TODAY`), dan H+1 & H+3 (`TASK_OVERDUE`) |

---

### 2.3 Kontrak Payload TypeScript Interfaces & Contoh JSON Request/Response

Seluruh kontrak di bawah ini siap disalin langsung ke dalam file `schemas/*.ts` dan `types.ts` masing-masing fitur.

#### Kontrak 1 — Modul A: Create Task & Move Task di Kanban Board

```typescript
// src/features/tasks/types.ts
export type TaskStatus =
  | "BACKLOG"
  | "TODO"
  | "IN_PROGRESS"
  | "IN_REVIEW"
  | "REVISION"
  | "DONE"
  | "CANCELLED";

export type TaskType = "GENERAL" | "CONTENT_PRODUCTION" | "DESIGN_TASK";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string;
  taskType: TaskType;
  priority: TaskPriority;
  status?: Extract<TaskStatus, "BACKLOG" | "TODO" | "IN_PROGRESS">;
  assigneeId: string;
  dueDate: string; // ISO-8601 TIMESTAMPTZ
  checklists?: Array<{ title: string }>;
}

export interface MoveKanbanTaskInput {
  taskId: string;
  targetStatus: TaskStatus;
  targetPosition: number; // Fractional DOUBLE PRECISION gap positioning (65536, 131072, midpoint 98304)
  expectedVersion: number; // Optimistic locking mencegah tabrakan concurrent DnD
}

export interface TaskSummaryDTO {
  id: string;
  projectId: string;
  title: string;
  taskType: TaskType;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  version: number;
  assignee: { id: string; name: string; avatarUrl: string | null };
  dueDate: string;
  firstSubmittedAt: string | null;
  completedAt: string | null;
  revisionCount: number;
  isOverdue: boolean;
  linkedContentItemId: string | null;
  linkedDesignBriefId: string | null;
}
```

**Contoh Request JSON (`moveKanbanTaskAction`):**

```json
{
  "taskId": "8f2c1b4e-9d3a-4b11-9c7e-2e5a1d904b12",
  "targetStatus": "IN_REVIEW",
  "targetPosition": 98304,
  "expectedVersion": 3
}
```

**Contoh Response JSON Sukses (`ActionResult<TaskSummaryDTO>`):**

```json
{
  "success": true,
  "message": "Status task berhasil dipindahkan ke IN_REVIEW.",
  "data": {
    "id": "8f2c1b4e-9d3a-4b11-9c7e-2e5a1d904b12",
    "projectId": "2a4e7c10-6b89-4f22-a311-90c8e7d6a543",
    "title": "Audit SEO Landing Page Krevia Q4",
    "taskType": "GENERAL",
    "status": "IN_REVIEW",
    "priority": "HIGH",
    "position": 98304,
    "version": 4,
    "assignee": {
      "id": "usr_yoga_001",
      "name": "Mhd Yoga Andhika",
      "avatarUrl": null
    },
    "dueDate": "2026-11-24T17:00:00+07:00",
    "firstSubmittedAt": "2026-11-23T14:10:00+07:00",
    "completedAt": null,
    "revisionCount": 0,
    "isOverdue": false,
    "linkedContentItemId": null,
    "linkedDesignBriefId": null
  }
}
```

**Contoh Response JSON Error Concurrency (Trigger Optimistic Rollback di UI):**

```json
{
  "success": false,
  "error": {
    "code": "CONFLICT",
    "message": "Task baru saja diperbarui oleh anggota tim lain. Board disinkronkan ulang."
  }
}
```

---

#### Kontrak 2 — Modul C -> A: Create Content Plan + Auto-Spawn Design Brief & Unified Tasks

```typescript
// src/features/social-design/types.ts
export type ContentStatus =
  | "IDEA"
  | "APPROVED_IDEA"
  | "PLANNING"
  | "IN_DESIGN"
  | "DESIGN_REVIEW"
  | "DESIGN_REVISION"
  | "READY_TO_PUBLISH"
  | "SCHEDULED"
  | "PUBLISHED"
  | "ARCHIVED";

export type SocialPlatform =
  | "INSTAGRAM"
  | "TIKTOK"
  | "LINKEDIN"
  | "YOUTUBE"
  | "X_TWITTER"
  | "FACEBOOK"
  | "WEBSITE_BLOG";

export type ContentFormat =
  | "REELS"
  | "CAROUSEL"
  | "SINGLE_POST"
  | "STORY"
  | "SHORT_VIDEO"
  | "LONG_VIDEO"
  | "ARTICLE"
  | "INFOGRAPHIC";

export interface CreateContentPlanInput {
  projectId: string;
  ideaId?: string | null;
  title: string;
  platform: SocialPlatform;
  format: ContentFormat;
  contentPillar: string;
  captionDraft: string;
  plannedPublishAt: string; // ISO-8601 (kolom content_items.planned_publish_at)
  creatorId: string; // kolom content_items.creator_id
  requiresDesign: boolean;
  designBrief?: {
    designerId: string;
    designDeadline: string; // Wajib < plannedPublishAt
    visualDirection: string;
    copyOnDesign: string;
    referenceUrls: string[];
    aspectRatio: "4:5" | "9:16" | "1:1" | "16:9";
  };
}

export interface CreateContentPlanOutput {
  contentItem: {
    id: string;
    title: string;
    status: ContentStatus;
    platform: SocialPlatform;
    plannedPublishAt: string;
  };
  designBriefId: string | null;
  spawnedTasks: Array<{
    taskId: string;
    taskType: "CONTENT_PRODUCTION" | "DESIGN_TASK";
    assigneeId: string;
    status: "TODO";
    dueDate: string;
  }>;
}
```

**Contoh Request JSON (`createContentPlanAction`):**

```json
{
  "projectId": "prj_social_nov_2026",
  "ideaId": "idea_9a12b34c-5d6e-4f7a-8b9c-0d1e2f3a4b5c",
  "title": "Carousel 5 Alasan Bisnis Butuh Sistem Operasional Terpusat",
  "platform": "INSTAGRAM",
  "format": "CAROUSEL",
  "contentPillar": "Educational / Authority",
  "captionDraft": "Masih kelola task tim di chat dan spreadsheet terpisah? Ini 5 tanda operasional butuh upgrade...",
  "plannedPublishAt": "2026-11-28T10:00:00+07:00",
  "creatorId": "usr_creator_003",
  "requiresDesign": true,
  "designBrief": {
    "designerId": "usr_designer_004",
    "designDeadline": "2026-11-26T16:00:00+07:00",
    "visualDirection": "Clean dark-navy Krevia brand style, 6 slide, kontras tinggi untuk mobile feed",
    "copyOnDesign": "Slide 1: Operasional Tim Berantakan? | Slide 2-5: 5 Masalah & Solusi | Slide 6: CTA Krevia Digital",
    "referenceUrls": ["https://www.figma.com/file/krevia-carousel-template-v2"],
    "aspectRatio": "4:5"
  }
}
```

**Contoh Response JSON Sukses (`ActionResult<CreateContentPlanOutput>`):**

```json
{
  "success": true,
  "message": "Content plan dibuat; 1 Design Brief dan 2 Task otomatis muncul di Kanban & Calendar.",
  "data": {
    "contentItem": {
      "id": "cnt_71b2e4c9-1a2b-4c3d-9e8f-1234567890ab",
      "title": "Carousel 5 Alasan Bisnis Butuh Sistem Operasional Terpusat",
      "status": "IN_DESIGN",
      "platform": "INSTAGRAM",
      "plannedPublishAt": "2026-11-28T10:00:00+07:00"
    },
    "designBriefId": "brf_44c8d1e2-3f4a-4b5c-8d7e-9876543210fe",
    "spawnedTasks": [
      {
        "taskId": "tsk_101a2b3c-4d5e-4f6a-8b7c-112233445566",
        "taskType": "CONTENT_PRODUCTION",
        "assigneeId": "usr_creator_003",
        "status": "TODO",
        "dueDate": "2026-11-28T10:00:00+07:00"
      },
      {
        "taskId": "tsk_202b3c4d-5e6f-4a7b-9c8d-665544332211",
        "taskType": "DESIGN_TASK",
        "assigneeId": "usr_designer_004",
        "status": "TODO",
        "dueDate": "2026-11-26T16:00:00+07:00"
      }
    ]
  }
}
```

---

#### Kontrak 3 — Modul C -> A/D: Submit Design & Approve / Request Revision Loop

```typescript
// src/features/social-design/types.ts (lanjutan)
export type DesignSubmissionStatus =
  | "PENDING_BRIEF"
  | "IN_PROGRESS"
  | "SUBMITTED"
  | "REVISION_REQUESTED"
  | "APPROVED";

export interface SubmitDesignInput {
  designBriefId: string;
  deliveryMode: "UPLOADED_FILE" | "EXTERNAL_LINK";
  storageKey?: string; // Diisi jika UPLOADED_FILE (hasil POST /api/uploads/presign)
  externalUrl?: string; // Diisi jika EXTERNAL_LINK (Figma/Canva/GDrive)
  fileName: string;
  mimeType?: string;
  fileSizeBytes?: number;
  designerNotes?: string;
}

export interface ReviewDesignSubmissionInput {
  submissionId: string;
  decision: "APPROVE" | "REQUEST_REVISION";
  feedbackNotes: string; // Wajib minimal 10 karakter jika REQUEST_REVISION
  promoteToAssetLibrary?: boolean; // Default true saat APPROVE
  assetTags?: string[];
}

export interface ReviewDesignSubmissionOutput {
  submissionId: string;
  versionNumber: number;
  submissionStatus: DesignSubmissionStatus;
  syncedContentStatus: ContentStatus;
  syncedTaskStatus: TaskStatus;
  totalRevisionCount: number;
  promotedAssetId: string | null;
}
```

**Contoh Request JSON (`reviewDesignSubmissionAction` — Skenario Request Revision):**

```json
{
  "submissionId": "sub_55d9e0f1-2a3b-4c5d-8e9f-001122334455",
  "decision": "REQUEST_REVISION",
  "feedbackNotes": "Slide 3 font body terlalu kecil saat dilihat di layar HP; tolong naikkan kontras CTA di slide 6."
}
```

**Contoh Response JSON (`reviewDesignSubmissionAction` — Skenario Approve + Auto-Promote Asset):**

```json
{
  "success": true,
  "message": "Desain v2 disetujui. File otomatis tersimpan di Asset Library dan status konten menjadi READY_TO_PUBLISH.",
  "data": {
    "submissionId": "sub_66e0f1a2-3b4c-4d5e-9f0a-554433221100",
    "versionNumber": 2,
    "submissionStatus": "APPROVED",
    "syncedContentStatus": "READY_TO_PUBLISH",
    "syncedTaskStatus": "DONE",
    "totalRevisionCount": 1,
    "promotedAssetId": "ast_88a1b2c3-4d5e-4f6a-9b8c-998877665544"
  }
}
```

---

#### Kontrak 4 — Modul B: Generate Auto-Aggregated KPI Snapshot & Finalize Monthly Evaluation

```typescript
// src/features/team-kpi/types.ts
export type EvaluationStatus = "DRAFT" | "SUBMITTED" | "REVIEWED" | "FINALIZED";

export type KpiMetricSource =
  | "AUTO_TCR"
  | "AUTO_OTDR"
  | "AUTO_DQS"
  | "AUTO_CPVS"
  | "MANUAL_SCORE";

export type KpiMetricUnit = "PERCENTAGE" | "COUNT" | "SCORE_100" | "RATIO";

export interface GenerateMonthlyEvaluationInput {
  userId: string;
  periodMonth: string; // Format ketat "YYYY-MM" (dipetakan ke period_year & period_month), menarik seluruh kpi_assignments aktif user pada periode tersebut
}

export interface EvaluationMetricItemDTO {
  id: string;
  indicatorName: string;
  metricSource: KpiMetricSource;
  weightPercent: number; // Total seluruh item pada kpi_assignments = 100
  targetValue: number;
  actualValue: number | null; // null = N/A (jika denominator 0 atau skor manual belum diisi)
  achievementScore: number | null; // Skala 0.00 - 100.00 (untuk TCR/OTDR/DQS: S_k = actualValue; null jika N/A)
  weightedScore: number | null; // Kontribusi nominal (achievementScore * weightPercent) / 100; null jika N/A
  unit: KpiMetricUnit;
}

export interface MonthlyEvaluationDTO {
  id: string;
  userId: string;
  userName: string;
  userRole: "SUPER_ADMIN" | "PROJECT_MANAGER" | "STAFF_CREATOR" | "DESIGNER";
  periodMonth: string; // "YYYY-MM"
  status: EvaluationStatus;
  autoMetricsSnapshot: {
    totalAssignedTasks: number;
    completedTasks: number;
    onTimeCompletedTasks: number;
    taskCompletionRate: number | null; // TCR (%), null = N/A
    onTimeDeliveryRate: number | null; // OTDR (%) berbasis effective_completion_time, null = N/A
    designQualityScore: number | null; // DQS = ROUND(AVG(GREATEST(40, 100 - 15 * revision_count)), 2), null = N/A
    avgDesignRevisionCount: number | null;
    firstPassApprovalRate: number | null; // FPAR (%), null = N/A
    contentDeliveredCount: number; // C_delivered (status SCHEDULED/PUBLISHED pada bulan M)
    snapshotGeneratedAt: string;
  };
  items: EvaluationMetricItemDTO[];
  activeWeightPercent: number; // Jumlah bobot indikator non-N/A untuk weight re-normalization
  weightedKpiScore: number; // ROUND(SUM(S_k * w_k) / SUM(w_k_active), 2), batas 0.00 - 100.00
  grade: "A" | "B" | "C" | "D"; // A: 90-100, B: 80-89.99, C: 70-79.99, D: 0-69.99
  evaluatorNotes: string | null;
  finalizedAt: string | null;
  finalizedById: string | null;
}

export interface FinalizeMonthlyEvaluationInput {
  evaluationId: string;
  evaluatorNotes: string;
  confirmLock: true; // Guard eksplisit: hanya SUPER_ADMIN (kpi:evaluation:finalize); tidak dapat diubah setelah FINALIZED
}
```

**Contoh Request JSON (`generateMonthlyEvaluationAction`):**

```json
{
  "userId": "usr_designer_004",
  "periodMonth": "2026-11"
}
```

**Contoh Response JSON Sukses (`ActionResult<MonthlyEvaluationDTO>` — Default Bobot Designer 25/25/30/20 + Weight Re-Normalization saat `MANUAL_SCORE` belum diisi):**

```json
{
  "success": true,
  "message": "Draft evaluasi KPI periode 2026-11 berhasil digenerate dari kpi_assignments & data operasional aktual.",
  "data": {
    "id": "evl_99c2d3e4-5f6a-4b7c-8d9e-1029384756ab",
    "userId": "usr_designer_004",
    "userName": "Raka Pratama",
    "userRole": "DESIGNER",
    "periodMonth": "2026-11",
    "status": "DRAFT",
    "autoMetricsSnapshot": {
      "totalAssignedTasks": 20,
      "completedTasks": 19,
      "onTimeCompletedTasks": 18,
      "taskCompletionRate": 95.0,
      "onTimeDeliveryRate": 94.74,
      "designQualityScore": 92.5,
      "avgDesignRevisionCount": 0.5,
      "firstPassApprovalRate": 60.0,
      "contentDeliveredCount": 0,
      "snapshotGeneratedAt": "2026-11-30T09:15:00+07:00"
    },
    "items": [
      {
        "id": "evi_01",
        "indicatorName": "Task Completion Rate (TCR)",
        "metricSource": "AUTO_TCR",
        "weightPercent": 25,
        "targetValue": 90.0,
        "actualValue": 95.0,
        "achievementScore": 95.0,
        "weightedScore": 23.75,
        "unit": "PERCENTAGE"
      },
      {
        "id": "evi_02",
        "indicatorName": "On-Time Delivery Rate (OTDR)",
        "metricSource": "AUTO_OTDR",
        "weightPercent": 25,
        "targetValue": 90.0,
        "actualValue": 94.74,
        "achievementScore": 94.74,
        "weightedScore": 23.69,
        "unit": "PERCENTAGE"
      },
      {
        "id": "evi_03",
        "indicatorName": "Design Quality Score (DQS)",
        "metricSource": "AUTO_DQS",
        "weightPercent": 30,
        "targetValue": 85.0,
        "actualValue": 92.5,
        "achievementScore": 92.5,
        "weightedScore": 27.75,
        "unit": "SCORE_100"
      },
      {
        "id": "evi_04",
        "indicatorName": "Kualitas Visual, Inisiatif & Kolaborasi (Penilaian PM)",
        "metricSource": "MANUAL_SCORE",
        "weightPercent": 20,
        "targetValue": 85.0,
        "actualValue": null,
        "achievementScore": null,
        "weightedScore": null,
        "unit": "SCORE_100"
      }
    ],
    "activeWeightPercent": 80,
    "weightedKpiScore": 93.98,
    "grade": "A",
    "evaluatorNotes": null,
    "finalizedAt": null,
    "finalizedById": null
  }
}
```

---

#### Kontrak 5 — Modul D: Broadcast Announcement, Polling Notifications & Activity Logs

```typescript
// src/features/system/types.ts
export interface PublishAnnouncementInput {
  title: string;
  bodyMarkdown: string;
  priority: "INFO" | "IMPORTANT" | "URGENT";
  isPinned: boolean;
  targetRoles: Array<"SUPER_ADMIN" | "PROJECT_MANAGER" | "STAFF_CREATOR" | "DESIGNER">;
  expiresAt?: string | null;
}

export type NotificationType =
  | "TASK_ASSIGNED"
  | "TASK_REASSIGNED"
  | "TASK_STATUS_CHANGED"
  | "TASK_SUBMITTED_REVIEW"
  | "TASK_REVISION_REQUESTED"
  | "TASK_COMPLETED"
  | "TASK_COMMENT_MENTION"
  | "TASK_DEADLINE_SOON"
  | "TASK_DEADLINE_TODAY"
  | "TASK_OVERDUE"
  | "CONTENT_IDEA_REVIEWED"
  | "CONTENT_READY_TO_PUBLISH"
  | "DESIGN_BRIEF_ASSIGNED"
  | "DESIGN_SUBMITTED"
  | "DESIGN_REVISION_REQUESTED"
  | "DESIGN_APPROVED"
  | "KPI_EVALUATION_OPEN"
  | "KPI_EVALUATION_SUBMITTED"
  | "KPI_EVALUATION_FINALIZED"
  | "ANNOUNCEMENT_PUBLISHED"
  | "SYSTEM_ALERT";

export interface UnreadNotificationsResponse {
  unreadCount: number;
  items: Array<{
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    actionUrl: string;
    isRead: boolean;
    createdAt: string;
  }>;
}

export interface ActivityLogsQueryResponse {
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
  items: Array<{
    id: string;
    actor: { id: string; name: string; role: string } | null;
    module: "TASKS" | "TEAM_KPI" | "SOCIAL_DESIGN" | "SYSTEM";
    action: string;
    entityType: string;
    entityId: string | null;
    summary: string;
    oldValues: Record<string, unknown> | null;
    newValues: Record<string, unknown> | null;
    createdAt: string;
  }>;
}
```

**Contoh Request JSON (`publishAnnouncementAction`):**

```json
{
  "title": "Jadwal Content Planning & Review KPI Bulan Desember 2026",
  "bodyMarkdown": "Seluruh Content Creator dan Designer harap menyelesaikan draft kalender konten minggu ke-1 sebelum Jumat pukul 15:00 WIB.",
  "priority": "IMPORTANT",
  "isPinned": true,
  "targetRoles": ["PROJECT_MANAGER", "STAFF_CREATOR", "DESIGNER"],
  "expiresAt": "2026-12-05T23:59:59+07:00"
}
```

**Contoh Response JSON (`GET /api/notifications/unread`):**

```json
{
  "unreadCount": 2,
  "items": [
    {
      "id": "ntf_a1b2c3d4-1111-4222-8333-444455556666",
      "type": "DESIGN_REVISION_REQUESTED",
      "title": "Revisi Diminta: Carousel 5 Alasan Bisnis",
      "message": "PM meminta penyesuaian ukuran font slide 3 dan kontras tombol CTA slide 6.",
      "actionUrl": "/design/workspace?briefId=brf_44c8d1e2-3f4a-4b5c-8d7e-9876543210fe",
      "isRead": false,
      "createdAt": "2026-11-25T14:22:10+07:00"
    },
    {
      "id": "ntf_e5f6a7b8-2222-4333-8444-555566667777",
      "type": "ANNOUNCEMENT_PUBLISHED",
      "title": "Pengumuman Baru: Jadwal Content Planning Desember 2026",
      "message": "Dipublikasikan oleh Leadership Krevia Digital.",
      "actionUrl": "/announcements",
      "isRead": false,
      "createdAt": "2026-11-25T10:00:00+07:00"
    }
  ]
}
```

**Contoh Response JSON (`GET /api/activity-logs?module=SOCIAL_DESIGN&page=1&limit=20`):**

```json
{
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 142,
    "totalPages": 8
  },
  "items": [
    {
      "id": "log_77a8b9c0-1234-4567-89ab-cdef01234567",
      "actor": {
        "id": "usr_pm_002",
        "name": "Nta",
        "role": "PROJECT_MANAGER"
      },
      "module": "SOCIAL_DESIGN",
      "action": "design:submission:approved",
      "entityType": "DESIGN_SUBMISSION",
      "entityId": "sub_66e0f1a2-3b4c-4d5e-9f0a-554433221100",
      "summary": "Nta menyetujui desain v2 Carousel 5 Alasan Bisnis dan mempromosikan aset ke Asset Library",
      "oldValues": { "status": "SUBMITTED" },
      "newValues": {
        "status": "APPROVED",
        "promotedAssetId": "ast_88a1b2c3-4d5e-4f6a-9b8c-998877665544"
      },
      "createdAt": "2026-11-26T11:45:02+07:00"
    }
  ]
}
```

---

#### Kontrak 6 — Shared Storage: Presigned Upload URL (`POST /api/uploads/presign`)

```typescript
// src/server/storage/presigned.ts
export interface PresignUploadRequest {
  bucketFolder: "design-submissions" | "assets" | "task-attachments" | "avatars";
  fileName: string;
  mimeType:
    | "image/png"
    | "image/jpeg"
    | "image/webp"
    | "image/svg+xml"
    | "application/pdf"
    | "video/mp4";
  fileSizeBytes: number; // Maksimum 26_214_400 (25 MB) untuk Design/Asset/Attachment, 2_097_152 (2 MB) untuk Avatar; file > 25 MB gunakan External Link
}

export interface PresignUploadResponse {
  uploadUrl: string; // Signed PUT URL valid 300 detik (5 menit)
  storageKey: string; // Disimpan ke DB, misal "design-submissions/2026-11/uuid-file.png"
  expiresInSeconds: number;
}
```

**Contoh Request JSON (`POST /api/uploads/presign`):**

```json
{
  "bucketFolder": "design-submissions",
  "fileName": "carousel-operasional-v2.png",
  "mimeType": "image/png",
  "fileSizeBytes": 3482910
}
```

**Contoh Response JSON (`200 OK`):**

```json
{
  "uploadUrl": "https://krevia-ktms.supabase.co/storage/v1/object/upload/sign/ktms-media/design-submissions/2026-11/9f1c2d3e-carousel-operasional-v2.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cmwiOiJrdG1zLW1lZGlhIiwiZXhwIjoxNzY0MDY5MTIwfQ.kreviaSignedMockSig",
  "storageKey": "design-submissions/2026-11/9f1c2d3e-carousel-operasional-v2.png",
  "expiresInSeconds": 300
}
```

---

## Bagian 3: Pembagian Kerja & Roadmap Eksekusi Harian 14 Hari (Mhd Yoga Andhika & Nta)

### 3.1 Pembagian Ownership & Strategi Anti-Konflik Merge

Agar 2 developer dapat bekerja dengan kecepatan tinggi tanpa saling menimpa file (*merge conflict*), pembagian kerja menggunakan strategi **Vertical Slice Ownership** yang dipadukan dengan **Shared Interface Contract** yang dibekukan pada **Hari 4 (Gate 1)**.

| Dimensi | **Mhd Yoga Andhika** (Track A — Core Platform, Modul A & Modul D) | **Nta** (Track B — Design System/UI Shell, Modul C & Modul B) |
| :--- | :--- | :--- |
| **Peran Utama** | Platform & Backend Lead + Full-Stack Modul A & D | UI/UX Frontend Lead + Full-Stack Modul C & B |
| **Fondasi Bersama (Hari 5–7)** | Inisialisasi Repo, CI/CD Vercel + Supabase, `prisma/schema.prisma`, `prisma/seed.ts`, Auth.js v5, RBAC Guard (`src/server/auth/`), `safe-action.ts`, `audit-logger.ts`, `notification-dispatcher.ts` | Konfigurasi Tailwind + shadcn/ui Design System, App Shell (`AppSidebar`, `AppTopbar`, `GlobalSlideOverHost`), komponen shared (`DataTable`, `StatusBadge`, `FileUploadDropzone`), dan `POST /api/uploads/presign` UI hook |
| **Kepemilikan Modul Eksklusif** | **Modul A (`src/features/tasks/`)**: Projects, My Tasks, Kanban Board (`@dnd-kit`), Work Calendar, `TaskDetailDrawer` + **Modul D (`src/features/system/`)**: User Management, RBAC Matrix, Notification Center, Announcements, Activity Logs + Executive Home `/` | **Modul C (`src/features/social-design/`)**: Content Ideas, Content Calendar, Content Planning + Auto-Task Consumer, Design Workspace, Approval & Revision Loop, Asset Library, Content Analytics + **Modul B (`src/features/team-kpi/`)**: Team Directory, Individual Performance, KPI Templates, Team Dashboard (`Recharts`), Monthly Evaluation, Reports & CSV Export |
| **Direktori Eksklusif (Nol Konflik)** | `src/features/tasks/**`, `src/features/system/**`, `src/server/auth/**`, `src/server/services/**`, `src/app/(dashboard)/projects/**`, `src/app/(dashboard)/tasks/**`, `src/app/(dashboard)/system/**` | `src/features/social-design/**`, `src/features/team-kpi/**`, `src/components/layout/**`, `src/components/shared/**`, `src/app/(dashboard)/content/**`, `src/app/(dashboard)/design/**`, `src/app/(dashboard)/assets/**`, `src/app/(dashboard)/team/**`, `src/app/(dashboard)/kpi/**` |
| **Kontrak Integrasi Lintas Modul** | Menyediakan fungsi internal siap pakai di Hari 7–8: `taskService.spawnLinkedTask(tx, input)`, `writeAuditLog(tx, input)`, `dispatchNotifications(tx, input)` | Memanggil fungsi Yoga di dalam `prisma.$transaction()` saat membuat Content Plan, Approve/Revise Design, dan Finalize KPI; membaca tabel `tasks` & `design_submissions` untuk agregasi KPI |

> **Aturan File Bersama (*Shared-Touch Files*):** File `prisma/schema.prisma`, `src/lib/constants/enums.ts`, `src/lib/constants/permissions.ts`, `src/lib/constants/navigation.ts`, dan `package.json` hanya boleh diubah melalui PR kecil tersendiri dengan pemberitahuan langsung di grup sync Yoga–Nta dan review SLA **maksimal 1 jam**.

#### Visualisasi Alur 14 Hari & 3 Formal Demo Gate ke Leadership

```mermaid
flowchart LR
    W1A["Hari 1-3: SRS, UX Flows, Wireframe Figma & ERD Final"] --> G1["GATE 1 (Hari 4): Blueprint & Design Sign-Off Leadership"]
    G1 --> W1B["Hari 5-7: Repo Init, Prisma+Seed, Auth RBAC, App Shell & Staging LIVE"]
    W1B --> W2A["Hari 8-10: Core Sprint Modul A+D (Yoga) & Modul C+B Dasar (Nta)"]
    W2A --> G2["GATE 2 (Hari 10): Mid-Sprint Live Staging Demo ke Leadership"]
    G2 --> W2B["Hari 11-12: KPI Engine, Audit Logs, Dashboard & Feature Freeze"]
    W2B --> W2C["Hari 13: QA Silang, RBAC Security Test, Bug Fix & UAT Dry-Run"]
    W2C --> G3["GATE 3 (Hari 14): UAT Sign-Off, Production Go-Live & Handover"]
```

---

### 3.2 Jadwal Harian Detail — Minggu 1 (Hari 1–7): Analisis, Desain & Fondasi

Minggu 1 memastikan **tidak ada kode yang ditulis tanpa arah yang disetujui Leadership**, sekaligus menuntaskan seluruh infrastruktur berat (Database, Auth, RBAC, App Shell, Staging URL) sehingga Minggu 2 murni fokus melahirkan fitur bisnis.

| Hari | Fokus Utama | Tugas Spesifik **Mhd Yoga Andhika** | Tugas Spesifik **Nta** | Deliverable Terukur & Bukti Progres ke Leadership |
| :--- | :--- | :--- | :--- | :--- |
| **Hari 1** | Alignment Kebutuhan, Scope Guardrails & Arsitektur Teknis | Menyusun & memvalidasi SRS Modul A & D, memetakan kebutuhan RBAC 4 role, finalisasi pilihan stack (Next.js 15 + Supabase PostgreSQL + Prisma + Vercel) & daftar *V1 Out-of-Scope*. | Menyusun & memvalidasi SRS Modul B & C (mengaudit spreadsheet konten Krevia yang ada saat ini agar semua kolom penting terakomodasi di Content Calendar), memetakan formula KPI. | Dokumen **SRS (`01-product-srs.md`) & MoSCoW V1** selesai + daftar 4 role & 25 sub-fitur diposting ke grup Leadership. |
| **Hari 2** | System Flows, Use Cases & Wireframe Low-Fidelity | Merancang End-to-End Flow Skenario 1 (Project/Task) & Skenario 4 (Notif/Audit), menyusun State Transition Matrix Task, serta menyiapkan arsitektur Route & API Contract. | Merancang Sitemap/Navigasi Sidebar RBAC, End-to-End Flow Skenario 2 (Content/Design Revision Loop) & Skenario 3 (KPI Bulanan), serta sketsa wireframe halaman utama di Figma. | Dokumen **System Flows & Use Cases (`02-system-flows-use-cases.md`)** + link **Figma Low-Fi Wireframe** seluruh 4 modul. |
| **Hari 3** | Database/ERD Finalization & High-Fidelity UI Design | Menyelesaikan ERD lengkap 25 tabel, PostgreSQL ENUM, Composite Indexes, RBAC Permission Matrix (`module:resource:action`), serta kontrak JSON/TS (`03` & `04`). | Menyelesaikan **Figma Hi-Fi Mockup** halaman kunci (Dashboard, Kanban Board, Content Calendar, Design Approval Drawer, KPI Evaluation, Activity Logs) + Design Tokens (warna, tipografi, badge status). | Dokumen **ERD & DB Schema (`03-database-backend.md`)**, **Arsitektur Next.js (`04-nextjs-architecture-roadmap.md`)**, & **Figma Hi-Fi Clickable Prototype**. |
| **Hari 4** | **DEMO GATE 1: Pre-Coding Sign-Off & Infra Provisioning** | Mempresentasikan Arsitektur, ERD, RBAC & Roadmap 14 Hari ke Leadership; setelah *sign-off*, langsung provisioning GitHub Repo, Supabase Project (Dev & Prod), dan Vercel Project. | Mempresentasikan Figma Prototype & Alur Operasional (Task, Content/Design, KPI) ke Leadership; mencatat revisi minor UI (maks 2 jam penyesuaian) dan membekukan Design System V1. | **Berita Acara / Persetujuan Gate 1 dari Leadership** + URL GitHub Repo & Environment Supabase/Vercel aktif. |
| **Hari 5** | Repository Boilerplate, Prisma Schema & UI Design System | Setup Next.js 15 + TypeScript strict + ESLint + GitHub Actions CI; implementasi penuh `prisma/schema.prisma` (semua tabel & enum), jalankan migrasi awal, dan tulis `prisma/seed.ts` (4 role + permission matrix + 4 akun demo). | Install & konfigurasi Tailwind CSS, shadcn/ui primitives (`src/components/ui/`), `StatusBadge` & `PriorityBadge` untuk semua canonical enum, `DataTable` reusable, dan halaman `/login`. | PR #1 & #2 ter-merge ke `dev`: **Database PostgreSQL ter-migrasi + seeded** (bukti screenshot Prisma Studio) & **Halaman Login + UI Kit Showcase** live di Vercel Preview. |
| **Hari 6** | Auth.js v5, RBAC Guard, Safe Action & App Shell | Implementasi Auth.js v5 (Credentials + Argon2id/Bcrypt + session permissions), `src/middleware.ts`, `rbac.ts`, `safe-action.ts`, `audit-logger.ts`, `notification-dispatcher.ts`, dan `GET /api/health`. | Bangun `AppSidebar` (menu otomatis filter sesuai role login), `AppTopbar` (Breadcrumb, Quick Create, User Menu), `PinnedAnnouncementBanner`, `GlobalSlideOverHost`, dan `AppProviders` (React Query + `nuqs` + Sonner). | **Staging Vercel Preview LIVE:** Leadership bisa login menggunakan 4 akun role berbeda dan melihat navigasi sidebar berubah otomatis sesuai RBAC + `/api/health` hijau. |
| **Hari 7** | Cross-Module Shared Plumbing & Ready-for-Sprint Verification | Implementasi `task.service.ts` (`spawnLinkedTask(tx)` + fractional `65536` gap positioning helper) dan unit-test integrasi DB untuk atomic transaction + audit log; review PR Nta untuk Storage Presign & Download URL. | Implementasi `POST /api/uploads/presign` (Supabase Storage signed PUT TTL 300s + validasi MIME/25MB & Avatar 2MB), `GET /api/uploads/download-url` (signed GET private bucket + `Content-Disposition: attachment` untuk SVG), `FileUploadDropzone`, serta skeleton halaman Modul B & C. | **Demo Singkat 2 Menit (Loom/Video):** Upload & download file desain via Supabase Storage berhasil & uji `spawnLinkedTask` otomatis menulis `tasks` + `activity_logs` dalam 1 transaksi. |

---

### 3.3 Jadwal Harian Detail — Minggu 2 (Hari 8–14): Sprint Development, Integrasi, QA & Go-Live

Minggu 2 adalah fase eksekusi penuh dengan **Feature Freeze ketat pada Hari 12 pukul 17:00 WIB**, menyisakan Hari 13 khusus untuk QA/Bug Fixing/Security dan Hari 14 untuk UAT & Production Go-Live.

| Hari | Fokus Utama | Tugas Spesifik **Mhd Yoga Andhika** | Tugas Spesifik **Nta** | Deliverable Terukur & Bukti Progres ke Leadership |
| :--- | :--- | :--- | :--- | :--- |
| **Hari 8** | Core CRUD Modul A & Modul C (Cross-Module Auto-Task) | Bangun **Project Management** (`/projects`, `/projects/[projectId]`), CRUD Task (`createTaskAction`, `updateTaskAction`, checklist, comments, pencatatan `first_submitted_at` & `effective_completion_time`), **My Tasks** (`/tasks/my-tasks`), dan cron **`POST/GET /api/cron/deadline-alerts`** (08:00 WIB, `CRON_SECRET`, H-2/H-0/H+1&H+3). | Bangun **Content Ideas Bank** (`/content/ideas` + approve/reject) dan **Content Planning** (`/content/planner`) yang memanggil `taskService.spawnLinkedTask(tx)` untuk otomatis membuat `CONTENT_PRODUCTION` & `DESIGN_TASK` + `design_briefs`. | **Bukti Live Staging:** PM approve 1 ide konten -> buat Content Plan -> 2 task (`CONTENT_PRODUCTION` & `DESIGN_TASK`) langsung muncul otomatis di **My Tasks** Creator & Designer + uji trigger `/api/cron/deadline-alerts` sukses! |
| **Hari 9** | Kanban Drag-and-Drop, Work Calendar & Design Approval Loop | Bangun **Kanban Board** (`/tasks/board` dengan `@dnd-kit` optimistic update + rollback + `nuqs` filter), **Work Calendar** (`/tasks/calendar` dengan edit jadwal via drawer/modal; DnD kalender di V1.1), dan `TaskDetailDrawer` (slide-over tanpa keluar dari board). | Bangun **Design Workspace** (`/design/workspace` — submit versi v1/v2 via upload/link), **Design Approval Queue** (`/design/reviews` — Approve & Request Revision loop, khusus `SUPER_ADMIN` & `PROJECT_MANAGER`), serta **Asset Library** (`/assets` — auto-promote saat desain Approved + tag search). | **Bukti Live Staging (Video 3 menit):** Designer submit desain v1 -> PM Request Revision (min. 10 karakter; status task jadi `REVISION`) -> Designer submit v2 -> PM Approve -> file masuk **Asset Library** & kartu Kanban pindah ke `DONE`! |
| **Hari 10** | Modul D Governance, Content Calendar & **DEMO GATE 2** | Bangun **User Management** (`/system/users` CRUD + reset password + instant revocation `tokenVersion`), **RBAC Matrix Viewer/Editor** (`/system/roles`), **Notification Center** (`NotificationBellPopover` polling 30 detik + `/notifications`), dan **Announcements** (`/announcements` + maks. 3 pinned banner). | Bangun **Content Calendar** (`/content/calendar` pengganti spreadsheet konten dengan filter platform/status/bulan), **Content Performance Analytics** (`/content/analytics` input reach/impressions/clicks/engagement + grafik Recharts `ER%` & `CTR%`), dan **Team Directory** (`/team`). | **DEMO GATE 2 (16:00 WIB):** Demo Live Staging 30 menit ke Leadership menampilkan Modul A + C + D berjalan end-to-end dengan data nyata dan notifikasi in-app aktif! |
| **Hari 11** | KPI Aggregation Engine, Monthly Evaluation & Audit Logs | Bangun **Activity Logs Explorer** (`/system/activity-logs` dengan TanStack Table, filter modul/aktor/tanggal & JSONB diff viewer) dan **Executive & Personal Home Dashboard** (`/`) yang menggabungkan widget dari 4 modul. | Bangun **Individual Performance** (`/team/[userId]`), **KPI Templates & Monthly Assignments** (`/kpi/templates` — `kpi_assignments` total bobot 100% + fitur ***Clone Previous Month***), `kpi-aggregator.service.ts` (`AUTO_TCR`, `AUTO_OTDR`, `AUTO_DQS`, `AUTO_CPVS` + `N/A` *weight re-normalization*), dan **Monthly Evaluation** (`/kpi/evaluations` + `[evaluationId]` Generate Draft -> Review `MANUAL_SCORE` 0–100 -> Finalize Lock khusus `SUPER_ADMIN`). | **Bukti Live Staging:** Klik *Clone Previous Month* & *Generate Monthly Evaluation* menghasilkan skor objektif (`TCR`, `OTDR`, `DQS`, `CPVS`) otomatis dari data aktual + seluruh aksi tercatat di `/system/activity-logs`. |
| **Hari 12** | KPI Dashboard, CSV Export, Integrasi Total & **FEATURE FREEZE** | Jalankan skenario **End-to-End Cross-Module Smoke Test** (4 skenario penuh dari Dokumen 02), lengkapi edge-case state transition & empty/error states di seluruh halaman, serta optimasi query Prisma (hilangkan N+1 query). | Bangun **Team Performance Dashboard** (`/kpi/dashboard` dengan Recharts leaderboard & tren bulanan) dan **Reports & Analytics** (`/kpi/reports` + `GET /api/kpi/reports/export` download CSV rapi di Excel); selesaikan responsivitas tablet/laptop kecil. | **FEATURE FREEZE (17:00 WIB):** Seluruh 25 sub-fitur V1 lengkap di branch `dev` (Staging). Laporan checklist uji integrasi 4 skenario diposting ke Leadership. |
| **Hari 13** | Dedicated QA, RBAC Penetration Check, Bug Fix & UAT Dry-Run | Eksekusi **RBAC Security Matrix Test** (uji akses ilegal langsung via URL & Server Action untuk 4 role), Lighthouse & loading audit, setup Production Environment (Supabase Prod + automated daily backup + Vercel Production env vars), dan perbaikan bug P0/P1. | Lakukan QA silang seluruh flow Modul A & D (karya Yoga), perbaiki seluruh bug UI/UX P0/P1 Modul B & C, siapkan **Data Migrasi Awal** (daftar user asli Krevia + template KPI V1 + sample content calendar bulan berjalan), dan susun Panduan Singkat Penggunaan (1-page Quick Start). | **Zero P0/P1 Bugs Report** + Akun Staging UAT siap diuji oleh Leadership & perwakilan tim (PM, Creator, Designer). |
| **Hari 14** | **DEMO GATE 3: Formal UAT Sign-Off, Production Go-Live & Handover** | Merge `dev -> main`, deploy **Production V1** ke domain internal Krevia, jalankan production smoke test (`/api/health`, login, upload storage, DB backup verify), dan aktifkan error monitoring (Vercel Logs / Sentry free tier). | Pimpin sesi **Formal UAT & Go-Live Demo** bersama Leadership, lakukan sesi **Onboarding 30 Menit** bersama tim internal Krevia (PM, Creator, Designer), dan serahkan dokumen Quick Start + backlog rekomendasi V1.1. | **GATE 3 SIGN-OFF:** Aplikasi **KTMS V1 LIVE di Production**, seluruh akun tim Krevia aktif login, dan Berita Acara Serah Terima V1 disetujui Leadership. |

---

### 3.4 Realisme Beban Kerja 2 Developer & Guardrail Prioritas MoSCoW

Target 2 minggu untuk 4 modul oleh 2 developer **hanya realistis jika disiplin terhadap V1 Scope Guardrails**:

1. **Mengapa Beban Ini Realistis:**
   - **Zero Boilerplate Duplication:** Next.js Server Actions + Prisma + Zod + shadcn/ui memangkas ±40% waktu pengembangan dibanding arsitektur terpisah (separate REST API + Redux/Axios + manual form state).
   - **Unified Task Table:** Tidak membangun 3 sistem task terpisah; Content Production dan Design Task hanyalah record di tabel `tasks` yang otomatis tampil di My Tasks, Kanban, Work Calendar, dan otomatis terhitung di KPI.
   - **Standardized Primitives:** Semua tabel (Users, Team Directory, My Tasks, Assets, Activity Logs) berbagi 1 komponen `DataTable` (`TanStack Table`); semua form memakai 1 pola `React Hook Form + Zod + createProtectedAction`.
2. **Mekanisme Scope Buffer (Bila Terjadi Keterlambatan > 0.5 Hari di Hari 10–11):**
   - Fitur **Must-Have V1 (TIDAK BOLEH DIKURANGI):** Login + RBAC 4 role, Projects, My Tasks, Kanban Board, Work Calendar, Content Ideas/Planning/Calendar + Auto-Task, Design Upload/Link + Approval/Revision Loop, Asset Library, Team Directory, Individual Metrics, KPI Templates, Monthly Evaluation + Finalize, Reports CSV Export, Users, Notifications, Announcements, Activity Logs.
   - Fitur **Deferrable ke V1.1 (Minggu ke-3, aman ditunda tanpa merusak operasional V1):** Drag-to-resize tanggal langsung di grid kalender (cukup edit tanggal di drawer), export PDF ber-template visual khusus (V1 gunakan CSV export + `@media print` browser), notifikasi eksternal Email/WhatsApp, dan custom dynamic role creation di luar 4 role kanonik.

---

### 3.5 Ritual Komunikasi, Git Workflow, Demo Checkpoints & Risk Register

#### A. Git Branching Strategy & Cross-PR Review

| Branch / Aturan | Konvensi & Kebijakan Teknis |
| :--- | :--- |
| **`main`** | **Protected Production Branch.** Hanya menerima merge dari `dev` setelah lulus Gate 3 / UAT. Auto-deploy ke Production Vercel. |
| **`dev`** | **Staging Integration Branch.** Auto-deploy ke `staging-ktms.vercel.app`. Semua PR fitur di-merge ke sini setiap hari agar Leadership selalu dapat melihat progres live. |
| **`feat/<modul>-<owner>/<slug>`** | Branch kerja harian pendek (umur maks 1–2 hari). Contoh: `feat/tasks-yoga/kanban-dnd`, `feat/social-nta/design-approval-loop`, `fix/kpi-nta/rounding-score`. |
| **Conventional Commits** | Format wajib: `feat(tasks): add optimistic kanban drag and drop`, `fix(social): sync content status on design approval`, `chore(db): add composite index on tasks`. |
| **Cross-PR Review Wajib** | Yoga me-review PR Nta, Nta me-review PR Yoga. **SLA Review: maks 2 jam kerja.** Setiap PR wajib lolos GitHub Actions CI (`lint`, `tsc --noEmit`, `prisma validate`, `next build`) + melampirkan **screenshot / rekaman layar 30 detik** dan **Vercel Preview URL**. |

#### B. Ritual Komunikasi Harian & Format Laporan ke Leadership

Leadership Krevia Digital mengharapkan **visibilitas progres konkret setiap hari**, bukan sekadar update verbal.

1. **09:30 WIB — Daily Dev Sync (10 Menit, Yoga & Nta):** Sinkronisasi kontrak interface/PR yang akan di-merge hari itu, cek potensi konflik file bersama, dan identifikasi hambatan.
2. **Aturan Eskalasi Blocker (2-Hour / 4-Hour Rule):**
   - Jika 1 developer buntu **> 2 jam** pada bug teknis, wajib langsung *pair-debugging* dengan rekan developer.
   - Jika hambatan **> 4 jam** atau menyangkut keputusan bisnis/akses akun/kebijakan Leadership, **wajib eskalasi ke grup Leadership pada hari yang sama** lengkap dengan opsi solusi yang direkomendasikan — dilarang menahan masalah sampai hari demo.
3. **17:30 WIB — Async EOD Progress Report ke Grup Leadership (Copy-Paste Template):**

```markdown
[KTMS DAILY UPDATE — HARI X / 14] — Tanggal: DD/MM/2026
Status Timeline: ON TRACK (atau AT RISK — alasan singkat)
Link Staging Terbaru: https://staging-ktms.vercel.app

1. DONE HARI INI (Dengan Bukti Nyata):
   - [Yoga] Selesai fitur Kanban Board DnD + Work Calendar (PR #14 merged — bukti screenshot/video terlampir).
   - [Nta] Selesai Design Workspace + Approval & Revision Loop + Auto-save Asset Library (PR #15 merged — bisa dicoba di /design/reviews).

2. FOKUS BESOK (Hari X+1):
   - [Yoga] User Management, RBAC Matrix, Notification Bell polling & Announcements.
   - [Nta] Content Calendar, Content Performance Analytics & persiapan Demo Gate 2.

3. BLOCKER / BUTUH KEPUTUSAN LEADERSHIP:
   - Tidak ada blocker. (atau: Mohon konfirmasi daftar email tim Krevia untuk seeding akun UAT sebelum Hari 13 jam 12:00 WIB).
```

#### C. 3 Formal Demo Gate ke Leadership

| Demo Gate | Jadwal | Peserta | Agenda Demonstrasi Konkret | Kriteria Sign-Off (Go / No-Go) |
| :--- | :--- | :--- | :--- | :--- |
| **Gate 1: Blueprint & Design Sign-Off** | **Hari 4** (14:00 WIB, 45 menit) | Leadership, Yoga, Nta | Walkthrough SRS & V1 Guardrails, demo Figma Hi-Fi Prototype 4 modul, review ERD & RBAC 4 role, serta konfirmasi jadwal 14 hari. | Leadership menyetujui scope V1 (freeze), alur status 4 modul, formula KPI, dan desain UI tanpa perubahan arsitektur mayor. |
| **Gate 2: Mid-Sprint Live Staging Demo** | **Hari 10** (16:00 WIB, 30 menit) | Leadership, PM, Yoga, Nta | Demo langsung di **Staging URL** (bukan localhost): Login 4 role -> Buat Content Plan -> Auto-Task muncul di Kanban -> Designer upload revisi -> PM Approve -> Masuk Asset Library -> Broadcast Announcement & Notifikasi muncul. | Alur lintas modul A + C + D berjalan stabil end-to-end di Staging tanpa crash; feedback minor dicatat untuk dituntaskan sebelum Feature Freeze Hari 12. |
| **Gate 3: Formal UAT & Production Go-Live** | **Hari 14** (14:00 WIB, 60 menit) | Leadership, PM, Perwakilan Creator & Designer, Yoga, Nta | Verifikasi skenario UAT penuh termasuk Modul B (Generate KPI otomatis -> Review -> Finalize Lock -> Export CSV) dan Audit Trail (`/system/activity-logs`), dilanjutkan switch ke Production URL & onboarding tim 30 menit. | 0 bug P0/P1, seluruh 4 role lolos uji RBAC, Production URL live dengan SSL + DB backup aktif, dan seluruh akun tim Krevia berhasil login. |

#### D. Risk Register & Rencana Mitigasi (Timeline 2 Minggu)

| ID | Risiko Proyek | Prob. | Dampak | Early Warning Signal | Mitigasi Preventif | Contingency Plan (Fallback) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **R-01** | **Scope Creep saat Demo Gate 1 / Gate 2** (permintaan fitur baru seperti mobile app/payroll/WA bot) | Tinggi | Tinggi | Muncul permintaan fitur di luar 25 sub-fitur MoSCoW V1 saat sesi review. | Tampilkan tabel *V1 Scope Guardrails* di awal setiap demo; catat ide baru secara apresiatif ke tabel **Backlog V1.1**. | Jika Leadership tetap meminta tambahan kritikal di V1, lakukan *explicit trade-off* (geser fitur V1 prioritas rendah atau tambah hari timeline secara tertulis). |
| **R-02** | **Kompleksitas Optimistic DnD Kanban (`@dnd-kit`) & Race Condition** | Sedang | Sedang | Kartu melompat/duplikat saat dipindahkan cepat antar kolom pada Hari 9. | Gunakan *fractional `DOUBLE PRECISION` gap positioning* (`65536, 131072...`), optimistic `version` check di Prisma, dan batasi drag hanya antar status valid. | Sediakan tombol dropdown **"Ubah Status"** di setiap kartu & `TaskDetailDrawer` sebagai jalur alternatif 100% andal sembari memoles animasi DnD. |
| **R-03** | **Merge Conflict pada `prisma/schema.prisma` atau Shared Types** | Sedang | Sedang | Kedua developer mengedit schema/enum bersamaan di Minggu 2. | Freeze `schema.prisma` pada Hari 5; perubahan schema di Minggu 2 hanya lewat PR kecil terkoordinasi + migrasi inkremental. | Yoga bertindak sebagai *Schema Gatekeeper* tunggal untuk merge perubahan `prisma/schema.prisma` setiap jam 13:00 & 17:00 WIB. |
| **R-04** | **Kendala CORS / Limit Upload Supabase Storage** | Sedang | Sedang | Upload gambar/video desain gagal di browser Staging saat Hari 7/9. | Uji coba presigned upload end-to-end lebih awal di **Hari 7** (bukan di akhir sprint) dengan batas tegas 25 MB (Avatar 2 MB), TTL 300s, & whitelist MIME. | Mode **External Link (Figma / Canva / Google Drive)** tetap berjalan penuh sebagai mekanisme delivery utama paralel sehingga alur Desain tidak pernah terblokir. |
| **R-05** | **Edge Cases Kalkulasi KPI Otomatis** (user baru tanpa task / pembagian nol / task pindah bulan) | Sedang | Tinggi | Nilai `NaN%` atau skor berubah retrospektif saat task bulan lalu diedit di bulan ini. | Gunakan guard `totalAssignedTasks === 0 ? null : ...` (`N/A` + *weight re-normalization* `ROUND(SUM(S_k * w_k) / SUM(w_k_active), 2)`), simpan hasil agregasi ke kolom `autoMetricsSnapshot` + `evaluation_items`, dan kunci permanen saat `FINALIZED` (khusus `SUPER_ADMIN`). | Sediakan kemampuan *re-sync draft* hanya ketika status masih `DRAFT` sebelum evaluasi di-submit. |
| **R-06** | **Bug Integrasi Lintas Modul** (Content -> Task -> Design -> KPI tidak sinkron) | Sedang | Tinggi | Status Content sudah `READY_TO_PUBLISH` tapi task di Kanban masih `IN_REVIEW`. | Seluruh sinkronisasi lintas tabel **wajib dibungkus dalam satu `prisma.$transaction()`** di Service Layer (`content-workflow.service.ts`), bukan panggilan terpisah dari client. | Jalankan skenario E2E lintas modul sejak Hari 9 dan alokasikan penuh Hari 12 sore + Hari 13 untuk QA & regression fix. |
| **R-07** | **Keterlambatan Daftar User & Data Awal Krevia** | Rendah | Sedang | Daftar email staf dan bobot template KPI belum diterima pada Hari 11. | Minta template daftar tim & bobot KPI sejak **Gate 1 (Hari 4)** sebagai prasyarat seeding UAT. | Gunakan 4 akun role representatif + 1 template KPI standar Krevia untuk Go-Live Hari 14; Super Admin dapat menambah user langsung lewat `/system/users` dalam hitungan menit. |
| **R-08** | **Salah Satu Developer Berhalangan Mendadak (Sakit / Kendala Jaringan)** | Rendah | Tinggi | Developer absen > 0.5 hari pada Minggu 2. | Dokumentasi kontrak TypeScript & PR harian kecil memastikan rekan lain dapat mengambil alih branch segera tanpa reverse-engineering. | Aktifkan *Scope Buffer* (Bagian 3.4): prioritaskan 100% fitur Must-Have V1 dan geser fitur non-kritikal (grafik lanjutan/print polish) ke patch V1.0.1 di Hari 15–16. |

---

### 3.6 Definition of Done (DoD) Production V1 (Checklist Go-Live Hari 14)

KTMS V1 dinyatakan **SIAP GO-LIVE** hanya apabila seluruh 10 kriteria objektif berikut terpenuhi:

1. **Build & Type Safety:** `npm run lint`, `npx tsc --noEmit`, dan `npm run build` lolos **0 error** di GitHub Actions CI & Vercel Production.
2. **Kelengkapan 4 Modul V1:** Seluruh 25 sub-fitur V1 pada Modul A, B, C, dan D berfungsi end-to-end terhadap database PostgreSQL 16 Production (bukan mock data).
3. **Integrasi Lintas Modul Terverifikasi:** Membuat Content Plan otomatis men-spawn Task di Kanban & Calendar; Approve Design otomatis menyalin file ke Asset Library dan menyelesaikan Design Task; menyelesaikan Task otomatis memperbarui metrik Individual Performance & Draft Monthly Evaluation.
4. **Keamanan RBAC Terbukti:** Pengujian langsung terhadap seluruh 4 role (`SUPER_ADMIN`, `PROJECT_MANAGER`, `STAFF_CREATOR`, `DESIGNER`) memastikan menu tersembunyi **dan** pemanggilan langsung URL/Server Action ilegal selalu mengembalikan `403 FORBIDDEN`.
5. **Audit Trail & Notifikasi Aktif:** Setiap mutasi penting (create/move task, approve/revise design, finalize KPI, ubah user/RBAC, publish announcement) terekam otomatis di `activity_logs` dengan diff `oldValues`/`newValues` dan memicu notifikasi in-app relevan.
6. **File Upload & External Link Stabil:** Upload file PNG/JPG/PDF/MP4 (<= 25 MB) via presigned URL Supabase Storage maupun tempel link Figma/Canva/GDrive berjalan tanpa error CORS.
7. **Export Laporan Akurat:** Download CSV pada `/kpi/reports` dan `/system/activity-logs` terbuka rapi dengan kolom terstruktur di Microsoft Excel & Google Sheets.
8. **Zero P0/P1 Bugs:** Seluruh temuan bug kritikal (crash, data tidak tersimpan, salah perhitungan KPI, kebocoran akses) dari Hari 13 telah ditutup dan diverifikasi ulang.
9. **Infrastruktur Production Siap:** Environment variables terpisah antara Staging dan Production, SSL HTTPS aktif, endpoint `/api/health` mengembalikan `200 OK`, dan jadwal *automated daily backup* PostgreSQL aktif.
10. **Handover & Adopsi:** Akun asli tim Krevia Digital telah dibuat, sesi onboarding 30 menit terlaksana, dan Leadership menandatangani persetujuan **Gate 3 Sign-Off**.
