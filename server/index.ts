import { createApp, resolveDbPath } from './app.ts';

const port = Number(process.env.PORT ?? 4104);
const dbPath = resolveDbPath(process.env);
const seedOnEmpty =
  process.env.DOCS_SEED_ON_EMPTY !== 'false' && process.env.NODE_ENV !== 'test';

const instance = createApp({
  dbPath,
  port,
  seedOnEmpty,
  gatewayUrl: process.env.EVENT_GATEWAY_URL ?? 'http://localhost:4101',
  gatewaySecret: process.env.GATEWAY_EVENT_SECRET ?? '',
});

const server = instance.app.listen(port, () => {
  console.log(`[lokatalenta-docs] Server listening on http://localhost:${port}`);
});

function shutdown(signal: string): void {
  console.log(`[lokatalenta-docs] Received ${signal}, shutting down...`);
  server.close(() => {
    instance.close();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
