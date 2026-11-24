import { Router } from 'express';
import {
  CANONICAL_AGENTS,
  CANONICAL_COLLABORATION_PAIRS,
  CANONICAL_DIVISIONS,
  CANONICAL_SERVICES,
} from '../contracts/canonical.ts';
import type { DivisionId, DocCategory, DocStatus, RubricStatus } from '../domain/types.ts';
import {
  isValidRubricId,
  isValidSlug,
  validateCreateDocInput,
  validateCreateRubricInput,
  validateQueryFilter,
  validateUpdateDocInput,
  validateUpdateRubricInput,
} from '../domain/validation.ts';
import { emitGatewayEvent, type GatewayEmitterConfig } from '../gateway/emitter.ts';
import { DocsStore, DuplicateKeyError } from '../store/docsStore.ts';

export interface ApiRouterDeps {
  store: DocsStore;
  port: number;
  gatewayConfig: GatewayEmitterConfig;
}

export function createApiRouter(deps: ApiRouterDeps): Router {
  const router = Router();

  router.get('/health', (_req, res) => {
    res.status(200).json({
      ok: true,
      service: 'lokatalenta-docs',
      port: deps.port,
      timestamp: new Date().toISOString(),
    });
  });

  router.get('/contracts/canonical', (_req, res) => {
    res.status(200).json({
      divisions: CANONICAL_DIVISIONS,
      agents: CANONICAL_AGENTS,
      collaborationPairs: CANONICAL_COLLABORATION_PAIRS,
      ports: CANONICAL_SERVICES,
    });
  });

  router.get('/docs', (req, res) => {
    const categoryRes = validateQueryFilter(req.query.category, 'category');
    if (!categoryRes.ok) {
      res.status(400).json({ error: categoryRes.error });
      return;
    }

    const divisionRes = validateQueryFilter(req.query.division, 'division');
    if (!divisionRes.ok) {
      res.status(400).json({ error: divisionRes.error });
      return;
    }

    const statusRes = validateQueryFilter(req.query.status, 'docStatus');
    if (!statusRes.ok) {
      res.status(400).json({ error: statusRes.error });
      return;
    }

    const docs = deps.store.listDocs({
      category: categoryRes.value as DocCategory | undefined,
      division: divisionRes.value as DivisionId | undefined,
      status: statusRes.value as DocStatus | undefined,
    });

    res.status(200).json({ docs });
  });

  router.get('/docs/:slug', (req, res) => {
    const slug = String(req.params.slug ?? '');
    if (!isValidSlug(slug)) {
      res.status(400).json({ error: 'Invalid document slug format' });
      return;
    }

    const doc = deps.store.getDocBySlug(slug);
    if (!doc) {
      res.status(404).json({ error: `Document "${slug}" not found` });
      return;
    }

    res.status(200).json({ doc });
  });

  router.post('/docs', async (req, res) => {
    const validated = validateCreateDocInput(req.body);
    if (!validated.ok) {
      res.status(400).json({ error: 'Validation failed', details: validated.details });
      return;
    }

    try {
      const doc = deps.store.createDoc(validated.value);
      await emitGatewayEvent(deps.gatewayConfig, {
        action: 'doc.created',
        divisionId: doc.divisionId,
        agentId: doc.authorAgentId,
        entityId: doc.slug,
        title: `Doc created: ${doc.title}`,
        summary: `[${doc.category}] ${doc.title} (${doc.status})`,
        severity: doc.status === 'approved' ? 'success' : 'info',
        metadata: {
          slug: doc.slug,
          category: doc.category,
          status: doc.status,
        },
      });
      res.status(201).json({ doc });
    } catch (err) {
      if (err instanceof DuplicateKeyError) {
        res.status(409).json({ error: err.message });
        return;
      }
      throw err;
    }
  });

  router.put('/docs/:slug', async (req, res) => {
    const slug = String(req.params.slug ?? '');
    if (!isValidSlug(slug)) {
      res.status(400).json({ error: 'Invalid document slug format' });
      return;
    }

    const validated = validateUpdateDocInput(slug, req.body);
    if (!validated.ok) {
      res.status(400).json({ error: 'Validation failed', details: validated.details });
      return;
    }

    const doc = deps.store.updateDoc(slug, validated.value);
    if (!doc) {
      res.status(404).json({ error: `Document "${slug}" not found` });
      return;
    }

    await emitGatewayEvent(deps.gatewayConfig, {
      action: 'doc.updated',
      divisionId: doc.divisionId,
      agentId: doc.authorAgentId,
      entityId: doc.slug,
      title: `Doc updated: ${doc.title}`,
      summary: `[${doc.category}] ${doc.title} (${doc.status})`,
      severity: doc.status === 'approved' ? 'success' : 'info',
      metadata: {
        slug: doc.slug,
        category: doc.category,
        status: doc.status,
      },
    });

    res.status(200).json({ doc });
  });

  router.delete('/docs/:slug', async (req, res) => {
    const slug = String(req.params.slug ?? '');
    if (!isValidSlug(slug)) {
      res.status(400).json({ error: 'Invalid document slug format' });
      return;
    }

    const deleted = deps.store.deleteDoc(slug);
    if (!deleted) {
      res.status(404).json({ error: `Document "${slug}" not found` });
      return;
    }

    await emitGatewayEvent(deps.gatewayConfig, {
      action: 'doc.deleted',
      divisionId: deleted.divisionId,
      agentId: deleted.authorAgentId,
      entityId: deleted.slug,
      title: `Doc deleted: ${deleted.title}`,
      summary: `Removed [${deleted.category}] ${deleted.slug}`,
      severity: 'warning',
      metadata: {
        slug: deleted.slug,
        category: deleted.category,
      },
    });

    res.status(200).json({ ok: true, deletedSlug: deleted.slug });
  });

  router.get('/search', (req, res) => {
    const rawQuery = typeof req.query.q === 'string' ? req.query.q : '';
    const categoryRes = validateQueryFilter(req.query.category, 'category');
    if (!categoryRes.ok) {
      res.status(400).json({ error: categoryRes.error });
      return;
    }

    const divisionRes = validateQueryFilter(req.query.division, 'division');
    if (!divisionRes.ok) {
      res.status(400).json({ error: divisionRes.error });
      return;
    }

    const results = deps.store.searchDocs({
      q: rawQuery,
      category: categoryRes.value as DocCategory | undefined,
      division: divisionRes.value as DivisionId | undefined,
    });

    res.status(200).json({
      query: rawQuery.trim(),
      results,
    });
  });

  router.get('/rubrics', (req, res) => {
    const divisionRes = validateQueryFilter(req.query.division, 'division');
    if (!divisionRes.ok) {
      res.status(400).json({ error: divisionRes.error });
      return;
    }

    const statusRes = validateQueryFilter(req.query.status, 'rubricStatus');
    if (!statusRes.ok) {
      res.status(400).json({ error: statusRes.error });
      return;
    }

    const rubrics = deps.store.listRubrics({
      division: divisionRes.value as DivisionId | undefined,
      status: statusRes.value as RubricStatus | undefined,
    });

    res.status(200).json({ rubrics });
  });

  router.get('/rubrics/:id', (req, res) => {
    const id = String(req.params.id ?? '');
    if (!isValidRubricId(id)) {
      res.status(400).json({ error: 'Invalid rubric id format' });
      return;
    }

    const rubric = deps.store.getRubricById(id);
    if (!rubric) {
      res.status(404).json({ error: `Rubric "${id}" not found` });
      return;
    }

    res.status(200).json({ rubric });
  });

  router.post('/rubrics', async (req, res) => {
    const validated = validateCreateRubricInput(req.body);
    if (!validated.ok) {
      res.status(400).json({ error: 'Validation failed', details: validated.details });
      return;
    }

    try {
      const rubric = deps.store.createRubric(validated.value);
      await emitGatewayEvent(deps.gatewayConfig, {
        action: 'rubric.created',
        divisionId: rubric.ownerDivision,
        agentId: rubric.ownerAgentId,
        entityId: rubric.id,
        title: `Rubric created: ${rubric.workflowName}`,
        summary: `${rubric.title} (${rubric.overallStatus})`,
        severity:
          rubric.overallStatus === 'pass'
            ? 'success'
            : rubric.overallStatus === 'fail'
              ? 'warning'
              : 'info',
        metadata: {
          rubricId: rubric.id,
          workflowName: rubric.workflowName,
          overallStatus: rubric.overallStatus,
          contractRef: rubric.contractRef,
        },
      });
      res.status(201).json({ rubric });
    } catch (err) {
      if (err instanceof DuplicateKeyError) {
        res.status(409).json({ error: err.message });
        return;
      }
      throw err;
    }
  });

  router.put('/rubrics/:id', async (req, res) => {
    const id = String(req.params.id ?? '');
    if (!isValidRubricId(id)) {
      res.status(400).json({ error: 'Invalid rubric id format' });
      return;
    }

    const validated = validateUpdateRubricInput(id, req.body);
    if (!validated.ok) {
      res.status(400).json({ error: 'Validation failed', details: validated.details });
      return;
    }

    const rubric = deps.store.updateRubric(id, validated.value);
    if (!rubric) {
      res.status(404).json({ error: `Rubric "${id}" not found` });
      return;
    }

    await emitGatewayEvent(deps.gatewayConfig, {
      action: 'rubric.updated',
      divisionId: rubric.ownerDivision,
      agentId: rubric.ownerAgentId,
      entityId: rubric.id,
      title: `Rubric updated: ${rubric.workflowName}`,
      summary: `${rubric.title} (${rubric.overallStatus})`,
      severity:
        rubric.overallStatus === 'pass'
          ? 'success'
          : rubric.overallStatus === 'fail'
            ? 'warning'
            : 'info',
      metadata: {
        rubricId: rubric.id,
        workflowName: rubric.workflowName,
        overallStatus: rubric.overallStatus,
        contractRef: rubric.contractRef,
      },
    });

    res.status(200).json({ rubric });
  });

  router.use((_req, res) => {
    res.status(404).json({ error: 'API route not found' });
  });

  return router;
}
