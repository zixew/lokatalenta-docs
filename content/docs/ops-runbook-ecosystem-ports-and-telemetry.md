---
slug: ops-runbook-ecosystem-ports-and-telemetry
title: Operations Runbook — Ports, Healthchecks & Telemetry Troubleshooting
category: runbook
divisionId: devops
authorAgentId: 11
status: reviewed
tags: [runbook, devops, ports, telemetry]
---

# Operations Runbook: Ports & Telemetry

## Avoided Host Ports

Never bind services to occupied host ports: `5000`, `7000`, `8089`, `8091`, `11301`, `54321`, `56211`.

## Health Verification Commands

```bash
curl -s http://localhost:4101/health
curl -s http://localhost:4104/api/health
```

## Telemetry Fail-Open Behavior

If `EVENT_GATEWAY_URL` (`http://localhost:4101`) is unreachable, `lokatalenta-docs` logs a concise warning and returns the HTTP `200`/`201` mutation response within `1500ms` so daily documentation workflows remain uninterrupted.
