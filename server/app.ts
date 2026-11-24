import fs from 'node:fs';
import path from 'node:path';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { createApiRouter } from './routes/api.ts';
import { seedFromContentDir } from './seed/seedLoader.ts';
import { DocsStore } from './store/docsStore.ts';

export interface CreateAppOptions {
  dbPath?: string;
  port?: number;
  seedOnEmpty?: boolean;
  contentDir?: string;
  clientDistDir?: string;
  gatewayUrl?: string;
  gatewaySecret?: string;
  gatewayTimeoutMs?: number;
  fetchImpl?: typeof fetch;
  corsOrigins?: string;
}

export interface DocsAppInstance {
  app: Express;
  store: DocsStore;
  close: () => void;
}

export function resolveProjectRoot(startDir = import.meta.dirname): string {
  let current = path.resolve(startDir);
  for (let i = 0; i < 6; i++) {
    const pkgPath = path.join(current, 'package.json');
    if (fs.existsSync(pkgPath)) {
      const contentPath = path.join(current, 'content');
      const serverPath = path.join(current, 'server');
      if (fs.existsSync(contentPath) || fs.existsSync(serverPath)) {
        return current;
      }
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return process.cwd();
}

export function resolveDbPath(
  env: NodeJS.ProcessEnv = process.env,
  projectRoot = resolveProjectRoot(),
): string {
  const explicit = (env.DB_PATH ?? env.DOCS_DB_PATH ?? '').trim();
  if (explicit.length > 0) {
    return explicit;
  }
  if (env.VERCEL === '1') {
    return '/tmp/lokatalenta-docs.db';
  }
  return path.join(projectRoot, 'lokatalenta-docs.sqlite');
}

function matchOriginPattern(origin: string, pattern: string): boolean {
  const trimmed = pattern.trim();
  if (!trimmed) return false;
  if (trimmed === '*') return true;

  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    return false;
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return false;
  }

  if (!trimmed.includes('*')) {
    return origin === trimmed;
  }

  // Handle patterns like "localhost:*", "127.0.0.1:*", "*.vercel.app", "https://*.vercel.app"
  const hasScheme = trimmed.includes('://');
  const escaped = trimmed
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '[^/]+');

  if (hasScheme) {
    return new RegExp(`^${escaped}$`, 'i').test(origin);
  }

  const hostWithPort = parsed.host;
  const hostOnly = parsed.hostname;
  const regex = new RegExp(`^${escaped}$`, 'i');
  return regex.test(hostWithPort) || regex.test(hostOnly);
}

const DEFAULT_CORS_PATTERNS = ['localhost:*', '127.0.0.1:*', 'localhost', '127.0.0.1', '*.vercel.app'];

export function isAllowedCorsOrigin(
  origin: string,
  corsOriginsEnv: string | undefined = process.env.CORS_ORIGINS,
): boolean {
  try {
    const parsed = new URL(origin);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return false;
    }
  } catch {
    return false;
  }

  const patterns =
    corsOriginsEnv && corsOriginsEnv.trim().length > 0
      ? corsOriginsEnv
          .split(',')
          .map((p) => p.trim())
          .filter(Boolean)
      : DEFAULT_CORS_PATTERNS;

  return patterns.some((pattern) => matchOriginPattern(origin, pattern));
}

export function createApp(options: CreateAppOptions = {}): DocsAppInstance {
  const projectRoot = resolveProjectRoot();
  const dbPath = options.dbPath ?? ':memory:';
  const port = options.port ?? 4104;
  const seedOnEmpty = options.seedOnEmpty ?? false;
  const contentDir = options.contentDir ?? path.join(projectRoot, 'content');
  const clientDistDir =
    options.clientDistDir ?? path.join(projectRoot, 'client', 'dist');
  const gatewayUrl =
    options.gatewayUrl ?? process.env.EVENT_GATEWAY_URL ?? 'http://localhost:4101';
  const gatewaySecret =
    options.gatewaySecret ?? process.env.GATEWAY_EVENT_SECRET ?? '';
  const corsOriginsEnv = options.corsOrigins ?? process.env.CORS_ORIGINS;

  const store = new DocsStore(dbPath);
  if (seedOnEmpty) {
    seedFromContentDir(store, contentDir);
  }

  const app = express();
  app.disable('x-powered-by');

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    const origin = req.header('origin');
    if (origin && isAllowedCorsOrigin(origin, corsOriginsEnv)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      );
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }

    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }

    next();
  });

  app.use(express.json({ limit: '1mb' }));

  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (
      typeof err === 'object' &&
      err !== null &&
      'type' in err &&
      (err as { type?: string }).type === 'entity.parse.failed'
    ) {
      res.status(400).json({ error: 'Invalid JSON request body' });
      return;
    }
    next(err);
  });

  app.use(
    '/api',
    createApiRouter({
      store,
      port,
      gatewayConfig: {
        gatewayUrl,
        gatewaySecret,
        timeoutMs: options.gatewayTimeoutMs ?? 1500,
        fetchImpl: options.fetchImpl,
      },
    }),
  );

  if (fs.existsSync(clientDistDir)) {
    app.use(express.static(clientDistDir));
  }

  const indexHtmlPath = path.join(clientDistDir, 'index.html');
  app.use((req, res, next) => {
    if (
      (req.method === 'GET' || req.method === 'HEAD') &&
      !req.path.startsWith('/api') &&
      fs.existsSync(indexHtmlPath)
    ) {
      res.sendFile(indexHtmlPath);
      return;
    }
    next();
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    const message = err instanceof Error ? err.message : 'Internal server error';
    res.status(500).json({ error: message });
  });

  return {
    app,
    store,
    close: () => {
      store.close();
    },
  };
}
