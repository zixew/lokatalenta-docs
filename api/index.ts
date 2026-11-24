import type { Express } from 'express';
import { createApp, resolveDbPath } from '../server/app.ts';

let cachedApp: Express | null = null;

export function getServerlessApp(): Express {
  if (!cachedApp) {
    const dbPath = resolveDbPath(process.env);
    const seedOnEmpty = process.env.DOCS_SEED_ON_EMPTY !== 'false';
    const instance = createApp({
      dbPath,
      port: Number(process.env.PORT ?? 4104),
      seedOnEmpty,
      gatewayUrl: process.env.EVENT_GATEWAY_URL ?? 'http://localhost:4101',
      gatewaySecret: process.env.GATEWAY_EVENT_SECRET ?? '',
    });
    cachedApp = instance.app;
  }
  return cachedApp;
}

export default function handler(
  req: Parameters<Express>[0],
  res: Parameters<Express>[1],
) {
  const app = getServerlessApp();
  return app(req, res);
}
