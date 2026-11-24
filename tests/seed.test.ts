import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { seedFromContentDir } from '../server/seed/seedLoader.ts';
import { DocsStore } from '../server/store/docsStore.ts';

describe('Starter content seed loader', () => {
  it('seeds content/docs and content/rubrics only when DB is empty and stays idempotent', () => {
    const contentDir = path.resolve(import.meta.dirname, '..', 'content');
    const store = new DocsStore(':memory:');

    try {
      expect(store.countDocs()).toBe(0);
      expect(store.countRubrics()).toBe(0);

      const first = seedFromContentDir(store, contentDir);
      expect(first.docsSeeded).toBeGreaterThanOrEqual(5);
      expect(first.rubricsSeeded).toBeGreaterThanOrEqual(1);

      const second = seedFromContentDir(store, contentDir);
      expect(second.docsSeeded).toBe(0);
      expect(second.rubricsSeeded).toBe(0);

      const docs = store.listDocs();
      expect(docs.some((d) => d.slug === 'ecosystem-architecture-overview')).toBe(true);
      expect(docs.some((d) => d.slug === 'adr-001-decoupled-multi-repo-event-gateway')).toBe(
        true,
      );

      const rubrics = store.listRubrics();
      expect(rubrics.some((r) => r.id === 'rubric-docs-baseline')).toBe(true);
    } finally {
      store.close();
    }
  });
});
