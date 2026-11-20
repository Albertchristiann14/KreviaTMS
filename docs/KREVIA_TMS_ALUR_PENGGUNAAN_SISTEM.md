# PANDUAN & ALUR PENGGUNAAN SISTEM LENGKAP (END-TO-END SOP)
## Krevia Team Management System (KTMS) — Master Operational Guide
**Krevia Digital** — *"Build Smarter. Operate Better."*

---

## BAGIAN 1 — Peta Lengkap Menu & Matriks Hak Akses (4 Peran)

KTMS memiliki **4 peran utama (RBAC)** yang mengatur visibilitas menu dan wewenang aksi di seluruh **20+ halaman sistem**:

| Modul | Nama Menu & Rute URL | Fungsi Utama Halaman | Super Admin | Project Manager | Staff / Creator | Visual Designer |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: |
| **Utama** | **Overview Dashboard** (`/`) | Command center eksekutif, ringkasan KPI, antrean kerja, & pengumuman | Penuh | Penuh | Personal | Personal |
| **Modul A (Tasks)** | **My Tasks** (`/tasks/my-tasks`) | Daftar tugas pribadi yang ditugaskan kepada pengguna aktif | Penuh | Penuh | Penuh | Penuh |
| | **Projects** (`/projects`) | Direktori seluruh proyek, progres penyelesaian, & pembuatan proyek |Buat/Edit | Buat/Edit | Lihat | Lihat |
| | **Project Detail** (`/projects/[id]`) | Tab ringkasan proyek, daftar task proyek, & manajemen anggota proyek |Kelola | Kelola | Lihat | Lihat |
| | **Kanban Board** (`/tasks/board`) | Papan kerja visual 6 kolom status dengan fitur *drag-and-drop* | Penuh | Penuh | Eksekusi | Eksekusi |
| | **Work Calendar** (`/tasks/calendar`) | Kalender bulanan tenggat waktu (*due date*) seluruh tugas | Penuh | Penuh | Lihat | Lihat |
| **Modul C (Social & Design)** | **Content Calendar** (`/content/calendar`) | Kalender jadwal tayang konten lintas platform media sosial | Penuh | Penuh | Kelola | Lihat |
| | **Content Ideas** (`/content/ideas`) | Papan pengajuan ide konten baru & persetujuan (*approval*) ide | Approve | Approve | Ajukan | Lihat |
| | **Content Planner** (`/content/planner`) | Perencanaan detail konten (caption, hashtag, jadwal, PIC & designer) | Penuh | Penuh | Kelola | Lihat |
| | **Design Workspace** (`/design/workspace`) | Daftar brief desain visual, pengerjaan, & unggah draf versi (`v1..vN`) | Penuh | Buat Brief | Buat Brief | Kerjakan |
| | **Design Review Queue** (`/design/reviews`) | Antrean pemeriksaan draf desain (*Approve* atau *Request Revision*) | Review | Review | Lihat | Lihat |
| | **Asset Library** (`/assets`) | Katalog arsip aset desain final yang sudah berstatus *Approved* | Penuh | Penuh | Unduh | Unggah/Unduh |
| | **Content Analytics** (`/content/analytics`) | Pencatatan & grafik performa konten tayang (*Views, Likes, Shares, Saves*) | Penuh | Penuh | Input Data | Lihat |
| **Modul B (Team & KPI)** | **Team Directory** (`/team`) | Direktori anggota tim, jabatan, beban task aktif, & rata-rata skor | Penuh | Penuh | Lihat | Lihat |
| | **Individual Performance** (`/team/[id]`) | Rapor metrik performa individu (TCR, OTDR, DQS, CPVS) per periode | Semua | Semua | Diri Sendiri | Diri Sendiri |
| | **KPI Templates & Targets** (`/kpi/templates`) | Katalog master indikator KPI & pengaturan bobot 100% bulanan anggota | Kelola | Atur Bobot | - | - |
| | **Monthly Evaluations** (`/kpi/evaluations`) | Daftar lembar evaluasi bulanan, input skor kualitatif, & pengesahan | Finalize | Review/Nilai | Lihat Miliknya | Lihat Miliknya |
| | **KPI Executive Dashboard** (`/kpi/dashboard`) | Grafik distribusi Grade A–D, tren performa divisi, & top performer | Penuh | Penuh | - | - |
| | **Reports & Export** (`/kpi/reports`) | Filter laporan kinerja bulanan & ekspor ke format **CSV** / **Cetak PDF** | Ekspor | Ekspor | - | - |
| **Modul D (System)** | **Announcements** (`/announcements`) | Siaran pengumuman tim, *pin banner*, & pelacak anggota yang sudah baca | Buat/Kelola | Buat/Kelola | Baca | Baca |
| | **Notifications** (`/notifications`) | Pusat notifikasi tugas baru, komentar, pengajuan review, & revisi | Penuh | Penuh | Penuh | Penuh |
| | **User Management** (`/system/users`) | Pembuatan akun anggota baru, edit jabatan/peran, reset password, nonaktif | Penuh | Lihat | - | - |
| | **Roles & Permissions** (`/system/roles`) | Editor matriks 42 izin akses (*permissions*) untuk 4 peran sistem | Penuh | - | - | - |
| | **Activity Audit Logs** (`/system/activity-logs`) | Rekam jejak perubahan data sistem lengkap dengan *JSON diff* (Lama vs Baru) | Penuh | Terbatas | - | - |

---

## BAGIAN 2 — Alur Login, Keamanan Akun & Manajemen Pengguna

### 2.1 Pendaftaran Anggota Baru & Password Sementara (`/system/users`)
1. **Super Admin** membuka menu **`User Management` (`/system/users`)** lalu klik **`+ Tambah Anggota`**.
2. Isi Nama Lengkap, Nama Panggilan, Email Kerja, pilih **Peran RBAC** (`Super Admin`, `Project Manager`, `Staff / Content Creator`, atau `Designer`), Status Kepegawaian, Jabatan, Divisi, dan Atasan (*Manager*).
3. Sistem secara otomatis membuatkan **Password Sementara (*Temporary Password*)**. Super Admin dapat menyalin password tersebut untuk diberikan kepada anggota baru.

### 2.2 Alur Login Pertama & Wajib Ganti Password (`/login` &rarr; `/change-password`)
1. Anggota baru membuka **`/login`** dan masuk menggunakan Email serta Password Sementara.
2. Sistem mendeteksi status `mustChangePassword = true` dan **secara otomatis menahan serta mengarahkan pengguna ke halaman `/change-password`**.
3. Pengguna wajib memasukkan password baru yang aman (minimal 8 karakter, kombinasi huruf besar, huruf kecil, angka, dan simbol).
4. Setelah disimpan, pengguna langsung diarahkan masuk ke **Overview Dashboard (`/`)**.

### 2.3 Pencabutan Sesi Otomatis & Proteksi Menonaktifkan Akun
- **Perubahan Peran / Nonaktif Akun:** Jika Super Admin mengubah peran seseorang atau menonaktifkan akunnya, sistem menaikkan `tokenVersion` pengguna tersebut sehingga sesi login aktifnya langsung terputus saat itu juga.
- **Peringatan Task Aktif (*Reassignment Warning*):** Jika Super Admin menonaktifkan anggota yang masih memegang task aktif (`To Do`, `In Progress`, `In Review`, `Revision`), sistem memunculkan peringatan berisi daftar kode task aktif agar segera dipindahtangankan (*reassign*) ke anggota lain.

---

## BAGIAN 3 — Alur Lengkap Modul A: Proyek, Tugas, Kanban & Kalender

### 3.1 Siklus Hidup Proyek & Peran Anggota Proyek (`/projects`)
1. **Buat Proyek:** PM/Admin klik **`+ Proyek Baru`**, mengisi Kode Proyek (contoh: `KREVIA-Q4`), Nama Proyek, warna identitas, tanggal mulai & selesai, serta memilih anggota tim.
2. **Peran di Dalam Proyek:**
   - **`Owner`:** Pemilik utama proyek (otomatis pembuat proyek).
   - **`Lead`:** Koordinator lapangan proyek.
   - **`Member`:** Anggota pelaksana yang dapat ditugaskan task di proyek tersebut.
   - **`Viewer`:** Peninjau yang hanya memantau progres proyek.
3. **5 Status Proyek:** `Planning` (Perencanaan) &rarr; `Active` (Berjalan) &rarr; `On Hold` (Ditunda) &rarr; `Completed` (Selesai) &rarr; `Archived` (Diarsipkan).

### 3.2 Matriks Transisi 7 Status Task (`/tasks/board` & `/tasks/my-tasks`)
Setiap kartu tugas di Kanban Board bergerak mengikuti aturan status berikut:

| Status Task | Arti Operasional | Siapa yang Mengubah | Efek Otomatis Sistem |
| :--- | :--- | :--- | :--- |
| **`1. Backlog`** | Ide tugas / antrean cadangan belum siap dikerjakan | PM / Admin / Pembuat | Tersimpan di daftar proyek tanpa membebani antrean harian |
| **`2. To Do`** | Tugas sudah siap dikerjakan oleh Assignee | PM / Admin / Assignee | Mengirim notifikasi penugasan ke Assignee |
| **`3. In Progress`** | Sedang aktif dikerjakan oleh Assignee | Assignee / PM | Mencatat waktu mulai pengerjaan (`startedAt`) |
| **`4. In Review`** | Pekerjaan selesai dan diajukan untuk diperiksa Reviewer | Assignee | **Mengunci `firstSubmittedAt`** (acuan skor tepat waktu OTDR) & kirim notifikasi ke Reviewer |
| **`5. Revision`** | Reviewer meminta perbaikan pada hasil tugas | Reviewer / PM / Admin | Menaikkan penghitung revisi (`revisionCount`) & kirim notifikasi revisi ke Assignee |
| **`6. Done`** | Tugas telah disetujui dan dinyatakan tuntas 100% | Reviewer / PM / Admin *(atau Assignee jika tidak wajib review)* | Mencatat `completedAt` & langsung menaikkan skor penyelesaian tugas (**TCR**) |
| **`7. Cancelled`** | Tugas dibatalkan dan tidak dilanjutkan | PM / Super Admin | Dikeluarkan dari beban perhitungan KPI bulanan |

> **Aturan Proteksi Review (`requiresReview`):** Jika saat pembuatan task opsi *"Wajib Review PM/Admin sebelum Done"* dicentang, maka Staff/Designer **tidak bisa** menggeser kartu langsung ke `Done`—mereka wajib menggesernya ke `In Review` terlebih dahulu untuk diperiksa oleh Reviewer/PM.

---

## BAGIAN 4 — Alur Lengkap Modul C: Pipeline Konten Sosmed & Desain Visual

### 4.1 Siklus 10 Status Konten Media Sosial (`/content/ideas` &rarr; `/content/planner` &rarr; `/content/calendar`)
1. **`IDEA`:** Creator mengajukan ide baru di `/content/ideas`.
2. **`APPROVED_IDEA`:** PM menyetujui ide tersebut untuk diproduksi.
3. **`PLANNING`:** Creator menyusun caption, hashtag, pilar konten, jadwal tayang, dan menunjuk Designer di `/content/planner`.
4. **`IN_DESIGN`:** Sistem otomatis menerbitkan Design Brief dan Designer mulai mengerjakan visualnya.
5. **`DESIGN_REVIEW`:** Designer telah mengunggah draf visual (`v1`) dan menunggu pemeriksaan PM.
6. **`DESIGN_REVISION`:** PM meminta revisi pada visual konten.
7. **`READY_TO_PUBLISH`:** Desain telah di-*Approve* oleh PM; konten siap dijadwalkan tayang.
8. **`SCHEDULED`:** Konten telah dijadwalkan pada tanggal dan jam publikasi di `/content/calendar`.
9. **`PUBLISHED`:** Konten telah resmi tayang di platform media sosial (Instagram/TikTok/YouTube/LinkedIn/X) dan siap dicatat metrik analitiknya di `/content/analytics`.
10. **`ARCHIVED`:** Konten lama yang sudah selesai masa kampanyenya diarsipkan.

### 4.2 Siklus 5 Status Design Brief & Versioning (`/design/workspace` &rarr; `/design/reviews`)
1. **`PENDING_BRIEF`:** Brief desain baru masuk ke antrean Designer.
2. **`IN_PROGRESS`:** Designer klik **`Mulai Kerjakan`** untuk memproduksi aset visual.
3. **`SUBMITTED`:** Designer mengunggah hasil desain atau link Figma/Canva/Drive. Sistem memberi nomor versi otomatis secara berurutan (**`v1`**, **`v2`**, **`v3`**, dst.).
4. **`REVISION_REQUESTED`:** PM memeriksa di `/design/reviews`, memilih *Request Revision*, dan menuliskan daftar poin perbaikan.
5. **`APPROVED`:** PM menyetujui hasil desain final.

### 4.3 Tabel 6 Otomatisasi Lintas Modul (Cross-Module Sync)
Inilah keunggulan utama KTMS—satu aksi di Modul Konten/Desain otomatis menggerakkan Modul Task, Asset, dan KPI:

| No | Aksi Pengguna | Otomatisasi yang Dijalankan Sistem di Belakang Layar |
| :---: | :--- | :--- |
| **1** | PM klik **Promosikan Ide ke Content Plan** | Membuat draf rencana konten baru di *Content Planner* dengan mewarisi proyek, platform, dan pilar dari ide asal. |
| **2** | Creator menyimpan **Content Plan** baru | Otomatis membuat **Task Produksi Konten** (`CONTENT_PRODUCTION`) di Kanban Board untuk Creator terkait. |
| **3** | Content Plan menunjuk seorang **Designer** | Otomatis membuat **Design Brief** di *Design Workspace* sekaligus membuat **Task Desain** (`DESIGN_TASK`) di Kanban Board untuk Designer tersebut. |
| **4** | Designer klik **Submit Desain (`v1..vN`)** | Mengubah status brief ke `SUBMITTED`, mengubah status konten ke `DESIGN_REVIEW`, menggeser task Kanban Designer ke `In Review`, dan mengirim notifikasi ke PM. |
| **5** | PM klik **Request Revision** pada desain | Mengubah status brief ke `REVISION_REQUESTED`, status konten ke `DESIGN_REVISION`, task Kanban Designer ke `Revision`, dan menambah jumlah revisi. |
| **6** | PM klik **Approve Design** | Mengubah brief ke `APPROVED`, mengarsipkan file secara otomatis ke **Asset Library (`/assets`)**, menamatkan task Kanban Designer ke `Done`, mengubah status konten ke `READY_TO_PUBLISH`, dan memperbarui skor **DQS** Designer. |

---

## BAGIAN 5 — Alur Lengkap Modul B: Rumus KPI Otomatis & Siklus Evaluasi

### 5.1 Cara Kerja 4 Rumus Indikator Sistem (Otomatis)
Sistem menghitung pencapaian kuantitatif anggota tim secara objektif berdasarkan rumus baku berikut:

1. **TCR (Task Completion Rate) · Sistem:**
   - **Rumus:** `(Jumlah Task Berstatus DONE ÷ Total Task Aktif Bulan Tersebut) × 100%`
   - Mengukur konsistensi penyelesaian beban kerja yang ditugaskan.
2. **OTDR (On-Time Delivery Rate) · Sistem:**
   - **Rumus:** `(Jumlah Task dengan firstSubmittedAt ≤ Due Date ÷ Total Task yang Dikumpulkan) × 100%`
   - **Keadilan Sistem:** Menggunakan waktu pengumpulan pertama (`firstSubmittedAt`). Jika anggota mengumpulkan tugas tepat waktu sebelum *deadline*, namun PM baru me-review atau meminta revisi keesokan harinya setelah *deadline* lewat, anggota **tetap tercatat tepat waktu (On-Time)**.
3. **DQS (Design Quality & Revision Score) · Sistem:**
   - **Rumus:** `Maksimal(0, 100 − (Rata-Rata Jumlah Revisi per Brief × 15))`
   - Jika desain disetujui dalam sekali kirim (0 revisi) = skor **100**. Rata-rata 1 revisi = **85**, rata-rata 2 revisi = **70**, dst.
4. **CPVS (Content Output Target) · Sistem:**
   - **Rumus:** `Minimal(100%, (Jumlah Konten Tayang / Selesai ÷ Target Kuantitas Bulanan) × 100%)`
   - Mengukur pencapaian target jumlah produksi konten bulanan Creator.

> **Aturan Re-Normalisasi Bobot Otomatis (Kondisi N/A):**
> Apabila pada bulan tertentu seorang anggota tidak memiliki tugas pada salah satu indikator otomatis (sehingga nilainya `N/A`), sistem secara cerdas melakukan **re-normalisasi bobot aktif** agar anggota tersebut tidak dirugikan oleh pembagi kosong.

### 5.2 Siklus 4 Tahap Evaluasi Bulanan & Ambang Grade (`/kpi/evaluations`)
1. **`DRAFT`:** Lembar evaluasi dibuat; angka indikator *Sistem* terisi otomatis, Evaluator mengisi skor indikator *Manual* (0–100) serta catatan kualitatif.
2. **`SUBMITTED`:** Evaluator mengajukan hasil penilaian untuk ditinjau.
3. **`REVIEWED`:** PM / Atasan meninjau dan memvalidasi kesesuaian nilai.
4. **`FINALIZED`:** Super Admin mengesahkan evaluasi. Saat difinalisasi, seluruh angka **dikunci permanen (*Frozen Snapshot*)** sehingga perubahan data di bulan berikutnya tidak akan merusak riwayat rapor bulan lalu.

**Klasifikasi Grade Akhir KPI:**
- **Grade A (90.00 – 100):** *Exceeds Expectations* (Melampaui Ekspektasi)
- **Grade B (80.00 – 89.99):** *Meets Expectations* (Memenuhi Ekspektasi)
- **Grade C (70.00 – 79.99):** *Needs Improvement* (Perlu Peningkatan)
- **Grade D (< 70.00):** *Perlu Pembinaan*

---

## BAGIAN 6 — Checklist Rutinitas Penggunaan Harian Per Peran

Agar penggunaan sistem berjalan disiplin setiap hari di Krevia Digital, berikut panduan rutinitas praktis untuk masing-masing peran:

### 1. Rutinitas Harian Staff / Content Creator
- **Pagi:** Buka **Overview (`/`)** & **My Tasks (`/tasks/my-tasks`)** untuk melihat tugas hari ini dan pengumuman tim.
- **Siang:** Ajukan ide baru di **Content Ideas (`/content/ideas`)**, lengkapi jadwal & caption di **Content Planner (`/content/planner`)**, dan geser kartu tugas yang sedang dikerjakan ke **`In Progress`**.
- **Sore:** Geser tugas yang sudah selesai ke **`In Review`**, perbarui status konten yang sudah tayang ke **`Published`**, dan catat angkanya di **Content Analytics (`/content/analytics`)**.

### 2. Rutinitas Harian Visual Designer
- **Pagi:** Buka **Design Workspace (`/design/workspace`)** dan **My Tasks** untuk memeriksa brief desain baru dan prioritas tenggat waktu.
- **Siang:** Klik **`Mulai Kerjakan`** pada brief, buat aset visual sesuai spesifikasi dimensi dan referensi.
- **Sore:** Klik **`Submit Desain`** (unggah file atau link Figma/Canva). Jika ada notifikasi revisi dari PM, periksa poin catatan revisi dan unggah versi perbaikan (`v2`).

### 3. Rutinitas Harian Project Manager (PM)
- **Pagi:** Pantau **Overview Dashboard (`/`)** untuk melihat indikator kesehatan proyek dan daftar tugas yang berisiko terlambat (*overdue*).
- **Siang:** Bagikan task baru di **Kanban Board (`/tasks/board`)** dan setujui ide konten di **Content Ideas (`/content/ideas`)**.
- **Sore:** Buka **Design Review Queue (`/design/reviews`)** serta kolom **`In Review`** di Kanban untuk memeriksa hasil kerja tim (*Approve* atau *Request Revision*).
- **Akhir Bulan:** Buka **Monthly Evaluations (`/kpi/evaluations`)** untuk mengisi penilaian kualitatif anggota tim.

### 4. Rutinitas Super Admin / Leadership
- **Mingguan:** Pantau ringkasan eksekutif di **Overview (`/`)**, terbitkan arahan strategis di **Announcements (`/announcements`)**, dan tinjau grafik di **KPI Dashboard (`/kpi/dashboard`)**.
- **Akhir Bulan:** Lakukan **Finalisasi Evaluasi KPI (`/kpi/evaluations`)** dan unduh laporan kinerja resmi di **Reports & Export (`/kpi/reports`)**.
- **Sesuai Kebutuhan:** Kelola akun anggota di **`/system/users`**, atur izin peran di **`/system/roles`**, dan audit riwayat perubahan di **`/system/activity-logs`**.
