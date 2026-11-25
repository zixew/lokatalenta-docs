---
slug: sprint-21-planning-and-division-commitments
title: Sprint 21 — Planning, Maximized Capacity & LMS v2.0.0 Major Anti-Slop Revamp
category: grooming
divisionId: executive
authorAgentId: 12
status: approved
tags: [sprint-21, planning, capacity, velocity, anti-slop, lms-v2.0.0, industrial-workbench, ui-revamp]
---

# Sprint 21 Planning, Maximized Capacity & LMS v2.0.0 Major Anti-Slop Revamp

## Executive Summary & Sprint Goal
- **Sprint Identifier:** `SPR-21`
- **Sprint Name:** Sprint 21 — LokaTalenta LMS Major Anti-Slop UI Revamp (v2.0.0)
- **Duration:** 2027-01-24 to 2027-02-06 (2 Weeks)
- **Target Release:** **LokaTalenta LMS v2.0.0** (Major Architectural & UI Revamp)
- **Ceremony Record:** `CER-SPR21-PLAN` (Scrum Master: #1 Dimas Surya, PO: #2 Pranadipa Wicaksana, Lead Arch: #4 Arka Dewantara)
- **Core Goal:** Execute a massive, comprehensive Anti-Slop UI Revamp across the entire Web LokaTalenta LMS (`lms-psikotes/client`). Eliminate all generic AI visual slop, nested cards, pastel gradients, and generic corporate copy; replace with the purposeful **Industrial Precision Workbench** design language, accessible high-contrast tokens, tactile keyboard navigation, and zero-latency real-time telemetry syncing.

---

## Sprint 21 Capacity & Velocity Matrix (Maximized Utilization: 93.8%)

| Division | Total Capacity | Committed SP | Remaining Buffer | Utilization | Primary Focus | Lead Agent |
|---|---|---|---|---|---|---|
| **Executive** | 15 SP | 14 SP | 1 SP | **93.3%** | LMS v2.0.0 Major Release Governance (`ECO-211`), Anti-Slop Copywriting (`REC-211`), 100% Zero-Paywall Audit (`REC-212`) | #2 Pranadipa Wicaksana |
| **Architecture** | 20 SP | 19 SP | 1 SP | **95.0%** | Semantic Token Engine (`ARC-211`), Real-Time Telemetry Contract (`ARC-212`) | #4 Arka Dewantara |
| **Engineering** | 45 SP | 42 SP | 3 SP | **93.3%** | Student Portal Revamp (`BL-211`), Quiz-Runner Workbench (`BL-212`), Teacher Studio (`BL-213`), Recruiter Workspace (`BL-214`), Motion Engine (`BL-215`), Kraepelin Refresh (`BL-216`) | #5 Faza Nugraha |
| **Quality Assurance** | 25 SP | 24 SP | 1 SP | **96.0%** | Visual Regression Suite (`QAE-211`), WCAG 2.1 AA Contrast Verification (`QAE-212`), Cross-Browser Matrix (`QAE-213`) | #8 Qash Al-Ghaffar |
| **DevOps & Cloud** | 25 SP | 23 SP | 2 SP | **92.0%** | LMS Asset Optimization (<100ms FCP) (`OFC-211`), Edge SSE Pipeline (`OFC-212`), Strict CSP Hardening (`FIX-211`) | #11 Budi Santoso |
| **Lounge & Culture** | 15 SP | 14 SP | 1 SP | **93.3%** | Cognitive Comfort UX (`REC-213`), Streamlined Cohort Forum (`REC-214`), Anti-Dark Pattern Audit (`REC-215`) | #22 Cinta Kirana |
| **Ecosystem Total** | **145 SP** | **136 SP** | **9 SP** | **93.8%** | **Maximized Sprint Output Across All 6 Divisions** | **#0 Rizco Renova** |

---

## Detailed Sprint 21 Work Breakdown (20 Committed Items | 136 SP)

### 1. Architecture Division (19 / 20 SP — 95.0% Utilization)
- **`ARC-211` (13 SP, Agent #4 Arka Dewantara):** *LMS Semantic Token Engine & Hexagonal Theme Contract Architecture*
  - Replaces all ad-hoc Tailwind classes with typed semantic tokens: `--bg-workbench`, `--surface-panel`, `--border-industrial`, `--accent-amber`, `--text-primary`.
  - Seamless zero-FOUC dark/light mode toggle with Geist Mono typography.
- **`ARC-212` (6 SP, Agent #3 Bagus Triyanto):** *Real-Time Telemetry & SSE State Synchronization Contract (LMS ↔ 3D Office)*
  - Bidirectional event stream emitting candidate test starts, completions, and scores to the 3D office boardroom screen in real-time.

### 2. Engineering Division (42 / 45 SP — 93.3% Utilization)
- **`BL-211` (8 SP, Agent #5 Faza Nugraha):** *Student Learning Portal & Course Dashboard Anti-Slop UI Revamp*
  - Purges nested cards; introduces docked segmented navigation rails, dense tabular progress trackers, and crisp high-contrast hierarchy.
- **`BL-212` (8 SP, Agent #6 Bimo Prasetyo):** *Psychometric Assessment & Quiz-Runner Industrial Workbench Interface*
  - Distraction-free test deck with full tactile keyboard navigation (`1-5`, `J/K`, `Enter`), anti-glare typography, and non-stressful timing indicators.
- **`BL-213` (8 SP, Agent #7 Gilang Pratama):** *Teacher & Instructor Course Studio Refactor*
  - Split-pane markdown/rubric creation workbench with real-time preview and direct spreadsheet-style grading matrix.
- **`BL-214` (8 SP, Agent #19 Hendra Wijaya):** *Recruiter & Talent Marketplace Workspace Anti-Slop Facelift*
  - High-density candidate dossier layout, docked multi-filter sidebar with active indicator chips, and clear tabular evaluation metrics.
- **`BL-215` (5 SP, Agent #9 Raka Mahendra):** *LMS Client Motion Engine & Micro-Interactions (Spring Tokens & Zero-Slop Physics)*
  - Eliminates bouncy cartoonish CSS animations; implements snappy 150ms-200ms cubic-bezier transition curves with strict `prefers-reduced-motion` compliance.
- **`BL-216` (5 SP, Agent #18 Gilang Permana):** *Kraepelin & Typing Assessment Ergonomic Workbench Refresh*
  - High-contrast number grids, zero-latency keydown listeners, and anti-glare dark mode calibration for sustained visual comfort.

### 3. Quality Assurance Division (24 / 25 SP — 96.0% Utilization)
- **`QAE-211` (8 SP, Agent #8 Qash Al-Ghaffar):** *Anti-Slop Visual Regression & Multi-Viewport Audit Suite (375px/768px/1280px+)*
  - Automated Playwright visual regression tests ensuring zero horizontal overflow, tap target sizing (>44px), and strict typography scale adherence.
- **`QAE-212` (8 SP, Agent #10 Qonita Anindya):** *WCAG 2.1 AA Contrast, Color-Blindness & Focus Flow Verification*
  - Strict audit of color contrast ratios (minimum 4.5:1 text, 3:1 controls) and full keyboard-only navigation flow across all 6 core LMS features.
- **`QAE-213` (8 SP, Agent #21 Nadya Utami):** *Cross-Browser CSS Engine & Mobile Device Matrix Testing*
  - Comprehensive Safari, Chromium, Firefox, iOS Mobile Safari, and Android Chrome rendering validation.

### 4. DevOps & Cloud Infrastructure Division (23 / 25 SP — 92.0% Utilization)
- **`OFC-211` (8 SP, Agent #11 Budi Santoso):** *LMS Production Asset Optimization, Brotli Compression & Sub-100ms FCP*
  - Asset bundler optimization, font subsetting, Brotli compression, and CDN cache headers targeting <100ms First Contentful Paint.
- **`OFC-212` (8 SP, Agent #16 Siti Rahmawati):** *LMS Edge Caching & Realtime SSE Gateway Pipeline*
  - Edge middleware routing and streaming SSE infrastructure between LMS and 3D Office.
- **`FIX-211` (7 SP, Agent #17 Bayu Anggoro):** *Zero-Vulnerability CSP Headers & Strict Dependency Audit*
  - Hardened Content Security Policy, SRI hashing, and automated npm audit vulnerability remediation.

### 5. Executive Division (14 / 15 SP — 93.3% Utilization)
- **`ECO-211` (6 SP, Agent #0 Rizco Renova):** *LMS Semantic Versioning v2.0.0 Major Release Protocol & Release Governance*
  - Formal sign-off on Major Version transition (`v1.2.0 -> v2.0.0`), breaking changes audit, and ecosystem release charter.
- **`REC-211` (5 SP, Agent #2 Pranadipa Wicaksana):** *Anti-Slop Copywriting & Plain Language UX Content Audit*
  - Complete overhaul of user-facing microcopy; purges generic corporate AI jargon, replacing with clear, empathetic Indonesian UX copy.
- **`REC-212` (3 SP, Agent #1 Dimas Surya):** *100% Zero-Paywall Ethical Governance & Community Accessibility Review*
  - Audits that the revamped UI maintains 100% open accessibility with zero monetization barriers.

### 6. Lounge & Culture Division (14 / 15 SP — 93.3% Utilization)
- **`REC-213` (6 SP, Agent #22 Cinta Kirana):** *Candidate Ergonomic & Cognitive Comfort Evaluation*
  - Usability testing on reduced eye fatigue, dark-mode readability, and non-stressful assessment layouts.
- **`REC-214` (5 SP, Agent #23 Doni Firmansyah):** *Community Discussion & Cohort Collaboration Hub Design*
  - Streamlined cohort forum layout using clean linear message threads rather than nested card-inside-card bubbles.
- **`REC-215` (3 SP, Agent #14 Maya Safitri):** *Design Ethics & Anti-Dark Pattern Compliance Review*
  - Verifies zero deceptive UI patterns, countdown stress timers, or intrusive modal overlays.

---

## Anti-Slop Design Mandate & Rules (Strict Enforcement)
1. **Purpose-Gate:** No visual decoration without a functional purpose. Gradient text, floating glass cards, and random emojis without utility are strictly barred.
2. **Industrial Precision Workbench Style:** Flat, dense, high-utility panels with solid borders (`border-zinc-800`), dark workbench backgrounds (`#090D16`), and clear telemetry chips.
3. **Contrast & Accessibility:** Every text and badge must achieve WCAG 2.1 AA (4.5:1 minimum).
4. **Zero-Slop Motion:** Snappy, deterministic transitions (`150ms-200ms ease-out`), no floaty or springy wobble animations.
5. **Human Copywriting:** Active verbs, plain conversational Indonesian, zero corporate buzzwords.
