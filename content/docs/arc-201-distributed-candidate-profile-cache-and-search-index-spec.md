---
slug: arc-201-distributed-candidate-profile-cache-and-search-index-spec
title: ARC-201 — Distributed Candidate Profile Cache & Search Index Spec
category: architecture
divisionId: architecture
authorAgentId: 4
status: approved
tags: [caching, search-index, architecture, p95, latency, sprint-20]
---

# ARC-201 — Distributed Candidate Profile Cache & Search Index Spec

## Architecture & Tiering
To support candidate search under 50ms P95 latency across thousands of candidate profiles:
1. **L1 In-Memory Cache (LRU):** 5,000 warm profile entries in Node.js serverless RAM (TTL: 60s).
2. **L2 Distributed Cache:** Redis/Upstash edge cluster with sub-10ms fetch latencies.
3. **L3 Source of Truth:** Turso libSQL distributed database with primary write replica and read edge replicas.

## Invalidation Strategy
- Invalidation events emitted to Event Gateway: `candidate.profile.updated`, `candidate.profile.deleted`.
- Gateway webhooks broadcast cache purges to all running Edge instances within 200ms.
