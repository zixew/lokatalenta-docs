---
slug: sprint-16-techdebt-and-complex-3pov-qa
title: Sprint 16 — Audit Tech Debt Ekosistem, Uji Responsif Kompleks & Rencana QA 3-POV
category: grooming
divisionId: qa
authorAgentId: 8
status: approved
tags: [sprint-16, tech-debt, responsive, qa, 3-pov, security, e2e]
---

# Sprint 16: Audit Tech Debt Ekosistem & Rencana QA Responsif Kompleks (3-POV)

Dokumen ini merangkum hasil audit utang teknis (*tech debt*) lintas-repositori saat ini serta rencana eksekusi utama **Sprint 16** yang berfokus pada **ketahanan responsif (`375px`, `768px`, `1280px+`)**, **skenario uji multi-langkah kompleks**, dan **verifikasi 3 Sudut Pandang Pengguna (3-POV)**.

---

## 1. Audit Isu & Tech Debt Ekosistem Saat Ini

| ID | Area / Repo | Masalah & Risiko Teknis | Dampak | Rencana Mitigasi Sprint 16 |
|---|---|---|---|---|
| `DEBT-16-01` | `lokatalenta-docs` | **Ukuran Chunk Mermaid & ELK Layout:** Bundling `mermaid` dan layout engine `@mermaid-js/layout-elk` berpotensi membengkakkan initial JS chunk di atas budget `< 250 kB`. | Memperlambat First Contentful Paint (FCP) pada jaringan mobile 3G/4G. | Terapkan dynamic `import()` / lazy-loading khusus komponen diagram Mermaid hanya saat blok `mermaid` dirender. |
| `DEBT-16-02` | `lokatalenta-docs`, `lokatalenta-backlog`, `lokatalenta-sprint-planner` | **Persistensi Ephemeral `/tmp/*.db` SQLite di Vercel:** Di environment serverless Vercel, SQLite disimpan di `/tmp/` yang terhapus saat cold-start atau recycle container. | Mutasi data runtime di deployment serverless tidak persisten antar-cold-start. | Pastikan idempotensi `seedIfEmpty` / `seedFromContentDir` berjalan deterministik & siapkan abstraksi adapter DB persisten (Turso/libSQL atau Postgres) untuk fase berikutnya. |
| `DEBT-16-03` | Seluruh Aplikasi Web (`lms-psikotes`, `backlog`, `sprint-planner`, `docs`, `office-3d`) | **Celah Responsivitas Mobile (`375px`):** Tabel lebar, Kanban multi-kolom, Ecosystem Switcher bar, dan panel HUD 3D berisiko mengalami *horizontal overflow* atau tombol terpotong di layar sempit. | Kegagalan usability kandidat/rekruter yang mengakses lewat smartphone. | Audit sistematis pada 3 breakpoint (`375px`, `768px`, `1280px+`) dengan batas nol horizontal scroll dan tap target `>= 44px`. |
| `DEBT-16-04` | Seluruh Ekosistem | **Cakupan E2E 3-POV Belum Merata:** Pengujian unit backend sudah kuat, namun skenario lintas-peran (**Student/Candidate**, **Teacher/Recruiter**, **Admin/Governance**) secara end-to-end belum terotomatisasi penuh. | Regresi alur bisnis atau kebocoran otorisasi antar-peran tidak terdeteksi lebih awal. | Bangun matriks skenario uji kompleks 3-POV dan jalankan sebagai syarat wajib release gate Sprint 16. |

---

## 2. Matriks Uji Responsif Komprehensif (`375px` / `768px` / `1280px+`)

Setiap fitur utama pada seluruh aplikasi wajib lulus inspeksi layout pada 3 viewport standar:

1. **Mobile (`375px × 812px`):**
   - Tidak ada `document.documentElement.scrollWidth > window.innerWidth` (zero horizontal page overflow).
   - Navbar / Ecosystem Switcher terlipat rapi atau horizontal-scroll terkontrol tanpa menutupi konten.
   - Modal, drawer, dan form Acceptance Criteria dapat di-scroll vertikal dengan tombol aksi tetap terjangkau.
2. **Tablet (`768px × 1024px`):**
   - Grid 2-kolom atau sidebar collapsible beradaptasi tanpa teks terpotong (*clipping*).
   - Papan Kanban Backlog dan Sprint Planner dapat digeser lancar dengan indikator kolom yang jelas.
3. **Desktop (`1280px × 800px+`):**
   - Kepadatan informasi optimal sesuai standar **Anti-AI-Slop**, tabel dan grafik Radar 5D/Burndown sejajar sempurna tanpa ruang kosong berlebih.

---

## 3. Skenario Uji Multi-Langkah Kompleks (Edge Cases, Race Conditions, Security & Recovery)

Setiap fitur inti harus melewati 5 kelas pengujian kompleks berikut:

1. **Edge Cases & Boundary Validation:**
   - Input kosong, karakter Unicode/emoji ekstrem, slug tidak valid, serta penolakan siklus DAG 2-node & multi-hop pada `lokatalenta-backlog`.
   - Payload JSON rusak (*malformed JSON*) harus mengembalikan `HTTP 400` berformat JSON, bukan HTML stack trace.
2. **Race Conditions & Concurrency:**
   - Simulasi klaim undangan asesmen bersamaan (`claim_and_start_assessment_invitation`) dan pembaruan kapasitas sprint paralel di `lokatalenta-sprint-planner` agar tidak terjadi over-commit atau duplikasi state.
   - Buffered auto-save (`3000ms` debounce) pada `QuizRunnerPage` saat kandidat mengklik opsi secara cepat berturut-turut.
3. **Security, XSS & CSV Injection:**
   - Injeksi `<script>`, `onerror=`, dan `javascript:` pada judul/deskripsi backlog, dokumen markdown, dan catatan ceremony wajib dinetralkan.
   - Ekspor CSV (`export.csv`) dengan awalan `=`, `+`, `-`, `@`, `\t`, `\r` wajib diawali apostrof (`'`) agar aman dari formula injection.
   - Verifikasi tanda tangan `HMAC-SHA256` pada webhook dan event gateway.
4. **State Recovery & Offline Fallback:**
   - Refresh browser di tengah pengerjaan kuis atau form grooming mempertahankan progres terakhir (`beforeunload` + `navigator.sendBeacon` / local storage fallback).
   - Saat port `4101` (Event Gateway) atau `4102` (Backlog) tidak terjangkau, aplikasi tetap beroperasi *fail-open* dalam `< 1500ms` dengan fallback data yang jelas.
5. **100% Free-Access Verification:**
   - Memastikan tidak ada satu pun rute, modal, atau API call yang meminta pembayaran, Midtrans token, atau memblokir akses fitur dengan paywall.

---

## 4. Rencana Verifikasi 3-User POV (End-to-End)

### POV 1 — Student / Candidate (`#13` Nadia & `#14` Maya)
- **Alur:** Akses langsung 100% gratis tanpa paywall -> buka link/kode asesmen -> kerjakan soal di viewport `375px` -> simulasikan refresh/putus koneksi sementara -> submit & lihat profil Radar 5D / hasil tanpa kebocoran kunci jawaban di network payload.

### POV 2 — Teacher / Recruiter (`#14` Maya & `#15` Kevin)
- **Alur:** Buat & kelola modul/undangan kandidat -> pantau pipeline ATS Kanban pada viewport `768px` dan `1280px` -> ekspor hasil ke CSV (terverifikasi aman dari formula injection) -> pastikan data antar-organisasi terisolasi penuh (zero cross-tenant leakage).

### POV 3 — Admin / Governance (`#0` Rizco, `#2` Pranadipa, `#8` Qaisar, `#17` Rendra)
- **Alur:** Review SOP & rubrik di `lokatalenta-docs` -> grooming item Sprint 16 & validasi DAG di `lokatalenta-backlog` -> alokasikan kapasitas 6 divisi di `lokatalenta-sprint-planner` -> verifikasi event telemetri terenkripsi HMAC dan seluruh test suite (`npm test`) lulus 100%.
