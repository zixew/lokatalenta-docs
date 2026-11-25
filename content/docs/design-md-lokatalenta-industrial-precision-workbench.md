---
slug: design-md-lokatalenta-industrial-precision-workbench
title: DESIGN.md — LokaTalenta Industrial Precision Workbench
category: architecture
divisionId: engineering
authorAgentId: 12
status: approved
tags: [design, ui, palette, typography, motion, accessibility, anti-slop]
---

# DESIGN.md — LokaTalenta Sprint Ecosystem

## Aesthetic Direction
Industrial Precision Workbench. Data-dense, zero decoration, every pixel earns its place.

## Palette Tokens
- Canvas BG (light): `#F3F3F0`
- Canvas BG (dark): `#0E1015`
- Surface (light): `#FFFFFF`
- Surface (dark): `#161B24`
- Ink primary: `#0E1015`
- Ink muted: `#6B7280`
- Accent: `#0066FF`
- Border (light): `#D4D4CE`
- Border (dark): `#2A2F3C`

## Typography
- Display: Geist Mono or DM Mono (replaces Inter as brand voice)
- Body: Inter (utility only, not personality)
- Ban: Roboto, Arial, system-ui as personality faces
- Ban: purple-to-indigo gradients
- Ban: warm cream/sand backgrounds as "premium" default

## Component Rules
- Tab bars: docked segmented rail — no floating pill tabs
- Loading: skeleton shimmer grid — no generic loading text box
- Cards: flat, single-level — no nested card matryoshka
- Hover: subtle bg shift only — no scale transforms on cards
- Drawers: translucent backdrop (`backdrop-blur-4px` + `bg-black/25`)

## Motion System
- Micro-transitions: 75–100ms ease-out (transform, opacity only)
- Drawer enter: 200ms cubic-bezier(0.16, 1, 0.3, 1) translateX
- Drawer exit: 140ms ease-in translateX
- Kill: hover-scale cards, bounce buttons, infinite decorative loops
- prefers-reduced-motion: crossfade or instant — global reset required
