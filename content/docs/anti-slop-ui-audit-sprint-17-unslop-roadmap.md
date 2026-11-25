---
slug: anti-slop-ui-audit-sprint-17-unslop-roadmap
title: Anti-Slop UI Audit — Sprint 17 Unslop Roadmap
category: grooming
divisionId: engineering
authorAgentId: 12
status: approved
tags: [anti-slop, ui, audit, sprint-17, bl-172]
---

# Anti-Slop UI Audit — LokaTalenta Sprint Planner

## Slop Inventory & Resolution

1. **Parchment body background #F6F5F1** -> Replaced with #F3F3F0 (cooler, neutral canvas).
2. **Inter as brand personality face** -> Headings use Geist Mono / display tokens.
3. **Floating pill tab bar** -> Replaced with docked segmented rail.
4. **Generic loading text box** -> Replaced with skeleton shimmer grid.
5. **Hover-scale on buttons** -> Removed `hover:scale-105`, added `active:scale-[0.97]`.
6. **Drawer backdrop missing** -> Added `backdrop-blur-[4px] bg-black/25`.
7. **No reduced-motion reset** -> Added `@media (prefers-reduced-motion: reduce)` global reset.

## Shipped Items
- **BL-172** (8 SP): Anti-Slop UI Cohesion (Palette, Docked Tabs, Skeleton Loader)
- **BL-173** (5 SP): CSS Motion Tokens & Reduced-Motion Guardrail
