# KREVIA TEAM MANAGEMENT SYSTEM (KTMS) — HARI 5–7 FOUNDATION SETUP & PRE-FLIGHT RUNBOOK

> **Status Gerbang Eksekusi:** **`MENUNGGU SIGN-OFF GATE 1`** *(Hari 4, 14:00 WIB)*  
> **Peringatan Keras (*Hard Gate*):** Dokumen ini adalah paket eksekusi siap-jalan untuk **Hari 5–7 (Foundation Setup)**. Tim Engineering (**Mhd Yoga Andhika** & **Nta**) **DILARANG** menjalankan `create-next-app`, membuat `package.json`, `prisma/schema.prisma`, atau direktori `src/` sebelum Leadership Krevia Digital secara resmi menandatangani persetujuan **Gate 1: Blueprint & Design Sign-Off** pada [Lampiran Gate 1 Sign-Off Matrix](./KREVIA_TMS_MASTER_BLUEPRINT.md#lampiran--lembar-persetujuan-pre-coding-blueprint-leadership-sign-off-checklist--gate-1--hari-4).  
> **Acuan Tunggal (*Single Source of Truth*):** Seluruh nama tabel, enum, kode permission, struktur folder, rute API, dan batas operasional di dokumen ini merujuk 100% pada [KREVIA_TMS_MASTER_BLUEPRINT.md](./KREVIA_TMS_MASTER_BLUEPRINT.md).

---

## Daftar Isi

1. [Gerbang Prasyarat & Audit Kesiapan Lingkungan (Pre-Flight Check)](#1-gerbang-prasyarat--audit-kesiapan-lingkungan-pre-flight-check)
   - [1.1 Status Gate 1 & Hasil Audit Host Windows Lokal](#11-status-gate-1--hasil-audit-host-windows-lokal)
   - [1.2 Langkah Instalasi Toolchain Lokal (Windows Host)](#12-langkah-instalasi-toolchain-lokal-windows-host)
   - [1.3 Checklist Provisioning Cloud Accounts (GitHub, Supabase & Vercel)](#13-checklist-provisioning-cloud-accounts-github-supabase--vercel)
   - [1.4 Template Lengkap `.env.local.example` & `.env.example`](#14-template-lengkap-envlocalexample--envexample)
2. [Track A Kick-Off Runbook — Mhd Yoga Andhika (Hari 5–7)](#2-track-a-kick-off-runbook--mhd-yoga-andhika-hari-57)
   - [2.1 Inisialisasi Next.js 15 App Router, TypeScript Strict & GitHub Actions CI](#21-inisialisasi-nextjs-15-app-router-typescript-strict--github-actions-ci)
   - [2.2 Checklist Translasi DDL ke `prisma/schema.prisma` (21 ENUM, 25 Tabel, 25 Indexes)](#22-checklist-translasi-ddl-ke-prismaschemaprisma-21-enum-25-tabel-25-indexes)
   - [2.3 Spesifikasi Lengkap `prisma/seed.ts`](#23-spesifikasi-lengkap-prismaseedts)
   - [2.4 Artefak Hari 6–7 Track A (Auth.js v5, RBAC Guard, Audit, Notif & `taskService`)](#24-artefak-hari-67-track-a-authjs-v5-rbac-guard-audit-notif--taskservice)
3. [Track B Kick-Off Runbook — Nta (Hari 5–7)](#3-track-b-kick-off-runbook--nta-hari-57)
   - [3.1 Instalasi Tailwind CSS & Daftar Primitives `shadcn/ui` (Hari 5)](#31-instalasi-tailwind-css--daftar-primitives-shadcnui-hari-5)
   - [3.2 Spesifikasi Komponen Inti (`StatusBadge`, `PriorityBadge`, `DataTable`, `/login`)](#32-spesifikasi-komponen-inti-statusbadge-prioritybadge-datatable-login)
   - [3.3 Spesifikasi App Shell & Providers (Hari 6 — 22 Menu RBAC)](#33-spesifikasi-app-shell--providers-hari-6--22-menu-rbac)
   - [3.4 Spesifikasi Presigned Storage UI & Route Handlers (Hari 7)](#34-spesifikasi-presigned-storage-ui--route-handlers-hari-7)
4. [Koordinasi PR Anti-Konflik (PR #1 s/d PR #6) & Verifikasi Gate Hari 5–7](#4-koordinasi-pr-anti-konflik-pr-1-sd-pr-6--verifikasi-gate-hari-57)
   - [4.1 Urutan Merge PR #1–#6 & Aturan Shared-Touch Files](#41-urutan-merge-pr-16--aturan-shared-touch-files)
   - [4.2 Matriks Verifikasi Objektif (Hari 5, Hari 6, Hari 7)](#42-matriks-verifikasi-objektif-hari-5-hari-6-hari-7)
   - [4.3 Format Bukti Laporan EOD 17:30 WIB (Hari 5, 6 & 7)](#43-format-bukti-laporan-eod-1730-wib-hari-5-6--7)

---

## 1. Gerbang Prasyarat & Audit Kesiapan Lingkungan (Pre-Flight Check)

### 1.1 Status Gate 1 & Hasil Audit Host Windows Lokal

| Pemeriksaan | Status Saat Ini | Detail Fakta Terverifikasi | Tindakan Wajib Sebelum Eksekusi Hari 5 |
| :--- | :---: | :--- | :--- |
| **Persetujuan Gate 1 Leadership** | **MENUNGGU SIGN-OFF GATE 1** | Sesi Demo Gate 1 (Hari 4, 14:00 WIB) belum ditandatangani. Belum ada inisialisasi kode di repo. | Kunci MoSCoW V1, Formula & Bobot KPI, serta Desain Figma Hi-Fi bersama Leadership sebelum `create-next-app`. |
| **Kondisi Direktori Workspace** | **Bersih (Docs-Only)** | `d:\PROJECT\KREVIA PROJECT\Krevia-Team-Management-System` hanya berisi `docs/` (`KREVIA_TMS_MASTER_BLUEPRINT.md`, `blueprint/01..04`, `GATE_1_LEADERSHIP_PRESENTATION.md`, `HARI_5_KICKOFF_RUNBOOK.md`) — 0 file kode (`src/`, `package.json`, `prisma/`). | Pertahankan kondisi docs-only hingga Gate 1 disetujui. |
| **Node.js & `npm`** | **BLOCKER (`NOT FOUND`)** | `node` dan `npm` tidak ditemukan di `PATH` host Windows saat ini (`CommandNotFoundException`). | Pasang **Node.js 20+ LTS** (atau 22 LTS) sebelum Hari 5 pukul 08:30 WIB. |
| **`pnpm`** | **BELUM TERPASANG (`NOT FOUND`)** | `pnpm` tidak tersedia di `PATH`. | Gunakan `npm` sebagai package manager standar (selaras dengan `ci.yml` & perintah blueprint) atau aktifkan `corepack enable pnpm` jika tim menyepakati 1 lockfile tunggal. |
| **`git`** | **BLOCKER (`NOT FOUND`)** | `git` tidak ditemukan di `PATH` host Windows saat ini. | Pasang **Git for Windows** sebelum inisialisasi repo dan branching `main`/`dev`. |
| **`python`** | **TIDAK TERPASANG (Stub Only)** | Hanya terdapat WindowsApps Microsoft Store alias stub (`AppData\Local\Microsoft\WindowsApps\python.exe`) yang mengembalikan `"Python was not found"`. | Tidak wajib untuk stack Next.js/Node.js KTMS, namun abaikan alias stub tersebut agar skrip helper tidak gagal. |
| **`winget` (Windows Package Manager)** | **TERSEDIA (`v1.29.380`)** | Terverifikasi aktif di host Windows. | Gunakan `winget` untuk instalasi otomatis Node.js LTS, Git, dan VS Code dalam < 5 menit. |

### 1.2 Langkah Instalasi Toolchain Lokal (Windows Host)

Jalankan perintah berikut pada **PowerShell** (Run as Administrator bila diminta UAC) segera setelah Gate 1 disetujui pada Hari 4 sore:

```powershell
# 1. Pasang Node.js 20+ LTS (mencakup npm & npx)
winget install --id OpenJS.NodeJS.LTS -e --source winget

# 2. Pasang Git for Windows
winget install --id Git.Git -e --source winget

# 3. Pasang Visual Studio Code (jika belum terpasang pada workstation developer)
winget install --id Microsoft.VisualStudioCode -e --source winget
```

Setelah instalasi selesai, **tutup dan buka ulang terminal PowerShell** agar pembaruan `PATH` terbaca, lalu jalankan verifikasi dan konfigurasi awal:

```powershell
# Verifikasi versi minimum (Node >= v20.11.0, npm >= 10.x, git >= 2.40)
node -v
npm -v
git --version

# Konfigurasi identitas Git & line-ending lintas developer Windows
git config --global user.name "<Nama Developer>"
git config --global user.email "<email-github-developer@krevia.digital>"
git config --global core.autocrlf input
git config --global init.defaultBranch main
```

**Ekstensi VS Code Wajib (Yoga & Nta):**
- `Prisma.prisma` (validasi sintaks & auto-format `prisma/schema.prisma`)
- `bradlc.vscode-tailwindcss` (autocomplete class token Tailwind CSS)
- `dbaeumer.vscode-eslint` (inline lint error sebelum push PR)
- `esbenp.prettier-vscode` (konsistensi format agar diff PR bersih)

> **Standar Package Manager Tunggal:** Gunakan **`npm`** (`package-lock.json`) secara seragam oleh Yoga dan Nta agar 100% konsisten dengan `npx prisma`, `npm run lint`, `npm run build`, dan GitHub Actions CI (`npm ci`). Jangan mencampur `pnpm-lock.yaml` dan `package-lock.json` dalam satu repository.

### 1.3 Checklist Provisioning Cloud Accounts (GitHub, Supabase & Vercel)

Provisioning dilakukan oleh **Mhd Yoga Andhika** segera setelah Gate 1 disetujui (Hari 4 sore / Hari 5 pagi sebelum PR #1):

1. **GitHub Repository (`krevia-team-management-system`)**
   - [ ] Buat private repository di organisasi GitHub Krevia Digital.
   - [ ] Undang akun GitHub **Mhd Yoga Andhika** dan **Nta** dengan akses **Write / Maintain**.
   - [ ] Aktifkan **Branch Protection Rules** pada `main` dan `dev`:
     - Require a pull request before merging (min. 1 approval dari rekan developer).
     - Require status checks to pass (`lint-typecheck-build` dari `.github/workflows/ci.yml`).
     - Block force pushes & deletions.
2. **Supabase Managed PostgreSQL & Storage (2 Project Terpisah)**
   - [ ] Buat **Project Staging/Dev (`ktms-staging`)** di region terdekat (mis. `ap-southeast-1` Singapore).
   - [ ] Buat **Project Production (`ktms-production`)** terpisah dan aktifkan **Daily Automated Backups**.
   - [ ] Pastikan ekstensi PostgreSQL **`pgcrypto`** dan **`pg_trgm`** aktif pada kedua project (skrip migrasi awal juga mengeksekusi `CREATE EXTENSION IF NOT EXISTS`).
   - [ ] Catat 2 jenis connection string per environment:
     - **`DATABASE_URL` (Transaction Pooler / PgBouncer port `6543`):** Tambahkan query parameter `?pgbouncer=true&connection_limit=1` untuk runtime serverless Vercel.
     - **`DIRECT_URL` (Direct Connection port `5432`):** Digunakan secara eksklusif oleh Prisma CLI (`prisma migrate dev` / `prisma migrate deploy`).
   - [ ] Buat Private Storage Bucket bernama **`ktms-media`** (Status: **Private / Public = OFF**) pada Staging dan Production.
   - [ ] Konfigurasikan **CORS Policy** pada bucket/project Storage untuk mengizinkan direct browser `PUT` via Presigned URL:
     - **Allowed Origins:** `http://localhost:3000`, `https://staging-ktms.vercel.app`, `https://ktms.krevia.digital` (sesuaikan domain produksi final), serta preview wildcard Vercel bila diizinkan.
     - **Allowed Methods:** `GET`, `PUT`, `HEAD`, `OPTIONS`
     - **Allowed Headers:** `Content-Type`, `Content-Length`, `x-upsert`, `authorization`, `cache-control`
     - **Max Age:** `3600`
   - [ ] Terapkan **RLS Lockdown Script** pada seluruh 25 tabel `public` (lihat §2.2) agar Supabase PostgREST Data API (`anon`/`authenticated`) menolak seluruh akses publik (*deny by default*).
3. **Vercel Project (`ktms`)**
   - [ ] Hubungkan GitHub Repository ke Vercel.
   - [ ] Tetapkan **Production Branch = `main`** dan **Staging/Preview Domain (`staging-ktms.vercel.app`) = `dev`**.
   - [ ] Input seluruh Environment Variables secara terpisah untuk scope **Preview (`dev`)** (mengarah ke `ktms-staging`) dan **Production (`main`)** (mengarah ke `ktms-production`).
   - [ ] Siapkan `vercel.json` di root repo untuk Vercel Cron Job `/api/cron/deadline-alerts` pukul **08:00 WIB (`01:00 UTC`)** harian:
     ```json
     {
       "crons": [
         {
           "path": "/api/cron/deadline-alerts",
           "schedule": "0 1 * * *"
         }
       ]
     }
     ```

### 1.4 Template Lengkap `.env.local.example` & `.env.example`

Commit file `.env.example` ke root repository (tanpa nilai rahasia nyata) dan salin menjadi `.env.local` pada masing-masing mesin developer (`.env.local` wajib masuk `.gitignore`). Seluruh variabel di bawah akan divalidasi saat startup oleh `src/lib/env.ts` menggunakan Zod.

```dotenv
# ==============================================================================
# KREVIA TEAM MANAGEMENT SYSTEM (KTMS) — ENVIRONMENT TEMPLATE (.env.local.example)
# Salin menjadi .env.local untuk pengembangan lokal. JANGAN PERNAH commit .env.local!
# ==============================================================================

# --- 1. Application Runtime ---
NODE_ENV="development"
NEXT_PUBLIC_APP_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Set "true" HANYA di local/staging untuk menampilkan quick-hint akun demo di /login.
# WAJIB "false" pada environment Production!
NEXT_PUBLIC_ENABLE_DEMO_HINTS="true"

# --- 2. PostgreSQL 16 (Supabase Managed + Prisma Dual Connection) ---
# Port 6543 (PgBouncer Transaction Pooler) untuk runtime aplikasi serverless
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[URL_ENCODED_DB_PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
# Port 5432 (Direct Connection) khusus untuk `npx prisma migrate dev` / `deploy`
DIRECT_URL="postgresql://postgres:[URL_ENCODED_DB_PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"

# --- 3. Auth.js v5 (Credentials + JWT Sliding Session 7 Hari) ---
# Generate lokal: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
AUTH_SECRET="replace-with-openssl-or-node-random-32-byte-base64-secret"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"

# --- 4. Object Storage (Supabase Storage Private Bucket / S3-Compatible) ---
STORAGE_PROVIDER="supabase"
NEXT_PUBLIC_SUPABASE_URL="https://[PROJECT_REF].supabase.co"
# Service Role Key HANYA digunakan di sisi server (/api/uploads/presign & download-url).
# JANGAN PERNAH beri prefix NEXT_PUBLIC_!
SUPABASE_SERVICE_ROLE_KEY="replace-with-supabase-service-role-secret-key"
SUPABASE_STORAGE_BUCKET="ktms-media"

# (Opsional apabila menggunakan S3-Compatible Presigner / AWS S3 / R2 di luar Supabase JS SDK)
# S3_ENDPOINT="https://[PROJECT_REF].supabase.co/storage/v1/s3"
# S3_REGION="ap-southeast-1"
# S3_ACCESS_KEY_ID="replace-with-s3-access-key-id"
# S3_SECRET_ACCESS_KEY="replace-with-s3-secret-access-key"

# --- 5. Scheduled Cron & Internal Security ---
# Token Bearer untuk melindungi endpoint GET/POST /api/cron/deadline-alerts (08:00 WIB)
CRON_SECRET="replace-with-32-char-random-cron-secret"

# --- 6. Database Seeding (Dev / Staging Only) ---
# Password awal standar untuk 4 akun demo lokal/staging (tidak dipakai di production)
DEMO_SEED_PASSWORD="KreviaDev!2026"
ALLOW_DEMO_SEED="true"
```

---

## 2. Track A Kick-Off Runbook — Mhd Yoga Andhika (Hari 5–7)

**Tanggung Jawab Track A:** Platform Core, Repository & CI/CD, Prisma Schema (25 Tabel, 21 ENUM, 25 Custom Indexes), Prisma Seed, Auth.js v5 + Instant Revocation (`token_version`), RBAC Guard (`requirePermission`), `safe-action.ts`, `audit-logger.ts`, `notification-dispatcher.ts`, `GET /api/health`, serta `taskService.spawnLinkedTask(tx)` + fractional `65536` gap positioning.

### 2.1 Inisialisasi Next.js 15 App Router, TypeScript Strict & GitHub Actions CI

#### A. Langkah Inisialisasi Proyek & Dependensi Inti (Hari 5 Pagi)

1. Pastikan berada di root repo `d:\PROJECT\KREVIA PROJECT\Krevia-Team-Management-System` (backup sementara `docs/` aman karena tidak ditimpa, atau inisialisasi di folder sementara lalu pindahkan `docs/` ke dalam root proyek dan aktifkan `git`).
2. Jalankan inisialisasi Next.js 15+ dengan App Router, TypeScript, Tailwind CSS, ESLint, dan `--src-dir`:
   ```bash
   npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
   ```
3. Pasang paket runtime & devDependencies kanonik sesuai Master Blueprint:
   ```bash
   # Core ORM, Auth, Validasi, UI State & Icons
   npm install prisma @prisma/client next-auth@beta @node-rs/argon2 zod react-hook-form @hookform/resolvers
   npm install @tanstack/react-query @tanstack/react-table zustand nuqs sonner lucide-react
   npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities recharts
   npm install @supabase/supabase-js clsx tailwind-merge class-variance-authority

   # Tooling & Testing
   npm install -D tsx @types/node
   ```
   *(Catatan: Apabila runtime serverless target memerlukan fallback murni JS untuk hashing atau `@node-rs/argon2` native binary bermasalah di Windows/Vercel, gunakan `bcryptjs` + `@types/bcryptjs` dengan cost `12` sebagai alternatif yang disetujui Blueprint).*
4. Konfigurasi **`tsconfig.json`** wajib mengaktifkan TypeScript strict mode penuh (sesuai Bagian IV §1.2):
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noUncheckedIndexedAccess": true,
       "noImplicitOverride": true,
       "forceConsistentCasingInFileNames": true
     }
   }
   ```
5. Konfigurasi **`next.config.ts`** (sertakan `images.remotePatterns` untuk domain Supabase Storage `[PROJECT_REF].supabase.co` dan `experimental.serverActions.bodySizeLimit: '2mb'` karena file besar menggunakan Presigned Upload URL, bukan Server Action body).
6. Konfigurasi **`src/lib/env.ts`** untuk memvalidasi `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_STORAGE_BUCKET`, dan `CRON_SECRET` via `z.object(...)` saat runtime boot.

#### B. Konfigurasi GitHub Actions CI (`.github/workflows/ci.yml`)

Buat `.github/workflows/ci.yml` yang berjalan otomatis pada setiap `pull_request` ke `dev`/`main` dan `push` ke `dev`/`main`:

```yaml
name: KTMS CI Check

on:
  pull_request:
    branches: [dev, main]
  push:
    branches: [dev, main]

jobs:
  lint-typecheck-build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js 20 LTS
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - name: Install dependencies
        run: npm ci

      - name: Validate Prisma Schema
        run: npx prisma validate

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript Typecheck
        run: npx tsc --noEmit

      - name: Build Next.js Application
        run: npm run build
        env:
          SKIP_ENV_VALIDATION: "1"
          NEXT_PUBLIC_APP_URL: "http://localhost:3000"
          NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co"
          DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/postgres"
          DIRECT_URL: "postgresql://postgres:postgres@localhost:5432/postgres"
          AUTH_SECRET: "ci-build-only-placeholder-secret-32-chars"
```

---

### 2.2 Checklist Translasi DDL ke `prisma/schema.prisma` (21 ENUM, 25 Tabel, 25 Indexes)

> **Aturan `Yoga = Schema Gatekeeper`:** `prisma/schema.prisma` dibekukan pada PR #1 (Hari 5). Nta dan fitur lain **dilarang** mengubah `prisma/schema.prisma` secara sepihak. Jika dibutuhkan penyesuaian kolom di Hari 6–14, perubahan harus melalui PR kecil tersendiri yang direview dan di-merge oleh **Mhd Yoga Andhika** pada jendela sync **13:00 WIB** atau **17:00 WIB** (sesuai Bagian IV §3.1 & Risk R-03).

#### A. Konfigurasi `datasource` & `generator`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

#### B. Checklist 21 PostgreSQL ENUMs (6 Kanonik + 15 Supporting Domain)

Pastikan seluruh 21 enum di bawah memakai `@@map("<nama_enum_sql>")` agar nama tipe di PostgreSQL 100% identik dengan Bagian III §3.1:

| # | Kategori | Nama Enum Prisma | Nama Enum PostgreSQL (`@@map`) | Nilai Enum |
| :-: | :--- | :--- | :--- | :--- |
| 1 | Kanonik | `TaskStatus` | `task_status_enum` | `BACKLOG`, `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `REVISION`, `DONE`, `CANCELLED` |
| 2 | Kanonik | `TaskType` | `task_type_enum` | `GENERAL`, `CONTENT_PRODUCTION`, `DESIGN_TASK` |
| 3 | Kanonik | `TaskPriority` | `task_priority_enum` | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| 4 | Kanonik | `ContentStatus` | `content_status_enum` | `IDEA`, `APPROVED_IDEA`, `PLANNING`, `IN_DESIGN`, `DESIGN_REVIEW`, `DESIGN_REVISION`, `READY_TO_PUBLISH`, `SCHEDULED`, `PUBLISHED`, `ARCHIVED` |
| 5 | Kanonik | `DesignSubmissionStatus` | `design_submission_status_enum` | `PENDING_BRIEF`, `IN_PROGRESS`, `SUBMITTED`, `REVISION_REQUESTED`, `APPROVED` |
| 6 | Kanonik | `EvaluationStatus` | `kpi_evaluation_status_enum` | `DRAFT`, `SUBMITTED`, `REVIEWED`, `FINALIZED` |
| 7 | Supporting | `EmploymentStatus` | `employment_status_enum` | `FULL_TIME`, `PART_TIME`, `CONTRACT`, `INTERN`, `INACTIVE` |
| 8 | Supporting | `ProjectStatus` | `project_status_enum` | `PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `ARCHIVED` |
| 9 | Supporting | `ProjectMemberRole` | `project_member_role_enum` | `OWNER`, `LEAD`, `MEMBER`, `VIEWER` |
| 10 | Supporting | `ContentIdeaStatus` | `content_idea_status_enum` | `IDEA`, `APPROVED_IDEA`, `CONVERTED`, `ARCHIVED` |
| 11 | Supporting | `SocialPlatform` | `social_platform_enum` | `INSTAGRAM`, `TIKTOK`, `LINKEDIN`, `YOUTUBE`, `X_TWITTER`, `FACEBOOK`, `WEBSITE_BLOG` |
| 12 | Supporting | `ContentFormat` | `content_format_enum` | `REELS`, `CAROUSEL`, `SINGLE_POST`, `STORY`, `SHORT_VIDEO`, `LONG_VIDEO`, `ARTICLE`, `INFOGRAPHIC` |
| 13 | Supporting | `DesignReviewDecision` | `design_review_decision_enum` | `APPROVED`, `REVISION_REQUESTED` |
| 14 | Supporting | `AssetSourceType` | `asset_source_type_enum` | `UPLOAD`, `FIGMA`, `CANVA`, `GOOGLE_DRIVE`, `OTHER_LINK` |
| 15 | Supporting | `AssetCategory` | `asset_category_enum` | `BRAND_KIT`, `SOCIAL_MEDIA`, `CAMPAIGN`, `TEMPLATE`, `PHOTO_VIDEO`, `DOCUMENT`, `OTHER` |
| 16 | Supporting | `KpiCategory` | `kpi_category_enum` | `DELIVERY`, `QUALITY`, `PRODUCTIVITY`, `CREATIVE`, `COLLABORATION` |
| 17 | Supporting | `KpiMetricSource` | `kpi_metric_source_enum` | `AUTO_TCR`, `AUTO_OTDR`, `AUTO_DQS`, `AUTO_CPVS`, `MANUAL_SCORE` |
| 18 | Supporting | `KpiUnit` | `kpi_unit_enum` | `PERCENTAGE`, `COUNT`, `SCORE_100`, `RATIO` |
| 19 | Supporting | `KpiGrade` | `kpi_grade_enum` | `A`, `B`, `C`, `D` |
| 20 | Supporting | `NotificationType` | `notification_type_enum` | 21 tipe: `TASK_ASSIGNED`, `TASK_REASSIGNED`, `TASK_STATUS_CHANGED`, `TASK_SUBMITTED_REVIEW`, `TASK_REVISION_REQUESTED`, `TASK_COMPLETED`, `TASK_COMMENT_MENTION`, `TASK_DEADLINE_SOON`, `TASK_DEADLINE_TODAY`, `TASK_OVERDUE`, `CONTENT_IDEA_REVIEWED`, `CONTENT_READY_TO_PUBLISH`, `DESIGN_BRIEF_ASSIGNED`, `DESIGN_SUBMITTED`, `DESIGN_REVISION_REQUESTED`, `DESIGN_APPROVED`, `KPI_EVALUATION_OPEN`, `KPI_EVALUATION_SUBMITTED`, `KPI_EVALUATION_FINALIZED`, `ANNOUNCEMENT_PUBLISHED`, `SYSTEM_ALERT` |
| 21 | Supporting | `AnnouncementPriority` | `announcement_priority_enum` | `INFO`, `IMPORTANT`, `URGENT` |

#### C. Checklist 25 Model Tabel (`@@map` snake_case + `@db.Uuid` + `@db.Timestamptz`)

| Kelompok Modul | # | Nama Tabel SQL (`@@map`) | Model Prisma | Catatan Kolom & Relasi Kritis |
| :--- | :-: | :--- | :--- | :--- |
| **1. Identity & RBAC** | 1 | `roles` | `Role` | `code` unique, `isSystem` (`is_system`) |
| | 2 | `users` | `User` | `roleId`, self-FK `managerId`, `tokenVersion` (`DEFAULT 1`), `skills` (`String[]`), `mustChangePassword`, `deletedAt` |
| | 3 | `permissions` | `Permission` | `code` unique (`module:resource:action`), `module`, `resource`, `action` |
| | 4 | `role_permissions` | `RolePermission` | Composite PK `@@id([roleId, permissionId])`, `grantedBy` |
| **2. Projects (Modul A)** | 5 | `projects` | `Project` | `code` unique, `colorHex`, `ownerId`, `archivedAt`, `deletedAt` |
| | 6 | `project_members` | `ProjectMember` | `@@unique([projectId, userId])`, `projectRole` |
| **3. Social & Design (Modul C)** | 7 | `content_ideas` | `ContentIdea` | `referenceUrls` (`Json`), `upvotedByUserIds` (`String[] @db.Uuid`), `status`, `deletedAt` |
| | 8 | `content_items` | `ContentItem` | `ideaId`, `requiresDesign`, `hashtags` (`String[]`), `plannedPublishAt`, `publishedAt`, `deletedAt` |
| | 9 | `design_briefs` | `DesignBrief` | `contentItemId`, `assignedDesignerId`, `currentVersion`, `revisionCount`, `approvedAt`, `deletedAt` |
| | 10 | `design_submissions` | `DesignSubmission` | `@@unique([designBriefId, versionNumber])`, `sourceType`, `storageKey`, `fileSizeBytes` (`BigInt?`) |
| | 11 | `design_reviews` | `DesignReview` | `designSubmissionId`, `reviewerId`, `decision`, `feedback`, `revisionChecklist` (`Json`) |
| | 12 | `assets` | `Asset` | `designSubmissionId`, `tags` (`String[]`), `metadata` (`Json`), `isApprovedBrandAsset`, `isSuperseded`, `deletedAt` |
| | 13 | `content_analytics` | `ContentAnalytic` | `@@unique([contentItemId, recordedDate])`, **Stored Generated Columns:** `engagementRate` & `ctr` (`@db.Decimal(6, 2)`) |
| **4. Unified Tasks (Modul A)** | 14 | `tasks` | `Task` | `taskCode` unique (`seq_task_code_num`), `parentTaskId` self-FK, `contentItemId`, `designBriefId`, `position` (`Float` / `DOUBLE PRECISION` default `65536`), `version` (`DEFAULT 1`), `requiresReview`, `firstSubmittedAt`, `completedAt`, `isOnTime`, `revisionCount`, `tags` (`String[]`), `deletedAt` |
| | 15 | `task_checklists` | `TaskChecklist` | `taskId` (`onDelete: Cascade`), `isCompleted`, `sortOrder` |
| | 16 | `task_comments` | `TaskComment` | `taskId`, `parentCommentId` self-FK, `mentionedUserIds` (`String[] @db.Uuid`), `deletedAt` |
| | 17 | `task_attachments` | `TaskAttachment` | `taskId`, `sourceType`, `storageKey`, `fileSizeBytes` (`BigInt?`), `deletedAt` |
| **5. Team & KPI (Modul B)** | 18 | `kpi_templates` | `KpiTemplate` | `code` unique, `applicableRoleId`, `metricSource`, `defaultTargetValue` (`Decimal(10,2)`), `defaultWeight` (`Decimal(5,2)`), `deletedAt` |
| | 19 | `kpi_assignments` | `KpiAssignment` | `@@unique([userId, kpiTemplateId, periodYear, periodMonth])`, `targetValue`, `weight` |
| | 20 | `monthly_evaluations` | `MonthlyEvaluation` | `@@unique([userId, periodYear, periodMonth])`, `completionRate`, `onTimeRate`, `avgRevisionCount`, `designQualityScore`, `weightedKpiScore`, `performanceGrade`, `autoMetricsSnapshot` (`Json`) |
| | 21 | `evaluation_items` | `EvaluationItem` | `@@unique([monthlyEvaluationId, kpiTemplateId])`, `indicatorNameSnapshot`, `achievementPct`, `weightedScore` |
| **6. System (Modul D)** | 22 | `notifications` | `Notification` | `recipientId`, `actorId`, `type`, `entityType`, `entityId`, `actionUrl`, `isRead`, `metadata` (`Json`) |
| | 23 | `announcements` | `Announcement` | `priority`, `targetRoleIds` (`String[] @db.Uuid`), `isPinned`, `publishedAt`, `expiresAt`, `deletedAt` |
| | 24 | `announcement_reads` | `AnnouncementRead` | Composite PK `@@id([announcementId, userId])`, `readAt` |
| | 25 | `activity_logs` | `ActivityLog` | **Immutable append-only** (tanpa `updatedAt`/`deletedAt`), `oldValues` (`Json?`), `newValues` (`Json?`), `ipAddress` (`@db.Inet`) |

#### D. Alur Migrasi SQL Manual Tambahan (`prisma migrate dev --create-only`)

Karena fitur lanjutan PostgreSQL 16 (Partial Index, Partial Unique Index, GIN, Trigram, Stored Generated Columns, `CHECK` constraints, Triggers, dan RLS Lockdown) tidak diekspresikan native oleh sintaks Prisma schema, Yoga wajib menjalankan:

```bash
# 1. Buat draft file SQL migrasi tanpa langsung mengeksekusinya
npx prisma migrate dev --create-only --name init_ktms_schema
```

Lalu sisipkan blok SQL berikut ke file `prisma/migrations/<timestamp>_init_ktms_schema/migration.sql` sebelum menjalankan `npx prisma migrate dev` / `npx prisma migrate deploy`:

1. **PostgreSQL Extensions & Sequence:**
   - `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`
   - `CREATE EXTENSION IF NOT EXISTS "pg_trgm";`
   - `CREATE SEQUENCE IF NOT EXISTS seq_task_code_num START 1001;`
2. **Stored Generated & Computed Columns:**
   - Ubah definisi kolom `engagement_rate` dan `ctr` pada `CREATE TABLE "content_analytics"` di `migration.sql` menjadi **Stored Generated Columns** PostgreSQL:
     - `engagement_rate`: `NUMERIC(6,2) GENERATED ALWAYS AS (CASE WHEN reach = 0 THEN 0.00 ELSE LEAST(999.99, ROUND(((likes + comments + shares + saves)::NUMERIC / reach) * 100, 2)) END) STORED`
     - `ctr`: `NUMERIC(6,2) GENERATED ALWAYS AS (CASE WHEN impressions = 0 THEN 0.00 ELSE LEAST(999.99, ROUND((clicks::NUMERIC / impressions) * 100, 2)) END) STORED`
   - **Guard Prisma:** Pada `prisma/schema.prisma`, jangan sertakan `engagementRate` atau `ctr` dalam mutasi `prisma.contentAnalytic.create()` / `update()` (baca hanya via `select` atau raw query).
   - **Computed Fields Service Layer:** `tasks.is_on_time` dihitung saat status berubah ke `DONE` via `effective_completion_time`, sedangkan `monthly_evaluations` (`completion_rate`, `on_time_rate`, `avg_revision_count`, `design_quality_score`, `weighted_kpi_score`, `performance_grade`, `auto_metrics_snapshot`) dan `evaluation_items` (`achievement_pct`, `weighted_score`) dihitung oleh `kpi-aggregator.service.ts` dan dikunci saat `FINALIZED`.
3. **Seluruh 25 Custom Indexes (Checklist Verifikasi 1-per-1):**
   - **Tasks (8 index):**
     1. `idx_tasks_kanban_board` — `(project_id, status, position) WHERE deleted_at IS NULL`
     2. `idx_tasks_my_tasks` — `(assignee_id, status, due_date NULLS LAST) WHERE deleted_at IS NULL`
     3. `idx_tasks_calendar_due` — `(due_date, status, assignee_id) WHERE deleted_at IS NULL AND due_date IS NOT NULL`
     4. `idx_tasks_kpi_period` — `(assignee_id, completed_at, due_date, status) WHERE deleted_at IS NULL AND status <> 'CANCELLED'`
     5. `uq_tasks_active_design_brief` — `CREATE UNIQUE INDEX` pada `(design_brief_id) WHERE design_brief_id IS NOT NULL AND deleted_at IS NULL`
     6. **`uq_tasks_active_content_production`** — `CREATE UNIQUE INDEX` pada `(content_item_id, task_type) WHERE content_item_id IS NOT NULL AND task_type = 'CONTENT_PRODUCTION' AND deleted_at IS NULL` *(mencegah duplikasi task produksi konten aktif untuk 1 content item!)*
     7. `idx_tasks_content_item` — `(content_item_id) WHERE content_item_id IS NOT NULL AND deleted_at IS NULL`
     8. `idx_tasks_tags_gin` — `USING GIN (tags) WHERE deleted_at IS NULL`
   - **Social, Design & Assets (8 index):**
     9. `idx_content_items_calendar` — `(planned_publish_at, platform, status) WHERE deleted_at IS NULL`
     10. `idx_design_briefs_designer_queue` — `(assigned_designer_id, status, due_date) WHERE deleted_at IS NULL`
     11. `idx_design_submissions_brief_ver` — `(design_brief_id, version_number DESC)`
     12. `idx_assets_category_created` — `(category, created_at DESC) WHERE deleted_at IS NULL`
     13. `idx_assets_tags_gin` — `USING GIN (tags) WHERE deleted_at IS NULL`
     14. `idx_assets_metadata_gin` — `USING GIN (metadata jsonb_path_ops) WHERE deleted_at IS NULL`
     15. `idx_assets_title_trgm` — `USING GIN (title gin_trgm_ops) WHERE deleted_at IS NULL`
     16. `idx_tasks_title_trgm` — `USING GIN (title gin_trgm_ops) WHERE deleted_at IS NULL`
   - **Team Directory & KPI (2 index):**
     17. `idx_users_active_role_dept` — `(role_id, department) WHERE deleted_at IS NULL AND is_active = TRUE`
     18. `idx_monthly_eval_period_status` — `(period_year DESC, period_month DESC, status)`
   - **Notifications, Announcements & Activity Logs (7 index):**
     19. `idx_notifications_unread_recipient` — `(recipient_id, created_at DESC) WHERE is_read = FALSE`
     20. `idx_notifications_recipient_feed` — `(recipient_id, created_at DESC)`
     21. `idx_announcements_active_feed` — `(is_pinned DESC, published_at DESC) WHERE deleted_at IS NULL`
     22. `idx_announcements_target_roles_gin` — `USING GIN (target_role_ids) WHERE deleted_at IS NULL`
     23. `idx_activity_logs_entity_timeline` — `(entity_type, entity_id, created_at DESC)`
     24. `idx_activity_logs_actor_module_time` — `(module, actor_id, created_at DESC)`
     25. `idx_activity_logs_new_values_gin` — `USING GIN (new_values jsonb_path_ops)`
4. **`CHECK` Constraints Domain & Integritas:** Tambahkan seluruh `CONSTRAINT chk_*` dari Bagian III §3.3 (termasuk `chk_monthly_eval_no_self CHECK (evaluator_id <> user_id)`, `chk_tasks_done_timestamp`, `chk_tasks_type_fk_alignment`, `chk_design_submissions_upload_key`, dan `chk_assets_upload_key`).
5. **Triggers:** `fn_set_updated_at()` pada 16 tabel ber-`updated_at` dan `fn_prevent_audit_log_mutation()` (`trg_activity_logs_immutable`) pada `activity_logs`.
6. **Supabase RLS Lockdown Script:** `ENABLE ROW LEVEL SECURITY` + `REVOKE ALL ON TABLE public.%I FROM anon, authenticated` pada seluruh 25 tabel `public` (mengecualikan `_prisma_%`).

---

### 2.3 Spesifikasi Lengkap `prisma/seed.ts`

Daftarkan pada `package.json`: `"prisma": { "seed": "tsx prisma/seed.ts" }`. Seeder harus **idempoten (`upsert` / `skipDuplicates`)** sehingga aman dijalankan berulang kali.

#### A. 4 Canonical RBAC Roles (`is_system = true`)

1. `SUPER_ADMIN` — *Super Admin / Leadership*: Akses penuh seluruh sistem, konfigurasi RBAC, manajemen user, dan finalisasi KPI.
2. `PROJECT_MANAGER` — *Project Manager*: Mengelola proyek, alokasi task, persetujuan konten/desain, dan evaluasi KPI tim.
3. `STAFF_CREATOR` — *Staff / Content Creator*: Mengerjakan task, mengusulkan ide konten, menyusun content plan & brief desain, input analitik konten.
4. `DESIGNER` — *Designer*: Mengerjakan task desain, mengunggah versi desain di Design Workspace, dan mengelola Asset Library.

#### B. 42 Kode Permission Kanonik (`module:resource:action`) & Pemetaan Role-Permission (Bagian III §4.2)

| Modul | Kode Permission (42 Total) | `SUPER_ADMIN` (42) | `PROJECT_MANAGER` (36) | `STAFF_CREATOR` (20) | `DESIGNER` (17) |
| :--- | :--- | :---: | :---: | :---: | :---: |
| **A. Tasks (11)** | `tasks:project:read` | Ya | Ya | Ya (Project) | Ya (Project) |
| | `tasks:project:create` | Ya | Ya | Tidak | Tidak |
| | `tasks:project:update` | Ya | Ya (Owner/Lead) | Tidak | Tidak |
| | `tasks:project:delete` | Ya | Tidak | Tidak | Tidak |
| | `tasks:item:read` | Ya | Ya | Ya (Project) | Ya (Project) |
| | `tasks:item:create` | Ya | Ya | Ya (Project) | Ya (Subtask/Own) |
| | `tasks:item:update` | Ya | Ya (Project) | Ya (Own/Assigned) | Ya (Own/Assigned) |
| | `tasks:item:assign` | Ya | Ya (Project) | Tidak | Tidak |
| | `tasks:item:approve` | Ya | Ya (Project) | Tidak | Tidak |
| | `tasks:item:delete` | Ya | Ya (Project) | Tidak | Tidak |
| | `tasks:comment:create` | Ya | Ya | Ya (Project) | Ya (Project) |
| **B. Team & KPI (11)** | `kpi:directory:read` | Ya | Ya | Ya | Ya |
| | `kpi:template:manage` | Ya | Ya | Tidak | Tidak |
| | `kpi:assignment:manage` | Ya | Ya (Team) | Tidak | Tidak |
| | `kpi:performance:read_own` | Ya | Ya (Own) | Ya (Own) | Ya (Own) |
| | `kpi:performance:read_team` | Ya | Ya | Tidak | Tidak |
| | `kpi:evaluation:create` | Ya | Ya (Team) | Tidak | Tidak |
| | `kpi:evaluation:submit` | Ya | Ya (Own) | Ya (Own) | Ya (Own) |
| | `kpi:evaluation:review` | Ya | Ya (Team) | Tidak | Tidak |
| | `kpi:evaluation:finalize` | Ya | Tidak | Tidak | Tidak |
| | `kpi:evaluation:reopen` | Ya | Tidak | Tidak | Tidak |
| | `kpi:report:export` | Ya | Ya | Ya (Own Only) | Ya (Own Only) |
| **C. Social & Design (14)** | `social:idea:read` | Ya | Ya | Ya | Ya |
| | `social:idea:create` | Ya | Ya | Ya | Ya |
| | `social:idea:approve` | Ya | Ya | Tidak | Tidak |
| | `social:content:read` | Ya | Ya | Ya | Ya |
| | `social:content:manage` | Ya | Ya | Ya | Tidak |
| | `social:content:approve` | Ya | Ya | Tidak | Tidak |
| | `social:content:delete` | Ya | Ya | Ya (Own Draft) | Tidak |
| | `social:analytics:manage` | Ya | Ya | Ya | Tidak |
| | `design:brief:read` | Ya | Ya | Ya | Ya (Assigned) |
| | `design:brief:manage` | Ya | Ya | Ya (Create/Own) | Tidak |
| | `design:submission:create` | Ya | Tidak | Tidak | Ya (Assigned) |
| | `design:submission:approve` | Ya | Ya | Tidak | Tidak |
| | `assets:library:read` | Ya | Ya | Ya | Ya |
| | `assets:library:manage` | Ya | Ya | Ya (Upload/Own) | Ya |
| **D. System (6)** | `system:user:read` | Ya | Ya (Read-Only) | Tidak | Tidak |
| | `system:user:manage` | Ya | Tidak | Tidak | Tidak |
| | `system:rbac:manage` | Ya | Tidak | Tidak | Tidak |
| | `system:announcement:read` | Ya | Ya | Ya | Ya |
| | `system:announcement:manage` | Ya | Ya | Tidak | Tidak |
| | `system:audit_log:read` | Ya | Ya (Scoped) | Tidak | Tidak |

#### C. 12 KPI Templates Bawaan (Total Bobot = 100% per Role)

| Role Target (`applicable_role_id`) | Kode Template | Nama Indikator KPI | `category` | `metric_source` | `unit` | `default_weight` | `default_target_value` |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| `PROJECT_MANAGER` | `KPI_PM_TCR` | Team/Project Task Completion Rate | `DELIVERY` | `AUTO_TCR` | `PERCENTAGE` | `30.00` | `95.00` |
| `PROJECT_MANAGER` | `KPI_PM_OTDR` | Team On-Time Delivery Rate | `DELIVERY` | `AUTO_OTDR` | `PERCENTAGE` | `30.00` | `90.00` |
| `PROJECT_MANAGER` | `KPI_PM_PLANNING` | Kualitas Perencanaan & Mitigasi Risiko | `QUALITY` | `MANUAL_SCORE` | `SCORE_100` | `20.00` | `85.00` |
| `PROJECT_MANAGER` | `KPI_PM_COORDINATION` | Koordinasi Tim & Komunikasi Leadership | `COLLABORATION` | `MANUAL_SCORE` | `SCORE_100` | `20.00` | `85.00` |
| **Total `PROJECT_MANAGER`** | — | **4 Indikator** | — | — | — | **`100.00%`** | — |
| `STAFF_CREATOR` | `KPI_SC_TCR` | Individual Task Completion Rate (TCR) | `DELIVERY` | `AUTO_TCR` | `PERCENTAGE` | `25.00` | `95.00` |
| `STAFF_CREATOR` | `KPI_SC_OTDR` | On-Time Delivery Rate (OTDR) | `DELIVERY` | `AUTO_OTDR` | `PERCENTAGE` | `25.00` | `90.00` |
| `STAFF_CREATOR` | `KPI_SC_CPVS` | Pencapaian Target Output Konten (CPVS) | `PRODUCTIVITY` | `AUTO_CPVS` | `COUNT` | `25.00` | `20.00` |
| `STAFF_CREATOR` | `KPI_SC_CREATIVE` | Kualitas Ide, Copywriting & Konsistensi Brand | `CREATIVE` | `MANUAL_SCORE` | `SCORE_100` | `25.00` | `85.00` |
| **Total `STAFF_CREATOR`** | — | **4 Indikator** | — | — | — | **`100.00%`** | — |
| `DESIGNER` | `KPI_DS_TCR` | Individual Task Completion Rate (TCR) | `DELIVERY` | `AUTO_TCR` | `PERCENTAGE` | `25.00` | `95.00` |
| `DESIGNER` | `KPI_DS_OTDR` | On-Time Delivery Rate (OTDR) | `DELIVERY` | `AUTO_OTDR` | `PERCENTAGE` | `25.00` | `90.00` |
| `DESIGNER` | `KPI_DS_DQS` | Design Quality & Revision Score (DQS) | `QUALITY` | `AUTO_DQS` | `SCORE_100` | `30.00` | `85.00` |
| `DESIGNER` | `KPI_DS_VISUAL` | Kreativitas Visual & Kepatuhan Brief | `CREATIVE` | `MANUAL_SCORE` | `SCORE_100` | `20.00` | `85.00` |
| **Total `DESIGNER`** | — | **4 Indikator** | — | — | — | **`100.00%`** | — |

#### D. 4 Akun Demo Internal & 1 Sample Project (`guard: ALLOW_DEMO_SEED === "true"`)

> **Guard Keamanan Production:** `prisma/seed.ts` **hanya** menanamkan 4 akun demo apabila `process.env.NODE_ENV !== "production" && process.env.ALLOW_DEMO_SEED === "true"`. Password di-hash memakai Argon2id (`@node-rs/argon2`, `memoryCost: 19456`, `timeCost: 2`, `parallelism: 1`) dari `process.env.DEMO_SEED_PASSWORD`.

| Role | Email Demo | Nama Lengkap | Jabatan (`job_title`) | Departemen | `token_version` |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `SUPER_ADMIN` | `admin@krevia.digital` | Leadership Krevia (Admin) | Executive Director | Leadership | `1` |
| `PROJECT_MANAGER` | `pm@krevia.digital` | Mhd Yoga Andhika | Project Manager | Operations | `1` |
| `STAFF_CREATOR` | `creator@krevia.digital` | Nta (Creator Demo) | Content Strategist | Creative & Social | `1` |
| `DESIGNER` | `designer@krevia.digital` | Raka Pratama | Visual Designer | Creative & Design | `1` |

- **1 Sample Project + Keanggotaan (`projects` + `project_members`):**
  - `code`: `"KTMS-Q4"`, `name`: `"Krevia Digital Social & Brand Q4"`, `status`: `"ACTIVE"`, `colorHex`: `"#2563EB"`, `ownerId`: user `PROJECT_MANAGER`.
  - Masukkan keempat akun ke `project_members` (`PROJECT_MANAGER` sebagai `OWNER`, `SUPER_ADMIN` sebagai `LEAD`, `STAFF_CREATOR` dan `DESIGNER` sebagai `MEMBER`).

---

### 2.4 Artefak Hari 6–7 Track A (Auth.js v5, RBAC Guard, Audit, Notif & `taskService`)

#### A. Artefak Hari 6 — Auth, Middleware, RBAC & Cross-Cutting Services

| Artefak & File Path | Spesifikasi Implementasi Wajib |
| :--- | :--- |
| **Auth.js v5 Config**<br>`src/server/auth/auth.config.ts`<br>`src/server/auth/auth.ts`<br>`src/app/api/auth/[...nextauth]/route.ts`<br>`src/types/next-auth.d.ts` | - Provider: **Credentials** (`email` lowercase + `password`) memverifikasi Argon2id hash terhadap `users.password_hash` di mana `deletedAt === null && isActive === true`.<br>- Sliding session JWT: `maxAge: 7 * 24 * 60 * 60` (7 hari), cookie `HttpOnly`, `SameSite=Lax`, `Secure` di production.<br>- Klaim token menyertakan `id`, `email`, `name`, `role` (`RoleCode`), `tokenVersion` (`users.token_version`), dan `department`.<br>- Rate limit login pada endpoint callback: maks. **5 percobaan gagal / 15 menit** per kombinasi `email + IP`.<br>- Update `users.last_login_at` saat login sukses. |
| **Edge Middleware**<br>`src/middleware.ts` | - Menggunakan `auth.config.ts` (Edge-compatible, tanpa import Prisma Client).<br>- Melindungi seluruh route `/(dashboard)/**`: pengguna tanpa sesi diarahkan ke `/login?callbackUrl=...`; pengguna ber-sesi di `/login` diarahkan ke `/`.<br>- Mengecualikan `/api/auth/**`, `/api/health`, `/api/cron/deadline-alerts`, dan aset statis (`_next`, `brand/`, `placeholders/`). |
| **RBAC Guard & Revocation**<br>`src/server/auth/rbac.ts` | - `getAuthContext()` dibungkus React `cache()` untuk memoization per HTTP request.<br>- Query `prisma.user.findFirst` dengan `select` eksplisit (`id`, `email`, `fullName`, `roleId`, `tokenVersion`, `role.code`, `role.rolePermissions`) — **dilarang** mengambil `passwordHash`.<br>- **Instant Revocation Check:** Jika `!dbUser || dbUser.tokenVersion !== session.user.tokenVersion`, langsung lempar `DomainError("UNAUTHORIZED", "Sesi telah dicabut...")`.<br>- Ekspor `requireSession()`, `requirePermission(required: PermissionCode | PermissionCode[])`, dan `assertOwnershipOrPermission(user, ownerId, overridePermission)`. |
| **Response & Safe Action**<br>`src/types/action-result.ts`<br>`src/server/actions/safe-action.ts` | - Ekspor `ActionResult<T>`, `ActionErrorCode` (`UNAUTHORIZED`, `FORBIDDEN`, `VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`, `INVALID_STATE_TRANSITION`, `PERIOD_LOCKED`, `INTERNAL_ERROR`), `ok()`, `fail()`, `DomainError`.<br>- `createProtectedAction({ permission, schema, handler })` memanggil `requirePermission` -> `schema.safeParse` -> `handler`, dan memetakan `DomainError` + `PrismaClientKnownRequestError` (`P2002 -> CONFLICT`, `P2025 -> NOT_FOUND`). |
| **Audit Logger**<br>`src/server/services/audit-logger.ts` | - Ekspor `writeAuditLog(tx, input)` untuk dipanggil **di dalam `prisma.$transaction()`**.<br>- Wajib melakukan redaction (`[REDACTED]`) untuk kunci sensitif (`passwordHash`, `password_hash`, `tokenVersion`, `token_version`) sebelum menulis ke `activity_logs`.<br>- Ekspor helper `executeAuditedMutation(ctx, work)` (Bagian III §4.3) untuk eksekusi atomik `work(tx) -> activity_logs -> notifications` dalam 1 transaksi. |
| **Notification Dispatcher**<br>`src/server/services/notification-dispatcher.ts` | - Ekspor `dispatchNotifications(tx, actorId, drafts[])` yang otomatis menyaring `draft.recipientId !== actorId` (anti self-notification) dan menjalankan batch `tx.notification.createMany(...)`. |
| **Health & Polling API**<br>`src/app/api/health/route.ts`<br>`src/app/api/notifications/unread/route.ts` | - `GET /api/health`: Publik tanpa secret; eksekusi `prisma.$queryRaw\`SELECT 1\``; return `200 { status: "ok", db: "connected", timestamp }` (atau `503` jika DB gagal).<br>- `GET /api/notifications/unread`: Memerlukan `requireSession()`; return `Cache-Control: private, no-store` dengan `{ unreadCount, items[] }` (maks 15 notifikasi terbaru milik `user.id`). |

#### B. Artefak Hari 7 — `task.service.ts` (`spawnLinkedTask(tx)` + Gap Positioning)

Implementasikan `src/features/tasks/services/task.service.ts` beserta skrip uji integrasi database agar Track B (Nta) dapat langsung memanggilnya pada Hari 8 (`createContentPlanAction` & `design.actions.ts`):

1. **`generateNextTaskCode(tx)`:** Membaca `SELECT nextval('seq_task_code_num')` via `tx.$queryRaw` dan memformat menjadi `"KTMS-${seq}"` (contoh: `KTMS-1001`).
2. **`computeColumnEndPosition(tx, projectId, status)` & `computeMidpointPosition(prevPos, nextPos)`:**
   - Konstanta jarak gap kanonik: **`POSITION_GAP = 65536`**.
   - Append ke akhir kolom: `MAX(position) + 65536` (atau `65536` bila kolom kosong).
   - Sisip di antara dua kartu Kanban: `(prevPos + nextPos) / 2`. Jika selisih `Math.abs(nextPos - prevPos) < 1e-5`, lakukan re-indexing terurut (`65536, 131072, ...`) untuk kolom `projectId + status` terkait dalam transaksi yang sama.
3. **`spawnLinkedTask(tx, input)`:**
   - Menerima `Prisma.TransactionClient` (`tx`) sehingga berjalan atomik bersama pembuat Content Plan atau Design Brief.
   - Mendukung `taskType: "CONTENT_PRODUCTION" | "DESIGN_TASK"` dan `taskType: "GENERAL"`.
   - Menegakkan kontrak schema: jika `taskType === "DESIGN_TASK"`, wajib ada `designBriefId`; jika `taskType === "CONTENT_PRODUCTION"`, wajib ada `contentItemId` (mengikuti partial unique index `uq_tasks_active_content_production` dan `uq_tasks_active_design_brief`).
   - Memanggil `writeAuditLog(tx, ...)` dan `dispatchNotifications(tx, ...)` (`TASK_ASSIGNED` / `DESIGN_BRIEF_ASSIGNED`) di dalam transaksi yang sama.

---

## 3. Track B Kick-Off Runbook — Nta (Hari 5–7)

**Tanggung Jawab Track B:** Konfigurasi Tailwind CSS & `shadcn/ui` Design System, komponen shared (`StatusBadge`, `PriorityBadge`, `DataTable`, `FileUploadDropzone`), halaman `/login`, App Shell lengkap (`AppSidebar`, `AppTopbar`, `NotificationBellPopover`, `PinnedAnnouncementBanner`, `GlobalSlideOverHost`, `AppProviders`), serta `POST /api/uploads/presign`, `GET /api/uploads/download-url`, dan skeleton halaman Modul B & C.

### 3.1 Instalasi Tailwind CSS & Daftar Primitives `shadcn/ui` (Hari 5)

Setelah PR #1 (Yoga) ter-merge ke `dev`, jalankan inisialisasi `shadcn/ui` pada branch `feat/design-system-nta/ui-kit`:

```bash
npx shadcn@latest init
```

Pasang seluruh **20 primitives `shadcn/ui`** di `src/components/ui/` (**17 primitives standar Bagian IV §1.2** dengan `sonner` sebagai toast + **3 form primitives** `input`, `textarea`, `label`):

```bash
npx shadcn@latest add button badge card dialog sheet table tabs select popover calendar dropdown-menu sonner skeleton tooltip avatar checkbox separator input textarea label
```

*(Catatan: `sonner` bertindak sebagai komponen toast modern pilihan `AppProviders.tsx`; `input`, `textarea`, dan `label` ditambahkan untuk form `/login` dan form drawer).*

**Konfigurasi Design Tokens (`src/app/globals.css` & `src/app/layout.tsx`):**
- Tipografi root via `next/font/google`: `Inter` / `Plus_Jakarta_Sans` (UI) + `JetBrains_Mono` (kode task `#KTMS-1001`, angka skor KPI).
- Variabel tema netral produktif + aksen warna primer Krevia (`#2563EB` blue-600) dengan kontras tinggi untuk mode desktop-first.

---

### 3.2 Spesifikasi Komponen Inti (`StatusBadge`, `PriorityBadge`, `DataTable`, `/login`)

#### A. `StatusBadge.tsx` & `PriorityBadge.tsx` (`src/components/shared/`)

Seluruh nilai enum, label UI, kelas warna Tailwind, dan ikon berikut harus didefinisikan terpusat di `src/lib/constants/enums.ts` dan dirender seragam oleh `StatusBadge.tsx` & `PriorityBadge.tsx` di seluruh 4 modul (sesuai Bagian II §1.4 & Kontrak Payload Bagian IV §2.3):

| Domain Enum | Nilai Enum Kanonik | Label UI | Token Warna Tailwind | Ikon (`lucide-react`) / Penanda |
| :--- | :--- | :--- | :--- | :--- |
| **`TaskStatus`** | `BACKLOG` | Backlog | `bg-slate-100 text-slate-700 border-slate-200` | `CircleDashed` |
| | `TODO` | To Do | `bg-zinc-100 text-zinc-800 border-zinc-200` | `Circle` |
| | `IN_PROGRESS` | In Progress | `bg-blue-100 text-blue-700 border-blue-200` | `Loader2` / `Clock` |
| | `IN_REVIEW` | In Review | `bg-amber-100 text-amber-800 border-amber-200` | `Eye` |
| | `REVISION` | Needs Revision | `bg-rose-100 text-rose-700 border-rose-200` | `RotateCcw` |
| | `DONE` | Done | `bg-emerald-100 text-emerald-700 border-emerald-200` | `CheckCircle2` |
| | `CANCELLED` | Cancelled | `bg-neutral-200 text-neutral-500 line-through border-neutral-300` | `XCircle` |
| **`TaskType`** | `GENERAL` | General Task | `bg-slate-100 text-slate-700 border-slate-200` | `CheckSquare` |
| | `CONTENT_PRODUCTION` | Content Production | `bg-violet-100 text-violet-700 border-violet-200` | `Megaphone` |
| | `DESIGN_TASK` | Design Task | `bg-sky-100 text-sky-700 border-sky-200` | `Palette` |
| **`TaskPriority`**<br>*(di `PriorityBadge`)* | `LOW` | Low | `bg-slate-100 text-slate-700 border-slate-200` | `ChevronDown` |
| | `MEDIUM` | Medium | `bg-sky-100 text-sky-700 border-sky-200` | `Minus` |
| | `HIGH` | High | `bg-orange-100 text-orange-700 border-orange-200` | `ChevronUp` |
| | `URGENT` | Urgent | `bg-red-100 text-red-700 border-red-200` | `AlertTriangle` / `Flag` |
| **`ContentStatus`** | `IDEA` | Idea | `bg-violet-100 text-violet-700 border-violet-200` | `Lightbulb` |
| | `APPROVED_IDEA` | Approved | `bg-indigo-100 text-indigo-700 border-indigo-200` | `Check` |
| | `PLANNING` | Planning | `bg-sky-100 text-sky-700 border-sky-200` | `PenLine` |
| | `IN_DESIGN` | In Design | `bg-blue-100 text-blue-700 border-blue-200` | `Palette` |
| | `DESIGN_REVIEW` | Design Review | `bg-amber-100 text-amber-800 border-amber-200` | `Eye` |
| | `DESIGN_REVISION` | Design Revision | `bg-rose-100 text-rose-700 border-rose-200` | `RotateCcw` |
| | `READY_TO_PUBLISH` | Ready | `bg-teal-100 text-teal-700 border-teal-200` | `Sparkles` |
| | `SCHEDULED` | Scheduled | `bg-cyan-100 text-cyan-700 border-cyan-200` | `CalendarClock` |
| | `PUBLISHED` | Published | `bg-emerald-100 text-emerald-700 border-emerald-200` | `CheckCheck` |
| | `ARCHIVED` | Archived | `bg-slate-100 text-slate-500 border-slate-200` | `Archive` |
| **`DesignSubmissionStatus`** | `PENDING_BRIEF` | Pending | `bg-slate-100 text-slate-700 border-slate-200` | `FileClock` |
| | `IN_PROGRESS` | Working | `bg-blue-100 text-blue-700 border-blue-200` | `Brush` |
| | `SUBMITTED` | Submitted | `bg-amber-100 text-amber-800 border-amber-200` | `UploadCloud` + badge versi (`v1`, `v2`) |
| | `REVISION_REQUESTED` | Revision Req. | `bg-rose-100 text-rose-700 border-rose-200` | `RotateCcw` + counter `(Rev #n)` |
| | `APPROVED` | Approved | `bg-emerald-100 text-emerald-700 border-emerald-200` | `BadgeCheck` |
| **`EvaluationStatus`** | `DRAFT` | Draft | `bg-slate-100 text-slate-700 border-slate-200` | `FileEdit` |
| | `SUBMITTED` | Submitted | `bg-blue-100 text-blue-700 border-blue-200` | `Send` |
| | `REVIEWED` | Reviewed | `bg-amber-100 text-amber-800 border-amber-200` | `ClipboardCheck` |
| | `FINALIZED` | Finalized | `bg-emerald-100 text-emerald-700 border-emerald-200` | `Lock` *(ikon gembok wajib)* |

#### B. Reusable `DataTable` (`src/components/shared/DataTable.tsx`)

- Dibangun di atas **`@tanstack/react-table`**.
- Props standar: `columns: ColumnDef<TData, TValue>[]`, `data: TData[]`, `searchPlaceholder?`, `toolbarSlot?`, `pagination?` (mendukung client pagination maupun server-side pagination meta `{ page, limit, totalItems, totalPages }`), `isLoading?` (`Skeleton`), `emptyState?` (`EmptyState.tsx`), `onRowClick?`.
- Mendukung sorting kolom, filter toolbar slot, dan responsif horizontal scroll agar digunakan seragam di `/tasks/my-tasks`, `/team`, `/assets`, `/system/users`, dan `/system/activity-logs`.

#### C. Halaman `/login` (`src/app/(auth)/layout.tsx` & `src/app/(auth)/login/page.tsx`)

- Layout split/centered minimalis tanpa `AppSidebar` & `AppTopbar`.
- Form berbasis `React Hook Form` + `Zod` (`email` + `password` + tombol show/hide password + loading state saat `signIn("credentials")`).
- Menampilkan pesan error spesifik namun aman (tidak membocorkan apakah email terdaftar atau password salah, kecuali status nonaktif/revoked).
- **Quick-Hint Akun Demo (Dev / Staging Only):**
  - Render panel quick-fill/hint 4 peran (`SUPER_ADMIN`, `PROJECT_MANAGER`, `STAFF_CREATOR`, `DESIGNER`) **HANYA** jika `process.env.NEXT_PUBLIC_ENABLE_DEMO_HINTS === "true" && process.env.NEXT_PUBLIC_APP_ENV !== "production"`.
  - Di environment Production, komponen hint ini tidak boleh me-render kredensial apa pun ke DOM.

---

### 3.3 Spesifikasi App Shell & Providers (Hari 6 — 22 Menu RBAC)

#### A. `AppProviders` (`src/components/providers/AppProviders.tsx` & `QueryProvider.tsx`)

Membungkus `src/app/(dashboard)/layout.tsx` / `src/app/layout.tsx` dengan urutan provider berikut:
1. `SessionProvider` (`next-auth/react`)
2. `QueryProvider` (`@tanstack/react-query` — konfigurasi default dari `src/lib/query-client.ts`: `staleTime: 30_000`, `gcTime: 5 * 60_000`, `retry: 1`, `refetchOnWindowFocus: false` untuk query umum dan `true` khusus polling notifikasi)
3. `NuqsAdapter` (`nuqs/adapters/next/app` untuk sinkronisasi URL filter Kanban, Calendar, dan Activity Logs)
4. `TooltipProvider` (`shadcn/ui`) + `Toaster` (`sonner`)

#### B. `AppSidebar.tsx` (22 Menu Terfilter RBAC via `src/lib/constants/navigation.ts`)

`AppSidebar` menerima daftar `permissions` dan `role` user dari RSC `(dashboard)/layout.tsx`, lalu menyaring **seluruh 22 item menu sidebar** secara deterministik berdasarkan permission kanonik di Bagian II §1.2 & Bagian III §4.2:

| Grup Navigasi | # | Menu Item | Route App Router | Permission / Role Penentu Visibilitas |
| :--- | :-: | :--- | :--- | :--- |
| **Utama** | 1 | Overview Dashboard | `/` | Semua user terautentikasi (`SUPER_ADMIN`, `PROJECT_MANAGER`, `STAFF_CREATOR`, `DESIGNER`) |
| **Modul A: Tasks** | 2 | My Tasks | `/tasks/my-tasks` | `tasks:item:read` *(Semua 4 role)* |
| | 3 | Projects | `/projects` | `tasks:project:read` *(Semua 4 role)* |
| | 4 | Kanban Board | `/tasks/board` | `tasks:item:read` *(Semua 4 role)* |
| | 5 | Work Calendar | `/tasks/calendar` | `tasks:item:read` *(Semua 4 role)* |
| **Modul C: Social & Design** | 6 | Content Calendar | `/content/calendar` | `social:content:read` *(Semua 4 role)* |
| | 7 | Content Ideas | `/content/ideas` | `social:idea:read` *(Semua 4 role)* |
| | 8 | Content Planner | `/content/planner` | `social:content:manage` *(`SUPER_ADMIN`, `PROJECT_MANAGER`, `STAFF_CREATOR`)* |
| | 9 | Design Workspace | `/design/workspace` | `design:brief:read` *(Semua 4 role)* |
| | 10 | Design Review Queue | `/design/reviews` | `design:submission:approve` ATAU `social:content:manage` *(Hidden untuk `DESIGNER` sesuai Matriks §1.2)* |
| | 11 | Asset Library | `/assets` | `assets:library:read` *(Semua 4 role)* |
| | 12 | Content Analytics | `/content/analytics` | `social:content:read` *(tampil read-only bagi `DESIGNER` per Matriks Sidebar Bagian II §1.2; aksi input/update tetap dikunci oleh `social:analytics:manage` untuk `SUPER_ADMIN`, `PROJECT_MANAGER`, `STAFF_CREATOR`)* |
| **Modul B: Team & KPI** | 13 | Team Directory | `/team` | `kpi:directory:read` *(Semua 4 role)* |
| | 14 | Individual Performance | `/team/[selfId]` | `kpi:performance:read_own` *(Semua 4 role; mengarah ke `/team/${user.id}`)* |
| | 15 | Team KPI Dashboard | `/kpi/dashboard` | `kpi:performance:read_team` *(`SUPER_ADMIN`, `PROJECT_MANAGER` — Hidden bagi Staff/Designer)* |
| | 16 | KPI Templates & Targets | `/kpi/templates` | `kpi:template:manage` *(`SUPER_ADMIN`, `PROJECT_MANAGER` — Hidden bagi Staff/Designer)* |
| | 17 | Monthly Evaluations | `/kpi/evaluations` | `kpi:evaluation:submit` ATAU `kpi:evaluation:review` *(Semua 4 role; Staff/Designer hanya lihat miliknya)* |
| | 18 | Reports & Analytics | `/kpi/reports` | `kpi:performance:read_team` *(`SUPER_ADMIN`, `PROJECT_MANAGER` — Hidden di sidebar bagi Staff/Designer per §1.2; Staff/Designer mengunduh rapor pribadinya dari `/kpi/evaluations/[evaluationId]` via `kpi:report:export`)* |
| **Modul D: System** | 19 | Announcements | `/announcements` | `system:announcement:read` *(Semua 4 role)* |
| | 20 | User Management | `/system/users` | `system:user:manage` *(`SUPER_ADMIN` ONLY)* |
| | 21 | Roles & Permissions | `/system/roles` | `system:rbac:manage` *(`SUPER_ADMIN` ONLY)* |
| | 22 | Activity Logs | `/system/activity-logs` | `system:audit_log:read` *(`SUPER_ADMIN`, `PROJECT_MANAGER` — Hidden bagi Staff/Designer)* |

- **Responsivitas Sidebar:** Desktop `>= 1280px` lebar `240px` (dapat diperkecil ke `64px` icon-only via Zustand `ui-store.ts` `sidebarCollapsed`); Laptop `1024px–1279px` otomatis compact `64px` saat drawer terbuka; `< 1024px` berubah menjadi `Sheet` drawer mobile.

#### C. `AppTopbar.tsx`, `NotificationBellPopover.tsx`, `PinnedAnnouncementBanner.tsx` & `GlobalSlideOverHost.tsx`

1. **`AppTopbar.tsx`:**
   - **Breadcrumb dinamis** berdasarkan pathname aktif.
   - **Shortcut Trigger (`Ctrl+K` / `Cmd+K`):** Placeholder button command search (siap dihubungkan di Sprint Minggu 2).
   - **Quick Create (`+`) Menu:** Menampilkan opsi aksi sesuai permission role aktif (`Task`, `Project`, `Content Idea`, `Announcement`, atau `Design Upload`).
   - **`NotificationBellPopover.tsx`:** Menggunakan hook `useUnreadNotifications.ts` (`TanStack Query` polling **`refetchInterval: 30_000`**, `refetchIntervalInBackground: false`, `refetchOnWindowFocus: true`) ke `GET /api/notifications/unread`. Menampilkan badge angka `unreadCount`, daftar maks 15 item terbaru, aksi *Mark as Read* / *Mark All Read*, dan tautan `Lihat semua di /notifications`.
   - **User Menu:** Avatar + Nama + Badge Role (`SUPER_ADMIN` / `PROJECT_MANAGER` / `STAFF_CREATOR` / `DESIGNER`), link ke `/team/${user.id}`, dan tombol Logout (`signOut`).
2. **`PinnedAnnouncementBanner.tsx`:**
   - Dirender di atas Topbar pada `(dashboard)/layout.tsx`.
   - Menampilkan **maksimal 3 pengumuman aktif** dengan `isPinned = true`, `deletedAt = null`, dan sesuai `targetRoleIds` (atau broadcast semua role).
   - Mendukung warna semantik `announcement_priority_enum` (`INFO`, `IMPORTANT`, `URGENT`) dan tombol dismiss per sesi / `markAnnouncementReadAction`.
3. **`GlobalSlideOverHost.tsx`:**
   - Membaca `activeDrawer` dari `useUIStore()` (`TASK_DETAIL`, `CONTENT_DETAIL`, `DESIGN_REVIEW`) dan menyinkronkannya dengan URL query (`?drawer=task&id=<uuid>`).
   - Merender `Sheet` berukuran **`520px`** di sisi kanan tanpa me-reset posisi scroll kanvas Kanban atau Calendar. Pada Hari 6, isi detail drawer dapat memakai komponen kerangka ter-fetch on-demand (`enabled: Boolean(activeDrawer)`), lalu diisi penuh di Hari 8–9.

---

### 3.4 Spesifikasi Presigned Storage UI & Route Handlers (Hari 7)

Seluruh unggahan file di KTMS **wajib** memakai alur Direct-to-Storage Presigned URL (menghindari payload limit 4,5 MB serverless) atau External Cloud Link (Bagian III §1.3 & Bagian IV Kontrak 6).

#### A. Server Storage Utility & Route Handlers (`src/server/storage/presigned.ts`)

1. **`POST /api/uploads/presign` (`src/app/api/uploads/presign/route.ts`):**
   - **Auth & RBAC Check per `bucketFolder`:**
     - `"design-submissions"` -> wajib `design:submission:create`
     - `"assets"` -> wajib `assets:library:manage`
     - `"task-attachments"` -> wajib `tasks:item:update`
     - `"avatars"` -> wajib `requireSession()` *(Authenticated Self)*
   - **Rate Limiting:** Maksimal **30 request / menit** per `user.id`.
   - **Validasi Payload Zod:**
     - `bucketFolder`: `"design-submissions" | "assets" | "task-attachments" | "avatars"`
     - `fileName`: string non-empty (disanitasi via `slugify` dan dibuang karakter path traversal `../`, `/`, `\`).
     - `mimeType` & **Max Size Cap:**
       - `avatars`: whitelist `image/jpeg`, `image/png`, `image/webp`; batas keras **`2_097_152` bytes (2 MB)**.
       - `design-submissions` & `assets`: whitelist **`image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`, `application/pdf`, `video/mp4`**; batas keras **`26_214_400` bytes (25 MB)**.
       - `task-attachments`: mendukung whitelist `image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`, `application/pdf`, `video/mp4`, serta dokumen kerja `application/vnd.openxmlformats-officedocument.*`, `text/csv`, `application/zip` dengan batas keras **`26_214_400` bytes (25 MB)**.
   - **Standardisasi `storageKey`:** `ktms/${env}/${bucketFolder}/${userIdOrPeriod}/${crypto.randomUUID()}-${sanitizedFileName}` (UUID acak, anti *path traversal*).
   - **Output (`200 OK`):** `{ uploadUrl, storageKey, expiresInSeconds: 300 }` (**TTL Signed PUT URL tepat `300` detik / 5 menit**).

2. **`GET /api/uploads/download-url` (`src/app/api/uploads/download-url/route.ts`):**
   - **Auth & RBAC Check:** Memverifikasi `requireSession()` serta hak baca atas entitas pemilik `storageKey` (`design_submissions`, `assets`, `task_attachments`, atau `users` avatar).
   - **Signed GET URL:** Memanggil Supabase Storage `createSignedUrl(storageKey, 900, { download: isSvg ? sanitizedName : false })` (TTL **15 menit / 900 detik**).
   - **Keamanan XSS Wajib untuk SVG:** Apabila file ber-MIME `image/svg+xml` atau berakhiran `.svg`, server **WAJIB** memaksa opsi **`Content-Disposition: attachment`** agar browser tidak mengeksekusi script inline saat pratinjau/unduhan dibuka.
   - Header response endpoint API wajib menyertakan `Cache-Control: private, no-store`.

#### B. `FileUploadDropzone.tsx` & `usePresignedUpload.ts` (`src/components/shared/` & `src/features/social-design/hooks/`)

- Menyediakan 2 tab/mode dalam 1 komponen terpadu:
  1. **Tab 1 — Upload File (Direct Storage, maks. 25 MB / Avatar 2 MB):**
     - Drag & drop area + file picker.
     - Validasi client-side awal terhadap ekstensi/MIME dan batas ukuran; jika `> 25 MB`, langsung tampilkan peringatan ramah mengarahkan ke Tab **External Link**.
     - Alur `usePresignedUpload`: `POST /api/uploads/presign` -> `fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file })` dengan progress indicator -> kembalikan metadata `{ sourceType: "UPLOAD", storageKey, fileName, mimeType, fileSizeBytes }`.
  2. **Tab 2 — External Cloud Link (`FIGMA`, `CANVA`, `GOOGLE_DRIVE`, `OTHER_LINK`):**
     - Wajib dipakai untuk file mentah berukuran **`> 25 MB`** (video Reels mentah, Adobe Illustrator, Figma master file).
     - Validasi URL ketat: hanya mengizinkan protokol **`https://`** (menolak `http://`, `javascript:`, `data:`, maupun host lokal/IP privat `localhost`/`127.0.0.1`/`169.254.*` untuk mencegah SSRF).
     - Auto-detect `sourceType` berdasarkan hostname (`figma.com` -> `FIGMA`, `canva.com` -> `CANVA`, `drive.google.com` / `docs.google.com` -> `GOOGLE_DRIVE`, lainnya -> `OTHER_LINK`).

#### C. Skeleton Halaman Modul B & C (Hari 7)

Nta menyiapkan kerangka rute (`page.tsx` dengan `<EmptyState />` & layout header standar) agar seluruh navigasi `AppSidebar` tidak menghasilkan `404` saat Smoke Test Hari 7:
- Modul C: `/content/calendar`, `/content/ideas`, `/content/planner`, `/content/analytics`, `/design/workspace`, `/design/reviews`, `/assets`.
- Modul B: `/team`, `/team/[userId]`, `/kpi/templates`, `/kpi/dashboard`, `/kpi/evaluations`, `/kpi/evaluations/[evaluationId]`, `/kpi/reports`.

---

## 4. Koordinasi PR Anti-Konflik (PR #1 s/d PR #6) & Verifikasi Gate Hari 5–7

### 4.1 Urutan Merge PR #1–#6 & Aturan Shared-Touch Files

Untuk memastikan **zero merge conflict** selama Hari 5–7, Yoga dan Nta mengikuti urutan berantai PR ke branch `dev` di bawah ini. Aturan emas: **Track B selalu me-rebase dari `dev` segera setelah PR Track A pada hari yang sama di-merge**, dan keduanya tidak menyentuh direktori eksklusif rekannya.

```mermaid
flowchart LR
    PR1["Hari 5 — PR #1 (Yoga): Repo Init, CI, Prisma 25 Tabel + Seed"] --> PR2["Hari 5 — PR #2 (Nta): Tailwind, shadcn/ui, StatusBadge, DataTable, /login"]
    PR2 --> PR3["Hari 6 — PR #3 (Yoga): Auth.js v5, Middleware, RBAC, SafeAction, Audit, /api/health"]
    PR3 --> PR4["Hari 6 — PR #4 (Nta): AppProviders, AppSidebar 22 Menu, Topbar, Banner, Drawer Host"]
    PR4 --> PR5["Hari 7 — PR #5 (Yoga): task.service.ts spawnLinkedTask + 65536 Gap + DB Tx Test"]
    PR5 --> PR6["Hari 7 — PR #6 (Nta): Presigned Upload/Download API, FileUploadDropzone + Modul B/C Skeletons"]
```

| Urutan PR | Hari | Owner | Branch Kerja | Scope File Eksklusif | Reviewer & SLA | Syarat Merge ke `dev` |
| :-: | :-: | :--- | :--- | :--- | :--- | :--- |
| **PR #1** | Hari 5 | **Yoga** | `chore/platform-yoga/init-prisma-seed` | `package.json`, `tsconfig.json`, `next.config.ts`, `.github/workflows/ci.yml`, `.env.example`, `src/lib/env.ts`, `src/server/db/prisma.ts`, `prisma/**` | **Nta** (< 2 jam) | `prisma validate` + migrasi 25 tabel & seed berhasil di Supabase Staging; CI hijau. |
| **PR #2** | Hari 5 | **Nta** | `feat/ui-nta/design-system-login` | `src/app/globals.css`, `src/app/layout.tsx`, `components.json`, `src/components/ui/**`, `src/components/shared/StatusBadge.tsx`, `PriorityBadge.tsx`, `DataTable.tsx`, `EmptyState.tsx`, `ConfirmDialog.tsx`, `src/lib/constants/enums.ts`, `src/app/(auth)/**` | **Yoga** (< 2 jam) | Rebase di atas PR #1; CI hijau + screenshot UI Kit & `/login` di Vercel Preview. |
| **PR #3** | Hari 6 | **Yoga** | `feat/auth-yoga/authjs-rbac-plumbing` | `src/middleware.ts`, `src/types/next-auth.d.ts`, `src/types/action-result.ts`, `src/server/auth/**`, `src/server/actions/safe-action.ts`, `src/server/services/audit-logger.ts`, `notification-dispatcher.ts`, `src/lib/constants/permissions.ts`, `src/app/api/auth/**`, `src/app/api/health/route.ts`, `src/app/api/notifications/unread/route.ts` | **Nta** (< 2 jam) | Login 4 akun role berfungsi; `getAuthContext` cek `tokenVersion`; `/api/health` 200 OK; CI hijau. |
| **PR #4** | Hari 6 | **Nta** | `feat/shell-nta/app-shell-providers` | `src/components/providers/**`, `src/components/layout/**`, `src/lib/query-client.ts`, `src/lib/stores/ui-store.ts`, `src/lib/constants/navigation.ts`, `src/features/system/hooks/useUnreadNotifications.ts`, `src/app/(dashboard)/layout.tsx`, `loading.tsx`, `page.tsx` | **Yoga** (< 2 jam) | Rebase di atas PR #3; 22 menu sidebar berubah akurat untuk 4 role login di Staging Vercel Preview. |
| **PR #5** | Hari 7 | **Yoga** | `feat/tasks-yoga/spawn-linked-task-service` | `src/features/tasks/services/task.service.ts`, skrip uji transaksi atomik DB, serta skeleton rute Modul A & D (`/projects/**`, `/tasks/**`, `/system/**`, `/announcements`, `/notifications`) | **Nta** (< 2 jam) | `spawnLinkedTask(tx)` sukses membuat task + `activity_logs` + `notifications` atomik dengan `position` gap `65536`. |
| **PR #6** | Hari 7 | **Nta** | `feat/storage-nta/presigned-upload-skeletons` | `src/server/storage/presigned.ts`, `src/app/api/uploads/presign/route.ts`, `src/app/api/uploads/download-url/route.ts`, `src/components/shared/FileUploadDropzone.tsx`, `src/features/social-design/hooks/usePresignedUpload.ts`, `src/lib/validations/common.ts`, serta skeleton rute Modul B & C | **Yoga** (< 2 jam) | Rebase di atas PR #5; demo upload PNG/PDF & download SVG (`Content-Disposition: attachment`) via Supabase Storage `ktms-media` + fallback External Link sukses. |

#### Aturan Ketat File Bersama (*Shared-Touch Files*)

File berikut **tidak boleh diubah diam-diam di dalam PR fitur besar**:
- `prisma/schema.prisma` *(Schema Gatekeeper: **Yoga**)*
- `package.json` & `package-lock.json`
- `src/lib/constants/enums.ts`
- `src/lib/constants/permissions.ts`
- `src/lib/constants/navigation.ts`

Apabila perubahan pada salah satu file di atas dibutuhkan setelah hari ke-5, pengaju wajib membuat PR kecil terisolasi yang hanya menyentuh file bersama tersebut, mengumumkan di grup sync **09:30 WIB** / **13:00 WIB**, dan menunggu approval rekan (**SLA Review maks. 1 jam**).

---

### 4.2 Matriks Verifikasi Objektif (Hari 5, Hari 6, Hari 7)

Setiap PR dan setiap tutup hari (sebelum laporan 17:30 WIB) **wajib** lulus seluruh perintah verifikasi lokal dan smoke test berikut:

#### A. Perintah Verifikasi Teknis Wajib (Lokal & CI)

```bash
# 1. Validasi sintaks & relasi schema Prisma (21 ENUM, 25 Tabel)
npx prisma validate

# 2. Generate Prisma Client & cek sinkronisasi migrasi
npx prisma generate
npx prisma migrate status

# 3. Verifikasi TypeScript strict (0 error)
npx tsc --noEmit

# 4. Verifikasi ESLint (0 error)
npm run lint

# 5. Verifikasi Production Build Next.js App Router (0 error)
npm run build
```

#### B. Smoke Check Endpoint & Fungsionalitas per Gate Harian

| Gate Harian | Pemeriksaan Objektif & Cara Menguji | Kriteria Lulus (*Pass*) |
| :--- | :--- | :--- |
| **Hari 5 Gate** | 1. Jalankan `npx prisma db seed` lalu verifikasi isi tabel di Prisma Studio / SQL.<br>2. Buka `/login` pada Vercel Preview URL. | - 25 tabel & 21 enum tercipta + RLS aktif di Supabase.<br>- Seed berisi tepat **4 roles**, **42 permissions**, **12 KPI templates** (bobot 100% per role), **1 sample project**, dan **4 demo accounts**.<br>- Halaman `/login` + showcase `StatusBadge`/`PriorityBadge`/`DataTable` tampil rapi. |
| **Hari 6 Gate** | 1. `curl -i https://staging-ktms.vercel.app/api/health`<br>2. Uji akses `/tasks/board` tanpa login.<br>3. Login bergantian dengan 4 akun demo (`SUPER_ADMIN`, `PROJECT_MANAGER`, `STAFF_CREATOR`, `DESIGNER`).<br>4. Uji instant revocation: naikkan `token_version` +1 di DB untuk 1 user aktif lalu refresh halaman. | - `/api/health` mengembalikan `200 OK` dengan `{ status: "ok", db: "connected" }`.<br>- Akses tanpa sesi di-redirect ke `/login`.<br>- Jumlah & daftar menu di `AppSidebar` berubah otomatis per role sesuai Matriks 22 Menu.<br>- Sesi user yang `token_version`-nya dinaikkan langsung tertolak (`UNAUTHORIZED` -> redirect `/login`). |
| **Hari 7 Gate** | 1. Uji `POST /api/uploads/presign` dengan file `> 25 MB` (atau avatar `> 2 MB`) dan file `.exe` / `text/html`.<br>2. Upload file PNG/PDF valid lewat `FileUploadDropzone` lalu akses `GET /api/uploads/download-url`.<br>3. Uji `GET /api/uploads/download-url` untuk file `.svg`.<br>4. Jalankan test integrasi `taskService.spawnLinkedTask(tx)`. | - File `> 25 MB` dan MIME terlarang ditolak `400`/`415`; upload valid sukses ke bucket `ktms-media` via signed PUT TTL `300s`.<br>- Download `.svg` mengembalikan header **`Content-Disposition: attachment`**.<br>- `spawnLinkedTask(tx)` menulis 1 baris `tasks` (`position: 65536` / kelipatannya), 1 `activity_logs`, dan 1 `notifications` dalam 1 transaksi atomik. |

---

### 4.3 Format Bukti Laporan EOD 17:30 WIB (Hari 5, 6 & 7)

Sesuai komitmen akuntabilitas ke Leadership Krevia Digital (Bagian IV §3.5), Yoga dan Nta wajib mengirim laporan ringkas pukul **17:30 WIB** ke grup Leadership dengan bukti nyata (**bukan status verbal**):

#### Template Copy-Paste EOD — Hari 5 / 14
```markdown
[KTMS DAILY UPDATE — HARI 5 / 14] — Tanggal: DD/MM/2026
Status Timeline: ON TRACK
Link Staging Terbaru: https://staging-ktms.vercel.app

1. DONE HARI INI (Dengan Bukti Nyata):
   - [Yoga] Repo Next.js 15 strict + GitHub Actions CI + Prisma schema (25 tabel, 21 enum, 25 index, RLS lockdown) + seed (4 role, 42 permission, 12 KPI template, 1 project, 4 akun demo) selesai (PR #1 merged — screenshot Prisma Studio & CI hijau terlampir).
   - [Nta] Konfigurasi Tailwind + 20 primitives shadcn/ui (17 standar Bagian IV §1.2 + input/textarea/label) + StatusBadge/PriorityBadge (6 enum kanonik) + DataTable + halaman /login selesai (PR #2 merged — Vercel Preview URL /login terlampir).

2. FOKUS BESOK (Hari 6 / 14):
   - [Yoga] Auth.js v5 (token_version revocation), src/middleware.ts, rbac.ts, safe-action.ts, audit-logger.ts, notification-dispatcher.ts, dan GET /api/health (PR #3).
   - [Nta] AppSidebar (22 menu terfilter RBAC), AppTopbar + NotificationBellPopover (polling 30s), PinnedAnnouncementBanner, GlobalSlideOverHost, dan AppProviders (PR #4).

3. BLOCKER / BUTUH KEPUTUSAN LEADERSHIP:
   - Tidak ada blocker. (atau sebutkan blocker > 4 jam bila ada beserta opsi solusi).
```

#### Template Copy-Paste EOD — Hari 6 / 14
```markdown
[KTMS DAILY UPDATE — HARI 6 / 14] — Tanggal: DD/MM/2026
Status Timeline: ON TRACK
Link Staging Terbaru: https://staging-ktms.vercel.app

1. DONE HARI INI (Dengan Bukti Nyata):
   - [Yoga] Auth.js v5 Credentials + token_version revocation, middleware, RBAC guard, safe-action wrapper, audit-logger, notification-dispatcher, /api/notifications/unread & GET /api/health live (PR #3 merged — output curl /api/health 200 OK terlampir).
   - [Nta] App Shell lengkap (AppSidebar 22 menu dinamis RBAC, AppTopbar, NotificationBellPopover 30s, PinnedAnnouncementBanner maks 3, GlobalSlideOverHost, AppProviders) live di Staging (PR #4 merged — 4 screenshot tampilan sidebar per role terlampir).

2. FOKUS BESOK (Hari 7 / 14):
   - [Yoga] taskService.spawnLinkedTask(tx) + fractional 65536 gap positioning + integration test atomic $transaction & audit log (PR #5).
   - [Nta] POST /api/uploads/presign (TTL 300s, cap 25 MB/2 MB), GET /api/uploads/download-url (SVG attachment), FileUploadDropzone + fallback External Link & skeleton Modul B/C (PR #6).

3. BLOCKER / BUTUH KEPUTUSAN LEADERSHIP:
   - Tidak ada blocker.
```

#### Template Copy-Paste EOD — Hari 7 / 14 (Penutup Minggu 1 / Ready-for-Sprint Gate)
```markdown
[KTMS DAILY UPDATE — HARI 7 / 14] — Tanggal: DD/MM/2026 (READY FOR WEEK 2 SPRINT)
Status Timeline: ON TRACK
Link Staging Terbaru: https://staging-ktms.vercel.app

1. DONE HARI INI (Dengan Bukti Nyata):
   - [Yoga] taskService.spawnLinkedTask(tx) + fractional 65536 gap positioning + skeleton rute Modul A & D selesai (PR #5 merged — log hasil uji atomic transaction tasks + activity_logs + notifications terlampir).
   - [Nta] Storage Presigned Upload/Download API (Supabase private bucket ktms-media + CORS + SVG Content-Disposition: attachment) + FileUploadDropzone + skeleton Modul B & C selesai (PR #6 merged — video demo 2 menit upload PNG/PDF & link Figma terlampir).

2. FOKUS BESOK (Hari 8 / 14 — Awal Sprint Fitur Inti):
   - [Yoga] Modul A: Project Management (/projects), CRUD Task & My Tasks (/tasks/my-tasks), serta cron /api/cron/deadline-alerts.
   - [Nta] Modul C: Content Ideas (/content/ideas) & Content Planner (/content/planner) dengan Auto-Spawn Design Brief & Task.

3. BLOCKER / BUTUH KEPUTUSAN LEADERSHIP:
   - Pengingat H-4 tenggat data tim: Mohon daftar nama, email resmi, jabatan & role anggota tim Krevia diserahkan sebelum Hari 11 (17:00 WIB) untuk seeding UAT Hari 13.
```
