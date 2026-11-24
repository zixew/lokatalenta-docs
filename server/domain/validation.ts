import { randomUUID } from 'node:crypto';
import {
  CANONICAL_DIVISION_IDS,
  DOC_CATEGORIES,
  DOC_STATUSES,
  RUBRIC_STATUSES,
  type DivisionId,
  type DocCategory,
  type DocStatus,
  type RubricCriterion,
  type RubricStatus,
} from './types.ts';

export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const RUBRIC_ID_REGEX = /^[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*$/;

export interface ValidatedCreateDoc {
  slug: string;
  title: string;
  category: DocCategory;
  divisionId: DivisionId;
  authorAgentId: number;
  status: DocStatus;
  tags: string[];
  content: string;
}

export interface ValidatedUpdateDoc {
  title?: string;
  category?: DocCategory;
  divisionId?: DivisionId;
  authorAgentId?: number;
  status?: DocStatus;
  tags?: string[];
  content?: string;
}

export interface ValidatedCreateRubric {
  id: string;
  title: string;
  workflowName: string;
  ownerDivision: DivisionId;
  ownerAgentId: number;
  contractRef: string;
  backlogItemIds: string[];
  criteria: RubricCriterion[];
  overallStatus: RubricStatus;
  notes: string;
}

export interface ValidatedUpdateRubric {
  title?: string;
  workflowName?: string;
  ownerDivision?: DivisionId;
  ownerAgentId?: number;
  contractRef?: string;
  backlogItemIds?: string[];
  criteria?: RubricCriterion[];
  overallStatus?: RubricStatus;
  notes?: string;
}

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; details: string[] };

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isValidDivisionId(value: unknown): value is DivisionId {
  return (
    typeof value === 'string' &&
    (CANONICAL_DIVISION_IDS as readonly string[]).includes(value)
  );
}

export function isValidAgentId(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= 0 &&
    value <= 23
  );
}

export function isValidDocCategory(value: unknown): value is DocCategory {
  return (
    typeof value === 'string' &&
    (DOC_CATEGORIES as readonly string[]).includes(value)
  );
}

export function isValidDocStatus(value: unknown): value is DocStatus {
  return (
    typeof value === 'string' &&
    (DOC_STATUSES as readonly string[]).includes(value)
  );
}

export function isValidRubricStatus(value: unknown): value is RubricStatus {
  return (
    typeof value === 'string' &&
    (RUBRIC_STATUSES as readonly string[]).includes(value)
  );
}

export function isValidSlug(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length >= 1 &&
    value.length <= 120 &&
    SLUG_REGEX.test(value)
  );
}

export function isValidRubricId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length >= 1 &&
    value.length <= 80 &&
    RUBRIC_ID_REGEX.test(value)
  );
}

function validateNonEmptyString(
  value: unknown,
  field: string,
  maxLength: number,
  details: string[],
): string | null {
  if (typeof value !== 'string') {
    details.push(`${field} must be a string`);
    return null;
  }
  if (value.includes('\0')) {
    details.push(`${field} must not contain null bytes`);
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    details.push(`${field} must not be empty`);
    return null;
  }
  if (trimmed.length > maxLength) {
    details.push(`${field} must be at most ${maxLength} characters`);
    return null;
  }
  return trimmed;
}

function validateStringArray(
  value: unknown,
  field: string,
  maxItems: number,
  maxItemLen: number,
  details: string[],
): string[] | null {
  if (!Array.isArray(value)) {
    details.push(`${field} must be an array of strings`);
    return null;
  }
  if (value.length > maxItems) {
    details.push(`${field} must have at most ${maxItems} items`);
    return null;
  }
  const out: string[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < value.length; i++) {
    const item = value[i];
    if (typeof item !== 'string' || item.includes('\0')) {
      details.push(`${field}[${i}] must be a valid string`);
      return null;
    }
    const trimmed = item.trim();
    if (trimmed.length === 0 || trimmed.length > maxItemLen) {
      details.push(`${field}[${i}] must be 1..${maxItemLen} characters`);
      return null;
    }
    if (!seen.has(trimmed)) {
      seen.add(trimmed);
      out.push(trimmed);
    }
  }
  return out;
}

export function validateCreateDocInput(body: unknown): ValidationResult<ValidatedCreateDoc> {
  if (!isPlainObject(body)) {
    return { ok: false, details: ['Request body must be a JSON object'] };
  }

  const details: string[] = [];

  if (!isValidSlug(body.slug)) {
    details.push('slug must match ^[a-z0-9]+(?:-[a-z0-9]+)*$ (1..120 chars)');
  }

  const title = validateNonEmptyString(body.title, 'title', 200, details);

  if (!isValidDocCategory(body.category)) {
    details.push(`category must be one of: ${DOC_CATEGORIES.join(', ')}`);
  }

  if (!isValidDivisionId(body.divisionId)) {
    details.push(`divisionId must be one of: ${CANONICAL_DIVISION_IDS.join(', ')}`);
  }

  if (!isValidAgentId(body.authorAgentId)) {
    details.push('authorAgentId must be an integer between 0 and 23');
  }

  let status: DocStatus = 'draft';
  if (body.status !== undefined) {
    if (!isValidDocStatus(body.status)) {
      details.push(`status must be one of: ${DOC_STATUSES.join(', ')}`);
    } else {
      status = body.status;
    }
  }

  let tags: string[] = [];
  if (body.tags !== undefined) {
    const parsedTags = validateStringArray(body.tags, 'tags', 20, 40, details);
    if (parsedTags) tags = parsedTags;
  }

  let content: string | null = null;
  if (typeof body.content !== 'string') {
    details.push('content must be a non-empty Markdown string');
  } else if (body.content.includes('\0')) {
    details.push('content must not contain null bytes');
  } else if (body.content.trim().length === 0) {
    details.push('content must not be empty');
  } else if (body.content.length > 200_000) {
    details.push('content must be at most 200000 characters');
  } else {
    content = body.content;
  }

  if (details.length > 0 || !title || content === null) {
    return { ok: false, details };
  }

  return {
    ok: true,
    value: {
      slug: body.slug as string,
      title,
      category: body.category as DocCategory,
      divisionId: body.divisionId as DivisionId,
      authorAgentId: body.authorAgentId as number,
      status,
      tags,
      content,
    },
  };
}

export function validateUpdateDocInput(
  paramSlug: string,
  body: unknown,
): ValidationResult<ValidatedUpdateDoc> {
  if (!isPlainObject(body)) {
    return { ok: false, details: ['Request body must be a JSON object'] };
  }

  const details: string[] = [];
  const update: ValidatedUpdateDoc = {};
  let hasUpdatableField = false;

  if (body.slug !== undefined && body.slug !== paramSlug) {
    details.push('slug in body cannot differ from route parameter');
  }

  if (body.title !== undefined) {
    hasUpdatableField = true;
    const title = validateNonEmptyString(body.title, 'title', 200, details);
    if (title) update.title = title;
  }

  if (body.category !== undefined) {
    hasUpdatableField = true;
    if (!isValidDocCategory(body.category)) {
      details.push(`category must be one of: ${DOC_CATEGORIES.join(', ')}`);
    } else {
      update.category = body.category;
    }
  }

  if (body.divisionId !== undefined) {
    hasUpdatableField = true;
    if (!isValidDivisionId(body.divisionId)) {
      details.push(`divisionId must be one of: ${CANONICAL_DIVISION_IDS.join(', ')}`);
    } else {
      update.divisionId = body.divisionId;
    }
  }

  if (body.authorAgentId !== undefined) {
    hasUpdatableField = true;
    if (!isValidAgentId(body.authorAgentId)) {
      details.push('authorAgentId must be an integer between 0 and 23');
    } else {
      update.authorAgentId = body.authorAgentId;
    }
  }

  if (body.status !== undefined) {
    hasUpdatableField = true;
    if (!isValidDocStatus(body.status)) {
      details.push(`status must be one of: ${DOC_STATUSES.join(', ')}`);
    } else {
      update.status = body.status;
    }
  }

  if (body.tags !== undefined) {
    hasUpdatableField = true;
    const parsedTags = validateStringArray(body.tags, 'tags', 20, 40, details);
    if (parsedTags) update.tags = parsedTags;
  }

  if (body.content !== undefined) {
    hasUpdatableField = true;
    if (typeof body.content !== 'string') {
      details.push('content must be a non-empty Markdown string');
    } else if (body.content.includes('\0')) {
      details.push('content must not contain null bytes');
    } else if (body.content.trim().length === 0) {
      details.push('content must not be empty');
    } else if (body.content.length > 200_000) {
      details.push('content must be at most 200000 characters');
    } else {
      update.content = body.content;
    }
  }

  if (!hasUpdatableField) {
    details.push('At least one updatable field must be provided');
  }

  if (details.length > 0) {
    return { ok: false, details };
  }

  return { ok: true, value: update };
}

function validateRubricCriteria(
  rawCriteria: unknown,
  details: string[],
): RubricCriterion[] | null {
  if (!Array.isArray(rawCriteria) || rawCriteria.length === 0) {
    details.push('criteria must be a non-empty array with at least 1 criterion');
    return null;
  }
  if (rawCriteria.length > 50) {
    details.push('criteria must have at most 50 items');
    return null;
  }

  const parsed: RubricCriterion[] = [];
  for (let i = 0; i < rawCriteria.length; i++) {
    const item = rawCriteria[i];
    if (!isPlainObject(item)) {
      details.push(`criteria[${i}] must be an object`);
      continue;
    }

    const name = validateNonEmptyString(item.name, `criteria[${i}].name`, 160, details);

    if (
      typeof item.weight !== 'number' ||
      !Number.isFinite(item.weight) ||
      item.weight <= 0 ||
      item.weight > 1000
    ) {
      details.push(`criteria[${i}].weight must be a finite number > 0`);
    }

    if (
      typeof item.maxScore !== 'number' ||
      !Number.isFinite(item.maxScore) ||
      item.maxScore <= 0
    ) {
      details.push(`criteria[${i}].maxScore must be a finite number > 0`);
    }

    if (typeof item.score !== 'number' || !Number.isFinite(item.score) || item.score < 0) {
      details.push(`criteria[${i}].score must be a finite number >= 0`);
    } else if (
      typeof item.maxScore === 'number' &&
      Number.isFinite(item.maxScore) &&
      item.score > item.maxScore
    ) {
      details.push(`criteria[${i}].score cannot exceed maxScore`);
    }

    if (!isValidRubricStatus(item.status)) {
      details.push(`criteria[${i}].status must be one of: ${RUBRIC_STATUSES.join(', ')}`);
    }

    let evidence = '';
    if (item.evidence !== undefined) {
      if (typeof item.evidence !== 'string' || item.evidence.includes('\0')) {
        details.push(`criteria[${i}].evidence must be a string`);
      } else if (item.evidence.length > 1000) {
        details.push(`criteria[${i}].evidence must be at most 1000 characters`);
      } else {
        evidence = item.evidence.trim();
      }
    }

    if (name && details.length === 0) {
      parsed.push({
        name,
        weight: item.weight as number,
        score: item.score as number,
        maxScore: item.maxScore as number,
        status: item.status as RubricStatus,
        evidence,
      });
    } else if (
      name &&
      typeof item.weight === 'number' &&
      Number.isFinite(item.weight) &&
      item.weight > 0 &&
      typeof item.maxScore === 'number' &&
      Number.isFinite(item.maxScore) &&
      item.maxScore > 0 &&
      typeof item.score === 'number' &&
      Number.isFinite(item.score) &&
      item.score >= 0 &&
      item.score <= item.maxScore &&
      isValidRubricStatus(item.status)
    ) {
      parsed.push({
        name,
        weight: item.weight,
        score: item.score,
        maxScore: item.maxScore,
        status: item.status,
        evidence,
      });
    }
  }

  return details.length === 0 ? parsed : null;
}

function slugifyWorkflow(workflowName: string): string {
  const cleaned = workflowName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return cleaned || 'workflow';
}

export function validateCreateRubricInput(
  body: unknown,
): ValidationResult<ValidatedCreateRubric> {
  if (!isPlainObject(body)) {
    return { ok: false, details: ['Request body must be a JSON object'] };
  }

  const details: string[] = [];

  const title = validateNonEmptyString(body.title, 'title', 200, details);
  const workflowName = validateNonEmptyString(body.workflowName, 'workflowName', 120, details);

  let id: string;
  if (body.id === undefined || body.id === '') {
    const base = slugifyWorkflow(workflowName ?? 'rubric');
    id = `rubric-${base}-${randomUUID().slice(0, 8)}`;
  } else if (!isValidRubricId(body.id)) {
    details.push('id must match ^[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*$ (1..80 chars)');
    id = '';
  } else {
    id = body.id;
  }

  if (!isValidDivisionId(body.ownerDivision)) {
    details.push(`ownerDivision must be one of: ${CANONICAL_DIVISION_IDS.join(', ')}`);
  }

  if (!isValidAgentId(body.ownerAgentId)) {
    details.push('ownerAgentId must be an integer between 0 and 23');
  }

  const contractRef = validateNonEmptyString(body.contractRef, 'contractRef', 200, details);

  let backlogItemIds: string[] = [];
  if (body.backlogItemIds !== undefined) {
    const parsedIds = validateStringArray(
      body.backlogItemIds,
      'backlogItemIds',
      50,
      40,
      details,
    );
    if (parsedIds) backlogItemIds = parsedIds;
  }

  const criteria = validateRubricCriteria(body.criteria, details);

  if (!isValidRubricStatus(body.overallStatus)) {
    details.push(`overallStatus must be one of: ${RUBRIC_STATUSES.join(', ')}`);
  }

  let notes = '';
  if (body.notes !== undefined) {
    if (typeof body.notes !== 'string' || body.notes.includes('\0')) {
      details.push('notes must be a string');
    } else if (body.notes.length > 5000) {
      details.push('notes must be at most 5000 characters');
    } else {
      notes = body.notes.trim();
    }
  }

  if (details.length > 0 || !title || !workflowName || !contractRef || !criteria) {
    return { ok: false, details };
  }

  return {
    ok: true,
    value: {
      id,
      title,
      workflowName,
      ownerDivision: body.ownerDivision as DivisionId,
      ownerAgentId: body.ownerAgentId as number,
      contractRef,
      backlogItemIds,
      criteria,
      overallStatus: body.overallStatus as RubricStatus,
      notes,
    },
  };
}

export function validateUpdateRubricInput(
  paramId: string,
  body: unknown,
): ValidationResult<ValidatedUpdateRubric> {
  if (!isPlainObject(body)) {
    return { ok: false, details: ['Request body must be a JSON object'] };
  }

  const details: string[] = [];
  const update: ValidatedUpdateRubric = {};
  let hasField = false;

  if (body.id !== undefined && body.id !== paramId) {
    details.push('id in body cannot differ from route parameter');
  }

  if (body.title !== undefined) {
    hasField = true;
    const title = validateNonEmptyString(body.title, 'title', 200, details);
    if (title) update.title = title;
  }

  if (body.workflowName !== undefined) {
    hasField = true;
    const workflowName = validateNonEmptyString(body.workflowName, 'workflowName', 120, details);
    if (workflowName) update.workflowName = workflowName;
  }

  if (body.ownerDivision !== undefined) {
    hasField = true;
    if (!isValidDivisionId(body.ownerDivision)) {
      details.push(`ownerDivision must be one of: ${CANONICAL_DIVISION_IDS.join(', ')}`);
    } else {
      update.ownerDivision = body.ownerDivision;
    }
  }

  if (body.ownerAgentId !== undefined) {
    hasField = true;
    if (!isValidAgentId(body.ownerAgentId)) {
      details.push('ownerAgentId must be an integer between 0 and 23');
    } else {
      update.ownerAgentId = body.ownerAgentId;
    }
  }

  if (body.contractRef !== undefined) {
    hasField = true;
    const contractRef = validateNonEmptyString(body.contractRef, 'contractRef', 200, details);
    if (contractRef) update.contractRef = contractRef;
  }

  if (body.backlogItemIds !== undefined) {
    hasField = true;
    const parsedIds = validateStringArray(
      body.backlogItemIds,
      'backlogItemIds',
      50,
      40,
      details,
    );
    if (parsedIds) update.backlogItemIds = parsedIds;
  }

  if (body.criteria !== undefined) {
    hasField = true;
    const criteria = validateRubricCriteria(body.criteria, details);
    if (criteria) update.criteria = criteria;
  }

  if (body.overallStatus !== undefined) {
    hasField = true;
    if (!isValidRubricStatus(body.overallStatus)) {
      details.push(`overallStatus must be one of: ${RUBRIC_STATUSES.join(', ')}`);
    } else {
      update.overallStatus = body.overallStatus;
    }
  }

  if (body.notes !== undefined) {
    hasField = true;
    if (typeof body.notes !== 'string' || body.notes.includes('\0')) {
      details.push('notes must be a string');
    } else if (body.notes.length > 5000) {
      details.push('notes must be at most 5000 characters');
    } else {
      update.notes = body.notes.trim();
    }
  }

  if (!hasField) {
    details.push('At least one updatable field must be provided');
  }

  if (details.length > 0) {
    return { ok: false, details };
  }

  return { ok: true, value: update };
}

export function validateQueryFilter(
  raw: unknown,
  kind: 'category' | 'division' | 'docStatus' | 'rubricStatus',
): { ok: true; value: string | undefined } | { ok: false; error: string } {
  if (raw === undefined || raw === '') {
    return { ok: true, value: undefined };
  }
  if (typeof raw !== 'string') {
    return { ok: false, error: `Query parameter ${kind} must be a string` };
  }
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: undefined };

  if (kind === 'category' && !isValidDocCategory(trimmed)) {
    return { ok: false, error: `Invalid category: ${trimmed}` };
  }
  if (kind === 'division' && !isValidDivisionId(trimmed)) {
    return { ok: false, error: `Invalid division: ${trimmed}` };
  }
  if (kind === 'docStatus' && !isValidDocStatus(trimmed)) {
    return { ok: false, error: `Invalid status: ${trimmed}` };
  }
  if (kind === 'rubricStatus' && !isValidRubricStatus(trimmed)) {
    return { ok: false, error: `Invalid status: ${trimmed}` };
  }

  return { ok: true, value: trimmed };
}

export function buildPlainExcerpt(markdown: string, maxLength = 220): string {
  const plain = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_~>|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= maxLength) {
    return plain;
  }
  return `${plain.slice(0, maxLength - 3).trimEnd()}...`;
}
