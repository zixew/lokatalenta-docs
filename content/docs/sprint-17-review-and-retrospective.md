---
slug: sprint-17-review-and-retrospective
title: Sprint 17 — Review & Retrospective: Architecture Hardening & Anti-Slop UI
category: grooming
divisionId: executive
authorAgentId: 0
status: approved
tags: [sprint-17, review, retrospective, ceremony, velocity]
---

# Sprint 17 Review & Retrospective

## A. Sprint Review (Demo & Velocity)
- **Facilitator:** #0 Rizco Renova (Release Lead)
- **Committed:** 47 SP | **Completed:** 47 SP (100% velocity)
- **Deliverables Verified:**
  1. `ARC-171` (13 SP): Turso/libSQL cloud database adapter with @libsql/client, connection retry, and cold-start state synchronization.
  2. `BL-171` (13 SP): Idempotent schema migrations with version tracking (v1, v2) and npm run db:migrate CLI.
  3. `BL-172` (8 SP): Anti-slop UI tokens (#F3F3F0 light / #0E1015 dark), docked segmented rail tabs, and 6-cell skeleton shimmer grid.
  4. `BL-173` (5 SP): CSS motion system tokens (.transition-subtle, .transition-drawer-enter, .transition-drawer-exit) and prefers-reduced-motion reset.
  5. `QAE-171` (8 SP): Cold-start E2E resilience test suite (21/21 passing tests).

## B. Sprint Retrospective
- **Facilitator:** #1 Dimas Surya (Scrum Master)
- **What Went Well:**
  - Zero UI regression while removing generic AI slop (parchment bg, floating pills, bounce animations).
  - Test coverage expanded to test actual multi-instance Vercel cold-starts with simulated cloud DB.
  - Active Load toggle in Capacity Matrix provides instant visibility into in-flight vs completed points.
- **Areas for Improvement:**
  - Backlog and Docs Hub services still use ephemeral /tmp SQLite and need the same Turso migration applied.
  - Recruiter/Candidate telemetry privacy guardrails (REC-001) need to be prioritized.
- **Action Items:**
  1. Propagate Turso adapter and migrations to Backlog & Docs Hub repos (Sprint 18).
  2. Finalize REC-001 for zero candidate telemetry leaks.
  3. Connect 3D Office agent positions to live Event Gateway telemetry.
