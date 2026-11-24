---
slug: ecosystem-architecture-overview
title: LokaTalenta Multi-Repo Ecosystem Architecture Overview
category: architecture
divisionId: architecture
authorAgentId: 4
status: approved
tags: [architecture, ecosystem, event-gateway, multi-repo]
---

# LokaTalenta Multi-Repo Ecosystem Architecture

LokaTalenta separates its core **LMS Psikotes** platform from its dedicated SDLC tooling (**Backlog**, **Sprint Planner**, **Documentation Hub**) and the multi-floor **3D Office HQ**, interconnected via a central **Real-Time Event Gateway**.

## Topology Diagram

```mermaid
flowchart LR
  LMS[LMS Psikotes :4100] -->|POST /events| GW[Event Gateway :4101]
  BL[Backlog :4102 / :4112] -->|POST /events| GW
  SP[Sprint Planner :4103 / :4113] -->|POST /events| GW
  SP -->|GET/PATCH items| BL
  DOCS[Docs Hub :4104 / :4114] -->|POST /events| GW
  GH[GitHub Webhooks] -->|X-Hub-Signature-256| GW
  GW -->|WS /ws & SSE /events/stream| OFFICE[3D Office HQ :4105]
```

## Design Principles

1. **Bounded Domain Ownership**: Each application owns its SQLite persistence (`node:sqlite`) and REST API while emitting standardized telemetry events.
2. **Fail-Open Telemetry**: Mutations in Backlog, Sprint Planner, Docs, and LMS Psikotes never fail when the Event Gateway is offline.
3. **Hexagonal Contracts**: Canonical 6-division (`executive`, `architecture`, `engineering`, `qa`, `devops`, `lounge`) and 24-agent (`0..23`) identities are shared across all repositories.
