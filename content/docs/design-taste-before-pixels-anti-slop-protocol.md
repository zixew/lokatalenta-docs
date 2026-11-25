---
slug: design-taste-before-pixels-anti-slop-protocol
title: Design Taste Before Pixels Protocol — Anti-Generic AI Aesthetic Governance
category: architecture
divisionId: architecture
authorAgentId: 4
status: approved
tags: [design-taste, anti-slop, ui-ux, governance, agents-sop, three-dials, industrial-workbench]
---

# Design Taste Before Pixels Protocol — Anti-Generic AI Aesthetic Governance

> **Mandatory Rule for All AI Coding Agents & Designers:**  
> *"You set design taste before pixels. No generic AI aesthetic. Read the room, commit to a direction, then specify the system."*  
> *(via AI UX Playground — https://aiuxplayground.com/prompts/add-taste-to-my-design)*

---

## 1. Context Input Framework
Setiap agen, subagent, atau engineer yang merancang atau merombak antarmuka di seluruh ekosistem LokaTalenta (Web LMS, Sprint Planner, Backlog Hub, Docs Hub, dan 3D Office HUD) **WAJIB** mendefinisikan konteks sebelum menulis kode CSS atau HTML/JSX:

- **What we are designing:** [Landing / portfolio / redesign / product surface / other]
- **Audience:** [Pelajar, Asesor, Mentor, Rekruter, Engineer, Executive]
- **Vibe words:** [minimal, editorial, tactile, Linear-like, industrial-workbench, trust-first, zero-slop]
- **References:** [URLs, products, screenshots — atau "none"]
- **Existing brand assets:** [LokaTalenta Logo, Industrial Stone/Carbon Palette, Plus Jakarta Sans, JetBrains Mono]
- **Hard constraints:** [WCAG 2.1 AA Contrast $\ge 4.5:1$, 100% Zero-Paywall, PWA responsive 375px–2560px, prefers-reduced-motion]
- **Current state:** [Brief fitur, wireframe, atau ringkasan UI eksisting]

---

## 2. The 5-Step Process (Wajib Dijalankan Berurutan)

### Step 1: Design Read (Tepat Satu Kalimat)
Rumuskan pembacaan desain dalam 1 kalimat tegas:
> *"Reading this as: `<page kind>` for `<audience>`, with a `<vibe>` language, leaning toward `<aesthetic family>`."*

- **Aturan Klarifikasi:** Jika brief ambigu di antara dua arah yang valid, ajukan **TEPAT SATU** pertanyaan klarifikasi kepada pengguna lalu berhenti menunggu jawaban. Jika tidak ambigu, **DILARANG** bertanya dan langsung berkomitmen pada arah tersebut.

---

### Step 2: Three Dials (Skala 1–10 dengan Justifikasi Rasional)
Tetapkan parameter numerik dengan justifikasi tertulis:

1. **`DESIGN_VARIANCE` (1 = Simetri Sempurna … 10 = Artsy Chaos):**
   - *LokaTalenta Industrial Default:* **3 – 4** (Struktur teratur, kisi data padat, sedikit variasi penekanan kartu utama).
2. **`MOTION_INTENSITY` (1 = Statis Total … 10 = Sinematik):**
   - *LokaTalenta Industrial Default:* **2 – 3** (Transisi tajam 150ms–200ms `ease-out`, nol animasi melayang goyang).
3. **`VISUAL_DENSITY` (1 = Galeri Bernapas Luas … 10 = Kokpit Pesawat Padat):**
   - *LokaTalenta Industrial Default:* **7 – 8** (Visibilitas data per inci tinggi, kisi tabular, padding kompak).

*(Catatan: Untuk produk bernuansa Trust-First / Pendidikan / Seleksi Publik, tarik `DESIGN_VARIANCE` dan `MOTION_INTENSITY` ke bawah).*

---

### Step 3: Anti-Default Lock (Kunci Larangan Default AI)
Secara eksplisit kunci dan **LARANG** seluruh default bawaan LLM yang merusak cita rasa desain:
- ❌ **Dilarang:** Gradasi biru-ke-ungu, biru-ke-sian, atau ungu-ke-merah muda (*generic blue-purple gradient*).
- ❌ **Dilarang:** *Inter + slate* default tanpa tipografi identitas.
- ❌ **Dilarang:** Pola klise 3 kartu fitur seragam yang di-*copy-paste*.
- ❌ **Dilarang:** *Glassmorphism* dan *backdrop-blur* berlebih di seluruh komponen.
- ❌ **Dilarang:** Latar belakang krem kekuningan (*fake parchment*) yang pura-pura klasik.
- ❌ **Dilarang:** Bentuk kapsul berlebihan (*pill soup* / `rounded-full` pada setiap elemen).
- ❌ **Dilarang:** Tombol melayang kartunis (`hover:-translate-y-0.5`).

---

### Step 4: Taste System (Spesifikasi Sistem Cita Rasa)
Setiap desain harus menghasilkan spesifikasi sistem konkret:

1. **Aesthetic Name (2–5 Kata):**  
   *Contoh:* **"Industrial Precision Workbench"** — karena LokaTalenta adalah instrumen kerja profesional bagi talenta dan rekruter, bukan landing page SaaS mainan.
2. **Signature Element (SATU Gerakan Khas yang Berkesan):**  
   *Contoh:* **Header Strip Instrumen Telemetri Tabular Monospace** dengan status solid titik LED aktif.
3. **Palette Roles (Hex / OKLCH Murni):**
   - Canvas: Light `#F3F3F0` / Dark `#0E1015`
   - Panels: Light `#FFFFFF` / Dark `#151821`
   - Docked / Recessed: Light `#E8E8E3` / Dark `#1B1F2B`
   - Borders: Light `#D4D4CE` / Dark `#282E3D`
   - Solid Functional Status: Emerald `#059669` / `#10B981`, Teal `#0F766E` / `#14B8A6`, Amber `#D97706` / `#F59E0B`.
4. **Type Pairing & Hierarchy:**
   - Heading: `Plus Jakarta Sans`, bold 700, tracking `-0.03em`.
   - Data & Angka: `JetBrains Mono` / `SFMono`, `font-variant-numeric: tabular-nums`.
   - Body: `Inter`, regular 500, line-height 1.45.
5. **Layout Primary Viewport:**  
   Kisi kerja terbagi (*split work surface*) dengan rel navigasi tersegmentasi di sisi kiri/atas dan dek eksekusi padat di tengah.
6. **Motion Intent (Digated oleh `MOTION_INTENSITY`):**  
   Hanya mikro-interaksi klik (skala 0.98 dalam 75ms) dan pembukaan laci geser 180ms yang bergerak. Elemen latar dan kartu konten tetap statis dan kokoh menapak bumi.
7. **Content / Voice Cues:**  
   Bahasa Indonesia lugas, aktif, profesional, tanpa jargon korporat hampa ("Revolusionerkan masa depan Anda").
8. **Non-Goals (Apa yang DITOLAK oleh Desain Ini):**  
   Menolak hiasan tanpa fungsi (*purpose-gate*), menolak paywall, menolak animasi lambat yang membuang waktu pengguna.

---

## 5. First-Build Checklist
Langkah berurutan untuk eksekusi implementasi:
1. Validasi token warna dan tipografi di `index.css`.
2. Bentuk kerangka tata letak solid (Level 1 Top Bar, Level 2 Telemetry Strip, Level 3 Work Surface).
3. Bangun komponen utama dengan garis 1px dan radius terkontrol (`rounded-md` / `rounded-lg`).
4. Format seluruh angka metrik dengan `font-mono-tabular`.
5. Terapkan state fokus keyboard (`focus-visible:ring-2`) dan kontras $\ge 4.5:1$.
6. Pasang pengaman `prefers-reduced-motion` pada seluruh animasi.

---

> **Prinsip Utama:** *"Be opinionated. Taste is a commitment, not a moodboard of five conflicting styles."*
