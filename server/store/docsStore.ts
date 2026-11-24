import { DatabaseSync } from 'node:sqlite';
import type {
  DivisionId,
  DocCategory,
  DocRecord,
  DocSearchResult,
  DocStatus,
  DocSummary,
  RubricCriterion,
  RubricRecord,
  RubricStatus,
} from '../domain/types.ts';
import {
  buildPlainExcerpt,
  type ValidatedCreateDoc,
  type ValidatedCreateRubric,
  type ValidatedUpdateDoc,
  type ValidatedUpdateRubric,
} from '../domain/validation.ts';

export class DuplicateKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateKeyError';
  }
}

interface DocRow {
  id: number;
  slug: string;
  title: string;
  category: DocCategory;
  division_id: DivisionId;
  author_agent_id: number;
  status: DocStatus;
  tags_json: string;
  tags_text: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface RubricRow {
  id: string;
  title: string;
  workflow_name: string;
  owner_division: DivisionId;
  owner_agent_id: number;
  contract_ref: string;
  backlog_item_ids_json: string;
  criteria_json: string;
  overall_status: RubricStatus;
  notes: string;
  created_at: string;
  updated_at: string;
}

export function buildSafeFtsQuery(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const tokens = trimmed
    .match(/[\p{L}\p{N}_]+/gu)
    ?.map((t) => t.slice(0, 64))
    .filter(Boolean)
    .slice(0, 12);

  if (!tokens || tokens.length === 0) return null;

  return tokens
    .map((tok) => {
      const escaped = `"${tok.replace(/"/g, '""')}"`;
      return tok.length >= 2 ? `${escaped}*` : escaped;
    })
    .join(' ');
}

function escapeLikePattern(term: string): string {
  return term.replace(/[\\%_]/g, '\\$&');
}

function parseJsonStringArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.map((v) => String(v)) : [];
  } catch {
    return [];
  }
}

function parseRubricCriteria(raw: string): RubricCriterion[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as RubricCriterion[]) : [];
  } catch {
    return [];
  }
}

function rowToDocRecord(row: DocRow): DocRecord {
  return {
    slug: row.slug,
    title: row.title,
    category: row.category,
    divisionId: row.division_id,
    authorAgentId: row.author_agent_id,
    status: row.status,
    tags: parseJsonStringArray(row.tags_json),
    content: row.content,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToDocSummary(row: DocRow): DocSummary {
  return {
    slug: row.slug,
    title: row.title,
    category: row.category,
    divisionId: row.division_id,
    authorAgentId: row.author_agent_id,
    status: row.status,
    tags: parseJsonStringArray(row.tags_json),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    excerpt: buildPlainExcerpt(row.content),
  };
}

function rowToRubricRecord(row: RubricRow): RubricRecord {
  return {
    id: row.id,
    title: row.title,
    workflowName: row.workflow_name,
    ownerDivision: row.owner_division,
    ownerAgentId: row.owner_agent_id,
    contractRef: row.contract_ref,
    backlogItemIds: parseJsonStringArray(row.backlog_item_ids_json),
    criteria: parseRubricCriteria(row.criteria_json),
    overallStatus: row.overall_status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class DocsStore {
  private readonly db: DatabaseSync;

  constructor(dbPath: string = ':memory:') {
    this.db = new DatabaseSync(dbPath, { timeout: 5000 });
    this.db.exec('PRAGMA foreign_keys = ON;');
    this.db.exec('PRAGMA busy_timeout = 5000;');
    if (dbPath !== ':memory:') {
      this.db.exec('PRAGMA journal_mode = WAL;');
    }
    this.migrate();
  }

  private migrate(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS docs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        category TEXT NOT NULL CHECK (category IN ('architecture', 'adr', 'contract', 'charter', 'grooming', 'rubric', 'runbook')),
        division_id TEXT NOT NULL CHECK (division_id IN ('executive', 'architecture', 'engineering', 'qa', 'devops', 'lounge')),
        author_agent_id INTEGER NOT NULL CHECK (author_agent_id BETWEEN 0 AND 23),
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'reviewed', 'approved')),
        tags_json TEXT NOT NULL DEFAULT '[]',
        tags_text TEXT NOT NULL DEFAULT '',
        content TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_docs_category ON docs(category);
      CREATE INDEX IF NOT EXISTS idx_docs_division ON docs(division_id);
      CREATE INDEX IF NOT EXISTS idx_docs_status ON docs(status);
      CREATE INDEX IF NOT EXISTS idx_docs_updated_at ON docs(updated_at DESC);

      CREATE VIRTUAL TABLE IF NOT EXISTS docs_fts USING fts5(
        slug,
        title,
        category,
        tags_text,
        content,
        content='docs',
        content_rowid='id',
        tokenize='unicode61 remove_diacritics 2'
      );

      CREATE TRIGGER IF NOT EXISTS docs_ai AFTER INSERT ON docs BEGIN
        INSERT INTO docs_fts(rowid, slug, title, category, tags_text, content)
        VALUES (new.id, new.slug, new.title, new.category, new.tags_text, new.content);
      END;

      CREATE TRIGGER IF NOT EXISTS docs_ad AFTER DELETE ON docs BEGIN
        INSERT INTO docs_fts(docs_fts, rowid, slug, title, category, tags_text, content)
        VALUES ('delete', old.id, old.slug, old.title, old.category, old.tags_text, old.content);
      END;

      CREATE TRIGGER IF NOT EXISTS docs_au AFTER UPDATE ON docs BEGIN
        INSERT INTO docs_fts(docs_fts, rowid, slug, title, category, tags_text, content)
        VALUES ('delete', old.id, old.slug, old.title, old.category, old.tags_text, old.content);
        INSERT INTO docs_fts(rowid, slug, title, category, tags_text, content)
        VALUES (new.id, new.slug, new.title, new.category, new.tags_text, new.content);
      END;

      CREATE TABLE IF NOT EXISTS rubrics (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        workflow_name TEXT NOT NULL,
        owner_division TEXT NOT NULL CHECK (owner_division IN ('executive', 'architecture', 'engineering', 'qa', 'devops', 'lounge')),
        owner_agent_id INTEGER NOT NULL CHECK (owner_agent_id BETWEEN 0 AND 23),
        contract_ref TEXT NOT NULL,
        backlog_item_ids_json TEXT NOT NULL DEFAULT '[]',
        criteria_json TEXT NOT NULL,
        overall_status TEXT NOT NULL CHECK (overall_status IN ('pass', 'partial', 'fail')),
        notes TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_rubrics_division ON rubrics(owner_division);
      CREATE INDEX IF NOT EXISTS idx_rubrics_status ON rubrics(overall_status);
    `);
  }

  close(): void {
    this.db.close();
  }

  countDocs(): number {
    const row = this.db.prepare('SELECT COUNT(*) AS count FROM docs').get() as { count: number };
    return row.count;
  }

  countRubrics(): number {
    const row = this.db.prepare('SELECT COUNT(*) AS count FROM rubrics').get() as { count: number };
    return row.count;
  }

  runInTransaction<T>(fn: () => T): T {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const result = fn();
      this.db.exec('COMMIT');
      return result;
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  listDocs(filters?: {
    category?: DocCategory;
    division?: DivisionId;
    status?: DocStatus;
  }): DocSummary[] {
    const clauses: string[] = [];
    const params: Array<string> = [];

    if (filters?.category) {
      clauses.push('category = ?');
      params.push(filters.category);
    }
    if (filters?.division) {
      clauses.push('division_id = ?');
      params.push(filters.division);
    }
    if (filters?.status) {
      clauses.push('status = ?');
      params.push(filters.status);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const sql = `SELECT * FROM docs ${where} ORDER BY updated_at DESC, id DESC`;
    const rows = this.db.prepare(sql).all(...params) as unknown as DocRow[];
    return rows.map(rowToDocSummary);
  }

  getDocBySlug(slug: string): DocRecord | null {
    const row = this.db
      .prepare('SELECT * FROM docs WHERE slug = ?')
      .get(slug) as unknown as DocRow | undefined;
    return row ? rowToDocRecord(row) : null;
  }

  createDoc(input: ValidatedCreateDoc, nowIso = new Date().toISOString()): DocRecord {
    const existing = this.getDocBySlug(input.slug);
    if (existing) {
      throw new DuplicateKeyError(`Document with slug "${input.slug}" already exists`);
    }

    const tagsJson = JSON.stringify(input.tags);
    const tagsText = input.tags.join(' ');

    try {
      this.db
        .prepare(
          `INSERT INTO docs (
            slug, title, category, division_id, author_agent_id,
            status, tags_json, tags_text, content, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          input.slug,
          input.title,
          input.category,
          input.divisionId,
          input.authorAgentId,
          input.status,
          tagsJson,
          tagsText,
          input.content,
          nowIso,
          nowIso,
        );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('UNIQUE constraint failed')) {
        throw new DuplicateKeyError(`Document with slug "${input.slug}" already exists`);
      }
      throw err;
    }

    const created = this.getDocBySlug(input.slug);
    if (!created) {
      throw new Error('Failed to load newly created document');
    }
    return created;
  }

  updateDoc(
    slug: string,
    input: ValidatedUpdateDoc,
    nowIso = new Date().toISOString(),
  ): DocRecord | null {
    const existing = this.getDocBySlug(slug);
    if (!existing) {
      return null;
    }

    const nextTitle = input.title ?? existing.title;
    const nextCategory = input.category ?? existing.category;
    const nextDivision = input.divisionId ?? existing.divisionId;
    const nextAuthor = input.authorAgentId ?? existing.authorAgentId;
    const nextStatus = input.status ?? existing.status;
    const nextTags = input.tags ?? existing.tags;
    const nextContent = input.content ?? existing.content;

    this.db
      .prepare(
        `UPDATE docs SET
          title = ?,
          category = ?,
          division_id = ?,
          author_agent_id = ?,
          status = ?,
          tags_json = ?,
          tags_text = ?,
          content = ?,
          updated_at = ?
        WHERE slug = ?`,
      )
      .run(
        nextTitle,
        nextCategory,
        nextDivision,
        nextAuthor,
        nextStatus,
        JSON.stringify(nextTags),
        nextTags.join(' '),
        nextContent,
        nowIso,
        slug,
      );

    return this.getDocBySlug(slug);
  }

  deleteDoc(slug: string): DocRecord | null {
    const existing = this.getDocBySlug(slug);
    if (!existing) {
      return null;
    }
    this.db.prepare('DELETE FROM docs WHERE slug = ?').run(slug);
    return existing;
  }

  searchDocs(params: {
    q: string;
    category?: DocCategory;
    division?: DivisionId;
  }): DocSearchResult[] {
    const ftsQuery = buildSafeFtsQuery(params.q);
    if (!ftsQuery) {
      return [];
    }

    const extraClauses: string[] = [];
    const extraParams: string[] = [];
    if (params.category) {
      extraClauses.push('d.category = ?');
      extraParams.push(params.category);
    }
    if (params.division) {
      extraClauses.push('d.division_id = ?');
      extraParams.push(params.division);
    }
    const extraWhere =
      extraClauses.length > 0 ? `AND ${extraClauses.join(' AND ')}` : '';

    try {
      const sql = `
        SELECT
          d.slug,
          d.title,
          d.category,
          d.division_id,
          d.author_agent_id,
          d.status,
          d.tags_json,
          d.updated_at,
          bm25(docs_fts, 2.0, 4.0, 1.0, 2.5, 1.0) AS rank,
          snippet(docs_fts, 4, '[[', ']]', '...', 24) AS snippet
        FROM docs_fts
        JOIN docs d ON d.id = docs_fts.rowid
        WHERE docs_fts MATCH ? ${extraWhere}
        ORDER BY rank ASC, d.updated_at DESC
        LIMIT 50
      `;

      const rows = this.db.prepare(sql).all(ftsQuery, ...extraParams) as unknown as Array<{
        slug: string;
        title: string;
        category: DocCategory;
        division_id: DivisionId;
        author_agent_id: number;
        status: DocStatus;
        tags_json: string;
        updated_at: string;
        rank: number;
        snippet: string | null;
      }>;

      return rows.map((row) => ({
        slug: row.slug,
        title: row.title,
        category: row.category,
        divisionId: row.division_id,
        authorAgentId: row.author_agent_id,
        status: row.status,
        tags: parseJsonStringArray(row.tags_json),
        updatedAt: row.updated_at,
        rank: Number.isFinite(row.rank) ? row.rank : 0,
        snippet: row.snippet ?? '',
      }));
    } catch {
      const normalized = params.q.trim().toLowerCase();
      const pattern = `%${escapeLikePattern(normalized)}%`;
      const likeWhere = extraClauses.length > 0 ? `AND ${extraClauses.join(' AND ')}` : '';
      const fallbackSql = `
        SELECT d.*
        FROM docs d
        WHERE (
          LOWER(d.title) LIKE ? ESCAPE '\\'
          OR LOWER(d.content) LIKE ? ESCAPE '\\'
          OR LOWER(d.tags_text) LIKE ? ESCAPE '\\'
          OR LOWER(d.slug) LIKE ? ESCAPE '\\'
        ) ${likeWhere}
        ORDER BY d.updated_at DESC
        LIMIT 50
      `;
      const rows = this.db
        .prepare(fallbackSql)
        .all(pattern, pattern, pattern, pattern, ...extraParams) as unknown as DocRow[];

      return rows.map((row) => ({
        slug: row.slug,
        title: row.title,
        category: row.category,
        divisionId: row.division_id,
        authorAgentId: row.author_agent_id,
        status: row.status,
        tags: parseJsonStringArray(row.tags_json),
        updatedAt: row.updated_at,
        rank: 0,
        snippet: buildPlainExcerpt(row.content, 160),
      }));
    }
  }

  listRubrics(filters?: {
    division?: DivisionId;
    status?: RubricStatus;
  }): RubricRecord[] {
    const clauses: string[] = [];
    const params: string[] = [];

    if (filters?.division) {
      clauses.push('owner_division = ?');
      params.push(filters.division);
    }
    if (filters?.status) {
      clauses.push('overall_status = ?');
      params.push(filters.status);
    }

    const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
    const sql = `SELECT * FROM rubrics ${where} ORDER BY updated_at DESC, id ASC`;
    const rows = this.db.prepare(sql).all(...params) as unknown as RubricRow[];
    return rows.map(rowToRubricRecord);
  }

  getRubricById(id: string): RubricRecord | null {
    const row = this.db
      .prepare('SELECT * FROM rubrics WHERE id = ?')
      .get(id) as unknown as RubricRow | undefined;
    return row ? rowToRubricRecord(row) : null;
  }

  createRubric(input: ValidatedCreateRubric, nowIso = new Date().toISOString()): RubricRecord {
    const existing = this.getRubricById(input.id);
    if (existing) {
      throw new DuplicateKeyError(`Rubric with id "${input.id}" already exists`);
    }

    try {
      this.db
        .prepare(
          `INSERT INTO rubrics (
            id, title, workflow_name, owner_division, owner_agent_id,
            contract_ref, backlog_item_ids_json, criteria_json,
            overall_status, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run(
          input.id,
          input.title,
          input.workflowName,
          input.ownerDivision,
          input.ownerAgentId,
          input.contractRef,
          JSON.stringify(input.backlogItemIds),
          JSON.stringify(input.criteria),
          input.overallStatus,
          input.notes,
          nowIso,
          nowIso,
        );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('UNIQUE constraint failed')) {
        throw new DuplicateKeyError(`Rubric with id "${input.id}" already exists`);
      }
      throw err;
    }

    const created = this.getRubricById(input.id);
    if (!created) {
      throw new Error('Failed to load newly created rubric');
    }
    return created;
  }

  updateRubric(
    id: string,
    input: ValidatedUpdateRubric,
    nowIso = new Date().toISOString(),
  ): RubricRecord | null {
    const existing = this.getRubricById(id);
    if (!existing) {
      return null;
    }

    const nextTitle = input.title ?? existing.title;
    const nextWorkflow = input.workflowName ?? existing.workflowName;
    const nextDivision = input.ownerDivision ?? existing.ownerDivision;
    const nextAgent = input.ownerAgentId ?? existing.ownerAgentId;
    const nextContractRef = input.contractRef ?? existing.contractRef;
    const nextBacklogIds = input.backlogItemIds ?? existing.backlogItemIds;
    const nextCriteria = input.criteria ?? existing.criteria;
    const nextStatus = input.overallStatus ?? existing.overallStatus;
    const nextNotes = input.notes ?? existing.notes;

    this.db
      .prepare(
        `UPDATE rubrics SET
          title = ?,
          workflow_name = ?,
          owner_division = ?,
          owner_agent_id = ?,
          contract_ref = ?,
          backlog_item_ids_json = ?,
          criteria_json = ?,
          overall_status = ?,
          notes = ?,
          updated_at = ?
        WHERE id = ?`,
      )
      .run(
        nextTitle,
        nextWorkflow,
        nextDivision,
        nextAgent,
        nextContractRef,
        JSON.stringify(nextBacklogIds),
        JSON.stringify(nextCriteria),
        nextStatus,
        nextNotes,
        nowIso,
        id,
      );

    return this.getRubricById(id);
  }
}
