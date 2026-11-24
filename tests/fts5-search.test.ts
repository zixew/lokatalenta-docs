import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DocsStore, buildSafeFtsQuery } from '../server/store/docsStore.ts';

describe('SQLite FTS5 search & trigger synchronization', () => {
  let store: DocsStore;

  beforeEach(() => {
    store = new DocsStore(':memory:');
    store.createDoc({
      slug: 'adr-001-gateway',
      title: 'ADR 001 Event Gateway Contract',
      category: 'adr',
      divisionId: 'architecture',
      authorAgentId: 4,
      status: 'approved',
      tags: ['gateway', 'websocket', 'telemetry'],
      content:
        'Hexagonal Event Gateway uses WebSocket and Server-Sent Events for real-time telemetry.',
    });
    store.createDoc({
      slug: 'runbook-ports',
      title: 'Operations Runbook Port Registry',
      category: 'runbook',
      divisionId: 'devops',
      authorAgentId: 11,
      status: 'reviewed',
      tags: ['ports', 'ops'],
      content: 'Documentation Hub runs on port 4104 with FTS5 indexing.',
    });
  });

  afterEach(() => {
    store.close();
  });

  it('ranks and highlights FTS5 matches and stays synced on update and delete', () => {
    const initial = store.searchDocs({ q: 'Hexagonal WebSocket' });
    expect(initial).toHaveLength(1);
    expect(initial[0].slug).toBe('adr-001-gateway');
    expect(initial[0].snippet).toContain('[[');
    expect(initial[0].snippet).toContain(']]');

    store.updateDoc('adr-001-gateway', {
      content: 'Updated architecture using Kafkaesque streaming bus.',
    });
    expect(store.searchDocs({ q: 'Hexagonal' })).toHaveLength(0);
    expect(store.searchDocs({ q: 'Kafkaesque' })).toHaveLength(1);

    store.deleteDoc('adr-001-gateway');
    expect(store.searchDocs({ q: 'Kafkaesque' })).toHaveLength(0);
  });

  it('never throws on adversarial punctuation, FTS operators, or SQLi payloads', () => {
    expect(buildSafeFtsQuery('   ')).toBeNull();
    expect(buildSafeFtsQuery('*** --- ::: "" ()')).toBeNull();

    const adversarialQueries = [
      '',
      '   ',
      '***',
      '---',
      '""',
      'a:b',
      '(test)',
      'AND OR NOT NEAR',
      "'; DROP TABLE docs;--",
      'gateway* OR (unknown:field)',
    ];

    for (const q of adversarialQueries) {
      const results = store.searchDocs({ q });
      expect(Array.isArray(results)).toBe(true);
    }
  });
});
