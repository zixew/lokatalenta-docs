---
slug: sop-absolut-development-dan-divisi
title: SOP Absolut Development, Tata Kelola 6 Divisi & Protokol Auto-Swarm
category: charter
divisionId: executive
authorAgentId: 0
status: approved
tags: [sop, governance, auto-swarm, anti-ai-slop, free-access, qa-security]
---

# SOP Absolut Development & Tata Kelola 6 Divisi LokaTalenta

Dokumen ini merupakan **Standar Operasional Prosedur (SOP) Absolut** yang mengikat seluruh 6 divisi dan 24 agen (`#0` s/d `#23`) di seluruh ekosistem LokaTalenta (`lms-psikotes`, `lokatalenta-office-3d`, `lokatalenta-backlog`, `lokatalenta-sprint-planner`, `lokatalenta-docs`, dan `lokatalenta-event-gateway`).

---

## 1. Aturan Absolut 6 Divisi (Canonical Matrix)

| Divisi | Agen | Mandat Absolut | Larangan Keras |
|---|---|---|---|
| `executive` | `#0` Rizco, `#1` Bram, `#2` Pranadipa | Menetapkan prioritas backlog, menjaga kebijakan **Free-Access-First**, dan memberikan final release sign-off. | Dilarang meloloskan fitur berbayar, paywall, atau perubahan scope tanpa Acceptance Criteria (Given-When-Then). |
| `architecture` | `#3` Satria, `#4` Arkananta, `#21` Bintang | Menjaga kontrak kanonik 13-key event schema, skema SQLite/PostgreSQL, dan batas isolasi multi-tenant. | Dilarang membuat skema paralel yang menyimpang dari `canonical.ts` / `event-schema.json`. |
| `engineering` | `#5` Farel, `#6` Bagas, `#18` Hendra, `#19` Dimas, `#20` Bagus | Implementasi kode bersih, TypeScript strict, UI Anti-AI-Slop, dan optimasi bundle `< 250 kB`. | Dilarang meninggalkan `console.log` debug, `any` implisit, atau duplikasi logika lintas modul. |
| `qa` | `#7` Qonita, `#8` Qaisar, `#9` Pandu, `#10` Nabila | Menjalankan uji regresi otomatis, uji responsif (`375px`, `768px`, `1280px+`), dan verifikasi 3-POV pengguna. | Dilarang memberi status PASS jika ada test skipped, assertion dilonggarkan, atau edge case belum diuji. |
| `devops` | `#11` Arya, `#12` Raka, `#16` Tegar, `#17` Rendra, `#22` Surya | Keamanan siber (XSS/CSV/HMAC), port hygiene, CI/CD, dan ketahanan serverless/ephemeral storage. | Dilarang mengikat layanan ke port terlarang (`5000, 7000, 8089, 8091, 11301, 54321, 56211`) atau membocorkan PII di telemetri. |
| `lounge` | `#13` Nadia, `#14` Maya, `#15` Kevin, `#23` Tari | Validasi UX end-to-end dari perspektif Kandidat/Siswa, Rekruter/Pendidik, dan Admin/Governance. | Dilarang menyetujui alur pengguna yang membingungkan, lambat, atau terpotong di layar mobile. |

---

## 2. Protokol Efisiensi Auto-Swarm

1. **Dekomposisi Pod Terisolasi:** Pekerjaan multi-repo dibagi menjadi pod dengan kepemilikan direktori yang tegas. Satu pod tidak boleh memodifikasi file yang menjadi wilayah eksklusif pod lain (contoh: Pod Governance tidak menyentuh `client/` UI pada `lokatalenta-docs`, `lokatalenta-backlog`, dan `lokatalenta-sprint-planner`).
2. **Contract-First Handshake:** Setiap perubahan API atau event payload wajib memperbarui kontrak kanonik dan unit test validasinya sebelum diintegrasikan ke service konsumen.
3. **Telemetry Fail-Open:** Layanan yang memancarkan event ke `lokatalenta-event-gateway` (`http://localhost:4101`) wajib menggunakan timeout maksimal `1500ms` dan mekanisme *fail-open* agar gangguan gateway tidak pernah memblokir transaksi utama.
4. **Zero-Polling & Deterministic Verification:** Subagent melaporkan hasil secara asinkron setelah seluruh perintah verifikasi (`npm test`, `typecheck`, `lint`) selesai dijalankan pasca-edit terakhir.

---

## 3. SOP Git: 1-Feature = 1-General-Commit Squash

1. **Satu Fitur / Tiket = Satu Commit Bersih:** Sebelum digabung ke branch utama (`main` / `dev`), seluruh commit WIP, fix kecil, dan iterasi lokal **wajib di-squash** menjadi **1 general commit** yang atomik dan mudah di-revert.
2. **Format Pesan Commit:**
   - `<type>(<scope>): <ringkasan singkat imperatif>` (contoh: `feat(qa): add sprint 16 complex 3-pov responsive backlog & governance docs`).
   - Jenis yang diizinkan: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `sec`.
3. **Larangan Commit Sampah:** Dilarang menyertakan file `.DS_Store`, artifact sementara, `dist/`, atau kredensial/env lokal.

---

## 4. Standar UI Anti-AI-Slop

1. **Kejelasan & Kepadatan Informasi Fungsional:** Setiap elemen UI harus memiliki tujuan operasional yang jelas (status, metrik, aksi, navigasi). Hindari kartu kosong, teks filler generik, atau animasi dekoratif yang memperlambat interaksi.
2. **Dilarang Gradien Ungu Generik & Estetika Template:** Gunakan palet warna terstruktur dengan kontras tinggi (minimal rasio WCAG AA `4.5:1` untuk teks normal).
3. **Mobile-First & Responsive Integrity:** Seluruh halaman dan komponen wajib bebas *horizontal overflow*, bebas tombol terpotong, dan memiliki target sentuh minimal `44x44px` pada viewport `375px` (mobile), `768px` (tablet), dan `1280px+` (desktop).

---

## 5. Kebijakan Free-Access-First (Zero Paywall)

1. **100% Gratis Selamanya untuk Pengguna Akhir & Komunitas:** Seluruh fitur asesmen psikometri, tryout, Radar 5D, Kraepelin, portal rekruter, dan manajemen sprint/backlog bersifat **100% gratis tanpa paywall**.
2. **Nol Payment Gateway:** Dilarang keras menambahkan integrasi atau backlog terkait **Midtrans, Xendit, Stripe, checkout berbayar, subscription tier berbayar, atau paywall gate** (`BIZ-01` / `FIN-01` resmi dihapus dan digantikan oleh `FREE-01: Akses Gratis 100% Tanpa Paywall & Adopsi Komunitas`).
3. **Tata Kelola Fair-Use:** Pembatasan kuota hanya berfungsi untuk menjaga stabilitas infrastruktur (*rate limiting* & isolasi multi-tenant), bukan untuk membatasi akses berdasarkan pembayaran.

---

## 6. Gerbang Rilis QA & Security (Release Gates)

Setiap rilis wajib lulus **4 Gerbang Mutlak** sebelum dinyatakan siap produksi:

1. **Gate 1 — Build & Static Analysis:** `tsc --noEmit` (zero type errors), `oxlint` (zero warnings/errors), dan budget bundle klien `< 250 kB` (atau chunking terisolasi untuk library diagram/3D).
2. **Gate 2 — Automated Test Suite:** `npm test` (`vitest run`) lulus **100%** di setiap repo yang terdampak tanpa test yang di-skip atau assertion yang dilonggarkan.
3. **Gate 3 — Security Hardening (`#17` Rendra):**
   - Neutralisasi XSS pada seluruh input teks & markdown rendering.
   - Neutralisasi formula CSV injection (`=`, `+`, `-`, `@`, `\t`, `\r`) dengan leading apostrophe.
   - Verifikasi HMAC-SHA256 pada komunikasi antar-layanan dan isolasi RLS multi-tenant.
4. **Gate 4 — 3-POV & Responsive Sign-Off (`#0` Rizco, `#8` Qaisar, `#2` Pranadipa):** Teruji penuh pada `375px`, `768px`, `1280px+` untuk ketiga sudut pandang pengguna (**Student/Candidate**, **Teacher/Recruiter**, dan **Admin/Governance**).
