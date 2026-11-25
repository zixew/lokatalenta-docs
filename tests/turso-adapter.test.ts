import { describe, expect, it } from 'vitest';
import { DocsTursoAdapter, loadTursoConfig, withRetry } from '../server/store/tursoAdapter.ts';

describe('DocsTursoAdapter for Docs Hub', () => {
  it('loads config from environment safely', () => {
    expect(loadTursoConfig({})).toBeNull();
    const config = loadTursoConfig({
      TURSO_DATABASE_URL: 'libsql://docs-test.turso.io',
      TURSO_AUTH_TOKEN: 'test_token_123',
    });
    expect(config).toEqual({
      url: 'libsql://docs-test.turso.io',
      authToken: 'test_token_123',
    });
  });

  it('reports unconfigured status when no env vars provided', async () => {
    const adapter = new DocsTursoAdapter(null);
    expect(adapter.isConfigured).toBe(false);
    const health = await adapter.checkHealth();
    expect(health.configured).toBe(false);
    expect(health.healthy).toBe(false);
  });

  it('retries with exponential backoff on transient failures', async () => {
    let attempts = 0;
    const res = await withRetry(
      async () => {
        attempts++;
        if (attempts < 2) {
          throw new Error('transient network error');
        }
        return 'recovered';
      },
      { maxAttempts: 3, baseDelayMs: 10 },
    );
    expect(res).toBe('recovered');
    expect(attempts).toBe(2);
  });
});
