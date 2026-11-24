import { createHmac, timingSafeEqual } from 'node:crypto';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp, type DocsAppInstance } from '../server/app.ts';

interface CapturedGatewayRequest {
  authHeader: string | undefined;
  sigHeader: string | undefined;
  rawBody: string;
  parsed: Record<string, unknown>;
}

describe('Event Gateway emitter (13-field contract, HMAC, fail-open)', () => {
  const secret = 'test-gateway-secret-123';
  let gatewayServer: http.Server;
  let gatewayUrl: string;
  let captured: CapturedGatewayRequest[] = [];
  let appInstance: DocsAppInstance;
  let apiServer: ReturnType<DocsAppInstance['app']['listen']>;
  let apiUrl: string;

  beforeEach(async () => {
    captured = [];
    gatewayServer = http.createServer((req, res) => {
      const chunks: Buffer[] = [];
      req.on('data', (c: Buffer) => chunks.push(c));
      req.on('end', () => {
        const rawBody = Buffer.concat(chunks).toString('utf8');
        captured.push({
          authHeader: req.headers.authorization,
          sigHeader: req.headers['x-lokatalenta-signature'] as string | undefined,
          rawBody,
          parsed: JSON.parse(rawBody) as Record<string, unknown>,
        });
        res.writeHead(202, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      });
    });

    await new Promise<void>((resolve) => {
      gatewayServer.listen(0, '127.0.0.1', () => {
        const addr = gatewayServer.address() as AddressInfo;
        gatewayUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });

    appInstance = createApp({
      dbPath: ':memory:',
      seedOnEmpty: false,
      gatewayUrl,
      gatewaySecret: secret,
    });

    await new Promise<void>((resolve) => {
      apiServer = appInstance.app.listen(0, '127.0.0.1', () => {
        const addr = apiServer.address() as AddressInfo;
        apiUrl = `http://127.0.0.1:${addr.port}`;
        resolve();
      });
    });
  });

  afterEach(async () => {
    await new Promise<void>((resolve) => apiServer.close(() => resolve()));
    appInstance.close();
    await new Promise<void>((resolve) => gatewayServer.close(() => resolve()));
  });

  it('emits strict 13-key event-schema.json payloads with HMAC & Bearer across all 5 mutations', async () => {
    // 1. POST /api/docs
    await fetch(`${apiUrl}/api/docs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'adr-emitter-test',
        title: 'Emitter Test Doc',
        category: 'adr',
        divisionId: 'lounge',
        authorAgentId: 14,
        status: 'draft',
        content: 'Testing gateway event emission.',
      }),
    });

    // 2. PUT /api/docs/:slug
    await fetch(`${apiUrl}/api/docs/adr-emitter-test`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'approved' }),
    });

    // 3. DELETE /api/docs/:slug
    await fetch(`${apiUrl}/api/docs/adr-emitter-test`, {
      method: 'DELETE',
    });

    // 4. POST /api/rubrics
    await fetch(`${apiUrl}/api/rubrics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'rubric-emit-1',
        title: 'Rubric Emit Test',
        workflowName: 'Documentation',
        ownerDivision: 'qa',
        ownerAgentId: 8,
        contractRef: 'cross-app-integration-contracts',
        criteria: [{ name: 'Check', weight: 100, score: 100, maxScore: 100, status: 'pass', evidence: 'OK' }],
        overallStatus: 'pass',
      }),
    });

    // 5. PUT /api/rubrics/:id
    await fetch(`${apiUrl}/api/rubrics/rubric-emit-1`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ overallStatus: 'partial' }),
    });

    expect(captured).toHaveLength(5);

    const expectedKeys = [
      'id',
      'timestamp',
      'source',
      'type',
      'divisionId',
      'agentId',
      'entityId',
      'title',
      'summary',
      'targetZone',
      'targetFloor',
      'severity',
      'metadata',
    ].sort();

    const expectedActions = [
      'doc.created',
      'doc.updated',
      'doc.deleted',
      'rubric.created',
      'rubric.updated',
    ];

    captured.forEach((req, idx) => {
      expect(Object.keys(req.parsed).sort()).toEqual(expectedKeys);
      expect(req.parsed.source).toBe('docs');
      expect(req.parsed.type).toBe('doc.updated');
      expect((req.parsed.metadata as { action: string }).action).toBe(expectedActions[idx]);

      // Verify Bearer token and HMAC-SHA256 signature
      expect(req.authHeader).toBe(`Bearer ${secret}`);
      const expectedSig = `sha256=${createHmac('sha256', secret).update(req.rawBody).digest('hex')}`;
      expect(req.sigHeader).toBeDefined();
      expect(
        timingSafeEqual(Buffer.from(req.sigHeader!), Buffer.from(expectedSig)),
      ).toBe(true);
    });

    // Check canonical zone/floor resolution for 'lounge' (floor 2, zone 'lounge') and 'qa' (floor 2, zone 'workspace')
    expect(captured[0].parsed.targetZone).toBe('lounge');
    expect(captured[0].parsed.targetFloor).toBe(2);
    expect(captured[3].parsed.targetZone).toBe('workspace');
    expect(captured[3].parsed.targetFloor).toBe(2);
  });

  it('fails open when Event Gateway is offline', async () => {
    await new Promise<void>((resolve) => gatewayServer.close(() => resolve()));

    const res = await fetch(`${apiUrl}/api/docs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: 'offline-gateway-doc',
        title: 'Offline Gateway Resilience',
        category: 'runbook',
        divisionId: 'devops',
        authorAgentId: 11,
        content: 'Should succeed even when Gateway is down.',
      }),
    });

    expect(res.status).toBe(201);
  });
});
