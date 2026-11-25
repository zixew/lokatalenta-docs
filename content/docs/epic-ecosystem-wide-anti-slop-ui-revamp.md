---
slug: epic-ecosystem-wide-anti-slop-ui-revamp
title: Epic — Ecosystem-Wide Anti-Slop UI/UX Revamp (Industrial Precision Workbench)
category: architecture
divisionId: executive
authorAgentId: 0
status: approved
tags: [epic, revamp, anti-slop, design-system, workbench, motion, a11y]
---

# Epic: Ecosystem-Wide Anti-Slop UI/UX Revamp — Industrial Precision Workbench

## 1. Latar Belakang & Urgensi
Sesi audit anti-slop mengidentifikasi serangkaian generic AI defaults di berbagai aplikasi ekosistem (Sprint Planner, Backlog, Docs Hub, 3D Office), seperti:
- Penggunaan warna warm parchment `#F6F5F1` sebagai default semu "premium".
- Tipografi judul yang memakai utility font `Inter` tanpa karakter brand voice.
- Floating pill tabs tanpa spatial anchor.
- Nested cards 2–3 lapis (*matryoshka*) yang membuat UI terasa sempit.
- Transformasi hover-scale (`hover:scale-105`) dan ketiadaan reset `prefers-reduced-motion`.

Inisiatif ini bukan sekadar perbaikan kosmetik per layar, melainkan **Revamp Besar-Besaran Arsitektur Frontend & Desain Sistem Terpadu** yang mencakup seluruh repositori web LokaTalenta.

---

## 2. Struktur Backlog Epic (`ECO-REVAMP` — Total 63 SP)

### A. Core Epic
- **ID:** `ECO-REVAMP` (21 SP, Epic, P0, Must)
- **Judul:** Ecosystem-Wide Anti-Slop UI/UX Revamp — Industrial Precision Workbench
- **Owner:** Executive (#0 Rizco Renova & #2 Pranadipa Wicaksana)

### B. Stories & Tasks Rinci
1. **`BL-REVAMP-01` (8 SP, Story, P0, Must, Owner: #5 Faza Nugraha)**
   *Unified Design Tokens, Color Palette & Typography Engine*
   - Terapkan canvas neutral `#F3F3F0` (light) / `#0E1015` (dark), border `#D4D4CE`/`#2A2F3C`.
   - Pasang display font `Geist Mono` untuk headings; batasi `Inter` hanya untuk body copy.
   - Audit kontras rasio minimal 4.5:1 untuk teks normal dan 3:1 untuk teks besar.

2. **`BL-REVAMP-02` (8 SP, Story, P1, Must, Owner: #6 Bimo Prasetyo)**
   *Component De-Slop: Flatten Nested Cards & Docked Segmented Rails*
   - Ratakan nested cards menjadi single-level data surfaces di Kanban & List Backlog.
   - Ganti seluruh floating pill tabs dengan docked segmented rails berbatas tegas.
   - Ganti kotak teks loading dengan skeleton shimmer grid 6-sel.

3. **`BL-REVAMP-03` (5 SP, Task, P1, Must, Owner: #20 Nadia Maharani)**
   *Ecosystem Fluid Motion, Spring Physics & Reduced-Motion Guardrail*
   - Token transisi: micro 75–100ms `ease-out`, drawer entrance 200ms `cubic-bezier(0.16, 1, 0.3, 1)`, exit 140ms `ease-in`.
   - Hapus semua `hover:scale-105`, terapkan `active:scale-[0.97]` tactile press.
   - Pasang blok reset global `@media (prefers-reduced-motion: reduce)` di semua bundle.

4. **`BL-REVAMP-04` (8 SP, Story, P1, Must, Owner: #5 Faza Nugraha)**
   *Backlog Hub & Docs Hub Client Production UI Revamp*
   - Sinkronisasi visual styling Backlog Hub (`lokatalenta-backlog`) dan Docs Hub (`lokatalenta-docs`) agar memiliki presisi dan kepadatan data yang setara dengan Sprint Planner.

5. **`OFC-REVAMP-01` (5 SP, Story, P2, Should, Owner: #9 Raka Mahendra)**
   *3D Office HUD & Agent Overlay Anti-Slop Visual Harmonization*
   - Harmonisasi HUD kartu 3D Office, modal agent card, dan telemetry ticker dengan token Industrial Precision Workbench.

6. **`QAE-REVAMP-01` (8 SP, Task, P0, Must, Owner: #8 Qash Al-Ghaffar)**
   *Anti-Slop Compliance Audit & Multi-Viewport Visual QA (375px/768px/1280px+)*
   - Test otomatis & inspeksi visual multi-viewport memastikan 0 horizontal overflow pada 375px mobile, ring fokus 2px solid offset, dan kepatuhan penuh terhadap 11 checklist DESIGN.md.

---

## 3. Strategi Rilis & Eksekusi
- Komponen token dan motion fundamental dieksekusi secara terkoordinasi di repositori Backlog dan Docs Hub.
- Pelacakan progres dikendalikan via Sprint Planner dengan visualisasi `Active Load` vs `Committed Load`.
