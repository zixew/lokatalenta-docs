# LokaTalenta Documentation Hub

Dedicated Architecture, ADR, Integration Contracts, 6-Division / 24-Agent Matrix, Grooming Records, and Cross-Workflow Rubric application (`API: 4104`, `Dev UI: 4114`), interconnected with [`lokatalenta-event-gateway`](https://github.com/zixew/lokatalenta-event-gateway) and [`lokatalenta-office-3d`](https://github.com/zixew/lokatalenta-office-3d).

## Repository Layout

- `server/` — Node 25 + TypeScript ESM Express 5 API, `node:sqlite` + FTS5 persistence, seed loader, and fail-open Event Gateway emitter (`PORT=4104`)
- `api/index.ts` & `vercel.json` — Vercel serverless entrypoint with `/tmp/lokatalenta-docs.db` fallback and configurable `CORS_ORIGINS`
- `client/` — Vite + React 19 + TypeScript + Tailwind CSS v4 UI (`port 4114` proxying `/api` to `4104`), XSS-safe Markdown (`react-markdown` + `remark-gfm`), lazy-loaded Mermaid (`securityLevel: 'strict'`), FTS5 live search, and Unified Ecosystem Switcher
- `content/` — Starter Markdown docs (`content/docs/*.md`) and rubric (`content/rubrics/*.json`) seeded automatically when DB is empty
- `tests/` — Vitest unit, API, FTS5, Gateway emitter, security/SPA, Vercel readiness, and React component test suites

## Commands

```bash
npm install
npm run dev        # API :4104, Vite Dev UI :4114
npm run typecheck  # Server + Client TypeScript check
npm run lint       # Oxlint across server, tests, and client
npm run build      # Build server (dist/) and client (client/dist/)
npm start          # Serve built API + SPA on PORT (default 4104)
npm test           # Run all Vitest suites
```
