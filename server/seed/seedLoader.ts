import fs from 'node:fs';
import path from 'node:path';
import {
  validateCreateDocInput,
  validateCreateRubricInput,
} from '../domain/validation.ts';
import { DocsStore, DuplicateKeyError } from '../store/docsStore.ts';

interface ParsedMarkdownFrontmatter {
  meta: Record<string, unknown>;
  body: string;
}

export function parseMarkdownWithFrontmatter(raw: string): ParsedMarkdownFrontmatter {
  const normalized = raw.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---\n')) {
    return { meta: {}, body: normalized.trim() };
  }

  const endMarker = normalized.indexOf('\n---\n', 4);
  if (endMarker === -1) {
    return { meta: {}, body: normalized.trim() };
  }

  const headerText = normalized.slice(4, endMarker);
  const body = normalized.slice(endMarker + 5).trim();
  const meta: Record<string, unknown> = {};

  for (const line of headerText.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;

    const key = trimmed.slice(0, colonIdx).trim();
    const rawVal = trimmed.slice(colonIdx + 1).trim();

    if (rawVal.startsWith('[') && rawVal.endsWith(']')) {
      const inner = rawVal.slice(1, -1).trim();
      meta[key] = inner
        ? inner
            .split(',')
            .map((item) => item.trim().replace(/^["']|["']$/g, ''))
            .filter(Boolean)
        : [];
    } else if (/^\d+$/.test(rawVal)) {
      meta[key] = Number(rawVal);
    } else {
      meta[key] = rawVal.replace(/^["']|["']$/g, '');
    }
  }

  return { meta, body };
}

export interface SeedSummary {
  docsSeeded: number;
  rubricsSeeded: number;
}

export function seedFromContentDir(store: DocsStore, contentDir: string): SeedSummary {
  let docsSeeded = 0;
  let rubricsSeeded = 0;

  if (!fs.existsSync(contentDir)) {
    return { docsSeeded, rubricsSeeded };
  }

  const docsDir = path.join(contentDir, 'docs');
  if (store.countDocs() === 0 && fs.existsSync(docsDir)) {
    const files = fs
      .readdirSync(docsDir)
      .filter((f) => f.endsWith('.md'))
      .sort();

    store.runInTransaction(() => {
      for (const file of files) {
        const filePath = path.join(docsDir, file);
        const raw = fs.readFileSync(filePath, 'utf8');
        const { meta, body } = parseMarkdownWithFrontmatter(raw);
        const slugFallback = file.replace(/\.md$/, '');
        const candidate = {
          slug: meta.slug ?? slugFallback,
          title: meta.title ?? slugFallback,
          category: meta.category ?? 'architecture',
          divisionId: meta.divisionId ?? 'architecture',
          authorAgentId: meta.authorAgentId ?? 12,
          status: meta.status ?? 'approved',
          tags: meta.tags ?? [],
          content: body,
        };

        const validated = validateCreateDocInput(candidate);
        if (!validated.ok) {
          throw new Error(
            `Invalid seed document ${file}: ${validated.details.join('; ')}`,
          );
        }

        try {
          store.createDoc(validated.value);
          docsSeeded++;
        } catch (err) {
          if (!(err instanceof DuplicateKeyError)) {
            throw err;
          }
        }
      }
    });
  }

  const rubricsDir = path.join(contentDir, 'rubrics');
  if (store.countRubrics() === 0 && fs.existsSync(rubricsDir)) {
    const files = fs
      .readdirSync(rubricsDir)
      .filter((f) => f.endsWith('.json'))
      .sort();

    store.runInTransaction(() => {
      for (const file of files) {
        const filePath = path.join(rubricsDir, file);
        const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as unknown;
        const validated = validateCreateRubricInput(parsed);
        if (!validated.ok) {
          throw new Error(
            `Invalid seed rubric ${file}: ${validated.details.join('; ')}`,
          );
        }

        try {
          store.createRubric(validated.value);
          rubricsSeeded++;
        } catch (err) {
          if (!(err instanceof DuplicateKeyError)) {
            throw err;
          }
        }
      }
    });
  }

  return { docsSeeded, rubricsSeeded };
}
