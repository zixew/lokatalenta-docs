import fs from 'node:fs';
import { afterEach, describe, expect, it } from 'vitest';
import { isAllowedCorsOrigin, resolveDbPath } from '../server/app.ts';

describe('Vercel serverless readiness (DB_PATH fallback, CORS_ORIGINS, api/index.ts)', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
    if (fs.existsSync('/tmp/lokatalenta-docs.db')) {
      fs.rmSync('/tmp/lokatalenta-docs.db', { force: true });
    }
  });

  it('resolves SQLite DB path to /tmp/lokatalenta-docs.db when VERCEL=1 unless DB_PATH is set', () => {
    expect(resolveDbPath({ VERCEL: '1' } as NodeJS.ProcessEnv, '/var/task')).toBe(
      '/tmp/lokatalenta-docs.db',
    );
    expect(
      resolveDbPath(
        { VERCEL: '1', DB_PATH: '/tmp/custom-docs.db' } as NodeJS.ProcessEnv,
        '/var/task',
      ),
    ).toBe('/tmp/custom-docs.db');
    expect(resolveDbPath({} as NodeJS.ProcessEnv, '/app')).toBe(
      '/app/lokatalenta-docs.sqlite',
    );
  });

  it('supports *.vercel.app, localhost:*, 127.0.0.1:*, and custom CORS_ORIGINS patterns', () => {
    expect(isAllowedCorsOrigin('http://localhost:4114')).toBe(true);
    expect(isAllowedCorsOrigin('http://127.0.0.1:4104')).toBe(true);
    expect(isAllowedCorsOrigin('https://lokatalenta-docs.vercel.app')).toBe(true);
    expect(isAllowedCorsOrigin('https://preview-123.vercel.app')).toBe(true);
    expect(isAllowedCorsOrigin('https://evil.example.com')).toBe(false);

    expect(
      isAllowedCorsOrigin(
        'https://docs.lokatalenta.com',
        'https://docs.lokatalenta.com,*.vercel.app',
      ),
    ).toBe(true);
    expect(
      isAllowedCorsOrigin(
        'https://evil.example.com',
        'https://docs.lokatalenta.com,*.vercel.app',
      ),
    ).toBe(false);
  });

  it('handles requests cleanly via api/index.ts under VERCEL=1 without EROFS or port binding', async () => {
    process.env.VERCEL = '1';
    process.env.DB_PATH = '/tmp/lokatalenta-docs.db';
    process.env.DOCS_SEED_ON_EMPTY = 'true';

    const mod = await import('../api/index.ts');
    const app = mod.getServerlessApp();
    const request = (await import('supertest')).default;

    const health = await request(app).get('/api/health');
    expect(health.status).toBe(200);
    expect(health.body.ok).toBe(true);
    expect(health.body.persistence).toBe('ephemeral-tmp-seeded');

    const docs = await request(app).get('/api/docs');
    expect(docs.status).toBe(200);
    expect(docs.body.docs.length).toBeGreaterThanOrEqual(5);

    const rubrics = await request(app).get('/api/rubrics');
    expect(rubrics.status).toBe(200);
    expect(rubrics.body.rubrics.length).toBeGreaterThanOrEqual(1);
  });
});
