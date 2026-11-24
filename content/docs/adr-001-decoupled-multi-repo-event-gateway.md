---
slug: adr-001-decoupled-multi-repo-event-gateway
title: ADR-001 Decoupled Multi-Repo Ecosystem & Real-Time Event Gateway
category: adr
divisionId: executive
authorAgentId: 0
status: approved
tags: [adr, decoupling, event-gateway, governance]
---

# ADR-001: Decoupled Multi-Repo Ecosystem & Real-Time Event Gateway

- **Status**: Approved
- **Deciders**: Rizco Renova (#0), Ir. Arkananta Dewantara (#4), Ir. Saskia Wardhani (#17)
- **Date**: 2026-11-24

## Context

Previously, `docs/kantor_ai_3d.html` and SDLC planning artifacts lived inside `lms-psikotes`, mixing core candidate psychometric assessment workflows with engineering operations and 3D office visualization.

## Decision

1. Extract `kantor_ai_3d.html` into `lokatalenta-office-3d` (Port `4105`).
2. Create dedicated repositories for `lokatalenta-event-gateway` (`4101`), `lokatalenta-backlog` (`4102`/`4112`), `lokatalenta-sprint-planner` (`4103`/`4113`), and `lokatalenta-docs` (`4104`/`4114`).
3. Standardize cross-app telemetry on a strict 13-field `event-schema.json` contract delivered over HTTP `POST /events` with optional HMAC-SHA256 (`x-lokatalenta-signature`) and Bearer auth.

## Consequences

- Independent CI/CD, test suites, and `< 250 kB` client bundle budgets per repository.
- Real-time visibility in the 3D Office across commits, PRs, backlog grooming, sprint transitions, documentation updates, and LMS events.
