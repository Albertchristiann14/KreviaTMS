# Blueprint 01 — Product Strategy & Software Requirement Specification (SRS)
## Krevia Team Management System (KTMS)

> **Organisasi:** Krevia Digital — *"Build Smarter. Operate Better."*  
> **Versi Dokumen:** 1.0 (Baseline V1 Blueprint)  
> **Status:** Final untuk Review Leadership & Acuan Pengembangan Sprint V1  
> **Tim Pengembang:** Mhd Yoga Andhika & Nta (2 Full-Stack Developers)  
> **Target Timeline V1:** 14 Hari Kalender (Minggu 1: Hari 1–7 Blueprint, Analisis, UI/UX & Desain DB; Minggu 2: Hari 8–14 Sprint Development, Integrasi, UAT & Production Deployment)  
> **Stack Arsitektur Acuan:** Next.js 15+ (App Router, TypeScript, Tailwind CSS, shadcn/ui) · Hybrid Backend (Server Actions + Route Handlers `/api/**`) · PostgreSQL 16 · Prisma ORM · Auth.js v5 (Credentials + RBAC) · Supabase Storage / S3-Compatible Object Storage

---

## Daftar Isi

1. [Ringkasan Eksekutif & Tujuan Bisnis (Executive Summary)](#1-ringkasan-eksekutif--tujuan-bisnis-executive-summary)
   - [1.1 Latar Belakang & Transformasi Operasional (Before vs After)](#11-latar-belakang--transformasi-operasional-before-vs-after)
   - [1.2 Visi Produk, Target Pengguna Internal & Profil Peran](#12-visi-produk-target-pengguna-internal--profil-peran)
   - [1.3 Metrik Keberhasilan Adopsi V1 (Product KPIs)](#13-metrik-keberhasilan-adopsi-v1-product-kpis)
   - [1.4 V1 Scope Guardrails (In-Scope vs Out-of-Scope)](#14-v1-scope-guardrails-in-scope-vs-out-of-scope)
2. [Software Requirement Specification (SRS) — 4 Modul Utama](#2-software-requirement-specification-srs--4-modul-utama)
   - [2.0 Kontrak Domain & Konvensi Sistem](#20-kontrak-domain--konvensi-sistem)
   - [2.1 Modul A — Task Management (`FR-A01` – `FR-A07`)](#21-modul-a--task-management-fr-a01--fr-a07)
   - [2.2 Modul B — Team Management & KPI (`FR-B01` – `FR-B06`)](#22-modul-b--team-management--kpi-fr-b01--fr-b06)
   - [2.3 Modul C — Social Media & Design Management (`FR-C01` – `FR-C07`)](#23-modul-c--social-media--design-management-fr-c01--fr-c07)
   - [2.4 Modul D — System Management (`FR-D01` – `FR-D05`)](#24-modul-d--system-management-fr-d01--fr-d05)
   - [2.5 Spesifikasi Integrasi Lintas Modul (`FR-INT-01` – `FR-INT-04`)](#25-spesifikasi-integrasi-lintas-modul-fr-int-01--fr-int-04)
   - [2.6 Non-Functional Requirements (`NFR-01` – `NFR-15`)](#26-non-functional-requirements-nfr-01--nfr-15)
3. [User Stories & Acceptance Criteria (Given-When-Then)](#3-user-stories--acceptance-criteria-given-when-then)
   - [3.1 User Stories Modul A — Task Management](#31-user-stories-modul-a--task-management)
   - [3.2 User Stories Modul B — Team Management & KPI](#32-user-stories-modul-b--team-management--kpi)
   - [3.3 User Stories Modul C — Social Media & Design Management](#33-user-stories-modul-c--social-media--design-management)
   - [3.4 User Stories Modul D — System Management](#34-user-stories-modul-d--system-management)
4. [Prioritization Matrix (MoSCoW) — V1 (2 Minggu) vs Iterasi Berikutnya (V1.1 / V2)](#4-prioritization-matrix-moscow--v1-2-minggu-vs-iterasi-berikutnya-v11--v2)
   - [4.1 Strategi Prioritas & Kapasitas Sprint 2 Developer](#41-strategi-prioritas--kapasitas-sprint-2-developer)
   - [4.2 Matriks MoSCoW Lengkap](#42-matriks-moscow-lengkap)
   - [4.3 Validasi Kapasitas & Rencana Kontingensi De-Scoping V1](#43-validasi-kapasitas--rencana-kontingensi-de-scoping-v1)

---

## 1. Ringkasan Eksekutif & Tujuan Bisnis (Executive Summary)

### 1.1 Latar Belakang & Transformasi Operasional (Before vs After)

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

### 1.2 Visi Produk, Target Pengguna Internal & Profil Peran

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

### 1.3 Metrik Keberhasilan Adopsi V1 (Product KPIs)

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

### 1.4 V1 Scope Guardrails (In-Scope vs Out-of-Scope)

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

## 2. Software Requirement Specification (SRS) — 4 Modul Utama

### 2.0 Kontrak Domain & Konvensi Sistem

Seluruh spesifikasi fungsional pada dokumen ini mematuhi kontrak arsitektur lintas dokumen (selaras dengan `02-system-flows-use-cases.md` dan `03-database-backend.md`):

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

### 2.1 Modul A — Task Management (`FR-A01` – `FR-A07`)

Modul A berfungsi sebagai tulang punggung eksekusi kerja harian seluruh anggota Krevia Digital. Seluruh pekerjaan — baik tugas operasional umum, produksi konten media sosial, maupun pengerjaan desain — bermuara pada entitas tugas terpadu (*Unified Task Engine*).

#### `FR-A01` — Project Management
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

#### `FR-A02` — My Tasks
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

#### `FR-A03` — Kanban Board
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

#### `FR-A04` — Work Calendar
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

#### `FR-A05` — Task Assignment
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

#### `FR-A06` — Progress Tracking
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

#### `FR-A07` — Deadline Management
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

### 2.2 Modul B — Team Management & KPI (`FR-B01` – `FR-B06`)

Modul B mengubah data operasional harian dari Modul A dan Modul C menjadi visibilitas performa tim yang objektif, transparan, dan terstruktur dalam siklus evaluasi bulanan.

#### `FR-B01` — Team Directory
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

#### `FR-B02` — Individual Performance (Metrik Otomatis & Rumus Baku)
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

#### `FR-B03` — KPI Management
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

#### `FR-B04` — Team Performance Dashboard
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

#### `FR-B05` — Monthly Evaluation
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

#### `FR-B06` — Reports & Analytics
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

### 2.3 Modul C — Social Media & Design Management (`FR-C01` – `FR-C07`)

Modul C dirancang khusus untuk menggantikan spreadsheet konten dan koordinasi revisi desain yang tersebar di chat, sekaligus menghubungkan seluruh pekerjaan kreatif ke papan tugas (Modul A) dan KPI tim kreatif (Modul B).

#### `FR-C01` — Content Calendar (Pengganti Spreadsheet Konten)
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

#### `FR-C02` — Content Ideas Management
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

#### `FR-C03` — Content Planning
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

#### `FR-C04` — Design Workspace
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

#### `FR-C05` — Design Approval & Revision Loop
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

#### `FR-C06` — Asset Library
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

#### `FR-C07` — Content Performance Analytics
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
### 2.4 Modul D — System Management (`FR-D01` – `FR-D05`)

Modul D menjamin keamanan akses, komunikasi operasional satu pintu, dan akuntabilitas penuh seluruh aktivitas di KTMS.

#### `FR-D01` — User Management
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

#### `FR-D02` — Role & Permission (RBAC)
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

#### `FR-D03` — Notification Center (In-App)
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

#### `FR-D04` — Announcements
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

#### `FR-D05` — Activity Logs (Audit Trail)
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

### 2.5 Spesifikasi Integrasi Lintas Modul (`FR-INT-01` – `FR-INT-04`)

Salah satu kekuatan utama KTMS dibanding alat terpisah adalah **sinkronisasi data lintas modul secara otomatis** tanpa input ganda. Aturan berikut bersifat wajib bagi implementasi backend:

| ID | Nama Aturan Integrasi | Pemicu (*Source Event*) | Efek Otomatis (*Target Side-Effect*) | Aturan Pencegahan Konflik |
| :--- | :--- | :--- | :--- | :--- |
| `FR-INT-01` | **Content Plan $\rightarrow$ Unified Task (`CONTENT_PRODUCTION`)** | `content_items` masuk status `PLANNING` dengan `creator_id` & `planned_publish_at` terisi. | Membuat 1 baris di tabel `tasks` dengan `task_type = 'CONTENT_PRODUCTION'`, `content_item_id = content.id`, `assignee_id = creator_id`, `due_date = planned_publish_at - 1 hari` (default), status `TODO`. Ketika `content_items` mencapai `SCHEDULED` atau `PUBLISHED`, linked task otomatis pindah ke `DONE` (`completed_at = NOW()`). | Relasi `1:1` per jenis task (`UNIQUE(content_item_id, task_type)` untuk task aktif) mencegah duplikasi kartu jika content plan diedit ulang. |
| `FR-INT-02` | **Design Brief $\rightarrow$ Unified Task (`DESIGN_TASK`) & Bidirectional Status Sync** | `design_briefs` ditugaskan ke `assigned_designer_id` (status `PENDING_BRIEF`/`IN_PROGRESS`). | Membuat 1 baris di tabel `tasks` dengan `task_type = 'DESIGN_TASK'`, `design_brief_id = brief.id`, `content_item_id = brief.content_item_id`, `assignee_id = assigned_designer_id`, `due_date = design_due_date`, `requires_review = true`. Pemetaan status sinkron 2 arah:<br>• Brief `IN_PROGRESS` $\leftrightarrow$ Task `IN_PROGRESS` & Content `IN_DESIGN`<br>• Submission `SUBMITTED` $\leftrightarrow$ Task `IN_REVIEW` & Content `DESIGN_REVIEW`<br>• Review `REVISION_REQUESTED` $\leftrightarrow$ Task `REVISION` & Content `DESIGN_REVISION` (serta `revision_count + 1`)<br>• Review `APPROVED` $\leftrightarrow$ Task `DONE` & Content `READY_TO_PUBLISH` | Seluruh sinkronisasi dijalankan dalam **satu Prisma Database Transaction (`$transaction`)** agar status Task, Design Brief, dan Content Item tidak pernah tidak konsisten (*no partial state*). |
| `FR-INT-03` | **Design Approval $\rightarrow$ Asset Library Auto-Promotion** | `design_submissions` disetujui (`APPROVED`) pada `FR-C05`. | Otomatis membuat entri di `assets` untuk setiap file/link pada versi submission yang disetujui, mewarisi metadata `project_id`, `content_item_id`, `design_brief_id`, `uploaded_by = designer_id`, dan tag otomatis (platform + format). | Jika desain sempat dibuka kembali lalu di-approve versi lebih baru (`v3`), aset versi sebelumnya ditandai `is_superseded = true` dan aset terbaru menjadi versi aktif utama. |
| `FR-INT-04` | **Unified Tasks & Design Reviews $\rightarrow$ Individual Performance & Monthly KPI** | Task pindah ke `DONE` / `REVISION` atau Design Brief pindah ke `APPROVED` / `REVISION_REQUESTED`. | Tidak membutuhkan entri manual di Modul B: query agregasi `Individual Performance` (`FR-B02`) membaca langsung `tasks` (`GENERAL`, `CONTENT_PRODUCTION`, `DESIGN_TASK`), `design_briefs` (`revision_count`), dan `content_items` (`SCHEDULED`/`PUBLISHED`). Saat `Monthly Evaluation` difinalisasi (`FINALIZED`), seluruh angka di-snapshot ke `evaluation_items`. | Snapshot immutability menjamin pengeditan task lama pasca penutupan bulan **tidak merusak** nilai rapor KPI bulan yang telah `FINALIZED`. |

---

### 2.6 Non-Functional Requirements (`NFR-01` – `NFR-15`)

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
## 3. User Stories & Acceptance Criteria (Given-When-Then)

Bagian ini merinci **24 User Stories utama** yang mencakup seluruh 4 modul dan seluruh 4 peran kanonik (`SUPER_ADMIN`, `PROJECT_MANAGER`, `STAFF_CREATOR`, `DESIGNER`). Setiap kriteria penerimaan (*Acceptance Criteria*) disusun dalam format **Given / When / Then** agar langsung dapat dijadikan skenario pengujian UAT dan *integration testing* oleh tim pengembang.

---

### 3.1 User Stories Modul A — Task Management

#### `US-A01` — Pembuatan Proyek & Pengaturan Anggota Tim
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

#### `US-A02` — Penugasan & Reassignment Task dengan Indikator Beban Kerja
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

#### `US-A03` — Eksekusi Tugas Harian, Checklist & Komentar di My Tasks
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

#### `US-A04` — Pengelolaan Alur Kerja Kanban Board & Kontrol Review/Revisi
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

#### `US-A05` — Pemantauan Jadwal Kerja & Penjadwalan Ulang di Work Calendar
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

#### `US-A06` — Pengingat Tenggat Otomatis & Proteksi Integritas Deadline
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

### 3.2 User Stories Modul B — Team Management & KPI

#### `US-B01` — Pencarian Anggota Tim di Team Directory
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

#### `US-B02` — Pemantauan Individual Performance & Transparansi Rumus Otomatis
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

#### `US-B03` — Pengelolaan Template & Penetapan Bobot KPI Bulanan
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

#### `US-B04` — Analisis Team Performance Dashboard & Deteksi Bottleneck
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

#### `US-B05` — Siklus Evaluasi Bulanan (DRAFT hingga FINALIZED Immutable Snapshot)
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

#### `US-B06` — Ekspor Rapor KPI Bulanan (PDF) & Rekap Tim (CSV/XLSX)
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

### 3.3 User Stories Modul C — Social Media & Design Management

#### `US-C01` — Pengelolaan Jadwal Konten Terpadu di Content Calendar
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

#### `US-C02` — Pengajuan & Persetujuan Bank Ide Konten
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

#### `US-C03` — Content Planning & Pembuatan Tugas Produksi Otomatis
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

#### `US-C04` — Pembuatan Design Brief & Auto-Spawn Tugas Desain
* **Peran:** `STAFF_CREATOR` | **Modul:** C | **FR Terkait:** `FR-C04`, `FR-INT-02` | **Prioritas:** Must-Have (V1)
* **Cerita:** Sebagai `STAFF_CREATOR`, saya ingin mengirim Design Brief terstruktur (dimensi, jumlah slide, teks visual, moodboard) dari Content Plan langsung ke Designer, agar Designer tidak perlu mencari brief di chat dan tugas desain otomatis masuk papan kerjanya.
* **Acceptance Criteria:**
  1. **Skenario Sukses — Brief Terstruktur & Auto-Spawn `DESIGN_TASK`:**
     - **Given** `STAFF_CREATOR` membuka `content_items` berstatus `PLANNING` dan mengklik **Buat Design Brief**,
     - **When** pengguna mengisi `assigned_designer_id`, `design_due_date`, `format_dimensions = "1080x1350 px (4:5)"`, `slide_count = 6`, `copy_on_design`, dan menekan **Kirim Brief**,
     - **Then** `design_briefs` tersimpan, status `content_items` berubah ke `IN_DESIGN`, tepat 1 task bertipe `DESIGN_TASK` otomatis tercipta untuk `assigned_designer_id` (dengan `requires_review = true`), dan Designer menerima notifikasi `DESIGN_BRIEF_ASSIGNED`.

#### `US-C05` — Pengiriman Karya Desain (Upload / Link) & Versioning di Design Workspace
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

#### `US-C06` — Design Approval, Revision Loop & Auto-Promote ke Asset Library
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

#### `US-C07` — Pencatatan Content Performance Analytics & Pemanfaatan Asset Library
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

### 3.4 User Stories Modul D — System Management

#### `US-D01` — Manajemen Akun Internal & Deaktivasi Non-Destruktif
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

#### `US-D02` — Penegakan Role-Based Access Control (RBAC) Server-Side
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

#### `US-D03` — Pengelolaan Notifikasi In-App & Navigasi Deep-Link
* **Peran:** `DESIGNER` | **Modul:** D | **FR Terkait:** `FR-D03` | **Prioritas:** Must-Have (V1)
* **Cerita:** Sebagai `DESIGNER`, saya ingin menerima pemberitahuan terpusat saat ada brief baru, komentar revisi, atau pengingat tenggat dan langsung menuju halaman terkait dalam satu klik, agar saya responsif terhadap pembaruan kerja.
* **Acceptance Criteria:**
  1. **Skenario Sukses — Badge Unread, Deep-Link & Mark All Read:**
     - **Given** `DESIGNER` memiliki 3 notifikasi belum dibaca (termasuk 1 `DESIGN_REVISION_REQUESTED`),
     - **When** pengguna membuka ikon lonceng topbar (badge menampilkan angka `3`) dan mengklik notifikasi revisi desain tersebut,
     - **Then** notifikasi tersebut berubah menjadi `is_read = true`, badge berkurang menjadi `2`, dan aplikasi langsung menavigasi ke halaman `Design Workspace` brief bersangkutan; saat menekan **Tandai Semua Dibaca**, seluruh sisa notifikasi berubah menjadi `is_read = true` dan badge hilang.

#### `US-D04` — Publikasi Pengumuman Pinned & Pelacakan Read Receipt
* **Peran:** `SUPER_ADMIN` | **Modul:** D | **FR Terkait:** `FR-D04`, `FR-D03` | **Prioritas:** Must-Have (V1)
* **Cerita:** Sebagai `SUPER_ADMIN`, saya ingin mempublikasikan pengumuman internal yang disematkan di atas dashboard seluruh tim serta memantau siapa yang sudah dan belum membacanya, agar kebijakan penting tersampaikan merata.
* **Acceptance Criteria:**
  1. **Skenario Sukses — Broadcast Pinned Announcement & Read Receipt:**
     - **Given** `SUPER_ADMIN` membuat pengumuman baru dengan `priority = IMPORTANT`, `target_roles = ALL`, `is_pinned = true`, dan `expires_at` 7 hari ke depan,
     - **When** pengumuman dipublikasikan dan 5 anggota tim membukanya serta mengklik **Tandai Sudah Dibaca**,
     - **Then** seluruh anggota aktif menerima notifikasi `ANNOUNCEMENT_PUBLISHED`, banner muncul di atas dashboard, dan `SUPER_ADMIN` melihat statistik keterbacaan real-time (*"Dibaca oleh 5 dari N anggota"*) beserta daftar nama yang belum membaca.

#### `US-D05` — Audit Perubahan Sistem melalui Immutable Activity Logs
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
## 4. Prioritization Matrix (MoSCoW) — V1 (2 Minggu) vs Iterasi Berikutnya (V1.1 / V2)

### 4.1 Strategi Prioritas & Kapasitas Sprint 2 Developer

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

### 4.2 Matriks MoSCoW Lengkap

#### A. Must-Have — Rilis V1 (Minggu 1–2, Target Go-Live Hari ke-14)

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

#### B. Should-Have — Rilis V1.1 (Minggu 3–4, Fast-Follow Iteration)

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

#### C. Could-Have — Rilis V2 (Kuartal Berikutnya / Skalabilitas Lanjutan)

| ID | Modul | Fitur / Kapabilitas V2 | Kategori MoSCoW | Target Rilis | Kompleksitas & Estimasi | Dependensi | Justifikasi Bisnis & Operasional |
| :--- | :---: | :--- | :---: | :---: | :---: | :--- | :--- |
| `MOS-27` | C | **Integrasi API Media Sosial (Read Insights & Auto-Scheduling)** — Koneksi resmi Meta Graph API / TikTok API / LinkedIn API untuk tarik metrik otomatis dan publikasi terjadwal. | **Could-Have** | V2 | L (`4,00+` dev-days) | `MOS-09`, `MOS-13` | Memerlukan proses App Review dan kepatuhan token OAuth pihak ketiga yang memakan waktu 3–6 minggu. |
| `MOS-28` | C | **Visual Pin-Point Annotation pada Design Review** — Memberikan komentar langsung pada koordinat piksel tertentu di gambar pratinjau desain. | **Could-Have** | V2 | L (`2,50` dev-days) | `MOS-11` | Nilai tambah ergonomis bagi tim kreatif; di V1 catatan revisi terstruktur + link Figma sudah memadai. |
| `MOS-29` | A | **Gantt / Timeline Dependency View & Kanban WIP Limits** — Visualisasi ketergantungan antar task (*Finish-to-Start*) dan batas maksimal kartu per kolom Kanban. | **Could-Have** | V2 | L (`2,00` dev-days) | `MOS-05`, `MOS-06` | Relevan saat kompleksitas proyek lintas divisi bertumbuh di atas 25+ anggota tim. |
| `MOS-30` | D | **Custom Dynamic Roles & SSO (Google Workspace OAuth)** — Editor pembuatan peran kustom baru lewat UI serta login 1-klik menggunakan akun email Google Workspace `@krevia`. | **Could-Have** | V2 | M (`1,50` dev-days) | `MOS-01` | Memudahkan onboarding saat struktur organisasi Krevia berkembang di luar 4 peran kanonik. |
| `MOS-31` | B | **OKR & Quarterly Performance Appraisal Roll-Up** — Agregasi otomatis evaluasi bulanan menjadi tinjauan kuartalan/tahunan dan pelacakan tujuan strategis perusahaan (OKR). | **Could-Have** | V2 | L (`2,00` dev-days) | `MOS-17` | Ekspansi alami setelah histori evaluasi bulanan V1 terkumpul minimal 3 bulan. |
| `MOS-32` | D | **Webhook / Slack & WhatsApp Notification Bridge** — Penerusan notifikasi event tertentu ke channel Slack atau grup operasional Krevia. | **Could-Have** | V2 | M (`1,00` dev-day) | `MOS-19` | Opsional setelah adopsi Notification Center in-app stabil agar tidak memicu kelelahan notifikasi (*notification fatigue*). |

---

#### D. Won't-Have — Ditolak secara Tegas untuk V1 (Strict Out-of-Scope Guardrails)

| ID | Domain | Fitur yang Ditolak untuk V1 | Kategori MoSCoW | Alasan Penolakan Strategis |
| :--- | :---: | :--- | :---: | :--- |
| `MOS-33` | Platform | **Native Mobile Apps (iOS & Android)** | **Won't-Have** | Tidak sesuai rasio biaya-manfaat untuk timeline 14 hari; aplikasi web responsif sudah memenuhi kebutuhan pemantauan di perangkat genggam. |
| `MOS-34` | Eksternal | **External Client Portal & Multi-Tenant Client Login** | **Won't-Have** | KTMS V1 berfokus 100% pada efisiensi operasional internal Krevia Digital; membuka akses eksternal menuntut arsitektur isolasi tenant dan SLA terpisah. |
| `MOS-35` | HRIS | **Full HRIS (Payroll, Slip Gaji, Absensi Geofencing/Biometrik, Cuti, Rekrutmen/ATS)** | **Won't-Have** | Berada di luar ruang lingkup manajemen tugas & KPI; membawa risiko kepatuhan hukum ketenagakerjaan/pajak serta pembengkakan skema data. |
| `MOS-36` | Komunikasi | **Internal Real-Time Chat Messenger & Video Conferencing** | **Won't-Have** | Duplikasi dengan perangkat komunikasi harian yang sudah mapan; diskusi kontekstual cukup dilakukan pada kolom komentar task/brief dan pengumuman. |
| `MOS-37` | Finansial | **ERP Keuangan, Invoicing, RAB/Budgeting & Akuntansi** | **Won't-Have** | Domain terpisah dari produktivitas tim kreatif dan manajemen proyek internal V1. |

---

### 4.3 Validasi Kapasitas & Rencana Kontingensi De-Scoping V1

#### Ringkasan Alokasi Kapasitas Sprint Minggu 2 (Hari 8–14)

| Kelompok Pekerjaan | Jumlah Item | Estimasi (*Dev-Days*) | Pembagian Utama (2 Developers) |
| :--- | :---: | :---: | :--- |
| **Modul D — System Core (Auth, RBAC, Users, Notif, Announcements, Audit)** | 2 blok (`MOS-01`, `MOS-19`) | `2,00` | Developer A (Backend/Infra & Auth) + Developer B (UI Shell) |
| **Modul A — Task Management (Projects, Tasks, My Tasks, Kanban, Calendar, Deadlines)** | 5 blok (`MOS-02`–`MOS-06`) | `2,75` | Paralel (Backend Services & Interactive UI Kanban/Calendar) |
| **Modul C — Social Media & Design (Ideas, Planning, Calendar, Design, Approval, Assets, Analytics)** | 7 blok (`MOS-07`–`MOS-13`) | `4,00` | Paralel (Storage/Workflow Transactions & Creative Workspace UI) |
| **Modul B — Team & KPI (Directory, Auto-KPI Engine, Templates, Dashboard, Evaluation, Reports)** | 5 blok (`MOS-14`–`MOS-18`) | `2,75` | Paralel (KPI Aggregation SQL/Prisma & Evaluation/Chart UI) |
| **Subtotal Implementasi Fitur Must-Have V1** | **19 blok (25 Sub-Fitur)** | **`11,50` dev-days** | **Hari 8 s/d Hari 12 (siang)** |
| **Integrasi Lintas Modul, Pengujian RBAC, UAT Leadership, Uji Backup & Deploy Produksi** | **QA & Release** | **`2,50` dev-days** | **Hari 12 (sore) s/d Hari 14** |
| **TOTAL KAPASITAS MINGGU 2 (2 Developers $\times$ 7 Hari)** | — | **`14,00` dev-days** | **100% Terkalibrasi & Realistis** |

#### Rencana Kontingensi (*Emergency De-Scoping Order* jika Terjadi Hambatan di Hari ke-11/12)

Apabila terjadi hambatan teknis tak terduga selama Sprint Minggu 2, tim pengembang dapat menunda maksimal 3 komponen berikut ke **Minggu 3 (V1.1)** secara berurutan **tanpa memutus alur operasional inti V1**:
1. **Opsi 1 (`MOS-13`):** Input metrik `Content Performance Analytics` ditunda 3 hari ke V1.1 (kalender, planning, desain, approval, dan asset library tetap 100% berjalan).
2. **Opsi 2 (`MOS-18` Print-PDF):** Ekspor `Reports & Analytics` V1 dirilis cukup dengan **CSV Export** terlebih dahulu; layout rapor Print-PDF menyusul di awal V1.1.
3. **Opsi 3 (`MOS-06` Week View):** `Work Calendar` dirilis dengan tampilan **Month View + Agenda List** terlebih dahulu; tampilan Week View menyusul di V1.1.

> **Komitmen Tidak Boleh Ditawar (*Non-Negotiable Core V1*):** Autentikasi & RBAC (`MOS-01`), Unified Task Engine + Kanban (`MOS-03`, `MOS-05`), Content Calendar + Design Approval Loop (`MOS-09`, `MOS-10`, `MOS-11`), Mesin Kalkulasi KPI Otomatis + Monthly Evaluation Finalize (`MOS-14`, `MOS-17`), dan Immutable Activity Logs (`MOS-19`) **wajib hadir lengkap** pada rilis Hari ke-14.
