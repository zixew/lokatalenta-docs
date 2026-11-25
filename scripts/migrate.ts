import { DocsStore } from '../server/store/docsStore.ts';
import { docsTursoAdapter } from '../server/store/tursoAdapter.ts';

async function main(): Promise<void> {
  const startMs = Date.now();
  const store = new DocsStore(process.env.DOCS_DB_PATH || '/tmp/lokatalenta-docs.db');

  let tursoSynced = false;
  if (docsTursoAdapter.isConfigured) {
    await docsTursoAdapter.ensureSchema();
    tursoSynced = true;
  }

  const elapsedMs = Date.now() - startMs;
  console.log(
    JSON.stringify({
      ok: true,
      service: 'lokatalenta-docs',
      docsCount: store.listDocs().length,
      tursoSynced,
      elapsedMs,
    }),
  );
}

main().catch((err) => {
  console.error('[db:migrate] failed:', err);
  process.exitCode = 1;
});
