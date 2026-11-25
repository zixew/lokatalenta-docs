import { createClient, type Client, type InStatement } from '@libsql/client';

export interface TursoConfig {
  readonly url: string;
  readonly authToken?: string;
}

export interface TursoHealthStatus {
  readonly configured: boolean;
  readonly healthy: boolean;
  readonly latencyMs: number | null;
  readonly error?: string;
}

export function loadTursoConfig(env: NodeJS.ProcessEnv = process.env): TursoConfig | null {
  const url = env.TURSO_DATABASE_URL?.trim();
  if (!url) {
    return null;
  }
  const authToken = env.TURSO_AUTH_TOKEN?.trim() || undefined;
  return { url, authToken };
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxAttempts?: number; baseDelayMs?: number } = {},
): Promise<T> {
  const maxAttempts = options.maxAttempts ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 150;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await sleep(baseDelayMs * 2 ** (attempt - 1));
      }
    }
  }
  throw lastError;
}

export class DocsTursoAdapter {
  private readonly config: TursoConfig | null;
  private readonly client: Client | null;

  constructor(config: TursoConfig | null = loadTursoConfig()) {
    this.config = config;
    this.client = config
      ? createClient({
          url: config.url,
          authToken: config.authToken,
        })
      : null;
  }

  get isConfigured(): boolean {
    return this.client !== null;
  }

  get url(): string | null {
    return this.config?.url ?? null;
  }

  async checkHealth(): Promise<TursoHealthStatus> {
    if (!this.client) {
      return { configured: false, healthy: false, latencyMs: null };
    }
    const start = Date.now();
    try {
      await withRetry(() => this.client!.execute('SELECT 1 AS ok'), {
        maxAttempts: 2,
        baseDelayMs: 50,
      });
      return {
        configured: true,
        healthy: true,
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return {
        configured: true,
        healthy: false,
        latencyMs: Date.now() - start,
        error: error instanceof Error ? error.message : 'Turso health check failed',
      };
    }
  }

  async ensureSchema(): Promise<void> {
    if (!this.client) return;
    const statements: InStatement[] = [
      `CREATE TABLE IF NOT EXISTS docs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        category TEXT NOT NULL,
        division_id TEXT NOT NULL,
        author_agent_id INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        tags_json TEXT NOT NULL DEFAULT '[]',
        tags_text TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS rubrics (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        workflow_name TEXT NOT NULL,
        owner_division TEXT NOT NULL,
        owner_agent_id INTEGER NOT NULL,
        contract_ref TEXT NOT NULL DEFAULT '',
        backlog_item_ids_json TEXT NOT NULL DEFAULT '[]',
        criteria_json TEXT NOT NULL DEFAULT '[]',
        overall_status TEXT NOT NULL DEFAULT 'pending',
        notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
    ];
    await withRetry(() => this.client!.batch(statements, 'write'));
  }
}

export const docsTursoAdapter = new DocsTursoAdapter();
