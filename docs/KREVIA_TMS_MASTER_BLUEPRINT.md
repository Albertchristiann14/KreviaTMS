# KREVIA TEAM MANAGEMENT SYSTEM (KTMS) — MASTER ARCHITECTURE & PRE-CODING BLUEPRINT

> *Krevia Digital — Build Smarter. Operate Better.*

---

### Kontrol Dokumen (*Document Control*)

| Atribut | Spesifikasi Resmi |
| :--- | :--- |
| **Nama Produk** | **Krevia Team Management System (KTMS)** — Internal Operations & Team Management Web Application (V1) |
| **Organisasi** | **Krevia Digital** (*"Build Smarter. Operate Better."*) |
| **Versi Dokumen** | **`1.0 (Pre-Coding Sign-Off Ready)`** |
| **Disusun Untuk** | **Leadership Krevia Digital** (Persetujuan Eksekutif, Tata Kelola Scope & Demo Gate) dan **Tim Engineering: Mhd Yoga Andhika & Nta** (2 Full-Stack Developers) |
| **Timeline Proyek** | **14 Hari Kalender (2 Minggu)** — **Minggu 1 (Hari 1–7):** Planning, Analysis, UI/UX Design, DB/Architecture & Foundation Setup · **Minggu 2 (Hari 8–14):** Sprint Development, Cross-Module Integration, QA/UAT & Production Go-Live |
| **Status Verifikasi** | **Cross-Verified** lintas 4 disiplin (Product & SRS, UX & System Flows, PostgreSQL 16 Database & RBAC, Next.js 15 Architecture & Roadmap) — 100% selaras pada Role, Enum, Formula KPI, SQL DDL, 42 RBAC Permissions, & API Contracts |
| **Batasan Ruang Lingkup V1** | Desktop-First Responsive Internal Web App. **Strictly Out of Scope V1:** Native Mobile App (iOS/Android), External Client Portal, Full HRIS (Payroll/Slip Gaji, Absensi Geofencing/Biometrik, Rekrutmen), Social Media Auto-Publish API, Real-Time Chat Internal |
| **Arsip Modul Sumber** | Konsolidasi utuh (*unabridged*) dari `docs/blueprint/01-product-srs.md`, `02-system-flows-use-cases.md`, `03-database-backend.md`, dan `04-nextjs-architecture-roadmap.md` |

---

## Panduan Membaca Dokumen (Dual-Audience Guide)

Dokumen Master Blueprint ini dirancang untuk melayani **dua audiens utama sekaligus** tanpa memisahkan konteks bisnis dari spesifikasi teknisnya: **Leadership Krevia Digital** (sebagai pengambil keputusan strategis & pengawas progres) dan **Tim Engineering — Mhd Yoga Andhika & Nta** (sebagai pelaksana teknis sprint 14 hari).

### Peta Baca Cepat untuk Leadership Krevia Digital (Estimasi: 15–20 Menit)

Gunakan jalur baca berikut untuk meninjau arah bisnis, menjaga batas ruang lingkup V1, memvalidasi alur kerja tim, dan memberikan persetujuan **Gate 1 (Hari 4)**:

| Urutan | Fokus Keputusan Leadership | Bagian & Tautan Langsung |
| :---: | :--- | :--- |
| **1** | **Gambaran 1 Halaman Arsitektur, Modul, Role & Milestone** | [Ringkasan Arsitektur Terpadu](#ringkasan-arsitektur-terpadu-executive-single-page-reference) |
| **2** | **Masalah Operasional (*Before vs After*), Visi, KPI Adopsi & Scope Guardrails V1** | [Bagian I §1 — Ringkasan Eksekutif & Tujuan Bisnis](#1-ringkasan-eksekutif--tujuan-bisnis-executive-summary) |
| **3** | **Prioritas MoSCoW V1 (19 Must-Have) & Rencana Kontingensi De-Scoping** | [Bagian I §4 — Prioritization Matrix (MoSCoW)](#4-prioritization-matrix-moscow--v1-2-minggu-vs-iterasi-berikutnya-v11--v2) |
| **4** | **Alur Kerja Harian Tim (Task, Konten/Desain, KPI Bulanan, Notifikasi/Audit)** | [Bagian II §2 — End-to-End User Flows (4 Skenario)](#2-end-to-end-user-flows-4-skenario-operasional-harian-krevia) |
| **5** | **Justifikasi Pilihan Tech Stack (Next.js 15 + PostgreSQL 16 vs NestJS / Laravel+MySQL)** | [Bagian III §1 — Rekomendasi Arsitektur Backend](#1-rekomendasi-arsitektur-backend--justifikasi-teknis) |
| **6** | **Pembagian Kerja Yoga & Nta, Laporan Harian 17:30 WIB, 3 Demo Gate & Risk Register** | [Bagian IV §3 — Pembagian Kerja & Roadmap Eksekusi 14 Hari](#3-pembagian-kerja--roadmap-eksekusi-harian-14-hari-mhd-yoga-andhika--nta) |
| **7** | **Persetujuan Formal Pre-Coding (Gate 1 / Hari 4)** | [Lampiran — Lembar Persetujuan Pre-Coding Blueprint](#lampiran--lembar-persetujuan-pre-coding-blueprint-leadership-sign-off-checklist--gate-1--hari-4) |

### Peta Baca Cepat untuk Tim Developer (Mhd Yoga Andhika & Nta)

Gunakan jalur referensi berikut sebagai **Single Source of Truth** saat menginisialisasi repositori (Hari 5), menulis skema Prisma, membangun fitur per *vertical slice*, dan melakukan QA (Hari 13):

| Fokus Implementasi | Acuan Teknis Spesifik | Tautan Langsung |
| :--- | :--- | :--- |
| **Kebutuhan Fungsional, Formula KPI & Kriteria UAT** | 25 FR (`FR-A01`–`FR-D05`), 4 Integrasi Lintas Modul (`FR-INT-01`–`FR-INT-04`), Formula `TCR`/`OTDR` (`first_submitted_at`)/`DQS`/`CPVS`/`N/A` *re-normalization*, 15 NFR, & 24 User Stories (*Given-When-Then*) | [Bagian I §2 (SRS)](#2-software-requirement-specification-srs--4-modul-utama) · [Bagian I §3 (User Stories)](#3-user-stories--acceptance-criteria-given-when-then) |
| **Navigasi RBAC, Use Cases & State Machine** | Sitemap 22 menu, Wireframe 3-Zone + Slide-Over Drawer, 14 Use Cases (`UC-01`–`UC-14`), 4 State Transition Matrices, & 6 Titik Sinkronisasi Atomik `prisma.$transaction()` | [Bagian II §1 (IA & UX)](#1-information-architecture--navigasi-ux) · [Bagian II §3 (Use Cases)](#3-use-case-specifications-lengkap-14-use-case-utama--modul-a-sd-d) · [Bagian II §4 (State Matrix)](#4-matriks-state-transition-lengkap-4-entitas-inti--cross-module-sync) |
| **Skema PostgreSQL 16, Indexing, CTE KPI & RBAC Guard** | Master ERD + Cross-Module Sub-ERD, 21 ENUMs, Data Dictionary & SQL DDL 25 Tabel (*copy-paste ready*), 25 Custom Indexes, CTE KPI & Frozen Snapshot, 42 RBAC Permissions, `requirePermission` & `writeAuditLog` | [Bagian III §2 (ERD)](#2-entity-relationship-diagram-erd-lengkap) · [Bagian III §3 (DDL & KPI SQL)](#3-skema-tabel-postgresql-detail-data-dictionary-enum-ddl--indexing) · [Bagian III §4 (RBAC & Security)](#4-desain-role-based-access-control-rbac--keamanan-data) |
| **Struktur Next.js 15, API Contracts & Jadwal Harian** | Feature-Sliced Folder Tree, 26 UI Page Routes, 28 Protected Server Actions, 15 `/api/**` Route Handlers, 6 Grup Kontrak TypeScript & 14 JSON Payloads, Track A (Yoga) vs Track B (Nta), & 10-Point Production V1 DoD | [Bagian IV §1 (Folder & Pola Kode)](#1-arsitektur-proyek--struktur-folder-nextjs-app-router--feature-sliced-modular) · [Bagian IV §2 (Routes & Payloads)](#2-daftar-route-aplikasi-api-endpoints--server-actions--kontrak-payload) · [Bagian IV §3 (Roadmap 14 Hari)](#3-pembagian-kerja--roadmap-eksekusi-harian-14-hari-mhd-yoga-andhika--nta) |

> **Ringkasan Ownership Anti-Konflik:**
> - **Mhd Yoga Andhika (Track A — Platform/Backend Lead + Modul A & D):** Repo/CI, Prisma Schema & Seed, Auth.js v5 + RBAC Guard, `audit-logger.ts`, `notification-dispatcher.ts`, `taskService.spawnLinkedTask(tx)`, **Modul A (Task Management)**, **Modul D (System Management)**, dan Executive Home `/`.
> - **Nta (Track B — Frontend/UI Lead + Modul C & B):** Tailwind + shadcn/ui Design System, App Shell (`AppSidebar`, `AppTopbar`, `GlobalSlideOverHost`), Presigned Storage Upload/Download UI, **Modul C (Social Media & Design Management)**, dan **Modul B (Team Management & KPI)**.

---

## Ringkasan Arsitektur Terpadu (Executive Single-Page Reference)

Tabel berikut merangkum seluruh keputusan arsitektur, modul fungsional, peran akses, enum kanonik, inventaris artefak teknis, serta jadwal gerbang validasi (*Demo Gates*) KTMS V1 dalam satu pandangan:

| Dimensi Arsitektur | Spesifikasi Kanonik KTMS V1 (Cross-Verified) |
| :--- | :--- |
| **Tech Stack Final** | **Frontend & App Shell:** Next.js 15+ (App Router, React 19, TypeScript *strict*), Tailwind CSS, `shadcn/ui`, `@dnd-kit` (Kanban DnD), TanStack Table & TanStack Query v5, `Recharts`, `nuqs`, Zod + React Hook Form · **Backend:** Hybrid Next.js (**28 Server Actions** untuk mutasi internal + **15 Route Handlers `/api/**`** untuk auth, reads, presigned upload/download, CSV export, polling 30s, Cron 08:00 WIB) · **Database:** PostgreSQL 16 (Supabase Managed / Portabel) + Prisma ORM · **Auth & Security:** Auth.js v5 (Credentials + Argon2id/Bcrypt, 7-day sliding session + `token_version` instant revocation, Database-backed RBAC) · **Storage:** Hybrid (External Cloud Links Figma/Canva/GDrive + Supabase Storage/S3 Private Bucket via Presigned PUT TTL 300s, batas 25 MB / Avatar 2 MB) · **CI/CD & Hosting:** Vercel + GitHub Actions CI |
| **4 Modul Kanonik & 25 Sub-Fitur V1** | **Modul A — Task Management (7):** Project Management, My Tasks, Kanban Board, Work Calendar, Task Assignment, Progress Tracking, Deadline Management · **Modul B — Team Management & KPI (6):** Team Directory, Individual Performance (otomatis), KPI Management (Templates + Monthly Assignments + *Clone Previous Month*), Team Performance Dashboard, Monthly Evaluation (*immutable snapshot*), Reports & Analytics (CSV/Print-PDF) · **Modul C — Social Media & Design Management (7):** Content Calendar (pengganti spreadsheet), Content Ideas Management, Content Planning (*auto-spawn tasks & brief*), Design Workspace (`v1..vN`), Design Approval & Revision Loop, Asset Library (*auto-promote on Approved*), Content Performance Analytics (`ER%` & `CTR%`) · **Modul D — System Management (5):** User Management, Role & Permission (RBAC), Notification Center (in-app), Announcements (maks. 3 pinned + *read receipts*), Activity Logs (*immutable JSONB audit trail*) |
| **4 Role Kanonik RBAC & 42 Permissions** | 1. **`SUPER_ADMIN`** (Leadership / Super Admin — kontrol penuh 42/42 izin, eksklusif `kpi:evaluation:finalize`, manajemen User & RBAC) · 2. **`PROJECT_MANAGER`** (orkestrasi proyek, review/approval task, ide konten & desain, konfigurasi KPI tim & review evaluasi bulanan, broadcast pengumuman, baca audit log operasional) · 3. **`STAFF_CREATOR`** (eksekusi task, pengajuan ide, content planning & publikasi, input content analytics, lihat KPI & evaluasi pribadi) · 4. **`DESIGNER`** (eksekusi design task, pengelolaan brief & submit revisi `v1..vN` di Design Workspace, akses Asset Library, lihat KPI & evaluasi pribadi) — seluruhnya dikontrol melalui **42 atomic permissions** (`module:resource:action`) |
| **6 Status & Domain Enum Kanonik** *(dari 21 PostgreSQL ENUMs)* | • **`TaskStatus` (`task_status_enum`):** `BACKLOG`, `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `REVISION`, `DONE`, `CANCELLED`<br>• **`TaskType` (`task_type_enum`):** `GENERAL`, `CONTENT_PRODUCTION`, `DESIGN_TASK`<br>• **`TaskPriority` (`task_priority_enum`):** `LOW`, `MEDIUM`, `HIGH`, `URGENT`<br>• **`ContentStatus` (`content_status_enum`):** `IDEA`, `APPROVED_IDEA`, `PLANNING`, `IN_DESIGN`, `DESIGN_REVIEW`, `DESIGN_REVISION`, `READY_TO_PUBLISH`, `SCHEDULED`, `PUBLISHED`, `ARCHIVED`<br>• **`DesignSubmissionStatus` (`design_submission_status_enum`):** `PENDING_BRIEF`, `IN_PROGRESS`, `SUBMITTED`, `REVISION_REQUESTED`, `APPROVED`<br>• **`EvaluationStatus` (`kpi_evaluation_status_enum`):** `DRAFT`, `SUBMITTED`, `REVIEWED`, `FINALIZED`<br>*(Dilengkapi 15 Supporting Domain ENUMs: `employment_status`, `project_status`, `project_member_role`, `content_idea_status`, `social_platform`, `content_format`, `design_review_decision`, `asset_source_type`, `asset_category`, `kpi_category`, `kpi_metric_source`, `kpi_unit`, `kpi_grade` `A`–`D`, `notification_type` [21 tipe], `announcement_priority`)* |
| **Tulang Punggung Integrasi Lintas Modul** | **Unified Task Core (`tasks`):** Content Plan & Design Brief otomatis men-spawn linked tasks (`CONTENT_PRODUCTION`, `DESIGN_TASK`) dalam `prisma.$transaction()` sehingga langsung tampil di My Tasks, Kanban, dan Work Calendar · **Closed-Loop KPI & Governance:** Approval Desain otomatis mempromosikan aset ke `assets` dan menandai Design Task `DONE`; penyelesaian task & revisi desain memberi umpan langsung ke metrik objektif `AUTO_TCR`, `AUTO_OTDR` (`first_submitted_at` + `effective_completion_time`), `AUTO_DQS` (floor 40, penalti 15/revisi), dan `AUTO_CPVS`, sekaligus memicu `notifications` & `activity_logs` permanen |
| **Inventaris Artefak Teknis Blueprint** | **16 Diagram Mermaid** terverifikasi (`Bagian II`: 11 · `Bagian III`: 3 · `Bagian IV`: 2) · **25 Tabel PostgreSQL 16** + **21 ENUMs** + **25 Custom Indexes** (Composite B-Tree, Partial, GIN, `pg_trgm`) · **25 FR + 4 FR-INT + 15 NFR** · **24 User Stories** (*Given-When-Then*) · **37 MoSCoW Items** (19 Must-Have V1 = 11,50 dev-days build + 2,50 dev-days QA/UAT/Deploy = 14,00 dev-days kapasitas Minggu 2) · **14 Use Cases (`UC-01`–`UC-14`)** · **4 State Transition Matrices** · **26 UI Routes** · **28 Server Actions** · **15 `/api/**` Route Handlers** · **6 Grup Kontrak (11 TypeScript & 14 JSON Payloads)** |
| **3 Milestone Demo Gates (14 Hari)** | • **Gate 1 — Hari 4 (14:00 WIB):** Pre-Coding Blueprint, Figma Hi-Fi Prototype & Scope Freeze Sign-Off oleh Leadership<br>• **Gate 2 — Hari 10 (16:00 WIB):** Mid-Sprint Live Staging Demo (Modul A + C + D end-to-end dengan auto-task, approval desain & notifikasi aktif)<br>• **Gate 3 — Hari 14 (14:00 WIB):** Formal UAT (Modul A–D lengkap + KPI Engine + CSV Export + RBAC Audit), Production Go-Live & 30-Menit Onboarding Tim *(didahului **Feature Freeze Hari 12, 17:00 WIB** & Dedicated QA Hari 13)* |

---

## Daftar Isi Lengkap (Master Table of Contents)

- [Panduan Membaca Dokumen (Dual-Audience Guide)](#panduan-membaca-dokumen-dual-audience-guide)
- [Ringkasan Arsitektur Terpadu (Executive Single-Page Reference)](#ringkasan-arsitektur-terpadu-executive-single-page-reference)
- [**BAGIAN I — PRODUCT STRATEGY, SRS, USER STORIES & PRIORITAS MoSCoW**](#bagian-i--product-strategy-srs-user-stories--prioritas-moscow)
  - [1. Ringkasan Eksekutif & Tujuan Bisnis (Executive Summary)](#1-ringkasan-eksekutif--tujuan-bisnis-executive-summary)
    - [1.1 Latar Belakang & Transformasi Operasional (Before vs After)](#11-latar-belakang--transformasi-operasional-before-vs-after)
    - [1.2 Visi Produk, Target Pengguna Internal & Profil Peran](#12-visi-produk-target-pengguna-internal--profil-peran)
    - [1.3 Metrik Keberhasilan Adopsi V1 (Product KPIs)](#13-metrik-keberhasilan-adopsi-v1-product-kpis)
    - [1.4 V1 Scope Guardrails (In-Scope vs Out-of-Scope)](#14-v1-scope-guardrails-in-scope-vs-out-of-scope)
  - [2. Software Requirement Specification (SRS) — 4 Modul Utama](#2-software-requirement-specification-srs--4-modul-utama)
    - [2.0 Kontrak Domain & Konvensi Sistem](#20-kontrak-domain--konvensi-sistem)
    - [2.1 Modul A — Task Management (`FR-A01` – `FR-A07`)](#21-modul-a--task-management-fr-a01--fr-a07)
    - [2.2 Modul B — Team Management & KPI (`FR-B01` – `FR-B06`)](#22-modul-b--team-management--kpi-fr-b01--fr-b06)
    - [2.3 Modul C — Social Media & Design Management (`FR-C01` – `FR-C07`)](#23-modul-c--social-media--design-management-fr-c01--fr-c07)
    - [2.4 Modul D — System Management (`FR-D01` – `FR-D05`)](#24-modul-d--system-management-fr-d01--fr-d05)
    - [2.5 Spesifikasi Integrasi Lintas Modul (`FR-INT-01` – `FR-INT-04`)](#25-spesifikasi-integrasi-lintas-modul-fr-int-01--fr-int-04)
    - [2.6 Non-Functional Requirements (`NFR-01` – `NFR-15`)](#26-non-functional-requirements-nfr-01--nfr-15)
  - [3. User Stories & Acceptance Criteria (Given-When-Then)](#3-user-stories--acceptance-criteria-given-when-then)
    - [3.1 User Stories Modul A — Task Management](#31-user-stories-modul-a--task-management)
    - [3.2 User Stories Modul B — Team Management & KPI](#32-user-stories-modul-b--team-management--kpi)
    - [3.3 User Stories Modul C — Social Media & Design Management](#33-user-stories-modul-c--social-media--design-management)
    - [3.4 User Stories Modul D — System Management](#34-user-stories-modul-d--system-management)
  - [4. Prioritization Matrix (MoSCoW) — V1 (2 Minggu) vs Iterasi Berikutnya (V1.1 / V2)](#4-prioritization-matrix-moscow--v1-2-minggu-vs-iterasi-berikutnya-v11--v2)
    - [4.1 Strategi Prioritas & Kapasitas Sprint 2 Developer](#41-strategi-prioritas--kapasitas-sprint-2-developer)
    - [4.2 Matriks MoSCoW Lengkap](#42-matriks-moscow-lengkap)
    - [4.3 Validasi Kapasitas & Rencana Kontingensi De-Scoping V1](#43-validasi-kapasitas--rencana-kontingensi-de-scoping-v1)
- [**BAGIAN II — SYSTEM FLOWS, UX ARCHITECTURE, USE CASES & STATE TRANSITIONS**](#bagian-ii--system-flows-ux-architecture-use-cases--state-transitions)
  - [0. Kontrak Arsitektur & Batasan Ruang Lingkup V1](#0-kontrak-arsitektur--batasan-ruang-lingkup-v1)
  - [1. Information Architecture & Navigasi UX](#1-information-architecture--navigasi-ux)
    - [1.1 Peta Situs (Sitemap) & Struktur Navigasi Aplikasi](#11-peta-situs-sitemap--struktur-navigasi-aplikasi)
    - [1.2 Matriks Visibilitas Menu Sidebar & Topbar Berdasarkan RBAC](#12-matriks-visibilitas-menu-sidebar--topbar-berdasarkan-rbac)
    - [1.3 Layout Wireframe Konseptual (Desktop-First Productivity Shell)](#13-layout-wireframe-konseptual-desktop-first-productivity-shell)
    - [1.4 Prinsip UX Utama & Standar Komponen Visual](#14-prinsip-ux-utama--standar-komponen-visual)
  - [2. End-to-End User Flows (4 Skenario Operasional Harian Krevia)](#2-end-to-end-user-flows-4-skenario-operasional-harian-krevia)
    - [2.1 Skenario 1 — Siklus Hidup Project & Task Management (Kanban Board, Work Calendar, Deadline Alert & Reassignment)](#21-skenario-1--siklus-hidup-project--task-management-kanban-board-work-calendar-deadline-alert--reassignment)
    - [2.2 Skenario 2 — Siklus Lengkap Konten Media Sosial & Design Workspace (Idea s/d Performance Analytics)](#22-skenario-2--siklus-lengkap-konten-media-sosial--design-workspace-idea-sd-performance-analytics)
    - [2.3 Skenario 3 — Penetapan KPI Bulanan, Agregasi Otomatis Individual Performance, Monthly Evaluation & Reporting](#23-skenario-3--penetapan-kpi-bulanan-agregasi-otomatis-individual-performance-monthly-evaluation--reporting)
    - [2.4 Skenario 4 — Lintas Modul: Notification Center (In-App), Announcements Broadcast & Activity Logs (Audit Trail)](#24-skenario-4--lintas-modul-notification-center-in-app-announcements-broadcast--activity-logs-audit-trail)
  - [3. Use Case Specifications Lengkap (14 Use Case Utama — Modul A s/d D)](#3-use-case-specifications-lengkap-14-use-case-utama--modul-a-sd-d)
  - [4. Matriks State Transition Lengkap (4 Entitas Inti & Cross-Module Sync)](#4-matriks-state-transition-lengkap-4-entitas-inti--cross-module-sync)
    - [4.1 Matriks Transisi `TaskStatus` (Modul A — Unified Task Engine)](#41-matriks-transisi-taskstatus-modul-a--unified-task-engine)
    - [4.2 Matriks Transisi `ContentStatus` (Modul C — Social Media Pipeline)](#42-matriks-transisi-contentstatus-modul-c--social-media-pipeline)
    - [4.3 Matriks Transisi `DesignSubmissionStatus` (Modul C — `design_briefs.status` & `design_submissions.status`)](#43-matriks-transisi-designsubmissionstatus-modul-c--design_briefsstatus--design_submissionsstatus)
    - [4.4 Matriks Transisi `EvaluationStatus` (Modul B — Monthly KPI Evaluation)](#44-matriks-transisi-evaluationstatus-modul-b--monthly-kpi-evaluation)
    - [4.5 Ringkasan Kontrak Sinkronisasi Atomik Lintas Modul (Developer Implementation Checklist)](#45-ringkasan-kontrak-sinkronisasi-atomik-lintas-modul-developer-implementation-checklist)
- [**BAGIAN III — DATABASE DESIGN (POSTGRESQL 16), BACKEND ARCHITECTURE & RBAC**](#bagian-iii--database-design-postgresql-16-backend-architecture--rbac)
  - [Ringkasan Arsitektur Data & Backend (Executive Summary)](#ringkasan-arsitektur-data--backend-executive-summary)
  - [1. Rekomendasi Arsitektur Backend & Justifikasi Teknis](#1-rekomendasi-arsitektur-backend--justifikasi-teknis)
    - [1.1 Perbandingan Objektif Opsi Arsitektur Backend](#11-perbandingan-objektif-opsi-arsitektur-backend)
    - [1.2 Strategi Lapisan Arsitektur Backend (Layered Architecture)](#12-strategi-lapisan-arsitektur-backend-layered-architecture)
    - [1.3 Strategi Penyimpanan File & Aset Desain (Hybrid Storage Architecture)](#13-strategi-penyimpanan-file--aset-desain-hybrid-storage-architecture)
  - [2. Entity Relationship Diagram (ERD) Lengkap](#2-entity-relationship-diagram-erd-lengkap)
    - [2.1 Master ERD Overview (25 Entitas — 4 Modul Terintegrasi)](#21-master-erd-overview-25-entitas--4-modul-terintegrasi)
    - [2.2 Sub-ERD Fokus Relasi Lintas Modul (Operational & KPI Backbone)](#22-sub-erd-fokus-relasi-lintas-modul-operational--kpi-backbone)
  - [3. Skema Tabel PostgreSQL Detail (Data Dictionary, ENUM, DDL & Indexing)](#3-skema-tabel-postgresql-detail-data-dictionary-enum-ddl--indexing)
    - [3.1 PostgreSQL Extensions & Definisi ENUM Eksplisit](#31-postgresql-extensions--definisi-enum-eksplisit)
    - [3.2 Data Dictionary Lengkap (Seluruh 25 Tabel)](#32-data-dictionary-lengkap-seluruh-25-tabel)
    - [3.3 Production SQL DDL Lengkap (PostgreSQL 16 — Copy-Paste Ready)](#33-production-sql-ddl-lengkap-postgresql-16--copy-paste-ready)
    - [3.4 Indexing Strategy (B-Tree Composite, Partial, GIN & Trigram)](#34-indexing-strategy-b-tree-composite-partial-gin--trigram)
    - [3.5 Mekanisme Relasi Lintas Modul & Kalkulasi KPI Otomatis](#35-mekanisme-relasi-lintas-modul--kalkulasi-kpi-otomatis)
  - [4. Desain Role-Based Access Control (RBAC) & Keamanan Data](#4-desain-role-based-access-control-rbac--keamanan-data)
    - [4.1 Model RBAC Database-Backed (`roles`, `permissions`, `role_permissions`)](#41-model-rbac-database-backed-roles-permissions-role_permissions)
    - [4.2 Permission Matrix Lengkap (4 Roles vs Seluruh Resource & Action)](#42-permission-matrix-lengkap-4-roles-vs-seluruh-resource--action)
    - [4.3 Pola Implementasi RBAC Guard & Audit Logger (Server-Side TypeScript)](#43-pola-implementasi-rbac-guard--audit-logger-server-side-typescript)
    - [4.4 Keamanan Data Lapis Ganda & Catatan PostgreSQL Row-Level Security (RLS)](#44-keamanan-data-lapis-ganda--catatan-postgresql-row-level-security-rls)
- [**BAGIAN IV — NEXT.JS APP ROUTER ARCHITECTURE, API CONTRACTS & 14-DAY EXECUTION ROADMAP**](#bagian-iv--nextjs-app-router-architecture-api-contracts--14-day-execution-roadmap)
  - [Ringkasan Eksekutif untuk Leadership](#ringkasan-eksekutif-untuk-leadership)
  - [1. Arsitektur Proyek & Struktur Folder Next.js (App Router + Feature-Sliced Modular)](#1-arsitektur-proyek--struktur-folder-nextjs-app-router--feature-sliced-modular)
    - [1.1 Arsitektur 5 Lapis KTMS](#11-arsitektur-5-lapis-ktms)
    - [1.2 Pohon Folder Proyek Lengkap (Copy-Paste Ready)](#12-pohon-folder-proyek-lengkap-copy-paste-ready)
    - [1.3 Arsitektur Data Fetching, Caching & State Management](#13-arsitektur-data-fetching-caching--state-management)
    - [1.4 Standardisasi Error Handling, Validasi Zod, RBAC Wrapper & Atomic Audit Hook](#14-standardisasi-error-handling-validasi-zod-rbac-wrapper--atomic-audit-hook)
  - [2. Daftar Route Aplikasi, API Endpoints & Server Actions + Kontrak Payload](#2-daftar-route-aplikasi-api-endpoints--server-actions--kontrak-payload)
    - [2.1 App Router Page Routes Table (Seluruh 4 Modul + Auth & Overview)](#21-app-router-page-routes-table-seluruh-4-modul--auth--overview)
    - [2.2 Katalog Lengkap Server Actions & Route Handlers (`/api/**`)](#22-katalog-lengkap-server-actions--route-handlers-api)
    - [2.3 Kontrak Payload TypeScript Interfaces & Contoh JSON Request/Response](#23-kontrak-payload-typescript-interfaces--contoh-json-requestresponse)
  - [3. Pembagian Kerja & Roadmap Eksekusi Harian 14 Hari (Mhd Yoga Andhika & Nta)](#3-pembagian-kerja--roadmap-eksekusi-harian-14-hari-mhd-yoga-andhika--nta)
    - [3.1 Pembagian Ownership & Strategi Anti-Konflik Merge](#31-pembagian-ownership--strategi-anti-konflik-merge)
    - [3.2 Jadwal Harian Detail — Minggu 1 (Hari 1–7): Analisis, Desain & Fondasi](#32-jadwal-harian-detail--minggu-1-hari-17-analisis-desain--fondasi)
    - [3.3 Jadwal Harian Detail — Minggu 2 (Hari 8–14): Sprint Development, Integrasi, QA & Go-Live](#33-jadwal-harian-detail--minggu-2-hari-814-sprint-development-integrasi-qa--go-live)
    - [3.4 Realisme Beban Kerja 2 Developer & Guardrail Prioritas MoSCoW](#34-realisme-beban-kerja-2-developer--guardrail-prioritas-moscow)
    - [3.5 Ritual Komunikasi, Git Workflow, Demo Checkpoints & Risk Register](#35-ritual-komunikasi-git-workflow-demo-checkpoints--risk-register)
    - [3.6 Definition of Done (DoD) Production V1 (Checklist Go-Live Hari 14)](#36-definition-of-done-dod-production-v1-checklist-go-live-hari-14)
- [**LAMPIRAN — Lembar Persetujuan Pre-Coding Blueprint (Leadership Sign-Off Checklist — Gate 1 / Hari 4)**](#lampiran--lembar-persetujuan-pre-coding-blueprint-leadership-sign-off-checklist--gate-1--hari-4)

---

## BAGIAN I — PRODUCT STRATEGY, SRS, USER STORIES & PRIORITAS MoSCoW

> **Cakupan Bagian I:** Strategi Produk, Analisis *Before vs After*, Batasan Ruang Lingkup V1 (*Scope Guardrails*), 25 Functional Requirements (`FR-A01`–`FR-D05`), 4 Spesifikasi Integrasi Lintas Modul (`FR-INT-01`–`FR-INT-04`), Formula KPI & Analitik, 15 Non-Functional Requirements (`NFR-01`–`NFR-15`), 24 User Stories (*Given-When-Then*), serta Matriks Prioritas MoSCoW (37 Item) & Kontingensi De-Scoping.

### 1. Ringkasan Eksekutif & Tujuan Bisnis (Executive Summary)

#### 1.1 Latar Belakang & Transformasi Operasional (Before vs After)

Sebagai perusahaan digital yang terus bertumbuh, **Krevia Digital** menjalankan operasional lintas disiplin — mulai dari manajemen proyek internal, eksekusi tugas harian, produksi konten media sosial, siklus desain visual, hingga evaluasi kinerja bulanan tim. Saat ini, aktivitas operasional tersebut masih tersebar di berbagai alat yang terfragmentasi (spreadsheet konten, grup chat untuk penugasan dan revisi desain, folder penyimpanan file yang tidak terindeks, serta rekapitulasi KPI manual di akhir bulan).

Fragmentasi ini menimbulkan tiga kerugian bisnis utama:
1. **Kehilangan visibilitas eksekutif** terhadap beban kerja aktual, risiko keterlambatan (*overdue*), dan hambatan (*bottleneck*) produksi.
2. **Inefisiensi koordinasi harian** akibat duplikasi input data antara jadwal konten, penugasan desainer, dan papan tugas (*task tracker*).
3. **Subjektivitas dan keterlambatan evaluasi KPI** karena metrik ketepatan waktu, penyelesaian tugas, dan jumlah revisi tidak terekam secara otomatis.

**Krevia Team Management System (KTMS)** dibangun sebagai satu aplikasi web internal terpadu (*single source of truth*) yang menyatukan manajemen tugas, produksi media sosial & desain, pemantauan performa & KPI tim, serta tata kelola sistem berbasis peran (*RBAC*) dan jejak audit (*audit trail*).

| Dimensi Operasional | Kondisi Saat Ini (*Before* — Fragmented Tools) | Kondisi Target (*After* — KTMS V1) | Dampak Bisnis Terukur |
| :--- | :--- | :--- | :--- |
| **Pelacakan Tugas & Proyek** | Penugasan tersebar di chat (WhatsApp/Slack) dan daftar pribadi; sulit mengetahui progres *real-time* maupun prioritas tugas. | Terpusat di **Modul A** (`Project Management`, `My Tasks`, `Kanban Board`, `Work Calendar`) dengan status baku, prioritas, dan tenggat waktu yang termonitor. | Mengurangi waktu koordinasi status harian (*status-checking*) dan mencegah tugas terlewat. |
| **Produksi Konten Media Sosial** | Menggunakan spreadsheet manual yang rentan konflik versi, tidak terhubung dengan penugasan tim, dan sulit melacak perubahan status. | **Content Calendar**, **Content Ideas**, dan **Content Planning** terintegrasi langsung di **Modul C** dengan alur status terkontrol dan pembuatan tugas otomatis. | Menghilangkan 100% ketergantungan pada spreadsheet jadwal konten terpisah. |
| **Alur Brief, Revisi & Aset Desain** | Brief dikirim lewat pesan singkat; file revisi menumpuk tanpa penomoran versi (`final_v2_revisi_beneran.png`); aset final tersebar di banyak tautan. | **Design Workspace** menyimpan brief terstruktur, riwayat versi (`v1`, `v2`, `v3`), loop approval/revisi tercatat, dan **Asset Library** otomatis mengarsipkan desain berstatus `APPROVED`. | Memangkas siklus revisi berulang akibat brief tidak jelas dan mempercepat pencarian aset final. |
| **Evaluasi Kinerja & KPI Bulanan** | Rekap KPI dilakukan manual setiap akhir bulan; data ketepatan waktu dan jumlah revisi sering berbasis perkiraan subjektif. | **Modul B** menghitung otomatis *Task Completion Rate*, *On-Time Delivery Rate*, dan *Design Quality Score* dari aktivitas nyata, lalu menggabungkannya dengan skor kualitatif di **Monthly Evaluation**. | Evaluasi objektif berbasis data nyata (*data-driven appraisal*), memangkas waktu rekap evaluasi bulanan dari hari menjadi menit. |
| **Kontrol Akses & Tata Kelola** | Semua anggota mengakses file bersama tanpa pemisahan wewenang ketat; tidak ada riwayat siapa mengubah atau menghapus data apa. | **Modul D** menerapkan RBAC granular 4 peran, **Notification Center**, **Announcements**, dan **Activity Logs** (*immutable audit trail*). | Menjamin integritas data operasional, kepatuhan internal, dan transparansi keputusan. |

---

#### 1.2 Visi Produk, Target Pengguna Internal & Profil Peran

**Visi Produk:**  
> *"Menjadikan KTMS sebagai pusat kendali operasional internal Krevia Digital yang menyatukan perencanaan, eksekusi kreatif, dan pengukuran performa tim secara transparan, objektif, dan terotomatisasi — selaras dengan prinsip Build Smarter. Operate Better."*

**Target Pengguna Internal (4 Peran Kanonik RBAC):**

| Kode Peran Kanonik | Nama Peran | Tanggung Jawab Utama di KTMS | Modul Fokus Harian |
| :--- | :--- | :--- | :--- |
| `SUPER_ADMIN` | Super Admin / Leadership | Pengawasan kinerja seluruh tim & proyek, penetapan kebijakan KPI, finalisasi evaluasi bulanan, penerbitan pengumuman strategis, manajemen user/role, serta audit aktivitas sistem. | Semua Modul (A, B, C, D) dengan akses penuh |
| `PROJECT_MANAGER` | Project Manager | Membuat & mengelola proyek, mendistribusikan tugas, memonitor deadline & beban kerja, menyetujui ide konten & hasil desain, serta melakukan review evaluasi KPI bulanan tim. | Modul A, Modul B (tim & evaluasi), Modul C (approval & kalender), Modul D (pengumuman proyek & notifikasi) |
| `STAFF_CREATOR` | Staff / Content Creator | Mengeksekusi tugas harian, mengajukan ide konten, menyusun content plan & brief desain, memantau jadwal publikasi, serta menginput data performa pasca-publikasi konten. | Modul A (`My Tasks`, `Kanban`, `Calendar`), Modul B (KPI & performa pribadi), Modul C (Ide, Planning, Calendar, Analytics, Asset Library), Modul D (Notifikasi & Pengumuman) |
| `DESIGNER` | Designer | Menerima brief desain dan tugas desain terintegrasi, mengunggah atau menautkan hasil desain per versi di Design Workspace, menindaklanjuti catatan revisi hingga disetujui, serta memantau skor kualitas desain pribadi. | Modul A (`My Tasks`, `Kanban`, `Calendar`), Modul B (KPI & performa pribadi), Modul C (`Design Workspace`, `Asset Library`, `Content Calendar` read-only), Modul D (Notifikasi & Pengumuman) |

---

#### 1.3 Metrik Keberhasilan Adopsi V1 (Product KPIs)

Keberhasilan peluncuran KTMS V1 diukur melalui metrik adopsi operasional dan kualitas sistem berikut:

| ID | Metrik Keberhasilan | Baseline (Pra-KTMS) | Target 30 Hari Pasca Go-Live | Target 90 Hari Pasca Go-Live | Metode Pengukuran |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `PKPI-01` | **Migrasi Content Calendar** (% konten aktif dikelola di KTMS, bukan spreadsheet) | 0% | 100% konten aktif | 100% (spreadsheet lama diarsipkan) | Audit jumlah item di `Content Calendar` vs publikasi kanal resmi Krevia |
| `PKPI-02` | **Daily Active Internal Users (DAU)** | 0% | $\ge 85\%$ anggota tim aktif login $\ge 4$ hari kerja/minggu | $\ge 95\%$ anggota tim aktif | Query agregasi `activity_logs` & sesi login harian |
| `PKPI-03` | **Task Traceability Rate** (% tugas operasional & kreatif yang tercatat di KTMS) | Tidak terukur | $\ge 80\%$ pekerjaan proyek & konten | $\ge 95\%$ seluruh pekerjaan tim | Review mingguan PM & Leadership |
| `PKPI-04` | **Efisiensi Rekap Evaluasi Bulanan** (waktu penyusunan laporan KPI bulanan seluruh tim) | 2–3 hari kerja/bulan (manual) | $\le 2$ jam/bulan | $\le 1$ jam/bulan | Pengukuran durasi siklus `DRAFT` ke `FINALIZED` pada `Monthly Evaluation` |
| `PKPI-05` | **Penurunan Keterlambatan Tugas** (*Overdue Task Ratio*) | Tidak terukur (tinggi) | Baseline tercatat di bulan 1 | Penurunan $\ge 25\%$ dari baseline bulan 1 | Laporan `Team Performance Dashboard` (`OTDR`) |
| `PKPI-06` | **Keandalan Sistem Produksi** (*Production Availability*) | N/A | $\ge 99.0\%$ uptime jam kerja (08:00–20:00 WIB) | $\ge 99.5\%$ uptime | Health-check monitoring `/api/health` |

---

#### 1.4 V1 Scope Guardrails (In-Scope vs Out-of-Scope)

Mengingat target rilis V1 adalah **14 hari kalender dengan 2 developer (Mhd Yoga Andhika & Nta)**, pengendalian ruang lingkup (*scope control*) bersifat mutlak. Fitur di luar batas V1 tidak boleh dimasukkan ke Sprint Minggu 2 tanpa persetujuan formal Leadership disertai penyesuaian jadwal atau pengurangan fitur V1 lain yang setara (*scope trade-off*).

| Kategori | Termasuk dalam V1 (**IN-SCOPE**) | Dikeluarkan secara Tegas dari V1 (**STRICTLY OUT-OF-SCOPE**) | Alasan Guardrail |
| :--- | :--- | :--- | :--- |
| **Platform & Pengalaman Perangkat** | Aplikasi web internal **desktop-first responsive** (optimal pada resolusi 1280px–1920px+, tetap terbaca & usable pada tablet/mobile browser $\ge 768\text{px}$ untuk pemantauan cepat). | **Native Mobile Apps** (iOS Swift / Android Kotlin / React Native / Flutter) dan PWA offline-sync kompleks. | Menggandakan beban build, distribusi store, dan QA; operasional Krevia berbasis desktop kerja harian. |
| **Akses Pengguna & Batas Organisasi** | Pengguna internal Krevia Digital saja dengan 4 peran RBAC (`SUPER_ADMIN`, `PROJECT_MANAGER`, `STAFF_CREATOR`, `DESIGNER`). | **External Client Portal** (login klien, approval klien eksternal, multi-tenant workspace, white-labeling). | Menambah kompleksitas isolasi data multi-tenant, keamanan eksternal, dan alur negosiasi klien. |
| **Sumber Daya Manusia (HR)** | Direktori profil tim, struktur peran operasional, metrik performa kerja berbasis tugas/desain, KPI bulanan, dan evaluasi kinerja bulanan. | **Full HRIS**: Payroll/penggajian, slip gaji (*payslips*), absensi geofencing/biometrik, manajemen cuti & lembur, rekrutmen/ATS, BPJS/pajak. | Domain regulasi & akuntansi terpisah yang berada di luar fokus produktivitas & eksekusi operasional V1. |
| **Integrasi Media Sosial Eksternal** | Pengelolaan jadwal konten, status publikasi manual (`SCHEDULED` -> `PUBLISHED` + input tautan posting), dan pencatatan metrik performa konten secara manual/CSV import sederhana. | **Auto-publishing API** langsung ke Meta Graph API / TikTok API / LinkedIn API / YouTube API serta *real-time social listening*. | Proses verifikasi aplikasi pihak ketiga (App Review Meta/TikTok) memakan waktu berminggu-minggu dan melewati tenggat 14 hari. |
| **Komunikasi & Notifikasi** | **In-App Notification Center**, komentar di task/brief, dan **Announcements** internal. | **Real-time Chat Messenger** (pengganti Slack/WhatsApp), Video Call, WhatsApp Bot/Blast, serta Push Notification browser/mobile. | Tim sudah memiliki kanal chat instan; membangun chat real-time WebSocket penuh berisiko memecah fokus sprint V1. |
| **Penyimpanan Aset & Desain** | Strategi **Hybrid Storage**: tautan eksternal tervalidasi (Figma, Canva, Google Drive, Frame.io) + direct file upload gambar/PDF/preview video MP4 ($\le 25\text{ MB}$/file; foto avatar $\le 2\text{ MB}$) ke Object Storage. | Video editing/transcoding server, penyimpanan file mentah berukuran besar (`.psd`/`.ai`/`.prproj` $> 25\text{ MB}$), dan anotasi pin piksel interaktif seperti Figma. | Menjaga biaya storage, kecepatan upload, dan waktu pengembangan tetap dalam batas 2 minggu. |
| **Keuangan & Penagihan** | Tidak ada modul keuangan; proyek hanya menyimpan informasi operasional (nama, kategori, tanggal mulai/selesai, anggota, status). | Invoicing, budgeting/RAB, expense tracking, timesheet billing klien, dan integrasi akuntansi. | Fokus V1 adalah efisiensi eksekusi tim dan pengukuran KPI, bukan ERP keuangan. |

> **Aturan Tata Kelola Perubahan Ruang Lingkup (*Change Freeze Rule*):**  
> Ruang lingkup fitur V1 dikunci pada **Demo Gate 1: Blueprint Sign-Off (Hari ke-4)** bersama Leadership, dan fondasi teknis serta skema database dituntaskan pada **Hari ke-7** sebelum masuk Sprint Development (Hari 8–14). Setelah Gate 1 disetujui, seluruh permintaan fitur baru masuk ke backlog **V1.1 (Minggu 3–4)** atau **V2**, kecuali perbaikan cacat kritis (*critical bug*) yang menghambat alur kerja inti V1.

---

### 2. Software Requirement Specification (SRS) — 4 Modul Utama

#### 2.0 Kontrak Domain & Konvensi Sistem

Seluruh spesifikasi fungsional pada Bagian I ini mematuhi kontrak arsitektur lintas modul (selaras dengan **Bagian II — System Flows & Use Cases**, **Bagian III — Database & RBAC**, dan **Bagian IV — Next.js Architecture & Roadmap**):

1. **Zona Waktu & Format Standar:**
   - Seluruh kalkulasi tenggat waktu (`due_date`), periode evaluasi bulanan (`evaluation_period` format `YYYY-MM`), dan pengingat jadwal menggunakan zona waktu operasional Krevia Digital: **WIB (`Asia/Jakarta`, UTC+7)**.
   - Penyimpanan timestamp di PostgreSQL menggunakan `TIMESTAMPTZ` (UTC), dan dikonversi ke `Asia/Jakarta` pada lapisan tampilan & agregasi periode bulanan.
2. **Enum Status & Klasifikasi Kanonik:**
   - **RBAC Role (`role_code`):** `SUPER_ADMIN`, `PROJECT_MANAGER`, `STAFF_CREATOR`, `DESIGNER`.
   - **Task Status (`task_status`):** `BACKLOG`, `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `REVISION`, `DONE`, `CANCELLED`.
   - **Task Type (`task_type`):** `GENERAL`, `CONTENT_PRODUCTION`, `DESIGN_TASK`.
   - **Task Priority (`task_priority`):** `LOW`, `MEDIUM`, `HIGH`, `URGENT`.
   - **Content Item Status (`content_status`):** `IDEA`, `APPROVED_IDEA`, `PLANNING`, `IN_DESIGN`, `DESIGN_REVIEW`, `DESIGN_REVISION`, `READY_TO_PUBLISH`, `SCHEDULED`, `PUBLISHED`, `ARCHIVED`.
   - **Design Submission Status (`design_status`):** `PENDING_BRIEF`, `IN_PROGRESS`, `SUBMITTED`, `REVISION_REQUESTED`, `APPROVED`.
   - **KPI Evaluation Status (`kpi_eval_status`):** `DRAFT`, `SUBMITTED`, `REVIEWED`, `FINALIZED`.
3. **Aturan Retensi & Penghapusan Data:**
   - Entitas operasional (`projects`, `tasks`, `content_ideas`, `content_items`, `design_briefs`, `assets`, `announcements`) menggunakan **soft delete** (`deleted_at`) untuk mencegah rusaknya referensi KPI dan audit.
   - Entitas akun (`users`) **tidak boleh dihapus permanen**; penonaktifan dilakukan via status `is_active = false`.
   - Entitas `activity_logs` bersifat **append-only (immutable)**; tidak ada antarmuka UI maupun endpoint API untuk mengubah atau menghapus log.

---

#### 2.1 Modul A — Task Management (`FR-A01` – `FR-A07`)

Modul A berfungsi sebagai tulang punggung eksekusi kerja harian seluruh anggota Krevia Digital. Seluruh pekerjaan — baik tugas operasional umum, produksi konten media sosial, maupun pengerjaan desain — bermuara pada entitas tugas terpadu (*Unified Task Engine*).

##### `FR-A01` — Project Management
* **Tujuan:** Menyediakan wadah pengelompokan tugas berdasarkan inisiatif, kampanye internal, atau proyek operasional Krevia Digital.
* **Aktor & Akses:** `SUPER_ADMIN` dan `PROJECT_MANAGER` dapat membuat, mengubah, mengarsipkan, dan mengatur anggota proyek; `STAFF_CREATOR` dan `DESIGNER` dapat melihat daftar proyek tempat mereka terdaftar sebagai anggota (atau seluruh proyek yang bertanda `PUBLIC_INTERNAL`).
* **Spesifikasi Fungsional:**
  1. Membuat, mengedit, dan mengarsipkan proyek dengan atribut wajib: `code` (unik, 2–12 karakter alfanumerik huruf besar, misal `KRV-SOC`, `KRV-WEB`), `name` (3–120 karakter), `description` (opsional, maksimal 2.000 karakter), `status` (`PLANNING`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `ARCHIVED`), `owner_id` (default pembuat proyek), `start_date`, `target_end_date`, dan `color_hex` (penanda visual di Kalender & Kanban).
  2. Menambahkan atau mengeluarkan anggota proyek (`project_members`) beserta peran internal di proyek (`LEAD`, `MEMBER`).
  3. Menampilkan halaman ringkasan proyek (*Project Detail Overview*): total task, komposisi status task (persentase `DONE` terhadap total task non-`CANCELLED`), daftar task overdue, dan daftar anggota tim proyek.
* **Aturan Bisnis & Validasi:**
  - `target_end_date` wajib $\ge$ `start_date` jika keduanya diisi.
  - Proyek yang masih memiliki task berstatus aktif (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `REVISION`) memunculkan dialog konfirmasi sebelum statusnya diubah ke `ARCHIVED`; pengarsipan proyek tidak menghapus task historis agar perhitungan KPI tetap akurat.
  - Sistem menyediakan minimal satu proyek bawaan (*default internal project*, misal `KRV-OPS` untuk operasional umum dan `KRV-SOC` untuk konten media sosial) agar konten yang dibuat tanpa proyek spesifik tetap terorganisasi.
* **Keterhubungan Lintas Modul:** `Content Items` di Modul C dapat ditautkan ke proyek kampanye di Modul A; perubahan proyek tercatat di `Activity Logs` (Modul D).

##### `FR-A02` — My Tasks
* **Tujuan:** Menyediakan tampilan kerja personal yang terfokus agar setiap anggota langsung mengetahui apa yang harus dikerjakan hari ini, minggu ini, dan apa yang melewati tenggat.
* **Aktor & Akses:** Seluruh 4 peran (`SUPER_ADMIN`, `PROJECT_MANAGER`, `STAFF_CREATOR`, `DESIGNER`) melihat seluruh tugas di mana `assignee_id = current_user.id`.
* **Spesifikasi Fungsional:**
  1. Pengelompokan otomatis (*smart grouping*) berdasarkan urgensi waktu: **Overdue**, **Due Today**, **Upcoming (7 Hari Ke Depan)**, **Later / No Deadline**, serta tab terpisah **Completed (30 Hari Terakhir)**.
  2. Menampilkan indikator visual `task_type` (`GENERAL`, `CONTENT_PRODUCTION`, `DESIGN_TASK`), badge `priority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`), nama proyek, status saat ini, progres checklist (`3/5`), dan label deadline.
  3. Menyediakan aksi cepat (*inline quick-actions*): ubah status (mengikuti aturan transisi valid), centang checklist di panel detail *slide-over drawer*, dan tambah komentar tanpa berpindah halaman.
  4. Menyediakan filter kombinasi: Proyek, Status, Prioritas, Tipe Tugas (`task_type`), dan pencarian judul tugas (*real-time debounce* 300ms).
* **Aturan Bisnis & Validasi:**
  - Tugas berstatus `CANCELLED` secara default disembunyikan dari tampilan aktif dan hanya muncul jika filter status `CANCELLED` dipilih secara eksplisit.
  - Tugas bertipe `CONTENT_PRODUCTION` dan `DESIGN_TASK` menampilkan tautan langsung (*deep-link*) ke `Content Item` atau `Design Workspace` terkait.
* **Keterhubungan Lintas Modul:** Menjadi pintu masuk eksekusi bagi tugas otomatis yang lahir dari `Content Planning` (`FR-C03`) dan `Design Workspace` (`FR-C04`).

##### `FR-A03` — Kanban Board
* **Tujuan:** Memvisualisasikan aliran kerja (*workflow*) lintas status secara interaktif pada tingkat proyek maupun tampilan lintas proyek (*Global Board*).
* **Aktor & Akses:** Seluruh 4 peran dapat mengakses Kanban Board proyek mereka; `SUPER_ADMIN` dan `PROJECT_MANAGER` dapat memindahkan kartu tugas milik siapa pun dan melakukan aksi review/approval; `STAFF_CREATOR` dan `DESIGNER` dapat memindahkan kartu tugas milik mereka sesuai aturan transisi peran.
* **Spesifikasi Fungsional:**
  1. Menampilkan kolom status utama: `BACKLOG`, `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `REVISION`, dan `DONE` (kolom `CANCELLED` tersedia melalui toggle filter atau aksi menu kartu agar papan tidak penuh sesak).
  2. Mendukung perpindahan kartu dengan *drag-and-drop* antar kolom dan pengurutan posisi vertikal (`position`) dalam kolom yang sama, menggunakan *optimistic UI update* dengan *rollback* otomatis jika validasi server gagal.
  3. Setiap kartu Kanban menampilkan: kode/ID singkat task, judul (maksimal 2 baris dengan ellipsis), badge `task_type`, badge `priority`, avatar assignee, tenggat waktu (dengan highlight warna overdue/due-soon), hitungan checklist, dan hitungan komentar.
  4. Menyediakan filter multi-kriteria (Proyek, Assignee, Prioritas, Tipe Tugas, Rentang Tanggal, Pencarian Teks) yang tersimpan pada URL query parameter agar mudah dibagikan.
* **Aturan Bisnis & Validasi:**
  - **Kontrol Transisi Status Berbasis Role:**
    - `STAFF_CREATOR` dan `DESIGNER` dapat memindahkan task miliknya dari `BACKLOG`/`TODO` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `IN_REVIEW`, dan dari `REVISION` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `IN_REVIEW`.
    - Untuk task bertipe `DESIGN_TASK` atau task yang memiliki `reviewer_id`, perpindahan ke `DONE` atau `REVISION` dari `IN_REVIEW` hanya diizinkan oleh `PROJECT_MANAGER`, `SUPER_ADMIN`, atau `reviewer_id` yang ditetapkan.
    - Untuk task `GENERAL` tanpa `reviewer_id` (`requires_review = false`), assignee diperbolehkan memindahkan langsung ke `DONE`.
  - Memindahkan kartu ke `REVISION` wajib mengisi alasan/catatan revisi minimal 10 karakter (ditampilkan lewat modal cepat) dan secara otomatis menaikkan `revision_count = revision_count + 1`.
  - Memindahkan kartu ke `DONE` menuliskan timestamp `completed_at = NOW()` (dan `first_submitted_at` saat pertama kali masuk `IN_REVIEW`).
* **Keterhubungan Lintas Modul:** Perubahan status kartu `DESIGN_TASK` atau `CONTENT_PRODUCTION` menyinkronkan status pada entitas di Modul C (lihat `FR-INT-01` dan `FR-INT-02`), memicu notifikasi (Modul D), dan mencatat audit log (Modul D).

##### `FR-A04` — Work Calendar
* **Tujuan:** Menyajikan jadwal seluruh tenggat waktu tugas dan jadwal tayang konten dalam kalender kerja terpadu agar potensi tabrakan jadwal (*deadline clustering*) terlihat lebih awal.
* **Aktor & Akses:** `SUPER_ADMIN` dan `PROJECT_MANAGER` melihat kalender seluruh tim (dengan filter per anggota/proyek); `STAFF_CREATOR` dan `DESIGNER` melihat jadwal tugas mereka sendiri serta proyek yang mereka ikuti.
* **Spesifikasi Fungsional:**
  1. Mendukung mode tampilan **Bulanan (Month)**, **Mingguan (Week)**, dan **Agenda List**.
  2. Menampilkan blok warna berbeda berdasarkan kategori: Tugas Umum (`GENERAL` — Biru), Produksi Konten (`CONTENT_PRODUCTION` — Ungu), Tugas Desain (`DESIGN_TASK` — Teal/Emerald), serta opsi overlay jadwal publikasi `Content Calendar` (Amber/Oranye).
  3. Klik pada item kalender membuka *slide-over drawer* detail task/konten secara instan.
  4. `SUPER_ADMIN` dan `PROJECT_MANAGER` dapat menjadwal ulang (*reschedule*) `due_date` task di V1 melalui **modal atau *slide-over drawer* edit tanggal** langsung dari item kalender (sedangkan *drag-and-drop* langsung di grid kalender dijadwalkan pada iterasi V1.1 sesuai `MOS-20`).
* **Aturan Bisnis & Validasi:**
  - Task tanpa `due_date` tidak muncul pada grid kalender, tetapi ditampilkan pada panel samping *Unscheduled Tasks* agar dapat segera diberi tenggat.
  - Perubahan `due_date` pada task yang sudah pernah melewati tenggat atau telah aktif mencatat nilai lama dan baru pada `activity_logs` serta mengirim notifikasi ke assignee.
* **Keterhubungan Lintas Modul:** Mengintegrasikan jadwal task Modul A dengan jadwal tayang Modul C dalam satu kalender kerja operasional.

##### `FR-A05` — Task Assignment
* **Tujuan:** Mengatur pembuatan, pendelegasian, dan pengalihan (*reassignment*) tugas secara akuntabel dengan kejelasan penanggung jawab dan reviewer.
* **Aktor & Akses:** `SUPER_ADMIN` dan `PROJECT_MANAGER` dapat membuat dan menugaskan task kepada anggota tim aktif mana pun; `STAFF_CREATOR` dan `DESIGNER` dapat membuat task pribadi (`assignee_id = self`) pada proyek mereka atau task usulan di `BACKLOG`.
* **Spesifikasi Fungsional:**
  1. Formulir pembuatan/edit task mencakup: `title` (wajib, 3–180 karakter), `description` (rich text / markdown dasar, maksimal 5.000 karakter), `project_id` (wajib), `task_type` (`GENERAL`, `CONTENT_PRODUCTION`, `DESIGN_TASK`), `priority` (`LOW`, `MEDIUM`, `HIGH`, `URGENT`, default `MEDIUM`), `assignee_id` (wajib untuk status selain `BACKLOG`), `reviewer_id` (opsional; otomatis terisi PM proyek jika `requires_review = true`), `due_date` (wajib untuk status selain `BACKLOG`), `estimated_hours` (opsional, numerik 0.5–500 jam), dan `tags` (maksimal 5 label).
  2. Saat memilih `assignee_id`, dropdown menampilkan indikator beban kerja aktif anggota tersebut (misal: *"Nta — 4 aktif, 1 overdue"*) sebagai alat bantu distribusi kerja yang adil.
  3. Mendukung fitur **Reassign Task** oleh `SUPER_ADMIN` / `PROJECT_MANAGER` disertai alasan opsional.
* **Aturan Bisnis & Validasi:**
  - Hanya user dengan `is_active = true` yang dapat dipilih sebagai `assignee_id` atau `reviewer_id`.
  - Setiap task memiliki tepat **1 Primary Assignee** agar akuntabilitas perhitungan KPI individu bersifat tunggal dan tidak ganda (*single-owner accountability*).
  - Jika sebuah task di-reassign sebelum status `DONE`, seluruh kredit KPI penyelesaian dan ketepatan waktu dihitung pada `assignee_id` terakhir saat task diselesaikan; perubahan assignee dicatat penuh di `activity_logs`.
* **Keterhubungan Lintas Modul:** Memicu notifikasi `TASK_ASSIGNED` atau `TASK_REASSIGNED` di Modul D dan memperbarui daftar `My Tasks` assignee baru secara langsung.

##### `FR-A06` — Progress Tracking
* **Tujuan:** Menyediakan pelacakan kemajuan pengerjaan secara granular pada level sub-langkah (checklist), diskusi kontekstual, dan progres proyek menyeluruh.
* **Aktor & Akses:** Seluruh anggota proyek terkait dapat membaca progres dan menambahkan komentar; assignee, `PROJECT_MANAGER`, dan `SUPER_ADMIN` dapat menambah, mengubah, dan mencentang item checklist.
* **Spesifikasi Fungsional:**
  1. **Task Checklists (Sub-items):** Setiap task dapat memiliki daftar checklist (maksimal 30 item per task, judul item 2–200 karakter). Sistem menghitung persentase progres checklist otomatis: $\text{Checklist Progress} = \left(\dfrac{\text{Checklist Completed}}{\text{Total Checklist}}\right) \times 100\%$.
  2. **Task Comments & Mentions:** Kolom komentar kronologis pada detail task yang mendukung penyebutan anggota (`@username`) dan lampiran tautan referensi.
  3. **Task Attachments (Ringan):** Mendukung penyimpanan tautan dokumen/referensi eksternal dan unggahan file pendukung ($\le 25\text{ MB}$, maks 5 file/task).
  4. **Project Progress Bar:** Agregasi otomatis pada halaman proyek: $\text{Project Progress} = \left(\dfrac{\text{Tasks DONE}}{\text{Total Tasks} - \text{Tasks CANCELLED}}\right) \times 100\%$.
* **Aturan Bisnis & Validasi:**
  - Komentar yang sudah dipublikasikan hanya dapat diedit oleh penulisnya (menampilkan penanda *(edited)*) atau dihapus oleh penulis/`SUPER_ADMIN` (soft-delete).
  - Penyebutan `@nama` dalam komentar memicu notifikasi `TASK_COMMENT_MENTION` kepada user yang disebut.
* **Keterhubungan Lintas Modul:** Histori perubahan checklist/status muncul di timeline aktivitas task dan `Activity Logs` (Modul D).

##### `FR-A07` — Deadline Management
* **Tujuan:** Memberikan sistem peringatan dini terhadap tenggat waktu tugas dan memudahkan mitigasi sebelum keterlambatan berdampak pada target proyek atau jadwal publikasi konten.
* **Aktor & Akses:** Seluruh peran melihat status tenggat pada task mereka; `SUPER_ADMIN` dan `PROJECT_MANAGER` memiliki tampilan khusus **Overdue & At-Risk Monitor**.
* **Spesifikasi Fungsional:**
  1. **Klasifikasi Status Tenggat Otomatis** (untuk seluruh task yang statusnya bukan `DONE` dan bukan `CANCELLED`):
     - `OVERDUE` (Badge Merah): `NOW() > due_date`.
     - `DUE_SOON` (Badge Kuning/Amber): `0 <= (due_date - NOW()) <= 48 jam` (H-2 hingga jatuh tempo).
     - `ON_TRACK` (Badge Netral/Hijau): `(due_date - NOW()) > 48 jam`.
     - `NO_DEADLINE` (Badge Abu-abu): `due_date IS NULL`.
  2. **Automated Deadline Reminders (In-App):** Cron/scheduled job harian (berjalan pukul 08:00 WIB melalui `/api/cron/deadline-alerts`) memeriksa task aktif dan mengirimkan notifikasi:
     - **H-2 (48 jam sebelum `due_date`):** Notifikasi `TASK_DEADLINE_SOON` kepada `assignee_id`.
     - **Hari-H (tanggal jatuh tempo):** Notifikasi `TASK_DEADLINE_TODAY` kepada `assignee_id`.
     - **H+1 (terlewat 1 hari) & eskalasi H+3:** Notifikasi `TASK_OVERDUE` kepada `assignee_id` DAN `PROJECT_MANAGER` (owner proyek).
  3. **Overdue Summary Widget:** Tersedia pada halaman Dashboard dan Kanban filter cepat (*"Tampilkan Hanya Overdue & Due Soon"*).
* **Aturan Bisnis & Validasi:**
  - Jika `due_date` diinput sebagai tanggal tanpa jam, sistem secara otomatis menetapkan batas waktu pada pukul `23:59:59 WIB` tanggal tersebut.
  - Perubahan `due_date` oleh `STAFF_CREATOR` atau `DESIGNER` **tidak diizinkan** secara langsung pada task yang diberikan oleh PM/Admin (mencegah manipulasi metrik `OTDR`); perubahan tenggat hanya boleh dilakukan oleh `PROJECT_MANAGER` atau `SUPER_ADMIN`, dan setiap perpanjangan tenggat mencatat `deadline_extension_count` serta nilai lama/baru di `activity_logs`.
* **Keterhubungan Lintas Modul:** Nilai ketepatan terhadap `due_date` secara langsung menjadi dasar rumus *On-Time Delivery Rate* (`OTDR`) pada Modul B (`FR-B02`).

---

#### 2.2 Modul B — Team Management & KPI (`FR-B01` – `FR-B06`)

Modul B mengubah data operasional harian dari Modul A dan Modul C menjadi visibilitas performa tim yang objektif, transparan, dan terstruktur dalam siklus evaluasi bulanan.

##### `FR-B01` — Team Directory
* **Tujuan:** Menyediakan direktori terpusat informasi profil operasional anggota tim Krevia Digital beserta kapasitas kerja aktifnya.
* **Aktor & Akses:** Seluruh 4 peran dapat melihat direktori tim aktif (informasi operasional non-sensitif); `SUPER_ADMIN` dapat mengelola detail divisi/jabatan dan status aktif anggota.
* **Spesifikasi Fungsional:**
  1. Menampilkan kartu/tabel anggota tim berisi: Foto/Avatar, Nama Lengkap, Jabatan (*Job Title*), Divisi/Tim (`Management`, `Project & Operations`, `Social Media & Content`, `Creative & Design`, `Engineering`), Peran RBAC (`role_code`), Email Kantor, Status Akun (`Aktif` / `Non-Aktif`), serta ringkasan beban kerja saat ini (jumlah task aktif & overdue — khusus `SUPER_ADMIN` dan `PROJECT_MANAGER`).
  2. Fitur pencarian berdasarkan nama/jabatan dan filter berdasarkan Divisi, Peran RBAC, dan Status Akun.
  3. Halaman profil anggota (*Member Detail*) menampilkan proyek yang sedang diikuti dan ringkasan performa (hanya dapat dilihat oleh diri sendiri, `PROJECT_MANAGER`, dan `SUPER_ADMIN`).
* **Aturan Bisnis & Validasi:**
  - Data sensitif HRIS (gaji, NIK, rekening bank) **tidak disimpan** dalam direktori ini sesuai V1 Scope Guardrails.
  - Anggota berstatus `Non-Aktif` tidak muncul dalam dropdown assignment baru, tetapi tetap dapat dilihat dengan filter *"Tampilkan Non-Aktif"* untuk keperluan histori evaluasi.
* **Keterhubungan Lintas Modul:** Terhubung langsung dengan `User Management` (`FR-D01`) dan `Individual Performance` (`FR-B02`).

##### `FR-B02` — Individual Performance (Metrik Otomatis & Rumus Baku)
* **Tujuan:** Menghitung dan menampilkan metrik kinerja objektif setiap individu per periode bulan (`YYYY-MM`) secara otomatis berdasarkan data eksekusi aktual di Modul A dan Modul C.
* **Aktor & Akses:** Setiap user (`STAFF_CREATOR`, `DESIGNER`, `PROJECT_MANAGER`, `SUPER_ADMIN`) dapat melihat halaman **My Performance** miliknya sendiri; `PROJECT_MANAGER` dan `SUPER_ADMIN` dapat melihat performa individu seluruh anggota tim.
* **Spesifikasi Fungsional & Rumus Matematika Eksak:**
  Sistem menghitung 4 metrik otomatis utama untuk user $u$ pada periode bulan $M$ (rentang `01 YYYY-MM 00:00:00 WIB` hingga hari terakhir bulan `23:59:59 WIB`):

  1. **Task Completion Rate (`TCR`) — Berlaku untuk semua peran:**
     - Himpunan dasar ($T_{\text{assigned}}$): Jumlah seluruh task milik `assignee_id = u` yang memiliki `due_date` dalam periode bulan $M$ (atau task tanpa `due_date` yang diselesaikan pada bulan $M$) dengan `status != 'CANCELLED'` dan `deleted_at IS NULL`.
     - Jumlah selesai ($T_{\text{done}}$): Jumlah task dalam himpunan $T_{\text{assigned}}$ yang memiliki `status = 'DONE'`.
     $$\text{TCR}(u, M) = \begin{cases} \text{N/A} & \text{jika } T_{\text{assigned}} = 0 \\ \text{ROUND}\!\left(\dfrac{T_{\text{done}}}{T_{\text{assigned}}} \times 100,\; 2\right)\% & \text{jika } T_{\text{assigned}} > 0 \end{cases}$$

  2. **On-Time Delivery Rate (`OTDR`) — Berlaku untuk semua peran:**
     - Untuk mencegah keterlambatan proses review menghukum pelaksana yang menyerahkan hasil tepat waktu, sistem mendefinisikan **Waktu Penyelesaian Efektif** (`effective_completion_time`) untuk setiap task berstatus `DONE`:
       - Jika `revision_count = 0`: `effective_completion_time = COALESCE(first_submitted_at, completed_at)`.
       - Jika `revision_count > 0`: `effective_completion_time = completed_at` (karena hasil awal belum memenuhi standar).
     - Himpunan dasar ($T_{\text{done\_dated}}$): Jumlah task dalam $T_{\text{done}}$ yang memiliki `due_date IS NOT NULL`.
     - Jumlah tepat waktu ($T_{\text{on\_time}}$): Jumlah task dalam $T_{\text{done\_dated}}$ di mana `effective_completion_time <= due_date`.
     $$\text{OTDR}(u, M) = \begin{cases} \text{N/A} & \text{jika } T_{\text{done\_dated}} = 0 \\ \text{ROUND}\!\left(\dfrac{T_{\text{on\_time}}}{T_{\text{done\_dated}}} \times 100,\; 2\right)\% & \text{jika } T_{\text{done\_dated}} > 0 \end{cases}$$

  3. **Design Quality / Revision Score (`DQS`) — Khusus peran `DESIGNER` (atau task `DESIGN_TASK`):**
     - Himpunan dasar ($D_{\text{approved}}$): Jumlah `design_briefs` milik Designer $u$ yang mencapai status `APPROVED` pada periode bulan $M$.
     - Untuk setiap desain $i \in \{1 \dots D_{\text{approved}}\}$ dengan jumlah revisi $r_i = \text{revision\_count}_i$, skor per desain dihitung dengan penalti 15 poin per siklus revisi dan batas bawah (*floor score*) 40 poin:
       $$\text{Score\_Desain}_i = \max\big(40,\; 100 - (15 \times r_i)\big)$$
       *(0 revisi = 100; 1 revisi = 85; 2 revisi = 70; 3 revisi = 55; $\ge 4$ revisi = 40).*
     - Skor kualitas desain bulanan (`DQS`), rata-rata revisi ($\bar{R}$), dan *First-Pass Approval Rate* (`FPAR`):
       $$\text{DQS}(u, M) = \begin{cases} \text{N/A} & \text{jika } D_{\text{approved}} = 0 \\ \text{ROUND}\!\left(\dfrac{1}{D_{\text{approved}}} \sum_{i=1}^{D_{\text{approved}}} \text{Score\_Desain}_i,\; 2\right) & \text{jika } D_{\text{approved}} > 0 \end{cases}$$
       $$\bar{R} = \frac{\sum r_i}{D_{\text{approved}}}, \qquad \text{FPAR} = \frac{|\{i : r_i = 0\}|}{D_{\text{approved}}} \times 100\%$$

  4. **Content Output Target Achievement (`CPVS`) — Khusus peran `STAFF_CREATOR`:**
     - $C_{\text{delivered}}$: Jumlah `content_items` di mana `creator_id = u`, berstatus `IN ('SCHEDULED', 'PUBLISHED')`, dan `COALESCE(published_at, planned_publish_at)` jatuh pada periode bulan $M$.
     - $C_{\text{target}}$: Target jumlah konten bulanan yang ditetapkan dalam `kpi_assignments` user $u$ (misal 20 konten/bulan).
     $$\text{CPVS}(u, M) = \begin{cases} \text{N/A} & \text{jika } C_{\text{target}} = 0 \\ \min\!\left(100.00,\; \text{ROUND}\!\left(\dfrac{C_{\text{delivered}}}{C_{\text{target}}} \times 100,\; 2\right)\right)\% & \text{jika } C_{\text{target}} > 0 \end{cases}$$

* **Aturan Bisnis & Validasi:**
  - Halaman Individual Performance juga menampilkan *drill-down table* berisi daftar task dan desain yang menjadi komponen pembentuk skor sehingga karyawan dapat memverifikasi transparansi angka secara langsung.
  - Grafik tren 6 bulan terakhir menampilkan evolusi `TCR`, `OTDR`, dan `Weighted KPI Score` individu.
* **Keterhubungan Lintas Modul:** Membaca langsung data `tasks` (Modul A), `content_items` dan `design_briefs`/`design_submissions` (Modul C), lalu memasok nilai aktual otomatis ke `Monthly Evaluation` (`FR-B05`).

##### `FR-B03` — KPI Management
* **Tujuan:** Mengelola katalog indikator KPI, bobot penilaian per peran, dan target bulanan individu secara terstandarisasi dan fleksibel.
* **Aktor & Akses:** `SUPER_ADMIN` dan `PROJECT_MANAGER` dapat membuat, mengubah, dan menugaskan template KPI; `STAFF_CREATOR` dan `DESIGNER` hanya dapat melihat indikator, bobot, dan target KPI yang ditetapkan kepada mereka (*read-only*).
* **Spesifikasi Fungsional:**
  1. **KPI Template Management:** Pengelolaan daftar indikator dengan atribut: `name` (3–120 karakter), `description` (maks 500 karakter), `target_role` (`PROJECT_MANAGER`, `STAFF_CREATOR`, `DESIGNER`, atau `ALL`), `calculation_type` (`AUTO_TCR`, `AUTO_OTDR`, `AUTO_DQS`, `AUTO_CPVS`, `MANUAL_SCORE`), `default_weight` (angka 1–100 dalam persen), `target_value` (misal `100` untuk skor persentase, atau angka target konten seperti `20`), `unit` (`%`, `Skor`, `Konten`, `Task`), dan `is_active`.
  2. **KPI Assignment per Periode:** Menetapkan/mengkloning paket indikator KPI ke setiap anggota tim untuk periode bulan $M$ (`YYYY-MM`), dengan fitur **"Salin dari Bulan Sebelumnya"** (*Clone Previous Month*) agar PM tidak perlu menginput ulang setiap bulan.
  3. **Paket Bobot Default Bawaan (Seeded V1):**

     | Peran Target | Indikator KPI | Tipe Kalkulasi | Bobot Default | Target Default |
     | :--- | :--- | :--- | :---: | :---: |
     | `PROJECT_MANAGER` | Team/Project Task Completion Rate | `AUTO_TCR` (agregasi proyek dipimpin) | 30% | 95% |
     | `PROJECT_MANAGER` | Team On-Time Delivery Rate | `AUTO_OTDR` (agregasi proyek dipimpin) | 30% | 90% |
     | `PROJECT_MANAGER` | Kualitas Perencanaan & Mitigasi Risiko | `MANUAL_SCORE` | 20% | 85 Skor |
     | `PROJECT_MANAGER` | Koordinasi Tim & Komunikasi Leadership | `MANUAL_SCORE` | 20% | 85 Skor |
     | `STAFF_CREATOR` | Individual Task Completion Rate (`TCR`) | `AUTO_TCR` | 25% | 95% |
     | `STAFF_CREATOR` | On-Time Delivery Rate (`OTDR`) | `AUTO_OTDR` | 25% | 90% |
     | `STAFF_CREATOR` | Pencapaian Target Output Konten (`CPVS`) | `AUTO_CPVS` | 25% | 20 Konten |
     | `STAFF_CREATOR` | Kualitas Ide, Copywriting & Konsistensi Brand | `MANUAL_SCORE` | 25% | 85 Skor |
     | `DESIGNER` | Individual Task Completion Rate (`TCR`) | `AUTO_TCR` | 25% | 95% |
     | `DESIGNER` | On-Time Delivery Rate (`OTDR`) | `AUTO_OTDR` | 25% | 90% |
     | `DESIGNER` | Design Quality & Revision Score (`DQS`) | `AUTO_DQS` | 30% | 85 Skor |
     | `DESIGNER` | Kreativitas Visual & Kepatuhan Brief | `MANUAL_SCORE` | 20% | 85 Skor |

* **Aturan Bisnis & Validasi:**
  - **Validasi Total Bobot = 100%:** Sistem menolak penyimpanan `kpi_assignments` untuk satu user pada satu periode jika $\sum w_k \neq 100$.
  - Perubahan template KPI tidak memengaruhi evaluasi bulanan yang sudah berstatus `FINALIZED`.
* **Keterhubungan Lintas Modul:** Menjadi dasar struktur item penilaian pada `Monthly Evaluation` (`FR-B05`) dan memicu log audit di Modul D.

##### `FR-B04` — Team Performance Dashboard
* **Tujuan:** Memberikan ringkasan eksekutif real-time mengenai kesehatan produktivitas seluruh tim Krevia Digital bagi Leadership dan Project Manager.
* **Aktor & Akses:** Eksklusif untuk `SUPER_ADMIN` dan `PROJECT_MANAGER`.
* **Spesifikasi Fungsional:**
  1. **KPI Summary Cards (Periode Terpilih):** Rata-rata `TCR` Tim, Rata-rata `OTDR` Tim, Total Task Selesai vs Overdue, Rata-rata `DQS` Desain, dan Jumlah Konten Terpublikasi bulan berjalan.
  2. **Leaderboard / Tabel Perbandingan Anggota Tim:** Menampilkan seluruh anggota aktif beserta metrik `TCR`, `OTDR`, `DQS`/`CPVS`, jumlah task aktif, jumlah overdue, dan status evaluasi bulanan (`DRAFT`/`SUBMITTED`/`REVIEWED`/`FINALIZED`), dapat diurutkan per kolom.
  3. **Workload Distribution Chart (Bar Chart):** Membandingkan jumlah task aktif (`TODO`, `IN_PROGRESS`, `IN_REVIEW`, `REVISION`) per anggota tim untuk mendeteksi kelebihan beban (*overload*) vs kapasitas kosong (*underutilized*).
  4. **Trend Chart (6 Bulan):** Grafik garis rata-rata `OTDR`, `TCR`, dan `Weighted KPI Score` tim dari bulan ke bulan.
  5. Filter dashboard berdasarkan Periode (`YYYY-MM`), Divisi/Peran, dan Proyek.
* **Aturan Bisnis & Validasi:**
  - Data dashboard dihitung secara konsisten menggunakan definisi rumus yang sama dengan `FR-B02`; untuk bulan yang sudah lewat dan `FINALIZED`, dashboard membaca nilai dari snapshot evaluasi final agar angka historis tidak berubah.
* **Keterhubungan Lintas Modul:** Mengagregasi data lintas Modul A, B, dan C menjadi visualisasi strategis untuk Leadership.

##### `FR-B05` — Monthly Evaluation
* **Tujuan:** Menyediakan alur kerja formal evaluasi kinerja bulanan yang menggabungkan metrik otomatis dari sistem dan penilaian kualitatif dari evaluator secara transparan dan dapat diaudit.
* **Aktor & Akses:** `PROJECT_MANAGER` membuat, mengisi penilaian, dan mengajukan review evaluasi anggota timnya; `SUPER_ADMIN` dapat menilai, meninjau, mengembalikan untuk koreksi, dan memfinalisasi evaluasi (termasuk evaluasi milik `PROJECT_MANAGER`); `STAFF_CREATOR` dan `DESIGNER` dapat melihat evaluasi miliknya setelah berstatus `FINALIZED` (catatan *self-reflection* karyawan bersifat opsional untuk iterasi V1.1 per `MOS-22`).
* **Spesifikasi Fungsional:**
  1. **Siklus Status Kanonik (`kpi_eval_status`):**
     - `DRAFT`: Evaluasi dibuat/digenerate untuk periode `YYYY-MM`; sistem menarik nilai aktual metrik otomatis (`AUTO_TCR`, `AUTO_OTDR`, `AUTO_DQS`, `AUTO_CPVS`) secara *live preview*, dan evaluator mengisi skor metrik `MANUAL_SCORE` (unit `SCORE_100`, skala 0–100) beserta catatan kualitatif (`evaluator_notes`, `strengths`, `areas_for_improvement`).
     - `SUBMITTED`: Evaluator (`PROJECT_MANAGER`) menyelesaikan pengisian dan mengirim evaluasi untuk ditinjau oleh `SUPER_ADMIN` (memicu notifikasi `KPI_EVALUATION_SUBMITTED`).
     - `REVIEWED`: `SUPER_ADMIN` telah memeriksa dan menambahkan komentar eksekutif (atau mengembalikan ke `DRAFT` jika perlu revisi penilaian).
     - `FINALIZED`: Evaluasi dikunci secara permanen (**Immutable Snapshot**). Nilai metrik otomatis (`auto_metrics_snapshot`), bobot, skor per item, `weighted_kpi_score`, dan `performance_grade` disimpan tetap di database sehingga perubahan task di masa depan tidak akan mengubah hasil evaluasi bulan tersebut.
  2. **Rumus Weighted Monthly KPI Score & Weight Re-Normalization:**
     - Setiap indikator aktif $k$ memiliki skor $S_k \in [0.00, 100.00]$ dan bobot $w_k > 0$:
       - Tipe `AUTO_TCR`, `AUTO_OTDR`, `AUTO_DQS`: $S_k = \text{actual\_value}_k$.
       - Tipe `AUTO_CPVS`: $S_k = \min\!\left(100.00,\; \dfrac{\text{actual\_value}_k}{\text{target\_value}_k} \times 100\right)$.
       - Tipe `MANUAL_SCORE`: $S_k = \text{evaluator\_input\_score}_k$.
     - Jika pada periode tertentu terdapat indikator otomatis bernilai `N/A` (misal seorang anggota baru bergabung dan belum memiliki task bertenggat di bulan itu), indikator tersebut dikeluarkan dari himpunan aktif $A$ dan bobot sisanya dinormalisasi otomatis:
       $$\text{Weighted KPI Score} = \text{ROUND}\!\left(\frac{\sum_{k \in A} (S_k \times w_k)}{\sum_{k \in A} w_k},\; 2\right)$$
  3. **Klasifikasi Predikat Kinerja (*Performance Grade*):**
     - `90.00 – 100.00` $\rightarrow$ **Grade A** (*Exceeds Expectations / Sangat Baik*)
     - `80.00 – 89.99` $\rightarrow$ **Grade B** (*Meets Expectations / Baik*)
     - `70.00 – 79.99` $\rightarrow$ **Grade C** (*Needs Improvement / Cukup*)
     - `0.00 – 69.99` $\rightarrow$ **Grade D** (*Underperforming / Perlu Pembinaan*)
* **Aturan Bisnis & Validasi:**
  - Hanya boleh ada **tepat 1 dokumen evaluasi** per kombinasi `UNIQUE (user_id, period_year, period_month)` (ditampilkan di UI dalam format periode `YYYY-MM`).
  - Evaluator **tidak dapat mengevaluasi dirinya sendiri** (`evaluator_id != evaluatee_id`); evaluasi `PROJECT_MANAGER` wajib dilakukan oleh `SUPER_ADMIN`.
  - Nilai metrik bertipe `AUTO_*` bersifat **read-only** dan tidak dapat diubah manual demi menjaga objektivitas; bila ada pengecualian kasus khusus (misal sakit/force majeure), evaluator menuliskannya di kolom `override_justification` / catatan manajerial tanpa memalsukan data mentah.
  - Perubahan status ke `SUBMITTED` ditolak jika masih ada indikator `MANUAL_SCORE` yang kosong atau `evaluator_notes` kurang dari 20 karakter.
  - Evaluasi yang sudah `FINALIZED` tidak dapat diedit lagi; pembukaan kembali (*re-open*) hanya dapat dilakukan oleh `SUPER_ADMIN` dengan alasan wajib minimal 20 karakter yang langsung terekam di `Activity Logs`.
* **Keterhubungan Lintas Modul:** Finalisasi evaluasi memicu notifikasi `KPI_EVALUATION_FINALIZED` kepada karyawan bersangkutan (Modul D) dan membuka dokumen di `Reports & Analytics` (`FR-B06`).

##### `FR-B06` — Reports & Analytics
* **Tujuan:** Menyediakan fasilitas ekspor laporan kinerja dan operasional yang siap disajikan pada rapat bulanan Leadership Krevia Digital.
* **Aktor & Akses:** `SUPER_ADMIN` dan `PROJECT_MANAGER` dapat mengekspor laporan tim, proyek, dan individu; `STAFF_CREATOR` dan `DESIGNER` dapat mengunduh rapor evaluasi bulanan pribadi mereka yang sudah berstatus `FINALIZED`.
* **Spesifikasi Fungsional:**
  1. **Jenis Laporan Standar V1:**
     - **Monthly Individual KPI Report (PDF):** Rapor resmi berlogo Krevia Digital memuat identitas karyawan, periode, tabel indikator + bobot + target + aktual + skor, `Weighted KPI Score`, Grade, catatan evaluator, dan ringkasan statistik tugas.
     - **Monthly Team Performance Summary (CSV / XLSX):** Rekap tabel seluruh anggota tim dalam satu bulan (`Nama`, `Role`, `Divisi`, `Tasks Assigned`, `Tasks Done`, `TCR`, `OTDR`, `DQS/CPVS`, `Weighted KPI Score`, `Grade`, `Status Evaluasi`).
     - **Project Execution & Task Report (CSV):** Daftar tugas per proyek beserta status, assignee, `due_date`, `completed_at`, dan status on-time/overdue.
  2. Filter periode (`YYYY-MM` atau rentang tanggal maksimal 12 bulan), divisi, peran, dan proyek sebelum ekspor.
* **Aturan Bisnis & Validasi:**
  - File PDF/CSV yang diekspor menyertakan metadata cap waktu generasi (`Generated at: DD MMM YYYY HH:mm WIB`) dan nama pengguna pengekspor.
  - Setiap aktivitas ekspor laporan tim dicatat pada `activity_logs` dengan aksi `REPORT_EXPORTED`.
* **Keterhubungan Lintas Modul:** Mengonsumsi data final dari Modul A, Modul B, dan Modul C (ringkasan publikasi konten).

---

#### 2.3 Modul C — Social Media & Design Management (`FR-C01` – `FR-C07`)

Modul C dirancang khusus untuk menggantikan spreadsheet konten dan koordinasi revisi desain yang tersebar di chat, sekaligus menghubungkan seluruh pekerjaan kreatif ke papan tugas (Modul A) dan KPI tim kreatif (Modul B).

##### `FR-C01` — Content Calendar (Pengganti Spreadsheet Konten)
* **Tujuan:** Menjadi kalender editorial tunggal untuk seluruh kanal media sosial Krevia Digital dengan visibilitas status produksi dari ide hingga tayang.
* **Aktor & Akses:** `SUPER_ADMIN`, `PROJECT_MANAGER`, dan `STAFF_CREATOR` memiliki akses baca & kelola jadwal konten; `DESIGNER` memiliki akses baca kalender dan membuka brief/desain terkait.
* **Spesifikasi Fungsional:**
  1. Mendukung tiga mode tampilan: **Calendar Grid (Bulanan & Mingguan)**, **Editorial Table View** (pengganti langsung tampilan baris/kolom spreadsheet dengan sorting & inline filter), dan **Pipeline Board View** (berdasarkan `content_status`).
  2. Setiap entri menampilkan: Judul Konten, Kanal/Platform (`INSTAGRAM`, `TIKTOK`, `LINKEDIN`, `YOUTUBE`, `X_TWITTER`, `FACEBOOK`, `WEBSITE_BLOG`), Format (`REELS`, `CAROUSEL`, `SINGLE_POST`, `STORY`, `SHORT_VIDEO`, `LONG_VIDEO`, `ARTICLE`, `INFOGRAPHIC`), Pilar Konten (`EDUCATIONAL`, `PROMOTIONAL`, `ENGAGEMENT`, `BRAND_STORY`, `TESTIMONIAL`), `content_status`, PIC Creator (`creator_id`), PIC Designer, dan `planned_publish_at`.
  3. Filter cepat berdasarkan Bulan/Rentang Tanggal, Platform, Format, Pilar Konten, Status, Proyek/Kampanye, dan PIC.
  4. Penjadwalan ulang (*reschedule*) `planned_publish_at` di V1 melalui modal/drawer edit tanggal langsung dari Content Calendar oleh `SUPER_ADMIN`, `PROJECT_MANAGER`, atau `STAFF_CREATOR` (untuk konten belum `PUBLISHED`; *drag-and-drop* langsung di grid kalender adalah V1.1 per `MOS-20`).
* **Aturan Bisnis & Validasi:**
  - Setiap item konten pada kalender wajib melalui alur status kanonik: `IDEA` $\rightarrow$ `APPROVED_IDEA` $\rightarrow$ `PLANNING` $\rightarrow$ `IN_DESIGN` $\rightarrow$ `DESIGN_REVIEW` $\leftrightarrow$ `DESIGN_REVISION` $\rightarrow$ `READY_TO_PUBLISH` $\rightarrow$ `SCHEDULED` $\rightarrow$ `PUBLISHED` $\rightarrow$ `ARCHIVED`.
  - Konten yang tidak memerlukan desain visual (`requires_design = false`, misal thread teks murni atau repost) dapat berpindah langsung dari `PLANNING` $\rightarrow$ `READY_TO_PUBLISH`.
  - Konten berstatus `PUBLISHED` tidak dapat dijadwalkan ulang tanggal tayangnya kecuali oleh `SUPER_ADMIN` / `PROJECT_MANAGER` untuk koreksi administratif (tercatat di audit log).
* **Keterhubungan Lintas Modul:** Jadwal publikasi tampil sebagai overlay di `Work Calendar` (`FR-A04`); perubahan status memicu notifikasi (Modul D).

##### `FR-C02` — Content Ideas Management
* **Tujuan:** Menyediakan bank ide konten terstruktur agar proses *brainstorming*, kurasi, dan persetujuan ide terdokumentasi rapi sebelum masuk ke tahap produksi.
* **Aktor & Akses:** Seluruh 4 peran dapat mengajukan ide konten baru; `PROJECT_MANAGER` dan `SUPER_ADMIN` berwenang menyetujui (`APPROVED_IDEA`) atau menolak/mengarsipkan (`ARCHIVED`) ide.
* **Spesifikasi Fungsional:**
  1. Formulir pengajuan ide: `title` (wajib, 5–150 karakter), `hook_or_angle` (wajib, 10–1.000 karakter), `target_platforms` (multi-select minimal 1 platform), `content_pillar`, `reference_urls` (maksimal 5 tautan inspirasi valid `http://` atau `https://`), dan `priority` (`LOW`, `MEDIUM`, `HIGH`).
  2. Fitur **Upvote / Dukungan Tim** (1 vote per anggota per ide) dan kolom komentar singkat untuk diskusi penyempurnaan ide.
  3. Aksi kurasi oleh `PROJECT_MANAGER` / `SUPER_ADMIN`: **Approve & Promote to Content Plan** (mengubah status di `content_ideas` menjadi `APPROVED_IDEA` lalu `CONVERTED` saat otomatis membuat draf `content_items` di fase `PLANNING` tanpa mengetik ulang) atau **Reject / Archive** (`ARCHIVED`, wajib mengisi alasan penolakan minimal 10 karakter).
* **Aturan Bisnis & Validasi:**
  - Status pada tabel `content_ideas` mengikuti enum `content_idea_status_enum` (`IDEA`, `APPROVED_IDEA`, `CONVERTED`, `ARCHIVED`); ide yang dipromosikan terhubung secara relasional (`idea_id`) dengan `content_items` sehingga riwayat pencetus ide tetap terjaga.
  - Pengusul ide dapat mengedit ide miliknya selama status masih `IDEA`.
* **Keterhubungan Lintas Modul:** Approval atau penolakan ide memicu notifikasi `CONTENT_IDEA_REVIEWED` kepada pencetus ide (Modul D).

##### `FR-C03` — Content Planning
* **Tujuan:** Menyusun perencanaan produksi konten secara menyeluruh (naskah, caption, jadwal, dan pendelegasian produksi) serta menautkannya secara otomatis ke Modul A.
* **Aktor & Akses:** `STAFF_CREATOR`, `PROJECT_MANAGER`, dan `SUPER_ADMIN` dapat membuat dan mengedit rencana konten; `DESIGNER` dapat melihat rencana konten untuk memahami konteks desain.
* **Spesifikasi Fungsional:**
  1. Detail perencanaan konten meliputi: `title`, `project_id` (opsional, default proyek sosial media), `platform`, `content_format`, `content_pillar`, `creator_id`, `planned_publish_at` (tanggal & jam WIB), `script_or_copy` (naskah konten/slide carousel, maks 10.000 karakter), `caption` (maks 2.200 karakter dengan penghitung karakter langsung), `hashtags`, `cta_text`, `requires_design` (boolean, default `true`), dan `published_url` (diisi saat berpindah ke `PUBLISHED`).
  2. **Auto-Spawn Unified Task (`CONTENT_PRODUCTION`):** Ketika `content_items` memasuki status `PLANNING` dan memiliki `creator_id` serta `planned_publish_at`, sistem otomatis membuat (atau menautkan) satu task bertipe `CONTENT_PRODUCTION` di Modul A untuk `creator_id` dengan tenggat default $H-1$ dari `planned_publish_at` (dapat disesuaikan PM).
  3. Tombol **"Buat / Kirim Design Brief"** untuk langsung memicu pembuatan brief desain pada `FR-C04` jika `requires_design = true`.
* **Aturan Bisnis & Validasi:**
  - Transisi status ke `SCHEDULED` mengharuskan `planned_publish_at`, `caption` (minimal 10 karakter), dan (jika `requires_design = true`) desain final sudah berstatus `APPROVED`.
  - Transisi status ke `PUBLISHED` mewajibkan pengisian `published_url` yang valid (diawali protokol `https://`) dan otomatis mencatat `published_at = NOW()`.
* **Keterhubungan Lintas Modul:** Menghasilkan `CONTENT_PRODUCTION` task di Modul A (`FR-INT-01`) dan berkontribusi pada metrik `CPVS` di Modul B (`FR-B02`).

##### `FR-C04` — Design Workspace
* **Tujuan:** Menjadi ruang kerja terstruktur untuk menerima brief desain, mengunggah/menautkan hasil karya per versi, dan memantau riwayat iterasi desain tanpa kekacauan chat.
* **Aktor & Akses:** `STAFF_CREATOR`, `PROJECT_MANAGER`, dan `SUPER_ADMIN` dapat membuat dan melengkapi `Design Brief`; `DESIGNER` mengeksekusi brief, memperbarui status pengerjaan, dan mengirimkan *Design Submission*; `PROJECT_MANAGER` dan `SUPER_ADMIN` melakukan review/approval.
* **Spesifikasi Fungsional:**
  1. **Structured Design Brief:** Memuat `title`, relasi opsional `content_item_id`, `project_id`, `assigned_designer_id` (wajib dari peran `DESIGNER` atau anggota yang ditunjuk), `design_due_date` (wajib), `format_dimensions` (misal `1080x1350 px (4:5)`, `1080x1920 px (9:16)`), `slide_count` (integer 1–20), `copy_on_design` (teks wajib yang masuk di visual), `brand_guidelines_notes`, dan `reference_links` (tautan moodboard/referensi).
  2. **Auto-Spawn Unified Task (`DESIGN_TASK`):** Saat brief dipublikasikan ke desainer (`assigned_designer_id` terisi), sistem otomatis membuat satu task bertipe `DESIGN_TASK` di Modul A dengan assignee = `assigned_designer_id`, reviewer = `PROJECT_MANAGER` proyek, dan `due_date = design_due_date`.
  3. **Hybrid Submission (Upload & External Link) + Versioning:**
     - Designer dapat mengirimkan karya (`design_submissions`) dengan metode **Direct File Upload** (PNG, JPG, JPEG, WEBP, SVG, PDF, MP4 preview pendek; maksimal **25 MB per file**, maksimal 10 file per versi) ke Object Storage via presigned URL, **DAN/ATAU** **External Design Link** (URL valid ke Figma, Canva, Google Drive, Dropbox, Frame.io — wajib dipakai untuk file berukuran $> 25\text{ MB}$).
     - Setiap pengiriman baru otomatis menaikkan `version_number` secara berurutan (`v1`, `v2`, `v3`, hingga `vN`) dan menyimpan catatan desainer (`submission_notes`).
     - Versi lama tetap tersimpan (*read-only history*) untuk perbandingan sebelum-sesudah revisi.
* **Aturan Bisnis & Validasi:**
  - Status desain mengikuti enum kanonik: `PENDING_BRIEF` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `SUBMITTED` $\rightarrow$ (`REVISION_REQUESTED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `SUBMITTED`) $\rightarrow$ `APPROVED`.
  - Designer wajib melampirkan minimal 1 file upload ATAU 1 external link valid sebelum menekan tombol **Submit for Review** (`SUBMITTED`).
  - Validasi server-side menolak file yang MIME type-nya tidak termasuk whitelist (`image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`, `application/pdf`, `video/mp4`) atau ukuran melebihi `26.214.400 bytes` (25 MB).
* **Keterhubungan Lintas Modul:** Auto-spawn `DESIGN_TASK` di Modul A (`FR-INT-02`), menyinkronkan status `Content Item` ke `IN_DESIGN` / `DESIGN_REVIEW`, dan memicu notifikasi `DESIGN_BRIEF_ASSIGNED` / `DESIGN_SUBMITTED` (Modul D).

##### `FR-C05` — Design Approval & Revision Loop
* **Tujuan:** Menstandarisasi proses pemeriksaan kualitas visual, pencatatan revisi yang jelas, serta pengukuran kualitas desain secara objektif.
* **Aktor & Akses:** `PROJECT_MANAGER` dan `SUPER_ADMIN` berwenang melakukan keputusan **Approve** atau **Request Revision**; `STAFF_CREATOR` dapat memberikan komentar masukan (*feedback note*) tanpa mengesahkan status final; `DESIGNER` menerima keputusan dan mengerjakan versi revisi berikutnya.
* **Spesifikasi Fungsional:**
  1. Pada halaman review submission berstatus `SUBMITTED`, reviewer dapat mempratinjau gambar/PDF/MP4 secara langsung di browser (lightbox preview) atau membuka tautan Figma/Canva di tab baru.
  2. **Aksi Request Revision:** Mengubah status `design_status` menjadi `REVISION_REQUESTED`, mewajibkan pengisian daftar catatan revisi (`revision_notes`, minimal 10 karakter) serta opsi penyesuaian `revision_due_date`, dan menaikkan `revision_count = revision_count + 1`.
  3. **Aksi Approve Design:** Mengubah status `design_status` menjadi `APPROVED`, mencatat `approved_by` dan `approved_at = NOW()`, serta menampilkan tombol cepat *Promote to Asset Library* (berjalan otomatis secara default).
* **Aturan Bisnis & Validasi:**
  - Reviewer **tidak boleh** menekan *Request Revision* tanpa catatan tertulis; hal ini menjamin setiap penalti revisi pada KPI desainer memiliki bukti alasan yang jelas.
  - Apabila `revision_count` mencapai $\ge 3$ pada satu brief, sistem menampilkan banner peringatan (*High Revision Alert*) kepada `PROJECT_MANAGER` dan `SUPER_ADMIN` agar dilakukan sinkronisasi brief langsung.
  - Saat desain berubah menjadi `APPROVED`, versi tersebut dikunci sebagai *Final Approved Asset* dan tidak dapat ditimpa.
* **Keterhubungan Lintas Modul:**
  - `REVISION_REQUESTED` $\rightarrow$ `Content Item` otomatis berubah ke `DESIGN_REVISION`, linked `DESIGN_TASK` berpindah ke `REVISION`, dan `revision_count` bertambah.
  - `APPROVED` $\rightarrow$ `Content Item` otomatis berubah ke `READY_TO_PUBLISH`, linked `DESIGN_TASK` otomatis berubah ke `DONE` (`completed_at = NOW()`), file/link final otomatis tersimpan ke `Asset Library` (`FR-C06`), dan data `revision_count` masuk ke perhitungan `DQS` Modul B (`FR-B02`).

##### `FR-C06` — Asset Library
* **Tujuan:** Menyediakan repositori terpusat seluruh aset kreatif final (desain disetujui, template brand, logo, ikon, foto produk) yang mudah dicari dan siap digunakan ulang oleh seluruh tim.
* **Aktor & Akses:** Seluruh 4 peran dapat mencari, mempratinjau, dan mengunduh aset; `SUPER_ADMIN`, `PROJECT_MANAGER`, `DESIGNER`, dan `STAFF_CREATOR` dapat mengunggah aset manual; penghapusan (soft-delete) hanya oleh `SUPER_ADMIN`, `PROJECT_MANAGER`, atau pengunggah aset.
* **Spesifikasi Fungsional:**
  1. **Auto-Cataloging dari Design Approval:** Setiap kali `Design Submission` berstatus `APPROVED`, sistem otomatis mendaftarkan file/tautan finalnya sebagai entri di `Asset Library` lengkap dengan metadata judul, proyek, platform konten, nama desainer, tanggal approval, dan tautan balik ke `design_brief_id`.
  2. **Manual Upload & Cataloging:** Mendukung penambahan aset brand non-konten (Brand Kit, Logo Krevia, Template Presentasi, Stock Visual) dalam format direct upload ($\le 25\text{ MB}$) atau external link tervalidasi.
  3. **Pencarian & Klasifikasi:** Grid view & List view dengan thumbnail preview, filter kategori (`BRAND_KIT`, `SOCIAL_MEDIA`, `CAMPAIGN`, `TEMPLATE`, `PHOTO_VIDEO`, `DOCUMENT`, `OTHER`), format file, proyek, desainer, serta pencarian *full-text* pada nama file dan `tags` (maksimal 10 tag per aset).
  4. Tombol satu klik untuk **Download File** atau **Copy Asset Link** (termasuk tautan eksternal Figma/Canva).
* **Aturan Bisnis & Validasi:**
  - Aset yang berasal dari `Design Approval` ditandai dengan badge `APPROVED_FINAL` dan menyimpan tautan asal brief agar jejak persetujuan jelas.
  - Soft-delete aset dari Asset Library tidak menghapus riwayat submission pada `Design Workspace`.
* **Keterhubungan Lintas Modul:** Menerima promosi otomatis dari `FR-C05` dan dapat dilampirkan kembali sebagai referensi pada `Content Planning` (`FR-C03`) atau `Task` (`FR-A06`).

##### `FR-C07` — Content Performance Analytics
* **Tujuan:** Mencatat dan menganalisis hasil capaian konten pasca-publikasi agar tim dapat mengevaluasi format, pilar, dan kanal media sosial yang paling efektif.
* **Aktor & Akses:** `STAFF_CREATOR`, `PROJECT_MANAGER`, dan `SUPER_ADMIN` dapat menginput dan memperbarui metrik performa konten berstatus `PUBLISHED`; seluruh 4 peran (termasuk `DESIGNER`) dapat melihat dashboard analitik konten untuk umpan balik kualitas visual.
* **Spesifikasi Fungsional:**
  1. **Input Metrik Pasca-Publikasi:** Untuk setiap `content_items` berstatus `PUBLISHED`, pengguna dapat mencatat snapshot metrik (misal rekap H+7 atau H+30): `recorded_date`, `impressions`, `reach`, `likes`, `comments`, `shares`, `saves`, `clicks` (seluruhnya bilangan bulat $\ge 0$), serta catatan evaluasi kualitatif (`insights_note`).
  2. **Kalkulasi Otomatis Metrik Turunan:**
     $$\text{Total Engagement} = \text{likes} + \text{comments} + \text{shares} + \text{saves}$$
     $$\text{Engagement Rate by Reach (ER)} = \begin{cases} 0.00\% & \text{jika } \text{reach} = 0 \\ \text{ROUND}\!\left(\dfrac{\text{Total Engagement}}{\text{reach}} \times 100,\; 2\right)\% & \text{jika } \text{reach} > 0 \end{cases}$$
     $$\text{Click-Through Rate (CTR)} = \begin{cases} 0.00\% & \text{jika } \text{impressions} = 0 \\ \text{ROUND}\!\left(\dfrac{\text{clicks}}{\text{impressions}} \times 100,\; 2\right)\% & \text{jika } \text{impressions} > 0 \end{cases}$$
  3. **Dashboard Analitik Konten:** Menampilkan ringkasan total publikasi per periode, rata-rata `ER`, total `Reach`, grafik perbandingan performa per **Platform** dan per **Pilar Konten**, serta daftar **Top 5 Performing Contents** berdasarkan `ER` atau `Reach`.
* **Aturan Bisnis & Validasi:**
  - Pencatatan metrik hanya aktif jika `content_items.status` adalah `PUBLISHED` atau `ARCHIVED` (yang sebelumnya pernah `PUBLISHED`).
  - Sistem memperbolehkan lebih dari satu snapshot per konten (misal H+3, H+7, H+30), dan dashboard secara default menggunakan **snapshot terbaru** (`MAX(recorded_date)`) per konten untuk menghindari penghitungan ganda.
  - Validasi logis: sistem memberikan peringatan lunak (*soft warning*) jika nilai `reach > impressions` (saat `impressions > 0`) untuk mencegah kesalahan ketik input manual.
* **Keterhubungan Lintas Modul:** Menutup siklus penuh konten dari `FR-C02` (Ide) hingga performa aktual; ringkasan konten terbit dapat diekspor bersama laporan bulanan (`FR-B06`).

---
#### 2.4 Modul D — System Management (`FR-D01` – `FR-D05`)

Modul D menjamin keamanan akses, komunikasi operasional satu pintu, dan akuntabilitas penuh seluruh aktivitas di KTMS.

##### `FR-D01` — User Management
* **Tujuan:** Mengelola siklus hidup akun internal tim Krevia Digital secara aman tanpa merusak riwayat operasional dan evaluasi KPI.
* **Aktor & Akses:** Eksklusif `SUPER_ADMIN` untuk manajemen seluruh akun (buat, ubah peran, nonaktifkan, reset kata sandi); seluruh user dapat memperbarui profil pribadinya (nama tampilan, foto avatar, bio singkat, dan ubah password sendiri).
* **Spesifikasi Fungsional:**
  1. **Pembuatan Akun Internal:** `SUPER_ADMIN` mendaftarkan anggota baru dengan atribut wajib: `full_name` (3–100 karakter), `email` (unik, format email valid, lowercase normalized), `role_code` (salah satu dari 4 peran kanonik), `job_title` (2–80 karakter), `department`, dan kata sandi sementara (*temporary password*) yang memaksa penggantian sandi saat login pertama (`must_change_password = true`).
  2. **Aktivasi & Deaktivasi Akun:** Toggle `is_active` (`true`/`false`). Saat akun dinonaktifkan (`is_active = false`), `token_version` dinaikkan secara atomik sehingga sesi aktif user langsung diinvalidasi dan user tidak dapat mengakses sistem lagi.
  3. **Reset Password oleh Admin:** `SUPER_ADMIN` dapat menerbitkan kata sandi sementara baru bagi anggota yang lupa password, disertai flag `must_change_password = true`.
  4. **Autentikasi & Pengelolaan Sesi:** Login menggunakan email & password (Auth.js v5 Credentials Provider) dengan dukungan *"Change Password"* (wajib memverifikasi password lama).
* **Aturan Bisnis & Validasi:**
  - **Larangan Hard-Delete User:** Akun tidak boleh dihapus permanen untuk menjaga integritas relasi `tasks`, `design_submissions`, `monthly_evaluations`, dan `activity_logs`.
  - **Perlindungan Last Super Admin:** Sistem menolak penonaktifan atau penurunan peran (`demote`) akun `SUPER_ADMIN` terakhir yang masih aktif (`COUNT(active SUPER_ADMIN) >= 1`).
  - **Kebijakan Kekuatan Kata Sandi:** Minimal 10 karakter, mengandung kombinasi huruf besar, huruf kecil, dan angka.
  - Saat menonaktifkan user yang masih memegang task aktif (`TODO`/`IN_PROGRESS`/`IN_REVIEW`/`REVISION`), sistem menampilkan daftar task tersebut dan mengingatkan admin untuk melakukan *reassignment*.
* **Keterhubungan Lintas Modul:** Langsung memengaruhi `Team Directory` (`FR-B01`), daftar pilihan assignee (`FR-A05`), dan `RBAC` (`FR-D02`).

##### `FR-D02` — Role & Permission (RBAC)
* **Tujuan:** Menerapkan pemisahan wewenang yang ketat (*least privilege*) pada antarmuka UI maupun titik eksekusi server (*Server Actions* & *Route Handlers*) menggunakan model izin `module:resource:action`.
* **Aktor & Akses:** `SUPER_ADMIN` dapat melihat seluruh matriks peran & izin serta menetapkan peran per user (pada V1, 4 peran kanonik telah terdefinisi lengkap di database; kustomisasi peran baru dicadangkan untuk V1.1/V2 agar aturan bisnis tetap deterministik).
* **Spesifikasi Fungsional:**
  1. Mendukung **4 Peran Kanonik** dengan batas otorisasi terverifikasi di server:
     - `SUPER_ADMIN`: Akses penuh seluruh modul (A, B, C, D), finalisasi/re-open KPI, manajemen user/RBAC, akses penuh audit log.
     - `PROJECT_MANAGER`: Kelola proyek & seluruh task, review & approve desain/ide konten, kelola template/assignment KPI & submit evaluasi bulanan tim, buat pengumuman proyek/tim, baca log aktivitas proyeknya.
     - `STAFF_CREATOR`: Eksekusi task miliknya, buat/kelola ide konten, content planning & calendar, buat design brief, input content performance analytics, baca KPI & evaluasi final pribadi, baca pengumuman.
     - `DESIGNER`: Eksekusi task & design brief miliknya, upload/link submission desain di Design Workspace, baca Content Calendar, akses & upload Asset Library, baca KPI & evaluasi final pribadi, baca pengumuman.
  2. Halaman **Role & Permission Matrix** di Modul D (`/system/roles`) menampilkan tabel matriks transparan seluruh 42 kode permission kanonik (contoh: `tasks:item:assign`, `tasks:item:approve`, `kpi:evaluation:submit`, `kpi:evaluation:finalize`, `social:idea:approve`, `design:submission:approve`, `system:user:manage`, `system:rbac:manage`, `system:audit_log:read`) terhadap keempat peran.
  3. **Dual-Layer Enforcement:**
     - **UI Layer:** Menyembunyikan menu, tombol, dan aksi yang tidak diizinkan peran pengguna.
     - **Server Layer (Wajib):** Setiap Server Action dan API Route memanggil guard otorisasi (`requirePermission(user, permissionCode)` + pemeriksaan kepemilikan resource *ownership check* bila berlaku) sebelum menyentuh database; kegagalan mengembalikan status HTTP `403 Forbidden`.
* **Aturan Bisnis & Validasi:**
  - Perubahan peran seorang user oleh `SUPER_ADMIN` langsung berlaku pada request berikutnya (tidak menunggu sesi kedaluwarsa) melalui verifikasi sesi/role berbasis database dan dicatat sebagai peristiwa kritis di `activity_logs`.
* **Keterhubungan Lintas Modul:** Mengamankan seluruh endpoint dan halaman pada Modul A, B, C, dan D.

##### `FR-D03` — Notification Center (In-App)
* **Tujuan:** Memberikan notifikasi internal yang tepat sasaran dan dapat langsung ditindaklanjuti (*actionable deep-link*) tanpa membebani tim dengan spam.
* **Aktor & Akses:** Seluruh 4 peran memiliki ikon lonceng notifikasi di topbar dan halaman penuh Notification Center untuk notifikasi miliknya sendiri.
* **Spesifikasi Fungsional:**
  1. Menampilkan badge jumlah notifikasi belum dibaca (*unread count*, cap visual `99+`) pada topbar dengan pembaruan berkala efisien (polling ringan setiap 30 detik atau revalidasi saat fokus tab aktif).
  2. Dropdown cepat menampilkan 10 notifikasi terbaru; halaman penuh (`/notifications`) mendukung filter **Semua / Belum Dibaca** dan kategori modul (`TASKS`, `TEAM_KPI`, `SOCIAL_DESIGN`, `SYSTEM`), aksi **Tandai Dibaca**, dan **Tandai Semua Dibaca** (*Mark All as Read*).
  3. Klik pada notifikasi otomatis menandai notifikasi tersebut sebagai `is_read = true` dan mengarahkan pengguna (*deep-link*) langsung ke entitas terkait (drawer task, detail design brief, evaluasi bulanan, atau pengumuman).
  4. **Katalog Event Pemicu Notifikasi V1 (21 Event Kanonik `notification_type_enum`):**

     | Kode Event (`notification_type_enum`) | Pemicu | Penerima Notifikasi |
     | :--- | :--- | :--- |
     | `TASK_ASSIGNED` | Task baru ditugaskan ke user | `assignee_id` |
     | `TASK_REASSIGNED` | Kepemilikan task dipindahkan | Assignee baru & assignee lama |
     | `TASK_STATUS_CHANGED` | Perubahan status signifikan atau reschedule deadline task | `assignee_id` / PM proyek |
     | `TASK_SUBMITTED_REVIEW` | Task dipindahkan ke `IN_REVIEW` | `reviewer_id` / PM proyek |
     | `TASK_REVISION_REQUESTED` | Task dipindahkan ke `REVISION` | `assignee_id` |
     | `TASK_COMPLETED` | Task dipindahkan ke `DONE` | Pembuat task / PM proyek |
     | `TASK_COMMENT_MENTION` | `@mention` di komentar task/brief | User yang disebut |
     | `TASK_DEADLINE_SOON` | H-2 (48 jam) sebelum `due_date` | `assignee_id` |
     | `TASK_DEADLINE_TODAY` | Hari-H `due_date` (08:00 WIB) | `assignee_id` |
     | `TASK_OVERDUE` | H+1 & H+3 melewati `due_date` | `assignee_id` & PM proyek |
     | `CONTENT_IDEA_REVIEWED` | Ide konten disetujui/ditolak | Pengusul ide |
     | `CONTENT_READY_TO_PUBLISH` | Konten berpindah ke `READY_TO_PUBLISH` | `creator_id` & PM proyek |
     | `DESIGN_BRIEF_ASSIGNED` | Design Brief ditugaskan | `assigned_designer_id` |
     | `DESIGN_SUBMITTED` | Designer mengirimkan versi karya (`SUBMITTED`) | `reviewer_id` / PM proyek |
     | `DESIGN_REVISION_REQUESTED` | Reviewer meminta revisi desain (`REVISION_REQUESTED`) | `assigned_designer_id` & `creator_id` |
     | `DESIGN_APPROVED` | Desain disetujui (`APPROVED`) | `assigned_designer_id` & `creator_id` |
     | `KPI_EVALUATION_OPEN` | Siklus evaluasi bulanan dibuka (`DRAFT`) | Evaluator (`PROJECT_MANAGER` / `SUPER_ADMIN`) |
     | `KPI_EVALUATION_SUBMITTED` | Evaluasi dikirim untuk review (`SUBMITTED`) | `SUPER_ADMIN` |
     | `KPI_EVALUATION_FINALIZED` | Evaluasi bulanan mencapai `FINALIZED` | Karyawan yang dinilai |
     | `ANNOUNCEMENT_PUBLISHED` | Pengumuman baru dipublikasikan | Seluruh user pada `target_roles` |
     | `SYSTEM_ALERT` | Pemberitahuan sistem penting (perubahan peran, reset akses, peringatan keamanan) | User terkait / `SUPER_ADMIN` |

* **Aturan Bisnis & Validasi:**
  - Sistem **tidak mengirim notifikasi ke diri sendiri** jika pelaku aksi sama dengan penerima (`actor_id != recipient_id`), kecuali pengingat deadline otomatis oleh sistem.
  - Mekanisme *idempotency key* diterapkan pada job pengingat deadline (`/api/cron/deadline-alerts`) agar notifikasi `TASK_DEADLINE_SOON`, `TASK_DEADLINE_TODAY`, dan `TASK_OVERDUE` tidak terkirim ganda pada hari yang sama.
* **Keterhubungan Lintas Modul:** Menjadi saluran umpan balik instan bagi seluruh kejadian bisnis di Modul A, B, C, dan `Announcements` (`FR-D04`).

##### `FR-D04` — Announcements
* **Tujuan:** Menjadi papan pengumuman resmi internal Krevia Digital agar informasi penting dari Leadership dan PM tidak tenggelam di riwayat chat.
* **Aktor & Akses:** `SUPER_ADMIN` dapat mempublikasikan, menyematkan (*pin*), mengedit, dan mengarsipkan pengumuman ke seluruh tim atau peran tertentu; `PROJECT_MANAGER` dapat mempublikasikan pengumuman operasional untuk peran tim (`STAFF_CREATOR`, `DESIGNER`, `PROJECT_MANAGER`); seluruh peran dapat membaca pengumuman yang ditujukan kepada perannya.
* **Spesifikasi Fungsional:**
  1. Formulir pengumuman memuat: `title` (5–150 karakter), `body` (markdown/rich text, 10–5.000 karakter), `priority` (`INFO`, `IMPORTANT`, `URGENT`), `target_roles` (`ALL` atau kombinasi spesifik dari 4 peran), `is_pinned` (boolean; maksimal 3 pengumuman aktif berstatus pinned bersamaan), `published_at`, dan `expires_at` (opsional).
  2. Pengumuman berstatus `is_pinned = true` dan `URGENT`/`IMPORTANT` tampil sebagai banner ringkas di bagian atas Dashboard utama hingga pengguna menandainya sudah dibaca atau melewati `expires_at`.
  3. **Read Receipt (`announcement_reads`):** Sistem mencatat kapan setiap user membaca/mengonfirmasi pengumuman. `SUPER_ADMIN` dan pembuat pengumuman dapat melihat statistik keterbacaan (misal: *"Dibaca oleh 9 dari 12 anggota"* beserta daftar siapa yang belum membaca).
* **Aturan Bisnis & Validasi:**
  - `expires_at` (jika diisi) wajib lebih besar dari `published_at`.
  - Pengumuman yang sudah melewati `expires_at` otomatis berpindah ke tab **Arsip Pengumuman** tanpa dihapus.
* **Keterhubungan Lintas Modul:** Publikasi pengumuman langsung memicu notifikasi `ANNOUNCEMENT_PUBLISHED` (`FR-D03`) dan mencatat `ANNOUNCEMENT_CREATED` pada `Activity Logs` (`FR-D05`).

##### `FR-D05` — Activity Logs (Audit Trail)
* **Tujuan:** Menyediakan rekam jejak forensik yang tidak dapat diubah (*immutable audit trail*) untuk setiap perubahan data penting demi tata kelola operasional dan akuntabilitas tim.
* **Aktor & Akses:** `SUPER_ADMIN` dapat mengakses dan menyaring seluruh log audit sistem; `PROJECT_MANAGER` hanya dapat melihat log aktivitas yang berkaitan dengan proyek dan anggota tim yang ia kelola; `STAFF_CREATOR` dan `DESIGNER` tidak memiliki akses ke halaman Audit Log global (hanya melihat timeline aktivitas di dalam detail task/brief miliknya).
* **Spesifikasi Fungsional:**
  1. Setiap aksi mutasi penting (Create, Update, Status Change, Reassign, Approve, Request Revision, Finalize/Re-open KPI, Export Report, Login/Failed Login, User Deactivation, Role Change) secara otomatis merekam baris log berisi: `id`, `created_at` (`TIMESTAMPTZ`), `actor_id` (atau `NULL` untuk aksi sistem/cron job), `module` (`TASKS`, `TEAM_KPI`, `SOCIAL_DESIGN`, `SYSTEM`), `action` (contoh: `TASK_STATUS_CHANGED`, `DESIGN_APPROVED`, `KPI_FINALIZED`, `USER_ROLE_UPDATED`), `entity_type`, `entity_id`, `summary` (kalimat ringkas terbaca manusia), `old_values` (`JSONB`), `new_values` (`JSONB`), `ip_address`, dan `user_agent`.
  2. Halaman Audit Trail menyediakan filter berdasarkan Rentang Tanggal, Aktor (User), Modul, Jenis Aksi, Entity ID, serta tampilan *diff viewer* yang menyoroti perbedaan `old_values` vs `new_values`.
  3. Fitur ekspor log tersaring ke format CSV bagi `SUPER_ADMIN`.
* **Aturan Bisnis & Validasi:**
  - **Strict Immutability:** Tidak tersedia operasi `UPDATE` maupun `DELETE` pada tabel `activity_logs` di lapisan aplikasi.
  - **Sanitasi Data Sensitif:** Field sensitif seperti `password_hash`, token sesi, atau kata sandi sementara **dilarang keras** masuk ke kolom `old_values`/`new_values` (wajib di-masking sebelum penulisan log).
  - Penulisan audit log dilakukan dalam transaksi database yang sama (atau mekanisme *transactional outbox* / atomic Prisma transaction) dengan mutasi utamanya sehingga tidak ada mutasi penting yang lolos tanpa jejak audit.
* **Keterhubungan Lintas Modul:** Merekam peristiwa dari seluruh sub-fitur Modul A, B, C, dan D secara menyeluruh.

---

#### 2.5 Spesifikasi Integrasi Lintas Modul (`FR-INT-01` – `FR-INT-04`)

Salah satu kekuatan utama KTMS dibanding alat terpisah adalah **sinkronisasi data lintas modul secara otomatis** tanpa input ganda. Aturan berikut bersifat wajib bagi implementasi backend:

| ID | Nama Aturan Integrasi | Pemicu (*Source Event*) | Efek Otomatis (*Target Side-Effect*) | Aturan Pencegahan Konflik |
| :--- | :--- | :--- | :--- | :--- |
| `FR-INT-01` | **Content Plan $\rightarrow$ Unified Task (`CONTENT_PRODUCTION`)** | `content_items` masuk status `PLANNING` dengan `creator_id` & `planned_publish_at` terisi. | Membuat 1 baris di tabel `tasks` dengan `task_type = 'CONTENT_PRODUCTION'`, `content_item_id = content.id`, `assignee_id = creator_id`, `due_date = planned_publish_at - 1 hari` (default), status `TODO`. Ketika `content_items` mencapai `SCHEDULED` atau `PUBLISHED`, linked task otomatis pindah ke `DONE` (`completed_at = NOW()`). | Relasi `1:1` per jenis task (`UNIQUE(content_item_id, task_type)` untuk task aktif) mencegah duplikasi kartu jika content plan diedit ulang. |
| `FR-INT-02` | **Design Brief $\rightarrow$ Unified Task (`DESIGN_TASK`) & Bidirectional Status Sync** | `design_briefs` ditugaskan ke `assigned_designer_id` (status `PENDING_BRIEF`/`IN_PROGRESS`). | Membuat 1 baris di tabel `tasks` dengan `task_type = 'DESIGN_TASK'`, `design_brief_id = brief.id`, `content_item_id = brief.content_item_id`, `assignee_id = assigned_designer_id`, `due_date = design_due_date`, `requires_review = true`. Pemetaan status sinkron 2 arah:<br>• Brief `IN_PROGRESS` $\leftrightarrow$ Task `IN_PROGRESS` & Content `IN_DESIGN`<br>• Submission `SUBMITTED` $\leftrightarrow$ Task `IN_REVIEW` & Content `DESIGN_REVIEW`<br>• Review `REVISION_REQUESTED` $\leftrightarrow$ Task `REVISION` & Content `DESIGN_REVISION` (serta `revision_count + 1`)<br>• Review `APPROVED` $\leftrightarrow$ Task `DONE` & Content `READY_TO_PUBLISH` | Seluruh sinkronisasi dijalankan dalam **satu Prisma Database Transaction (`$transaction`)** agar status Task, Design Brief, dan Content Item tidak pernah tidak konsisten (*no partial state*). |
| `FR-INT-03` | **Design Approval $\rightarrow$ Asset Library Auto-Promotion** | `design_submissions` disetujui (`APPROVED`) pada `FR-C05`. | Otomatis membuat entri di `assets` untuk setiap file/link pada versi submission yang disetujui, mewarisi metadata `project_id`, `content_item_id`, `design_brief_id`, `uploaded_by = designer_id`, dan tag otomatis (platform + format). | Jika desain sempat dibuka kembali lalu di-approve versi lebih baru (`v3`), aset versi sebelumnya ditandai `is_superseded = true` dan aset terbaru menjadi versi aktif utama. |
| `FR-INT-04` | **Unified Tasks & Design Reviews $\rightarrow$ Individual Performance & Monthly KPI** | Task pindah ke `DONE` / `REVISION` atau Design Brief pindah ke `APPROVED` / `REVISION_REQUESTED`. | Tidak membutuhkan entri manual di Modul B: query agregasi `Individual Performance` (`FR-B02`) membaca langsung `tasks` (`GENERAL`, `CONTENT_PRODUCTION`, `DESIGN_TASK`), `design_briefs` (`revision_count`), dan `content_items` (`SCHEDULED`/`PUBLISHED`). Saat `Monthly Evaluation` difinalisasi (`FINALIZED`), seluruh angka di-snapshot ke `evaluation_items`. | Snapshot immutability menjamin pengeditan task lama pasca penutupan bulan **tidak merusak** nilai rapor KPI bulan yang telah `FINALIZED`. |

---

#### 2.6 Non-Functional Requirements (`NFR-01` – `NFR-15`)

| ID | Kategori | Spesifikasi Target Terukur | Mekanisme Verifikasi / Implementasi |
| :--- | :--- | :--- | :--- |
| `NFR-01` | **Performance — Frontend Rendering** | *Largest Contentful Paint* (LCP) $\le 2.5$ detik dan *Time to Interactive* (TTI) $\le 3.0$ detik pada koneksi broadband kantor standar (20 Mbps) untuk halaman Dashboard, Kanban Board, dan Content Calendar. | React Server Components (RSC) untuk data fetch awal, pagination/virtualization tabel besar, optimasi gambar `next/image`. |
| `NFR-02` | **Performance — Backend Latency** | Waktu respons p95 untuk Server Actions & Route Handlers `/api/**` $\le 400\text{ ms}$ untuk operasi CRUD standar dan $\le 1.200\text{ ms}$ untuk query agregasi Dashboard KPI / Export CSV (dengan volume data hingga 50.000 baris task). | Composite B-Tree index pada PostgreSQL (`assignee_id, due_date, status`), selective column projection, menghindari N+1 query di Prisma. |
| `NFR-03` | **Performance — Interactive UX** | Interaksi *drag-and-drop* Kanban Board dan centang checklist memberikan respons visual *optimistic update* dalam $\le 100\text{ ms}$, dengan *automatic rollback* + toast error jika server menolak mutasi. | Optimistic state management di Client Component + validasi transaksi di Server Action. |
| `NFR-04` | **Scalability — Internal Concurrency** | Mendukung minimal **50 pengguna internal aktif bersamaan** (*concurrent active users*) tanpa degradasi respons $> 10\%$, dan siap diskalakan hingga 200 pengguna tanpa perubahan arsitektur inti. | Connection pooling PostgreSQL (PgBouncer / Supabase Pooler) dan arsitektur stateless Next.js. |
| `NFR-05` | **Security — Authentication & Password** | Password wajib di-hash menggunakan **Argon2id** atau **Bcrypt (cost factor $\ge 12$)**. Sesi Auth.js v5 menggunakan cookie `HttpOnly`, `Secure`, `SameSite=Lax`, dengan durasi sesi maksimal 7 hari (*sliding expiration*) dan dukungan *instant session revocation* via `token_version` saat akun dinonaktifkan atau role diubah. | Uji inspeksi DB (tidak ada plaintext), header Set-Cookie inspection, uji login pasca deaktivasi user. |
| `NFR-06` | **Security — Brute Force & Rate Limiting** | Endpoint autentikasi login menerapkan batas percobaan maksimal **5 kali gagal per 15 menit** per kombinasi `(email, IP)` dengan pesan error generik (*"Email atau kata sandi tidak valid"*) untuk mencegah enumerasi akun. | Middleware/rate-limiter pada Auth route + logging failed login di `activity_logs`. |
| `NFR-07` | **Security — Authorization (RBAC)** | **100%** endpoint API dan Server Actions mutasi serta query data sensitif wajib melalui server-side RBAC Guard (`requirePermission` + ownership check). Tidak diperbolehkan mengandalkan penyembunyian elemen UI semata. | Automated security test / checklist pengujian RBAC lintas 4 peran (HTTP `401`/`403` pada akses tidak sah). |
| `NFR-08` | **Security — Input, XSS, CSRF & SQLi** | Seluruh input divalidasi dengan skema **Zod** di sisi server. Seluruh query database menggunakan parameterized query Prisma ORM (nol raw SQL tanpa parameterisasi). Output teks bebas/markdown disanitasi untuk mencegah Stored XSS. | Code review & static analysis; pengujian payload XSS/SQLi pada kolom judul, komentar, dan catatan revisi. |
| `NFR-09` | **Security — File Upload Hygiene** | Upload file ke Object Storage menggunakan **presigned PUT URL** berbatas waktu (TTL **300 detik / 5 menit**), validasi server-side terhadap whitelist MIME type Design/Asset (`image/png`, `image/jpeg`, `image/webp`, `image/svg+xml` sebagai unduhan attachment, `application/pdf`, `video/mp4` preview pendek) dengan batas ukuran keras **25 MB/file** (Avatar maksimal **2 MB**; file $> 25\text{ MB}$ wajib menggunakan External Link), serta nama objek acak (UUID) untuk mencegah *path traversal*. | Pengujian upload file `.exe`/`.html`/file 30 MB wajib ditolak dengan HTTP `400`/`413`. |
| `NFR-10` | **Usability — Responsive Desktop-First** | Tata letak dioptimalkan untuk layar desktop kerja (`1280x720` hingga `2560x1440`) dengan sidebar yang dapat diciutkan (*collapsible sidebar*), serta tetap fungsional dan bebas *horizontal overflow* rusak pada tablet/mobile (`768px` dan `390px`) untuk pembacaan tugas, kalender, dan approval cepat. | Pengujian viewport Chromium pada resolusi `1920px`, `1440px`, `1280px`, `768px`, dan `390px`. |
| `NFR-11` | **Usability — Productivity & Accessibility** | Memenuhi rasio kontras warna minimal **WCAG 2.1 Level AA** ($\ge 4.5:1$ untuk teks normal). Menyediakan *empty state* yang informatif, *loading skeleton*, *toast feedback* jelas dalam Bahasa Indonesia, dan persistensi filter di URL query string. | Audit Lighthouse Accessibility $\ge 90$ pada halaman utama; pengujian navigasi keyboard (Tab, Enter, Escape tutup modal/drawer). |
| `NFR-12` | **Reliability — Uptime & Health Check** | Target ketersediaan sistem produksi minimal **99.5%** selama jam operasional (Senin–Sabtu, 08:00–20:00 WIB). Menyediakan endpoint `/api/health` yang memeriksa konektivitas aplikasi dan PostgreSQL. | Uptime monitor eksternal memeriksa `/api/health` setiap 5 menit. |
| `NFR-13` | **Reliability — Backup & Disaster Recovery** | Backup otomatis database PostgreSQL berjalan **setiap hari (daily automated backup)** dengan retensi minimal 14 hari (dan 30 hari untuk backup mingguan). Target **RPO $\le 24$ jam** dan **RTO $\le 4$ jam**. | Jadwal automated backup PostgreSQL/Supabase + uji restore minimal 1 kali sebelum Go-Live Hari ke-14. |
| `NFR-14` | **Maintainability — Codebase & Schema Discipline** | Proyek menggunakan TypeScript `strict: true`, ESLint + Prettier terkonfigurasi, pemisahan lapisan yang jelas (`UI -> Server Actions/API -> Service Layer -> Prisma`), serta seluruh perubahan skema DB dilakukan eksklusif melalui Prisma Migrations yang tercatat di Git. | Pipeline check (`npm run lint`, `npm run typecheck`, `npm run build`) wajib hijau sebelum merge ke branch utama. |
| `NFR-15` | **Observability — Structured Error Logging** | Seluruh unhandled error pada server dicatat dalam format log terstruktur (timestamp, request ID, user ID, route/action, error code, stack trace) tanpa membocorkan stack trace mentah ke respons klien. | Central error handler pada Route Handlers & Server Actions + React Error Boundary pada App Router. |

---
### 3. User Stories & Acceptance Criteria (Given-When-Then)

Bagian ini merinci **24 User Stories utama** yang mencakup seluruh 4 modul dan seluruh 4 peran kanonik (`SUPER_ADMIN`, `PROJECT_MANAGER`, `STAFF_CREATOR`, `DESIGNER`). Setiap kriteria penerimaan (*Acceptance Criteria*) disusun dalam format **Given / When / Then** agar langsung dapat dijadikan skenario pengujian UAT dan *integration testing* oleh tim pengembang.

---

#### 3.1 User Stories Modul A — Task Management

##### `US-A01` — Pembuatan Proyek & Pengaturan Anggota Tim
* **Peran:** `PROJECT_MANAGER` | **Modul:** A | **FR Terkait:** `FR-A01` | **Prioritas:** Must-Have (V1)
* **Cerita:** Sebagai `PROJECT_MANAGER`, saya ingin membuat proyek baru beserta kode unik, rentang tanggal, dan daftar anggota proyek, agar seluruh tugas kampanye maupun operasional internal terkelompok secara rapi.
* **Acceptance Criteria:**
  1. **Skenario Sukses — Buat Proyek Baru:**
     - **Given** pengguna login sebagai `PROJECT_MANAGER` di halaman Projects,
     - **When** pengguna mengisi `code = "KRV-Q4"`, `name = "Kampanye Q4 Krevia"`, `start_date = 2026-10-01`, `target_end_date = 2026-12-31`, memilih 3 anggota tim aktif, lalu menekan **Simpan Proyek**,
     - **Then** proyek tersimpan dengan status `ACTIVE`, muncul di daftar proyek anggota terkait, dan 1 baris log `PROJECT_CREATED` tercatat di `activity_logs`.
  2. **Skenario Validasi — Tanggal & Kode Duplikat:**
     - **Given** kode proyek `KRV-Q4` sudah terdaftar di database,
     - **When** pengguna mencoba membuat proyek lain dengan `code = "KRV-Q4"` atau `target_end_date < start_date`,
     - **Then** sistem menolak penyimpanan dengan pesan validasi spesifik pada field terkait dan tidak membuat record baru.
  3. **Skenario Akses — Penolakan Role Non-PM:**
     - **Given** pengguna login sebagai `STAFF_CREATOR` atau `DESIGNER`,
     - **When** pengguna mengakses halaman Projects atau mengirim request pembuatan proyek secara langsung ke Server Action,
     - **Then** tombol *Buat Proyek* tidak ditampilkan di UI dan server mengembalikan error `403 Forbidden`.

##### `US-A02` — Penugasan & Reassignment Task dengan Indikator Beban Kerja
* **Peran:** `PROJECT_MANAGER` | **Modul:** A | **FR Terkait:** `FR-A05`, `FR-D03` | **Prioritas:** Must-Have (V1)
* **Cerita:** Sebagai `PROJECT_MANAGER`, saya ingin menugaskan dan mengalihkan (*reassign*) tugas sambil melihat jumlah beban tugas aktif tiap anggota, agar distribusi pekerjaan seimbang dan akuntabel.
* **Acceptance Criteria:**
  1. **Skenario Sukses — Delegasi Task dengan Workload Hint:**
     - **Given** pengguna login sebagai `PROJECT_MANAGER` membuka modal *Buat Task* di proyek `KRV-OPS`,
     - **When** pengguna membuka dropdown Assignee, melihat ringkasan beban aktif (*misal: "Nta — 3 aktif, 0 overdue"*), memilih `assignee_id`, `priority = HIGH`, `due_date`, lalu menyimpan dengan status `TODO`,
     - **Then** task tersimpan di proyek tersebut, muncul langsung di halaman `My Tasks` milik assignee, dan assignee menerima notifikasi in-app `TASK_ASSIGNED`.
  2. **Skenario Sukses — Reassignment Task:**
     - **Given** sebuah task berstatus `IN_PROGRESS` saat ini dimiliki oleh User A,
     - **When** `PROJECT_MANAGER` mengubah `assignee_id` menjadi User B dengan catatan alasan pengalihan,
     - **Then** kepemilikan task berpindah ke User B, baik User A maupun User B menerima notifikasi `TASK_REASSIGNED`, dan `activity_logs` menyimpan `old_values.assignee_id = User A` serta `new_values.assignee_id = User B`.
  3. **Skenario Edge — User Non-Aktif Tidak Dapat Ditugaskan:**
     - **Given** akun User C berstatus `is_active = false`,
     - **When** `PROJECT_MANAGER` membuka dropdown Assignee atau mencoba mengirim `assignee_id = User C` via API,
     - **Then** User C tidak tampil di pilihan dropdown dan server menolak mutasi dengan pesan *"Assignee harus merupakan pengguna aktif"*.

##### `US-A03` — Eksekusi Tugas Harian, Checklist & Komentar di My Tasks
* **Peran:** `STAFF_CREATOR` | **Modul:** A | **FR Terkait:** `FR-A02`, `FR-A06` | **Prioritas:** Must-Have (V1)
* **Cerita:** Sebagai `STAFF_CREATOR`, saya ingin melihat daftar tugas pribadi yang dikelompokkan berdasarkan urgensi waktu, mencentang checklist, dan berdiskusi di komentar, agar saya dapat fokus menyelesaikan prioritas hari ini tanpa melewatkan detail.
* **Acceptance Criteria:**
  1. **Skenario Sukses — Pengelompokan Urgensi My Tasks:**
     - **Given** `STAFF_CREATOR` memiliki 1 task terlambat (kemarin), 2 task jatuh tempo hari ini, dan 3 task jatuh tempo 4 hari lagi,
     - **When** pengguna membuka halaman `My Tasks`,
     - **Then** sistem menampilkan 1 task di grup **Overdue** (badge merah), 2 task di grup **Due Today** (badge kuning), dan 3 task di grup **Upcoming (7 Hari)** secara akurat dalam zona waktu WIB.
  2. **Skenario Sukses — Checklist & Mention Komentar:**
     - **Given** pengguna membuka *slide-over drawer* detail task yang memiliki 4 item checklist,
     - **When** pengguna mencentang 2 item checklist dan mengirim komentar `"@Yoga mohon cek naskah slide 3"`,
     - **Then** progres checklist langsung berubah menjadi `2/4 (50%)` tanpa reload halaman penuh, komentar tersimpan dengan timestamp WIB, dan user `Yoga` menerima notifikasi `TASK_COMMENT_MENTION`.

##### `US-A04` — Pengelolaan Alur Kerja Kanban Board & Kontrol Review/Revisi
* **Peran:** `DESIGNER` & `PROJECT_MANAGER` | **Modul:** A | **FR Terkait:** `FR-A03` | **Prioritas:** Must-Have (V1)
* **Cerita:** Sebagai `DESIGNER`, saya ingin memindahkan kartu tugas saya pada Kanban Board ke tahap review, dan sebagai `PROJECT_MANAGER` saya ingin menyetujui atau meminta revisi dengan alasan tercatat, agar alur kerja tim terkendali.
* **Acceptance Criteria:**
  1. **Skenario Sukses — Submit Review oleh Assignee:**
     - **Given** `DESIGNER` memiliki task bertipe `DESIGN_TASK` di kolom `IN_PROGRESS`,
     - **When** `DESIGNER` menyeret (*drag-and-drop*) kartu ke kolom `IN_REVIEW`,
     - **Then** status kartu berubah ke `IN_REVIEW` secara optimistik, server mencatat `first_submitted_at` (jika belum terisi), dan `reviewer_id` menerima notifikasi `TASK_SUBMITTED_REVIEW`.
  2. **Skenario Validasi — Assignee Dilarang Bypass Review ke DONE:**
     - **Given** task memiliki `requires_review = true` (atau `task_type = DESIGN_TASK`),
     - **When** `DESIGNER` mencoba menyeret kartu langsung dari `IN_PROGRESS` atau `IN_REVIEW` ke kolom `DONE`,
     - **Then** kartu kembali (*rollback*) ke posisi semula, toast error tampil (*"Task ini memerlukan persetujuan Project Manager sebelum berstatus DONE"*), dan server mengembalikan `403 Forbidden`.
  3. **Skenario Sukses — Permintaan Revisi Wajib Catatan:**
     - **Given** `PROJECT_MANAGER` menyeret kartu dari `IN_REVIEW` ke `REVISION`,
     - **When** modal catatan revisi muncul dan PM mengisi catatan minimal 10 karakter lalu mengonfirmasi,
     - **Then** status task berubah menjadi `REVISION`, nilai `revision_count` bertambah `+1`, catatan tersimpan di histori komentar/revisi, dan assignee menerima notifikasi `TASK_REVISION_REQUESTED`.

##### `US-A05` — Pemantauan Jadwal Kerja & Penjadwalan Ulang di Work Calendar
* **Peran:** `PROJECT_MANAGER` | **Modul:** A | **FR Terkait:** `FR-A04` | **Prioritas:** Must-Have (V1)
* **Cerita:** Sebagai `PROJECT_MANAGER`, saya ingin melihat seluruh tenggat tugas dan jadwal tayang konten dalam satu kalender kerja bulanan/mingguan serta menjadwal ulang tugas yang menumpuk, agar beban tim tetap realistis.
* **Acceptance Criteria:**
  1. **Skenario Sukses — Tampilan Terpadu & Filter Kalender:**
     - **Given** terdapat task bertipe `GENERAL`, `CONTENT_PRODUCTION`, `DESIGN_TASK`, dan jadwal publikasi `Content Calendar` pada bulan berjalan,
     - **When** `PROJECT_MANAGER` membuka `Work Calendar` mode Bulanan dan memfilter berdasarkan proyek tertentu,
     - **Then** seluruh item bertenggat tampil dengan pembedaan warna kategori yang jelas dan klik item membuka *slide-over drawer* detail.
  2. **Skenario Sukses — Reschedule Tenggat dari Kalender (Modal/Drawer Edit V1):**
     - **Given** `PROJECT_MANAGER` melihat 5 task bertumpuk pada hari Jumat di `Work Calendar` (`/tasks/calendar`),
     - **When** PM mengklik salah satu task untuk membuka *slide-over drawer* / modal edit tanggal lalu mengubah `due_date` ke hari Senin berikutnya dan menyimpan (catatan: *drag-and-drop* langsung di grid kalender dijadwalkan untuk V1.1 per `MOS-20`),
     - **Then** `due_date` task diperbarui di database, `activity_logs` merekam perubahan tanggal lama vs baru, dan assignee menerima notifikasi `TASK_STATUS_CHANGED` terkait pembaruan tenggat.

##### `US-A06` — Pengingat Tenggat Otomatis & Proteksi Integritas Deadline
* **Peran:** `PROJECT_MANAGER` & `STAFF_CREATOR` | **Modul:** A | **FR Terkait:** `FR-A07`, `FR-D03` | **Prioritas:** Must-Have (V1)
* **Cerita:** Sebagai `PROJECT_MANAGER`, saya ingin sistem mengingatkan anggota tim sebelum tenggat tiba, mengeskalasi keterlambatan ke saya, dan mencegah anggota mengubah tenggat sendiri tanpa izin, agar metrik ketepatan waktu (`OTDR`) tetap objektif.
* **Acceptance Criteria:**
  1. **Skenario Sukses — Trigger Reminder H-2 & Eskalasi Overdue H+1:**
     - **Given** Task X memiliki `due_date` 2 hari lagi dan Task Y sudah melewati `due_date` 1 hari dengan status masih `IN_PROGRESS`,
     - **When** cron pengingat harian berjalan pada pukul 08:00 WIB,
     - **Then** assignee Task X menerima tepat 1 notifikasi `TASK_DEADLINE_SOON`, sedangkan assignee Task Y DAN PM proyek menerima tepat 1 notifikasi `TASK_OVERDUE` (idempoten, tidak duplikat jika job dijalankan ulang di hari yang sama).
  2. **Skenario Validasi — Larangan Self-Extension Deadline:**
     - **Given** `STAFF_CREATOR` membuka detail task yang ditugaskan oleh `PROJECT_MANAGER`,
     - **When** `STAFF_CREATOR` mencoba mengubah field `due_date` (baik lewat UI maupun memanggil Server Action langsung),
     - **Then** input tanggal bersifat *read-only* di UI dan server menolak mutasi dengan status `403 Forbidden`.

---

#### 3.2 User Stories Modul B — Team Management & KPI

##### `US-B01` — Pencarian Anggota Tim di Team Directory
* **Peran:** `STAFF_CREATOR` | **Modul:** B | **FR Terkait:** `FR-B01` | **Prioritas:** Must-Have (V1)
* **Cerita:** Sebagai `STAFF_CREATOR`, saya ingin mencari anggota tim berdasarkan divisi atau peran di Team Directory, agar saya tahu siapa desainer atau PM yang tepat untuk berkolaborasi pada proyek.
* **Acceptance Criteria:**
  1. **Skenario Sukses — Filter & Pencarian Direktori:**
     - **Given** pengguna login sebagai `STAFF_CREATOR` di halaman `Team Directory`,
     - **When** pengguna memfilter berdasarkan Role = `DESIGNER`,
     - **Then** daftar hanya menampilkan anggota aktif dengan peran `DESIGNER` beserta nama, jabatan, divisi, dan email kantor, tanpa menampilkan data sensitif evaluasi KPI orang lain.
  2. **Skenario Privasi — Pembatasan Data Performa Orang Lain:**
     - **Given** `STAFF_CREATOR` mengklik profil anggota tim lain,
     - **When** halaman profil dimuat,
     - **Then** hanya informasi direktori & proyek bersama yang tampil; tab skor KPI & evaluasi bulanan milik anggota lain tidak dapat diakses (`403 Forbidden` jika diakses via URL langsung).

##### `US-B02` — Pemantauan Individual Performance & Transparansi Rumus Otomatis
* **Peran:** `DESIGNER` | **Modul:** B | **FR Terkait:** `FR-B02`, `FR-INT-04` | **Prioritas:** Must-Have (V1)
* **Cerita:** Sebagai `DESIGNER`, saya ingin memantau angka `TCR`, `OTDR`, dan `DQS` pribadi saya secara real-time beserta daftar tugas dan desain pembentuknya, agar saya dapat memperbaiki performa sebelum evaluasi akhir bulan.
* **Acceptance Criteria:**
  1. **Skenario Sukses — Kalkulasi Akurat Metrik Designer:**
     - **Given** pada bulan `2026-10`, `DESIGNER` memiliki 10 task aktif/selesai (bukan `CANCELLED`) di mana 8 task berstatus `DONE` (7 tepat waktu, 1 terlambat) serta 2 `design_briefs` berstatus `APPROVED` dengan masing-masing `revision_count = 0` (skor 100) dan `revision_count = 2` (skor 70),
     - **When** `DESIGNER` membuka halaman **My Performance** untuk periode `2026-10`,
     - **Then** sistem menampilkan `TCR = 80.00%`, `OTDR = 87.50%`, `DQS = 85.00`, `First-Pass Approval Rate = 50.00%`, beserta tabel rincian 10 task dan 2 desain tersebut.
  2. **Skenario Edge — Tidak Ada Task pada Periode Terpilih:**
     - **Given** anggota baru bergabung dan belum memiliki task bertenggat pada bulan `2026-10` ($T_{\text{assigned}} = 0$),
     - **When** halaman **My Performance** dibuka,
     - **Then** sistem menampilkan label `N/A (Belum ada tugas bertenggat)` alih-alih `0%` atau error pembagian nol (`NaN`).

##### `US-B03` — Pengelolaan Template & Penetapan Bobot KPI Bulanan
* **Peran:** `SUPER_ADMIN` | **Modul:** B | **FR Terkait:** `FR-B03` | **Prioritas:** Must-Have (V1)
* **Cerita:** Sebagai `SUPER_ADMIN`, saya ingin menyusun template KPI per peran dan menyalin penugasan KPI ke periode bulan baru dengan validasi bobot ketat 100%, agar standar evaluasi Krevia Digital konsisten setiap bulan.
* **Acceptance Criteria:**
  1. **Skenario Validasi — Penolakan Total Bobot Tidak Sama dengan 100%:**
     - **Given** `SUPER_ADMIN` sedang mengatur `kpi_assignments` untuk seorang `STAFF_CREATOR` pada periode `2026-11`,
     - **When** total bobot indikator yang dimasukkan berjumlah `95%` atau `110%` lalu menekan **Simpan**,
     - **Then** sistem menolak penyimpanan dan menampilkan pesan *"Total bobot seluruh indikator KPI wajib tepat 100% (saat ini: 95%)"*.
  2. **Skenario Sukses — Clone KPI dari Bulan Sebelumnya:**
     - **Given** seluruh anggota tim sudah memiliki `kpi_assignments` pada periode `2026-10`,
     - **When** `SUPER_ADMIN` memilih periode `2026-11` dan menekan **Salin Assignment dari Bulan Sebelumnya**,
     - **Then** sistem otomatis membuat paket KPI periode `2026-11` untuk seluruh anggota aktif sesuai bobot bulan `2026-10` tanpa menimpa anggota yang sudah memiliki konfigurasi `2026-11`.

##### `US-B04` — Analisis Team Performance Dashboard & Deteksi Bottleneck
* **Peran:** `SUPER_ADMIN` | **Modul:** B | **FR Terkait:** `FR-B04` | **Prioritas:** Must-Have (V1)
* **Cerita:** Sebagai `SUPER_ADMIN`, saya ingin memantau perbandingan performa seluruh anggota tim, tren 6 bulan, serta distribusi beban kerja aktif dalam satu dashboard eksekutif, agar saya bisa mengambil keputusan strategis berbasis data.
* **Acceptance Criteria:**
  1. **Skenario Sukses — Agregasi Dashboard Tim:**
     - **Given** `SUPER_ADMIN` membuka `Team Performance Dashboard` untuk periode `2026-10`,
     - **When** halaman selesai dimuat,
     - **Then** tampil kartu ringkasan (`Rata-rata TCR Tim`, `Rata-rata OTDR Tim`, `Total Task Selesai vs Overdue`, `Rata-rata DQS`), grafik bar *Workload Distribution* per anggota, grafik tren 6 bulan, dan tabel leaderboard yang dapat diurutkan.
  2. **Skenario Keamanan — Akses Terbatas Leadership & PM:**
     - **Given** pengguna login sebagai `STAFF_CREATOR` atau `DESIGNER`,
     - **When** pengguna mencoba membuka URL `/kpi/dashboard`,
     - **Then** sistem mengalihkan atau menampilkan halaman `403 Forbidden` dan API terkait tidak mengembalikan data performa anggota lain.

##### `US-B05` — Siklus Evaluasi Bulanan (DRAFT hingga FINALIZED Immutable Snapshot)
* **Peran:** `PROJECT_MANAGER` & `SUPER_ADMIN` | **Modul:** B | **FR Terkait:** `FR-B05`, `FR-INT-04` | **Prioritas:** Must-Have (V1)
* **Cerita:** Sebagai `PROJECT_MANAGER`, saya ingin mengisi penilaian kualitatif pada evaluasi bulanan yang sudah memuat metrik otomatis sistem lalu mengajukannya, dan sebagai `SUPER_ADMIN` saya ingin meninjau serta memfinalisasi skor tersebut agar terkunci permanen.
* **Acceptance Criteria:**
  1. **Skenario Sukses — Pengisian & Submit Evaluasi oleh PM:**
     - **Given** dokumen evaluasi `STAFF_CREATOR` periode `2026-10` berstatus `DRAFT` dengan 3 metrik otomatis (`TCR`, `OTDR`, `CPVS` — read-only) dan 1 metrik manual (bobot 25%),
     - **When** `PROJECT_MANAGER` menginput skor manual `88`, menulis `evaluator_notes` sepanjang 50 karakter, dan menekan **Submit for Review**,
     - **Then** status berubah menjadi `SUBMITTED`, sistem menghitung `Weighted KPI Score` & Grade secara otomatis, dan `SUPER_ADMIN` menerima notifikasi `KPI_EVALUATION_SUBMITTED` untuk meninjau evaluasi.
  2. **Skenario Sukses — Finalisasi & Snapshot Immutability:**
     - **Given** `SUPER_ADMIN` meninjau evaluasi berstatus `SUBMITTED`, mengubah ke `REVIEWED`, lalu menekan **Finalize Evaluation**,
     - **When** setelah `FINALIZED`, sebuah task bulan `2026-10` milik karyawan tersebut diubah statusnya di bulan `2026-11`,
     - **Then** status evaluasi tetap `FINALIZED`, seluruh nilai pada rapor `2026-10` **tidak berubah sedikit pun** karena membaca snapshot final, dan karyawan menerima notifikasi `KPI_EVALUATION_FINALIZED`.
  3. **Skenario Validasi — Larangan Self-Evaluation & Weight Re-Normalization:**
     - **Given** `PROJECT_MANAGER` membuka halaman evaluasi periode `2026-10`,
     - **When** PM mencoba menilai dirinya sendiri, sistem memblokir aksi input evaluasi diri; dan jika pada evaluasi anggota baru salah satu indikator otomatis bernilai `N/A` (bobot 25%),
     - **Then** sistem menormalisasi pembagi bobot menjadi `75%` sehingga `Weighted KPI Score` tetap berada pada skala `0.00 – 100.00` secara adil.

##### `US-B06` — Ekspor Rapor KPI Bulanan (PDF) & Rekap Tim (CSV/XLSX)
* **Peran:** `SUPER_ADMIN` & `DESIGNER` | **Modul:** B | **FR Terkait:** `FR-B06`, `FR-D05` | **Prioritas:** Must-Have (V1)
* **Cerita:** Sebagai `SUPER_ADMIN`, saya ingin mengekspor rekap performa seluruh tim ke CSV/XLSX untuk rapat bulanan, dan sebagai `DESIGNER` saya ingin mengunduh rapor KPI pribadi saya yang sudah final dalam format PDF.
* **Acceptance Criteria:**
  1. **Skenario Sukses — Ekspor Tim oleh Leadership:**
     - **Given** `SUPER_ADMIN` berada di halaman `Reports & Analytics` memilih periode `2026-10`,
     - **When** pengguna menekan **Export Team Summary (CSV)**,
     - **Then** browser mengunduh file `.csv` UTF-8 valid berisi seluruh anggota tim beserta metrik `TCR`, `OTDR`, `DQS/CPVS`, `Weighted KPI Score`, dan `Grade`, serta 1 entri `REPORT_EXPORTED` tercatat di `activity_logs`.
  2. **Skenario Sukses — Unduh Rapor Pribadi Final oleh Karyawan:**
     - **Given** evaluasi bulanan `DESIGNER` periode `2026-10` sudah berstatus `FINALIZED`,
     - **When** `DESIGNER` menekan **Unduh Rapor PDF**,
     - **Then** sistem menghasilkan file PDF rapi berlogo Krevia Digital berisi rincian skor & catatan evaluator; jika evaluasi masih `DRAFT` atau `SUBMITTED`, tombol unduh belum tersedia bagi karyawan.

---

#### 3.3 User Stories Modul C — Social Media & Design Management

##### `US-C01` — Pengelolaan Jadwal Konten Terpadu di Content Calendar
* **Peran:** `STAFF_CREATOR` | **Modul:** C | **FR Terkait:** `FR-C01` | **Prioritas:** Must-Have (V1)
* **Cerita:** Sebagai `STAFF_CREATOR`, saya ingin melihat, memfilter, dan menjadwal ulang seluruh konten media sosial dalam tampilan Kalender dan Tabel Editorial, agar saya tidak lagi membutuhkan spreadsheet terpisah.
* **Acceptance Criteria:**
  1. **Skenario Sukses — Multi-View & Filter Content Calendar:**
     - **Given** terdapat 20 `content_items` di berbagai platform (`INSTAGRAM`, `TIKTOK`, `LINKEDIN`) pada bulan berjalan,
     - **When** `STAFF_CREATOR` membuka `Content Calendar`, beralih antara tampilan **Calendar Grid** dan **Editorial Table View**, lalu memfilter `Platform = INSTAGRAM` dan `Status = IN_DESIGN`,
     - **Then** hanya konten Instagram yang sedang tahap desain yang ditampilkan lengkap dengan judul, format, PIC Designer, dan tanggal jadwal tayang.
  2. **Skenario Validasi — Proteksi Jadwal Konten Sudah Terbit:**
     - **Given** sebuah `content_items` sudah berstatus `PUBLISHED`,
     - **When** `STAFF_CREATOR` mencoba mengubah `planned_publish_at` melalui modal/drawer edit tanggal di kalender,
     - **Then** sistem mencegah perubahan dan menampilkan pesan *"Konten berstatus PUBLISHED hanya dapat dikoreksi tanggalnya oleh Project Manager atau Super Admin"*.

##### `US-C02` — Pengajuan & Persetujuan Bank Ide Konten
* **Peran:** `STAFF_CREATOR` & `PROJECT_MANAGER` | **Modul:** C | **FR Terkait:** `FR-C02` | **Prioritas:** Must-Have (V1)
* **Cerita:** Sebagai `STAFF_CREATOR`, saya ingin mengajukan ide konten beserta hook dan tautan referensi, dan sebagai `PROJECT_MANAGER` saya ingin menyetujui dan langsung mempromosikan ide terbaik menjadi Content Plan tanpa mengetik ulang.
* **Acceptance Criteria:**
  1. **Skenario Sukses — Submit, Upvote & Promote Ide:**
     - **Given** `STAFF_CREATOR` mengirimkan ide *"5 Kesalahan UI Landing Page Bisnis"* (`status = IDEA`) dan mendapat 3 upvote tim,
     - **When** `PROJECT_MANAGER` mengklik **Approve & Promote to Content Plan**,
     - **Then** status ide di `content_ideas` berubah menjadi `APPROVED_IDEA` lalu `CONVERTED`, satu draf `content_items` baru dengan status `PLANNING` otomatis terbuat dengan judul & referensi tersalin, dan pengusul menerima notifikasi `CONTENT_IDEA_REVIEWED`.
  2. **Skenario Validasi — Penolakan Ide Wajib Alasan:**
     - **Given** `PROJECT_MANAGER` ingin menolak/mengarsipkan sebuah ide konten,
     - **When** PM menekan **Reject/Archive** tanpa mengisi alasan minimal 10 karakter,
     - **Then** sistem menampilkan error validasi dan tidak mengubah status ide hingga alasan diisi.

##### `US-C03` — Content Planning & Pembuatan Tugas Produksi Otomatis
* **Peran:** `STAFF_CREATOR` | **Modul:** C | **FR Terkait:** `FR-C03`, `FR-INT-01` | **Prioritas:** Must-Have (V1)
* **Cerita:** Sebagai `STAFF_CREATOR`, saya ingin melengkapi naskah, caption, hashtag, dan jadwal tayang konten di Content Planning sehingga tugas produksi saya otomatis tercatat di Modul Task Management.
* **Acceptance Criteria:**
  1. **Skenario Sukses — Auto-Spawn Task `CONTENT_PRODUCTION`:**
     - **Given** sebuah `content_items` berstatus `PLANNING` diisi `creator_id = User Creator`, `platform = INSTAGRAM`, `content_format = CAROUSEL`, dan `planned_publish_at = 2026-10-20 18:00 WIB`,
     - **When** rencana konten disimpan,
     - **Then** sistem otomatis membuat tepat 1 task di tabel `tasks` dengan `task_type = CONTENT_PRODUCTION`, `assignee_id = User Creator`, `due_date = 2026-10-19 23:59:59 WIB`, yang langsung terlihat di `My Tasks`, `Kanban Board`, dan `Work Calendar`.
  2. **Skenario Validasi — Syarat Publikasi (`PUBLISHED`):**
     - **Given** konten membutuhkan desain (`requires_design = true`) tetapi status desainnya masih `DESIGN_REVIEW`,
     - **When** `STAFF_CREATOR` mencoba mengubah status konten ke `SCHEDULED` atau `PUBLISHED`,
     - **Then** sistem menolak transisi dengan pesan *"Desain harus berstatus APPROVED sebelum konten dijadwalkan atau dipublikasikan"*; dan saat berubah ke `PUBLISHED`, kolom `published_url` wajib diisi URL `https://` valid.

##### `US-C04` — Pembuatan Design Brief & Auto-Spawn Tugas Desain
* **Peran:** `STAFF_CREATOR` | **Modul:** C | **FR Terkait:** `FR-C04`, `FR-INT-02` | **Prioritas:** Must-Have (V1)
* **Cerita:** Sebagai `STAFF_CREATOR`, saya ingin mengirim Design Brief terstruktur (dimensi, jumlah slide, teks visual, moodboard) dari Content Plan langsung ke Designer, agar Designer tidak perlu mencari brief di chat dan tugas desain otomatis masuk papan kerjanya.
* **Acceptance Criteria:**
  1. **Skenario Sukses — Brief Terstruktur & Auto-Spawn `DESIGN_TASK`:**
     - **Given** `STAFF_CREATOR` membuka `content_items` berstatus `PLANNING` dan mengklik **Buat Design Brief**,
     - **When** pengguna mengisi `assigned_designer_id`, `design_due_date`, `format_dimensions = "1080x1350 px (4:5)"`, `slide_count = 6`, `copy_on_design`, dan menekan **Kirim Brief**,
     - **Then** `design_briefs` tersimpan, status `content_items` berubah ke `IN_DESIGN`, tepat 1 task bertipe `DESIGN_TASK` otomatis tercipta untuk `assigned_designer_id` (dengan `requires_review = true`), dan Designer menerima notifikasi `DESIGN_BRIEF_ASSIGNED`.

##### `US-C05` — Pengiriman Karya Desain (Upload / Link) & Versioning di Design Workspace
* **Peran:** `DESIGNER` | **Modul:** C | **FR Terkait:** `FR-C04`, `NFR-09` | **Prioritas:** Must-Have (V1)
* **Cerita:** Sebagai `DESIGNER`, saya ingin mengunggah hasil desain gambar/PDF atau menautkan file Figma/Canva dengan penomoran versi otomatis di Design Workspace, agar riwayat pengerjaan saya rapi dan mudah direview.
* **Acceptance Criteria:**
  1. **Skenario Sukses — Submit Versi Pertama (`v1`) via Hybrid Upload & Link:**
     - **Given** `DESIGNER` membuka brief yang ditugaskan kepadanya (`status = IN_PROGRESS`),
     - **When** `DESIGNER` mengunggah 3 file PNG (masing-masing 2 MB) dan menambahkan 1 tautan Figma valid serta catatan, lalu menekan **Submit for Review**,
     - **Then** tercipta `design_submissions` dengan `version_number = 1`, status brief menjadi `SUBMITTED`, status `content_items` berubah ke `DESIGN_REVIEW`, linked `DESIGN_TASK` pindah ke kolom `IN_REVIEW`, dan `PROJECT_MANAGER` menerima notifikasi `DESIGN_SUBMITTED`.
  2. **Skenario Validasi — Penolakan File Tidak Valid / Terlalu Besar:**
     - **Given** `DESIGNER` mencoba mengunggah file `.zip` atau file PNG berukuran `30 MB`,
     - **When** proses upload dipicu,
     - **Then** sistem menolak file sebelum disimpan ke Object Storage dan menampilkan pesan error eksplisit (*"Format diizinkan: PNG, JPG, WEBP, SVG, PDF, MP4 dengan ukuran maksimal 25 MB per file; gunakan External Link untuk file > 25 MB"*).

##### `US-C06` — Design Approval, Revision Loop & Auto-Promote ke Asset Library
* **Peran:** `PROJECT_MANAGER` | **Modul:** C | **FR Terkait:** `FR-C05`, `FR-C06`, `FR-INT-02`, `FR-INT-03` | **Prioritas:** Must-Have (V1)
* **Cerita:** Sebagai `PROJECT_MANAGER`, saya ingin mereview hasil desain, meminta revisi terstruktur bila perlu, atau menyetujui karya final agar otomatis tersimpan ke Asset Library dan memperbarui status konten, task, serta metrik KPI secara serempak.
* **Acceptance Criteria:**
  1. **Skenario Sukses — Siklus Revisi (`REVISION_REQUESTED`):**
     - **Given** `PROJECT_MANAGER` membuka `design_submissions` `v1` berstatus `SUBMITTED`,
     - **When** PM memilih **Request Revision** dengan catatan *"Slide 2 ukuran font headline terlalu kecil dan kontras CTA kurang kuat"*,
     - **Then** dalam satu transaksi atomik: status brief menjadi `REVISION_REQUESTED`, `revision_count` bertambah `+1`, `content_items` berubah ke `DESIGN_REVISION`, linked `DESIGN_TASK` pindah ke `REVISION`, dan Designer menerima notifikasi `DESIGN_REVISION_REQUESTED` berisi catatan revisi; ketika Designer mengirim ulang, sistem otomatis menomori versi `v2` tanpa menghapus `v1`.
  2. **Skenario Sukses — Approval Final & Auto-Promote Asset Library:**
     - **Given** `DESIGNER` telah mengirim `v2` (`SUBMITTED`) dan `PROJECT_MANAGER` memverifikasi hasilnya sesuai brief,
     - **When** PM menekan **Approve Design**,
     - **Then** dalam satu transaksi atomik: status brief menjadi `APPROVED`, `content_items` menjadi `READY_TO_PUBLISH`, linked `DESIGN_TASK` berubah ke `DONE` (`completed_at = NOW()`), file/link `v2` otomatis terdaftar sebagai aset final berlabel `APPROVED_FINAL` di **Asset Library**, `DQS` Designer diperbarui, dan notifikasi `DESIGN_APPROVED` terkirim ke Designer & PIC Creator (`creator_id`).

##### `US-C07` — Pencatatan Content Performance Analytics & Pemanfaatan Asset Library
* **Peran:** `STAFF_CREATOR` & `DESIGNER` | **Modul:** C | **FR Terkait:** `FR-C06`, `FR-C07` | **Prioritas:** Must-Have (V1)
* **Cerita:** Sebagai `STAFF_CREATOR`, saya ingin mencatat angka performa konten yang sudah tayang dan melihat perhitungan Engagement Rate otomatis, dan sebagai `DESIGNER` saya ingin mencari aset final serta melihat performa visual karya saya untuk peningkatan kualitas konten berikutnya.
* **Acceptance Criteria:**
  1. **Skenario Sukses — Input Metrik & Kalkulasi Otomatis `ER` dan `CTR`:**
     - **Given** konten *"Carousel Tips SEO"* berstatus `PUBLISHED`,
     - **When** `STAFF_CREATOR` menginput snapshot H+7: `impressions = 10000`, `reach = 8000`, `likes = 320`, `comments = 40`, `shares = 24`, `saves = 96`, `clicks = 250`,
     - **Then** sistem otomatis menghitung dan menyimpan `Total Engagement = 480`, `ER_reach = 6.00%`, dan `CTR = 2.50%`, serta memperbarui grafik perbandingan kanal/pilar di Dashboard Analitik Konten.
  2. **Skenario Sukses — Pencarian & Unduh Aset di Asset Library:**
     - **Given** terdapat puluhan aset tersimpan dari hasil approval dan upload brand kit,
     - **When** `DESIGNER` mengetik kata kunci tag `"instagram"` dan memfilter kategori `SOCIAL_MEDIA` di `Asset Library`,
     - **Then** daftar aset terfilter tampil dengan pratinjau thumbnail dalam $\le 1$ detik dan menyediakan tombol **Download** / **Copy Link** yang berfungsi langsung.

---

#### 3.4 User Stories Modul D — System Management

##### `US-D01` — Manajemen Akun Internal & Deaktivasi Non-Destruktif
* **Peran:** `SUPER_ADMIN` | **Modul:** D | **FR Terkait:** `FR-D01` | **Prioritas:** Must-Have (V1)
* **Cerita:** Sebagai `SUPER_ADMIN`, saya ingin mendaftarkan anggota tim baru dengan password sementara serta menonaktifkan akun anggota yang keluar tanpa menghapus histori tugas dan KPI mereka, agar keamanan akses dan keutuhan data terjaga.
* **Acceptance Criteria:**
  1. **Skenario Sukses — Buat User Baru & Paksa Ganti Password:**
     - **Given** `SUPER_ADMIN` membuka halaman `User Management` dan membuat akun baru dengan peran `DESIGNER` beserta password sementara,
     - **When** user baru tersebut login untuk pertama kali,
     - **Then** sistem langsung mengarahkan ke formulir wajib **Ubah Kata Sandi** (`must_change_password = true`) sebelum user dapat mengakses halaman dashboard lainnya.
  2. **Skenario Sukses — Deaktivasi Akun & Proteksi Last Super Admin:**
     - **Given** `SUPER_ADMIN` menonaktifkan akun user biasa yang sedang memiliki sesi aktif,
     - **When** status `is_active` diubah ke `false`,
     - **Then** sesi user tersebut langsung ditolak pada request berikutnya (redirect ke halaman login), seluruh histori task & KPI miliknya tetap utuh di database, dan jika admin mencoba menonaktifkan satu-satunya `SUPER_ADMIN` aktif, sistem menolak dengan pesan error eksplisit.

##### `US-D02` — Penegakan Role-Based Access Control (RBAC) Server-Side
* **Peran:** `SUPER_ADMIN` | **Modul:** D | **FR Terkait:** `FR-D02`, `NFR-07` | **Prioritas:** Must-Have (V1)
* **Cerita:** Sebagai `SUPER_ADMIN`, saya ingin melihat matriks izin seluruh peran dan memastikan setiap tindakan sensitif divalidasi di sisi server, agar tidak ada anggota yang dapat melampaui wewenangnya.
* **Acceptance Criteria:**
  1. **Skenario Sukses — Transparansi Matriks Izin:**
     - **Given** `SUPER_ADMIN` membuka menu `System > Role & Permissions`,
     - **When** halaman dimuat,
     - **Then** tampil matriks lengkap 4 peran (`SUPER_ADMIN`, `PROJECT_MANAGER`, `STAFF_CREATOR`, `DESIGNER`) terhadap seluruh permission (`module:resource:action`) secara akurat sesuai konfigurasi database.
  2. **Skenario Keamanan — Penolakan Akses Langsung Server Actions Terlarang:**
     - **Given** pengguna login sebagai `DESIGNER` (memiliki sesi valid),
     - **When** pengguna memanggil langsung Server Action finalisasi KPI (`transitionEvaluationStatusAction` dengan target `FINALIZED`) atau pembuatan user (`createUserAction`),
     - **Then** RBAC Guard di server menolak eksekusi dengan error otorisasi (`403 Forbidden`), tidak mengubah data apa pun, dan mencatat upaya akses tidak sah pada log server.

##### `US-D03` — Pengelolaan Notifikasi In-App & Navigasi Deep-Link
* **Peran:** `DESIGNER` | **Modul:** D | **FR Terkait:** `FR-D03` | **Prioritas:** Must-Have (V1)
* **Cerita:** Sebagai `DESIGNER`, saya ingin menerima pemberitahuan terpusat saat ada brief baru, komentar revisi, atau pengingat tenggat dan langsung menuju halaman terkait dalam satu klik, agar saya responsif terhadap pembaruan kerja.
* **Acceptance Criteria:**
  1. **Skenario Sukses — Badge Unread, Deep-Link & Mark All Read:**
     - **Given** `DESIGNER` memiliki 3 notifikasi belum dibaca (termasuk 1 `DESIGN_REVISION_REQUESTED`),
     - **When** pengguna membuka ikon lonceng topbar (badge menampilkan angka `3`) dan mengklik notifikasi revisi desain tersebut,
     - **Then** notifikasi tersebut berubah menjadi `is_read = true`, badge berkurang menjadi `2`, dan aplikasi langsung menavigasi ke halaman `Design Workspace` brief bersangkutan; saat menekan **Tandai Semua Dibaca**, seluruh sisa notifikasi berubah menjadi `is_read = true` dan badge hilang.

##### `US-D04` — Publikasi Pengumuman Pinned & Pelacakan Read Receipt
* **Peran:** `SUPER_ADMIN` | **Modul:** D | **FR Terkait:** `FR-D04`, `FR-D03` | **Prioritas:** Must-Have (V1)
* **Cerita:** Sebagai `SUPER_ADMIN`, saya ingin mempublikasikan pengumuman internal yang disematkan di atas dashboard seluruh tim serta memantau siapa yang sudah dan belum membacanya, agar kebijakan penting tersampaikan merata.
* **Acceptance Criteria:**
  1. **Skenario Sukses — Broadcast Pinned Announcement & Read Receipt:**
     - **Given** `SUPER_ADMIN` membuat pengumuman baru dengan `priority = IMPORTANT`, `target_roles = ALL`, `is_pinned = true`, dan `expires_at` 7 hari ke depan,
     - **When** pengumuman dipublikasikan dan 5 anggota tim membukanya serta mengklik **Tandai Sudah Dibaca**,
     - **Then** seluruh anggota aktif menerima notifikasi `ANNOUNCEMENT_PUBLISHED`, banner muncul di atas dashboard, dan `SUPER_ADMIN` melihat statistik keterbacaan real-time (*"Dibaca oleh 5 dari N anggota"*) beserta daftar nama yang belum membaca.

##### `US-D05` — Audit Perubahan Sistem melalui Immutable Activity Logs
* **Peran:** `SUPER_ADMIN` | **Modul:** D | **FR Terkait:** `FR-D05` | **Prioritas:** Must-Have (V1)
* **Cerita:** Sebagai `SUPER_ADMIN`, saya ingin menelusuri dan mengekspor riwayat lengkap setiap perubahan data kritis (perubahan peran, perubahan deadline, approval desain, finalisasi KPI) beserta nilai lama dan barunya, agar tata kelola operasional Krevia Digital sepenuhnya akuntabel.
* **Acceptance Criteria:**
  1. **Skenario Sukses — Filtering & Diff Viewer Audit Log:**
     - **Given** dalam seminggu terakhir terjadi mutasi pada Modul A, B, C, dan D,
     - **When** `SUPER_ADMIN` membuka `Activity Logs` (`/system/activity-logs`), memfilter `Modul = TEAM_KPI` dan rentang 7 hari terakhir, lalu mengklik detail log `KPI_FINALIZED`,
     - **Then** sistem menampilkan aktor, waktu WIB (`created_at`), IP address, serta perbandingan `old_values` (`status: REVIEWED`) vs `new_values` (`status: FINALIZED`, `weighted_kpi_score`), tanpa satu pun field sensitif (seperti password) terekam di dalamnya.
  2. **Skenario Integritas — Immutability Audit Log:**
     - **Given** baris audit log telah tertulis di tabel `activity_logs`,
     - **When** dilakukan pemeriksaan antarmuka maupun endpoint API sistem (bahkan oleh `SUPER_ADMIN`),
     - **Then** tidak terdapat tombol, Server Action, maupun API endpoint untuk mengedit atau menghapus entri log audit tersebut.

---
### 4. Prioritization Matrix (MoSCoW) — V1 (2 Minggu) vs Iterasi Berikutnya (V1.1 / V2)

#### 4.1 Strategi Prioritas & Kapasitas Sprint 2 Developer

Seluruh 25 sub-fitur pada 4 modul kanonik dirancang untuk hadir secara fungsional pada **Rilis V1 (Hari ke-14)** agar KTMS langsung menggantikan seluruh alat terfragmentasi Krevia Digital sejak hari pertama Go-Live. Untuk menjaga ketepatan jadwal dengan kapasitas **2 full-stack developers (Mhd Yoga Andhika & Nta)** selama **Minggu 2 (Hari 8–14 = 14,0 *developer-days*)**, fitur dipilah menggunakan metode **MoSCoW**:

* **Must-Have (V1 — Minggu 1–2 / Go-Live Hari 14):** Alur operasional inti untuk seluruh 25 sub-fitur + integrasi lintas modul (`FR-INT-01`–`FR-INT-04`) + keamanan RBAC & audit log. Anggaran pengembangan ditargetkan maksimal **11,50 *dev-days*** agar tersisa **2,50 *dev-days*** pada Hari 13–14 khusus untuk integrasi akhir, uji RBAC, UAT Leadership, uji backup/restore, dan deployment produksi.
* **Should-Have (V1.1 — Minggu 3–4 / Fast-Follow):** Pengayaan produktivitas, otomatisasi pelaporan lanjutan, dan kenyamanan UX yang meningkatkan efisiensi tanpa menghalangi adopsi V1.
* **Could-Have (V2 — Kuartal Berikutnya):** Kapabilitas ekspansi skala besar dan integrasi eksternal pihak ketiga pasca stabilisasi operasional.
* **Won't-Have (Out of Scope V1):** Fitur yang secara tegas berada di luar mandat V1 untuk melindungi jadwal, biaya, dan fokus produk.

**Keterangan Skala Kompleksitas:**
* **S (Small):** `0,25 – 0,50 dev-days` (2–4 jam kerja fokus per developer)
* **M (Medium):** `0,75 – 1,00 dev-days` (6–8 jam kerja fokus)
* **L (Large):** `1,50+ dev-days` (eksklusif untuk fitur lanjutan V1.1 / V2)

---

#### 4.2 Matriks MoSCoW Lengkap

##### A. Must-Have — Rilis V1 (Minggu 1–2, Target Go-Live Hari ke-14)

| ID | Modul | Fitur / Sub-Fitur & Ruang Lingkup V1 | Kategori MoSCoW | Target Rilis | Kompleksitas & Estimasi | Dependensi | Justifikasi Bisnis & Operasional |
| :--- | :---: | :--- | :---: | :---: | :---: | :--- | :--- |
| `MOS-01` | D | **Auth.js v5, User Management (`FR-D01`) & RBAC Server Guard (`FR-D02`)** — Login credentials, hash Argon2id/Bcrypt, aktivasi/deaktivasi user, 4 role kanonik, matriks izin & server guard. | **Must-Have** | V1 (Hari 8) | M (`1,00` dev-day) | Skema DB & Prisma Seed | Prasyarat keamanan mutlak; seluruh modul lain bergantung pada identitas user dan otorisasi peran. |
| `MOS-02` | A | **Project Management (`FR-A01`)** — CRUD proyek, manajemen anggota proyek, status proyek, dan ringkasan progres proyek. | **Must-Have** | V1 (Hari 8–9) | S (`0,50` dev-day) | `MOS-01` | Wadah struktural utama untuk mengelompokkan seluruh task operasional dan kampanye konten. |
| `MOS-03` | A | **Task Assignment (`FR-A05`) & Progress Tracking (`FR-A06`)** — Unified task CRUD, workload hint dropdown, reassign, checklist sub-item, komentar `@mention`, lampiran ringan. | **Must-Have** | V1 (Hari 9) | M (`0,75` dev-day) | `MOS-02` | Inti pencatatan pekerjaan harian; menjadi satu-satunya sumber kebenaran bagi Kanban, Kalender, dan KPI. |
| `MOS-04` | A | **My Tasks (`FR-A02`) & Deadline Management (`FR-A07`)** — Smart grouping (Overdue/Today/Upcoming), badge status tenggat, proteksi self-edit deadline, cron reminder harian. | **Must-Have** | V1 (Hari 9) | S (`0,50` dev-day) | `MOS-03` | Mendorong disiplin penyelesaian tepat waktu (`OTDR`) dan memberi fokus kerja harian bagi setiap anggota. |
| `MOS-05` | A | **Kanban Board (`FR-A03`)** — 6 kolom status kanonik, *drag-and-drop* dengan *optimistic UI*, modal catatan revisi wajib, multi-filter URL persisten. | **Must-Have** | V1 (Hari 9–10) | M (`0,75` dev-day) | `MOS-03` | Visibilitas visual instan atas alur kerja dan hambatan (*bottleneck*) tim bagi PM & Leadership. |
| `MOS-06` | A | **Work Calendar (`FR-A04`)** — Tampilan kalender Bulanan & Mingguan terpadu (task + overlay konten), kode warna tipe task, slide-over drawer detail (berbagi komponen kalender dengan `MOS-09`). | **Must-Have** | V1 (Hari 10) | S (`0,25` dev-day) | `MOS-03`, `MOS-09` | Mencegah penumpukan deadline lintas proyek dalam satu tampilan jadwal operasional. |
| `MOS-07` | C | **Content Ideas Management (`FR-C02`)** — Pengajuan ide, upvote tim, review PM/Admin, tombol 1-klik *Approve & Promote to Content Plan*. | **Must-Have** | V1 (Hari 9) | S (`0,50` dev-day) | `MOS-01`, `MOS-02` | Menjaga konsistensi bank ide konten dan mempercepat kurasi editorial oleh PM. |
| `MOS-08` | C | **Content Planning (`FR-C03`) & Auto-Task Sync (`FR-INT-01`)** — Naskah, caption + char counter, hashtag, jadwal tayang, validasi URL publikasi, dan auto-spawn task `CONTENT_PRODUCTION`. | **Must-Have** | V1 (Hari 10) | M (`0,75` dev-day) | `MOS-03`, `MOS-07` | Menghilangkan input ganda antara perencanaan konten dan pelacakan tugas tim kreator. |
| `MOS-09` | C | **Content Calendar (`FR-C01`)** — Tampilan Calendar Grid & Editorial Table View (pengganti langsung spreadsheet), filter platform/pilar/status/PIC. | **Must-Have** | V1 (Hari 10) | S (`0,50` dev-day) | `MOS-08` | Tujuan adopsi utama V1 (`PKPI-01`): menghentikan 100% penggunaan spreadsheet konten terpisah. |
| `MOS-10` | C | **Design Workspace (`FR-C04`) & Auto-Task Sync (`FR-INT-02`)** — Structured Design Brief, hybrid submission (presigned upload $\le 25\text{ MB}$ + external link Figma/Canva/GDrive), versioning `v1..vN`, auto-spawn `DESIGN_TASK`. | **Must-Have** | V1 (Hari 10–11) | M (`1,00` dev-day) | `MOS-03`, `MOS-08` | Menghilangkan kekacauan brief & revisi desain di chat; menghubungkan pekerjaan desainer langsung ke Kanban. |
| `MOS-11` | C | **Design Approval & Revision Loop (`FR-C05`)** — Lightbox preview, keputusan `APPROVED`/`REVISION_REQUESTED` dengan catatan wajib, penghitung `revision_count`, sinkronisasi atomik ke Task & Content Item. | **Must-Have** | V1 (Hari 11) | S (`0,50` dev-day) | `MOS-10` | Menjamin kontrol kualitas visual sebelum publikasi dan menghasilkan data objektif untuk `DQS`. |
| `MOS-12` | C | **Asset Library (`FR-C06`) & Auto-Promote (`FR-INT-03`)** — Katalog otomatis aset berstatus `APPROVED`, manual upload/link aset brand, pencarian tag/kategori, preview & download. | **Must-Have** | V1 (Hari 11) | S (`0,50` dev-day) | `MOS-11` | Memastikan seluruh aset final terkumpul rapi, terdokumentasi, dan mudah dipakai ulang tim. |
| `MOS-13` | C | **Content Performance Analytics — Core (`FR-C07`)** — Input metrik pasca-publikasi (`impressions`, `reach`, `likes`, `comments`, `shares`, `saves`, `clicks`), kalkulasi otomatis `ER_reach` & `CTR`, ringkasan tabel & top konten. | **Must-Have** | V1 (Hari 11) | S (`0,25` dev-day) | `MOS-08` | Menutup siklus evaluasi efektivitas konten yang telah terbit pada kanal Krevia Digital. |
| `MOS-14` | B | **Team Directory (`FR-B01`) & Individual Performance (`FR-B02`, `FR-INT-04`)** — Direktori tim aktif + mesin kalkulasi otomatis `TCR`, `OTDR`, `DQS`, `CPVS` beserta drill-down tabel pembentuk angka. | **Must-Have** | V1 (Hari 11–12) | M (`0,75` dev-day) | `MOS-03`, `MOS-11`, `MOS-08` | Menghadirkan objektivitas dan transparansi kinerja real-time bagi setiap anggota tim. |
| `MOS-15` | B | **KPI Management (`FR-B03`)** — CRUD template KPI, seed bobot default 4 peran, assignment per periode dengan validasi total bobot $= 100\%$, dan *Clone Previous Month*. | **Must-Have** | V1 (Hari 12) | S (`0,50` dev-day) | `MOS-14` | Menstandarisasi target bulanan dan mempercepat persiapan periode evaluasi baru. |
| `MOS-16` | B | **Team Performance Dashboard (`FR-B04`)** — Kartu ringkasan eksekutif, tabel leaderboard anggota, grafik bar *Workload Distribution*, dan grafik tren bulanan. | **Must-Have** | V1 (Hari 12) | S (`0,50` dev-day) | `MOS-14`, `MOS-15` | Memberikan visibilitas instan bagi Leadership Krevia untuk mendeteksi *overload* dan penurunan kinerja. |
| `MOS-17` | B | **Monthly Evaluation (`FR-B05`)** — Alur `DRAFT` $\rightarrow$ `SUBMITTED` $\rightarrow$ `REVIEWED` $\rightarrow$ `FINALIZED`, input skor manual + catatan, rumus `Weighted KPI Score` + *weight re-normalization*, penguncian *immutable snapshot*. | **Must-Have** | V1 (Hari 12) | M (`0,75` dev-day) | `MOS-14`, `MOS-15` | Menggantikan rekap evaluasi akhir bulan manual yang lambat dan rentan perdebatan subjektif. |
| `MOS-18` | B | **Reports & Analytics — Core (`FR-B06`)** — Ekspor CSV rekap performa tim & laporan tugas proyek + tampilan rapor KPI individu siap cetak PDF (*Print-Ready PDF Layout*). | **Must-Have** | V1 (Hari 12) | S (`0,25` dev-day) | `MOS-17` | Memenuhi kebutuhan langsung rapat evaluasi bulanan Leadership dengan usaha build minimal. |
| `MOS-19` | D | **Notification Center (`FR-D03`), Announcements (`FR-D04`) & Activity Logs (`FR-D05`)** — 21 event pemicu in-app (`notification_type_enum`) + deep-link + mark read, pengumuman pinned (maks 3) + read receipt, audit trail immutable + filter & CSV export. | **Must-Have** | V1 (Hari 8 & 12) | M (`1,00` dev-day) | `MOS-01` | Menjamin koordinasi responsif, komunikasi resmi satu pintu, dan akuntabilitas tata kelola sistem. |

---

##### B. Should-Have — Rilis V1.1 (Minggu 3–4, Fast-Follow Iteration)

| ID | Modul | Fitur / Kapabilitas V1.1 | Kategori MoSCoW | Target Rilis | Kompleksitas & Estimasi | Dependensi | Justifikasi Bisnis & Operasional |
| :--- | :---: | :--- | :---: | :---: | :---: | :--- | :--- |
| `MOS-20` | A & C | **Calendar Drag-and-Drop Reschedule** — Menggeser tanggal deadline task (`Work Calendar`) dan tanggal publikasi (`Content Calendar`) secara langsung pada grid kalender. | **Should-Have** | V1.1 (Minggu 3) | S (`0,50` dev-day) | `MOS-06`, `MOS-09` | Mempercepat penjadwalan ulang visual; di V1 perubahan tanggal tetap penuh tersedia melalui modal/drawer edit. |
| `MOS-21` | B | **Server-Generated Branded PDF & Multi-Sheet XLSX Export** — Generasi file PDF server-side (`@react-pdf/renderer`) dan workbook `.xlsx` terformat lengkap untuk laporan bulanan & kuartalan. | **Should-Have** | V1.1 (Minggu 3) | M (`0,75` dev-day) | `MOS-18` | Meningkatkan kualitas presentasi eksekutif; di V1 kebutuhan dasar sudah terpenuhi via CSV + Print-Ready PDF. |
| `MOS-22` | B | **Employee Self-Reflection pada Monthly Evaluation** — Kolom refleksi pencapaian diri oleh `STAFF_CREATOR`/`DESIGNER` sebelum PM melakukan review bulanan. | **Should-Have** | V1.1 (Minggu 3) | S (`0,50` dev-day) | `MOS-17` | Memperkaya dialog evaluasi 2 arah tanpa memperlambat implementasi alur inti 4 status di V1. |
| `MOS-23` | C | **Content Performance Analytics — Advanced Charts & Bulk CSV Import** — Grafik perbandingan multi-kanal/pilar interaktif, tren bulanan ER, dan impor metrik massal dari ekspor CSV Instagram/TikTok Insights. | **Should-Have** | V1.1 (Minggu 3–4) | M (`0,75` dev-day) | `MOS-13` | Memangkas waktu input metrik manual saat volume konten bulanan Krevia meningkat. |
| `MOS-24` | A | **Recurring Tasks & Task Templates** — Template tugas berulang otomatis (misal laporan mingguan setiap Senin atau checklist produksi Reels baku). | **Should-Have** | V1.1 (Minggu 4) | M (`0,75` dev-day) | `MOS-03` | Menghemat waktu pembuatan tugas operasional rutin berulang oleh PM. |
| `MOS-25` | D | **Email Digest & Notifikasi Kritis via SMTP/Resend** — Pengiriman email otomatis khusus untuk pengingat H-0 overdue, finalisasi KPI, dan pengumuman `URGENT` (dengan preferensi opt-in per user). | **Should-Have** | V1.1 (Minggu 4) | M (`0,75` dev-day) | `MOS-19` | Melengkapi Notification Center in-app bagi anggota yang sedang di luar aplikasi web. |
| `MOS-26` | C | **Asset Library Bulk Upload & Folder Collections** — Unggah banyak aset sekaligus (*multi-file dropzone*) dan pengelompokan koleksi folder per kampanye. | **Should-Have** | V1.1 (Minggu 4) | S (`0,50` dev-day) | `MOS-12` | Meningkatkan kecepatan kurasi saat volume aset brand kit makin besar. |

---

##### C. Could-Have — Rilis V2 (Kuartal Berikutnya / Skalabilitas Lanjutan)

| ID | Modul | Fitur / Kapabilitas V2 | Kategori MoSCoW | Target Rilis | Kompleksitas & Estimasi | Dependensi | Justifikasi Bisnis & Operasional |
| :--- | :---: | :--- | :---: | :---: | :---: | :--- | :--- |
| `MOS-27` | C | **Integrasi API Media Sosial (Read Insights & Auto-Scheduling)** — Koneksi resmi Meta Graph API / TikTok API / LinkedIn API untuk tarik metrik otomatis dan publikasi terjadwal. | **Could-Have** | V2 | L (`4,00+` dev-days) | `MOS-09`, `MOS-13` | Memerlukan proses App Review dan kepatuhan token OAuth pihak ketiga yang memakan waktu 3–6 minggu. |
| `MOS-28` | C | **Visual Pin-Point Annotation pada Design Review** — Memberikan komentar langsung pada koordinat piksel tertentu di gambar pratinjau desain. | **Could-Have** | V2 | L (`2,50` dev-days) | `MOS-11` | Nilai tambah ergonomis bagi tim kreatif; di V1 catatan revisi terstruktur + link Figma sudah memadai. |
| `MOS-29` | A | **Gantt / Timeline Dependency View & Kanban WIP Limits** — Visualisasi ketergantungan antar task (*Finish-to-Start*) dan batas maksimal kartu per kolom Kanban. | **Could-Have** | V2 | L (`2,00` dev-days) | `MOS-05`, `MOS-06` | Relevan saat kompleksitas proyek lintas divisi bertumbuh di atas 25+ anggota tim. |
| `MOS-30` | D | **Custom Dynamic Roles & SSO (Google Workspace OAuth)** — Editor pembuatan peran kustom baru lewat UI serta login 1-klik menggunakan akun email Google Workspace `@krevia`. | **Could-Have** | V2 | M (`1,50` dev-days) | `MOS-01` | Memudahkan onboarding saat struktur organisasi Krevia berkembang di luar 4 peran kanonik. |
| `MOS-31` | B | **OKR & Quarterly Performance Appraisal Roll-Up** — Agregasi otomatis evaluasi bulanan menjadi tinjauan kuartalan/tahunan dan pelacakan tujuan strategis perusahaan (OKR). | **Could-Have** | V2 | L (`2,00` dev-days) | `MOS-17` | Ekspansi alami setelah histori evaluasi bulanan V1 terkumpul minimal 3 bulan. |
| `MOS-32` | D | **Webhook / Slack & WhatsApp Notification Bridge** — Penerusan notifikasi event tertentu ke channel Slack atau grup operasional Krevia. | **Could-Have** | V2 | M (`1,00` dev-day) | `MOS-19` | Opsional setelah adopsi Notification Center in-app stabil agar tidak memicu kelelahan notifikasi (*notification fatigue*). |

---

##### D. Won't-Have — Ditolak secara Tegas untuk V1 (Strict Out-of-Scope Guardrails)

| ID | Domain | Fitur yang Ditolak untuk V1 | Kategori MoSCoW | Alasan Penolakan Strategis |
| :--- | :---: | :--- | :---: | :--- |
| `MOS-33` | Platform | **Native Mobile Apps (iOS & Android)** | **Won't-Have** | Tidak sesuai rasio biaya-manfaat untuk timeline 14 hari; aplikasi web responsif sudah memenuhi kebutuhan pemantauan di perangkat genggam. |
| `MOS-34` | Eksternal | **External Client Portal & Multi-Tenant Client Login** | **Won't-Have** | KTMS V1 berfokus 100% pada efisiensi operasional internal Krevia Digital; membuka akses eksternal menuntut arsitektur isolasi tenant dan SLA terpisah. |
| `MOS-35` | HRIS | **Full HRIS (Payroll, Slip Gaji, Absensi Geofencing/Biometrik, Cuti, Rekrutmen/ATS)** | **Won't-Have** | Berada di luar ruang lingkup manajemen tugas & KPI; membawa risiko kepatuhan hukum ketenagakerjaan/pajak serta pembengkakan skema data. |
| `MOS-36` | Komunikasi | **Internal Real-Time Chat Messenger & Video Conferencing** | **Won't-Have** | Duplikasi dengan perangkat komunikasi harian yang sudah mapan; diskusi kontekstual cukup dilakukan pada kolom komentar task/brief dan pengumuman. |
| `MOS-37` | Finansial | **ERP Keuangan, Invoicing, RAB/Budgeting & Akuntansi** | **Won't-Have** | Domain terpisah dari produktivitas tim kreatif dan manajemen proyek internal V1. |

---

#### 4.3 Validasi Kapasitas & Rencana Kontingensi De-Scoping V1

##### Ringkasan Alokasi Kapasitas Sprint Minggu 2 (Hari 8–14)

| Kelompok Pekerjaan | Jumlah Item | Estimasi (*Dev-Days*) | Pembagian Utama (2 Developers) |
| :--- | :---: | :---: | :--- |
| **Modul D — System Core (Auth, RBAC, Users, Notif, Announcements, Audit)** | 2 blok (`MOS-01`, `MOS-19`) | `2,00` | Developer A (Backend/Infra & Auth) + Developer B (UI Shell) |
| **Modul A — Task Management (Projects, Tasks, My Tasks, Kanban, Calendar, Deadlines)** | 5 blok (`MOS-02`–`MOS-06`) | `2,75` | Paralel (Backend Services & Interactive UI Kanban/Calendar) |
| **Modul C — Social Media & Design (Ideas, Planning, Calendar, Design, Approval, Assets, Analytics)** | 7 blok (`MOS-07`–`MOS-13`) | `4,00` | Paralel (Storage/Workflow Transactions & Creative Workspace UI) |
| **Modul B — Team & KPI (Directory, Auto-KPI Engine, Templates, Dashboard, Evaluation, Reports)** | 5 blok (`MOS-14`–`MOS-18`) | `2,75` | Paralel (KPI Aggregation SQL/Prisma & Evaluation/Chart UI) |
| **Subtotal Implementasi Fitur Must-Have V1** | **19 blok (25 Sub-Fitur)** | **`11,50` dev-days** | **Hari 8 s/d Hari 12 (siang)** |
| **Integrasi Lintas Modul, Pengujian RBAC, UAT Leadership, Uji Backup & Deploy Produksi** | **QA & Release** | **`2,50` dev-days** | **Hari 12 (sore) s/d Hari 14** |
| **TOTAL KAPASITAS MINGGU 2 (2 Developers $\times$ 7 Hari)** | — | **`14,00` dev-days** | **100% Terkalibrasi & Realistis** |

##### Rencana Kontingensi (*Emergency De-Scoping Order* jika Terjadi Hambatan di Hari ke-11/12)

Apabila terjadi hambatan teknis tak terduga selama Sprint Minggu 2, tim pengembang dapat menunda maksimal 3 komponen berikut ke **Minggu 3 (V1.1)** secara berurutan **tanpa memutus alur operasional inti V1**:
1. **Opsi 1 (`MOS-13`):** Input metrik `Content Performance Analytics` ditunda 3 hari ke V1.1 (kalender, planning, desain, approval, dan asset library tetap 100% berjalan).
2. **Opsi 2 (`MOS-18` Print-PDF):** Ekspor `Reports & Analytics` V1 dirilis cukup dengan **CSV Export** terlebih dahulu; layout rapor Print-PDF menyusul di awal V1.1.
3. **Opsi 3 (`MOS-06` Week View):** `Work Calendar` dirilis dengan tampilan **Month View + Agenda List** terlebih dahulu; tampilan Week View menyusul di V1.1.

> **Komitmen Tidak Boleh Ditawar (*Non-Negotiable Core V1*):** Autentikasi & RBAC (`MOS-01`), Unified Task Engine + Kanban (`MOS-03`, `MOS-05`), Content Calendar + Design Approval Loop (`MOS-09`, `MOS-10`, `MOS-11`), Mesin Kalkulasi KPI Otomatis + Monthly Evaluation Finalize (`MOS-14`, `MOS-17`), dan Immutable Activity Logs (`MOS-19`) **wajib hadir lengkap** pada rilis Hari ke-14.

---

## BAGIAN II — SYSTEM FLOWS, UX ARCHITECTURE, USE CASES & STATE TRANSITIONS

> **Cakupan Bagian II:** Kontrak Arsitektur Lintas Modul, Information Architecture & Sitemap RBAC (22 Menu), Layout Wireframe 3-Zone Desktop-First, 4 End-to-End Operational User Flows dengan **11 Diagram Mermaid**, 14 Spesifikasi Use Case (`UC-01`–`UC-14`), 4 Matriks Transisi State (`TaskStatus`, `ContentStatus`, `DesignSubmissionStatus`, `EvaluationStatus`), dan 6 Titik Sinkronisasi Atomik `prisma.$transaction()`.

### 0. Kontrak Arsitektur & Batasan Ruang Lingkup V1

Bagian II ini merupakan **Single Source of Truth** untuk arsitektur informasi, alur operasional lintas modul, spesifikasi Use Case, serta aturan transisi status (*state transition*) pada **Krevia Team Management System (KTMS)**. Seluruh alur dirancang dengan kontrak arsitektur yang identik dengan **Bagian I (SRS)**, **Bagian III (Database & RBAC)**, dan **Bagian IV (Arsitektur Next.js & Roadmap)**:

* **Platform & Stack:** Desktop-first responsive internal web app menggunakan **Next.js 15+ (App Router, TypeScript, Tailwind CSS, shadcn/ui)**, **Hybrid Backend (Next.js Server Actions + Route Handlers `/api/**`)**, **PostgreSQL 16 + Prisma ORM**, **Auth.js v5 (Credentials + RBAC)**, dan **Supabase Storage / S3-compatible Object Storage** (hybrid dengan external links Figma/Canva/Google Drive).
* **Batasan V1 (Strict Guardrails):** Fokus eksklusif pada operasional internal Krevia Digital melalui browser desktop/laptop (responsif dasar untuk tablet/mobile). **TIDAK mencakup** Native Mobile App, External Client Portal, maupun Full HRIS (payroll, slip gaji, absensi geofencing/biometrik, rekrutmen).
* **4 Canonical RBAC Roles:**
  1. `SUPER_ADMIN` — Super Admin / Leadership Krevia Digital (akses penuh seluruh modul, finalisasi KPI, governance sistem).
  2. `PROJECT_MANAGER` — Project Manager (orkestrasi project, distribusi & review task, approval konten/desain, review KPI tim).
  3. `STAFF_CREATOR` — Staff / Content Creator (eksekusi task operasional, pengajuan ide, content planning, penjadwalan publikasi, input analytics).
  4. `DESIGNER` — Designer (eksekusi task desain, pengelolaan brief & unggah/tautan revisi di Design Workspace, pemanfaatan Asset Library).
* **4 Canonical Status Enums:**
  * `TaskStatus`: `BACKLOG` | `TODO` | `IN_PROGRESS` | `IN_REVIEW` | `REVISION` | `DONE` | `CANCELLED`
  * `ContentStatus`: `IDEA` | `APPROVED_IDEA` | `PLANNING` | `IN_DESIGN` | `DESIGN_REVIEW` | `DESIGN_REVISION` | `READY_TO_PUBLISH` | `SCHEDULED` | `PUBLISHED` | `ARCHIVED`
  * `DesignSubmissionStatus`: `PENDING_BRIEF` | `IN_PROGRESS` | `SUBMITTED` | `REVISION_REQUESTED` | `APPROVED`
  * `EvaluationStatus`: `DRAFT` | `SUBMITTED` | `REVIEWED` | `FINALIZED`
* **Aturan Integrasi Lintas Modul (Cross-Module Spine):**
  1. **Unified Task Engine:** Setiap **Content Plan** dan **Design Brief** pada Modul C otomatis membuat dan menyinkronkan record pada tabel `tasks` Modul A (`task_type`: `CONTENT_PRODUCTION` atau `DESIGN_TASK`) sehingga seluruh beban kerja tim tampil terpusat di **My Tasks**, **Kanban Board**, dan **Work Calendar**.
  2. **Closed-Loop Performance & Governance:** Penyelesaian task, keterlambatan deadline, serta jumlah revisi dan approval desain secara otomatis memengaruhi metrik **Individual Performance & Monthly KPI Evaluation** (Modul B), mengirimkan notifikasi ke **Notification Center**, dan mencatat jejak audit permanen di **Activity Logs** (Modul D).

---

### 1. Information Architecture & Navigasi UX

#### 1.1 Peta Situs (Sitemap) & Struktur Navigasi Aplikasi

Navigasi KTMS disusun menjadi **Global Application Shell** (Topbar + Sidebar Kiri) yang menaungi **4 Modul Operasional** secara flat dan dangkal (maksimal 2 tingkat klik untuk mencapai fitur harian apa pun).

```mermaid
flowchart LR
    ROOT["KTMS Web App Shell"] --> AUTH["Auth Portal (/login)"]
    ROOT --> TOP["Global Topbar"]
    ROOT --> SIDE["RBAC Left Sidebar"]

    TOP --> SEARCH["Command Palette Ctrl+K"]
    TOP --> QUICK["Quick Action Menu (+ Task / Idea / Announcement)"]
    TOP --> BANNER["Pinned Announcement Banner"]
    TOP --> NOTIF["Notification Center Popover"]
    TOP --> PROFILE["User Profile & Logout"]

    SIDE --> HOME["Executive / Personal Overview (/)"]

    SIDE --> MODA["Modul A - Task Management"]
    MODA --> A1["My Tasks (/tasks/my-tasks)"]
    MODA --> A2["Projects (/projects)"]
    MODA --> A3["Kanban Board (/tasks/board)"]
    MODA --> A4["Work Calendar (/tasks/calendar)"]

    SIDE --> MODC["Modul C - Social Media & Design"]
    MODC --> C1["Content Calendar (/content/calendar)"]
    MODC --> C2["Content Ideas (/content/ideas)"]
    MODC --> C3["Content Planner (/content/planner)"]
    MODC --> C4["Design Workspace (/design/workspace)"]
    MODC --> C5["Design Review Queue (/design/reviews)"]
    MODC --> C6["Asset Library (/assets)"]
    MODC --> C7["Content Analytics (/content/analytics)"]

    SIDE --> MODB["Modul B - Team & KPI"]
    MODB --> B1["Team Directory (/team)"]
    MODB --> B2["Individual Performance (/team/[userId])"]
    MODB --> B3["Team KPI Dashboard (/kpi/dashboard)"]
    MODB --> B4["KPI Templates & Targets (/kpi/templates)"]
    MODB --> B5["Monthly Evaluations (/kpi/evaluations)"]
    MODB --> B6["Reports & Export (/kpi/reports)"]

    SIDE --> MODD["Modul D - System Management"]
    MODD --> D1["Announcements (/announcements)"]
    MODD --> D2["User Management (/system/users)"]
    MODD --> D3["Roles & Permissions (/system/roles)"]
    MODD --> D4["Activity Logs (/system/activity-logs)"]
```

#### 1.2 Matriks Visibilitas Menu Sidebar & Topbar Berdasarkan RBAC

Menu sidebar dirender secara dinamis dari *session permissions* di server (RSC) sehingga pengguna tidak pernah melihat menu yang tidak relevan dengan perannya, sekaligus tetap dilindungi oleh **Server-Side RBAC Guard** pada level Route dan Server Action.

| Grup Navigasi | Menu Item | Route App Router | `SUPER_ADMIN` | `PROJECT_MANAGER` | `STAFF_CREATOR` | `DESIGNER` | Catatan Scoping Data |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Utama** | Overview Dashboard | `/` | Full (Org-Wide) | Full (Managed Projects) | Personal Summary | Personal Summary | Widget menyesuaikan role secara adaptif |
| **Modul A: Tasks** | My Tasks | `/tasks/my-tasks` | Own + Filter All | Own + Delegated | Own Only | Own Only | Menampilkan task `GENERAL`, `CONTENT_PRODUCTION`, & `DESIGN_TASK` |
| **Modul A: Tasks** | Projects | `/projects` (+ `/projects/[projectId]`) | CRUD All | CRUD Assigned/Created | Read Assigned | Read Assigned | Project detail memuat tab Overview, Tasks, Members |
| **Modul A: Tasks** | Kanban Board | `/tasks/board` | All Projects | Managed Projects | Assigned Projects | Assigned Projects | Filter default: Active Project atau My Assigned |
| **Modul A: Tasks** | Work Calendar | `/tasks/calendar` | All Team Deadlines | Team Deadlines | Own + Project Deadlines | Own + Project Deadlines | Menampilkan deadline Task & jadwal `planned_publish_at` konten |
| **Modul C: Social & Design** | Content Calendar | `/content/calendar` | Full Access | Full Access | Create / Edit Plan | Read-Only (Brief Link) | Pengganti spreadsheet jadwal konten Krevia |
| **Modul C: Social & Design** | Content Ideas | `/content/ideas` | Full + Approve | Full + Approve | Create / Edit Own | Create / Comment | Disimpan di `content_ideas` (`IDEA` -> `APPROVED_IDEA` -> `CONVERTED`) |
| **Modul C: Social & Design** | Content Planner | `/content/planner` | Full Access | Full Access | Create / Edit | Read Brief Context | Form brief & tombol *Assign to Designer* |
| **Modul C: Social & Design** | Design Workspace | `/design/workspace` | Full View | Full View | Read / Comment | Submit / Upload Revision | Fokus antrian brief (`design_briefs`), versi desain, & revision loop |
| **Modul C: Social & Design** | Design Review Queue | `/design/reviews` | Full + Approve/Revise | Full + Approve/Revise | Read / Comment | Hidden (View in Workspace) | Antrian approval khusus PM & Super Admin (`design:submission:approve`) |
| **Modul C: Social & Design** | Asset Library | `/assets` | Full + Delete | Full + Manage Tags | View / Download | View / Download / Upload | Terisi otomatis saat desain berstatus `APPROVED` |
| **Modul C: Social & Design** | Content Analytics | `/content/analytics` | Full + Export | Full + Input | Input & View | View Only | Metrik performa konten (`engagement_rate`, `ctr`) pasca `PUBLISHED` |
| **Modul B: Team & KPI** | Team Directory | `/team` | Full View | Full View | View Active Team | View Active Team | Profil, role, departemen, dan beban kerja ringkas |
| **Modul B: Team & KPI** | Individual Performance | `/team/[userId]` | All Members | Team Members | Own Only (`/team/<self>`) | Own Only (`/team/<self>`) | `AUTO_TCR`, `AUTO_OTDR`, `AUTO_DQS`, `AUTO_CPVS` (drill-down) |
| **Modul B: Team & KPI** | Team KPI Dashboard | `/kpi/dashboard` | Full (Org-Wide) | Team Scope | Hidden | Hidden | Peringkat tren, bottleneck, & distribusi Grade A/B/C/D tim |
| **Modul B: Team & KPI** | KPI Templates & Targets | `/kpi/templates` | Full CRUD | Full CRUD (Team Scope) | Hidden | Hidden | `kpi:template:manage` & `kpi:assignment:manage` (total bobot 100%) |
| **Modul B: Team & KPI** | Monthly Evaluations | `/kpi/evaluations` (+ `/[evaluationId]`) | Review + Finalize | Create + Submit + Review | View Own (Self-Note V1.1) | View Own (Self-Note V1.1) | `FINALIZED` eksklusif `SUPER_ADMIN` & read-only bagi semua |
| **Modul B: Team & KPI** | Reports & Analytics | `/kpi/reports` | Full + Export CSV/PDF | Team + Export CSV/PDF | Hidden | Hidden | Laporan bulanan via `/api/kpi/reports/export` siap rapat Leadership |
| **Modul D: System** | Announcements | `/announcements` | CRUD + Pin/Broadcast | CRUD + Pin/Broadcast | Read & Mark Read | Read & Mark Read | Maks. 3 pengumuman pinned aktif tampil sebagai Top Banner |
| **Modul D: System** | User Management | `/system/users` | Full CRUD + Deactivate | Hidden | Hidden | Hidden | Pengelolaan akun internal, `token_version` revocation, & reset password |
| **Modul D: System** | Roles & Permissions | `/system/roles` | Full View + Matrix Edit | Hidden | Hidden | Hidden | Matriks 42 permission kanonik `module:resource:action` per role |
| **Modul D: System** | Activity Logs | `/system/activity-logs` | Full Org Audit Log | Scoped (Project/Social) | Hidden | Hidden | Append-only immutable trail, filterable + search |
| **Topbar Global** | Notification Center | Popover + `/notifications` | Own Notifications | Own Notifications | Own Notifications | Own Notifications | Badge angka unread polling 30s (`/api/notifications/unread`) + Mark All Read |
| **Topbar Global** | Quick Create (`+`) | Modal / Drawer | Task, Project, Idea, Ann. | Task, Project, Idea, Ann. | Task (Own), Idea, Plan | Idea, Design Upload | Aksi cepat kontekstual sesuai hak akses role |

#### 1.3 Layout Wireframe Konseptual (Desktop-First Productivity Shell)

KTMS menggunakan tata letak **3-Zone Workspace** dengan **Right Slide-Over Drawer** agar anggota tim dapat meninjau detail task, memberikan catatan revisi desain, atau memeriksa histori aktivitas tanpa kehilangan konteks tampilan Kanban Board atau Content Calendar.

```text
+---------------------------------------------------------------------------------------------------+
| [Pinned Announcement Banner - Optional]  [!] Pengumuman: Evaluasi KPI Bulan Ini Ditutup Tgl 28  [x]|
+------------------+--------------------------------------------------------------------------------+
|  KREVIA KTMS     |  Breadcrumb: Social & Design / Design Workspace       [Ctrl+K Search...]  [+]  |
|  [Collapse <<]   |                                                         [Bell (3)]  [Avatar v] |
+------------------+--------------------------------------------------------------------------------+
|  MAIN            |  HEADER CANVAS                                                                 |
|  * Dashboard     |  Design Workspace & Review Queue                     [List] [Kanban] [Calendar]|
|                  |  Filter: [All Projects v] [Status v] [Assignee v] [Priority v]  [Reset Filter] |
|  TASK MGMT       +-------------------------------------------------+------------------------------+
|  * My Tasks  (5) |  PRIMARY WORKSPACE CANVAS                       |  SLIDE-OVER DETAIL DRAWER    |
|  * Projects      |  (Kanban Columns / Data Table / Calendar Grid)  |  (Width: 520px, Overlay/Push)|
|  * Kanban Board  |                                                 |                              |
|  * Work Calendar |  +---------------+  +---------------+           |  [DESIGN_TASK] #KTMS-142     |
|                  |  | IN_PROGRESS   |  | IN_REVIEW (2) |           |  IG Carousel: Promo Q4       |
|  SOCIAL & DESIGN |  +---------------+  +---------------+           |  Status: [DESIGN_REVIEW v]   |
|  * Content Cal.  |  | [URGENT]      |  | [HIGH]   <=== |===Active=>|  Version: [v2 - Latest v]    |
|  * Content Ideas |  | Reel Launch   |  | IG Carousel   |           |  --------------------------- |
|  * Planning      |  | Due: 22 Nov   |  | v2 Submitted  |           |  [Preview Image / Figma Link]|
|  > Design Wkspc  |  | @Nta-Design   |  | @Yoga-PM      |           |  Brief & Copywriting Summary |
|  * Asset Library |  +---------------+  +---------------+           |  Linked Task: #KTMS-142      |
|  * Analytics     |                                                 |  --------------------------- |
|                  |  +---------------+  +---------------+           |  [Approve & Save to Assets]  |
|  TEAM & KPI      |  | REVISION (1)  |  | DONE (8)      |           |  [Request Revision]          |
|  * Directory     |  +---------------+  +---------------+           |  --------------------------- |
|  * My Perf.      |  | [MEDIUM]      |  | [LOW]         |           |  Tab: [Comments] [History]   |
|  * KPI Dashboard |  | Banner Web    |  | LinkedIn Post |           |  - Yoga (PM): "Perbesar CTA" |
|  * Evaluations   |  | Rev #2 (!!)   |  | On-Time OK    |           |  - System: v2 uploaded 10:15 |
|                  |  +---------------+  +---------------+           |                              |
|  SYSTEM          |                                                 |                              |
|  * Announcements |                                                 |                              |
|  * Users & Roles |                                                 |                              |
|  * Activity Logs |                                                 |                              |
+------------------+-------------------------------------------------+------------------------------+
```

**Aturan Responsivitas (Desktop-First Guardrails):**
* **Desktop (`>= 1280px`):** Sidebar kiri `240px` (dapat diperkecil ke mode icon-only `64px`), Kanban menampilkan 4–5 kolom secara horizontal nyaman, Slide-Over Drawer `520px` terbuka di sisi kanan tanpa mereset posisi scroll canvas.
* **Laptop Compact (`1024px – 1279px`):** Sidebar otomatis *compact* (`64px`) saat Slide-Over Drawer terbuka agar area konten tetap leluasa.
* **Tablet & Mobile Browser (`< 1024px`):** Sidebar berubah menjadi *collapsible sheet*, Kanban Board menyediakan tombol toggle cepat ke **Grouped List View** agar pengguna tetap bisa memperbarui status tanpa kesulitan *horizontal drag* di layar sentuh.

#### 1.4 Prinsip UX Utama & Standar Komponen Visual

1. **Zero-Context-Loss Productivity (Slide-Over Drawer):** Membuka detail Task, Content Plan, Design Review, atau User Profile selalu menggunakan **Slide-Over Drawer** (disinkronkan dengan URL query seperti `?drawer=task&id=<uuid>` sehingga tautan bisa dibagikan langsung lewat chat internal).
2. **URL-Driven Shareable Filters:** Filter pada Kanban, Work Calendar, Content Calendar, dan Activity Logs disimpan di URL `searchParams` (`?project=...&assignee=...&status=...`) sehingga saat PM membagikan link rapat, seluruh tim melihat *view* yang persis sama.
3. **Optimistic UI dengan Rollback Aman:** Aksi berfrekuensi tinggi (drag-and-drop kartu Kanban, centang sub-checklist, *mark notification as read*) langsung memperbarui UI secara instan; apabila server mengembalikan error (misal `403 Forbidden` atau `409 Version Conflict`), state otomatis dikembalikan (*rollback*) disertai toast notifikasi yang jelas.
4. **Keyboard & Quick-Action First:**
   * `Ctrl+K` / `Cmd+K`: Membuka Command Palette (cari Project, Task `#KTMS-xxx`, Content Item, anggota tim, atau lompat ke halaman).
   * `C`: Quick Create Task (saat fokus tidak berada di input teks).
   * `Esc`: Menutup Slide-Over Drawer atau Modal aktif.
5. **Standar Semantic Status Badges (Konsisten di Seluruh 4 Modul):**

| Entitas | Status Enum | Label UI | Warna Badge (Tailwind Token) | Ikon / Penanda Visual |
| :--- | :--- | :--- | :--- | :--- |
| **Task** | `BACKLOG` | Backlog | `slate` (`bg-slate-100 text-slate-700`) | Dot abu-abu |
| **Task** | `TODO` | To Do | `zinc` (`bg-zinc-100 text-zinc-800`) | Lingkaran kosong |
| **Task** | `IN_PROGRESS` | In Progress | `blue` (`bg-blue-100 text-blue-700`) | Lingkaran progres aktif |
| **Task** | `IN_REVIEW` | In Review | `amber` (`bg-amber-100 text-amber-800`) | Ikon mata / review |
| **Task** | `REVISION` | Needs Revision | `rose` (`bg-rose-100 text-rose-700`) | Panah putar balik |
| **Task** | `DONE` | Done | `emerald` (`bg-emerald-100 text-emerald-700`) | Centang hijau |
| **Task** | `CANCELLED` | Cancelled | `neutral` (`bg-neutral-200 text-neutral-500 line-through`) | Ikon silang |
| **Priority** | `URGENT` / `HIGH` / `MEDIUM` / `LOW` | Urgent / High / Medium / Low | `red` / `orange` / `sky` / `slate` | Flag / chevron prioritas |
| **Content** | `IDEA` -> `APPROVED_IDEA` | Idea / Approved | `violet` / `indigo` | Bohlam / centang |
| **Content** | `PLANNING` -> `IN_DESIGN` | Planning / In Design | `sky` / `blue` | Pensil / palet warna |
| **Content** | `DESIGN_REVIEW` / `DESIGN_REVISION` | Design Review / Revision | `amber` / `rose` | Preview / catatan revisi |
| **Content** | `READY_TO_PUBLISH` / `SCHEDULED` / `PUBLISHED` | Ready / Scheduled / Published | `teal` / `cyan` / `emerald` | Siap / jam / centang ganda |
| **Content** | `ARCHIVED` | Archived | `slate` (`bg-slate-100 text-slate-500`) | Kotak arsip |
| **Design** | `PENDING_BRIEF` / `IN_PROGRESS` / `SUBMITTED` | Pending / Working / Submitted | `slate` / `blue` / `amber` | Versi badge `v1`, `v2`, dst. |
| **Design** | `REVISION_REQUESTED` / `APPROVED` | Revision Req. / Approved | `rose` / `emerald` | Counter revisi `(Rev #n)` |
| **KPI Eval** | `DRAFT` / `SUBMITTED` / `REVIEWED` / `FINALIZED` | Draft / Submitted / Reviewed / Finalized | `slate` / `blue` / `amber` / `emerald` + Lock icon | Ikon gembok pada `FINALIZED` |

---

### 2. End-to-End User Flows (4 Skenario Operasional Harian Krevia)

Setiap skenario di bawah ini menyajikan: (1) **Flowchart Operasional** untuk keselarasan bisnis Leadership & tim, (2) **Sequence Diagram Teknis** untuk implementasi Server Actions, transaksi database, RBAC, dan sinkronisasi UI oleh Yoga & Nta, serta (3) **Aturan Kritis & Edge Cases**.

---

#### 2.1 Skenario 1 — Siklus Hidup Project & Task Management (Kanban Board, Work Calendar, Deadline Alert & Reassignment)

**Ringkasan Bisnis:** Menjamin tidak ada lagi tugas operasional yang tercecer di grup chat. Setiap project dipecah menjadi task dengan PIC tunggal (`assignee_id`), prioritas, dan tenggat jelas yang langsung tersinkronisasi di **My Tasks**, **Kanban Board**, dan **Work Calendar**, lengkap dengan peringatan deadline otomatis serta prosedur *reassignment* yang transparan.

##### Diagram 1A — End-to-End Operational Flowchart (Project, Task Execution, Review & Escalation)

```mermaid
flowchart TD
    START(["PM atau Super Admin Membuat Project Baru"]) --> MEMBERS["Tambah Project Members & Target Timeline"]
    MEMBERS --> CREATE_TASK["Buat Task Baru (Title, Type, Priority, Due Date, Checklist)"]
    CREATE_TASK --> ASSIGN{"Assignee Ditentukan?"}
    ASSIGN -->|"Belum"| BACKLOG["Simpan di Status BACKLOG"]
    ASSIGN -->|"Ya"| TODO["Simpan di Status TODO + Notif ke Assignee"]

    BACKLOG --> ASSIGN_LATER["PM Assign PIC & Pindah ke TODO"]
    ASSIGN_LATER --> TODO

    TODO --> SYNC_VIEW["Task Tampil di My Tasks, Kanban Board & Work Calendar"]
    SYNC_VIEW --> START_WORK["Assignee Mulai Kerja (Drag ke IN_PROGRESS)"]
    START_WORK --> DEADLINE_CHECK{"Pantauan Deadline (H-2 / H-0 / Overdue)?"}

    DEADLINE_CHECK -->|"Aman / On-Track"| SUBMIT_REVIEW["Assignee Selesaikan Checklist & Pindah ke IN_REVIEW (Set first_submitted_at)"]
    DEADLINE_CHECK -->|"H-2, H-0 atau Overdue"| ALERT["Kirim Deadline Alert 08:00 WIB ke Assignee & PM + Badge Merah di Calendar"]
    ALERT --> REASSIGN_DECISION{"Perlu Reassignment atau Perpanjangan?"}
    REASSIGN_DECISION -->|"Reassign ke Anggota Lain"| REASSIGN["PM Ubah Assignee (Catat Audit Log + Notif PIC Lama & Baru)"]
    REASSIGN --> START_WORK
    REASSIGN_DECISION -->|"Lanjut oleh PIC Sama"| SUBMIT_REVIEW

    SUBMIT_REVIEW --> PM_REVIEW{"Review oleh PM atau Super Admin"}
    PM_REVIEW -->|"Perlu Perbaikan"| REVISION["Status REVISION + Wajib Catatan Revisi + Notif Assignee"]
    REVISION --> START_WORK
    PM_REVIEW -->|"Disetujui"| DONE["Status DONE + Set completed_at & Hitung is_on_time (effective_completion_time)"]

    DONE --> KPI_FEED["Feed Metrik Individual Performance & Catat Activity Log"]
    KPI_FEED --> END_NODE(["Task Selesai & Progress Project Terupdate Otomatis"])
```

##### Diagram 1B — Technical Sequence Diagram (Kanban Drag-and-Drop, Concurrency Guard & Reassignment)

```mermaid
sequenceDiagram
    actor User as Staff / PM (Browser)
    participant UI as Kanban UI (TanStack Query)
    participant SA as Server Action (moveTask / reassignTask)
    participant RBAC as RBAC & Transition Guard
    participant DB as PostgreSQL (Prisma Transaction)
    participant SYS as Notification & Audit Service

    User->>UI: Drag kartu Task ke kolom IN_REVIEW atau DONE
    UI->>UI: Optimistic update posisi kartu & status lokal
    UI->>SA: Invoke moveTaskAction(taskId, targetStatus, newOrder, expectedVersion)
    SA->>RBAC: Validasi Session, Role & Aturan Transisi Status

    alt Role tidak berhak memindahkan ke DONE
        RBAC-->>SA: Throw 403 Forbidden (Hanya PM atau Super Admin)
        SA-->>UI: ActionResult error (FORBIDDEN_TRANSITION)
        UI->>UI: Rollback posisi kartu Kanban + Toast Error
    else Akses Valid
        SA->>DB: Begin Prisma Transaction
        DB->>DB: SELECT task WHERE id = taskId FOR UPDATE
        alt Version tidak cocok (Concurrent Edit)
            DB-->>SA: Throw 409 Conflict (Stale Task Version)
            SA-->>UI: ActionResult error (CONFLICT_VERSION)
            UI->>UI: Rollback + Refetch Kanban Board terbaru
        else Version Cocok
            DB->>DB: UPDATE tasks SET status, position, version = version + 1, first_submitted_at, completed_at
            DB->>SYS: Insert activity_logs (old_values, new_values JSONB)
            DB->>SYS: Insert notifications (TASK_SUBMITTED_REVIEW ke PM, TASK_REVISION_REQUESTED/TASK_COMPLETED ke Assignee)
            DB-->>SA: Commit Transaction sukses
            SA-->>UI: ActionResult success (Updated Task + Project Progress %)
            UI->>UI: Invalidate cache My Tasks, Kanban, Work Calendar
        end
    end
```

**Aturan Operasional & Edge Cases Kunci Skenario 1:**
* **Pemisahan Wewenang Penyelesaian (`DONE`):** Untuk menjaga kualitas kerja Krevia Digital, `STAFF_CREATOR` dan `DESIGNER` memindahkan task sampai `IN_REVIEW` (yang otomatis mencatat `first_submitted_at = COALESCE(first_submitted_at, NOW())`). Hanya `PROJECT_MANAGER` atau `SUPER_ADMIN` yang dapat mengesahkan ke `DONE` (`tasks:item:approve`) atau mengembalikan ke `REVISION` (kecuali untuk task personal non-project yang dibuat sendiri oleh user tanpa reviewer, sesuai flag `requires_review = false`).
* **Deteksi Deadline Tanpa Infrastruktur Berat:** Pengecekan deadline dijalankan melalui **Scheduled Cron Endpoint** (`/api/cron/deadline-alerts` dilindungi `CRON_SECRET`, setiap pagi pukul **08:00 WIB** dengan idempotency key harian agar tidak spam) dengan eskalasi bertingkat: **H-2 (`TASK_DEADLINE_SOON`)** ke Assignee, **H-0 (`TASK_DEADLINE_TODAY`)** ke Assignee, serta **H+1 & H+3 (`TASK_OVERDUE`)** ke Assignee & PM, dilengkapi indikator visual real-time (`due_date < NOW() AND status NOT IN ('DONE','CANCELLED')`) di UI Kanban & Work Calendar.
* **Reassignment yang Bersih:** Saat PM mengganti `assignee_id` di tengah pengerjaan, task otomatis hilang dari daftar aktif assignee lama, muncul di My Tasks assignee baru, memicu notifikasi `TASK_REASSIGNED` ke kedua belah pihak, dan mencatat `old_assignee_id -> new_assignee_id` di `activity_logs`.

---

#### 2.2 Skenario 2 — Siklus Lengkap Konten Media Sosial & Design Workspace (Idea s/d Performance Analytics)

**Ringkasan Bisnis:** Menggantikan spreadsheet jadwal konten dan koordinasi file desain via chat. Skenario ini menghubungkan **Content Ideas**, **Content Calendar**, **Design Workspace**, **Asset Library**, serta **Task Management** dalam satu alur terintegrasi tanpa input ganda.

##### Diagram 2A — End-to-End Operational Flowchart (Social Media & Design Pipeline)

```mermaid
flowchart TD
    S0(["Ide Konten Masuk oleh Creator / Designer / PM"]) --> S1["Simpan di content_ideas (Status: IDEA)"]
    S1 --> S2{"Review Ide oleh PM atau Super Admin"}
    S2 -->|"Ditolak"| S_ARCH["Status content_ideas: ARCHIVED + Catatan Alasan"]
    S2 -->|"Disetujui"| S3["content_ideas: APPROVED_IDEA lalu Promosi CONVERTED ke content_items"]

    S3 --> S4["Content Planning di Content Calendar (Channel, Format, Copy, planned_publish_at)"]
    S4 --> S5["Status content_items: PLANNING + Buat Design Brief"]
    S5 --> S6{"Butuh Aset Visual dari Designer?"}

    S6 -->|"Tidak (requires_design = false)"| S_READY_DIRECT["Auto-Spawn Task CONTENT_PRODUCTION ke Status READY_TO_PUBLISH"]
    S6 -->|"Ya (Assign Designer)"| S7["Auto-Spawn Unified Tasks: DESIGN_TASK & CONTENT_PRODUCTION"]

    S7 --> S8["Content: IN_DESIGN, DesignBrief: PENDING_BRIEF ke IN_PROGRESS"]
    S8 --> S9["Designer Kerjakan & Submit File Upload / Link Figma-Canva (v1 ke design_submissions)"]
    S9 --> S10["Content: DESIGN_REVIEW, DesignBrief & Sub: SUBMITTED, Task: IN_REVIEW"]

    S10 --> S11{"Design Approval oleh PM / Super Admin"}
    S11 -->|"Request Revision"| S12["Wajib Isi Revision Notes + Increment revision_count"]
    S12 --> S13["Content: DESIGN_REVISION, DesignBrief & Sub: REVISION_REQUESTED, Task: REVISION"]
    S13 --> S14{"Jumlah Revisi 3x atau Lebih?"}
    S14 -->|"Ya"| S15["Flag Bottleneck Warning di Dashboard PM + Notif Designer"]
    S14 -->|"Tidak"| S16["Notif Revisi ke Designer"]
    S15 --> S9
    S16 --> S9

    S11 -->|"Approved"| S17["DesignBrief & Sub: APPROVED, Content: READY_TO_PUBLISH, Design Task: DONE"]
    S17 --> S18["Auto-Save Aset Final ke Asset Library (Tags, Campaign, Versi)"]
    S18 --> S19["Creator Jadwalkan Konten ke Status SCHEDULED"]
    S_READY_DIRECT --> S19

    S19 --> S20["Konten Tayang & Input Live Post URL ke Status PUBLISHED"]
    S20 --> S21["Auto-Complete Linked Task CONTENT_PRODUCTION ke DONE"]
    S21 --> S22["Input Metrik Content Performance Analytics (H+3 / H+7 / Bulanan)"]
    S22 --> S23(["Data Tampil di Content Analytics & KPI Creator/Designer"])
```

##### Diagram 2B — Technical Sequence Diagram (Auto-Spawn Task, Upload/Link Submission, Approval & Asset Library Auto-Save)

```mermaid
sequenceDiagram
    actor Creator as Staff Creator / PM
    actor Designer as Designer
    participant API as Next.js Actions & Storage API
    participant DB as PostgreSQL (Prisma Tx)
    participant Store as Object Storage (S3/Supabase)
    participant Log as Notification & Audit Service

    Note over Creator,DB: Fase 1 - Content Planning & Auto-Spawn Unified Tasks
    Creator->>API: assignDesignBriefAction(contentItemId, briefData, designerId, designDueDate)
    API->>DB: Begin Tx - Insert design_briefs (status: PENDING_BRIEF) & update content_items = IN_DESIGN
    DB->>DB: Upsert linked Task (type: DESIGN_TASK, assignee: designerId, design_brief_id)
    DB->>DB: Upsert linked Task (type: CONTENT_PRODUCTION, assignee: creatorId, content_item_id)
    DB->>Log: Audit Log + Notif DESIGN_BRIEF_ASSIGNED ke Designer
    DB-->>API: Commit Tx sukses
    API-->>Creator: Tampilkan link Task & status IN_DESIGN di Content Calendar

    Note over Designer,Store: Fase 2 - Design Workspace Submission (Upload atau External Link)
    Designer->>API: Request Presigned Upload URL (/api/uploads/presign, TTL 300s) jika upload file
    API-->>Designer: Presigned PUT URL (Validasi MIME png/jpg/webp/svg/pdf/mp4, max 25MB)
    Designer->>Store: Direct PUT file ke Object Storage
    Store-->>Designer: File URL tersimpan
    Designer->>API: submitDesignAction(briefId, fileUrlOrExternalLink, designerNotes)
    API->>DB: Begin Tx - Insert design_submissions (version = prev + 1, status: SUBMITTED)
    DB->>DB: Update design_briefs = SUBMITTED, content_items = DESIGN_REVIEW
    DB->>DB: Sync linked DESIGN_TASK = IN_REVIEW (set first_submitted_at jika NULL)
    DB->>Log: Audit Log + Notif DESIGN_SUBMITTED ke PM/Reviewer
    DB-->>API: Commit Tx sukses

    Note over Creator,Log: Fase 3 - Design Approval + Auto-Save Asset Library + KPI Signal
    Creator->>API: reviewDesignAction(submissionId, decision: APPROVED, feedback)
    API->>DB: Begin Tx - Update design_submissions & design_briefs = APPROVED
    DB->>DB: Sync content_items = READY_TO_PUBLISH
    DB->>DB: Sync linked DESIGN_TASK = DONE (set completed_at, hitung is_on_time via effective_completion_time)
    DB->>DB: Insert record baru ke tabel assets (Asset Library Auto-Save)
    DB->>Log: Audit Log + Notif DESIGN_APPROVED & CONTENT_READY_TO_PUBLISH ke Designer & Creator
    DB-->>API: Commit Tx sukses
    API-->>Creator: UI Drawer update + Toast "Disetujui & Tersimpan ke Asset Library"
```

##### Diagram 2C — State Machine Sinkronisasi Content Item (`ContentStatus`)

```mermaid
stateDiagram-v2
    [*] --> IDEA
    IDEA --> APPROVED_IDEA : PM atau Super Admin Approve (di content_ideas)
    IDEA --> ARCHIVED : Ditolak atau Tidak Relevan (di content_ideas)
    APPROVED_IDEA --> PLANNING : Promosi CONVERTED ke content_items (linked idea_id)
    PLANNING --> IN_DESIGN : Assign Design Brief (Auto-Spawn DESIGN_TASK)
    PLANNING --> READY_TO_PUBLISH : Tanpa Kebutuhan Desain (requires_design = false)
    IN_DESIGN --> DESIGN_REVIEW : Designer Submit Versi (v1..vN ke design_submissions)
    DESIGN_REVIEW --> DESIGN_REVISION : PM Request Revision (Wajib Notes min 10 char)
    DESIGN_REVISION --> DESIGN_REVIEW : Designer Submit Revisi Baru
    DESIGN_REVIEW --> READY_TO_PUBLISH : PM Approve (Auto-Save Asset & Task DONE)
    READY_TO_PUBLISH --> SCHEDULED : Creator Jadwalkan di Platform
    SCHEDULED --> PUBLISHED : Konfirmasi Tayang + Live URL
    READY_TO_PUBLISH --> PUBLISHED : Publish Langsung + Live URL
    PUBLISHED --> ARCHIVED : Arsip Kampanye Selesai
    ARCHIVED --> [*]
```

**Aturan Operasional & Edge Cases Kunci Skenario 2:**
* **Pemisahan Tabel `content_ideas` vs `content_items` & `design_briefs` vs `design_submissions`:** Ide awal disimpan pada `content_ideas` (`IDEA` -> `APPROVED_IDEA` / `ARCHIVED`); ketika dipromosikan ke kalender konten (`CONVERTED`), sistem membuat record baru di `content_items` (`PLANNING`, tertaut `idea_id`). Sementara itu, `design_briefs.status` melacak seluruh siklus `PENDING_BRIEF -> IN_PROGRESS -> SUBMITTED -> REVISION_REQUESTED / APPROVED`, sedangkan record pada `design_submissions` **hanya dibuat saat Designer menyerahkan file/link versi `v1..vN`** (`SUBMITTED`) sehingga tidak pernah ada record submission kosong (*placeholder*).
* **Hybrid Asset Storage:** Designer bebas memilih (a) unggah file langsung (`PNG`, `JPG`, `WEBP`, `SVG` dilayani sebagai *attachment*, `PDF`, `MP4` maks. `25 MB` via presigned PUT URL ber-TTL `300s / 5 menit` agar tidak membebani memori server Next.js; file `> 25 MB` wajib memakai tautan eksternal) atau (b) menempelkan tautan eksternal tervalidasi (`Figma`, `Canva`, `Google Drive`, `Frame.io`). Keduanya tetap tercatat berversi (`v1`, `v2`, `v3`) dan terpromosi otomatis ke **Asset Library** saat berstatus `APPROVED`.
* **Pencegahan Revisi Tanpa Arah:** Sistem menolak aksi *Request Revision* jika kolom `revision_notes` kosong (minimal 10 karakter) agar Designer mendapat arahan yang jelas dan terukur.
* **Integritas Anti-Duplikasi Task:** Jika brief desain diperbarui (misal perubahan deadline atau pergantian designer), sistem **memperbarui** record task `DESIGN_TASK` yang sudah tertaut (`design_brief_id`) alih-alih membuat task duplikat baru.

---

#### 2.3 Skenario 3 — Penetapan KPI Bulanan, Agregasi Otomatis Individual Performance, Monthly Evaluation & Reporting

**Ringkasan Bisnis:** Menghilangkan bias subjektif dan proses hitung manual di spreadsheet setiap akhir bulan. Metrik objektif (ketepatan waktu task, rasio penyelesaian, kualitas revisi desain) dihitung otomatis dari aktivitas nyata harian di KTMS, lalu digabungkan dengan evaluasi kualitatif PM dan kalibrasi final oleh Leadership.

##### Diagram 3A — End-to-End Operational Flowchart (KPI Setup, Auto-Aggregation, Review & Finalize)

```mermaid
flowchart TD
    K1(["Awal Periode: Super Admin atau PM Setup KPI Template & Bobot per Role"]) --> K2{"Total Bobot Indikator = 100%?"}
    K2 -->|"Tidak"| K_ERR["Blokir Simpan & Tampilkan Selisih Bobot"]
    K_ERR --> K1
    K2 -->|"Ya"| K3["Assign KPI Target Bulanan ke Setiap Anggota Tim Aktif"]

    K3 --> K4["Sepanjang Bulan: Tim Menjalankan Task & Workflow Konten/Desain"]
    K4 --> K5["Sistem Hitung Real-Time Individual Performance Dashboard"]

    K5 --> K6["Akhir Bulan: PM atau Super Admin Generate Monthly Evaluations (Status: DRAFT)"]
    K6 --> K7["Auto-Populate Snapshot Metrik Objektif (AUTO_TCR, AUTO_OTDR, AUTO_DQS, AUTO_CPVS)"]
    K7 --> K8["PM Isi Skor Kualitatif & Submit Evaluasi (Status: SUBMITTED; Self-Reflection V1.1)"]
    K8 --> K9["PM atau Super Admin Review Skor & Feedback (Status: REVIEWED)"]

    K9 --> K10{"Kalibrasi oleh Super Admin di Team KPI Dashboard"}
    K10 -->|"Perlu Revisi Penilaian PM"| K11["Kembalikan ke Status DRAFT atau SUBMITTED + Catatan"]
    K11 --> K9
    K10 -->|"Disetujui"| K12["Finalize Evaluasi (Status: FINALIZED & Immutable Lock)"]

    K12 --> K13["Kirim Notifikasi Hasil Evaluasi ke Karyawan & Catat Activity Log"]
    K13 --> K14["Tersedia di Reports & Analytics (Export CSV / Print PDF Summary)"]
    K14 --> K_END(["Siklus Evaluasi Bulanan Selesai"])
```

##### Diagram 3B — Technical Sequence Diagram (Auto-Aggregation Snapshot, Review & Finalization Lock)

```mermaid
sequenceDiagram
    actor PM as Project Manager
    actor Admin as Super Admin (Leadership)
    participant API as Next.js KPI Server Actions
    participant Agg as Performance Aggregation Service
    participant DB as PostgreSQL (Prisma Tx)
    participant Sys as Notification & Audit Service

    Note over PM,DB: Fase 1 - Generate Draft Evaluasi & Snapshot Metrik Objektif
    PM->>API: generateMonthlyEvaluationsAction(periodMonth 2026-11)
    API->>DB: Cek apakah periode sudah punya draft per active user
    API->>Agg: computeUserMetrics(userId, startDate, endDate)
    Agg->>DB: Query tasks (TCR & OTDR via effective_completion_time / first_submitted_at)
    Agg->>DB: Query design_briefs APPROVED (DQS, avg_revision_count, FPAR)
    Agg->>DB: Query content_items SCHEDULED/PUBLISHED (CPVS via planned_publish_at/published_at)
    Agg-->>API: Return auto_metrics_snapshot JSONB + autoCalculatedScore
    API->>DB: Begin Tx - Insert monthly_evaluations (DRAFT) + evaluation_items
    DB->>Sys: Audit Log GENERATE_EVALUATION_BATCH + Notif KPI_EVALUATION_OPEN
    DB-->>API: Commit Tx sukses
    API-->>PM: Tampilkan daftar Draft Evaluasi siap diisi

    Note over PM,DB: Fase 2 - PM Submit & Review ke Leadership
    PM->>API: reviewEvaluationAction(evalId, qualitativeScores, evaluatorNotes)
    API->>DB: Validasi status saat ini bukan FINALIZED & evaluator_id != user_id
    DB->>DB: Kalkulasi weighted_kpi_score (0-100, Grade A/B/C/D) & UPDATE status = REVIEWED
    DB->>Sys: Audit Log + Notif KPI_EVALUATION_SUBMITTED ke Super Admin
    DB-->>API: Sukses

    Note over Admin,Sys: Fase 3 - Finalisasi & Immutable Lock oleh Super Admin
    Admin->>API: finalizeEvaluationAction(evalId, leadershipNotes)
    API->>DB: Begin Tx - Validasi role SUPER_ADMIN (kpi:evaluation:finalize) & status = REVIEWED
    DB->>DB: Re-freeze auto_metrics_snapshot + UPDATE status = FINALIZED, finalized_at = NOW()
    DB->>Sys: Audit Log (immutable) + Notif KPI_EVALUATION_FINALIZED ke Karyawan
    DB-->>API: Commit Tx sukses
    API-->>Admin: UI menampilkan ikon Gembok (Read-Only) & aktifkan tombol Export Report
```

**Formula Transparan & Mekanisme Anti-Drift (Reproducible Metrics):**
* **Auto-Metrics Snapshot (`auto_metrics_snapshot`):** Saat evaluasi masuk `FINALIZED`, seluruh angka sumber (`AUTO_TCR`, `AUTO_OTDR` berbasis `effective_completion_time`, `AUTO_DQS = ROUND(AVG(GREATEST(40, 100 - 15 * revision_count)), 2)` + `avg_revision_count` & `FPAR`, `AUTO_CPVS = MIN(100.00, ROUND((C_delivered / C_target) * 100, 2))`, serta `MANUAL_SCORE` skala `0–100`) dan `weighted_kpi_score` (`0.00–100.00`, 4 Grade: **A** `90–100`, **B** `80–89.99`, **C** `70–79.99`, **D** `0–69.99`) dibekukan dalam kolom JSONB `auto_metrics_snapshot` pada tabel `monthly_evaluations`. Bila sebuah task dari bulan lalu dibuka kembali atau diarsipkan di bulan berikutnya, nilai historis rapor bulan yang sudah ditutup **tidak pernah berubah**.
* **Fallback `N/A` & Weight Re-Normalization:** Apabila denominator indikator otomatis bernilai nol (misal anggota baru belum memiliki task/brief/konten selesai pada bulan tersebut), sistem menyimpan nilai `NULL` (ditampilkan `N/A`, **bukan** `0.00`) agar tidak menghukum secara tidak adil, lalu secara otomatis menormalisasi bobot indikator aktif yang memiliki skor menggunakan rumus `ROUND(SUM(S_k * w_k) / SUM(w_k), 2)`.

---

#### 2.4 Skenario 4 — Lintas Modul: Notification Center (In-App), Announcements Broadcast & Activity Logs (Audit Trail)

**Ringkasan Bisnis:** Memastikan koordinasi cepat tanpa *noise* berlebihan sekaligus menghadirkan akuntabilitas penuh (*governance*). Pengumuman penting Leadership tersemat di bagian atas layar dengan bukti keterbacaan, notifikasi kerja terpusat di lonceng aplikasi, dan setiap perubahan data tercatat permanen untuk audit.

##### Diagram 4A — Cross-Module Event Flow (Notification Center, Announcements & Audit Trail)

```mermaid
flowchart LR
    subgraph SOURCES["Event Triggers dari 4 Modul"]
        E1["Modul A: Task Assign, Status Change, Comment, Deadline Alert"]
        E2["Modul B: KPI Assigned, Evaluation Reviewed & Finalized"]
        E3["Modul C: Idea Approved, Brief Assigned, Design Submit/Revise/Approve"]
        E4["Modul D: User Role Changed, Announcement Broadcast"]
    end

    subgraph CORE["Unified Service Layer (Prisma Transaction)"]
        DISPATCH["Domain Event & Audit Dispatcher"]
        AUDIT_WR["Write Immutable Activity Log (old_values / new_values)"]
        NOTIF_WR["Resolve Target Recipients & Deduplicate"]
        ANN_WR["Publish Announcement + Set Pinned Flag"]
    end

    subgraph STORAGE["PostgreSQL Tables"]
        T_LOG[("activity_logs (Append-Only)")]
        T_NOTIF[("notifications")]
        T_ANN[("announcements & announcement_reads")]
    end

    subgraph UI_OUT["Tampilan Pengguna (Next.js Client)"]
        U_BELL["Topbar Notification Bell (Badge & Actionable Link)"]
        U_BANNER["Topbar Pinned Announcement Banner + Read Receipt"]
        U_AUDIT["Activity Logs Explorer (Filter Modul, Actor, Tanggal)"]
    end

    E1 --> DISPATCH
    E2 --> DISPATCH
    E3 --> DISPATCH
    E4 --> DISPATCH

    DISPATCH --> AUDIT_WR --> T_LOG --> U_AUDIT
    DISPATCH --> NOTIF_WR --> T_NOTIF --> U_BELL
    E4 --> ANN_WR --> T_ANN --> U_BANNER
```

##### Diagram 4B — Technical Sequence Diagram (Transactional Audit Trail, Announcement Broadcast & Client Sync)

```mermaid
sequenceDiagram
    actor Leader as Super Admin / PM
    actor Team as Anggota Tim (Browser)
    participant SA as Server Action (publishAnnouncement)
    participant API as Route Handler (/api/notifications)
    participant DB as PostgreSQL (Prisma Tx)

    Note over Leader,DB: Alur 1 - Broadcast Pengumuman Pinned + Audit Trail
    Leader->>SA: publishAnnouncementAction(title, body, priority, isPinned, targetRoles)
    SA->>DB: Begin Tx - Validasi permission system:announcement:manage
    DB->>DB: INSERT announcements (published_at = NOW(), is_pinned = true)
    DB->>DB: Bulk INSERT notifications ke semua active users sesuai targetRoles
    DB->>DB: INSERT activity_logs (action: ANNOUNCEMENT_PUBLISHED, new_values)
    DB-->>SA: Commit Tx sukses
    SA-->>Leader: Toast "Pengumuman dipublikasikan ke N anggota"

    Note over Team,DB: Alur 2 - Client Polling Notification Center & Read Receipt
    Team->>API: GET /api/notifications/unread (TanStack Query interval 30s atau window focus)
    API->>DB: Query unread notifications count + active pinned announcements belum dibaca
    DB-->>API: Return unreadCount, latestItems[], activePinnedBanner
    API-->>Team: Update Badge Lonceng & Tampilkan Pinned Banner di atas Workspace

    Team->>SA: markAnnouncementReadAction(announcementId)
    SA->>DB: UPSERT announcement_reads (announcement_id, user_id, read_at = NOW())
    DB-->>SA: Sukses
    SA-->>Team: Banner hilang dari layar user & counter "Dibaca oleh X/Y" di sisi PM bertambah
```

##### Diagram 4C — State Machine Ringkas Task (`TaskStatus`) untuk Referensi Notifikasi & KPI

```mermaid
stateDiagram-v2
    [*] --> BACKLOG
    [*] --> TODO : Dibuat Langsung dengan Assignee
    BACKLOG --> TODO : Assign PIC & Jadwalkan
    TODO --> IN_PROGRESS : Assignee Mulai Pengerjaan
    IN_PROGRESS --> IN_REVIEW : Ajukan Review
    IN_REVIEW --> REVISION : PM Request Revision
    REVISION --> IN_PROGRESS : Assignee Mulai Perbaikan
    REVISION --> IN_REVIEW : Assignee Submit Ulang
    IN_REVIEW --> DONE : PM atau Super Admin Approve
    TODO --> DONE : Quick Complete (Khusus Task Non-Review oleh PM/Admin)
    IN_PROGRESS --> DONE : Direct Complete (Khusus PM/Admin)
    BACKLOG --> CANCELLED : Dibatalkan oleh PM atau Super Admin
    TODO --> CANCELLED : Dibatalkan oleh PM atau Super Admin
    IN_PROGRESS --> CANCELLED : Dibatalkan oleh PM atau Super Admin
    REVISION --> CANCELLED : Dibatalkan oleh PM atau Super Admin
    DONE --> IN_PROGRESS : Reopen oleh PM atau Super Admin (Catat Audit Log)
    DONE --> [*]
    CANCELLED --> [*]
```

---

### 3. Use Case Specifications Lengkap (14 Use Case Utama — Modul A s/d D)

Seluruh Use Case di bawah ini dirancang langsung untuk menjadi acuan *acceptance testing* bagi Leadership dan *implementation spec* bagi Yoga & Nta.

---

#### UC-01: Membuat Project Baru & Mengelola Anggota Project

* **Modul & Route:** Modul A — Task Management (`/projects`, `/projects/[projectId]`)
* **Aktor Utama:** `SUPER_ADMIN`, `PROJECT_MANAGER`
* **Aktor Pendukung:** `STAFF_CREATOR`, `DESIGNER` (sebagai anggota yang ditambahkan & penerima notifikasi)
* **Pre-conditions:**
  1. Aktor telah login dengan sesi aktif dan memiliki permission `tasks:project:create` / `tasks:project:update`.
  2. Minimal terdapat 1 user internal berstatus aktif untuk ditugaskan sebagai anggota project.
* **Post-conditions:**
  * **Success:** Record `projects` dan `project_members` tersimpan di database; anggota menerima in-app notification; `activity_logs` mencatat `PROJECT_CREATED`; project muncul di daftar filter Kanban Board dan Work Calendar.
  * **Failure:** Transaksi dibatalkan (*rollback*), tidak ada data parsial tersimpan, pesan validasi tampil pada form.
* **Main Success Flow:**
  1. Aktor membuka halaman `/projects` dan mengklik tombol **+ New Project** (atau via Topbar Quick Action `+`).
  2. Sistem membuka Slide-Over Drawer / Modal form Project (Nama Project, Kode Unik misal `KRV-Q4`, Deskripsi, Kategori, Start Date, Target End Date, Project Lead, dan Daftar Anggota).
  3. Aktor mengisi data wajib dan memilih anggota tim dari *multi-select* Team Directory.
  4. Aktor mengklik **Create Project**.
  5. Sistem memvalidasi payload menggunakan Zod, memastikan `end_date >= start_date`, menyimpan `projects` & `project_members` dalam satu Prisma transaction, menulis `activity_logs`, dan mengirim notifikasi ke seluruh anggota yang dipilih.
  6. Sistem menutup drawer, menampilkan toast sukses, dan mengarahkan aktor ke halaman detail project (`/projects/[projectId]`).
* **Alternative Flows:**
  * **AF-1 (Archive Project):** Saat project selesai atau dihentikan, PM/Super Admin mengubah status project menjadi `ARCHIVED`; project disembunyikan dari filter aktif Kanban namun tetap tersimpan untuk histori dan KPI.
  * **AF-2 (Tambah/Hapus Anggota di Tengah Project):** PM menambahkan anggota baru kapan saja melalui tab *Members*. Anggota baru langsung mendapat visibilitas terhadap seluruh task pada project tersebut.
* **Exception / Error Flows:**
  * **EF-1 (Unauthorized Role — `403`):** Jika `STAFF_CREATOR` atau `DESIGNER` mengakses endpoint pembuatan project secara langsung, RBAC guard menolak dengan `403 Forbidden`.
  * **EF-2 (Kode Project Duplikat — `409`):** Jika kode project sudah dipakai, form menampilkan inline error *"Kode project sudah digunakan, gunakan kode lain."*
  * **EF-3 (Rentang Tanggal Tidak Valid — `400`):** Jika `end_date < start_date`, form menolak submit sebelum menyentuh server dan memvalidasi ulang di server.
  * **EF-4 (Menghapus Anggota yang Masih Memiliki Task Aktif):** Sistem menampilkan konfirmasi peringatan yang mencantumkan jumlah task aktif milik anggota tersebut serta opsi memindahkan (*reassign*) atau tetap melepas keanggotaan.

---

#### UC-02: Membuat, Mengassign & Memantau Task di My Tasks & Work Calendar

* **Modul & Route:** Modul A — Task Management (`/tasks/my-tasks`, `/tasks/calendar`, `/projects/[projectId]`)
* **Aktor Utama:** `PROJECT_MANAGER`, `SUPER_ADMIN` (create & assign ke siapa saja); `STAFF_CREATOR`, `DESIGNER` (memantau My Tasks & membuat sub-task/personal task jika diizinkan)
* **Aktor Pendukung:** Anggota tim yang ditugaskan (`assignee_id`)
* **Pre-conditions:**
  1. User terautentikasi dan memiliki akses ke project target.
  2. Project target berstatus aktif (bukan `ARCHIVED`).
* **Post-conditions:**
  * **Success:** Record `tasks` (`task_type = GENERAL`) tersimpan lengkap dengan `task_checklists` (jika ada), muncul secara real-time di **My Tasks** assignee, **Kanban Board** project, dan **Work Calendar** pada tanggal `due_date`; notifikasi `TASK_ASSIGNED` terkirim; `activity_logs` tercatat.
  * **Failure:** Task tidak dibuat; pesan error spesifik tampil tanpa menghilangkan input form yang sudah diketik user.
* **Main Success Flow:**
  1. Aktor mengklik **+ New Task** (atau menekan tombol keyboard `C`).
  2. Sistem menampilkan drawer form pembuatan task (Project, Judul Task, Deskripsi, `task_type`, Priority, Assignee, Start Date, Due Date, Checklist awal).
  3. Aktor mengisi rincian task dan memilih `assignee_id` serta `due_date`.
  4. Aktor menekan **Save Task**.
  5. Sistem memvalidasi input, menetapkan status awal `TODO` (jika assignee terisi) atau `BACKLOG` (jika assignee kosong), menyimpan record ke `tasks`, mengirim notifikasi ke assignee, dan mencatat `TASK_CREATED` di `activity_logs`.
  6. Assignee membuka `/tasks/my-tasks` (dikelompokkan berdasarkan *Overdue*, *Due Today*, *Upcoming*, *In Review*) atau `/tasks/calendar` (tampilan Mingguan/Bulanan) dan langsung melihat task baru tersebut.
* **Alternative Flows:**
  * **AF-1 (Quick Create dari Work Calendar):** Aktor mengklik sel tanggal tertentu di Work Calendar -> form task terbuka dengan `due_date` terisi otomatis sesuai tanggal yang diklik.
  * **AF-2 (Filter Multi-Dimensi):** User menyaring My Tasks atau Work Calendar berdasarkan `task_type` (`GENERAL` / `CONTENT_PRODUCTION` / `DESIGN_TASK`), prioritas, atau project; filter tersimpan di URL `searchParams`.
* **Exception / Error Flows:**
  * **EF-1 (Assign ke User Non-Anggota Project):** Dropdown assignee otomatis memfilter anggota project aktif; jika payload dimanipulasi ke user luar project atau user non-aktif (`is_active = false`), server mengembalikan `400 Bad Request`.
  * **EF-2 (Due Date di Masa Lalu):** Jika aktor memilih `due_date` sebelum hari ini, sistem menampilkan *soft warning* (kuning) *"Tenggat waktu berada di masa lalu. Lanjutkan?"* agar migrasi task lama tetap memungkinkan namun mencegah salah ketik.
  * **EF-3 (Staff Mencoba Assign ke Orang Lain):** `STAFF_CREATOR` / `DESIGNER` tanpa permission `tasks:item:assign` hanya dapat mengisi `assignee_id = diri sendiri`; upaya assign ke user lain ditolak `403 Forbidden`.

---

#### UC-03: Mengelola Progres Task via Kanban Board Drag-and-Drop & Reassignment

* **Modul & Route:** Modul A — Task Management (`/tasks/board`)
* **Aktor Utama:** `SUPER_ADMIN`, `PROJECT_MANAGER`, `STAFF_CREATOR`, `DESIGNER`
* **Aktor Pendukung:** Reviewer (`PROJECT_MANAGER`), Assignee baru (pada kasus reassignment)
* **Pre-conditions:**
  1. User berada di halaman Kanban Board pada project yang dapat diakses.
  2. Terdapat minimal satu task pada kolom aktif (`BACKLOG`, `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `REVISION`, `DONE`).
* **Post-conditions:**
  * **Success:** Status dan urutan posisi (`position`) kartu tersimpan di database dengan `version` terinkremen (dan `first_submitted_at` terisi saat pertama kali masuk `IN_REVIEW`); tampilan My Tasks & Work Calendar ikut terbarui; notifikasi & audit log tercatat.
  * **Failure:** Posisi kartu di Kanban dikembalikan (*optimistic rollback*) ke kolom asal disertai toast penjelasan.
* **Main Success Flow:**
  1. User menyaring Kanban Board (misal per project atau per assignee).
  2. User menarik (*drag*) kartu task dari kolom `TODO` dan melepaskannya (*drop*) ke kolom `IN_PROGRESS` (atau dari `IN_PROGRESS` ke `IN_REVIEW`).
  3. UI Kanban langsung memindahkan kartu secara optimistik.
  4. Client memanggil Server Action `moveTaskAction` membawa `taskId`, `targetStatus`, `newPosition`, dan `expectedVersion`.
  5. Server memverifikasi RBAC, aturan matriks transisi status, dan `expectedVersion` (optimistic locking).
  6. Server memperbarui `tasks` (termasuk `first_submitted_at = COALESCE(first_submitted_at, NOW())` saat masuk `IN_REVIEW`), menaikkan `version`, menulis `activity_logs` (`TASK_STATUS_CHANGED`), dan mengirim notifikasi `TASK_SUBMITTED_REVIEW` bila transisi memasuki `IN_REVIEW`.
  7. Server mengembalikan data terbaru dan client menyinkronkan cache TanStack Query.
* **Alternative Flows:**
  * **AF-1 (Akses Detail Tanpa Tinggalkan Kanban):** User mengklik badan kartu -> **Slide-Over Drawer** terbuka di sisi kanan untuk mencentang checklist, menulis komentar (`@mention`), melampirkan link, atau mengubah status via dropdown (penting untuk aksesibilitas keyboard & layar kecil).
  * **AF-2 (Reassignment Task oleh PM):** PM membuka Slide-Over Drawer pada task yang mengalami hambatan, mengganti `Assignee` ke anggota lain, lalu menyimpan -> sistem memicu notifikasi `TASK_REASSIGNED` ke PIC lama (*"Task dipindahkan ke..."*) dan PIC baru (*"Anda ditugaskan pada..."*) serta mencatat audit log.
  * **AF-3 (Task Terhubung Konten/Desain):** Jika user mencoba memindahkan `DESIGN_TASK` langsung ke `DONE` di Kanban tanpa melalui Design Approval di Modul C, sistem menampilkan petunjuk langsung (*deep link* ke `/design/reviews`) untuk menyelesaikannya melalui **Design Review Drawer** agar status `ContentItem` dan `AssetLibrary` tetap sinkron.
* **Exception / Error Flows:**
  * **EF-1 (Concurrent Kanban Drag-and-Drop Conflict — `409`):** Jika 2 pengguna menggeser kartu yang sama bersamaan, request kedua mendeteksi `version !== expectedVersion`. Server menolak dengan `409 Conflict`, UI melakukan *rollback* otomatis, merefresh board, dan menampilkan toast *"Task baru saja diperbarui oleh pengguna lain. Tampilan telah disegarkan."*
  * **EF-2 (Transisi Dilarang oleh Role — `403`):** Jika `STAFF_CREATOR` atau `DESIGNER` menarik kartu langsung ke kolom `DONE` pada task yang memerlukan review PM, server menolak dengan `403`, UI melakukan rollback dan menampilkan toast *"Pindahkan ke In Review agar disetujui oleh Project Manager."*
  * **EF-3 (Koneksi Terputus / Network Timeout):** Client membatalkan optimistic state setelah timeout dan menampilkan toast *"Gagal menyimpan perubahan. Periksa koneksi internet Anda."*

---

#### UC-04: Review Hasil Task, Permintaan Revisi & Penanganan Deadline Alert

* **Modul & Route:** Modul A — Task Management (`/tasks/board`, `/tasks/calendar`, Notification Popover)
* **Aktor Utama:** `PROJECT_MANAGER`, `SUPER_ADMIN`
* **Aktor Pendukung:** Assignee (`STAFF_CREATOR`, `DESIGNER`), System Scheduler (Deadline Job)
* **Pre-conditions:**
  1. Task berada pada status `IN_REVIEW` (untuk proses review) atau mendekati/melewati `due_date` dengan status belum `DONE`/`CANCELLED` (untuk proses deadline alert).
* **Post-conditions:**
  * **Success (Approve):** Status task menjadi `DONE`, `completed_at` terisi timestamp server, flag `is_on_time` dihitung secara adil menggunakan `effective_completion_time` (`CASE WHEN revision_count = 0 THEN COALESCE(first_submitted_at, completed_at) ELSE completed_at END <= due_date`), progres project meningkat, dan data siap diagregasi ke Modul B KPI.
  * **Success (Revision):** Status task berubah ke `REVISION`, `revision_count` bertambah +1, catatan revisi tersimpan sebagai komentar berlabel `REVISION_NOTE`, dan assignee menerima notifikasi `TASK_REVISION_REQUESTED`.
  * **Failure:** Status task tetap pada kondisi sebelumnya; error ditampilkan di drawer.
* **Main Success Flow:**
  1. Reviewer menerima notifikasi `TASK_SUBMITTED_REVIEW` (*"Task #KTMS-xxx siap direview"*) dan mengkliknya -> sistem langsung membuka Slide-Over Drawer task terkait.
  2. Reviewer memeriksa daftar checklist, lampiran/tautan hasil kerja, serta komentar assignee.
  3. Reviewer memilih tombol **Approve & Mark Done**.
  4. Sistem menjalankan transaksi: mengubah status `IN_REVIEW -> DONE`, mengisi `completed_at = NOW()`, menghitung `is_on_time` berbasis `effective_completion_time`, mencatat `activity_logs`, dan mengirim notifikasi `TASK_COMPLETED` ke assignee.
* **Alternative Flows:**
  * **AF-1 (Request Revision):** Reviewer memilih **Request Revision**, mengisi alasan/poin perbaikan (wajib minimal 10 karakter), lalu menekan submit -> status berubah ke `REVISION`, `revision_count` bertambah +1, dan notifikasi `TASK_REVISION_REQUESTED` dikirim ke assignee.
  * **AF-2 (Otomasi Deadline Alert H-2, H-0 & Overdue):** Setiap hari pukul **08:00 WIB**, endpoint cron `/api/cron/deadline-alerts` memindai task aktif yang belum `DONE`/`CANCELLED` dengan eskalasi bertingkat: **H-2 (`TASK_DEADLINE_SOON`)** ke assignee, **H-0 (`TASK_DEADLINE_TODAY`)** ke assignee, serta **H+1 & H+3 (`TASK_OVERDUE`)** ke assignee + PM (dengan pencegahan duplikasi harian per task). Di Work Calendar dan My Tasks, kartu overdue otomatis menampilkan badge merah `Overdue X Hari`.
* **Exception / Error Flows:**
  * **EF-1 (Catatan Revisi Kosong — `400`):** Sistem menonaktifkan tombol submit revisi dan memvalidasi di server jika catatan kurang dari 10 karakter.
  * **EF-2 (Review Task yang Sudah Diubah/Dibatalkan — `409`):** Jika task sudah diubah menjadi `CANCELLED` atau `DONE` sebelum tombol diklik, server menolak dengan pesan status terkini.

---

#### UC-05: Mengelola Team Directory & Memantau Individual Performance Dashboard

* **Modul & Route:** Modul B — Team Management & KPI (`/team`, `/team/[userId]`)
* **Aktor Utama:** `SUPER_ADMIN`, `PROJECT_MANAGER`, `STAFF_CREATOR`, `DESIGNER`
* **Aktor Pendukung:** Sistem Agregasi Performa (Service Layer)
* **Pre-conditions:**
  1. User sudah login.
  2. Data user aktif dan histori task operasional tersedia di PostgreSQL.
* **Post-conditions:**
  * **Success:** User melihat direktori tim sesuai hak akses dan metrik performa individu yang akurat berdasarkan periode bulan yang dipilih.
  * **Failure:** Menampilkan state error yang aman tanpa membocorkan data performa milik user lain yang tidak berhak dilihat.
* **Main Success Flow:**
  1. User membuka `/team` untuk melihat kartu/tabel anggota tim Krevia Digital (Nama, Foto/Inisial, Role, Departemen/Jabatan, Status Aktif, Jumlah Task Aktif saat ini).
  2. User membuka `/team/[userId]` (untuk dirinya sendiri via sidebar, atau PM/Super Admin mengklik nama anggota di Team Directory).
  3. User memilih filter periode bulan (default: bulan berjalan).
  4. Sistem mengagregasi secara real-time dari tabel `tasks`, `design_briefs`, dan `content_items`:
     * **Task Completion Rate (`AUTO_TCR`, %)**
     * **On-Time Delivery Rate (`AUTO_OTDR`, % berbasis `effective_completion_time`)**
     * **Total Tasks Completed vs Overdue**
     * **Design Quality Score (`AUTO_DQS`, `avg_revision_count`, & `FPAR`)** dari `design_briefs` `APPROVED` (khusus role `DESIGNER`)
     * **Content Production Volume Score (`AUTO_CPVS`)** dari `content_items` berstatus `SCHEDULED`/`PUBLISHED` (khusus role `STAFF_CREATOR`)
  5. Sistem menampilkan KPI Summary Cards, grafik tren 3–6 bulan terakhir, serta tabel rincian task yang menjadi dasar perhitungan (drill-down transparan).
* **Alternative Flows:**
  * **AF-1 (Self-View untuk Staff & Designer):** Saat `STAFF_CREATOR` atau `DESIGNER` membuka menu performa, sistem otomatis mengarahkan dan mengunci konteks ke `/team/[ownUserId]` sehingga mereka dapat memantau pencapaian pribadinya kapan saja tanpa bisa melihat skor rekan lain.
* **Exception / Error Flows:**
  * **EF-1 (Horizontal Privilege Escalation — `403`):** Jika `STAFF_CREATOR` atau `DESIGNER` mencoba mengakses URL `/team/[userId-orang-lain]` secara manual, Server Component / API memblokir dan merespons `403 Forbidden` (redirect ke performa diri sendiri dengan toast peringatan).
  * **EF-2 (Belum Ada Data Aktivitas di Bulan Terpilih):** Dashboard menampilkan *Empty State* informatif (*"Belum ada task selesai pada periode ini"*) dan metrik bernilai `NULL` (ditampilkan `N/A`, bukan `0.00%`) sehingga aman dari pembagian nol.

---

#### UC-06: Mengonfigurasi Template KPI & Penetapan Bobot KPI Bulanan

* **Modul & Route:** Modul B — Team Management & KPI (`/kpi/templates`)
* **Aktor Utama:** `SUPER_ADMIN` (penuh seluruh organisasi), `PROJECT_MANAGER` (kelola template & assignment KPI tim sesuai scope)
* **Aktor Pendukung:** Seluruh anggota tim (penerima penetapan target bulanan)
* **Pre-conditions:**
  1. Aktor memiliki permission `kpi:template:manage` dan `kpi:assignment:manage` (`SUPER_ADMIN` & `PROJECT_MANAGER`).
  2. Periode bulan target belum ditutup/difinalisasi.
* **Post-conditions:**
  * **Success:** `kpi_templates` dan `kpi_assignments` tersimpan dengan total bobot tepat `100%`; perubahan tercatat di `activity_logs`; anggota tim menerima notifikasi penetapan target KPI bulan berjalan.
  * **Failure:** Perubahan bobot ditolak; konfigurasi lama tetap berlaku utuh.
* **Main Success Flow:**
  1. `SUPER_ADMIN` atau `PROJECT_MANAGER` membuka `/kpi/templates` dan memilih tab **KPI Templates by Role** (misal template khusus `DESIGNER`, `STAFF_CREATOR`, `PROJECT_MANAGER`).
  2. Aktor menambah/mengedit komponen indikator menggunakan sumber metrik kanonik (`AUTO_TCR`, `AUTO_OTDR`, `AUTO_DQS`, `AUTO_CPVS`, dan `MANUAL_SCORE` dengan unit `SCORE_100` skala `0–100`) — contoh default `DESIGNER`: `AUTO_TCR` 25%, `AUTO_OTDR` 25%, `AUTO_DQS` 30%, `MANUAL_SCORE` 20%.
  3. Sistem menampilkan indikator akumulasi bobot secara langsung (*real-time weight meter*).
  4. Setelah total bobot mencapai tepat `100%`, aktor menekan **Save & Apply to Active Period** (atau menggunakan fitur *Clone Previous Month* untuk mempercepat setup bulanan).
  5. Sistem memvalidasi di server bahwa `SUM(weight) === 100`, menyimpan `kpi_templates` & menghasilkan/memperbarui `kpi_assignments` untuk anggota aktif pada periode terkait, lalu mencatat `activity_logs`.
* **Alternative Flows:**
  * **AF-1 (Override Target Individu):** `SUPER_ADMIN` atau `PROJECT_MANAGER` dapat menyesuaikan target numerik spesifik (misal target volume konten `C_target` bulanan) untuk satu anggota tertentu (contoh: anak magang atau karyawan baru) tanpa mengubah template global role.
* **Exception / Error Flows:**
  * **EF-1 (Total Bobot Tidak Sama Dengan 100% — `400`):** Tombol simpan dinonaktifkan di UI dan ditolak di server dengan pesan *"Total bobot seluruh indikator harus tepat 100% (saat ini: X%)."*
  * **EF-2 (Edit Template pada Periode yang Sudah Finalized — `409`):** Perubahan template hanya berlaku untuk periode berjalan/mendatang dan tidak boleh mengubah struktur bobot pada evaluasi bulan lalu yang sudah berstatus `FINALIZED`.

---

#### UC-07: Menjalankan Siklus Monthly KPI Evaluation (Auto-Aggregate, Review, Finalize) & Export Report

* **Modul & Route:** Modul B — Team Management & KPI (`/kpi/evaluations`, `/kpi/evaluations/[evaluationId]`, `/kpi/dashboard`, `/kpi/reports`)
* **Aktor Utama:** `SUPER_ADMIN` (kalibrasi & finalize), `PROJECT_MANAGER` (generate, isi penilaian, submit & review)
* **Aktor Pendukung:** `STAFF_CREATOR`, `DESIGNER` (penerima hasil evaluasi; self-reflection bersifat opsional / V1.1 `MOS-22`)
* **Pre-conditions:**
  1. Konfigurasi KPI periode bulan terkait sudah aktif (UC-06).
  2. Periode evaluasi telah dibuka oleh PM atau Super Admin.
* **Post-conditions:**
  * **Success:** `monthly_evaluations` berstatus `FINALIZED` dengan `auto_metrics_snapshot` dan `weighted_kpi_score` (`0.00–100.00`, Grade A/B/C/D) terkunci permanen; karyawan menerima notifikasi `KPI_EVALUATION_FINALIZED`; data teragregasi ke **Team KPI Dashboard** dan dapat diekspor ke CSV / Print-Friendly PDF via `/api/kpi/reports/export`.
  * **Failure:** Status evaluasi tidak berubah; peringatan ditampilkan.
* **Main Success Flow:**
  1. Di akhir bulan, PM atau Super Admin membuka `/kpi/evaluations`, memilih periode (misal `2026-11`), dan mengklik **Generate Monthly Evaluations** (`kpi:evaluation:create`).
  2. Sistem secara otomatis membuat record `DRAFT` untuk setiap anggota aktif, mengisi metrik objektif otomatis (`AUTO_TCR`, `AUTO_OTDR`, `AUTO_DQS`, `AUTO_CPVS`) ke `auto_metrics_snapshot`, dan mengirim notifikasi `KPI_EVALUATION_OPEN`.
  3. **Pengisian & Submit (`DRAFT -> SUBMITTED`):** Pada V1, PM membuka `/kpi/evaluations/[evaluationId]`, meninjau metrik otomatis beserta daftar task bukti, melengkapi skor indikator `MANUAL_SCORE` (`0–100`) dan `evaluator_notes`, lalu menekan **Submit Evaluation** (`DRAFT -> SUBMITTED`, notifikasi `KPI_EVALUATION_SUBMITTED`). *(Catatan: alur Employee Self-Reflection via `self_assessment_notes` bersifat opsional / diprioritaskan pada V1.1 `MOS-22`, sehingga pada V1 PM tidak terblokir menunggu input karyawan).*
  4. **Review & Kalibrasi (`SUBMITTED -> REVIEWED`):** `PROJECT_MANAGER` atau `SUPER_ADMIN` memverifikasi kelengkapan penilaian, sistem menghitung `weighted_kpi_score` (`0.00–100.00`, menerapkan *weight re-normalization* bila ada metrik `N/A`) beserta Grade (`A` `90–100`, `B` `80–89.99`, `C` `70–79.99`, `D` `0–69.99`), lalu menandai `REVIEWED`.
  5. **Finalisasi (`REVIEWED -> FINALIZED`):** `SUPER_ADMIN` (eksklusif, `kpi:evaluation:finalize`) meninjau perbandingan lintas tim di `/kpi/dashboard`, menambahkan catatan Leadership (opsional), lalu menekan **Finalize & Lock Evaluation**.
  6. Sistem membekukan `auto_metrics_snapshot`, mengunci record menjadi *read-only*, mencatat `KPI_EVALUATION_FINALIZED` di `activity_logs`, dan mengirim notifikasi `KPI_EVALUATION_FINALIZED` ke anggota tim.
  7. Leadership atau PM membuka `/kpi/reports` dan menekan **Export CSV** atau **Export PDF Summary** (`/api/kpi/reports/export`) untuk arsip rapat bulanan.
* **Alternative Flows:**
  * **AF-1 (Employee Self-Reflection Opsional / V1.1 `MOS-22`):** Apabila fitur self-reflection diaktifkan, anggota tim dapat menuliskan *Self-Reflection & Key Achievements* pada status `DRAFT` sebelum evaluasi dilanjutkan ke `SUBMITTED` dan `REVIEWED`.
  * **AF-2 (Kalibrasi Dikembalikan oleh Super Admin):** Jika `SUPER_ADMIN` menilai skor PM kurang sesuai bukti task, Super Admin mengklik **Return to PM** (`REVIEWED -> SUBMITTED`) disertai catatan kalibrasi.
* **Exception / Error Flows:**
  * **EF-1 (Upaya Mengedit Evaluasi yang Sudah `FINALIZED` — `423 Locked / 409`):** Seluruh input form menjadi *read-only* di UI; bila ada request mutasi ke server pada evaluasi berstatus `FINALIZED`, server menolaknya secara ketat.
  * **EF-2 (Skor Indikator Di Luar Rentang `0-100` atau Kosong — `400`):** Sistem menolak transisi ke `REVIEWED` bila masih ada indikator `MANUAL_SCORE` yang belum diberi nilai atau bernilai `< 0` / `> 100`.
  * **EF-3 (PM Mencoba Menilai Evaluasi Dirinya Sendiri — `403`):** Evaluasi milik seorang `PROJECT_MANAGER` hanya boleh direview dan difinalisasi oleh `SUPER_ADMIN` (pengecekan `evaluator_id !== user_id` / DB constraint `chk_monthly_eval_no_self`).

---

#### UC-08: Mengajukan, Meninjau & Menyetujui Content Idea

* **Modul & Route:** Modul C — Social Media & Design Management (`/content/ideas`)
* **Aktor Utama:** `STAFF_CREATOR`, `DESIGNER` (pengaju ide); `PROJECT_MANAGER`, `SUPER_ADMIN` (reviewer/approver ide)
* **Aktor Pendukung:** Tim konten yang berdiskusi/upvote di daftar ide
* **Pre-conditions:**
  1. User terautentikasi dengan akses ke Modul C.
* **Post-conditions:**
  * **Success (Approve):** Status record di tabel `content_ideas` berubah `IDEA -> APPROVED_IDEA`; ide muncul di antrian **Ready to Plan** pada Content Planner (dan saat dipromosikan statusnya menjadi `CONVERTED` serta membuat record baru di `content_items` berstatus `PLANNING` dengan `idea_id` tertaut); pengaju ide menerima notifikasi `CONTENT_IDEA_REVIEWED`; `activity_logs` tercatat.
  * **Success (Reject/Archive):** Status `content_ideas` menjadi `ARCHIVED` beserta alasan penolakan.
  * **Failure:** Ide tidak tersimpan atau status tidak berubah.
* **Main Success Flow:**
  1. Aktor membuka `/content/ideas` dan mengklik **+ Submit Idea**.
  2. Aktor mengisi Judul Ide, Platform Target (`INSTAGRAM`, `TIKTOK`, `LINKEDIN`, `YOUTUBE`, `X_TWITTER`, `FACEBOOK`, `WEBSITE_BLOG`), Pillar/Kategori Konten, Deskripsi Hook/Konsep, dan Link Referensi (opsional).
  3. Aktor menekan **Submit Idea** -> sistem menyimpan record pada tabel `content_ideas` dengan status `IDEA` dan mengirim notifikasi ke PM.
  4. `PROJECT_MANAGER` atau `SUPER_ADMIN` membuka Slide-Over Drawer ide tersebut, membaca konsep & referensi, lalu menekan **Approve Idea**.
  5. Sistem mengubah status `content_ideas` ke `APPROVED_IDEA`, mencatat audit log, dan memberi notifikasi `CONTENT_IDEA_REVIEWED` (*"Ide Anda disetujui dan siap dipromosikan ke Content Planner"*) kepada pengaju.
* **Alternative Flows:**
  * **AF-1 (Directly Promote to Calendar / Planner):** Pada saat menekan Approve, PM dapat mencentang opsi *"Langsung promosikan ke Content Planner"* -> sistem otomatis mengubah `content_ideas.status = CONVERTED` dan membuat record `content_items` (`status = PLANNING`, `idea_id`) lalu membuka form Content Planner (UC-09).
  * **AF-2 (Tolak / Arsipkan Ide):** PM memilih **Archive Idea** dengan catatan alasan (misal *"Sudah pernah dibahas bulan lalu"*), status `content_ideas` berubah ke `ARCHIVED`.
* **Exception / Error Flows:**
  * **EF-1 (Staff/Designer Mencoba Approve Ide Sendiri — `403`):** Tombol Approve disembunyikan di UI dan ditolak oleh server guard `social:idea:approve`.
  * **EF-2 (URL Referensi Tidak Valid — `400`):** Validasi Zod memastikan format tautan menggunakan protokol aman `https://` atau `http://` (mencegah `javascript:` XSS payload).

---

#### UC-09: Menyusun Content Plan di Content Calendar & Auto-Spawn Linked Tasks + Design Brief

* **Modul & Route:** Modul C — Social Media & Design Management (`/content/calendar`, `/content/planner`)
* **Aktor Utama:** `STAFF_CREATOR`, `PROJECT_MANAGER`, `SUPER_ADMIN`
* **Aktor Pendukung:** `DESIGNER` (penerima Design Brief & auto-spawned `DESIGN_TASK`)
* **Pre-conditions:**
  1. Ide sudah berstatus `APPROVED_IDEA` di `content_ideas` untuk dipromosikan (`CONVERTED`) ke `content_items` (atau PM/Creator membuat Content Plan baru langsung di `/content/calendar` sesuai permission `social:content:manage`).
  2. Minimal satu Project/Campaign aktif dan user ber-role `DESIGNER` tersedia (jika `requires_design = true`).
* **Post-conditions:**
  * **Success:** Record `content_items` berstatus `PLANNING` atau `IN_DESIGN`; record `design_briefs` (`status = PENDING_BRIEF`) tersimpan (tanpa membuat placeholder `design_submissions`); sistem secara atomik men-spawn linked task (`CONTENT_PRODUCTION` dan/atau `DESIGN_TASK`) pada tabel `tasks` yang otomatis muncul di **My Tasks**, **Kanban Board**, dan **Work Calendar**; notifikasi `DESIGN_BRIEF_ASSIGNED` & audit log tercatat.
  * **Failure:** Transaksi dibatalkan menyeluruh sehingga tidak pernah terjadi Content Plan tanpa Linked Task atau sebaliknya (*all-or-nothing transaction*).
* **Main Success Flow:**
  1. Aktor membuka `/content/calendar` atau `/content/planner` dan memilih item `APPROVED_IDEA` untuk dipromosikan (`CONVERTED` -> buat `content_items` dengan `idea_id`), atau mengklik tanggal di Content Calendar.
  2. Aktor melengkapi detail perencanaan: Project/Campaign, Platform (`social_platform_enum`), Format (`REELS`, `CAROUSEL`, `SINGLE_POST`, `STORY`, `SHORT_VIDEO`, `LONG_VIDEO`, `ARTICLE`, `INFOGRAPHIC`), `planned_publish_at`, Draft Caption/Copywriting, Hashtags, dan PIC Content (`creator_id`).
  3. Aktor mengaktifkan bagian **Design Brief** (`requires_design = true`), mengisi arahan visual, ukuran/rasio, teks di dalam desain, referensi, memilih `DESIGNER`, serta menetapkan `design_due_date`.
  4. Aktor mengklik **Save & Assign to Designer**.
  5. Sistem menjalankan Prisma `$transaction`:
     * Memperbarui `content_items` -> status `IN_DESIGN` (serta menandai `content_ideas.status = CONVERTED` jika berasal dari ide).
     * Menyimpan `design_briefs` dengan `status = PENDING_BRIEF` *(tidak membuat record placeholder pada `design_submissions`; submission baru dibuat ketika Designer mengunggah versi `v1..vN`)*.
     * Membuat/menyinkronkan task `DESIGN_TASK` untuk `DESIGNER` (`due_date = design_due_date`, `content_item_id`, `design_brief_id`).
     * Membuat/menyinkronkan task `CONTENT_PRODUCTION` untuk `STAFF_CREATOR` (`due_date = planned_publish_at`, `content_item_id`).
     * Menulis `activity_logs` dan mengirim notifikasi `DESIGN_BRIEF_ASSIGNED` ke `DESIGNER`.
  6. Content Calendar langsung menampilkan kartu konten pada tanggal tayang dengan badge status `IN_DESIGN` dan tautan langsung ke Linked Task.
* **Alternative Flows:**
  * **AF-1 (Simpan sebagai Draft `PLANNING` Tanpa Assign Designer Dulu):** Aktor menekan **Save Plan Only** -> status tetap `PLANNING`, task desain belum dibuat sampai brief siap ditugaskan.
  * **AF-2 (Konten Tanpa Desain Khusus):** Aktor mematikan toggle *"Membutuhkan Desain Visual"* (`requires_design = false`) -> status langsung berpindah ke `READY_TO_PUBLISH` dan hanya men-spawn task `CONTENT_PRODUCTION`.
  * **AF-3 (Reschedule Jadwal Publish pada Content Calendar):** Pada **V1**, PM/Creator membuka Slide-Over Drawer / Modal detail konten untuk mengubah tanggal `planned_publish_at` -> sistem menyinkronkan `due_date` pada linked `CONTENT_PRODUCTION` task secara otomatis. *(Catatan: drag-and-drop reschedule langsung di grid kalender diprioritaskan pada **V1.1 `MOS-20`**).*
* **Exception / Error Flows:**
  * **EF-1 (Deadline Desain Melewati Tanggal Publish — `400`):** Sistem menolak jika `design_due_date > planned_publish_at` dengan pesan *"Deadline desain harus sebelum atau sama dengan tanggal rencana publish (`planned_publish_at`)."*
  * **EF-2 (Brief Desain Tidak Lengkap saat Assign — `400`):** Jika tombol *Assign to Designer* diklik tanpa mengisi `designer_id`, `visual_direction`, atau `design_due_date`, form menyorot kolom wajib tersebut.
  * **EF-3 (Pencegahan Task Duplikat pada Edit Ulang Brief):** Jika brief yang sudah `IN_DESIGN` diedit dan disimpan ulang, sistem melakukan `UPDATE` pada linked task eksisting berdasarkan `design_brief_id` (dan partial unique index `uq_tasks_active_content_production`), bukan `INSERT` baru.

---

#### UC-10: Mengunggah/Menautkan Hasil Desain di Design Workspace & Proses Design Approval / Revision Loop + Auto-Save Asset Library

* **Modul & Route:** Modul C — Social Media & Design Management (`/design/workspace`, `/design/reviews`)
* **Aktor Utama:** `DESIGNER` (eksekusi & submit desain di `/design/workspace`); `PROJECT_MANAGER`, `SUPER_ADMIN` (review, approve, request revision di `/design/reviews`)
* **Aktor Pendukung:** `STAFF_CREATOR` (penerima notifikasi saat aset siap tayang)
* **Pre-conditions:**
  1. Terdapat `design_briefs` aktif yang ditugaskan kepada `DESIGNER` (`design_briefs.status` = `PENDING_BRIEF`, `IN_PROGRESS`, atau `REVISION_REQUESTED`).
* **Post-conditions:**
  * **Success (Submit):** Record baru `design_submissions` tercipta (`version_number = vN`, `status = SUBMITTED`); `design_briefs.status = SUBMITTED`; `content_items = DESIGN_REVIEW`; linked `DESIGN_TASK = IN_REVIEW` (mencatat `first_submitted_at` jika masih NULL); PM menerima notifikasi `DESIGN_SUBMITTED`.
  * **Success (Approve):** `design_submissions = APPROVED` & `design_briefs = APPROVED`; `content_items = READY_TO_PUBLISH`; linked `DESIGN_TASK = DONE` (dengan `completed_at` & `is_on_time` berbasis `effective_completion_time` untuk KPI Designer); entri aset final otomatis tersimpan di tabel `assets` (Asset Library); notifikasi `DESIGN_APPROVED` & `CONTENT_READY_TO_PUBLISH` terkirim ke Designer & Creator.
  * **Success (Request Revision):** `design_submissions = REVISION_REQUESTED` & `design_briefs = REVISION_REQUESTED`; `revision_count` bertambah +1; `content_items = DESIGN_REVISION`; linked `DESIGN_TASK = REVISION`; notifikasi `DESIGN_REVISION_REQUESTED` terkirim ke Designer.
  * **Failure:** File gagal diunggah atau transaksi status dibatalkan tanpa merusak versi desain sebelumnya.
* **Main Success Flow:**
  1. `DESIGNER` membuka `/design/workspace` dan memilih brief dari antrian kerjanya, lalu menekan **Start Working** (`design_briefs.status`: `PENDING_BRIEF -> IN_PROGRESS`, linked `DESIGN_TASK -> IN_PROGRESS`).
  2. Setelah desain siap, `DESIGNER` memilih metode penyerahan:
     * **Upload File** (drag-and-drop ke dropzone -> client meminta presigned PUT URL ke `/api/uploads/presign` dengan TTL `300s / 5 menit` -> unggah langsung ke Supabase Storage/S3), ATAU
     * **External Link** (menempelkan tautan Figma/Canva/Google Drive; wajib untuk file `> 25 MB`).
  3. `DESIGNER` menambahkan catatan singkat lalu menekan **Submit for Review (v1)** (`design:submission:create`).
  4. Sistem menjalankan transaksi: membuat record `design_submissions` (`version_number = 1`, `status = SUBMITTED`), memperbarui `design_briefs.status = SUBMITTED`, menyinkronkan `content_items = DESIGN_REVIEW` dan linked `DESIGN_TASK = IN_REVIEW` (`first_submitted_at = COALESCE(first_submitted_at, NOW())`), serta mengirim notifikasi `DESIGN_SUBMITTED` ke PM.
  5. `PROJECT_MANAGER` atau `SUPER_ADMIN` membuka `/design/reviews` (atau **Design Review Drawer** yang menampilkan preview gambar/tautan di kiri, brief & histori versi di kanan).
  6. Reviewer mengklik **Approve Design** (`design:submission:approve`).
  7. Dalam satu Prisma transaction, sistem: (a) mengubah `design_submissions` & `design_briefs` ke `APPROVED`, (b) mengubah `content_items` ke `READY_TO_PUBLISH`, (c) menyelesaikan linked `DESIGN_TASK` ke `DONE` + hitung `is_on_time` berbasis `effective_completion_time`, (d) menyalin metadata & file/link final otomatis ke **Asset Library (`assets`)**, (e) menulis `activity_logs`, dan (f) mengirim notifikasi `DESIGN_APPROVED` & `CONTENT_READY_TO_PUBLISH` ke Designer & Content Creator.
* **Alternative Flows:**
  * **AF-1 (Revision Loop):** Pada langkah 6, Reviewer menekan **Request Revision**, mengisi `revision_notes` (wajib min. 10 karakter), dan mengirim -> `design_submissions` & `design_briefs` menjadi `REVISION_REQUESTED`, `revision_count += 1`, Content Item -> `DESIGN_REVISION`, Task -> `REVISION`. Designer memperbaiki lalu mengunggah `v2` (`version_number = 2`, kembali ke langkah 4). Seluruh riwayat versi `v1..vN` tetap tersimpan dan dapat dibandingkan di tab *Version History*.
  * **AF-2 (Peringatan Revisi Berulang `>= 3`):** Bila `revision_count >= 3` pada satu brief, sistem menampilkan badge peringatan kuning/merah *"High Revision Alert (3x)"* di `/design/workspace` & `/design/reviews` dan menyarankan sinkronisasi brief cepat antara PM dan Designer.
* **Exception / Error Flows:**
  * **EF-1 (File Terlalu Besar / MIME Tidak Didukung — `400` / `413`):** Client dan endpoint `/api/uploads/presign` menolak file melebihi batas (`25 MB`; file lebih besar diarahkan ke External Link) atau ekstensi di luar daftar aman (`PNG`, `JPG`, `WEBP`, `SVG` sebagai attachment, `PDF`, `MP4`) dengan pesan ukuran/format yang jelas.
  * **EF-2 (Designer atau Creator Mencoba Approve Desain — `403`):** Guard `design:submission:approve` hanya mengizinkan `PROJECT_MANAGER` dan `SUPER_ADMIN` (serta menolak keras `reviewer_id === designer_id`).
  * **EF-3 (Submit Versi Baru Saat Brief Sudah `APPROVED` — `409`):** Jika brief sudah final disetujui, submission terkunci kecuali PM/Super Admin melakukan *Reopen Brief* secara eksplisit (aset lama di Asset Library ditandai `is_superseded = true` saat versi pengganti disetujui).
  * **EF-4 (Upload ke Object Storage Gagal di Tengah Jalan):** Client menampilkan progress error + tombol *Retry Upload* dan tidak memanggil Server Action `submitDesignAction` agar tidak tercipta record dengan broken file URL.

---

#### UC-11: Mengelola Asset Library & Menginput Content Performance Analytics

* **Modul & Route:** Modul C — Social Media & Design Management (`/assets`, `/content/analytics`, `/content/calendar`)
* **Aktor Utama:** `STAFF_CREATOR`, `PROJECT_MANAGER`, `SUPER_ADMIN`, `DESIGNER`
* **Aktor Pendukung:** —
* **Pre-conditions:**
  1. Untuk Asset Library: terdapat aset hasil auto-save dari Design Approval atau aset referensi yang diunggah manual.
  2. Untuk Content Analytics: Content Item sudah berstatus `PUBLISHED` (atau ditandai tayang terlebih dahulu).
* **Post-conditions:**
  * **Success:** Aset mudah ditemukan lewat pencarian/tag & dapat diunduh via `/api/uploads/download-url`; Content Item berpindah ke `SCHEDULED`/`PUBLISHED` (menyelesaikan task `CONTENT_PRODUCTION` dan berkontribusi ke metrik `AUTO_CPVS`); metrik `content_analytics` tersimpan dengan perhitungan otomatis `engagement_rate` & `ctr` dan tampil di grafik performa konten.
  * **Failure:** Input metrik tidak valid ditolak; tidak ada data korup pada grafik analytics.
* **Main Success Flow (Asset Library & Publishing -> Analytics):**
  1. Setelah desain disetujui (UC-10), `STAFF_CREATOR` mengakses aset final melalui tab Linked Assets atau halaman `/assets` (bisa difilter berdasarkan Project, Kategori `BRAND_KIT`/`SOCIAL_MEDIA`/`CAMPAIGN`/`TEMPLATE`/`PHOTO_VIDEO`/`DOCUMENT`/`OTHER`, Platform, Tags, dan kata kunci).
  2. `STAFF_CREATOR` menjadwalkan konten di platform media sosial, lalu memperbarui status di KTMS ke `SCHEDULED`.
  3. Ketika konten tayang, `STAFF_CREATOR` menekan **Mark as Published**, mengisi `published_url` dan `published_at` -> sistem mengubah status Content Item ke `PUBLISHED` dan secara otomatis menandai linked task `CONTENT_PRODUCTION` sebagai `DONE` (`is_on_time` dihitung terhadap `planned_publish_at`).
  4. Pada H+3 / H+7 atau akhir bulan, `STAFF_CREATOR` atau `PROJECT_MANAGER` membuka `/content/analytics` (atau tab *Analytics* di drawer konten) dan menginput metrik: `reach`, `impressions`, `likes`, `comments`, `shares`, `saves`, `clicks`, `video_views` (opsional), serta tanggal pencatatan (`recorded_date`).
  5. Sistem memvalidasi seluruh angka non-negatif, menghitung otomatis di database:
     * `engagement_rate` (`NUMERIC(6,2)`) = `0.00` jika `reach = 0`, selain itu `ROUND((likes + comments + shares + saves) / reach * 100, 2)`
     * `ctr` (`NUMERIC(6,2)`) = `0.00` jika `impressions = 0`, selain itu `ROUND(clicks / impressions * 100, 2)`
     lalu menyimpan record ke `content_analytics` (`social:analytics:manage`) dan memperbarui grafik performa per platform & top performing content.
* **Alternative Flows:**
  * **AF-1 (Upload Manual Aset Referensi/Brand Kit):** `DESIGNER`, `PROJECT_MANAGER`, atau `SUPER_ADMIN` (`assets:library:manage`) dapat mengunggah aset non-brief (seperti logo Krevia, template brand guideline, stok foto) secara manual ke `/assets` lengkap dengan kategori & tags.
  * **AF-2 (Update Snapshot Metrik Berkala):** Creator dapat mencatat beberapa `recorded_date` untuk satu konten (misal H+1, H+7, H+30) agar tren pertumbuhan konten terlihat pada grafik.
* **Exception / Error Flows:**
  * **EF-1 (Input Analytics pada Konten Belum `PUBLISHED` — `400`):** Tombol input analytics dinonaktifkan dan ditolak server jika status konten belum `PUBLISHED`.
  * **EF-2 (Angka Metrik Negatif atau Denominator Nol):** Server menolak angka negatif (`< 0`); jika `reach = 0` maka `engagement_rate = 0.00`, dan jika `impressions = 0` maka `ctr = 0.00` (aman dari pembagian nol).
  * **EF-3 (Hapus Aset yang Masih Tertaut ke Konten Aktif):** Penghapusan oleh `SUPER_ADMIN` menggunakan *soft delete* (`deleted_at`) dan menampilkan peringatan bila aset masih dipakai pada konten aktif.

---

#### UC-12: Manajemen User, Aktivasi/Deaktivasi Akun & Konfigurasi Role/Permission RBAC

* **Modul & Route:** Modul D — System Management (`/system/users`, `/system/roles`)
* **Aktor Utama:** `SUPER_ADMIN`
* **Aktor Pendukung:** User internal yang dibuat/diubah akunnya
* **Pre-conditions:**
  1. Aktor login dengan role `SUPER_ADMIN` dan permission `system:user:manage` / `system:rbac:manage`.
* **Post-conditions:**
  * **Success:** Akun user dibuat/diperbarui/dinonaktifkan dengan password ter-hash (Argon2id/Bcrypt); sesi valid maks. 7 hari (*sliding*) dan perubahan role/deaktivasi langsung membatalkan sesi lama melalui inkremen `token_version`; perubahan tercatat ketat di `activity_logs`.
  * **Failure:** Tidak ada perubahan hak akses atau status akun; sistem terlindungi dari *self-lockout*.
* **Main Success Flow:**
  1. `SUPER_ADMIN` membuka `/system/users` dan mengklik **+ Add User**.
  2. Aktor mengisi Nama Lengkap, Email Krevia (`@krevia...`), Departemen/Jabatan, Role (`SUPER_ADMIN`, `PROJECT_MANAGER`, `STAFF_CREATOR`, `DESIGNER`), serta Password Awal sementara (flag `must_change_password = true`).
  3. Sistem memvalidasi keunikan email, melakukan hash password, menyimpan user, dan mencatat `USER_CREATED` di `activity_logs`.
  4. Untuk meninjau atau menyesuaikan hak akses, `SUPER_ADMIN` membuka `/system/roles` yang menampilkan **Matriks 42 Permission Kanonik** (`module:resource:action` vs 4 Roles) serta mengaktifkan/menonaktifkan toggle permission yang diperlukan.
  5. Sistem menyimpan perubahan ke tabel `role_permissions` dalam satu transaksi dan mencatat selisih `old_values` vs `new_values` di `activity_logs`.
* **Alternative Flows:**
  * **AF-1 (Deaktivasi User Resign / Cuti Panjang):** `SUPER_ADMIN` menekan **Deactivate User** (bukan hard-delete, agar seluruh histori task, KPI, dan audit log tetap utuh). Sistem menyetel `is_active = false` dan menaikkan `token_version` sehingga sesi login user langsung dicabut (*instant revocation*).
  * **AF-2 (Reset Password Internal):** `SUPER_ADMIN` dapat memicu reset password sementara bagi anggota tim yang lupa kata sandi, menyetel `must_change_password = true` dan menaikkan `token_version`.
* **Exception / Error Flows:**
  * **EF-1 (Anti Self-Lockout Super Admin — `400`):** Sistem melarang `SUPER_ADMIN` menonaktifkan akunnya sendiri, menurunkan role-nya sendiri jika ia adalah satu-satunya `SUPER_ADMIN` aktif, atau mencabut permission `system:rbac:manage` dari role `SUPER_ADMIN`.
  * **EF-2 (Deaktivasi User yang Masih Memegang Task Aktif):** Sistem menampilkan dialog daftar task aktif milik user tersebut dan menyarankan *bulk reassign* ke PM/anggota lain sebelum deaktivasi diselesaikan.
  * **EF-3 (Email Duplikat — `409`):** Sistem menolak pembuatan user dengan email yang sudah terdaftar (case-insensitive).

---

#### UC-13: Memublikasikan Announcements (Pinned/Broadcast) & Memantau Read Receipts

* **Modul & Route:** Modul D — System Management (`/announcements` + Global Topbar Banner)
* **Aktor Utama:** `SUPER_ADMIN`, `PROJECT_MANAGER`
* **Aktor Pendukung:** Seluruh anggota tim aktif (penerima & pembaca pengumuman)
* **Pre-conditions:**
  1. Aktor memiliki permission `system:announcement:manage`.
* **Post-conditions:**
  * **Success:** Pengumuman tersimpan di tabel `announcements`; jika `is_pinned = true`, banner tampil di bagian atas aplikasi seluruh target user; in-app notification `ANNOUNCEMENT_PUBLISHED` terkirim; status keterbacaan tercatat di `announcement_reads`; audit log tercipta.
  * **Failure:** Pengumuman tidak terpublikasi dan tidak ada notifikasi broadcast terkirim.
* **Main Success Flow:**
  1. Aktor membuka `/announcements` (atau Quick Create `+` -> *New Announcement*).
  2. Aktor mengisi Judul, Isi Pengumuman (format teks/markdown sederhana), Tingkat Prioritas (`INFO`, `IMPORTANT`, `URGENT`), Target Audience (`ALL` atau filter per Role), Opsi **Pin to Top Banner**, dan Tanggal Kadaluarsa (`expires_at`, opsional).
  3. Aktor menekan **Publish Announcement**.
  4. Sistem menyimpan `announcements`, men-generate notifikasi broadcast `ANNOUNCEMENT_PUBLISHED` ke seluruh user aktif target, dan mencatat `ANNOUNCEMENT_PUBLISHED` di `activity_logs`.
  5. Seluruh target user melihat Pinned Banner di atas layar dan/atau notifikasi di lonceng. Saat user membuka detail pengumuman dan menekan **Acknowledge / Mark as Read**, sistem mencatat `announcement_reads` (`user_id`, `read_at`).
  6. Aktor pembuat dapat membuka drawer detail pengumuman untuk memantau daftar *"Dibaca oleh X dari Y anggota"* beserta siapa saja yang belum membaca.
* **Alternative Flows:**
  * **AF-1 (Unpin / Archive Pengumuman):** Jika pengumuman sudah tidak relevan, pembuat atau `SUPER_ADMIN` menekan **Unpin** atau **Archive** sehingga banner segera hilang dari seluruh layar tim.
* **Exception / Error Flows:**
  * **EF-1 (Batas Pinned Banner Aktif):** Untuk mencegah layar kerja penuh dengan banner, sistem membatasi maksimal **3 Pinned Announcements aktif** secara bersamaan (bila sudah 3, banner menampilkan switcher/counter atau meminta aktor meng-unpin pengumuman lama terlebih dahulu).
  * **EF-2 (Akses Pembuatan oleh Staff/Designer — `403`):** `STAFF_CREATOR` dan `DESIGNER` hanya dapat membaca dan menandai telah dibaca; aksi create/edit/delete ditolak server.

---

#### UC-14: Membaca Notification Center (In-App) & Mengaudit Activity Logs Lintas Modul

* **Modul & Route:** Modul D — System Management (Topbar Notification Popover, `/notifications`, `/system/activity-logs`)
* **Aktor Utama:** Semua Role (Notification Center pribadi); `SUPER_ADMIN` & `PROJECT_MANAGER` scoped (Activity Logs)
* **Aktor Pendukung:** Sistem Event & Audit Logger
* **Pre-conditions:**
  1. User terautentikasi.
  2. Khusus Activity Logs: aktor memiliki permission `system:audit_log:read` (`SUPER_ADMIN` melihat semua modul; `PROJECT_MANAGER` melihat aktivitas project, task, dan social/design dalam lingkupnya).
* **Post-conditions:**
  * **Success:** Status `is_read` notifikasi diperbarui dan user diarahkan tepat ke entitas/drawer sumbernya (*deep linking*); audit trail dapat difilter, ditelusuri per diff JSON (`old_values` vs `new_values`), dan diekspor oleh `SUPER_ADMIN`.
  * **Failure:** Error muat data ditangani dengan retry state yang ramah tanpa mengganggu halaman utama.
* **Main Success Flow:**
  1. **Notification Center:** User melihat badge jumlah belum dibaca pada ikon Lonceng di Topbar (polling 30s ke `/api/notifications/unread`), mengkliknya untuk membuka popover daftar notifikasi terbaru (tab *All* dan *Unread*).
  2. User mengklik satu item notifikasi (misal *"PM meminta revisi desain v1 pada IG Carousel Q4"*).
  3. Sistem menandai notifikasi tersebut `is_read = true` (`read_at = NOW()`) secara optimistik dan menavigasi user langsung ke route + query drawer target (`/design/workspace?drawer=brief&id=<uuid>` atau `/design/reviews?drawer=brief&id=<uuid>` untuk reviewer).
  4. **Activity Logs:** `SUPER_ADMIN` membuka `/system/activity-logs`, menyaring log berdasarkan Rentang Tanggal, Modul (`TASKS`, `TEAM_KPI`, `SOCIAL_DESIGN`, `SYSTEM`), Aktor (`actor_id`), atau Jenis Aksi (`STATUS_CHANGE`, `APPROVE`, `FINALIZE`, `ROLE_CHANGE`).
  5. Aktor mengklik satu baris log untuk membuka Slide-Over Inspector yang menampilkan perbandingan rapi **Before (`old_values`) vs After (`new_values`)** beserta timestamp (`created_at`) dan metadata teknis.
* **Alternative Flows:**
  * **AF-1 (Mark All as Read):** User menekan tombol **Mark All Read** pada popover untuk mengosongkan seluruh badge unread sekaligus.
  * **AF-2 (Filter Log per Entitas dari Drawer):** Pada tab *History* di dalam Drawer Task atau Content Item, sistem memanggil subset `activity_logs` terfilter berdasarkan `entity_type` & `entity_id` sehingga histori lokal langsung terlihat di konteks kerja.
* **Exception / Error Flows:**
  * **EF-1 (Target Entitas Notifikasi Sudah Diarsipkan/Dihapus — `404`):** Jika user mengklik notifikasi lama yang entitasnya sudah di-soft-delete, sistem tetap menandai notifikasi sebagai terbaca dan menampilkan pesan ramah *"Item ini telah diarsipkan atau dihapus."*
  * **EF-2 (Immutability Enforcement — `405`):** Tabel `activity_logs` bersifat *append-only*. Tidak tersedia endpoint `PATCH/PUT/DELETE` bagi role mana pun (termasuk `SUPER_ADMIN`) untuk mengubah atau menghapus jejak audit.
  * **EF-3 (Akses Activity Logs Global oleh Non-Admin — `403`):** `STAFF_CREATOR` dan `DESIGNER` yang mencoba membuka `/system/activity-logs` akan ditolak oleh RBAC guard `system:audit_log:read`.

---

### 4. Matriks State Transition Lengkap (4 Entitas Inti & Cross-Module Sync)

Bagian ini menjadi kontrak deterministik bagi pengembangan backend (`Service Layer` & `Prisma Transaction`) agar setiap perubahan status selalu divalidasi secara ketat dan memicu side-effect lintas modul yang konsisten.

#### 4.1 Matriks Transisi `TaskStatus` (Modul A — Unified Task Engine)

| Status Awal (`From`) | Status Tujuan (`To`) | Aktor Diizinkan (RBAC) | Trigger / Aksi UI & Guard Condition | Side-Effects Sistem (Sync, Notif, Audit, KPI) |
| :--- | :--- | :--- | :--- | :--- |
| *(New)* | `BACKLOG` | `SUPER_ADMIN`, `PROJECT_MANAGER` | Create Task tanpa `assignee_id` | Audit: `TASK_CREATED`. Tampil di kolom Backlog Kanban. |
| *(New)* | `TODO` | `SUPER_ADMIN`, `PROJECT_MANAGER`, `STAFF_CREATOR` (own), `DESIGNER` (own), atau *System Auto-Spawn* | Create Task dengan `assignee_id` terisi | Audit: `TASK_CREATED`. Notif `TASK_ASSIGNED` ke assignee. Muncul di My Tasks & Work Calendar. |
| `BACKLOG` | `TODO` | `SUPER_ADMIN`, `PROJECT_MANAGER` | Assign `assignee_id` / Drag ke `TODO` (Guard: `assignee_id IS NOT NULL`) | Audit: `TASK_STATUS_CHANGED`. Notif `TASK_ASSIGNED` ke assignee. |
| `TODO` | `IN_PROGRESS` | Assignee (`STAFF_CREATOR`, `DESIGNER`), `PROJECT_MANAGER`, `SUPER_ADMIN` | Drag ke `IN_PROGRESS` atau klik *Start Task* | Set `started_at = COALESCE(started_at, NOW())`. Jika linked `DESIGN_TASK`, sync `design_briefs.status` ke `IN_PROGRESS`. Audit log tercatat. |
| `IN_PROGRESS` | `IN_REVIEW` | Assignee, `PROJECT_MANAGER`, `SUPER_ADMIN` | Drag ke `IN_REVIEW` atau klik *Submit for Review* (untuk `DESIGN_TASK`, dipicu otomatis dari Design Submission) | Set `first_submitted_at = COALESCE(first_submitted_at, NOW())`. Audit: `TASK_SUBMITTED_REVIEW`. Notif `TASK_SUBMITTED_REVIEW` ke Project Manager / Reviewer. |
| `IN_REVIEW` | `REVISION` | `SUPER_ADMIN`, `PROJECT_MANAGER` | Klik *Request Revision* (`tasks:item:approve`, Guard: `revision_notes` wajib >= 10 karakter) | Increment `revision_count`. Audit: `TASK_REVISION_REQUESTED`. Notif `TASK_REVISION_REQUESTED` ke Assignee. |
| `REVISION` | `IN_PROGRESS` | Assignee, `PROJECT_MANAGER`, `SUPER_ADMIN` | Klik *Resume Work* atau Drag ke `IN_PROGRESS` | Audit: `TASK_STATUS_CHANGED`. |
| `REVISION` | `IN_REVIEW` | Assignee, `PROJECT_MANAGER`, `SUPER_ADMIN` | Submit ulang hasil perbaikan | Audit: `TASK_RESUBMITTED_REVIEW`. Notif `TASK_SUBMITTED_REVIEW` ke PM. |
| `IN_REVIEW` | `DONE` | `SUPER_ADMIN`, `PROJECT_MANAGER` (atau System saat Design Approved / Content Published) | Klik *Approve & Done* (`tasks:item:approve`, Guard: untuk `DESIGN_TASK` harus lewat Design Approval) | Set `completed_at = NOW()`, hitung `effective_completion_time = CASE WHEN revision_count = 0 THEN COALESCE(first_submitted_at, completed_at) ELSE completed_at END` & `is_on_time = (effective_completion_time <= due_date)`. Update Project Progress %. Feed KPI `AUTO_TCR`/`AUTO_OTDR`. Notif `TASK_COMPLETED` ke Assignee. Audit log. |
| `TODO` / `IN_PROGRESS` | `DONE` | `SUPER_ADMIN`, `PROJECT_MANAGER` | Quick Complete (hanya untuk task `GENERAL` dengan `requires_review = false` atau override PM/Admin) | Sama seperti transisi `IN_REVIEW -> DONE`. |
| `BACKLOG` / `TODO` / `IN_PROGRESS` / `REVISION` | `CANCELLED` | `SUPER_ADMIN`, `PROJECT_MANAGER` | Klik *Cancel Task* + alasan wajib | Task dikeluarkan dari denominator KPI `AUTO_TCR`. Notif `TASK_STATUS_CHANGED` ke Assignee. Audit log. |
| `DONE` | `IN_PROGRESS` | `SUPER_ADMIN`, `PROJECT_MANAGER` | Klik *Reopen Task* + alasan wajib | Reset `completed_at = NULL` (hanya memengaruhi KPI periode aktif yang belum `FINALIZED`). Notif `TASK_STATUS_CHANGED` ke Assignee. Audit log `TASK_REOPENED`. |

---

#### 4.2 Matriks Transisi `ContentStatus` (Modul C — Social Media Pipeline)

| Status Awal (`From`) | Status Tujuan (`To`) | Aktor Diizinkan (RBAC) | Trigger / Aksi UI & Guard Condition | Side-Effects Sistem (Sync, Notif, Audit, KPI) |
| :--- | :--- | :--- | :--- | :--- |
| *(New di `content_ideas`)* | `IDEA` | Semua Role (`STAFF_CREATOR`, `DESIGNER`, `PROJECT_MANAGER`, `SUPER_ADMIN`) | Submit form *New Content Idea* | Simpan di `content_ideas` (`status = IDEA`). Audit: `CONTENT_IDEA_CREATED`. Notif ke PM untuk review ide. |
| `IDEA` *(di `content_ideas`)* | `APPROVED_IDEA` | `SUPER_ADMIN`, `PROJECT_MANAGER` | Klik *Approve Idea* (`social:idea:approve`) | Update `content_ideas.status = APPROVED_IDEA`. Audit: `CONTENT_IDEA_APPROVED`. Notif `CONTENT_IDEA_REVIEWED` ke pengaju ide. |
| `IDEA` *(di `content_ideas`)* | `ARCHIVED` | `SUPER_ADMIN`, `PROJECT_MANAGER` | Klik *Reject / Archive Idea* + alasan | Update `content_ideas.status = ARCHIVED`. Audit: `CONTENT_ARCHIVED`. Notif `CONTENT_IDEA_REVIEWED` ke pengaju ide. |
| `APPROVED_IDEA` *(Promosi `CONVERTED`)* | `PLANNING` *(di `content_items`)* | `STAFF_CREATOR`, `PROJECT_MANAGER`, `SUPER_ADMIN` | Promosi ide & simpan detail Content Plan (Platform, Format, `planned_publish_at`, Copy Draft) | Update `content_ideas.status = CONVERTED` + Insert `content_items` (`status = PLANNING`, linked `idea_id`). Audit: `CONTENT_PLANNED`. Muncul di `/content/calendar`. |
| `PLANNING` | `IN_DESIGN` | `STAFF_CREATOR`, `PROJECT_MANAGER`, `SUPER_ADMIN` | Klik *Assign Design Brief* (Guard: `designer_id`, `visual_direction`, `design_due_date <= planned_publish_at`) | **Cross-Module Sync:** Insert `design_briefs (status = PENDING_BRIEF)` *(tanpa placeholder `design_submissions`)* + Auto-Spawn linked tasks (`DESIGN_TASK` & `CONTENT_PRODUCTION`). Notif `DESIGN_BRIEF_ASSIGNED` ke Designer. Audit log. |
| `PLANNING` | `READY_TO_PUBLISH` | `STAFF_CREATOR`, `PROJECT_MANAGER`, `SUPER_ADMIN` | Toggle `requires_design = false` & Konfirmasi Siap Tayang | Auto-Spawn linked task `CONTENT_PRODUCTION`. Audit log. |
| `IN_DESIGN` | `DESIGN_REVIEW` | `DESIGNER` (via Design Submission) | Designer unggah file / tempel link desain `v1` | **Sync:** Insert `design_submissions (v1, SUBMITTED)` + Update `design_briefs = SUBMITTED` + linked `DESIGN_TASK = IN_REVIEW` (`first_submitted_at` set). Notif `DESIGN_SUBMITTED` ke PM/Reviewer. Audit log. |
| `DESIGN_REVIEW` | `DESIGN_REVISION` | `SUPER_ADMIN`, `PROJECT_MANAGER` | Klik *Request Revision* di Design Review Drawer (Guard: `revision_notes` wajib >= 10 char) | **Sync:** Update `design_submissions` & `design_briefs = REVISION_REQUESTED`, `revision_count += 1`, linked `DESIGN_TASK = REVISION`. Flag alert jika `>= 3`. Notif `DESIGN_REVISION_REQUESTED` ke Designer. Audit log. |
| `DESIGN_REVISION` | `DESIGN_REVIEW` | `DESIGNER` | Unggah/tautkan revisi versi baru (`vN`) | **Sync:** Insert `design_submissions (vN, SUBMITTED)` + Update `design_briefs = SUBMITTED`, linked `DESIGN_TASK = IN_REVIEW`. Notif `DESIGN_SUBMITTED` ke PM. Audit log. |
| `DESIGN_REVIEW` | `READY_TO_PUBLISH` | `SUPER_ADMIN`, `PROJECT_MANAGER` | Klik *Approve Design* (`design:submission:approve`) | **Sync:** Update `design_submissions` & `design_briefs = APPROVED`, linked `DESIGN_TASK = DONE` (feed KPI `AUTO_OTDR` & `AUTO_DQS` Designer), **Auto-Save Asset Library** (`assets`). Notif `DESIGN_APPROVED` & `CONTENT_READY_TO_PUBLISH` ke Designer & Creator. Audit log. |
| `READY_TO_PUBLISH` | `SCHEDULED` | `STAFF_CREATOR`, `PROJECT_MANAGER`, `SUPER_ADMIN` | Klik *Mark as Scheduled* + jadwal publish aktual | Audit: `CONTENT_SCHEDULED`. Berkontribusi pada hitungan `AUTO_CPVS` Creator bulan berjalan. Update badge di Content Calendar. |
| `SCHEDULED` / `READY_TO_PUBLISH` | `PUBLISHED` | `STAFF_CREATOR`, `PROJECT_MANAGER`, `SUPER_ADMIN` | Klik *Mark as Published* (Guard: input `published_url` valid & `published_at`) | **Sync:** Linked `CONTENT_PRODUCTION` task otomatis -> `DONE` (hitung `is_on_time` terhadap `planned_publish_at` & feed `AUTO_CPVS`). Membuka tab *Content Performance Analytics*. Audit log. |
| `PUBLISHED` / `PLANNING` | `ARCHIVED` | `SUPER_ADMIN`, `PROJECT_MANAGER` | Klik *Archive Content* | Memindahkan dari board aktif tanpa menghapus data analytics & asset library. Audit log. |

---

#### 4.3 Matriks Transisi `DesignSubmissionStatus` (Modul C — `design_briefs.status` & `design_submissions.status`)

> **Catatan Kontrak DDL:** Status awal `PENDING_BRIEF` dan `IN_PROGRESS` disimpan pada **`design_briefs.status`**. Baris baru pada tabel **`design_submissions`** hanya dibuat (*INSERT*) saat Designer mengirimkan hasil desain versi `v1..vN` (`SUBMITTED`), kemudian status submission terbaru dan `design_briefs.status` diperbarui serempak ke `REVISION_REQUESTED` atau `APPROVED`.

| Status Awal (`From`) | Status Tujuan (`To`) | Aktor Diizinkan (RBAC) | Trigger / Aksi UI & Guard Condition | Side-Effects Sistem (Sync, Notif, Audit, KPI) |
| :--- | :--- | :--- | :--- | :--- |
| *(Auto-Created di `design_briefs`)* | `PENDING_BRIEF` | System (saat Brief di-assign oleh PM/Creator) | Trigger dari `PLANNING -> IN_DESIGN` | Insert `design_briefs (status = PENDING_BRIEF)` (tanpa record `design_submissions`). Brief masuk antrian *Pending* di `/design/workspace`. |
| `PENDING_BRIEF` *(di `design_briefs`)* | `IN_PROGRESS` *(di `design_briefs`)* | `DESIGNER` (assigned), `PROJECT_MANAGER`, `SUPER_ADMIN` | Klik *Start Designing* di `/design/workspace` | Update `design_briefs.status = IN_PROGRESS`. **Sync:** Linked `DESIGN_TASK` otomatis `TODO -> IN_PROGRESS` (`started_at` set). Audit log. |
| `PENDING_BRIEF` / `IN_PROGRESS` | `SUBMITTED` | `DESIGNER` (assigned) | Upload file (<= 25MB, valid MIME, presign TTL 300s) atau input External Link + klik *Submit Design* (`design:submission:create`) | **INSERT** record baru `design_submissions` (`version_number = 1`, `status = SUBMITTED`) + update `design_briefs.status = SUBMITTED`. **Sync:** `ContentStatus -> DESIGN_REVIEW`, linked `DESIGN_TASK -> IN_REVIEW` (`first_submitted_at` set). Notif `DESIGN_SUBMITTED` ke Reviewer. Audit log. |
| `SUBMITTED` | `REVISION_REQUESTED` | `SUPER_ADMIN`, `PROJECT_MANAGER` | Klik *Request Revision* (`design:submission:approve`, Guard: `revision_notes` wajib >= 10 karakter; `reviewer_id !== designer_id`) | Update `design_submissions` & `design_briefs = REVISION_REQUESTED`; increment `revision_count` pada `design_briefs` & linked task (memengaruhi metrik `AUTO_DQS` & `avg_revision_count` Designer di KPI). **Sync:** `ContentStatus -> DESIGN_REVISION`, linked `DESIGN_TASK -> REVISION`. Notif `DESIGN_REVISION_REQUESTED` ke Designer. Audit log. |
| `REVISION_REQUESTED` | `SUBMITTED` | `DESIGNER` (assigned) | Submit file/link revisi baru (`version_number = prev + 1`) | **INSERT** record baru `design_submissions (vN, SUBMITTED)` + update `design_briefs.status = SUBMITTED`. **Sync:** `ContentStatus -> DESIGN_REVIEW`, linked `DESIGN_TASK -> IN_REVIEW`. Notif `DESIGN_SUBMITTED` ke Reviewer. Audit log. |
| `SUBMITTED` | `APPROVED` | `SUPER_ADMIN`, `PROJECT_MANAGER` | Klik *Approve Design* (`design:submission:approve`, Guard: `reviewer_id !== designer_id`) | Update `design_submissions` & `design_briefs = APPROVED` (`approved_at = NOW()`). **Sync:** `ContentStatus -> READY_TO_PUBLISH`, linked `DESIGN_TASK -> DONE` (`completed_at`, `is_on_time` via `effective_completion_time`), **Auto-Insert ke `assets` (Asset Library)** (dan set `is_superseded = true` jika menggantikan aset sebelumnya). Notif `DESIGN_APPROVED` & `CONTENT_READY_TO_PUBLISH` ke Designer & Creator. Audit log. |

---

#### 4.4 Matriks Transisi `EvaluationStatus` (Modul B — Monthly KPI Evaluation)

| Status Awal (`From`) | Status Tujuan (`To`) | Aktor Diizinkan (RBAC) | Trigger / Aksi UI & Guard Condition | Side-Effects Sistem (Sync, Notif, Audit, KPI) |
| :--- | :--- | :--- | :--- | :--- |
| *(Batch / Single)* | `DRAFT` | `SUPER_ADMIN`, `PROJECT_MANAGER` | Klik *Generate Monthly Evaluations* (`kpi:evaluation:create`, Guard: KPI assignments periode aktif valid total bobot 100%, belum ada evaluasi duplikat `UNIQUE(user_id, period_year, period_month)`) | Auto-populate metrik objektif (`AUTO_TCR`, `AUTO_OTDR`, `AUTO_DQS`, `AUTO_CPVS`) dari tabel `tasks`, `design_briefs`, & `content_items` ke `auto_metrics_snapshot`. Notif `KPI_EVALUATION_OPEN`. Audit log `KPI_DRAFT_GENERATED`. |
| `DRAFT` | `SUBMITTED` | `PROJECT_MANAGER`, `SUPER_ADMIN` *(serta Karyawan terkait pada V1.1 `MOS-22` opsional)* | Pada **V1**: PM melengkapi skor `MANUAL_SCORE` (`0–100`) & `evaluator_notes` lalu klik *Submit Evaluation*. *(Employee self-reflection `self_assessment_notes` bersifat opsional/V1.1 `MOS-22`)*. | Refresh auto-metrics terbaru sebelum submit. Notif `KPI_EVALUATION_SUBMITTED` ke Reviewer/Super Admin. Audit log. |
| `DRAFT` / `SUBMITTED` | `REVIEWED` | `PROJECT_MANAGER`, `SUPER_ADMIN` | Verifikasi seluruh skor indikator (`0–100`) & feedback + klik *Submit for Calibration* (Guard: `evaluator_id !== user_id`, semua item manual terisi) | Hitung `weighted_kpi_score` (`0.00–100.00`, terapkan *weight re-normalization* jika ada indikator `N/A`) dan 4 Grade (`A` `90–100`, `B` `80–89.99`, `C` `70–79.99`, `D` `0–69.99`). Notif ke `SUPER_ADMIN` untuk kalibrasi. Audit log. |
| `REVIEWED` | `SUBMITTED` | `SUPER_ADMIN` | Klik *Return for Adjustment* + catatan kalibrasi wajib | Membuka kembali form penilaian bagi PM untuk penyesuaian. Notif ke PM. Audit log. |
| `REVIEWED` | `FINALIZED` | `SUPER_ADMIN` (eksklusif, `kpi:evaluation:finalize`) | Klik *Finalize & Lock Evaluation* + konfirmasi modal | **Immutable Lock:** Membekukan `auto_metrics_snapshot` JSONB, mengisi `finalized_at` & `finalized_by`, mengunci seluruh endpoint edit untuk record ini. Memperbarui Team KPI Dashboard & membuka Export Report (`/api/kpi/reports/export`). Notif `KPI_EVALUATION_FINALIZED` ke Karyawan. Audit log `KPI_EVALUATION_FINALIZED`. |

---

#### 4.5 Ringkasan Kontrak Sinkronisasi Atomik Lintas Modul (Developer Implementation Checklist)

Tabel berikut merangkum 6 titik integrasi kritikal yang **wajib dieksekusi di dalam `prisma.$transaction()`** oleh Mhd Yoga Andhika & Nta agar tidak pernah terjadi inkonsistensi antar modul:

| # | Trigger Event (Modul Asal) | Mutasi Sinkronisasi Atomik (Target Modul) | Side-Effects Wajib |
| :--- | :--- | :--- | :--- |
| **1** | **Assign Design Brief** (Modul C) | `content_items -> IN_DESIGN` + insert `design_briefs (status: PENDING_BRIEF)` *(tanpa insert placeholder `design_submissions`)* + upsert `tasks (DESIGN_TASK)` + upsert `tasks (CONTENT_PRODUCTION)` | `notifications` (`DESIGN_BRIEF_ASSIGNED` ke Designer) + `activity_logs` |
| **2** | **Submit Design vN** (Modul C) | insert `design_submissions (SUBMITTED, vN)` + update `design_briefs -> SUBMITTED` + update `content_items -> DESIGN_REVIEW` + update linked `tasks (DESIGN_TASK) -> IN_REVIEW` (`first_submitted_at = COALESCE(first_submitted_at, NOW())`) | `notifications` (`DESIGN_SUBMITTED` ke PM/Reviewer) + `activity_logs` |
| **3** | **Request Design Revision** (Modul C) | update `design_submissions & design_briefs -> REVISION_REQUESTED` + increment `revision_count` + update `content_items -> DESIGN_REVISION` + update linked `tasks (DESIGN_TASK) -> REVISION` | `notifications` (`DESIGN_REVISION_REQUESTED` ke Designer + Alert jika `rev >= 3`) + `activity_logs` |
| **4** | **Approve Design** (Modul C) | update `design_submissions & design_briefs -> APPROVED` (`approved_at`) + update `content_items -> READY_TO_PUBLISH` + update linked `tasks (DESIGN_TASK) -> DONE` (`completed_at`, `is_on_time` via `effective_completion_time`) + **insert `assets` (Asset Library)** | `notifications` (`DESIGN_APPROVED` & `CONTENT_READY_TO_PUBLISH`) + `activity_logs` + sinyal KPI `AUTO_OTDR` & `AUTO_DQS` Designer |
| **5** | **Mark Content Published** (Modul C) | update `content_items -> PUBLISHED` (`published_url`, `published_at`) + update linked `tasks (CONTENT_PRODUCTION) -> DONE` (`completed_at`, `is_on_time` terhadap `planned_publish_at`) | `notifications` (`TASK_COMPLETED` ke PM) + `activity_logs` + sinyal KPI `AUTO_CPVS` Creator |
| **6** | **Finalize Monthly KPI** (Modul B) | freeze `auto_metrics_snapshot` JSONB + hitung final `weighted_kpi_score` (`0–100`, Grade A/B/C/D) + update `monthly_evaluations -> FINALIZED` (`finalized_at`, `finalized_by`) | `notifications` (`KPI_EVALUATION_FINALIZED` ke Evaluatee) + `activity_logs` (immutable) |

---

## BAGIAN III — DATABASE DESIGN (POSTGRESQL 16), BACKEND ARCHITECTURE & RBAC

> **Cakupan Bagian III:** Perbandingan Objektif Arsitektur Backend, 5-Layer Architecture & Hybrid Storage, **2 Entity Relationship Diagrams** (Master ERD 25 Entitas + Sub-ERD Cross-Module Backbone), **21 PostgreSQL ENUMs**, Data Dictionary & Production SQL DDL Lengkap **25 Tabel**, **25 Custom Indexes**, Mekanisme Sinkronisasi & CTE Kalkulasi KPI Otomatis (*Immutable Frozen Snapshot*), serta **Database-Backed RBAC (42 Atomic Permissions)**, Server-Side Guard & RLS Lockdown.

### Ringkasan Arsitektur Data & Backend (Executive Summary)

Bagian III ini menetapkan fondasi **Single Source of Truth** untuk seluruh operasional internal Krevia Digital dalam satu skema relasional **PostgreSQL 16** yang terintegrasi lintas 4 modul (**Task Management**, **Team Management & KPI**, **Social Media & Design Management**, dan **System Management**).

Keputusan arsitektur inti yang dirancang khusus agar **2 developer (Yoga & Nta)** dapat mengeksekusi V1 secara aman dan tuntas dalam **2 minggu** tanpa mengorbankan skalabilitas jangka panjang:

1. **Unified Task Core (Zero Data Duplication):** Task yang lahir dari *Content Planning* maupun *Design Brief* disimpan langsung di tabel `tasks` terpadu (melalui `task_type`, `content_item_id`, dan `design_brief_id`). Hasilnya: satu tugas otomatis tampil di **My Tasks**, **Kanban Board**, **Work Calendar**, sekaligus langsung menjadi bahan hitung objektif di **KPI & Individual Performance**.
2. **Hybrid Next.js Backend (Single Codebase, Zero API Glue Overhead):** Menggunakan **Next.js Server Actions** untuk mutasi internal berkecepatan tinggi dan **Route Handlers (`/api/**`)** untuk kebutuhan HTTP khusus (Auth.js, Presigned Upload, Export Laporan, Cron Alert).
3. **Immutable KPI Snapshot & Audit Trail:** Evaluasi KPI bulanan menyimpan *frozen snapshot* metrik di `monthly_evaluations` saat berstatus `FINALIZED` sehingga laporan historis tidak pernah bergeser meski task diedit bulan berikutnya. Seluruh aksi mutasi tercatat permanen di `activity_logs` (*append-only* dengan `old_values` & `new_values` bertipe `JSONB`).
4. **Database-Backed RBAC (`module:resource:action`):** 4 peran kanonik (`SUPER_ADMIN`, `PROJECT_MANAGER`, `STAFF_CREATOR`, `DESIGNER`) dikontrol dari tabel `roles`, `permissions`, dan `role_permissions` serta dijaga secara berlapis di server-side Service Layer.

---

### 1. Rekomendasi Arsitektur Backend & Justifikasi Teknis

#### 1.1 Perbandingan Objektif Opsi Arsitektur Backend

Dalam tahap inisiasi proyek, muncul beberapa pertimbangan teknologi backend—termasuk opsi **Hybrid Next.js Full-Stack + PostgreSQL**, **Separate Node.js/NestJS API**, serta **Laravel API / Laravel + React Inertia + MySQL**. Berikut evaluasi objektif berbasis konteks nyata Krevia Digital (**2 developer, target V1 14 hari, kebutuhan analitik KPI & audit log**):

| Kriteria Evaluasi | Opsi A: Hybrid Next.js Server Actions + Route Handlers + PostgreSQL 16 (**DIREKOMENDASIKAN**) | Opsi B: Separate Node.js / NestJS REST API + Next.js Frontend | Opsi C: Laravel (+ React/Inertia atau API) + MySQL |
| :--- | :--- | :--- | :--- |
| **Kecepatan Delivery V1 (Tim 2 Dev / 14 Hari)** | **Sangat Tinggi.** Satu repositori, satu bahasa (TypeScript end-to-end), kontrak tipe data langsung dibagi antara Prisma, Service Layer, dan UI tanpa *boilerplate* DTO ganda. | **Sedang–Lambat.** Harus mengelola 2 service, 2 deployment pipeline, CORS, OpenAPI/Swagger sync, serta duplikasi validasi request/response. | **Sedang.** Laravel sangat produktif untuk CRUD konvensional, tetapi kombinasi PHP + TypeScript (React) membagi konteks kognitif 2 developer & menghilangkan *shared type safety* langsung antara DB dan UI. |
| **Kemampuan Analitik KPI & Audit Log (PostgreSQL vs MySQL)** | **Unggul.** PostgreSQL 16 memiliki dukungan superior untuk CTE kompleks (`WITH`), `FILTER (WHERE ...)`, *Partial Indexes* (`WHERE deleted_at IS NULL`), array native (`TEXT[]`), dan **`JSONB` + GIN Index** untuk `activity_logs` & KPI snapshot. | **Unggul** (jika tetap pakai PostgreSQL), namun beban orkestrasi *microservice-style* tidak sebanding untuk tim 2 orang di V1. | **Cukup, namun terbatas di analitik JSON/Partial Index.** MySQL tidak mendukung *partial index* native dan dukungan array/JSON indexing kurang fleksibel dibanding `JSONB` PostgreSQL. |
| **Interaktivitas UI Modern (Kanban Drag-and-Drop, Calendar, Live Filter)** | **Sangat Baik.** RSC untuk initial load super cepat + Server Actions/TanStack Query untuk *optimistic update* Kanban dan filter Calendar mulus. | **Sangat Baik**, tetapi menambah network hop ekstra (`Browser -> Next.js -> NestJS -> DB`) kecuali client memanggil NestJS langsung. | **Baik** (via Inertia), tetapi untuk pola *optimistic update* Kanban kompleks & *concurrent client state* tetap membutuhkan API JSON terpisah di luar siklus Inertia. |
| **Biaya Infrastruktur & Operasional V1** | **Paling Hemat.** 1 aplikasi Next.js (Vercel/VPS Docker) + 1 Managed PostgreSQL (Supabase/Neon) atau self-hosted PostgreSQL. | **Lebih Tinggi.** Minimal 2 runtime container/hosting + manajemen networking & observability terpisah. | **Hemat** (1 server VPS/Forge), tetapi butuh manajemen stack PHP-FPM + Nginx + Queue Worker + Node build. |
| **Jalur Migrasi / Skalabilitas Masa Depan (V2+)** | **Aman & Terstruktur.** Karena seluruh *business logic* dipisahkan rapi ke `Service Layer`, mengekstrak endpoint ke API terpisah atau mobile app di V2 cukup membungkus Service Layer yang sama di `/api/v1/**`. | **Sangat Baik** untuk skala tim >10 developer dengan banyak client (Web + iOS + Android). | **Baik** untuk tim PHP dedicated, kurang optimal jika roadmap Krevia memusatkan kompetensi tim di ekosistem TypeScript/React. |

> **Catatan Objektif untuk Leadership terkait Pertimbangan Laravel + MySQL:**
> Stack **Laravel + React/Inertia + MySQL** adalah stack yang matang dan sangat baik jika tim inti didominasi engineer PHP. Namun untuk **KTMS V1 dengan 2 developer dalam 14 hari**, **Next.js 15+ (App Router) + Prisma + PostgreSQL 16** memberikan keunggulan terukur: (1) **Single Language (100% TypeScript)** dari skema database sampai tombol UI sehingga risiko bug integrasi turun drastis, (2) **PostgreSQL 16** jauh lebih kuat untuk agregasi KPI bulanan, *soft-delete partial indexing*, serta pencarian *Asset Library* & *Audit Trail* berbasis `JSONB`, dan (3) **Zero Deployment Overhead** sehingga waktu 14 hari fokus ke fitur bisnis, bukan konfigurasi infrastruktur ganda.

---

#### 1.2 Strategi Lapisan Arsitektur Backend (Layered Architecture)

Agar kode tetap bersih, mudah diuji, dan tidak mencampur *business logic* ke dalam komponen UI, seluruh akses data wajib mengikuti **5 Lapisan Arsitektur Ketat** berikut:

```mermaid
flowchart TD
    UI["1. Presentation Layer — Next.js App Router: RSC & Client Components"]
    ENTRY_SA["2a. Server Actions — Mutasi UI: Kanban Move, Form CRUD, Review, KPI"]
    ENTRY_API["2b. Route Handlers (/api/**) — Auth.js, Presigned Upload, Export CSV/PDF, Cron, Polling"]
    GUARD["3. Application & Service Layer (src/server/services/*) — Zod, RBAC Guard, Ownership Check, Business Rules"]
    CROSS["Cross-Cutting Services — Audit Logger (activity_logs) & Notification Dispatcher"]
    ORM["4. Data Access Layer — Prisma ORM (Parameterized Queries & Interactive $transaction)"]
    DB["5. Persistence & Storage — PostgreSQL 16 (Managed/Self-Hosted) + Supabase Storage / S3"]

    UI -->|"Initial Read (RSC) & Mutasi"| ENTRY_SA
    UI -->|"Upload, Export, Auth, Polling"| ENTRY_API
    UI -.->|"Read-Only Query via Service"| GUARD
    ENTRY_SA --> GUARD
    ENTRY_API --> GUARD
    GUARD --> ORM
    GUARD --> CROSS
    CROSS --> ORM
    ORM --> DB
```

##### Pembagian Tanggung Jawab Tiap Lapisan
1. **UI / RSC Layer (`src/app/**`, `src/features/*/components/**`):**
   - **Larangan Keras:** Komponen React (RSC maupun Client) **dilarang** memanggil `prisma.*` secara langsung. Semua pembacaan data melewati *Query Service* yang sudah memuat filter `deleted_at IS NULL` dan pemeriksaan RBAC/scope.
2. **Entry Point Layer (Server Actions vs Route Handlers):**
   - **Gunakan Server Actions (`src/features/*/actions/*.ts`) untuk:**
     - Create/Update/Delete Project, Task, Checklist, Comment.
     - Drag-and-drop Kanban status & urutan posisi (`moveTaskAction`).
     - Konversi Content Idea -> Content Plan -> Auto-spawn Design Brief & Task.
     - Submit Design, Approve/Request Revision, Promote ke Asset Library.
     - Simpan skor KPI bulanan & Finalisasi Evaluasi.
     - Publikasi Announcement & mark-as-read.
   - **Gunakan Route Handlers (`src/app/api/**/route.ts`) untuk:**
     - `/api/auth/[...nextauth]` — Handler autentikasi Auth.js v5.
     - `/api/uploads/presign` — Generate Presigned PUT URL & validasi MIME/ukuran.
     - `/api/uploads/download-url` — Generate Signed GET URL sementara (TTL 15 menit) setelah cek izin RBAC.
     - `/api/notifications/unread`, `/api/tasks/calendar`, & `/api/content/calendar` — Endpoint JSON ringan untuk polling (30 detik) dan filtering TanStack Query.
     - `/api/kpi/reports/export` — Streaming export CSV/XLSX/PDF laporan KPI bulanan.
     - `/api/cron/deadline-alerts` — Trigger terjadwal harian pukul **08:00 WIB** (dilindungi `CRON_SECRET`) untuk notifikasi deadline H-2 (`TASK_DEADLINE_SOON`), H-0 (`TASK_DEADLINE_TODAY`), dan overdue H+1 & H+3 (`TASK_OVERDUE`).
     - `/api/health` — Health check aplikasi & konektivitas PostgreSQL.
3. **Service Layer (`src/server/services/**`):**
   - Titik tunggal penegakan **Zod Validation**, **RBAC Permission Guard (`requirePermission`)**, **Scope/Ownership Check**, aturan bisnis lintas modul, dan transaksi atomik `prisma.$transaction()`.
   - Setiap mutasi data wajib memanggil `recordActivityLog()` di dalam transaksi yang sama dan memicu `dispatchNotifications()` setelah transaksi sukses (atau di dalam transaksi agar konsisten).
4. **Prisma ORM Layer (`src/server/db/prisma.ts`, `prisma/schema.prisma`):**
   - Mengelola *connection pooling* (PgBouncer / Supabase Transaction Pooler pada port `6543` untuk runtime serverless + Direct Connection `5432` untuk Prisma Migrate).
   - Semua query otomatis parameterized (anti SQL Injection).
5. **PostgreSQL 16 + Object Storage:**
   - Menegakkan integritas data tahap akhir melalui `FOREIGN KEY`, `UNIQUE`, `CHECK`, `ENUM`, dan *Partial Index*.

---

#### 1.3 Strategi Penyimpanan File & Aset Desain (Hybrid Storage Architecture)

Tim kreatif dan desain bekerja dengan file berukuran besar (Figma, Canva, video mentah Reels, Adobe Illustrator) sekaligus membutuhkan pratinjau cepat dan aset final terpusat. KTMS menerapkan strategi **Hybrid Storage**:

1. **Mode 1 — External Cloud Links (Zero Storage Cost untuk Source Files):**
   - Mendukung tautan langsung ke **Figma**, **Canva**, **Google Drive**, atau URL referensi tervalidasi (`source_type IN ('FIGMA', 'CANVA', 'GOOGLE_DRIVE', 'OTHER_LINK')`).
   - Wajib melalui validasi skema URL (`https://` only, menolak `javascript:`, `data:`, atau IP internal/SSRF) sebelum disimpan ke PostgreSQL.
2. **Mode 2 — Direct File Upload via Presigned URL (Supabase Storage / S3-Compatible):**
   - File **tidak pernah** dikirim lewat body Server Action atau Next.js API (menghindari batas payload 4,5 MB di platform serverless dan mencegah memori server membengkak).
   - Alur upload aman 3 langkah:
     1. Client meminta `POST /api/uploads/presign` dengan `{ module, entityId, fileName, mimeType, fileSizeBytes }`.
     2. Server memeriksa sesi + RBAC permission, memvalidasi **MIME Allowlist** & **Max Size Cap**, lalu mengembalikan `presignedPutUrl` (berlaku 5 menit) dan `storageKey` terstandarisasi: `ktms/{env}/{module}/{entityId}/{uuid}.{ext}`.
     3. Client melakukan HTTP `PUT` langsung ke Object Storage, lalu memanggil Server Action untuk mencatat metadata file ke PostgreSQL (`task_attachments`, `design_submissions`, atau `assets`) setelah server memverifikasi keberadaan objek (`HEAD Object`).

##### Kebijakan Validasi File & Batas Ukuran (Storage Guardrails)

| Kategori Upload | MIME Type yang Diizinkan | Batas Ukuran Maksimal (V1) | Bucket Policy & Akses |
| :--- | :--- | :--- | :--- |
| **User Avatar** | `image/jpeg`, `image/png`, `image/webp` | **2 MB** | Public CDN / Signed URL panjang |
| **Task Attachment** | `image/jpeg`, `image/png`, `image/webp`, `application/pdf`, `application/vnd.openxmlformats-officedocument.*`, `text/csv`, `application/zip` | **25 MB** *(>25 MB gunakan External Cloud Link)* | **Private Bucket** (Signed GET URL TTL 15 menit via cek RBAC) |
| **Design Submission Preview & Asset Library** | `image/jpeg`, `image/png`, `image/webp`, `image/svg+xml` (disanitasi/unduh attachment), `application/pdf`, `video/mp4` | **25 MB** *(file mentah/video >25 MB wajib pakai External Cloud Link: Figma/Canva/GDrive)* | **Private Bucket** (Signed GET URL + thumbnail teroptimasi) |

> **Keamanan Upload:** File `image/svg+xml` wajib disajikan dengan header `Content-Disposition: attachment` atau dikonversi ke WebP/PNG saat pratinjau untuk mencegah Stored XSS. Nama file asli selalu disanitasi (`slugify`) dan `storage_key` memakai UUID acak agar tidak dapat ditebak (*path traversal safe*).

---

### 2. Entity Relationship Diagram (ERD) Lengkap

Skema database KTMS terdiri dari **25 tabel inti** yang terhubung secara relasional penuh. Untuk keterbacaan maksimal bagi Leadership maupun developer, ERD disajikan dalam 2 diagram:
1. **Master ERD Overview** (seluruh 25 entitas beserta atribut kunci dan kardinalitasnya).
2. **Sub-ERD Fokus Relasi Lintas Modul** (memperjelas alur data dari Social Media & Design ke Unified Tasks hingga Evaluasi KPI Bulanan & Audit Trail).

#### 2.1 Master ERD Overview (25 Entitas — 4 Modul Terintegrasi)

```mermaid
erDiagram
    ROLES ||--o{ USERS : "assigned to"
    ROLES ||--o{ ROLE_PERMISSIONS : "has"
    PERMISSIONS ||--o{ ROLE_PERMISSIONS : "granted via"
    USERS ||--o{ USERS : "manages"

    USERS ||--o{ PROJECTS : "owns"
    PROJECTS ||--o{ PROJECT_MEMBERS : "includes"
    USERS ||--o{ PROJECT_MEMBERS : "joins"

    PROJECTS ||--o{ CONTENT_IDEAS : "collects"
    USERS ||--o{ CONTENT_IDEAS : "proposes"
    CONTENT_IDEAS ||--o| CONTENT_ITEMS : "converts to"
    PROJECTS ||--o{ CONTENT_ITEMS : "schedules"
    USERS ||--o{ CONTENT_ITEMS : "creates"
    CONTENT_ITEMS ||--o{ CONTENT_ANALYTICS : "tracks"

    PROJECTS ||--o{ DESIGN_BRIEFS : "contains"
    CONTENT_ITEMS ||--o{ DESIGN_BRIEFS : "requests"
    USERS ||--o{ DESIGN_BRIEFS : "assigned designer"
    DESIGN_BRIEFS ||--o{ DESIGN_SUBMISSIONS : "versions"
    USERS ||--o{ DESIGN_SUBMISSIONS : "submits"
    DESIGN_SUBMISSIONS ||--o{ DESIGN_REVIEWS : "reviewed by"
    USERS ||--o{ DESIGN_REVIEWS : "reviews"

    PROJECTS ||--o{ ASSETS : "stores"
    CONTENT_ITEMS ||--o{ ASSETS : "links"
    DESIGN_SUBMISSIONS ||--o{ ASSETS : "promotes to"
    USERS ||--o{ ASSETS : "uploads"

    PROJECTS ||--o{ TASKS : "groups"
    TASKS ||--o{ TASKS : "subtasks"
    CONTENT_ITEMS ||--o{ TASKS : "spawns"
    DESIGN_BRIEFS ||--o| TASKS : "spawns 1-to-1"
    USERS ||--o{ TASKS : "assignee"
    USERS ||--o{ TASKS : "reporter"
    TASKS ||--o{ TASK_CHECKLISTS : "has"
    TASKS ||--o{ TASK_COMMENTS : "discusses"
    TASKS ||--o{ TASK_ATTACHMENTS : "attaches"
    USERS ||--o{ TASK_COMMENTS : "writes"
    USERS ||--o{ TASK_ATTACHMENTS : "uploads"

    ROLES ||--o{ KPI_TEMPLATES : "applies to"
    KPI_TEMPLATES ||--o{ KPI_ASSIGNMENTS : "instantiates"
    USERS ||--o{ KPI_ASSIGNMENTS : "assigned targets"
    USERS ||--o{ MONTHLY_EVALUATIONS : "evaluated in"
    USERS ||--o{ MONTHLY_EVALUATIONS : "evaluates"
    MONTHLY_EVALUATIONS ||--o{ EVALUATION_ITEMS : "details"
    KPI_ASSIGNMENTS ||--o{ EVALUATION_ITEMS : "measures"
    KPI_TEMPLATES ||--o{ EVALUATION_ITEMS : "references"

    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ ANNOUNCEMENTS : "publishes"
    ANNOUNCEMENTS ||--o{ ANNOUNCEMENT_READS : "read by"
    USERS ||--o{ ANNOUNCEMENT_READS : "acknowledges"
    USERS ||--o{ ACTIVITY_LOGS : "performs"

    ROLES {
        uuid id PK
        varchar code UK
        varchar name
        boolean is_system
        timestamptz created_at
    }

    PERMISSIONS {
        uuid id PK
        varchar code UK
        varchar module
        varchar resource
        varchar action
    }

    ROLE_PERMISSIONS {
        uuid role_id PK,FK
        uuid permission_id PK,FK
        uuid granted_by FK
        timestamptz granted_at
    }

    USERS {
        uuid id PK
        uuid role_id FK
        uuid manager_id FK
        varchar email UK
        varchar full_name
        varchar job_title
        varchar department
        boolean is_active
        boolean must_change_password
        int token_version
        timestamptz deleted_at
    }

    PROJECTS {
        uuid id PK
        varchar code UK
        varchar name
        enum status
        uuid owner_id FK
        date start_date
        date target_end_date
        timestamptz deleted_at
    }

    PROJECT_MEMBERS {
        uuid id PK
        uuid project_id FK
        uuid user_id FK
        enum project_role
        timestamptz joined_at
    }

    TASKS {
        uuid id PK
        varchar task_code UK
        uuid project_id FK
        uuid parent_task_id FK
        uuid content_item_id FK
        uuid design_brief_id FK
        uuid assignee_id FK
        uuid reporter_id FK
        uuid reviewer_id FK
        varchar title
        enum task_type
        enum status
        enum priority
        float position
        int version
        boolean requires_review
        timestamptz started_at
        timestamptz first_submitted_at
        timestamptz due_date
        timestamptz completed_at
        int revision_count
        boolean is_on_time
        timestamptz deleted_at
    }

    TASK_CHECKLISTS {
        uuid id PK
        uuid task_id FK
        varchar title
        boolean is_completed
        int sort_order
    }

    TASK_COMMENTS {
        uuid id PK
        uuid task_id FK
        uuid author_id FK
        uuid parent_comment_id FK
        text body
        timestamptz deleted_at
    }

    TASK_ATTACHMENTS {
        uuid id PK
        uuid task_id FK
        uuid uploaded_by FK
        enum source_type
        varchar file_name
        text file_url
        bigint file_size_bytes
    }

    CONTENT_IDEAS {
        uuid id PK
        uuid project_id FK
        uuid proposed_by FK
        uuid reviewed_by FK
        varchar title
        enum target_platform
        enum status
        uuid_array upvoted_by_user_ids
        timestamptz deleted_at
    }

    CONTENT_ITEMS {
        uuid id PK
        uuid project_id FK
        uuid idea_id FK
        uuid creator_id FK
        uuid approver_id FK
        varchar title
        enum platform
        enum content_format
        enum status
        boolean requires_design
        timestamptz planned_publish_at
        timestamptz published_at
        timestamptz deleted_at
    }

    DESIGN_BRIEFS {
        uuid id PK
        uuid project_id FK
        uuid content_item_id FK
        uuid requested_by FK
        uuid assigned_designer_id FK
        varchar title
        enum status
        int current_version
        int revision_count
        timestamptz due_date
        timestamptz deleted_at
    }

    DESIGN_SUBMISSIONS {
        uuid id PK
        uuid design_brief_id FK
        uuid submitted_by FK
        int version_number
        enum status
        enum source_type
        text file_url
        timestamptz submitted_at
    }

    DESIGN_REVIEWS {
        uuid id PK
        uuid design_submission_id FK
        uuid reviewer_id FK
        enum decision
        text feedback
        jsonb revision_checklist
        timestamptz reviewed_at
    }

    ASSETS {
        uuid id PK
        uuid project_id FK
        uuid content_item_id FK
        uuid design_submission_id FK
        uuid uploaded_by FK
        varchar title
        enum category
        enum source_type
        text file_url
        text_array tags
        boolean is_superseded
        timestamptz deleted_at
    }

    CONTENT_ANALYTICS {
        uuid id PK
        uuid content_item_id FK
        uuid recorded_by FK
        date recorded_date
        int impressions
        int reach
        int likes
        int comments
        int shares
        int saves
        int clicks
        numeric engagement_rate
        numeric ctr
    }

    KPI_TEMPLATES {
        uuid id PK
        varchar code UK
        uuid applicable_role_id FK
        varchar name
        enum category
        enum metric_source
        enum unit
        numeric default_target_value
        numeric default_weight
    }

    KPI_ASSIGNMENTS {
        uuid id PK
        uuid user_id FK
        uuid kpi_template_id FK
        smallint period_year
        smallint period_month
        numeric target_value
        numeric weight
    }

    MONTHLY_EVALUATIONS {
        uuid id PK
        uuid user_id FK
        uuid evaluator_id FK
        smallint period_year
        smallint period_month
        enum status
        numeric completion_rate
        numeric on_time_rate
        numeric avg_revision_count
        numeric design_quality_score
        numeric weighted_kpi_score
        jsonb auto_metrics_snapshot
    }

    EVALUATION_ITEMS {
        uuid id PK
        uuid monthly_evaluation_id FK
        uuid kpi_assignment_id FK
        uuid kpi_template_id FK
        numeric target_value
        numeric actual_value
        numeric weight
        numeric weighted_score
    }

    NOTIFICATIONS {
        uuid id PK
        uuid recipient_id FK
        uuid actor_id FK
        enum type
        varchar title
        varchar entity_type
        uuid entity_id
        boolean is_read
        timestamptz created_at
    }

    ANNOUNCEMENTS {
        uuid id PK
        uuid author_id FK
        varchar title
        enum priority
        boolean is_pinned
        timestamptz published_at
        timestamptz deleted_at
    }

    ANNOUNCEMENT_READS {
        uuid announcement_id PK,FK
        uuid user_id PK,FK
        timestamptz read_at
    }

    ACTIVITY_LOGS {
        uuid id PK
        uuid actor_id FK
        varchar action
        varchar module
        varchar entity_type
        uuid entity_id
        jsonb old_values
        jsonb new_values
        timestamptz created_at
    }
```

#### 2.2 Sub-ERD Fokus Relasi Lintas Modul (Operational & KPI Backbone)

Diagram berikut memperlihatkan bagaimana **4 modul KTMS bekerja sebagai satu sistem terpadu** tanpa tabel task terpisah:

```mermaid
erDiagram
    CONTENT_ITEMS ||--o{ DESIGN_BRIEFS : "1. memicu brief desain"
    CONTENT_ITEMS ||--o{ TASKS : "2a. spawn CONTENT_PRODUCTION task"
    DESIGN_BRIEFS ||--o| TASKS : "2b. spawn DESIGN_TASK (1:1 aktif)"
    DESIGN_BRIEFS ||--o{ DESIGN_SUBMISSIONS : "3. unggah v1, v2, vN"
    DESIGN_SUBMISSIONS ||--o{ DESIGN_REVIEWS : "4. approve / minta revisi"
    DESIGN_SUBMISSIONS ||--o{ ASSETS : "5. promosi desain approved"
    USERS ||--o{ TASKS : "6. kerjakan di Kanban & Calendar"
    USERS ||--o{ MONTHLY_EVALUATIONS : "7. agregasi KPI bulanan + snapshot"
    MONTHLY_EVALUATIONS ||--o{ EVALUATION_ITEMS : "8. skor per indikator KPI"
    USERS ||--o{ ACTIVITY_LOGS : "9. audit trail setiap mutasi"
    USERS ||--o{ NOTIFICATIONS : "10. notifikasi real-time in-app"

    CONTENT_ITEMS {
        uuid id PK
        enum status "IDEA..PUBLISHED"
        timestamptz planned_publish_at
    }

    DESIGN_BRIEFS {
        uuid id PK
        uuid content_item_id FK
        enum status "PENDING_BRIEF..APPROVED"
        int current_version
        int revision_count
    }

    DESIGN_SUBMISSIONS {
        uuid id PK
        uuid design_brief_id FK
        int version_number
        enum status
    }

    DESIGN_REVIEWS {
        uuid id PK
        uuid design_submission_id FK
        enum decision "APPROVED, REVISION_REQUESTED"
    }

    ASSETS {
        uuid id PK
        uuid design_submission_id FK
        enum category
        text_array tags
    }

    TASKS {
        uuid id PK
        enum task_type "GENERAL, CONTENT_PRODUCTION, DESIGN_TASK"
        uuid content_item_id FK
        uuid design_brief_id FK
        uuid assignee_id FK
        enum status "BACKLOG..DONE"
        int version
        boolean requires_review
        timestamptz started_at
        timestamptz first_submitted_at
        timestamptz due_date
        timestamptz completed_at
        int revision_count
        boolean is_on_time
    }

    MONTHLY_EVALUATIONS {
        uuid id PK
        uuid user_id FK
        smallint period_year
        smallint period_month
        enum status "DRAFT..FINALIZED"
        numeric completion_rate
        numeric on_time_rate
        numeric avg_revision_count
        numeric design_quality_score
        numeric weighted_kpi_score
        jsonb auto_metrics_snapshot
    }

    EVALUATION_ITEMS {
        uuid id PK
        uuid monthly_evaluation_id FK
        numeric target_value
        numeric actual_value
        numeric weight
    }

    USERS {
        uuid id PK
        uuid role_id FK
        varchar full_name
    }

    ACTIVITY_LOGS {
        uuid id PK
        uuid actor_id FK
        varchar entity_type
        uuid entity_id
        jsonb old_values
        jsonb new_values
    }

    NOTIFICATIONS {
        uuid id PK
        uuid recipient_id FK
        enum type
        uuid entity_id
        boolean is_read
    }
```

---

### 3. Skema Tabel PostgreSQL Detail (Data Dictionary, ENUM, DDL & Indexing)

#### 3.1 PostgreSQL Extensions & Definisi ENUM Eksplisit

Seluruh status kanonik didefinisikan sebagai PostgreSQL `ENUM` agar integritas nilai dijaga di level database sekaligus otomatis ter-generate menjadi TypeScript enum oleh Prisma ORM.

```sql
-- Extensions wajib pada PostgreSQL 16
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- Trigram search untuk pencarian cepat Asset & Task

-- ============================================================================
-- 1. CANONICAL ENUMS (Shared Architectural Contract)
-- ============================================================================

CREATE TYPE task_status_enum AS ENUM (
  'BACKLOG',
  'TODO',
  'IN_PROGRESS',
  'IN_REVIEW',
  'REVISION',
  'DONE',
  'CANCELLED'
);

CREATE TYPE task_type_enum AS ENUM (
  'GENERAL',
  'CONTENT_PRODUCTION',
  'DESIGN_TASK'
);

CREATE TYPE task_priority_enum AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'URGENT'
);

CREATE TYPE content_status_enum AS ENUM (
  'IDEA',
  'APPROVED_IDEA',
  'PLANNING',
  'IN_DESIGN',
  'DESIGN_REVIEW',
  'DESIGN_REVISION',
  'READY_TO_PUBLISH',
  'SCHEDULED',
  'PUBLISHED',
  'ARCHIVED'
);

CREATE TYPE design_submission_status_enum AS ENUM (
  'PENDING_BRIEF',
  'IN_PROGRESS',
  'SUBMITTED',
  'REVISION_REQUESTED',
  'APPROVED'
);

CREATE TYPE kpi_evaluation_status_enum AS ENUM (
  'DRAFT',
  'SUBMITTED',
  'REVIEWED',
  'FINALIZED'
);

-- ============================================================================
-- 2. SUPPORTING DOMAIN ENUMS
-- ============================================================================

CREATE TYPE employment_status_enum AS ENUM (
  'FULL_TIME',
  'PART_TIME',
  'CONTRACT',
  'INTERN',
  'INACTIVE'
);

CREATE TYPE project_status_enum AS ENUM (
  'PLANNING',
  'ACTIVE',
  'ON_HOLD',
  'COMPLETED',
  'ARCHIVED'
);

CREATE TYPE project_member_role_enum AS ENUM (
  'OWNER',
  'LEAD',
  'MEMBER',
  'VIEWER'
);

CREATE TYPE content_idea_status_enum AS ENUM (
  'IDEA',
  'APPROVED_IDEA',
  'CONVERTED',
  'ARCHIVED'
);

CREATE TYPE social_platform_enum AS ENUM (
  'INSTAGRAM',
  'TIKTOK',
  'LINKEDIN',
  'YOUTUBE',
  'X_TWITTER',
  'FACEBOOK',
  'WEBSITE_BLOG'
);

CREATE TYPE content_format_enum AS ENUM (
  'REELS',
  'CAROUSEL',
  'SINGLE_POST',
  'STORY',
  'SHORT_VIDEO',
  'LONG_VIDEO',
  'ARTICLE',
  'INFOGRAPHIC'
);

CREATE TYPE design_review_decision_enum AS ENUM (
  'APPROVED',
  'REVISION_REQUESTED'
);

CREATE TYPE asset_source_type_enum AS ENUM (
  'UPLOAD',
  'FIGMA',
  'CANVA',
  'GOOGLE_DRIVE',
  'OTHER_LINK'
);

CREATE TYPE asset_category_enum AS ENUM (
  'BRAND_KIT',
  'SOCIAL_MEDIA',
  'CAMPAIGN',
  'TEMPLATE',
  'PHOTO_VIDEO',
  'DOCUMENT',
  'OTHER'
);

CREATE TYPE kpi_category_enum AS ENUM (
  'DELIVERY',
  'QUALITY',
  'PRODUCTIVITY',
  'CREATIVE',
  'COLLABORATION'
);

CREATE TYPE kpi_metric_source_enum AS ENUM (
  'AUTO_TCR',
  'AUTO_OTDR',
  'AUTO_DQS',
  'AUTO_CPVS',
  'MANUAL_SCORE'
);

CREATE TYPE kpi_unit_enum AS ENUM (
  'PERCENTAGE',
  'COUNT',
  'SCORE_100',
  'RATIO'
);

CREATE TYPE kpi_grade_enum AS ENUM (
  'A',
  'B',
  'C',
  'D'
);

CREATE TYPE notification_type_enum AS ENUM (
  'TASK_ASSIGNED',
  'TASK_REASSIGNED',
  'TASK_STATUS_CHANGED',
  'TASK_SUBMITTED_REVIEW',
  'TASK_REVISION_REQUESTED',
  'TASK_COMPLETED',
  'TASK_COMMENT_MENTION',
  'TASK_DEADLINE_SOON',
  'TASK_DEADLINE_TODAY',
  'TASK_OVERDUE',
  'CONTENT_IDEA_REVIEWED',
  'CONTENT_READY_TO_PUBLISH',
  'DESIGN_BRIEF_ASSIGNED',
  'DESIGN_SUBMITTED',
  'DESIGN_REVISION_REQUESTED',
  'DESIGN_APPROVED',
  'KPI_EVALUATION_OPEN',
  'KPI_EVALUATION_SUBMITTED',
  'KPI_EVALUATION_FINALIZED',
  'ANNOUNCEMENT_PUBLISHED',
  'SYSTEM_ALERT'
);

CREATE TYPE announcement_priority_enum AS ENUM (
  'INFO',
  'IMPORTANT',
  'URGENT'
);
```

---

#### 3.2 Data Dictionary Lengkap (Seluruh 25 Tabel)

> **Konvensi Global Skema KTMS:**
> - **Primary Key:** `UUID` dengan default `gen_random_uuid()` (aman dari enumerasi ID di URL).
> - **Timestamp:** Seluruh kolom waktu memakai `TIMESTAMPTZ` (UTC di storage, diformat ke `Asia/Jakarta` WIB di UI).
> - **Soft Delete (`deleted_at`):** Diterapkan pada entitas operasional bernilai historis (`users`, `projects`, `tasks`, `task_comments`, `task_attachments`, `content_ideas`, `content_items`, `design_briefs`, `assets`, `kpi_templates`, `announcements`). Tabel audit (`activity_logs`) bersifat **immutable (append-only)** tanpa `updated_at` maupun `deleted_at`.

##### Kelompok 1 — Identity, Team Directory & RBAC (Modul D & Modul B)

###### 1. `roles`
- **Tujuan:** Menyimpan daftar peran sistem (4 peran kanonik: `SUPER_ADMIN`, `PROJECT_MANAGER`, `STAFF_CREATOR`, `DESIGNER`) dan siap mendukung peran kustom di masa depan.
- **Kebijakan Delete:** `is_system = TRUE` dilindungi dari penghapusan.

| Kolom | Tipe PostgreSQL | Null | Default | Constraint / Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | `PRIMARY KEY` |
| `code` | `VARCHAR(50)` | NO | — | `UNIQUE`, format uppercase snake_case (`SUPER_ADMIN`, dll.) |
| `name` | `VARCHAR(100)` | NO | — | Nama tampilan role (mis. `Super Admin / Leadership`) |
| `description` | `TEXT` | YES | `NULL` | Deskripsi tanggung jawab role |
| `is_system` | `BOOLEAN` | NO | `FALSE` | `TRUE` untuk 4 canonical roles agar tidak terhapus |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | Waktu pembuatan |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | Auto-update via trigger |

###### 2. `permissions`
- **Tujuan:** Katalog izin granular berbasis pola `module:resource:action` (contoh: `tasks:item:assign`, `design:submission:approve`).
- **Kebijakan Delete:** Managed via seed/migration.

| Kolom | Tipe PostgreSQL | Null | Default | Constraint / Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | `PRIMARY KEY` |
| `code` | `VARCHAR(100)` | NO | — | `UNIQUE`, `CHECK (code ~ '^[a-z_]+:[a-z_]+:[a-z_]+$')` |
| `module` | `VARCHAR(50)` | NO | — | Nama modul (`tasks`, `kpi`, `social`, `design`, `assets`, `system`) |
| `resource` | `VARCHAR(50)` | NO | — | Nama entitas/fitur (`project`, `item`, `submission`, `evaluation`, dll.) |
| `action` | `VARCHAR(50)` | NO | — | Aksi (`read`, `create`, `update`, `delete`, `assign`, `approve`, `finalize`, dll.) |
| `description` | `TEXT` | YES | `NULL` | Penjelasan hak akses untuk UI manajemen RBAC |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | Waktu pembuatan |

###### 3. `role_permissions`
- **Tujuan:** Tabel penghubung *many-to-many* antara `roles` dan `permissions`.
- **Kebijakan Delete:** Hard delete saat hak akses dicabut (perubahan dicatat di `activity_logs`).

| Kolom | Tipe PostgreSQL | Null | Default | Constraint / Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `role_id` | `UUID` | NO | — | `PK`, `FK -> roles(id) ON DELETE CASCADE` |
| `permission_id` | `UUID` | NO | — | `PK`, `FK -> permissions(id) ON DELETE CASCADE` |
| `granted_by` | `UUID` | YES | `NULL` | `FK -> users(id) ON DELETE SET NULL` |
| `granted_at` | `TIMESTAMPTZ` | NO | `NOW()` | Waktu pemberian izin |

###### 4. `users`
- **Tujuan:** Identitas autentikasi (Auth.js v5 Credentials), otorisasi role, sekaligus profil inti **Team Directory** (Modul B) agar tidak memecah data user secara berlebihan di V1.
- **Kebijakan Delete:** Soft delete (`deleted_at`) + `is_active = FALSE` agar riwayat task, review, dan KPI user yang sudah keluar tetap utuh.

| Kolom | Tipe PostgreSQL | Null | Default | Constraint / Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | `PRIMARY KEY` |
| `role_id` | `UUID` | NO | — | `FK -> roles(id) ON DELETE RESTRICT` |
| `manager_id` | `UUID` | YES | `NULL` | `FK -> users(id) ON DELETE SET NULL` (atasan langsung / evaluator) |
| `email` | `VARCHAR(255)` | NO | — | `UNIQUE` (disimpan lowercase, `CHECK (email = LOWER(email))`) |
| `password_hash` | `TEXT` | NO | — | Hash Argon2id (atau bcrypt cost 12); tidak pernah dikembalikan ke client |
| `full_name` | `VARCHAR(150)` | NO | — | Nama lengkap anggota tim |
| `display_name` | `VARCHAR(80)` | YES | `NULL` | Nama panggilan di Kanban/Comment |
| `avatar_url` | `TEXT` | YES | `NULL` | URL foto profil |
| `job_title` | `VARCHAR(100)` | NO | — | Jabatan di Team Directory (mis. `Social Media Specialist`) |
| `department` | `VARCHAR(100)` | NO | `'Operations'` | Divisi (`Creative`, `Design`, `Tech`, `Operations`, `Leadership`) |
| `phone` | `VARCHAR(30)` | YES | `NULL` | Nomor kontak internal |
| `bio` | `TEXT` | YES | `NULL` | Ringkasan keahlian/peran di Team Directory |
| `skills` | `TEXT[]` | NO | `'{}'` | Daftar skill untuk filter Team Directory & pembagian task |
| `employment_status` | `employment_status_enum` | NO | `'FULL_TIME'` | Status kepegawaian (bukan payroll/HRIS) |
| `joined_at` | `DATE` | YES | `NULL` | Tanggal bergabung di Krevia Digital |
| `is_active` | `BOOLEAN` | NO | `TRUE` | `FALSE` langsung memblokir login & sesi aktif |
| `must_change_password` | `BOOLEAN` | NO | `FALSE` | `TRUE` untuk akun baru/hasil reset agar wajib ganti password saat login pertama |
| `token_version` | `INTEGER` | NO | `1` | Di-increment saat ganti password, ubah role, atau suspend untuk revoke JWT instan |
| `last_login_at` | `TIMESTAMPTZ` | YES | `NULL` | Timestamp login terakhir |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | Waktu pembuatan akun |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | Auto-update via trigger |
| `deleted_at` | `TIMESTAMPTZ` | YES | `NULL` | Soft delete timestamp |

---

##### Kelompok 2 — Task Management (Modul A)

###### 5. `projects`
- **Tujuan:** Wadah pengelompokan pekerjaan (proyek klien internal, kampanye bulanan, operasional tim) yang menaungi task, konten, dan aset.
- **Kebijakan Delete:** Soft delete (`deleted_at`).

| Kolom | Tipe PostgreSQL | Null | Default | Constraint / Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | `PRIMARY KEY` |
| `code` | `VARCHAR(20)` | NO | — | `UNIQUE`, prefix kode task (mis. `KRV`, `SOC`, `WEB`) |
| `name` | `VARCHAR(150)` | NO | — | Nama proyek |
| `description` | `TEXT` | YES | `NULL` | Deskripsi ruang lingkup & target proyek |
| `status` | `project_status_enum` | NO | `'ACTIVE'` | Status siklus hidup proyek |
| `color_hex` | `VARCHAR(7)` | NO | `'#2563EB'` | Warna badge/kalender (`CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$')`) |
| `owner_id` | `UUID` | NO | — | `FK -> users(id) ON DELETE RESTRICT` (PM / penanggung jawab) |
| `start_date` | `DATE` | YES | `NULL` | Tanggal mulai proyek |
| `target_end_date` | `DATE` | YES | `NULL` | Target selesai (`CHECK (target_end_date IS NULL OR start_date IS NULL OR target_end_date >= start_date)`) |
| `archived_at` | `TIMESTAMPTZ` | YES | `NULL` | Timestamp arsip proyek |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | Waktu dibuat |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | Auto-update via trigger |
| `deleted_at` | `TIMESTAMPTZ` | YES | `NULL` | Soft delete |

###### 6. `project_members`
- **Tujuan:** Menentukan keanggotaan tim dalam sebuah proyek untuk kontrol visibilitas & penugasan task.
- **Kebijakan Delete:** Hard delete saat anggota dikeluarkan dari proyek.

| Kolom | Tipe PostgreSQL | Null | Default | Constraint / Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | `PRIMARY KEY` |
| `project_id` | `UUID` | NO | — | `FK -> projects(id) ON DELETE CASCADE` |
| `user_id` | `UUID` | NO | — | `FK -> users(id) ON DELETE CASCADE` |
| `project_role` | `project_member_role_enum` | NO | `'MEMBER'` | Peran lokal di dalam proyek (`OWNER`, `LEAD`, `MEMBER`, `VIEWER`) |
| `added_by` | `UUID` | YES | `NULL` | `FK -> users(id) ON DELETE SET NULL` |
| `joined_at` | `TIMESTAMPTZ` | NO | `NOW()` | `UNIQUE (project_id, user_id)` |

###### 7. `tasks` (**Unified Task Core — Jantung Integrasi Lintas Modul**)
- **Tujuan:** Tabel tugas tunggal untuk seluruh task umum (`GENERAL`), produksi konten (`CONTENT_PRODUCTION`), dan eksekusi desain (`DESIGN_TASK`). Memberi makan **My Tasks**, **Kanban Board**, **Work Calendar**, dan **KPI / Individual Performance**.
- **Kebijakan Delete:** Soft delete (`deleted_at`).

| Kolom | Tipe PostgreSQL | Null | Default | Constraint / Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | `PRIMARY KEY` |
| `task_code` | `VARCHAR(30)` | NO | — | `UNIQUE`, contoh `KRV-104` (di-generate otomatis) |
| `project_id` | `UUID` | NO | — | `FK -> projects(id) ON DELETE RESTRICT` |
| `parent_task_id` | `UUID` | YES | `NULL` | `FK -> tasks(id) ON DELETE SET NULL` (dukungan subtask) |
| `content_item_id` | `UUID` | YES | `NULL` | `FK -> content_items(id) ON DELETE SET NULL` (**Cross-Module Link**) |
| `design_brief_id` | `UUID` | YES | `NULL` | `FK -> design_briefs(id) ON DELETE SET NULL` (**Cross-Module Link**, partial unique 1:1 aktif) |
| `title` | `VARCHAR(200)` | NO | — | Judul task |
| `description` | `TEXT` | YES | `NULL` | Deskripsi detail / acceptance criteria (Markdown) |
| `task_type` | `task_type_enum` | NO | `'GENERAL'` | `GENERAL`, `CONTENT_PRODUCTION`, atau `DESIGN_TASK` |
| `status` | `task_status_enum` | NO | `'TODO'` | 7 status kanonik Kanban (`BACKLOG` .. `CANCELLED`) |
| `priority` | `task_priority_enum` | NO | `'MEDIUM'` | `LOW`, `MEDIUM`, `HIGH`, `URGENT` |
| `position` | `DOUBLE PRECISION` | NO | `65536` | *Fractional indexing* untuk reorder Kanban O(1) tanpa update seluruh kolom |
| `version` | `INTEGER` | NO | `1` | `CHECK (version >= 1)` — *optimistic concurrency lock* untuk Kanban drag-and-drop |
| `requires_review` | `BOOLEAN` | NO | `TRUE` | Menentukan apakah task wajib melewati status `IN_REVIEW` sebelum `DONE` |
| `assignee_id` | `UUID` | YES | `NULL` | `FK -> users(id) ON DELETE SET NULL` (pelaksana utama) |
| `reporter_id` | `UUID` | NO | — | `FK -> users(id) ON DELETE RESTRICT` (pembuat task) |
| `reviewer_id` | `UUID` | YES | `NULL` | `FK -> users(id) ON DELETE SET NULL` (approver saat status `IN_REVIEW`) |
| `start_date` | `DATE` | YES | `NULL` | Tanggal mulai untuk visualisasi Work Calendar |
| `started_at` | `TIMESTAMPTZ` | YES | `NULL` | Diisi otomatis saat pertama masuk `IN_PROGRESS` (untuk cycle time analytics) |
| `first_submitted_at` | `TIMESTAMPTZ` | YES | `NULL` | Diisi sekali (`COALESCE(first_submitted_at, NOW())`) saat pertama masuk `IN_REVIEW` (acuan adil `OTDR` jika lolos tanpa revisi) |
| `due_date` | `TIMESTAMPTZ` | YES | `NULL` | Batas waktu (acuan perhitungan `is_on_time` dan deadline alert) |
| `completed_at` | `TIMESTAMPTZ` | YES | `NULL` | Diisi otomatis saat transisi ke `DONE` (di-null-kan jika reopen) |
| `is_on_time` | `BOOLEAN` | YES | `NULL` | Diisi saat `DONE`: `effective_completion_time <= due_date`, di mana `effective_completion_time = COALESCE(first_submitted_at, completed_at)` jika `revision_count = 0`, selain itu `completed_at` (`NULL` jika tanpa `due_date`) |
| `estimated_hours` | `NUMERIC(5,2)` | YES | `NULL` | `CHECK (estimated_hours >= 0)` |
| `actual_hours` | `NUMERIC(5,2)` | YES | `NULL` | `CHECK (actual_hours >= 0)` |
| `revision_count` | `INTEGER` | NO | `0` | `CHECK (revision_count >= 0)`; otomatis bertambah saat status masuk `REVISION` atau design ditolak |
| `tags` | `TEXT[]` | NO | `'{}'` | Tag bebas untuk filter cepat |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | Waktu pembuatan |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | Auto-update via trigger |
| `deleted_at` | `TIMESTAMPTZ` | YES | `NULL` | Soft delete |

###### 8. `task_checklists`
- **Tujuan:** Daftar sub-langkah kerja (*checklist item*) di dalam sebuah task untuk pelacakan progres detail.
- **Kebijakan Delete:** Hard delete (cascade saat task benar-benar di-purge).

| Kolom | Tipe PostgreSQL | Null | Default | Constraint / Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | `PRIMARY KEY` |
| `task_id` | `UUID` | NO | — | `FK -> tasks(id) ON DELETE CASCADE` |
| `title` | `VARCHAR(255)` | NO | — | Deskripsi item checklist |
| `is_completed` | `BOOLEAN` | NO | `FALSE` | Status centang |
| `completed_by` | `UUID` | YES | `NULL` | `FK -> users(id) ON DELETE SET NULL` |
| `completed_at` | `TIMESTAMPTZ` | YES | `NULL` | Waktu penyelesaian item |
| `sort_order` | `INTEGER` | NO | `0` | Urutan tampilan checklist |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | Waktu dibuat |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | Auto-update via trigger |

###### 9. `task_comments`
- **Tujuan:** Diskusi terstruktur per task dengan dukungan *reply thread* dan `@mention` yang memicu notifikasi.
- **Kebijakan Delete:** Soft delete (`deleted_at`).

| Kolom | Tipe PostgreSQL | Null | Default | Constraint / Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | `PRIMARY KEY` |
| `task_id` | `UUID` | NO | — | `FK -> tasks(id) ON DELETE CASCADE` |
| `author_id` | `UUID` | NO | — | `FK -> users(id) ON DELETE RESTRICT` |
| `parent_comment_id` | `UUID` | YES | `NULL` | `FK -> task_comments(id) ON DELETE SET NULL` |
| `body` | `TEXT` | NO | — | Isi komentar (Markdown disanitasi) |
| `mentioned_user_ids` | `UUID[]` | NO | `'{}'` | Daftar ID user yang di-mention untuk trigger notifikasi |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | Waktu komentar |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | Auto-update via trigger |
| `deleted_at` | `TIMESTAMPTZ` | YES | `NULL` | Soft delete |

###### 10. `task_attachments`
- **Tujuan:** Menyimpan lampiran hybrid (file upload via Presigned URL maupun external cloud link) pada task.
- **Kebijakan Delete:** Soft delete (`deleted_at`); file fisik di Object Storage dibersihkan oleh retention job.

| Kolom | Tipe PostgreSQL | Null | Default | Constraint / Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | `PRIMARY KEY` |
| `task_id` | `UUID` | NO | — | `FK -> tasks(id) ON DELETE CASCADE` |
| `uploaded_by` | `UUID` | NO | — | `FK -> users(id) ON DELETE RESTRICT` |
| `source_type` | `asset_source_type_enum` | NO | `'UPLOAD'` | `UPLOAD`, `FIGMA`, `CANVA`, `GOOGLE_DRIVE`, `OTHER_LINK` |
| `file_name` | `VARCHAR(255)` | NO | — | Nama tampilan file/link |
| `file_url` | `TEXT` | NO | — | URL eksternal atau URL internal/key reference |
| `storage_key` | `TEXT` | YES | `NULL` | Key di Supabase Storage / S3 (wajib terisi jika `source_type = 'UPLOAD'`) |
| `mime_type` | `VARCHAR(120)` | YES | `NULL` | MIME type tervalidasi |
| `file_size_bytes` | `BIGINT` | YES | `NULL` | `CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0)` |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | Waktu unggah |
| `deleted_at` | `TIMESTAMPTZ` | YES | `NULL` | Soft delete |

---

##### Kelompok 3 — Social Media & Design Management (Modul C)

###### 11. `content_ideas`
- **Tujuan:** Bank ide konten (*Content Ideas Management*) sebelum diseleksi dan dipromosikan menjadi jadwal resmi di *Content Calendar*.
- **Kebijakan Delete:** Soft delete (`deleted_at`).

| Kolom | Tipe PostgreSQL | Null | Default | Constraint / Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | `PRIMARY KEY` |
| `project_id` | `UUID` | NO | — | `FK -> projects(id) ON DELETE RESTRICT` |
| `title` | `VARCHAR(200)` | NO | — | Judul/hook ide konten |
| `description` | `TEXT` | YES | `NULL` | Konsep, sudut pandang, dan objektif konten |
| `target_platform` | `social_platform_enum` | NO | `'INSTAGRAM'` | Platform target utama |
| `content_pillar` | `VARCHAR(100)` | YES | `NULL` | Pilar konten (mis. `Education`, `Case Study`, `Behind The Scene`) |
| `reference_urls` | `JSONB` | NO | `'[]'::jsonb` | Array objek `{ "label": "...", "url": "..." }` |
| `status` | `content_idea_status_enum` | NO | `'IDEA'` | `IDEA`, `APPROVED_IDEA`, `CONVERTED`, `ARCHIVED` |
| `upvoted_by_user_ids` | `UUID[]` | NO | `'{}'` | Daftar ID anggota tim yang memberi upvote pada ide konten |
| `proposed_by` | `UUID` | NO | — | `FK -> users(id) ON DELETE RESTRICT` |
| `reviewed_by` | `UUID` | YES | `NULL` | `FK -> users(id) ON DELETE SET NULL` |
| `review_notes` | `TEXT` | YES | `NULL` | Catatan kurasi dari PM / Leadership |
| `reviewed_at` | `TIMESTAMPTZ` | YES | `NULL` | Waktu review ide |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | Waktu dibuat |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | Auto-update via trigger |
| `deleted_at` | `TIMESTAMPTZ` | YES | `NULL` | Soft delete |

###### 12. `content_items`
- **Tujuan:** Entitas inti **Content Calendar** & **Content Planning** (pengganti spreadsheet konten). Mengelola lifecycle konten dari `IDEA` hingga `PUBLISHED`/`ARCHIVED`.
- **Kebijakan Delete:** Soft delete (`deleted_at`).

| Kolom | Tipe PostgreSQL | Null | Default | Constraint / Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | `PRIMARY KEY` |
| `project_id` | `UUID` | NO | — | `FK -> projects(id) ON DELETE RESTRICT` |
| `idea_id` | `UUID` | YES | `NULL` | `FK -> content_ideas(id) ON DELETE SET NULL` (jejak asal ide) |
| `title` | `VARCHAR(200)` | NO | — | Judul konten pada kalender |
| `platform` | `social_platform_enum` | NO | — | Platform publikasi |
| `content_format` | `content_format_enum` | NO | — | Format (`REELS`, `CAROUSEL`, `SINGLE_POST`, dll.) |
| `content_pillar` | `VARCHAR(100)` | YES | `NULL` | Pilar konten untuk analitik proporsi konten |
| `campaign_name` | `VARCHAR(150)` | YES | `NULL` | Nama kampanye (opsional) |
| `status` | `content_status_enum` | NO | `'PLANNING'` | 10 status kanonik (`IDEA` .. `ARCHIVED`) |
| `requires_design` | `BOOLEAN` | NO | `TRUE` | `TRUE` jika konten membutuhkan eksekusi visual (memicu pembuatan `design_briefs` & `DESIGN_TASK`) |
| `caption` | `TEXT` | YES | `NULL` | Draft/final caption media sosial |
| `hashtags` | `TEXT[]` | NO | `'{}'` | Daftar hashtag terstruktur |
| `cta_text` | `VARCHAR(255)` | YES | `NULL` | Call-to-action konten |
| `creator_id` | `UUID` | NO | — | `FK -> users(id) ON DELETE RESTRICT` (Content Creator PIC) |
| `approver_id` | `UUID` | YES | `NULL` | `FK -> users(id) ON DELETE SET NULL` (PM / Reviewer) |
| `planned_publish_at` | `TIMESTAMPTZ` | YES | `NULL` | Jadwal tayang di Content Calendar |
| `published_at` | `TIMESTAMPTZ` | YES | `NULL` | Waktu tayang aktual (wajib terisi saat status `PUBLISHED`) |
| `published_url` | `TEXT` | YES | `NULL` | Tautan postingan live |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | Waktu dibuat |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | Auto-update via trigger |
| `deleted_at` | `TIMESTAMPTZ` | YES | `NULL` | Soft delete |

###### 13. `design_briefs`
- **Tujuan:** Dokumen brief kreatif terstruktur di **Design Workspace**. Dapat terhubung ke `content_items` maupun berdiri sendiri untuk kebutuhan desain non-sosmed (mis. deck presentasi/banner internal). Otomatis men-spawn 1 `tasks` bertipe `DESIGN_TASK`.
- **Kebijakan Delete:** Soft delete (`deleted_at`).

| Kolom | Tipe PostgreSQL | Null | Default | Constraint / Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | `PRIMARY KEY` |
| `project_id` | `UUID` | NO | — | `FK -> projects(id) ON DELETE RESTRICT` |
| `content_item_id` | `UUID` | YES | `NULL` | `FK -> content_items(id) ON DELETE SET NULL` |
| `title` | `VARCHAR(200)` | NO | — | Judul brief desain |
| `objective` | `TEXT` | NO | — | Tujuan visual & pesan utama |
| `dimensions_spec` | `VARCHAR(150)` | YES | `NULL` | Spesifikasi dimensi (mis. `1080x1350px 4:5, 5 slides`) |
| `copy_text` | `TEXT` | YES | `NULL` | Teks wajib yang tampil di dalam visual |
| `brand_guidelines_notes` | `TEXT` | YES | `NULL` | Instruksi warna, font, dan gaya visual |
| `reference_links` | `JSONB` | NO | `'[]'::jsonb` | Array moodboard/referensi `[{ "label": "...", "url": "..." }]` |
| `status` | `design_submission_status_enum` | NO | `'PENDING_BRIEF'` | 5 status kanonik (`PENDING_BRIEF` .. `APPROVED`) |
| `requested_by` | `UUID` | NO | — | `FK -> users(id) ON DELETE RESTRICT` |
| `assigned_designer_id` | `UUID` | YES | `NULL` | `FK -> users(id) ON DELETE SET NULL` |
| `due_date` | `TIMESTAMPTZ` | YES | `NULL` | Deadline desain (tersinkron dengan `tasks.due_date`) |
| `current_version` | `INTEGER` | NO | `0` | Versi submission terakhir (`0` = belum submit) |
| `revision_count` | `INTEGER` | NO | `0` | Total siklus revisi (masukan metrik KPI kualitas Designer) |
| `approved_at` | `TIMESTAMPTZ` | YES | `NULL` | Waktu desain disetujui final |
| `approved_by` | `UUID` | YES | `NULL` | `FK -> users(id) ON DELETE SET NULL` |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | Waktu dibuat |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | Auto-update via trigger |
| `deleted_at` | `TIMESTAMPTZ` | YES | `NULL` | Soft delete |

###### 14. `design_submissions`
- **Tujuan:** Menyimpan setiap versi unggahan hasil desain (`v1`, `v2`, `v3`...) secara kronologis untuk histori revisi dan perbandingan versi di **Design Workspace**.
- **Kebijakan Delete:** Immutable history (tidak di-delete agar jejak revisi KPI tidak bisa dimanipulasi).

| Kolom | Tipe PostgreSQL | Null | Default | Constraint / Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | `PRIMARY KEY` |
| `design_brief_id` | `UUID` | NO | — | `FK -> design_briefs(id) ON DELETE CASCADE` |
| `version_number` | `INTEGER` | NO | — | `CHECK (version_number >= 1)`, `UNIQUE (design_brief_id, version_number)` |
| `submitted_by` | `UUID` | NO | — | `FK -> users(id) ON DELETE RESTRICT` |
| `status` | `design_submission_status_enum` | NO | `'SUBMITTED'` | `CHECK (status IN ('SUBMITTED', 'REVISION_REQUESTED', 'APPROVED'))` |
| `source_type` | `asset_source_type_enum` | NO | `'UPLOAD'` | Hybrid: file upload atau link Figma/Canva/GDrive |
| `file_url` | `TEXT` | NO | — | URL pratinjau/link desain |
| `storage_key` | `TEXT` | YES | `NULL` | Key Object Storage jika `source_type = 'UPLOAD'` |
| `thumbnail_url` | `TEXT` | YES | `NULL` | URL thumbnail ringan untuk grid Design Workspace |
| `mime_type` | `VARCHAR(120)` | YES | `NULL` | MIME type file |
| `file_size_bytes` | `BIGINT` | YES | `NULL` | Ukuran file (bytes) |
| `designer_notes` | `TEXT` | YES | `NULL` | Catatan perubahan dari Designer pada versi ini |
| `submitted_at` | `TIMESTAMPTZ` | NO | `NOW()` | Waktu pengumpulan versi |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | Waktu pencatatan |

###### 15. `design_reviews`
- **Tujuan:** Mencatat keputusan **Approval & Revision Loop** secara eksplisit per versi submission beserta daftar poin revisi terstruktur.
- **Kebijakan Delete:** Immutable review log.

| Kolom | Tipe PostgreSQL | Null | Default | Constraint / Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | `PRIMARY KEY` |
| `design_submission_id` | `UUID` | NO | — | `FK -> design_submissions(id) ON DELETE CASCADE` |
| `reviewer_id` | `UUID` | NO | — | `FK -> users(id) ON DELETE RESTRICT` |
| `decision` | `design_review_decision_enum` | NO | — | `APPROVED` atau `REVISION_REQUESTED` |
| `feedback` | `TEXT` | NO | — | Catatan evaluasi / alasan revisi |
| `revision_checklist` | `JSONB` | NO | `'[]'::jsonb` | Daftar poin revisi `[{ "item": "Perbesar CTA slide 3", "resolved": false }]` |
| `reviewed_at` | `TIMESTAMPTZ` | NO | `NOW()` | Waktu keputusan review |

###### 16. `assets`
- **Tujuan:** **Asset Library** terpusat untuk menyimpan brand kit, template, dan hasil desain yang dipromosikan otomatis/manual setelah disetujui (`APPROVED`).
- **Kebijakan Delete:** Soft delete (`deleted_at`).

| Kolom | Tipe PostgreSQL | Null | Default | Constraint / Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | `PRIMARY KEY` |
| `project_id` | `UUID` | YES | `NULL` | `FK -> projects(id) ON DELETE SET NULL` |
| `content_item_id` | `UUID` | YES | `NULL` | `FK -> content_items(id) ON DELETE SET NULL` |
| `design_submission_id` | `UUID` | YES | `NULL` | `FK -> design_submissions(id) ON DELETE SET NULL` (sumber promosi desain) |
| `title` | `VARCHAR(200)` | NO | — | Judul aset |
| `description` | `TEXT` | YES | `NULL` | Keterangan penggunaan aset |
| `category` | `asset_category_enum` | NO | `'OTHER'` | Kategori aset (`BRAND_KIT`, `SOCIAL_MEDIA`, `CAMPAIGN`, dll.) |
| `source_type` | `asset_source_type_enum` | NO | `'UPLOAD'` | Hybrid upload atau external link |
| `file_url` | `TEXT` | NO | — | URL aset |
| `storage_key` | `TEXT` | YES | `NULL` | Key Object Storage bila di-upload |
| `thumbnail_url` | `TEXT` | YES | `NULL` | URL thumbnail |
| `mime_type` | `VARCHAR(120)` | YES | `NULL` | MIME type |
| `file_size_bytes` | `BIGINT` | YES | `NULL` | Ukuran file |
| `tags` | `TEXT[]` | NO | `'{}'` | Tag pencarian cepat (diindeks dengan GIN) |
| `metadata` | `JSONB` | NO | `'{}'::jsonb` | Dimensi, durasi video, rasio aspek, dsb. |
| `uploaded_by` | `UUID` | NO | — | `FK -> users(id) ON DELETE RESTRICT` |
| `is_approved_brand_asset` | `BOOLEAN` | NO | `FALSE` | Penanda aset resmi terverifikasi brand |
| `is_superseded` | `BOOLEAN` | NO | `FALSE` | `TRUE` bila versi aset lebih baru telah diunggah/dipromosikan menggantikan aset lama |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | Waktu dibuat |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | Auto-update via trigger |
| `deleted_at` | `TIMESTAMPTZ` | YES | `NULL` | Soft delete |

###### 17. `content_analytics`
- **Tujuan:** **Content Performance Analytics** — menyimpan catatan performa berkala (mis. H+1, H+7, H+30) untuk konten yang berstatus `PUBLISHED`.
- **Kebijakan Delete:** Hard delete oleh admin/PM jika salah input.

| Kolom | Tipe PostgreSQL | Null | Default | Constraint / Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | `PRIMARY KEY` |
| `content_item_id` | `UUID` | NO | — | `FK -> content_items(id) ON DELETE CASCADE` |
| `recorded_date` | `DATE` | NO | — | Tanggal pencatatan snapshot metrik; `UNIQUE (content_item_id, recorded_date)` |
| `impressions` | `INTEGER` | NO | `0` | `CHECK (impressions >= 0)` |
| `reach` | `INTEGER` | NO | `0` | `CHECK (reach >= 0)` |
| `likes` | `INTEGER` | NO | `0` | `CHECK (likes >= 0)` |
| `comments` | `INTEGER` | NO | `0` | `CHECK (comments >= 0)` |
| `shares` | `INTEGER` | NO | `0` | `CHECK (shares >= 0)` |
| `saves` | `INTEGER` | NO | `0` | `CHECK (saves >= 0)` |
| `clicks` | `INTEGER` | NO | `0` | `CHECK (clicks >= 0)` |
| `video_views` | `INTEGER` | NO | `0` | `CHECK (video_views >= 0)` |
| `engagement_rate` | `NUMERIC(6,2)` | NO | `GENERATED` | *Stored Generated Column*: `CASE WHEN reach = 0 THEN 0.00 ELSE LEAST(999.99, ROUND(((likes + comments + shares + saves)::NUMERIC / reach) * 100, 2)) END` (tanpa fallback ke `impressions`) |
| `ctr` | `NUMERIC(6,2)` | NO | `GENERATED` | *Stored Generated Column*: `CASE WHEN impressions = 0 THEN 0.00 ELSE LEAST(999.99, ROUND((clicks::NUMERIC / impressions) * 100, 2)) END` |
| `notes` | `TEXT` | YES | `NULL` | Catatan insight performa |
| `recorded_by` | `UUID` | NO | — | `FK -> users(id) ON DELETE RESTRICT` |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | Waktu input |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | Auto-update via trigger |

---

##### Kelompok 4 — Team Management & KPI (Modul B)

###### 18. `kpi_templates`
- **Tujuan:** Master definisi indikator KPI (baik metrik otomatis dari sistem seperti *On-Time Delivery Rate* & *Avg Design Revision* maupun indikator kualitatif manual seperti *Inisiatif & Kolaborasi*).
- **Kebijakan Delete:** Soft delete (`deleted_at`) agar evaluasi historis tetap punya referensi indikator.

| Kolom | Tipe PostgreSQL | Null | Default | Constraint / Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | `PRIMARY KEY` |
| `code` | `VARCHAR(50)` | NO | — | `UNIQUE`, contoh `KPI_TCR`, `KPI_OTDR`, `KPI_DQS`, `KPI_CPVS`, `KPI_COLLAB` |
| `name` | `VARCHAR(150)` | NO | — | Nama indikator KPI |
| `description` | `TEXT` | YES | `NULL` | Formula & panduan penilaian |
| `category` | `kpi_category_enum` | NO | — | `DELIVERY`, `QUALITY`, `PRODUCTIVITY`, `CREATIVE`, `COLLABORATION` |
| `applicable_role_id` | `UUID` | YES | `NULL` | `FK -> roles(id) ON DELETE SET NULL` (`NULL` = berlaku untuk semua role) |
| `metric_source` | `kpi_metric_source_enum` | NO | — | `AUTO_TCR`, `AUTO_OTDR`, `AUTO_DQS`, `AUTO_CPVS`, atau `MANUAL_SCORE` (unit manual: `SCORE_100` skala 0–100) |
| `unit` | `kpi_unit_enum` | NO | `'PERCENTAGE'` | Satuan metrik (`PERCENTAGE`, `COUNT`, `SCORE_100`, `RATIO`) |
| `default_target_value` | `NUMERIC(10,2)` | NO | — | Target standar (mis. `90.00` untuk 90% TCR/OTDR, `85.00` untuk DQS, `12.00` konten/bulan untuk CPVS) |
| `default_weight` | `NUMERIC(5,2)` | NO | — | Bobot default 0–100 (`CHECK (default_weight > 0 AND default_weight <= 100)`) |
| `is_higher_better` | `BOOLEAN` | NO | `TRUE` | `TRUE` untuk seluruh skor kanonik termasuk `AUTO_DQS` (skor kualitas desain 40–100; makin tinggi makin baik) |
| `is_active` | `BOOLEAN` | NO | `TRUE` | Status aktif untuk periode baru |
| `created_by` | `UUID` | NO | — | `FK -> users(id) ON DELETE RESTRICT` |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | Waktu dibuat |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | Auto-update via trigger |
| `deleted_at` | `TIMESTAMPTZ` | YES | `NULL` | Soft delete |

###### 19. `kpi_assignments`
- **Tujuan:** Menetapkan target & bobot KPI spesifik per individu pada bulan & tahun tertentu (total bobot per user per periode divalidasi = `100.00` di Service Layer sebelum evaluasi di-submit).
- **Kebijakan Delete:** Hard delete hanya jika `monthly_evaluations` periode terkait belum berstatus `FINALIZED`.

| Kolom | Tipe PostgreSQL | Null | Default | Constraint / Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | `PRIMARY KEY` |
| `user_id` | `UUID` | NO | — | `FK -> users(id) ON DELETE RESTRICT` |
| `kpi_template_id` | `UUID` | NO | — | `FK -> kpi_templates(id) ON DELETE RESTRICT` |
| `period_year` | `SMALLINT` | NO | — | `CHECK (period_year BETWEEN 2024 AND 2100)` |
| `period_month` | `SMALLINT` | NO | — | `CHECK (period_month BETWEEN 1 AND 12)` |
| `target_value` | `NUMERIC(10,2)` | NO | — | Target yang disesuaikan untuk user pada bulan tersebut |
| `weight` | `NUMERIC(5,2)` | NO | — | `CHECK (weight > 0 AND weight <= 100)` |
| `assigned_by` | `UUID` | NO | — | `FK -> users(id) ON DELETE RESTRICT` |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | `UNIQUE (user_id, kpi_template_id, period_year, period_month)` |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | Auto-update via trigger |

###### 20. `monthly_evaluations`
- **Tujuan:** Header **Monthly Evaluation** & penyimpanan **Computed Immutable KPI Snapshot** per anggota tim per bulan. Saat berstatus `FINALIZED`, baris ini dikunci (*read-only*) sebagai arsip resmi laporan manajemen.
- **Kebijakan Delete:** Tidak dihapus (rekam kinerja permanen).

| Kolom | Tipe PostgreSQL | Null | Default | Constraint / Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | `PRIMARY KEY` |
| `user_id` | `UUID` | NO | — | `FK -> users(id) ON DELETE RESTRICT` |
| `evaluator_id` | `UUID` | NO | — | `FK -> users(id) ON DELETE RESTRICT`, `CHECK (evaluator_id <> user_id)` (PM / Leadership penilai; tidak boleh menilai diri sendiri) |
| `period_year` | `SMALLINT` | NO | — | `CHECK (period_year BETWEEN 2024 AND 2100)` |
| `period_month` | `SMALLINT` | NO | — | `CHECK (period_month BETWEEN 1 AND 12)`, `UNIQUE (user_id, period_year, period_month)` |
| `status` | `kpi_evaluation_status_enum` | NO | `'DRAFT'` | `DRAFT`, `SUBMITTED`, `REVIEWED`, `FINALIZED` |
| `total_tasks_assigned` | `INTEGER` | NO | `0` | Jumlah task periode tersebut (snapshot) |
| `total_tasks_completed` | `INTEGER` | NO | `0` | Jumlah task berstatus `DONE` pada periode tersebut |
| `tasks_completed_on_time` | `INTEGER` | NO | `0` | Jumlah task `DONE` dengan `is_on_time = TRUE` |
| `completion_rate` | `NUMERIC(5,2)` | YES | `NULL` | Persentase `(completed / assigned) * 100`; **`NULL` (`N/A`)** jika denominator = 0 |
| `on_time_rate` | `NUMERIC(5,2)` | YES | `NULL` | Persentase `(on_time / completed_with_due) * 100`; **`NULL` (`N/A`)** jika denominator = 0 |
| `avg_revision_count` | `NUMERIC(5,2)` | YES | `NULL` | Rata-rata revisi per task/design selesai; **`NULL` (`N/A`)** jika belum ada data |
| `design_quality_score` | `NUMERIC(5,2)` | YES | `NULL` | Skor DQS Designer (`ROUND(AVG(GREATEST(40, 100 - 15 * revision_count)), 2)`); **`NULL` (`N/A`)** jika 0 design brief approved |
| `weighted_kpi_score` | `NUMERIC(5,2)` | NO | `0.00` | Skor akhir berbobot hasil *weight re-normalization* (`CHECK (weighted_kpi_score BETWEEN 0 AND 100)`) |
| `performance_grade` | `kpi_grade_enum` | YES | `NULL` | 4 Grade kanonik: `A` (`90–100`), `B` (`80–89.99`), `C` (`70–79.99`), `D` (`0–69.99`) |
| `auto_metrics_snapshot` | `JSONB` | NO | `'{}'::jsonb` | **Frozen Audit Payload:** menyimpan `task_ids`, breakdown `task_type`, `design_brief_ids`, dan `calculated_at` |
| `self_assessment_notes` | `TEXT` | YES | `NULL` | Refleksi/catatan anggota tim saat submit |
| `evaluator_notes` | `TEXT` | YES | `NULL` | Feedback resmi & rencana pengembangan dari evaluator |
| `submitted_at` | `TIMESTAMPTZ` | YES | `NULL` | Waktu submit |
| `reviewed_at` | `TIMESTAMPTZ` | YES | `NULL` | Waktu review |
| `finalized_at` | `TIMESTAMPTZ` | YES | `NULL` | Waktu dikunci permanen |
| `finalized_by` | `UUID` | YES | `NULL` | `FK -> users(id) ON DELETE SET NULL` |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | Waktu dibuat |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | Auto-update via trigger |

###### 21. `evaluation_items`
- **Tujuan:** Rincian skor per indikator KPI di dalam `monthly_evaluations` lengkap dengan snapshot nama indikator & bobot agar tetap akurat meskipun template berubah di bulan berikutnya.
- **Kebijakan Delete:** Cascade bersama `monthly_evaluations` (diblokir di Service Layer saat status `FINALIZED`).

| Kolom | Tipe PostgreSQL | Null | Default | Constraint / Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | `PRIMARY KEY` |
| `monthly_evaluation_id` | `UUID` | NO | — | `FK -> monthly_evaluations(id) ON DELETE CASCADE` |
| `kpi_assignment_id` | `UUID` | YES | `NULL` | `FK -> kpi_assignments(id) ON DELETE SET NULL` |
| `kpi_template_id` | `UUID` | NO | — | `FK -> kpi_templates(id) ON DELETE RESTRICT` |
| `indicator_name_snapshot` | `VARCHAR(150)` | NO | — | Nama indikator dibekukan saat evaluasi dibuat |
| `metric_source` | `kpi_metric_source_enum` | NO | — | Sumber perhitungan indikator |
| `target_value` | `NUMERIC(10,2)` | NO | — | Nilai target pada periode tersebut |
| `actual_value` | `NUMERIC(10,2)` | YES | `NULL` | Capaian aktual (otomatis atau input evaluator); `NULL` jika indikator berstatus `N/A` (denominator = 0) |
| `weight` | `NUMERIC(5,2)` | NO | — | Bobot persentase (`CHECK (weight > 0 AND weight <= 100)`) |
| `achievement_pct` | `NUMERIC(6,2)` | YES | `NULL` | Skor/persentase pencapaian (`CHECK (achievement_pct IS NULL OR achievement_pct BETWEEN 0 AND 100)`, maks. `100.00`; `NULL` bila `N/A`) |
| `weighted_score` | `NUMERIC(6,2)` | YES | `NULL` | Kontribusi skor ter-normalisasi terhadap bobot aktif (`NULL` bila indikator `N/A`) |
| `evidence_notes` | `TEXT` | YES | `NULL` | Catatan bukti pendukung penilaian |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | `UNIQUE (monthly_evaluation_id, kpi_template_id)` |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | Auto-update via trigger |

---

##### Kelompok 5 — System Management: Notifications, Announcements & Audit Trail (Modul D)

###### 22. `notifications`
- **Tujuan:** **Notification Center (In-App)** yang mencatat pemberitahuan terpersonalisasi beserta deep link ke entitas terkait.
- **Kebijakan Delete:** Retensi otomatis (mis. arsip/purge notifikasi terbaca >90 hari via cron).

| Kolom | Tipe PostgreSQL | Null | Default | Constraint / Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | `PRIMARY KEY` |
| `recipient_id` | `UUID` | NO | — | `FK -> users(id) ON DELETE CASCADE` |
| `actor_id` | `UUID` | YES | `NULL` | `FK -> users(id) ON DELETE SET NULL` (`NULL` = sistem/cron) |
| `type` | `notification_type_enum` | NO | — | Jenis event notifikasi |
| `title` | `VARCHAR(180)` | NO | — | Judul ringkas notifikasi |
| `message` | `TEXT` | NO | — | Pesan lengkap notifikasi |
| `entity_type` | `VARCHAR(50)` | YES | `NULL` | Mis. `TASK`, `DESIGN_BRIEF`, `CONTENT_ITEM`, `MONTHLY_EVALUATION`, `ANNOUNCEMENT` |
| `entity_id` | `UUID` | YES | `NULL` | ID entitas terkait |
| `action_url` | `VARCHAR(255)` | YES | `NULL` | Deep-link internal Next.js (mis. `/tasks/uuid`) |
| `is_read` | `BOOLEAN` | NO | `FALSE` | Status baca |
| `read_at` | `TIMESTAMPTZ` | YES | `NULL` | Waktu dibaca |
| `metadata` | `JSONB` | NO | `'{}'::jsonb` | Data tambahan ringan (`taskCode`, `versionNumber`, dll.) |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | Waktu notifikasi dikirim |

###### 23. `announcements`
- **Tujuan:** **Announcements** internal dari Leadership / PM dengan opsi pinning, prioritas, masa berlaku, dan penargetan peran.
- **Kebijakan Delete:** Soft delete (`deleted_at`).

| Kolom | Tipe PostgreSQL | Null | Default | Constraint / Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | `PRIMARY KEY` |
| `author_id` | `UUID` | NO | — | `FK -> users(id) ON DELETE RESTRICT` |
| `title` | `VARCHAR(200)` | NO | — | Judul pengumuman |
| `content` | `TEXT` | NO | — | Isi pengumuman (Markdown) |
| `priority` | `announcement_priority_enum` | NO | `'INFO'` | `INFO`, `IMPORTANT`, `URGENT` |
| `target_role_ids` | `UUID[]` | NO | `'{}'` | Kosong (`'{}'`) = broadcast ke semua role; terisi = hanya role tertentu |
| `is_pinned` | `BOOLEAN` | NO | `FALSE` | Disematkan di bagian atas Dashboard & halaman Announcements |
| `published_at` | `TIMESTAMPTZ` | NO | `NOW()` | Waktu tayang pengumuman |
| `expires_at` | `TIMESTAMPTZ` | YES | `NULL` | Batas akhir tayang di banner aktif (opsional) |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | Waktu dibuat |
| `updated_at` | `TIMESTAMPTZ` | NO | `NOW()` | Auto-update via trigger |
| `deleted_at` | `TIMESTAMPTZ` | YES | `NULL` | Soft delete |

###### 24. `announcement_reads`
- **Tujuan:** Melacak siapa saja yang sudah membaca pengumuman penting (*read receipt*) untuk memastikan komunikasi Leadership tersampaikan.
- **Kebijakan Delete:** Cascade saat pengumuman dihapus fisik.

| Kolom | Tipe PostgreSQL | Null | Default | Constraint / Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `announcement_id` | `UUID` | NO | — | `PK`, `FK -> announcements(id) ON DELETE CASCADE` |
| `user_id` | `UUID` | NO | — | `PK`, `FK -> users(id) ON DELETE CASCADE` |
| `read_at` | `TIMESTAMPTZ` | NO | `NOW()` | Waktu user membaca/mengonfirmasi pengumuman |

###### 25. `activity_logs` (**Immutable Audit Trail**)
- **Tujuan:** Rekaman audit permanen untuk setiap aksi mutasi (`CREATE`, `UPDATE`, `DELETE`, `STATUS_CHANGE`, `APPROVE`, `REVISION`, `ROLE_CHANGE`, `LOGIN`, `FINALIZE_KPI`) dengan perbandingan sebelum-sesudah dalam `JSONB`.
- **Kebijakan Delete:** **APPEND-ONLY (Immutable).** Dilindungi oleh database trigger yang menolak `UPDATE` dan `DELETE`.

| Kolom | Tipe PostgreSQL | Null | Default | Constraint / Keterangan |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `UUID` | NO | `gen_random_uuid()` | `PRIMARY KEY` |
| `actor_id` | `UUID` | YES | `NULL` | `FK -> users(id) ON DELETE SET NULL` (`NULL` = sistem/cron) |
| `action` | `VARCHAR(80)` | NO | — | Contoh: `tasks:item:status_changed`, `design:submission:approved` |
| `module` | `VARCHAR(50)` | NO | — | 4 modul kanonik: `'TASKS'`, `'TEAM_KPI'`, `'SOCIAL_DESIGN'`, `'SYSTEM'` |
| `entity_type` | `VARCHAR(60)` | NO | — | Nama entitas (`TASK`, `USER`, `DESIGN_BRIEF`, `MONTHLY_EVALUATION`, dll.) |
| `entity_id` | `UUID` | YES | `NULL` | ID entitas yang terdampak |
| `summary` | `VARCHAR(255)` | NO | — | Ringkasan terbaca manusia (mis. `"Mhd Yoga memindahkan KRV-104 ke IN_REVIEW"`) |
| `old_values` | `JSONB` | YES | `NULL` | State sebelum mutasi (field sensitif seperti `password_hash` wajib di-redact) |
| `new_values` | `JSONB` | YES | `NULL` | State sesudah mutasi |
| `ip_address` | `INET` | YES | `NULL` | Alamat IP asal request |
| `user_agent` | `TEXT` | YES | `NULL` | Browser/client user-agent |
| `created_at` | `TIMESTAMPTZ` | NO | `NOW()` | Timestamp aksi (tidak memiliki `updated_at`/`deleted_at`) |

---

#### 3.3 Production SQL DDL Lengkap (PostgreSQL 16 — Copy-Paste Ready)

Urutan `CREATE TABLE` di bawah disusun secara topologis (*zero circular FK deadlock*) sehingga dapat dijalankan langsung pada PostgreSQL 16 setelah blok ENUM pada Sub-bab 3.1.

```sql
-- ============================================================================
-- HELPER TRIGGER FUNCTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION fn_prevent_audit_log_mutation()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'activity_logs bersifat immutable (append-only): operasi % ditolak.', TG_OP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. IDENTITY, TEAM DIRECTORY & RBAC
-- ============================================================================

CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(50) NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  description TEXT,
  is_system   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_roles_code_format CHECK (code ~ '^[A-Z][A-Z0-9_]*$')
);

CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id           UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  manager_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  email             VARCHAR(255) NOT NULL UNIQUE,
  password_hash     TEXT NOT NULL,
  full_name         VARCHAR(150) NOT NULL,
  display_name      VARCHAR(80),
  avatar_url        TEXT,
  job_title         VARCHAR(100) NOT NULL,
  department        VARCHAR(100) NOT NULL DEFAULT 'Operations',
  phone             VARCHAR(30),
  bio               TEXT,
  skills            TEXT[] NOT NULL DEFAULT '{}',
  employment_status employment_status_enum NOT NULL DEFAULT 'FULL_TIME',
  joined_at         DATE,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  token_version        INTEGER NOT NULL DEFAULT 1,
  last_login_at     TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at        TIMESTAMPTZ,
  CONSTRAINT chk_users_email_lower CHECK (email = LOWER(email)),
  CONSTRAINT chk_users_no_self_manager CHECK (manager_id IS NULL OR manager_id <> id),
  CONSTRAINT chk_users_token_version CHECK (token_version >= 1)
);

CREATE TABLE permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(100) NOT NULL UNIQUE,
  module      VARCHAR(50) NOT NULL,
  resource    VARCHAR(50) NOT NULL,
  action      VARCHAR(50) NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_permissions_code_format CHECK (code ~ '^[a-z_]+:[a-z_]+:[a-z_]+$')
);

CREATE TABLE role_permissions (
  role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  granted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- ============================================================================
-- 2. PROJECTS & MEMBERSHIP (MODUL A)
-- ============================================================================

CREATE TABLE projects (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code            VARCHAR(20) NOT NULL UNIQUE,
  name            VARCHAR(150) NOT NULL,
  description     TEXT,
  status          project_status_enum NOT NULL DEFAULT 'ACTIVE',
  color_hex       VARCHAR(7) NOT NULL DEFAULT '#2563EB',
  owner_id        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  start_date      DATE,
  target_end_date DATE,
  archived_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  CONSTRAINT chk_projects_code_upper CHECK (code ~ '^[A-Z0-9_-]{2,20}$'),
  CONSTRAINT chk_projects_color_hex CHECK (color_hex ~ '^#[0-9A-Fa-f]{6}$'),
  CONSTRAINT chk_projects_dates CHECK (
    target_end_date IS NULL OR start_date IS NULL OR target_end_date >= start_date
  )
);

CREATE TABLE project_members (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  project_role project_member_role_enum NOT NULL DEFAULT 'MEMBER',
  added_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  joined_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_project_members_pair UNIQUE (project_id, user_id)
);

-- ============================================================================
-- 3. SOCIAL MEDIA & DESIGN MANAGEMENT (MODUL C)
-- ============================================================================

CREATE TABLE content_ideas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  target_platform social_platform_enum NOT NULL DEFAULT 'INSTAGRAM',
  content_pillar  VARCHAR(100),
  reference_urls      JSONB NOT NULL DEFAULT '[]'::jsonb,
  status              content_idea_status_enum NOT NULL DEFAULT 'IDEA',
  upvoted_by_user_ids UUID[] NOT NULL DEFAULT '{}',
  proposed_by         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reviewed_by     UUID REFERENCES users(id) ON DELETE SET NULL,
  review_notes    TEXT,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE content_items (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  idea_id            UUID REFERENCES content_ideas(id) ON DELETE SET NULL,
  title              VARCHAR(200) NOT NULL,
  platform           social_platform_enum NOT NULL,
  content_format     content_format_enum NOT NULL,
  content_pillar     VARCHAR(100),
  campaign_name      VARCHAR(150),
  status             content_status_enum NOT NULL DEFAULT 'PLANNING',
  requires_design    BOOLEAN NOT NULL DEFAULT TRUE,
  caption            TEXT,
  hashtags           TEXT[] NOT NULL DEFAULT '{}',
  cta_text           VARCHAR(255),
  creator_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  approver_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  planned_publish_at TIMESTAMPTZ,
  published_at       TIMESTAMPTZ,
  published_url      TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ
);

CREATE TABLE design_briefs (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id             UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  content_item_id        UUID REFERENCES content_items(id) ON DELETE SET NULL,
  title                  VARCHAR(200) NOT NULL,
  objective              TEXT NOT NULL,
  dimensions_spec        VARCHAR(150),
  copy_text              TEXT,
  brand_guidelines_notes TEXT,
  reference_links        JSONB NOT NULL DEFAULT '[]'::jsonb,
  status                 design_submission_status_enum NOT NULL DEFAULT 'PENDING_BRIEF',
  requested_by           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  assigned_designer_id   UUID REFERENCES users(id) ON DELETE SET NULL,
  due_date               TIMESTAMPTZ,
  current_version        INTEGER NOT NULL DEFAULT 0,
  revision_count         INTEGER NOT NULL DEFAULT 0,
  approved_at            TIMESTAMPTZ,
  approved_by            UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at             TIMESTAMPTZ,
  CONSTRAINT chk_design_briefs_counters CHECK (current_version >= 0 AND revision_count >= 0)
);

CREATE TABLE design_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_brief_id UUID NOT NULL REFERENCES design_briefs(id) ON DELETE CASCADE,
  version_number  INTEGER NOT NULL,
  submitted_by    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status          design_submission_status_enum NOT NULL DEFAULT 'SUBMITTED',
  source_type     asset_source_type_enum NOT NULL DEFAULT 'UPLOAD',
  file_url        TEXT NOT NULL,
  storage_key     TEXT,
  thumbnail_url   TEXT,
  mime_type       VARCHAR(120),
  file_size_bytes BIGINT,
  designer_notes  TEXT,
  submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_design_submissions_ver UNIQUE (design_brief_id, version_number),
  CONSTRAINT chk_design_submissions_ver CHECK (version_number >= 1),
  CONSTRAINT chk_design_submissions_status CHECK (
    status IN ('SUBMITTED', 'REVISION_REQUESTED', 'APPROVED')
  ),
  CONSTRAINT chk_design_submissions_upload_key CHECK (
    source_type <> 'UPLOAD' OR storage_key IS NOT NULL
  ),
  CONSTRAINT chk_design_submissions_size CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0)
);

CREATE TABLE design_reviews (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_submission_id UUID NOT NULL REFERENCES design_submissions(id) ON DELETE CASCADE,
  reviewer_id          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  decision             design_review_decision_enum NOT NULL,
  feedback             TEXT NOT NULL,
  revision_checklist   JSONB NOT NULL DEFAULT '[]'::jsonb,
  reviewed_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE assets (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id              UUID REFERENCES projects(id) ON DELETE SET NULL,
  content_item_id         UUID REFERENCES content_items(id) ON DELETE SET NULL,
  design_submission_id    UUID REFERENCES design_submissions(id) ON DELETE SET NULL,
  title                   VARCHAR(200) NOT NULL,
  description             TEXT,
  category                asset_category_enum NOT NULL DEFAULT 'OTHER',
  source_type             asset_source_type_enum NOT NULL DEFAULT 'UPLOAD',
  file_url                TEXT NOT NULL,
  storage_key             TEXT,
  thumbnail_url           TEXT,
  mime_type               VARCHAR(120),
  file_size_bytes         BIGINT,
  tags                    TEXT[] NOT NULL DEFAULT '{}',
  metadata                JSONB NOT NULL DEFAULT '{}'::jsonb,
  uploaded_by             UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  is_approved_brand_asset BOOLEAN NOT NULL DEFAULT FALSE,
  is_superseded           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at              TIMESTAMPTZ,
  CONSTRAINT chk_assets_upload_key CHECK (source_type <> 'UPLOAD' OR storage_key IS NOT NULL),
  CONSTRAINT chk_assets_size CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0)
);

CREATE TABLE content_analytics (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  recorded_date   DATE NOT NULL,
  impressions     INTEGER NOT NULL DEFAULT 0,
  reach           INTEGER NOT NULL DEFAULT 0,
  likes           INTEGER NOT NULL DEFAULT 0,
  comments        INTEGER NOT NULL DEFAULT 0,
  shares          INTEGER NOT NULL DEFAULT 0,
  saves           INTEGER NOT NULL DEFAULT 0,
  clicks          INTEGER NOT NULL DEFAULT 0,
  video_views     INTEGER NOT NULL DEFAULT 0,
  engagement_rate NUMERIC(6,2) GENERATED ALWAYS AS (
    CASE
      WHEN reach = 0 THEN 0.00
      ELSE LEAST(
        999.99,
        ROUND(((likes + comments + shares + saves)::NUMERIC / reach) * 100, 2)
      )
    END
  ) STORED,
  ctr             NUMERIC(6,2) GENERATED ALWAYS AS (
    CASE
      WHEN impressions = 0 THEN 0.00
      ELSE LEAST(
        999.99,
        ROUND((clicks::NUMERIC / impressions) * 100, 2)
      )
    END
  ) STORED,
  notes           TEXT,
  recorded_by     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_content_analytics_day UNIQUE (content_item_id, recorded_date),
  CONSTRAINT chk_content_analytics_nonneg CHECK (
    impressions >= 0 AND reach >= 0 AND likes >= 0 AND comments >= 0
    AND shares >= 0 AND saves >= 0 AND clicks >= 0 AND video_views >= 0
  )
);

-- ============================================================================
-- 4. UNIFIED TASKS & COLLABORATION (MODUL A + CROSS-MODULE HUB)
-- ============================================================================

CREATE SEQUENCE IF NOT EXISTS seq_task_code_num START 1001;

CREATE TABLE tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_code       VARCHAR(30) NOT NULL UNIQUE,
  project_id      UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  parent_task_id  UUID REFERENCES tasks(id) ON DELETE SET NULL,
  content_item_id UUID REFERENCES content_items(id) ON DELETE SET NULL,
  design_brief_id UUID REFERENCES design_briefs(id) ON DELETE SET NULL,
  title           VARCHAR(200) NOT NULL,
  description     TEXT,
  task_type       task_type_enum NOT NULL DEFAULT 'GENERAL',
  status          task_status_enum NOT NULL DEFAULT 'TODO',
  priority        task_priority_enum NOT NULL DEFAULT 'MEDIUM',
  position           DOUBLE PRECISION NOT NULL DEFAULT 65536,
  version            INTEGER NOT NULL DEFAULT 1,
  requires_review    BOOLEAN NOT NULL DEFAULT TRUE,
  assignee_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  reporter_id        UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reviewer_id        UUID REFERENCES users(id) ON DELETE SET NULL,
  start_date         DATE,
  started_at         TIMESTAMPTZ,
  first_submitted_at TIMESTAMPTZ,
  due_date           TIMESTAMPTZ,
  completed_at       TIMESTAMPTZ,
  is_on_time         BOOLEAN,
  estimated_hours    NUMERIC(5,2),
  actual_hours       NUMERIC(5,2),
  revision_count     INTEGER NOT NULL DEFAULT 0,
  tags               TEXT[] NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ,
  CONSTRAINT chk_tasks_no_self_parent CHECK (parent_task_id IS NULL OR parent_task_id <> id),
  CONSTRAINT chk_tasks_version_pos CHECK (version >= 1),
  CONSTRAINT chk_tasks_hours CHECK (
    (estimated_hours IS NULL OR estimated_hours >= 0) AND
    (actual_hours IS NULL OR actual_hours >= 0)
  ),
  CONSTRAINT chk_tasks_revision_nonneg CHECK (revision_count >= 0),
  CONSTRAINT chk_tasks_done_timestamp CHECK (
    (status = 'DONE' AND completed_at IS NOT NULL) OR
    (status <> 'DONE')
  ),
  CONSTRAINT chk_tasks_type_fk_alignment CHECK (
    (task_type <> 'DESIGN_TASK' OR design_brief_id IS NOT NULL)
  )
);

CREATE TABLE task_checklists (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id      UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  title        VARCHAR(255) NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE task_comments (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id            UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id          UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  parent_comment_id  UUID REFERENCES task_comments(id) ON DELETE SET NULL,
  body               TEXT NOT NULL,
  mentioned_user_ids UUID[] NOT NULL DEFAULT '{}',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at         TIMESTAMPTZ
);

CREATE TABLE task_attachments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id         UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  uploaded_by     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  source_type     asset_source_type_enum NOT NULL DEFAULT 'UPLOAD',
  file_name       VARCHAR(255) NOT NULL,
  file_url        TEXT NOT NULL,
  storage_key     TEXT,
  mime_type       VARCHAR(120),
  file_size_bytes BIGINT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ,
  CONSTRAINT chk_task_attachments_upload_key CHECK (
    source_type <> 'UPLOAD' OR storage_key IS NOT NULL
  ),
  CONSTRAINT chk_task_attachments_size CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0)
);

-- ============================================================================
-- 5. TEAM MANAGEMENT & KPI EVALUATION (MODUL B)
-- ============================================================================

CREATE TABLE kpi_templates (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code                 VARCHAR(50) NOT NULL UNIQUE,
  name                 VARCHAR(150) NOT NULL,
  description          TEXT,
  category             kpi_category_enum NOT NULL,
  applicable_role_id   UUID REFERENCES roles(id) ON DELETE SET NULL,
  metric_source        kpi_metric_source_enum NOT NULL,
  unit                 kpi_unit_enum NOT NULL DEFAULT 'PERCENTAGE',
  default_target_value NUMERIC(10,2) NOT NULL,
  default_weight       NUMERIC(5,2) NOT NULL,
  is_higher_better     BOOLEAN NOT NULL DEFAULT TRUE,
  is_active            BOOLEAN NOT NULL DEFAULT TRUE,
  created_by           UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at           TIMESTAMPTZ,
  CONSTRAINT chk_kpi_templates_weight CHECK (default_weight > 0 AND default_weight <= 100)
);

CREATE TABLE kpi_assignments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  kpi_template_id UUID NOT NULL REFERENCES kpi_templates(id) ON DELETE RESTRICT,
  period_year     SMALLINT NOT NULL,
  period_month    SMALLINT NOT NULL,
  target_value    NUMERIC(10,2) NOT NULL,
  weight          NUMERIC(5,2) NOT NULL,
  assigned_by     UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_kpi_assignments_period UNIQUE (user_id, kpi_template_id, period_year, period_month),
  CONSTRAINT chk_kpi_assignments_year CHECK (period_year BETWEEN 2024 AND 2100),
  CONSTRAINT chk_kpi_assignments_month CHECK (period_month BETWEEN 1 AND 12),
  CONSTRAINT chk_kpi_assignments_weight CHECK (weight > 0 AND weight <= 100)
);

CREATE TABLE monthly_evaluations (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  evaluator_id            UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  period_year             SMALLINT NOT NULL,
  period_month            SMALLINT NOT NULL,
  status                  kpi_evaluation_status_enum NOT NULL DEFAULT 'DRAFT',
  total_tasks_assigned    INTEGER NOT NULL DEFAULT 0,
  total_tasks_completed   INTEGER NOT NULL DEFAULT 0,
  tasks_completed_on_time INTEGER NOT NULL DEFAULT 0,
  completion_rate         NUMERIC(5,2),
  on_time_rate            NUMERIC(5,2),
  avg_revision_count      NUMERIC(5,2),
  design_quality_score    NUMERIC(5,2),
  weighted_kpi_score      NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  performance_grade       kpi_grade_enum,
  auto_metrics_snapshot   JSONB NOT NULL DEFAULT '{}'::jsonb,
  self_assessment_notes   TEXT,
  evaluator_notes         TEXT,
  submitted_at            TIMESTAMPTZ,
  reviewed_at             TIMESTAMPTZ,
  finalized_at            TIMESTAMPTZ,
  finalized_by            UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_monthly_eval_user_period UNIQUE (user_id, period_year, period_month),
  CONSTRAINT chk_monthly_eval_no_self CHECK (evaluator_id <> user_id),
  CONSTRAINT chk_monthly_eval_year CHECK (period_year BETWEEN 2024 AND 2100),
  CONSTRAINT chk_monthly_eval_month CHECK (period_month BETWEEN 1 AND 12),
  CONSTRAINT chk_monthly_eval_rates CHECK (
    (completion_rate IS NULL OR completion_rate BETWEEN 0 AND 100) AND
    (on_time_rate IS NULL OR on_time_rate BETWEEN 0 AND 100) AND
    (avg_revision_count IS NULL OR avg_revision_count >= 0) AND
    (design_quality_score IS NULL OR design_quality_score BETWEEN 40 AND 100) AND
    weighted_kpi_score BETWEEN 0 AND 100
  ),
  CONSTRAINT chk_monthly_eval_finalized CHECK (
    status <> 'FINALIZED' OR (finalized_at IS NOT NULL AND finalized_by IS NOT NULL)
  )
);

CREATE TABLE evaluation_items (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monthly_evaluation_id   UUID NOT NULL REFERENCES monthly_evaluations(id) ON DELETE CASCADE,
  kpi_assignment_id       UUID REFERENCES kpi_assignments(id) ON DELETE SET NULL,
  kpi_template_id         UUID NOT NULL REFERENCES kpi_templates(id) ON DELETE RESTRICT,
  indicator_name_snapshot VARCHAR(150) NOT NULL,
  metric_source           kpi_metric_source_enum NOT NULL,
  target_value            NUMERIC(10,2) NOT NULL,
  actual_value            NUMERIC(10,2),
  weight                  NUMERIC(5,2) NOT NULL,
  achievement_pct         NUMERIC(6,2),
  weighted_score          NUMERIC(6,2),
  evidence_notes          TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_eval_items_template UNIQUE (monthly_evaluation_id, kpi_template_id),
  CONSTRAINT chk_eval_items_weight CHECK (weight > 0 AND weight <= 100),
  CONSTRAINT chk_eval_items_achievement CHECK (
    achievement_pct IS NULL OR achievement_pct BETWEEN 0 AND 100
  )
);

-- ============================================================================
-- 6. SYSTEM MANAGEMENT: NOTIFICATIONS, ANNOUNCEMENTS & AUDIT LOGS (MODUL D)
-- ============================================================================

CREATE TABLE notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  type         notification_type_enum NOT NULL,
  title        VARCHAR(180) NOT NULL,
  message      TEXT NOT NULL,
  entity_type  VARCHAR(50),
  entity_id    UUID,
  action_url   VARCHAR(255),
  is_read      BOOLEAN NOT NULL DEFAULT FALSE,
  read_at      TIMESTAMPTZ,
  metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE announcements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title           VARCHAR(200) NOT NULL,
  content         TEXT NOT NULL,
  priority        announcement_priority_enum NOT NULL DEFAULT 'INFO',
  target_role_ids UUID[] NOT NULL DEFAULT '{}',
  is_pinned       BOOLEAN NOT NULL DEFAULT FALSE,
  published_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at      TIMESTAMPTZ
);

CREATE TABLE announcement_reads (
  announcement_id UUID NOT NULL REFERENCES announcements(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (announcement_id, user_id)
);

CREATE TABLE activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  action      VARCHAR(80) NOT NULL,
  module      VARCHAR(50) NOT NULL,
  entity_type VARCHAR(60) NOT NULL,
  entity_id   UUID,
  summary     VARCHAR(255) NOT NULL,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 7. TRIGGERS (AUTO updated_at & IMMUTABLE AUDIT LOG)
-- ============================================================================

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'roles', 'users', 'projects', 'content_ideas', 'content_items',
    'design_briefs', 'assets', 'content_analytics', 'tasks',
    'task_checklists', 'task_comments', 'kpi_templates', 'kpi_assignments',
    'monthly_evaluations', 'evaluation_items', 'announcements'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();',
      tbl, tbl
    );
  END LOOP;
END $$;

CREATE TRIGGER trg_activity_logs_immutable
  BEFORE UPDATE OR DELETE ON activity_logs
  FOR EACH ROW EXECUTE FUNCTION fn_prevent_audit_log_mutation();
```

> **Tips Prisma ORM (`prisma/schema.prisma`) untuk Yoga & Nta:**
> - Gunakan `@@map("snake_case")` dan `@map("snake_case")` agar model TypeScript tetap `PascalCase`/`camelCase` sementara tabel PostgreSQL 100% mengikuti standar SQL di atas.
> - Karena `content_analytics.engagement_rate` adalah *Stored Generated Column* dan trigger/partial index tertentu tidak diekspresikan native oleh sintaks Prisma, jalankan `prisma migrate dev --create-only` lalu tambahkan statement *Partial Index*, `GIN Index`, *Generated Column*, dan *Trigger* ke file SQL migrasi sebelum `prisma migrate deploy`.

---

#### 3.4 Indexing Strategy (B-Tree Composite, Partial, GIN & Trigram)

Strategi indexing difokuskan pada query *high-frequency* pada 4 modul utama agar latensi respons di bawah **<50ms** bahkan saat data berkembang ke puluhan ribu task dan ratusan ribu log audit.

```sql
-- ============================================================================
-- A. UNIFIED TASKS: KANBAN BOARD, MY TASKS, WORK CALENDAR & CROSS-MODULE LINK
-- ============================================================================

-- 1. Kanban Board: Ambil kolom status per proyek terurut berdasarkan position (active only)
CREATE INDEX idx_tasks_kanban_board
  ON tasks (project_id, status, position)
  WHERE deleted_at IS NULL;

-- 2. My Tasks: Daftar tugas aktif per assignee, filter status & urutkan deadline terdekat
CREATE INDEX idx_tasks_my_tasks
  ON tasks (assignee_id, status, due_date NULLS LAST)
  WHERE deleted_at IS NULL;

-- 3. Work Calendar & Cron Deadline Alert: Query rentang due_date pada task yang belum selesai
CREATE INDEX idx_tasks_calendar_due
  ON tasks (due_date, status, assignee_id)
  WHERE deleted_at IS NULL AND due_date IS NOT NULL;

-- 4. KPI Monthly Aggregation: Agregasi cepat per assignee berdasarkan completed_at / due_date
CREATE INDEX idx_tasks_kpi_period
  ON tasks (assignee_id, completed_at, due_date, status)
  WHERE deleted_at IS NULL AND status <> 'CANCELLED';

-- 5. Cross-Module 1:1 Enforcement: 1 Design Brief hanya boleh punya 1 active DESIGN_TASK
CREATE UNIQUE INDEX uq_tasks_active_design_brief
  ON tasks (design_brief_id)
  WHERE design_brief_id IS NOT NULL AND deleted_at IS NULL;

-- 5b. Cross-Module 1:1 Enforcement: 1 Content Item hanya boleh punya 1 active CONTENT_PRODUCTION task
CREATE UNIQUE INDEX uq_tasks_active_content_production
  ON tasks (content_item_id, task_type)
  WHERE content_item_id IS NOT NULL AND task_type = 'CONTENT_PRODUCTION' AND deleted_at IS NULL;

-- 6. Cross-Module Lookup: Cari seluruh task turunan dari sebuah content_item
CREATE INDEX idx_tasks_content_item
  ON tasks (content_item_id)
  WHERE content_item_id IS NOT NULL AND deleted_at IS NULL;

-- 7. Tag Search pada tasks
CREATE INDEX idx_tasks_tags_gin
  ON tasks USING GIN (tags)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- B. SOCIAL MEDIA, DESIGN WORKSPACE & ASSET LIBRARY (MODUL C)
-- ============================================================================

-- 8. Content Calendar: Filter per rentang bulan, platform, dan status
CREATE INDEX idx_content_items_calendar
  ON content_items (planned_publish_at, platform, status)
  WHERE deleted_at IS NULL;

-- 9. Design Workspace Queue: Antrian brief per designer & status
CREATE INDEX idx_design_briefs_designer_queue
  ON design_briefs (assigned_designer_id, status, due_date)
  WHERE deleted_at IS NULL;

-- 10. Design Revision History: Daftar versi terbaru sebuah brief
CREATE INDEX idx_design_submissions_brief_ver
  ON design_submissions (design_brief_id, version_number DESC);

-- 11. Asset Library: Filter kategori & pencarian multi-tag cepat (GIN)
CREATE INDEX idx_assets_category_created
  ON assets (category, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_assets_tags_gin
  ON assets USING GIN (tags)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_assets_metadata_gin
  ON assets USING GIN (metadata jsonb_path_ops)
  WHERE deleted_at IS NULL;

-- 12. Trigram Index untuk search bar judul Asset & Task (ILIKE '%keyword%')
CREATE INDEX idx_assets_title_trgm
  ON assets USING GIN (title gin_trgm_ops)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_tasks_title_trgm
  ON tasks USING GIN (title gin_trgm_ops)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- C. TEAM DIRECTORY, KPI & EVALUATIONS (MODUL B)
-- ============================================================================

-- 13. Team Directory & Auth Lookup (Active Users Only)
CREATE INDEX idx_users_active_role_dept
  ON users (role_id, department)
  WHERE deleted_at IS NULL AND is_active = TRUE;

-- 14. Team Performance Dashboard: Rekap KPI bulanan seluruh tim per periode
CREATE INDEX idx_monthly_eval_period_status
  ON monthly_evaluations (period_year DESC, period_month DESC, status);

-- ============================================================================
-- D. NOTIFICATIONS, ANNOUNCEMENTS & AUDIT LOGS (MODUL D)
-- ============================================================================

-- 15. Notification Badge Unread Count & Feed (Covering Partial Index)
CREATE INDEX idx_notifications_unread_recipient
  ON notifications (recipient_id, created_at DESC)
  WHERE is_read = FALSE;

CREATE INDEX idx_notifications_recipient_feed
  ON notifications (recipient_id, created_at DESC);

-- 16. Announcements Active Feed (Pinned first, newest first)
CREATE INDEX idx_announcements_active_feed
  ON announcements (is_pinned DESC, published_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_announcements_target_roles_gin
  ON announcements USING GIN (target_role_ids)
  WHERE deleted_at IS NULL;

-- 17. Activity Logs: Timeline audit per entitas, per aktor, & pencarian JSONB
CREATE INDEX idx_activity_logs_entity_timeline
  ON activity_logs (entity_type, entity_id, created_at DESC);

CREATE INDEX idx_activity_logs_actor_module_time
  ON activity_logs (module, actor_id, created_at DESC);

CREATE INDEX idx_activity_logs_new_values_gin
  ON activity_logs USING GIN (new_values jsonb_path_ops);
```

##### Ringkasan Alasan Query & Dampak Performa

| Target Fitur | Index Utama | Mengapa Krusial |
| :--- | :--- | :--- |
| **Kanban Board** | `idx_tasks_kanban_board` (Composite + Partial) | Mengambil seluruh kartu per proyek + pengurutan posisi kolom dalam satu *Index Scan* tanpa membaca baris soft-deleted. |
| **My Tasks & Work Calendar** | `idx_tasks_my_tasks`, `idx_tasks_calendar_due` | Mencegah *Sequential Scan* saat filter task jatuh tempo minggu/bulan ini atau saat cron memeriksa deadline H-2/H-0/H+1&H+3 pukul 08:00 WIB. |
| **Asset Library Search** | `idx_assets_tags_gin`, `idx_assets_title_trgm` | Mendukung filter array tag (`tags @> ARRAY['reels','q4']`) dan pencarian substring `ILIKE '%banner%'` secara instan. |
| **Notification Bell Polling** | `idx_notifications_unread_recipient` (Partial `is_read = FALSE`) | Ukuran index tetap mikroskopis (hanya baris belum dibaca) sehingga polling badge unread hampir nol beban CPU. |
| **Activity Log Investigation** | `idx_activity_logs_entity_timeline` + `GIN (new_values)` | Memungkinkan halaman detail Task/Design menampilkan tab *History* dalam milidetik dan audit admin menelusuri perubahan field tertentu di JSONB. |

---

#### 3.5 Mekanisme Relasi Lintas Modul & Kalkulasi KPI Otomatis

##### A. Sinkronisasi Transaksional Lintas Modul (Atomic Prisma `$transaction`)

Untuk menjamin konsistensi antara **Content Planning**, **Design Workspace**, **Unified Tasks**, **Asset Library**, **Audit Trail**, dan **Notifications**, setiap peristiwa lintas modul dijalankan dalam **satu transaksi PostgreSQL atomik**:

1. **Event 1 — Pembuatan Content Plan / Design Brief (`createDesignBriefWithTask`):**
   - `INSERT` baris baru di `design_briefs` (`status = 'PENDING_BRIEF'`).
   - Jika terhubung ke `content_item_id`, `UPDATE content_items SET status = 'IN_DESIGN'`.
   - **Auto-Spawn Unified Task:** `INSERT` baris baru di `tasks` dengan `task_type = 'DESIGN_TASK'`, `content_item_id`, `design_brief_id`, `assignee_id = assigned_designer_id`, `due_date = brief.due_date`, `status = 'TODO'`.
   - `INSERT` ke `activity_logs` (`module = 'SOCIAL_DESIGN'`) + `INSERT` ke `notifications` (`type = 'DESIGN_BRIEF_ASSIGNED'` / `'TASK_ASSIGNED'`) untuk Designer.
   - **Hasil:** Begitu brief dibuat, task langsung muncul di **My Tasks**, **Kanban Board**, dan **Work Calendar** milik Designer tanpa input ulang!

2. **Event 2 — Designer Mengunggah Desain (`submitDesignVersion`):**
   - Hitung `next_version = design_briefs.current_version + 1` dengan row-level lock (`SELECT ... FOR UPDATE` pada `design_briefs` untuk mencegah *race condition* nomor versi ganda).
   - `INSERT` ke `design_submissions` (`version_number = next_version`, `status = 'SUBMITTED'`).
   - `UPDATE design_briefs SET status = 'SUBMITTED', current_version = next_version`.
   - **Auto-Sync Task & Content:**
     - `UPDATE tasks SET status = 'IN_REVIEW', first_submitted_at = COALESCE(first_submitted_at, NOW()), version = version + 1 WHERE design_brief_id = $1 AND deleted_at IS NULL`.
     - Jika ada `content_item_id`: `UPDATE content_items SET status = 'DESIGN_REVIEW'`.
   - Catat `activity_logs` & kirim notifikasi `DESIGN_SUBMITTED` ke `requested_by` / `reviewer_id`.

3. **Event 3 — Reviewer Meminta Revisi (`reviewDesignSubmission` — `REVISION_REQUESTED`):**
   - `INSERT` ke `design_reviews` (`decision = 'REVISION_REQUESTED'`, `feedback` min. 10 karakter, `revision_checklist`).
   - `UPDATE design_submissions SET status = 'REVISION_REQUESTED'`.
   - `UPDATE design_briefs SET status = 'REVISION_REQUESTED', revision_count = revision_count + 1`.
   - **Auto-Sync Task & Content:**
     - `UPDATE tasks SET status = 'REVISION', revision_count = revision_count + 1, completed_at = NULL, is_on_time = NULL, version = version + 1 WHERE design_brief_id = $1 AND deleted_at IS NULL`.
     - Jika ada `content_item_id`: `UPDATE content_items SET status = 'DESIGN_REVISION'`.
   - Catat `activity_logs` & kirim notifikasi `DESIGN_REVISION_REQUESTED` ke Designer.

4. **Event 4 — Reviewer Menyetujui Desain (`reviewDesignSubmission` — `APPROVED`):**
   - `INSERT` ke `design_reviews` (`decision = 'APPROVED'`).
   - `UPDATE design_submissions SET status = 'APPROVED'`.
   - `UPDATE design_briefs SET status = 'APPROVED', approved_at = NOW(), approved_by = reviewer_id`.
   - **Auto-Sync Task, Content & Asset Library:**
     - `UPDATE tasks SET status = 'DONE', completed_at = NOW(), is_on_time = CASE WHEN due_date IS NULL THEN NULL ELSE (CASE WHEN revision_count = 0 THEN COALESCE(first_submitted_at, NOW()) ELSE NOW() END) <= due_date END, version = version + 1 WHERE design_brief_id = $1 AND deleted_at IS NULL`.
     - Jika ada `content_item_id`: `UPDATE content_items SET status = 'READY_TO_PUBLISH'`.
     - Jika opsi `promoteToAssetLibrary = true`: `INSERT` otomatis ke tabel `assets` dengan `design_submission_id`, `content_item_id`, dan `is_approved_brand_asset = TRUE`.
   - Catat `activity_logs` & kirim notifikasi `DESIGN_APPROVED` (ke Designer) + `CONTENT_READY_TO_PUBLISH` (ke Content Creator).

##### B. Rumus & Query Agregasi KPI Otomatis Bulanan (SQL PostgreSQL 16)

Agar evaluasi kinerja adil, transparan, dan 100% selaras dengan SRS (`01`), sistem menghitung metrik otomatis per `user_id` untuk rentang bulan `(period_year, period_month)` dengan aturan kanonik berikut:
- **Inklusi Task Periode:** Task aktif (`deleted_at IS NULL`, `status <> 'CANCELLED'`) milik `assignee_id = $userId` yang memiliki `due_date` pada bulan evaluasi **ATAU** selesai (`completed_at`) pada bulan evaluasi.
- **Task Completion Rate (`AUTO_TCR` / `completion_rate`, %):** `ROUND((total_tasks_completed / NULLIF(total_tasks_assigned, 0)) * 100, 2)` — bernilai **`NULL` (`N/A`)** jika `total_tasks_assigned = 0`.
- **On-Time Delivery Rate (`AUTO_OTDR` / `on_time_rate`, %):** Menggunakan `effective_completion_time = CASE WHEN revision_count = 0 THEN COALESCE(first_submitted_at, completed_at) ELSE completed_at END` sehingga pelaksana tidak dirugikan oleh antrean review jika lolos tanpa revisi; `is_on_time = (effective_completion_time <= due_date)`. Rumus: `ROUND((tasks_completed_on_time / NULLIF(completed_with_due, 0)) * 100, 2)` — bernilai **`NULL` (`N/A`)** jika `completed_with_due = 0`.
- **Design Quality Score (`AUTO_DQS` / `design_quality_score`, skala 40–100):** Dihitung dari `design_briefs` milik Designer (`assigned_designer_id = $userId`, `status = 'APPROVED'`, `approved_at` pada bulan evaluasi): `ROUND(AVG(GREATEST(40, 100 - 15 * revision_count)), 2)` — disertai metrik pendamping `avg_design_revision_count` dan **First-Pass Approval Rate (`FPAR`)**. Bernilai **`NULL` (`N/A`)** jika belum ada brief `APPROVED` di bulan tersebut.
- **Content Production Volume Score (`AUTO_CPVS`, %):** Menghitung `content_delivered_count` dari `content_items` (`creator_id = $userId`, `status IN ('SCHEDULED', 'PUBLISHED')`, `COALESCE(published_at, planned_publish_at)` pada bulan evaluasi), lalu di Service Layer dihitung `LEAST(100.00, ROUND((content_delivered_count / target_value) * 100, 2))`.
- **Penanganan `N/A` & *Weight Re-Normalization* (`weighted_kpi_score`):** Jika ada indikator otomatis bernilai `NULL` (`N/A`) karena denominator = 0 (mis. Designer belum menerima brief pada bulan tertentu), indikator tersebut **tidak** dianggap `0.00` melainkan dikecualikan dari penyebut bobot sehingga bobot indikator aktif di-normalisasi ulang: `weighted_kpi_score = ROUND(SUM(S_k * w_k) / SUM(w_k), 2)` untuk seluruh indikator `k` yang `S_k IS NOT NULL` (rentang `0.00–100.00`).
- **Konversi 4 Grade Kanonik:** `A` (`90.00–100.00`), `B` (`80.00–89.99`), `C` (`70.00–79.99`), `D` (`0.00–69.99`).

```sql
-- Query Agregasi Metrik Otomatis KPI Bulanan per User (Parameter: $1=user_id, $2=year, $3=month)
WITH period_bounds AS (
  SELECT
    make_timestamptz($2, $3, 1, 0, 0, 0, 'Asia/Jakarta') AS start_ts,
    make_timestamptz($2, $3, 1, 0, 0, 0, 'Asia/Jakarta') + INTERVAL '1 month' AS end_ts
),
scoped_tasks AS (
  SELECT
    t.id,
    t.task_code,
    t.task_type,
    t.status,
    t.due_date,
    t.first_submitted_at,
    t.completed_at,
    t.revision_count,
    CASE
      WHEN t.status <> 'DONE' OR t.due_date IS NULL THEN NULL
      ELSE (
        CASE
          WHEN t.revision_count = 0 THEN COALESCE(t.first_submitted_at, t.completed_at)
          ELSE t.completed_at
        END
      ) <= t.due_date
    END AS computed_is_on_time
  FROM tasks t
  CROSS JOIN period_bounds pb
  WHERE t.assignee_id = $1
    AND t.deleted_at IS NULL
    AND t.status <> 'CANCELLED'
    AND (
      (t.due_date >= pb.start_ts AND t.due_date < pb.end_ts)
      OR (t.completed_at >= pb.start_ts AND t.completed_at < pb.end_ts)
    )
),
task_metrics AS (
  SELECT
    COUNT(*)::INT AS total_tasks_assigned,
    COUNT(*) FILTER (WHERE status = 'DONE')::INT AS total_tasks_completed,
    COUNT(*) FILTER (WHERE status = 'DONE' AND due_date IS NOT NULL)::INT AS completed_with_due,
    COUNT(*) FILTER (WHERE status = 'DONE' AND computed_is_on_time IS TRUE)::INT AS tasks_completed_on_time,
    -- NULL (N/A) jika denominator = 0 (bukan 0.00) untuk mendukung weight re-normalization
    ROUND(
      (COUNT(*) FILTER (WHERE status = 'DONE')::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      2
    ) AS completion_rate,
    ROUND(
      (COUNT(*) FILTER (WHERE status = 'DONE' AND computed_is_on_time IS TRUE)::NUMERIC /
       NULLIF(COUNT(*) FILTER (WHERE status = 'DONE' AND due_date IS NOT NULL), 0)) * 100,
      2
    ) AS on_time_rate,
    ROUND(AVG(revision_count) FILTER (WHERE status = 'DONE'), 2) AS avg_revision_count,
    COALESCE(
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'task_id', id,
          'task_code', task_code,
          'task_type', task_type,
          'status', status,
          'first_submitted_at', first_submitted_at,
          'completed_at', completed_at,
          'is_on_time', computed_is_on_time,
          'revision_count', revision_count
        )
      ),
      '[]'::jsonb
    ) AS tasks_breakdown
  FROM scoped_tasks
),
design_metrics AS (
  SELECT
    COUNT(*)::INT AS design_briefs_approved,
    ROUND(AVG(GREATEST(40, 100 - 15 * db.revision_count))::NUMERIC, 2) AS design_quality_score,
    ROUND(AVG(db.revision_count)::NUMERIC, 2) AS avg_design_revision_count,
    ROUND(
      (COUNT(*) FILTER (WHERE db.revision_count = 0)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
      2
    ) AS first_pass_approval_rate,
    COALESCE(
      JSONB_AGG(
        JSONB_BUILD_OBJECT(
          'design_brief_id', db.id,
          'title', db.title,
          'revision_count', db.revision_count,
          'brief_dqs', GREATEST(40, 100 - 15 * db.revision_count)
        )
      ),
      '[]'::jsonb
    ) AS design_briefs_breakdown
  FROM design_briefs db
  CROSS JOIN period_bounds pb
  WHERE db.assigned_designer_id = $1
    AND db.deleted_at IS NULL
    AND db.status = 'APPROVED'
    AND db.approved_at >= pb.start_ts
    AND db.approved_at < pb.end_ts
),
content_metrics AS (
  SELECT
    COUNT(*)::INT AS content_delivered_count
  FROM content_items ci
  CROSS JOIN period_bounds pb
  WHERE ci.creator_id = $1
    AND ci.deleted_at IS NULL
    AND ci.status IN ('SCHEDULED', 'PUBLISHED')
    AND COALESCE(ci.published_at, ci.planned_publish_at) >= pb.start_ts
    AND COALESCE(ci.published_at, ci.planned_publish_at) < pb.end_ts
)
SELECT
  tm.total_tasks_assigned,
  tm.total_tasks_completed,
  tm.completed_with_due,
  tm.tasks_completed_on_time,
  tm.completion_rate,
  tm.on_time_rate,
  COALESCE(dm.avg_design_revision_count, tm.avg_revision_count) AS avg_revision_count,
  dm.design_briefs_approved,
  dm.design_quality_score,
  dm.avg_design_revision_count,
  dm.first_pass_approval_rate,
  cm.content_delivered_count,
  JSONB_BUILD_OBJECT(
    'calculated_at', NOW(),
    'period_year', $2,
    'period_month', $3,
    'design_briefs_approved', dm.design_briefs_approved,
    'design_quality_score', dm.design_quality_score,
    'avg_design_revision_count', dm.avg_design_revision_count,
    'first_pass_approval_rate', dm.first_pass_approval_rate,
    'content_delivered_count', cm.content_delivered_count,
    'tasks_breakdown', tm.tasks_breakdown,
    'design_briefs_breakdown', dm.design_briefs_breakdown
  ) AS auto_metrics_snapshot
FROM task_metrics tm
CROSS JOIN design_metrics dm
CROSS JOIN content_metrics cm;
```

##### C. Jaminan Reproducibility & Immutability Laporan Historis (Computed Snapshot Pattern)

Mengapa KTMS menyimpan hasil agregasi ke `monthly_evaluations` & `evaluation_items` daripada selalu menghitung *on-the-fly* untuk bulan yang sudah lewat?

| Fase Status `monthly_evaluations` | Perilaku Perhitungan | Alasan Bisnis & Integritas Data |
| :--- | :--- | :--- |
| **Live Dashboard (Bulan Berjalan)** & Status `DRAFT` | Tombol **"Refresh Metrik Otomatis"** menjalankan query CTE di atas untuk memperbarui nilai pratinjau secara real-time. | PM dan Staff selalu melihat progres terkini selama bulan berjalan. |
| **Status `SUBMITTED` & `REVIEWED`** | Metrik otomatis tersinkron ke `evaluation_items`; evaluator mengisi indikator `MANUAL_SCORE` (Kolaborasi, Inisiatif) dan `evaluator_notes`. | Memungkinkan diskusi 1-on-1 sebelum skor dikunci. |
| **Status `FINALIZED` (Frozen Snapshot)** | Service Layer membekukan `completion_rate`, `on_time_rate`, `avg_revision_count`, `design_quality_score`, `weighted_kpi_score`, `performance_grade`, dan `auto_metrics_snapshot` JSONB. Seluruh mutasi pada baris `monthly_evaluations` & `evaluation_items` **diblokir** (hanya `SUPER_ADMIN` yang dapat melakukan *Reopen* dengan alasan wajib tercatat di `activity_logs`). | **Zero Historical Drift:** Meskipun task bulan lalu di-reopen, diubah assignee-nya, atau dihapus pada bulan berikutnya, laporan KPI resmi bulan sebelumnya tetap 100% konsisten, dapat diaudit (*traceable* lewat `tasks_breakdown` & `design_briefs_breakdown`), dan tidak berubah mendadak di hadapan Leadership. |

---

### 4. Desain Role-Based Access Control (RBAC) & Keamanan Data

#### 4.1 Model RBAC Database-Backed (`roles`, `permissions`, `role_permissions`)

KTMS menggunakan **Permission-Based RBAC** yang disimpan di PostgreSQL, bukan pengecekan `if (user.role === 'ADMIN')` yang tersebar (*hardcoded*) di seluruh kode. Pola ini memastikan:
1. Penambahan peran baru di masa depan (mis. `FINANCE_ADMIN` atau `SOCIAL_MEDIA_LEAD`) tidak memerlukan perubahan logika *guard* di setiap endpoint.
2. Seluruh perubahan hak akses dapat diatur melalui halaman **Role & Permission Management** (Modul D) dan langsung terekam di `activity_logs`.

##### Standar Konvensi Penamaan Permission
Seluruh kode izin mengikuti format 3-segmen ketat: **`<module>:<resource>:<action>`** (regex `^[a-z_]+:[a-z_]+:[a-z_]+$`).
- Contoh: `tasks:project:create`, `tasks:item:assign`, `design:submission:approve`, `kpi:evaluation:finalize`, `system:audit_log:read`.

##### Seed SQL 4 Canonical Roles & Katalog Permissions

```sql
-- 1. Seed 4 Canonical RBAC Roles (is_system = TRUE -> dilindungi dari penghapusan)
INSERT INTO roles (code, name, description, is_system) VALUES
  ('SUPER_ADMIN',     'Super Admin / Leadership',  'Akses penuh seluruh sistem, konfigurasi RBAC, manajemen user, dan finalisasi KPI.', TRUE),
  ('PROJECT_MANAGER', 'Project Manager',           'Mengelola proyek, alokasi task, persetujuan konten/desain, dan evaluasi KPI tim.', TRUE),
  ('STAFF_CREATOR',   'Staff / Content Creator',   'Mengerjakan task, mengusulkan ide konten, menyusun content plan & brief desain, input analitik konten.', TRUE),
  ('DESIGNER',        'Designer',                  'Mengerjakan task desain, mengunggah versi desain di Design Workspace, dan mengelola Asset Library.', TRUE)
ON CONFLICT (code) DO NOTHING;

-- 2. Seed Atomic Permissions (42 Granular Permissions lintas 4 Modul)
INSERT INTO permissions (code, module, resource, action, description) VALUES
  -- Modul A: Task Management
  ('tasks:project:read',        'tasks',  'project',    'read',     'Melihat daftar & detail proyek'),
  ('tasks:project:create',      'tasks',  'project',    'create',   'Membuat proyek baru'),
  ('tasks:project:update',      'tasks',  'project',    'update',   'Mengubah info, status (termasuk arsip ARCHIVED) & anggota proyek'),
  ('tasks:project:delete',      'tasks',  'project',    'delete',   'Menghapus proyek (soft-delete only)'),
  ('tasks:item:read',           'tasks',  'item',       'read',     'Melihat task di Kanban, My Tasks & Work Calendar'),
  ('tasks:item:create',         'tasks',  'item',       'create',   'Membuat task baru'),
  ('tasks:item:update',         'tasks',  'item',       'update',   'Mengubah detail/status task sesuai scope'),
  ('tasks:item:assign',         'tasks',  'item',       'assign',   'Menugaskan/memindahkan assignee task'),
  ('tasks:item:approve',        'tasks',  'item',       'approve',  'Menyetujui task dari IN_REVIEW ke DONE atau minta REVISION'),
  ('tasks:item:delete',         'tasks',  'item',       'delete',   'Menghapus (soft-delete) task'),
  ('tasks:comment:create',      'tasks',  'comment',    'create',   'Menambahkan komentar & mention pada task'),

  -- Modul B: Team Management & KPI
  ('kpi:directory:read',        'kpi',    'directory',  'read',     'Melihat Team Directory internal'),
  ('kpi:template:manage',       'kpi',    'template',   'manage',   'Membuat/mengubah master KPI templates'),
  ('kpi:assignment:manage',     'kpi',    'assignment', 'manage',   'Menetapkan target & bobot KPI bulanan per user'),
  ('kpi:performance:read_own',  'kpi',    'performance','read_own', 'Melihat dashboard performa & KPI pribadi'),
  ('kpi:performance:read_team', 'kpi',    'performance','read_team','Melihat Team Performance Dashboard seluruh tim'),
  ('kpi:evaluation:create',     'kpi',    'evaluation', 'create',   'Membuat draft evaluasi bulanan & mengisi skor'),
  ('kpi:evaluation:submit',     'kpi',    'evaluation', 'submit',   'Mengisi self-assessment / submit evaluasi'),
  ('kpi:evaluation:review',     'kpi',    'evaluation', 'review',   'Mereview & memberi catatan evaluator'),
  ('kpi:evaluation:finalize',   'kpi',    'evaluation', 'finalize', 'Mengunci permanen evaluasi bulanan (FINALIZED)'),
  ('kpi:evaluation:reopen',     'kpi',    'evaluation', 'reopen',   'Membuka kembali evaluasi FINALIZED (khusus Super Admin)'),
  ('kpi:report:export',         'kpi',    'report',     'export',   'Mengekspor laporan KPI bulanan ke CSV/PDF'),

  -- Modul C: Social Media & Design Management
  ('social:idea:read',          'social', 'idea',       'read',     'Melihat Content Ideas bank'),
  ('social:idea:create',        'social', 'idea',       'create',   'Mengusulkan ide konten baru'),
  ('social:idea:approve',       'social', 'idea',       'approve',  'Menyetujui/menolak ide konten & konversi ke kalender'),
  ('social:content:read',       'social', 'content',    'read',     'Melihat Content Calendar & Content Plan'),
  ('social:content:manage',     'social', 'content',    'manage',   'Membuat & mengubah Content Plan, caption & jadwal'),
  ('social:content:approve',    'social', 'content',    'approve',  'Menyetujui konten siap tayang (READY_TO_PUBLISH/SCHEDULED)'),
  ('social:content:delete',     'social', 'content',    'delete',   'Menghapus (soft-delete) item konten'),
  ('social:analytics:manage',   'social', 'analytics',  'manage',   'Input & update data Content Performance Analytics'),
  ('design:brief:read',         'design', 'brief',      'read',     'Melihat daftar & detail Design Brief'),
  ('design:brief:manage',       'design', 'brief',      'manage',   'Membuat & mengubah Design Brief serta menugaskan Designer'),
  ('design:submission:create',  'design', 'submission', 'create',   'Mengunggah versi desain di Design Workspace'),
  ('design:submission:approve', 'design', 'submission', 'approve',  'Menyetujui hasil desain atau meminta revisi'),
  ('assets:library:read',       'assets', 'library',    'read',     'Mencari & mengunduh aset dari Asset Library'),
  ('assets:library:manage',     'assets', 'library',    'manage',   'Mengunggah, tagging, mempromosikan & menghapus aset'),

  -- Modul D: System Management
  ('system:user:read',          'system', 'user',       'read',     'Melihat daftar akun user & status aktif'),
  ('system:user:manage',        'system', 'user',       'manage',   'Membuat user, reset password, ubah role & nonaktifkan user'),
  ('system:rbac:manage',        'system', 'rbac',       'manage',   'Mengelola mapping Role & Permission'),
  ('system:announcement:read',  'system', 'announcement','read',    'Membaca Announcements & menandai sudah dibaca'),
  ('system:announcement:manage','system', 'announcement','manage',  'Membuat, pin, mengubah & menghapus Announcements'),
  ('system:audit_log:read',     'system', 'audit_log',  'read',     'Melihat & memfilter Activity Logs (Audit Trail)')
ON CONFLICT (code) DO NOTHING;
```

---

#### 4.2 Permission Matrix Lengkap (4 Roles vs Seluruh Resource & Action)

**Legenda Cakupan (*Scope*):**
- **✅ Full:** Akses penuh seluruh data lintas proyek/tim.
- **🟡 Project / Team:** Terbatas pada proyek di mana user menjadi anggota (`project_members`) atau anggota tim di bawah pengawasannya.
- **🟡 Own / Assigned:** Terbatas pada data yang dibuat oleh user sendiri atau ditugaskan langsung kepadanya.
- **❌:** Tidak memiliki akses (ditolak dengan HTTP `403 FORBIDDEN` di Server Layer & elemen aksi disembunyikan di UI).

| Modul | Resource & Aksi | Kode Permission | `SUPER_ADMIN` | `PROJECT_MANAGER` | `STAFF_CREATOR` | `DESIGNER` |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **A. Tasks** | Lihat Daftar & Detail Proyek | `tasks:project:read` | ✅ Full | ✅ Full | 🟡 Project | 🟡 Project |
| **A. Tasks** | Buat Proyek Baru | `tasks:project:create` | ✅ Full | ✅ Full | ❌ | ❌ |
| **A. Tasks** | Edit Proyek, Arsip (`ARCHIVED`) & Kelola Anggota | `tasks:project:update` | ✅ Full | 🟡 Project (Owner/Lead) | ❌ | ❌ |
| **A. Tasks** | Hapus Proyek (Soft-Delete Only) | `tasks:project:delete` | ✅ Full | ❌ | ❌ | ❌ |
| **A. Tasks** | Lihat Task (Kanban, Calendar, My Tasks) | `tasks:item:read` | ✅ Full | ✅ Full | 🟡 Project | 🟡 Project |
| **A. Tasks** | Buat Task Baru | `tasks:item:create` | ✅ Full | ✅ Full | 🟡 Project | 🟡 Project (Subtask/Own) |
| **A. Tasks** | Edit Detail & Pindah Status Task | `tasks:item:update` | ✅ Full | 🟡 Project | 🟡 Own / Assigned | 🟡 Own / Assigned |
| **A. Tasks** | Assign / Reassign Assignee Task | `tasks:item:assign` | ✅ Full | 🟡 Project | ❌ | ❌ |
| **A. Tasks** | Approve Task (`IN_REVIEW -> DONE`) / Revisi | `tasks:item:approve` | ✅ Full | 🟡 Project | ❌ | ❌ |
| **A. Tasks** | Hapus Task (Soft Delete) | `tasks:item:delete` | ✅ Full | 🟡 Project | ❌ | ❌ |
| **A. Tasks** | Komentar & `@mention` Task | `tasks:comment:create` | ✅ Full | ✅ Full | 🟡 Project | 🟡 Project |
| **B. Team/KPI** | Lihat Team Directory | `kpi:directory:read` | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **B. Team/KPI** | Kelola Master KPI Templates | `kpi:template:manage` | ✅ Full | ✅ Full | ❌ | ❌ |
| **B. Team/KPI** | Tetapkan Target & Bobot KPI Bulanan | `kpi:assignment:manage` | ✅ Full | 🟡 Team | ❌ | ❌ |
| **B. Team/KPI** | Lihat Performa & KPI Pribadi | `kpi:performance:read_own` | ✅ Full | ✅ Own | ✅ Own | ✅ Own |
| **B. Team/KPI** | Lihat Team Performance Dashboard | `kpi:performance:read_team` | ✅ Full | ✅ Full | ❌ | ❌ |
| **B. Team/KPI** | Buat Draft & Nilai Evaluasi Bulanan | `kpi:evaluation:create` | ✅ Full | 🟡 Team | ❌ | ❌ |
| **B. Team/KPI** | Isi Self-Assessment / Submit | `kpi:evaluation:submit` | ✅ Full | ✅ Own | ✅ Own | ✅ Own |
| **B. Team/KPI** | Review Evaluasi Bulanan | `kpi:evaluation:review` | ✅ Full | 🟡 Team | ❌ | ❌ |
| **B. Team/KPI** | Finalisasi & Kunci Evaluasi (`FINALIZED`) | `kpi:evaluation:finalize` | ✅ Full | ❌ | ❌ | ❌ |
| **B. Team/KPI** | Reopen Evaluasi `FINALIZED` (Audited) | `kpi:evaluation:reopen` | ✅ Full | ❌ | ❌ | ❌ |
| **B. Team/KPI** | Export Laporan KPI (CSV / PDF) | `kpi:report:export` | ✅ Full | ✅ Full | 🟡 Own Only | 🟡 Own Only |
| **C. Social** | Lihat Bank Ide Konten | `social:idea:read` | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **C. Social** | Usulkan Ide Konten | `social:idea:create` | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **C. Social** | Approve / Reject & Konversi Ide | `social:idea:approve` | ✅ Full | ✅ Full | ❌ | ❌ |
| **C. Social** | Lihat Content Calendar & Content Plan | `social:content:read` | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **C. Social** | Buat & Edit Content Plan / Caption | `social:content:manage` | ✅ Full | ✅ Full | ✅ Full | ❌ |
| **C. Social** | Approve Konten Siap Tayang | `social:content:approve` | ✅ Full | ✅ Full | ❌ | ❌ |
| **C. Social** | Hapus Content Item (Soft Delete) | `social:content:delete` | ✅ Full | ✅ Full | 🟡 Own (`IDEA`/`PLANNING` only) | ❌ |
| **C. Social** | Input & Edit Content Performance Analytics | `social:analytics:manage` | ✅ Full | ✅ Full | ✅ Full | ❌ |
| **C. Design** | Lihat Design Brief & Revision History | `design:brief:read` | ✅ Full | ✅ Full | ✅ Full | 🟡 Assigned / Project |
| **C. Design** | Buat / Edit Design Brief & Assign Designer | `design:brief:manage` | ✅ Full | ✅ Full | ✅ Full (Create & Own Brief) | ❌ |
| **C. Design** | Unggah Versi Desain (`v1..vN`) | `design:submission:create` | ✅ Full | ❌ | ❌ | 🟡 Assigned Brief |
| **C. Design** | Approve Desain / Request Revision | `design:submission:approve` | ✅ Full | ✅ Full | ❌ | ❌ |
| **C. Assets** | Cari & Unduh dari Asset Library | `assets:library:read` | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **C. Assets** | Upload, Tag, Promote & Kelola Asset | `assets:library:manage` | ✅ Full | ✅ Full | 🟡 Upload & Own | ✅ Full |
| **D. System** | Lihat Daftar User & Status | `system:user:read` | ✅ Full | ✅ Full (Read-Only) | ❌ | ❌ |
| **D. System** | Kelola User (Create, Reset, Role, Suspend) | `system:user:manage` | ✅ Full | ❌ | ❌ | ❌ |
| **D. System** | Kelola Role & Permission Matrix | `system:rbac:manage` | ✅ Full | ❌ | ❌ | ❌ |
| **D. System** | Notification Center (Pribadi) | *(Built-in Authenticated)* | ✅ Own | ✅ Own | ✅ Own | ✅ Own |
| **D. System** | Baca & Tandai Announcements | `system:announcement:read` | ✅ Full | ✅ Full | ✅ Full | ✅ Full |
| **D. System** | Buat, Pin & Kelola Announcements | `system:announcement:manage` | ✅ Full | ✅ Full | ❌ | ❌ |
| **D. System** | Lihat Activity Logs (Audit Trail) | `system:audit_log:read` | ✅ Full | 🟡 Project / Team Scope | ❌ | ❌ |

> **Aturan Pemisahan Wewenang (*Separation of Duties*):**
> 1. Seorang user **tidak dapat** mengevaluasi atau men-`finalize` `monthly_evaluations` milik dirinya sendiri (ditegakkan di DB via `CONSTRAINT chk_monthly_eval_no_self CHECK (evaluator_id <> user_id)` sekaligus di Service Layer).
> 2. Hak `kpi:evaluation:finalize`, `kpi:evaluation:reopen`, `system:user:manage`, dan `system:rbac:manage` bersifat eksklusif **`SUPER_ADMIN` ONLY**; sedangkan `design:submission:approve` bersifat eksklusif **`SUPER_ADMIN` & `PROJECT_MANAGER` ONLY**.
> 3. Transisi task langsung ke `DONE` untuk task dengan `requires_review = TRUE` wajib melalui `IN_REVIEW` (dan mencatat `first_submitted_at`) kecuali dieksekusi oleh `reviewer_id`, `PROJECT_MANAGER`, atau `SUPER_ADMIN`.

---

#### 4.3 Pola Implementasi RBAC Guard & Audit Logger (Server-Side TypeScript)

Berikut pola implementasi standar yang digunakan bersama oleh Mhd Yoga Andhika dan Nta di `src/server/auth/rbac.ts` dan `src/server/services/audit-logger.ts`.

##### A. RBAC Guard & Request-Scoped Permission Cache (`src/server/auth/rbac.ts`)

```typescript
import { cache } from 'react';
import { auth } from '@/server/auth/auth'; // Auth.js v5
import { prisma } from '@/server/db/prisma';

export type CanonicalRoleCode =
  | 'SUPER_ADMIN'
  | 'PROJECT_MANAGER'
  | 'STAFF_CREATOR'
  | 'DESIGNER';

export interface AuthContext {
  userId: string;
  email: string;
  fullName: string;
  roleId: string;
  roleCode: CanonicalRoleCode | string;
  permissions: ReadonlySet<string>;
}

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public readonly statusCode: 401 | 403 = 403,
    public readonly code: 'UNAUTHENTICATED' | 'FORBIDDEN' = 'FORBIDDEN'
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

/**
 * Memoized per HTTP request / RSC render menggunakan React cache()
 * agar banyak komponen/service dalam 1 request hanya melakukan 1x query DB.
 */
export const getAuthContext = cache(async (): Promise<AuthContext> => {
  const session = await auth();
  if (!session?.user?.id) {
    throw new AuthorizationError('Sesi tidak valid atau telah berakhir.', 401, 'UNAUTHENTICATED');
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

  // Revocation check instan: jika role berubah, password direset, atau user disuspend
  if (!dbUser || dbUser.tokenVersion !== session.user.tokenVersion) {
    throw new AuthorizationError('Sesi telah dicabut. Silakan login kembali.', 401, 'UNAUTHENTICATED');
  }

  const permissions = new Set(
    dbUser.role.rolePermissions.map((rp) => rp.permission.code)
  );

  return {
    userId: dbUser.id,
    email: dbUser.email,
    fullName: dbUser.fullName,
    roleId: dbUser.roleId,
    roleCode: dbUser.role.code,
    permissions,
  };
});

/**
 * Guard utama di seluruh Service Layer, Server Actions, dan Route Handlers.
 */
export async function requirePermission(
  permissionCode: string,
  scopeValidator?: (ctx: AuthContext) => Promise<boolean> | boolean
): Promise<AuthContext> {
  const ctx = await getAuthContext();

  // SUPER_ADMIN memiliki bypass aman untuk seluruh permission standar (tetap tercatat di audit log)
  const hasPerm =
    ctx.roleCode === 'SUPER_ADMIN' || ctx.permissions.has(permissionCode);

  if (!hasPerm) {
    throw new AuthorizationError(
      `Akses ditolak: membutuhkan izin '${permissionCode}'.`,
      403,
      'FORBIDDEN'
    );
  }

  if (scopeValidator) {
    const allowed = await scopeValidator(ctx);
    if (!allowed) {
      throw new AuthorizationError(
        'Akses ditolak: Anda tidak memiliki hak cakupan (scope/ownership) atas data ini.',
        403,
        'FORBIDDEN'
      );
    }
  }

  return ctx;
}

/**
 * Contoh Ownership & Project-Scope Guard untuk mutasi Task
 */
export async function assertCanUpdateTask(
  ctx: AuthContext,
  taskId: string
): Promise<boolean> {
  if (ctx.roleCode === 'SUPER_ADMIN') return true;

  const task = await prisma.task.findFirst({
    where: { id: taskId, deletedAt: null },
    select: {
      assigneeId: true,
      reporterId: true,
      project: {
        select: {
          ownerId: true,
          members: {
            where: { userId: ctx.userId },
            select: { projectRole: true },
          },
        },
      },
    },
  });

  if (!task) return false;

  if (ctx.roleCode === 'PROJECT_MANAGER') {
    return (
      task.project.ownerId === ctx.userId ||
      task.project.members.some((m) => m.projectRole === 'OWNER' || m.projectRole === 'LEAD')
    );
  }

  // STAFF_CREATOR & DESIGNER hanya boleh update task miliknya sendiri / yang ditugaskan kepadanya
  return task.assigneeId === ctx.userId || task.reporterId === ctx.userId;
}
```

##### B. Atomic Audited Mutation & Notification Wrapper (`src/server/services/audit-logger.ts`)

Setiap operasi mutasi **wajib** dibungkus dalam satu transaksi Prisma bersama `activity_logs` dan penyaringan field sensitif (*redaction*).

```typescript
import { headers } from 'next/headers';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db/prisma';
import type { AuthContext } from '@/server/auth/rbac';

const REDACTED_KEYS = new Set(['passwordHash', 'password_hash', 'tokenVersion', 'token_version']);

function redactSensitive(payload: Record<string, unknown> | null | undefined) {
  if (!payload) return null;
  const clean: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(payload)) {
    clean[key] = REDACTED_KEYS.has(key) ? '[REDACTED]' : val;
  }
  return clean as Prisma.InputJsonValue;
}

export type AuditModule = 'TASKS' | 'TEAM_KPI' | 'SOCIAL_DESIGN' | 'SYSTEM';

export interface AuditMeta {
  action: string;       // e.g. 'design:submission:approved'
  module: AuditModule;  // e.g. 'SOCIAL_DESIGN'
  entityType: string;   // e.g. 'DESIGN_SUBMISSION'
  entityId: string;
  summary: string;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
}

export interface NotificationDraft {
  recipientId: string;
  type: Prisma.NotificationCreateManyInput['type'];
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * Menjalankan business logic + audit log + notifikasi dalam 1 transaksi atomik PostgreSQL.
 */
export async function executeAuditedMutation<T>(
  ctx: AuthContext,
  work: (tx: Prisma.TransactionClient) => Promise<{
    result: T;
    audit: AuditMeta;
    notifications?: NotificationDraft[];
  }>
): Promise<T> {
  const reqHeaders = await headers();
  const ipAddress =
    reqHeaders.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    reqHeaders.get('x-real-ip') ??
    null;
  const userAgent = reqHeaders.get('user-agent') ?? null;

  return prisma.$transaction(async (tx) => {
    const { result, audit, notifications } = await work(tx);

    await tx.activityLog.create({
      data: {
        actorId: ctx.userId,
        action: audit.action,
        module: audit.module,
        entityType: audit.entityType,
        entityId: audit.entityId,
        summary: audit.summary,
        oldValues: redactSensitive(audit.oldValues) ?? Prisma.JsonNull,
        newValues: redactSensitive(audit.newValues) ?? Prisma.JsonNull,
        ipAddress,
        userAgent,
      },
    });

    if (notifications && notifications.length > 0) {
      // Hindari mengirim notifikasi ke diri sendiri (actor)
      const filtered = notifications.filter((n) => n.recipientId !== ctx.userId);
      if (filtered.length > 0) {
        await tx.notification.createMany({
          data: filtered.map((n) => ({
            recipientId: n.recipientId,
            actorId: ctx.userId,
            type: n.type,
            title: n.title,
            message: n.message,
            entityType: n.entityType ?? audit.entityType,
            entityId: n.entityId ?? audit.entityId,
            actionUrl: n.actionUrl ?? null,
            metadata: n.metadata ?? {},
          })),
        });
      }
    }

    return result;
  });
}
```

---

#### 4.4 Keamanan Data Lapis Ganda & Catatan PostgreSQL Row-Level Security (RLS)

##### 1. Postur Keamanan Aplikasi & Autentikasi
- **Password Hashing:** Gunakan **Argon2id** (`@node-rs/argon2`, parameter OWASP: `memoryCost: 19456`, `timeCost: 2`, `parallelism: 1`) atau **Bcrypt (cost 12)** jika runtime tidak mendukung native addon.
- **Session & Instant Revocation (Auth.js v5):** Cookie JWT bertanda tangan dengan flag `HttpOnly`, `Secure` (production), `SameSite=Lax`, durasi sesi **maks. 7 hari (sliding expiration)**. Kolom `users.token_version` diverifikasi terhadap klaim token pada `getAuthContext()` sehingga penonaktifan akun, reset password, atau perubahan role berlaku **serta-merta (instant revocation)** tanpa menunggu token kedaluwarsa.
- **Proteksi Brute Force & Abuse:** Rate limiting berbasis sliding window pada endpoint `/api/auth/callback/credentials` (maks. 5 percobaan gagal / 15 menit per email+IP) dan `/api/uploads/presign` (maks. 30 request / menit per user).
- **Zero Sensitive Leakage:** Gunakan `select` eksplisit pada seluruh query `users` (jangan pernah `SELECT *` ke client payload) agar `password_hash` tidak pernah bocor ke RSC serialized props maupun API response.
- **Backup & Recovery PostgreSQL:** Jika menggunakan Supabase Managed PostgreSQL, aktifkan **Daily Automated Backups** (dan Point-in-Time Recovery saat tim membesar). Jika self-hosted VPS, jadwalkan `pg_dump --format=custom` harian terenkripsi ke bucket S3 terpisah dengan retensi minimal 30 hari.

##### 2. Catatan Penting PostgreSQL Row-Level Security (RLS) untuk Deployment Supabase

> **KRITIS (Wajib Diterapkan Jika Menggunakan Supabase Managed PostgreSQL):**
> Secara default, Supabase mengekspos tabel di skema `public` melalui **PostgREST Data API** menggunakan kunci `anon` / `authenticated`. Karena arsitektur KTMS mengakses PostgreSQL **secara eksklusif dari sisi server Next.js melalui Prisma ORM** (koneksi langsung/PgBouncer dengan role `postgres`/service role, **BUKAN** dari browser client Supabase JS), maka seluruh 25 tabel **WAJIB dikunci dengan RLS aktif tanpa policy permisif untuk role publik**:

```sql
-- Lockdown Script: Aktifkan RLS di seluruh 25 tabel skema public
-- Efek: Role 'anon' & 'authenticated' PostgREST mendapat ZERO ACCESS (deny by default),
-- sementara koneksi server-side Prisma (owner/service role) tetap berjalan penuh dengan RBAC Service Layer.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename NOT LIKE '_prisma_%'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.tablename);
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated;', r.tablename);
  END LOOP;
END $$;
```

**Keuntungan Pendekatan Server-Side RBAC + RLS Lockdown ini untuk V1:**
1. **Zero Data Exposure via Public API:** Meskipun `NEXT_PUBLIC_SUPABASE_URL` atau `anon` key tidak sengaja terpapar, penyerang tidak bisa membaca atau mengubah satu baris pun tabel KTMS melalui PostgREST.
2. **Satu Sumber Aturan RBAC & Audit:** Tidak perlu menduplikasi logika kompleks *project membership* dan *separation of duties* ke dalam puluhan policy SQL RLS yang sulit di-debug dalam sprint 2 minggu; seluruh otorisasi, *ownership check*, dan pencatatan `activity_logs` terjamin deterministik di satu tempat (`src/server/auth/rbac.ts` + `src/server/services/audit-logger.ts`).
3. **Siap Migrasi:** Karena tidak terikat fungsi auth spesifik Supabase (`auth.uid()`), database PostgreSQL KTMS tetap **100% portabel** ke self-hosted PostgreSQL, Neon, RDS, atau Railway kapan pun dibutuhkan.

---

#### Checklist Kesiapan Implementasi Database (Untuk Yoga & Nta — Hari 1–3 Sprint)

- [ ] Jalankan `prisma init` & salin definisi 21 ENUM + 25 model tabel ke `prisma/schema.prisma` (gunakan `@db.Timestamptz(6)`, `@db.Uuid`, dan `@@map`).
- [ ] Buat migrasi awal dengan `prisma migrate dev --create-only --name init_ktms_schema`, sisipkan blok **Generated Columns (`engagement_rate`, `ctr`)**, **Triggers (`fn_set_updated_at`, `fn_prevent_audit_log_mutation`)**, **25 Custom Indexes (Partial/Composite/GIN/Trigram termasuk `uq_tasks_active_content_production`)**, dan **RLS Lockdown Script** (bila pakai Supabase).
- [ ] Jalankan `prisma/seed.ts` yang mengisi 4 Canonical Roles, 42 Atomic Permissions, mapping `role_permissions` sesuai Permission Matrix 4.2, default KPI Templates, serta akun awal `SUPER_ADMIN` untuk Leadership, Yoga, dan Nta.
- [ ] Konfigurasikan `DATABASE_URL` (PgBouncer pooled port `6543`) dan `DIRECT_URL` (direct port `5432`) di `.env.local` & environment production.

---

## BAGIAN IV — NEXT.JS APP ROUTER ARCHITECTURE, API CONTRACTS & 14-DAY EXECUTION ROADMAP

> **Cakupan Bagian IV:** Arsitektur 5-Layer Feature-Sliced Next.js 15+ App Router, Pohon Folder Proyek Lengkap, Strategi Caching & Error/Audit Wrapper, Katalog **26 UI Page Routes**, **28 Protected Server Actions**, **15 Route Handlers (`/api/**`)**, **6 Grup Kontrak Payload (11 TypeScript & 14 JSON)**, Pembagian Ownership Anti-Konflik (Mhd Yoga Andhika vs Nta), Jadwal Eksekusi Harian 14 Hari, Template Laporan EOD 17:30 WIB, 3 Formal Demo Gate, Risk Register, & 10-Point Production V1 DoD.

### Ringkasan Eksekutif untuk Leadership

Bagian IV ini menjadi **panduan teknis dan eksekusi harian** yang menjembatani seluruh spesifikasi KTMS (**Bagian I — Product & SRS**, **Bagian II — System Flows & Use Cases**, dan **Bagian III — Database & RBAC**) menjadi aplikasi produksi nyata dalam **14 hari** oleh **2 developer (Mhd Yoga Andhika dan Nta)** dengan tiga prinsip operasional utama:

1. **Arsitektur Zero-Friction untuk Velocity 2 Minggu:** Menggunakan **Next.js 15+ (App Router) Hybrid Full-Stack** (Server Actions + Route Handlers `/api/**`), **PostgreSQL 16 (Supabase)**, **Prisma ORM**, dan **Auth.js v5**. Satu codebase TypeScript end-to-end menghilangkan duplikasi DTO/serializer antara frontend dan backend sehingga 2 developer dapat menyelesaikan seluruh 4 modul inti secara realistis.
2. **Pembagian Ownership Anti-Konflik:** Codebase disusun menggunakan **Feature-Sliced Modular Architecture** (`src/features/tasks`, `src/features/team-kpi`, `src/features/social-design`, `src/features/system`) sehingga Yoga dan Nta bekerja secara paralel pada *vertical slice* berbeda dengan gesekan *merge conflict* minimal.
3. **Akuntabilitas Terukur & Transparan ke Leadership:** Setiap hari (Hari 1 s/d Hari 14) memiliki **Deliverable Terukur** (dokumen, Figma, Preview URL Vercel, atau video/screenshot uji coba nyata — bukan status verbal *"masih dikerjakan"*), dilengkapi **Laporan Harian 17:30 WIB** dan **3 Formal Demo Gate** (Hari 4, Hari 10, Hari 14).

---

### 1. Arsitektur Proyek & Struktur Folder Next.js (App Router + Feature-Sliced Modular)

#### 1.1 Arsitektur 5 Lapis KTMS

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

#### 1.2 Pohon Folder Proyek Lengkap (Copy-Paste Ready)

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

#### 1.3 Arsitektur Data Fetching, Caching & State Management

Untuk menghindari *over-fetching*, *waterfall*, atau sinkronisasi state ganda antara server dan client, KTMS menerapkan aturan tegas pada 4 lapisan berikut:

##### A. Kapan Memakai RSC vs TanStack Query (React Query v5)

| Skenario Penggunaan | Mekanisme Wajib | Alasan Teknis & Pola Implementasi |
| :--- | :--- | :--- |
| **Initial Page Load** (`/`, `/projects`, `/team`, `/kpi/evaluations`, `/system/users`, `/announcements`) | **React Server Components (RSC)** | Query Prisma dieksekusi langsung di server tanpa *client bundle overhead* dan tanpa waterfall `useEffect`. Halaman merender HTML siap pakai dengan sesi RBAC sudah terverifikasi di server. |
| **Kanban Board Drag-and-Drop** (`/tasks/board`) | **RSC Initial Hydration + TanStack Query (`useQuery` + `useMutation`)** | RSC mengirim `initialData` ke `KanbanBoard` client component; perpindahan kartu memakai `onMutate` *optimistic update* di cache React Query dan *automatic rollback* bila Server Action mengembalikan error validasi/konflik versi. |
| **Work Calendar & Content Calendar** (`/tasks/calendar`, `/content/calendar`) | **RSC Initial Month + TanStack Query** | Navigasi antar bulan (Prev/Next Month) dan toggle filter channel/assignee di-fetch cepat melalui Route Handler `GET /api/tasks/calendar` atau `GET /api/content/calendar` dengan `placeholderData: keepPreviousData` agar grid kalender tidak berkedip. |
| **Slide-Over Detail Drawer** (Task Detail / Design Review) | **TanStack Query on-demand (`enabled: Boolean(drawerId)`)** | Membuka detail task atau riwayat revisi desain dari Kanban/Calendar tidak memicu *full page navigation*; data di-fetch dari `GET /api/tasks/[taskId]` dan di-cache selama 30 detik (`staleTime: 30_000`). |
| **Notification Bell Polling** (Global Topbar) | **TanStack Query Polling (`refetchInterval: 30_000`)** | Memanggil `GET /api/notifications/unread` setiap 30 detik dengan `refetchIntervalInBackground: false` dan `refetchOnWindowFocus: true`. Solusi ringan tanpa biaya kompleksitas WebSocket server tambahan untuk V1 2 minggu. |

##### B. Kapan Memakai Server Actions vs Route Handlers (`/api/**`)

| Dimensi | Next.js Server Actions (`src/features/*/actions/*.ts`) | Route Handlers (`src/app/api/**/route.ts`) |
| :--- | :--- | :--- |
| **Tujuan Utama** | **Seluruh mutasi internal (Create, Update, Delete, Status Transition, Approval, Finalize)** yang dipicu form/tombol UI aplikasi KTMS. | **Complex Read Queries** (untuk TanStack Query client filtering/polling), **File Download/Export** (CSV/PDF stream), **Presigned Upload URL**, **Auth.js endpoint**, dan **Healthcheck**. |
| **Keunggulan** | End-to-end TypeScript inference otomatis, integrasi langsung `revalidatePath`/`revalidateTag`, nol boilerplate `fetch()` + JSON serialization di UI. | Mendukung HTTP GET cache headers, streaming binary (`Content-Disposition: attachment`), HTTP status codes standar (200/400/401/403/404), dan inspeksi Network tab yang mudah untuk polling/pagination. |
| **Strategi Invalidasi Cache** | Setelah mutasi sukses: panggil `revalidatePath()` atau `revalidateTag()` di server **DAN** `queryClient.invalidateQueries()` di `onSuccess` hook client bila halaman memakai React Query. | Endpoint `GET` selalu menyertakan `export const dynamic = "force-dynamic"` atau `Cache-Control: private, no-store` untuk data operasional sensitif RBAC agar tidak bocor antar user di edge cache. |

##### C. Client UI State (Zustand) vs URL SearchParams (`nuqs`)

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

#### 1.4 Standardisasi Error Handling, Validasi Zod, RBAC Wrapper & Atomic Audit Hook

Semua Server Actions di seluruh 4 modul **wajib** memakai pola standar di bawah ini sehingga error handling di UI seragam, keamanan RBAC tidak mungkin terlewat, dan setiap perubahan data tercatat atomik di `activity_logs`.

##### 1. Response Wrapper Standar (`src/types/action-result.ts`)

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

##### 2. RBAC Guard & Session Helper (`src/server/auth/rbac.ts`)

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
 * Request-scoped memoized auth context (selaras dengan Bagian III §4.3).
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

##### 3. Safe Server Action Wrapper (`src/server/actions/safe-action.ts`)

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

##### 4. Atomic Prisma Transaction + Audit Log & Notification Hook (`src/server/services/audit-logger.ts`)

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

### 2. Daftar Route Aplikasi, API Endpoints & Server Actions + Kontrak Payload

#### 2.1 App Router Page Routes Table (Seluruh 4 Modul + Auth & Overview)

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

#### 2.2 Katalog Lengkap Server Actions & Route Handlers (`/api/**`)

##### 2.2.1 Server Actions Catalog (Mutasi Internal Terproteksi)

Seluruh kode izin pada tabel berikut merujuk langsung kepada **42 kode izin kanonik (`module:resource:action`)** pada Bagian III §4.1–4.2.

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

##### 2.2.2 Route Handlers (`/api/**`) Catalog (Read Queries, Export, Presign, Cron & Health)

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

#### 2.3 Kontrak Payload TypeScript Interfaces & Contoh JSON Request/Response

Seluruh kontrak di bawah ini siap disalin langsung ke dalam file `schemas/*.ts` dan `types.ts` masing-masing fitur.

##### Kontrak 1 — Modul A: Create Task & Move Task di Kanban Board

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

##### Kontrak 2 — Modul C -> A: Create Content Plan + Auto-Spawn Design Brief & Unified Tasks

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

##### Kontrak 3 — Modul C -> A/D: Submit Design & Approve / Request Revision Loop

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

##### Kontrak 4 — Modul B: Generate Auto-Aggregated KPI Snapshot & Finalize Monthly Evaluation

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

##### Kontrak 5 — Modul D: Broadcast Announcement, Polling Notifications & Activity Logs

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

##### Kontrak 6 — Shared Storage: Presigned Upload URL (`POST /api/uploads/presign`)

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

### 3. Pembagian Kerja & Roadmap Eksekusi Harian 14 Hari (Mhd Yoga Andhika & Nta)

#### 3.1 Pembagian Ownership & Strategi Anti-Konflik Merge

Agar 2 developer dapat bekerja dengan kecepatan tinggi tanpa saling menimpa file (*merge conflict*), pembagian kerja menggunakan strategi **Vertical Slice Ownership** yang dipadukan dengan **Shared Interface Contract** yang dibekukan pada **Hari 4 (Gate 1)**.

| Dimensi | **Mhd Yoga Andhika** (Track A — Core Platform, Modul A & Modul D) | **Nta** (Track B — Design System/UI Shell, Modul C & Modul B) |
| :--- | :--- | :--- |
| **Peran Utama** | Platform & Backend Lead + Full-Stack Modul A & D | UI/UX Frontend Lead + Full-Stack Modul C & B |
| **Fondasi Bersama (Hari 5–7)** | Inisialisasi Repo, CI/CD Vercel + Supabase, `prisma/schema.prisma`, `prisma/seed.ts`, Auth.js v5, RBAC Guard (`src/server/auth/`), `safe-action.ts`, `audit-logger.ts`, `notification-dispatcher.ts` | Konfigurasi Tailwind + shadcn/ui Design System, App Shell (`AppSidebar`, `AppTopbar`, `GlobalSlideOverHost`), komponen shared (`DataTable`, `StatusBadge`, `FileUploadDropzone`), dan `POST /api/uploads/presign` UI hook |
| **Kepemilikan Modul Eksklusif** | **Modul A (`src/features/tasks/`)**: Projects, My Tasks, Kanban Board (`@dnd-kit`), Work Calendar, `TaskDetailDrawer` + **Modul D (`src/features/system/`)**: User Management, RBAC Matrix, Notification Center, Announcements, Activity Logs + Executive Home `/` | **Modul C (`src/features/social-design/`)**: Content Ideas, Content Calendar, Content Planning + Auto-Task Consumer, Design Workspace, Approval & Revision Loop, Asset Library, Content Analytics + **Modul B (`src/features/team-kpi/`)**: Team Directory, Individual Performance, KPI Templates, Team Dashboard (`Recharts`), Monthly Evaluation, Reports & CSV Export |
| **Direktori Eksklusif (Nol Konflik)** | `src/features/tasks/**`, `src/features/system/**`, `src/server/auth/**`, `src/server/services/**`, `src/app/(dashboard)/projects/**`, `src/app/(dashboard)/tasks/**`, `src/app/(dashboard)/system/**` | `src/features/social-design/**`, `src/features/team-kpi/**`, `src/components/layout/**`, `src/components/shared/**`, `src/app/(dashboard)/content/**`, `src/app/(dashboard)/design/**`, `src/app/(dashboard)/assets/**`, `src/app/(dashboard)/team/**`, `src/app/(dashboard)/kpi/**` |
| **Kontrak Integrasi Lintas Modul** | Menyediakan fungsi internal siap pakai di Hari 7–8: `taskService.spawnLinkedTask(tx, input)`, `writeAuditLog(tx, input)`, `dispatchNotifications(tx, input)` | Memanggil fungsi Yoga di dalam `prisma.$transaction()` saat membuat Content Plan, Approve/Revise Design, dan Finalize KPI; membaca tabel `tasks` & `design_submissions` untuk agregasi KPI |

> **Aturan File Bersama (*Shared-Touch Files*):** File `prisma/schema.prisma`, `src/lib/constants/enums.ts`, `src/lib/constants/permissions.ts`, `src/lib/constants/navigation.ts`, dan `package.json` hanya boleh diubah melalui PR kecil tersendiri dengan pemberitahuan langsung di grup sync Yoga–Nta dan review SLA **maksimal 1 jam**.

##### Visualisasi Alur 14 Hari & 3 Formal Demo Gate ke Leadership

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

#### 3.2 Jadwal Harian Detail — Minggu 1 (Hari 1–7): Analisis, Desain & Fondasi

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

#### 3.3 Jadwal Harian Detail — Minggu 2 (Hari 8–14): Sprint Development, Integrasi, QA & Go-Live

Minggu 2 adalah fase eksekusi penuh dengan **Feature Freeze ketat pada Hari 12 pukul 17:00 WIB**, menyisakan Hari 13 khusus untuk QA/Bug Fixing/Security dan Hari 14 untuk UAT & Production Go-Live.

| Hari | Fokus Utama | Tugas Spesifik **Mhd Yoga Andhika** | Tugas Spesifik **Nta** | Deliverable Terukur & Bukti Progres ke Leadership |
| :--- | :--- | :--- | :--- | :--- |
| **Hari 8** | Core CRUD Modul A & Modul C (Cross-Module Auto-Task) | Bangun **Project Management** (`/projects`, `/projects/[projectId]`), CRUD Task (`createTaskAction`, `updateTaskAction`, checklist, comments, pencatatan `first_submitted_at` & `effective_completion_time`), **My Tasks** (`/tasks/my-tasks`), dan cron **`POST/GET /api/cron/deadline-alerts`** (08:00 WIB, `CRON_SECRET`, H-2/H-0/H+1&H+3). | Bangun **Content Ideas Bank** (`/content/ideas` + approve/reject) dan **Content Planning** (`/content/planner`) yang memanggil `taskService.spawnLinkedTask(tx)` untuk otomatis membuat `CONTENT_PRODUCTION` & `DESIGN_TASK` + `design_briefs`. | **Bukti Live Staging:** PM approve 1 ide konten -> buat Content Plan -> 2 task (`CONTENT_PRODUCTION` & `DESIGN_TASK`) langsung muncul otomatis di **My Tasks** Creator & Designer + uji trigger `/api/cron/deadline-alerts` sukses! |
| **Hari 9** | Kanban Drag-and-Drop, Work Calendar & Design Approval Loop | Bangun **Kanban Board** (`/tasks/board` dengan `@dnd-kit` optimistic update + rollback + `nuqs` filter), **Work Calendar** (`/tasks/calendar` dengan edit jadwal via drawer/modal; DnD kalender di V1.1), dan `TaskDetailDrawer` (slide-over tanpa keluar dari board). | Bangun **Design Workspace** (`/design/workspace` — submit versi v1/v2 via upload/link), **Design Approval Queue** (`/design/reviews` — Approve & Request Revision loop, khusus `SUPER_ADMIN` & `PROJECT_MANAGER`), serta **Asset Library** (`/assets` — auto-promote saat desain Approved + tag search). | **Bukti Live Staging (Video 3 menit):** Designer submit desain v1 -> PM Request Revision (min. 10 karakter; status task jadi `REVISION`) -> Designer submit v2 -> PM Approve -> file masuk **Asset Library** & kartu Kanban pindah ke `DONE`! |
| **Hari 10** | Modul D Governance, Content Calendar & **DEMO GATE 2** | Bangun **User Management** (`/system/users` CRUD + reset password + instant revocation `tokenVersion`), **RBAC Matrix Viewer/Editor** (`/system/roles`), **Notification Center** (`NotificationBellPopover` polling 30 detik + `/notifications`), dan **Announcements** (`/announcements` + maks. 3 pinned banner). | Bangun **Content Calendar** (`/content/calendar` pengganti spreadsheet konten dengan filter platform/status/bulan), **Content Performance Analytics** (`/content/analytics` input reach/impressions/clicks/engagement + grafik Recharts `ER%` & `CTR%`), dan **Team Directory** (`/team`). | **DEMO GATE 2 (16:00 WIB):** Demo Live Staging 30 menit ke Leadership menampilkan Modul A + C + D berjalan end-to-end dengan data nyata dan notifikasi in-app aktif! |
| **Hari 11** | KPI Aggregation Engine, Monthly Evaluation & Audit Logs | Bangun **Activity Logs Explorer** (`/system/activity-logs` dengan TanStack Table, filter modul/aktor/tanggal & JSONB diff viewer) dan **Executive & Personal Home Dashboard** (`/`) yang menggabungkan widget dari 4 modul. | Bangun **Individual Performance** (`/team/[userId]`), **KPI Templates & Monthly Assignments** (`/kpi/templates` — `kpi_assignments` total bobot 100% + fitur ***Clone Previous Month***), `kpi-aggregator.service.ts` (`AUTO_TCR`, `AUTO_OTDR`, `AUTO_DQS`, `AUTO_CPVS` + `N/A` *weight re-normalization*), dan **Monthly Evaluation** (`/kpi/evaluations` + `[evaluationId]` Generate Draft -> Review `MANUAL_SCORE` 0–100 -> Finalize Lock khusus `SUPER_ADMIN`). | **Bukti Live Staging:** Klik *Clone Previous Month* & *Generate Monthly Evaluation* menghasilkan skor objektif (`TCR`, `OTDR`, `DQS`, `CPVS`) otomatis dari data aktual + seluruh aksi tercatat di `/system/activity-logs`. |
| **Hari 12** | KPI Dashboard, CSV Export, Integrasi Total & **FEATURE FREEZE** | Jalankan skenario **End-to-End Cross-Module Smoke Test** (4 skenario penuh pada Bagian II §2), lengkapi edge-case state transition & empty/error states di seluruh halaman, serta optimasi query Prisma (hilangkan N+1 query). | Bangun **Team Performance Dashboard** (`/kpi/dashboard` dengan Recharts leaderboard & tren bulanan) dan **Reports & Analytics** (`/kpi/reports` + `GET /api/kpi/reports/export` download CSV rapi di Excel); selesaikan responsivitas tablet/laptop kecil. | **FEATURE FREEZE (17:00 WIB):** Seluruh 25 sub-fitur V1 lengkap di branch `dev` (Staging). Laporan checklist uji integrasi 4 skenario diposting ke Leadership. |
| **Hari 13** | Dedicated QA, RBAC Penetration Check, Bug Fix & UAT Dry-Run | Eksekusi **RBAC Security Matrix Test** (uji akses ilegal langsung via URL & Server Action untuk 4 role), Lighthouse & loading audit, setup Production Environment (Supabase Prod + automated daily backup + Vercel Production env vars), dan perbaikan bug P0/P1. | Lakukan QA silang seluruh flow Modul A & D (karya Yoga), perbaiki seluruh bug UI/UX P0/P1 Modul B & C, siapkan **Data Migrasi Awal** (daftar user asli Krevia + template KPI V1 + sample content calendar bulan berjalan), dan susun Panduan Singkat Penggunaan (1-page Quick Start). | **Zero P0/P1 Bugs Report** + Akun Staging UAT siap diuji oleh Leadership & perwakilan tim (PM, Creator, Designer). |
| **Hari 14** | **DEMO GATE 3: Formal UAT Sign-Off, Production Go-Live & Handover** | Merge `dev -> main`, deploy **Production V1** ke domain internal Krevia, jalankan production smoke test (`/api/health`, login, upload storage, DB backup verify), dan aktifkan error monitoring (Vercel Logs / Sentry free tier). | Pimpin sesi **Formal UAT & Go-Live Demo** bersama Leadership, lakukan sesi **Onboarding 30 Menit** bersama tim internal Krevia (PM, Creator, Designer), dan serahkan dokumen Quick Start + backlog rekomendasi V1.1. | **GATE 3 SIGN-OFF:** Aplikasi **KTMS V1 LIVE di Production**, seluruh akun tim Krevia aktif login, dan Berita Acara Serah Terima V1 disetujui Leadership. |

---

#### 3.4 Realisme Beban Kerja 2 Developer & Guardrail Prioritas MoSCoW

Target 2 minggu untuk 4 modul oleh 2 developer **hanya realistis jika disiplin terhadap V1 Scope Guardrails**:

1. **Mengapa Beban Ini Realistis:**
   - **Zero Boilerplate Duplication:** Next.js Server Actions + Prisma + Zod + shadcn/ui memangkas ±40% waktu pengembangan dibanding arsitektur terpisah (separate REST API + Redux/Axios + manual form state).
   - **Unified Task Table:** Tidak membangun 3 sistem task terpisah; Content Production dan Design Task hanyalah record di tabel `tasks` yang otomatis tampil di My Tasks, Kanban, Work Calendar, dan otomatis terhitung di KPI.
   - **Standardized Primitives:** Semua tabel (Users, Team Directory, My Tasks, Assets, Activity Logs) berbagi 1 komponen `DataTable` (`TanStack Table`); semua form memakai 1 pola `React Hook Form + Zod + createProtectedAction`.
2. **Mekanisme Scope Buffer (Bila Terjadi Keterlambatan > 0.5 Hari di Hari 10–11):**
   - Fitur **Must-Have V1 (TIDAK BOLEH DIKURANGI):** Login + RBAC 4 role, Projects, My Tasks, Kanban Board, Work Calendar, Content Ideas/Planning/Calendar + Auto-Task, Design Upload/Link + Approval/Revision Loop, Asset Library, Team Directory, Individual Metrics, KPI Templates, Monthly Evaluation + Finalize, Reports CSV Export, Users, Notifications, Announcements, Activity Logs.
   - Fitur **Deferrable ke V1.1 (Minggu ke-3, aman ditunda tanpa merusak operasional V1):** Drag-to-resize tanggal langsung di grid kalender (cukup edit tanggal di drawer), export PDF ber-template visual khusus (V1 gunakan CSV export + `@media print` browser), notifikasi eksternal Email/WhatsApp, dan custom dynamic role creation di luar 4 role kanonik.

---

#### 3.5 Ritual Komunikasi, Git Workflow, Demo Checkpoints & Risk Register

##### A. Git Branching Strategy & Cross-PR Review

| Branch / Aturan | Konvensi & Kebijakan Teknis |
| :--- | :--- |
| **`main`** | **Protected Production Branch.** Hanya menerima merge dari `dev` setelah lulus Gate 3 / UAT. Auto-deploy ke Production Vercel. |
| **`dev`** | **Staging Integration Branch.** Auto-deploy ke `staging-ktms.vercel.app`. Semua PR fitur di-merge ke sini setiap hari agar Leadership selalu dapat melihat progres live. |
| **`feat/<modul>-<owner>/<slug>`** | Branch kerja harian pendek (umur maks 1–2 hari). Contoh: `feat/tasks-yoga/kanban-dnd`, `feat/social-nta/design-approval-loop`, `fix/kpi-nta/rounding-score`. |
| **Conventional Commits** | Format wajib: `feat(tasks): add optimistic kanban drag and drop`, `fix(social): sync content status on design approval`, `chore(db): add composite index on tasks`. |
| **Cross-PR Review Wajib** | Yoga me-review PR Nta, Nta me-review PR Yoga. **SLA Review: maks 2 jam kerja.** Setiap PR wajib lolos GitHub Actions CI (`lint`, `tsc --noEmit`, `prisma validate`, `next build`) + melampirkan **screenshot / rekaman layar 30 detik** dan **Vercel Preview URL**. |

##### B. Ritual Komunikasi Harian & Format Laporan ke Leadership

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

##### C. 3 Formal Demo Gate ke Leadership

| Demo Gate | Jadwal | Peserta | Agenda Demonstrasi Konkret | Kriteria Sign-Off (Go / No-Go) |
| :--- | :--- | :--- | :--- | :--- |
| **Gate 1: Blueprint & Design Sign-Off** | **Hari 4** (14:00 WIB, 45 menit) | Leadership, Yoga, Nta | Walkthrough SRS & V1 Guardrails, demo Figma Hi-Fi Prototype 4 modul, review ERD & RBAC 4 role, serta konfirmasi jadwal 14 hari. | Leadership menyetujui scope V1 (freeze), alur status 4 modul, formula KPI, dan desain UI tanpa perubahan arsitektur mayor. |
| **Gate 2: Mid-Sprint Live Staging Demo** | **Hari 10** (16:00 WIB, 30 menit) | Leadership, PM, Yoga, Nta | Demo langsung di **Staging URL** (bukan localhost): Login 4 role -> Buat Content Plan -> Auto-Task muncul di Kanban -> Designer upload revisi -> PM Approve -> Masuk Asset Library -> Broadcast Announcement & Notifikasi muncul. | Alur lintas modul A + C + D berjalan stabil end-to-end di Staging tanpa crash; feedback minor dicatat untuk dituntaskan sebelum Feature Freeze Hari 12. |
| **Gate 3: Formal UAT & Production Go-Live** | **Hari 14** (14:00 WIB, 60 menit) | Leadership, PM, Perwakilan Creator & Designer, Yoga, Nta | Verifikasi skenario UAT penuh termasuk Modul B (Generate KPI otomatis -> Review -> Finalize Lock -> Export CSV) dan Audit Trail (`/system/activity-logs`), dilanjutkan switch ke Production URL & onboarding tim 30 menit. | 0 bug P0/P1, seluruh 4 role lolos uji RBAC, Production URL live dengan SSL + DB backup aktif, dan seluruh akun tim Krevia berhasil login. |

##### D. Risk Register & Rencana Mitigasi (Timeline 2 Minggu)

| ID | Risiko Proyek | Prob. | Dampak | Early Warning Signal | Mitigasi Preventif | Contingency Plan (Fallback) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **R-01** | **Scope Creep saat Demo Gate 1 / Gate 2** (permintaan fitur baru seperti mobile app/payroll/WA bot) | Tinggi | Tinggi | Muncul permintaan fitur di luar 25 sub-fitur MoSCoW V1 saat sesi review. | Tampilkan tabel *V1 Scope Guardrails* di awal setiap demo; catat ide baru secara apresiatif ke tabel **Backlog V1.1**. | Jika Leadership tetap meminta tambahan kritikal di V1, lakukan *explicit trade-off* (geser fitur V1 prioritas rendah atau tambah hari timeline secara tertulis). |
| **R-02** | **Kompleksitas Optimistic DnD Kanban (`@dnd-kit`) & Race Condition** | Sedang | Sedang | Kartu melompat/duplikat saat dipindahkan cepat antar kolom pada Hari 9. | Gunakan *fractional `DOUBLE PRECISION` gap positioning* (`65536, 131072...`), optimistic `version` check di Prisma, dan batasi drag hanya antar status valid. | Sediakan tombol dropdown **"Ubah Status"** di setiap kartu & `TaskDetailDrawer` sebagai jalur alternatif 100% andal sembari memoles animasi DnD. |
| **R-03** | **Merge Conflict pada `prisma/schema.prisma` atau Shared Types** | Sedang | Sedang | Kedua developer mengedit schema/enum bersamaan di Minggu 2. | Freeze `schema.prisma` pada Hari 5; perubahan schema di Minggu 2 hanya lewat PR kecil terkoordinasi + migrasi inkremental. | Yoga bertindak sebagai *Schema Gatekeeper* tunggal untuk merge perubahan `prisma/schema.prisma` setiap jam 13:00 & 17:00 WIB. |
| **R-04** | **Kendala CORS / Limit Upload Supabase Storage** | Sedang | Sedang | Upload gambar/video desain gagal di browser Staging saat Hari 7/9. | Uji coba presigned upload end-to-end lebih awal di **Hari 7** (bukan di akhir sprint) dengan batas tegas 25 MB (Avatar 2 MB), TTL 300s, & whitelist MIME. | Mode **External Link (Figma / Canva / Google Drive)** tetap berjalan penuh sebagai mekanisme delivery utama paralel sehingga alur Desain tidak pernah terblokir. |
| **R-05** | **Edge Cases Kalkulasi KPI Otomatis** (user baru tanpa task / pembagian nol / task pindah bulan) | Sedang | Tinggi | Nilai `NaN%` atau skor berubah retrospektif saat task bulan lalu diedit di bulan ini. | Gunakan guard `totalAssignedTasks === 0 ? null : ...` (`N/A` + *weight re-normalization* `ROUND(SUM(S_k * w_k) / SUM(w_k_active), 2)`), simpan hasil agregasi ke kolom `autoMetricsSnapshot` + `evaluation_items`, dan kunci permanen saat `FINALIZED` (khusus `SUPER_ADMIN`). | Sediakan kemampuan *re-sync draft* hanya ketika status masih `DRAFT` sebelum evaluasi di-submit. |
| **R-06** | **Bug Integrasi Lintas Modul** (Content -> Task -> Design -> KPI tidak sinkron) | Sedang | Tinggi | Status Content sudah `READY_TO_PUBLISH` tapi task di Kanban masih `IN_REVIEW`. | Seluruh sinkronisasi lintas tabel **wajib dibungkus dalam satu `prisma.$transaction()`** di Service Layer (`content-workflow.service.ts`), bukan panggilan terpisah dari client. | Jalankan skenario E2E lintas modul sejak Hari 9 dan alokasikan penuh Hari 12 sore + Hari 13 untuk QA & regression fix. |
| **R-07** | **Keterlambatan Daftar User & Data Awal Krevia** | Rendah | Sedang | Daftar email staf dan bobot template KPI belum diterima pada Hari 11. | Minta template daftar tim & bobot KPI sejak **Gate 1 (Hari 4)** sebagai prasyarat seeding UAT. | Gunakan 4 akun role representatif + 1 template KPI standar Krevia untuk Go-Live Hari 14; Super Admin dapat menambah user langsung lewat `/system/users` dalam hitungan menit. |
| **R-08** | **Salah Satu Developer Berhalangan Mendadak (Sakit / Kendala Jaringan)** | Rendah | Tinggi | Developer absen > 0.5 hari pada Minggu 2. | Dokumentasi kontrak TypeScript & PR harian kecil memastikan rekan lain dapat mengambil alih branch segera tanpa reverse-engineering. | Aktifkan *Scope Buffer* (Sub-bab 3.4): prioritaskan 100% fitur Must-Have V1 dan geser fitur non-kritikal (grafik lanjutan/print polish) ke patch V1.0.1 di Hari 15–16. |

---

#### 3.6 Definition of Done (DoD) Production V1 (Checklist Go-Live Hari 14)

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

---

## LAMPIRAN — Lembar Persetujuan Pre-Coding Blueprint (Leadership Sign-Off Checklist — Gate 1 / Hari 4)

Lembar ini menjadi **dokumen keputusan resmi (*Go / No-Go Gate 1*)** pada **Hari ke-4 (14:00 WIB)** sebelum tim engineering (Mhd Yoga Andhika & Nta) memulai inisialisasi kode dan sprint implementasi pada Hari ke-5. Seluruh butir di bawah wajib diverifikasi dan disepakati bersama oleh **Leadership Krevia Digital** dan **Tim Engineering**.

### A. Persetujuan Ruang Lingkup & Scope Guardrails V1 (MoSCoW Freeze)

- [ ] **Scope 4 Modul & 25 Sub-Fitur V1 Disetujui:** Seluruh 19 blok *Must-Have (V1)* (`MOS-01` s/d `MOS-19`, setara 11,50 dev-days build + 2,50 dev-days QA/UAT/Deploy = 14,00 dev-days kapasitas Minggu 2 untuk 2 developer) telah ditinjau dan dibekukan sebagai baseline rilis Hari ke-14.
- [ ] **V1 Out-of-Scope Disepakati Tegas:** Leadership menyetujui bahwa **Native Mobile App**, **External Client Portal**, **Full HRIS (Payroll/Slip Gaji, Absensi Geofencing/Biometrik, Rekrutmen)**, **Social Media Auto-Publish API**, dan **Real-Time Chat Internal** berada di luar V1 dan ditempatkan pada *Backlog V1.1 / V2*.
- [ ] **Protokol Perubahan Scope (*Change Control*):** Setiap permintaan fitur baru di luar 25 sub-fitur V1 selama Hari 5–14 akan dicatat ke Backlog V1.1, atau hanya dapat masuk V1 melalui *explicit trade-off* tertulis (menggeser item V1 prioritas rendah atau menyesuaikan tanggal Go-Live).
- [ ] **Rencana Kontingensi *Emergency De-Scoping* Disetujui:** Apabila terjadi hambatan teknis tak terduga pada Hari 11–12, urutan penundaan aman ke V1.1 (`MOS-13` Content Analytics -> `MOS-18` Print-PDF -> `MOS-06` Week View Calendar) disepakati tanpa menyentuh *Non-Negotiable Core V1*.

### B. Persetujuan Arsitektur Teknologi, Keamanan & Infrastruktur Hosting

- [ ] **Tech Stack Final Disetujui:** Next.js 15+ (App Router, TypeScript, Tailwind CSS, `shadcn/ui`), Hybrid Backend (Server Actions + `/api/**` Route Handlers), PostgreSQL 16 + Prisma ORM, Auth.js v5 (Credentials + `token_version` revocation), dan Hybrid Object Storage (External Cloud Links + Supabase Storage/S3 Private Bucket).
- [ ] **Provisioning Akun & Lingkungan Infrastruktur (Hari 4–5):** Leadership menyetujui pembuatan/akses resmi untuk **GitHub Repository**, **Supabase PostgreSQL & Storage (Environment Staging & Production terpisah)**, **Vercel Project**, domain/subdomain internal Krevia Digital, serta aktivasi *automated daily backup* PostgreSQL.
- [ ] **Standar Keamanan & Tata Kelola Data Disetujui:** Kebijakan RBAC 4 peran (`SUPER_ADMIN`, `PROJECT_MANAGER`, `STAFF_CREATOR`, `DESIGNER`), pemisahan wewenang (*Separation of Duties*: approval desain oleh `SUPER_ADMIN`/`PROJECT_MANAGER`, finalisasi KPI eksklusif `SUPER_ADMIN`, larangan *self-evaluation*), *soft delete* entitas operasional, dan `activity_logs` yang *immutable* (*append-only*) telah disetujui.

### C. Persetujuan Formula KPI, Bobot Evaluasi & Kesiapan Data Awal

- [ ] **Formula Metrik Objektif KPI Disetujui:** Perhitungan otomatis **`AUTO_TCR`** (*Task Completion Rate*), **`AUTO_OTDR`** (*On-Time Delivery Rate* berbasis `first_submitted_at` & `effective_completion_time`), **`AUTO_DQS`** (*Design Quality Score* dengan *floor* 40 dan penalti 15 poin/revisi), **`AUTO_CPVS`** (*Content Output Target Achievement / Content Production Volume Score*), **`MANUAL_SCORE`** (skala 0–100), mekanisme `N/A` *weight re-normalization*, serta skala 4 Grade kanonik **A (`90,00–100,00`), B (`80,00–89,99`), C (`70,00–79,99`), D (`0,00–69,99`)** telah disepakati bersama.
- [ ] **Template Bobot KPI Awal Per Role Disetujui:** Leadership menyetujui bobot awal KPI bulanan (total wajib 100%) untuk `PROJECT_MANAGER`, `STAFF_CREATOR`, dan `DESIGNER` yang akan dimasukkan ke `prisma/seed.ts`.
- [ ] **Komitmen Penyerahan Data Awal Tim Krevia:** Leadership/PM berkomitmen menyerahkan daftar final nama lengkap, email resmi, divisi, jabatan, dan peran seluruh anggota tim Krevia Digital **paling lambat Hari ke-11 (17:00 WIB)** untuk keperluan seeding akun UAT (Hari 13) dan Go-Live (Hari 14).

### D. Persetujuan Pembagian Kerja, Komitmen Daily Report & 3 Demo Gates

- [ ] **Pembagian Track Engineering Disetujui:** **Mhd Yoga Andhika** bertanggung jawab penuh atas **Track A** (Core Platform, Auth/RBAC, Audit/Notifikasi, Modul A & Modul D, Executive Home `/`), sedangkan **Nta** bertanggung jawab penuh atas **Track B** (Design System/App Shell, Presigned Storage UI, Modul C & Modul B).
- [ ] **Komitmen Laporan Harian 17:30 WIB & Eskalasi Blocker:** Tim Engineering berkomitmen mengirimkan **Async EOD Progress Report** setiap hari pukul **17:30 WIB** ke grup Leadership (melampirkan bukti konkret PR/screenshot/video/Staging URL) serta menerapkan aturan eskalasi (*2-Hour Pair Debugging* / *4-Hour Leadership Escalation*).
- [ ] **Jadwal 3 Formal Demo Gate Terkonfirmasi di Kalender Leadership:**
  - **Gate 1 — Pre-Coding Blueprint & Design Sign-Off:** Hari 4, 14:00 WIB (45 menit)
  - **Gate 2 — Mid-Sprint Live Staging Demo (Modul A + C + D):** Hari 10, 16:00 WIB (30 menit)
  - **Gate 3 — Formal UAT, Production Go-Live & 30-Menit Tim Onboarding:** Hari 14, 14:00 WIB (60 menit)

### E. Matriks Pengesahan Resmi (*Gate 1 Sign-Off Matrix*)

| Peran & Nama | Tanggung Jawab Persetujuan | Status Keputusan | Tanggal | Tanda Tangan / Konfirmasi Digital |
| :--- | :--- | :--- | :--- | :--- |
| **Leadership Krevia Digital**<br>*(Project Sponsor / `SUPER_ADMIN`)* | Menyetujui Scope V1 (MoSCoW Freeze), Tech Stack & Hosting, Formula KPI, Kebijakan RBAC, serta jadwal 3 Demo Gate | `[ ] Disetujui`<br>`[ ] Disetujui dgn Catatan` | `____ / ____ / 2026` | ________________________ |
| **Mhd Yoga Andhika**<br>*(Track A — Platform, Backend, Modul A & D)* | Mengonfirmasi kesiapan skema PostgreSQL 16, Auth/RBAC, arsitektur Next.js, kontrak lintas modul, & komitmen EOD 17:30 WIB | `[ ] Siap Eksekusi` | `____ / ____ / 2026` | ________________________ |
| **Nta**<br>*(Track B — UI/UX Shell, Modul C & Modul B)* | Mengonfirmasi kesiapan Design System & Figma Hi-Fi, integrasi Storage/Social-Design/KPI, & komitmen EOD 17:30 WIB | `[ ] Siap Eksekusi` | `____ / ____ / 2026` | ________________________ |

> **Catatan Revisi Minor Gate 1 (bila ada — batas penyesuaian UI maks. 2 jam sebelum Hari 5 Repo Init):**
> 1. ________________________________________________________________________________
> 2. ________________________________________________________________________________

---

*Dokumen ini disusun dan diverifikasi secara menyeluruh sebagai acuan tunggal pra-pengembangan **Krevia Team Management System (KTMS) V1** — Krevia Digital ("Build Smarter. Operate Better.").*
