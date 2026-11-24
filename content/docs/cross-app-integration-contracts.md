---
slug: cross-app-integration-contracts
title: Cross-App Integration Contracts & Event Schema v1.0
category: contract
divisionId: devops
authorAgentId: 12
status: approved
tags: [contract, api, event-schema, ports]
---

# Cross-App Integration Contracts

This specification defines the canonical ports, REST APIs, and 13-field Event Gateway telemetry payload across the LokaTalenta ecosystem.

## Service Port Registry

| Service | API Port | Dev UI Port | Health Endpoint |
|---|---|---|---|
| `lms-psikotes` | `4100` | `4100` | `/` |
| `lokatalenta-event-gateway` | `4101` | `—` | `/health` |
| `lokatalenta-backlog` | `4102` | `4112` | `/api/health` |
| `lokatalenta-sprint-planner` | `4103` | `4113` | `/api/health` |
| `lokatalenta-docs` | `4104` | `4114` | `/api/health` |
| `lokatalenta-office-3d` | `4105` | `4105` | `/` |

## Event Gateway Payload (`contracts/event-schema.json`)

Every `POST /events` payload sets `additionalProperties: false` with 13 required keys:

- `id`, `timestamp`, `source`, `type`, `divisionId`, `agentId`, `entityId`, `title`, `summary`, `targetZone`, `targetFloor`, `severity`, `metadata`.
- Documentation Hub mutations emit `source: "docs"`, `type: "doc.updated"`, and `metadata.action` set to `doc.created`, `doc.updated`, `doc.deleted`, `rubric.created`, or `rubric.updated`.
