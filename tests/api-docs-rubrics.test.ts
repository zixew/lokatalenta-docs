import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp, type DocsAppInstance } from '../server/app.ts';

describe('Docs & Rubrics REST API (ephemeral port: 0, :memory: DB)', () => {
  let instance: DocsAppInstance;
  let baseUrl: string;
  let server: ReturnType<DocsAppInstance['app']['listen']>;

  beforeEach(async () => {
    instance = createApp({
      dbPath: ':memory:',
      seedOnEmpty: false,
      gatewayUrl: 'http://127.0.0.1:59999', // closed port -> fail-open verified
      gatewayTimeoutMs: 250,
    });
    await new Promise<void>((resolve) => {
      server = instance.app.listen(0, '127.0.0.1', () => {
        const addr = server.address() as AddressInfo;
        baseUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => {
        instance.close();
        resolve();
      });
    });
  });

  it('returns health and canonical 6-division / 24-agent contracts', async () => {
    const healthRes = await fetch(`${baseUrl}/api/health`);
    expect(healthRes.status).toBe(200);
    const health = (await healthRes.json()) as { ok: boolean; service: string };
    expect(health.ok).toBe(true);
    expect(health.service).toBe('lokatalenta-docs');

    const contractsRes = await fetch(`${baseUrl}/api/contracts/canonical`);
    expect(contractsRes.status).toBe(200);
    const contracts = (await contractsRes.json()) as {
      divisions: unknown[];
      agents: unknown[];
      collaborationPairs: unknown[];
      ports: unknown[];
    };
    expect(contracts.divisions).toHaveLength(6);
    expect(contracts.agents).toHaveLength(24);
    expect(contracts.collaborationPairs).toHaveLength(6);
    expect(contracts.ports).toHaveLength(6);
  });

  it('supports full Docs CRUD, filtering, FTS search, and strict 400/404/409 codes', async () => {
    // Empty initial state
    const emptyList = await fetch(`${baseUrl}/api/docs`);
    expect(emptyList.status).toBe(200);
    expect(await emptyList.json()).toEqual({ docs: [] });

    // 404 on missing doc
    const missingRes = await fetch(`${baseUrl}/api/docs/not-found`);
    expect(missingRes.status).toBe(404);

    // 400 on malformed slug / invalid division
    const badCreate = await fetch(`${baseUrl}/api/docs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'BAD_SLUG',
        title: 'Bad',
        category: 'adr',
        divisionId: 'executive',
        authorAgentId: 0,
        content: 'hello',
      }),
    });
    expect(badCreate.status).toBe(400);

    // 201 create
    const createdRes = await fetch(`${baseUrl}/api/docs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'adr-010-telemetry',
        title: 'ADR-010 Telemetry Bus',
        category: 'adr',
        divisionId: 'architecture',
        authorAgentId: 4,
        status: 'approved',
        tags: ['telemetry', 'gateway'],
        content: '# ADR-010\n\nReal-time telemetry architecture.',
      }),
    });
    expect(createdRes.status).toBe(201);
    const created = (await createdRes.json()) as { doc: { slug: string; status: string } };
    expect(created.doc.slug).toBe('adr-010-telemetry');

    // 409 duplicate slug
    const dupRes = await fetch(`${baseUrl}/api/docs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'adr-010-telemetry',
        title: 'Duplicate',
        category: 'adr',
        divisionId: 'architecture',
        authorAgentId: 4,
        content: 'Duplicate',
      }),
    });
    expect(dupRes.status).toBe(409);

    // Filter by category & division
    const filtered = await fetch(`${baseUrl}/api/docs?category=adr&division=architecture`);
    expect(filtered.status).toBe(200);
    const filteredBody = (await filtered.json()) as { docs: Array<{ slug: string }> };
    expect(filteredBody.docs).toHaveLength(1);

    // Invalid filter returns 400
    const badFilter = await fetch(`${baseUrl}/api/docs?division=invalid`);
    expect(badFilter.status).toBe(400);

    // Search
    const searchRes = await fetch(`${baseUrl}/api/search?q=telemetry`);
    expect(searchRes.status).toBe(200);
    const searchBody = (await searchRes.json()) as { results: Array<{ slug: string }> };
    expect(searchBody.results.map((r) => r.slug)).toContain('adr-010-telemetry');

    // PUT slug mismatch -> 400
    const mismatchRes = await fetch(`${baseUrl}/api/docs/adr-010-telemetry`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'other-slug', title: 'Changed' }),
    });
    expect(mismatchRes.status).toBe(400);

    // PUT update -> 200
    const updateRes = await fetch(`${baseUrl}/api/docs/adr-010-telemetry`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'ADR-010 Telemetry Bus v2', status: 'reviewed' }),
    });
    expect(updateRes.status).toBe(200);
    const updated = (await updateRes.json()) as { doc: { title: string; status: string } };
    expect(updated.doc.title).toBe('ADR-010 Telemetry Bus v2');
    expect(updated.doc.status).toBe('reviewed');

    // DELETE -> 200, then 404
    const delRes = await fetch(`${baseUrl}/api/docs/adr-010-telemetry`, { method: 'DELETE' });
    expect(delRes.status).toBe(200);
    expect(await delRes.json()).toEqual({ ok: true, deletedSlug: 'adr-010-telemetry' });

    const delAgain = await fetch(`${baseUrl}/api/docs/adr-010-telemetry`, { method: 'DELETE' });
    expect(delAgain.status).toBe(404);
  });

  it('supports Rubrics GET/POST/PUT and unknown /api/* returns JSON 404', async () => {
    const createRes = await fetch(`${baseUrl}/api/rubrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'rubric-sprint-planner',
        title: 'Sprint Planner Cross-App Rubric',
        workflowName: 'Sprint Planning',
        ownerDivision: 'executive',
        ownerAgentId: 2,
        contractRef: 'cross-app-integration-contracts',
        backlogItemIds: ['BL-10', 'SP-01'],
        criteria: [
          {
            name: 'Backlog Sync Contract',
            weight: 60,
            score: 60,
            maxScore: 60,
            status: 'pass',
            evidence: 'Verified PATCH /api/items/:id integration',
          },
        ],
        overallStatus: 'pass',
        notes: 'Ready',
      }),
    });
    expect(createRes.status).toBe(201);

    // Duplicate ID -> 409
    const dupRes = await fetch(`${baseUrl}/api/rubrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'rubric-sprint-planner',
        title: 'Dup',
        workflowName: 'Sprint Planning',
        ownerDivision: 'executive',
        ownerAgentId: 2,
        contractRef: 'ref',
        criteria: [{ name: 'C', weight: 10, score: 10, maxScore: 10, status: 'pass', evidence: '' }],
        overallStatus: 'pass',
      }),
    });
    expect(dupRes.status).toBe(409);

    const getRes = await fetch(`${baseUrl}/api/rubrics/rubric-sprint-planner`);
    expect(getRes.status).toBe(200);

    const putRes = await fetch(`${baseUrl}/api/rubrics/rubric-sprint-planner`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overallStatus: 'partial', notes: 'Needs M4 items' }),
    });
    expect(putRes.status).toBe(200);
    const updated = (await putRes.json()) as { rubric: { overallStatus: string } };
    expect(updated.rubric.overallStatus).toBe('partial');

    const unknownApi = await fetch(`${baseUrl}/api/does-not-exist`);
    expect(unknownApi.status).toBe(404);
    expect(await unknownApi.json()).toEqual({ error: 'API route not found' });
  });
});
