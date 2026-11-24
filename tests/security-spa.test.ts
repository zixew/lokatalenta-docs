import fs from 'node:fs';
import type { AddressInfo } from 'node:net';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  isSafeHttpUrl,
  isSafeMarkdownUrl,
  sanitizeUserText,
} from '../client/src/shared/lib/securityGuards.ts';
import { createApp } from '../server/app.ts';

describe('Security guards & Express 5 SPA static fallback', () => {
  const tempDirs: string[] = [];

  afterEach(() => {
    for (const dir of tempDirs) {
      fs.rmSync(dir, { recursive: true, force: true });
    }
    tempDirs.length = 0;
  });

  it('validates safe URLs and sanitizes user text', () => {
    expect(isSafeHttpUrl('http://localhost:4104')).toBe(true);
    expect(isSafeHttpUrl('https://docs.lokatalenta.app')).toBe(true);
    expect(isSafeHttpUrl('/docs/adr-001')).toBe(true);
    expect(isSafeHttpUrl('//evil.example/phish')).toBe(false);
    expect(isSafeHttpUrl('javascript:alert(1)')).toBe(false);

    expect(isSafeMarkdownUrl('#section')).toBe(true);
    expect(isSafeMarkdownUrl('mailto:team@lokatalenta.id')).toBe(true);
    expect(isSafeMarkdownUrl('javascript:alert(1)')).toBe(false);
    expect(isSafeMarkdownUrl('vbscript:msgbox(1)')).toBe(false);
    expect(isSafeMarkdownUrl('data:text/html,<script>alert(1)</script>')).toBe(false);

    expect(sanitizeUserText('<script>alert(1)</script>Hello onload=evil()')).toBe(
      'alert(1)Hello evil()',
    );
  });

  it('serves SPA index.html for frontend routes and JSON 404 for unknown /api/*', async () => {
    const tmpDist = fs.mkdtempSync(path.join(os.tmpdir(), 'docs-spa-'));
    tempDirs.push(tmpDist);
    fs.writeFileSync(
      path.join(tmpDist, 'index.html'),
      '<!doctype html><html><body><div id="root">SPA_OK</div></body></html>',
      'utf8',
    );

    const instance = createApp({
      dbPath: ':memory:',
      seedOnEmpty: false,
      clientDistDir: tmpDist,
    });

    const server = await new Promise<ReturnType<typeof instance.app.listen>>((resolve) => {
      const s = instance.app.listen(0, '127.0.0.1', () => resolve(s));
    });

    try {
      const addr = server.address() as AddressInfo;
      const base = `http://127.0.0.1:${addr.port}`;

      const rootRes = await fetch(`${base}/`);
      expect(rootRes.status).toBe(200);
      expect(await rootRes.text()).toContain('SPA_OK');

      const deepLinkRes = await fetch(`${base}/docs/adr-001`);
      expect(deepLinkRes.status).toBe(200);
      expect(await deepLinkRes.text()).toContain('SPA_OK');

      const missingApi = await fetch(`${base}/api/unknown-route`);
      expect(missingApi.status).toBe(404);
      expect(missingApi.headers.get('content-type')).toContain('application/json');
      expect(await missingApi.json()).toEqual({ error: 'API route not found' });
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      instance.close();
    }
  });
});
