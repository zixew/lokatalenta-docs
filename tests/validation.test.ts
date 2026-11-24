import { describe, expect, it } from 'vitest';
import {
  buildPlainExcerpt,
  validateCreateDocInput,
  validateCreateRubricInput,
  validateUpdateDocInput,
  validateUpdateRubricInput,
} from '../server/domain/validation.ts';
import { DOC_CATEGORIES } from '../server/domain/types.ts';

describe('Domain validation', () => {
  it('accepts all 7 canonical doc categories and valid fields', () => {
    for (const category of DOC_CATEGORIES) {
      const res = validateCreateDocInput({
        slug: `valid-slug-${category}`,
        title: `Title for ${category}`,
        category,
        divisionId: 'engineering',
        authorAgentId: 5,
        status: 'approved',
        tags: ['tag-1', 'tag-1', 'tag-2'],
        content: '# Heading\n\nBody text.',
      });
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.value.tags).toEqual(['tag-1', 'tag-2']);
      }
    }
  });

  it('rejects invalid slugs, divisions, categories, and agent bounds', () => {
    const cases = [
      { slug: '-bad-slug' },
      { slug: 'Bad_Slug' },
      { slug: 'bad--slug' },
      { category: 'unknown' },
      { divisionId: 'marketing' },
      { authorAgentId: -1 },
      { authorAgentId: 24 },
      { authorAgentId: 1.5 },
      { status: 'archived' },
      { content: '   ' },
      { content: 'hello\0world' },
    ];

    for (const patch of cases) {
      const res = validateCreateDocInput({
        slug: 'good-slug',
        title: 'Good Title',
        category: 'adr',
        divisionId: 'executive',
        authorAgentId: 0,
        content: 'Valid content',
        ...patch,
      });
      expect(res.ok).toBe(false);
    }
  });

  it('rejects slug mismatch in PUT validation', () => {
    const res = validateUpdateDocInput('adr-001', {
      slug: 'adr-002',
      title: 'Updated title',
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.details.some((d) => d.includes('slug'))).toBe(true);
    }
  });

  it('validates rubric criteria numeric bounds and rejects invalid values', () => {
    const valid = validateCreateRubricInput({
      title: 'Docs Workflow Rubric',
      workflowName: 'Documentation',
      ownerDivision: 'devops',
      ownerAgentId: 12,
      contractRef: 'cross-app-integration-contracts',
      backlogItemIds: ['ECO-1'],
      criteria: [
        {
          name: 'FTS5 Search',
          weight: 50,
          score: 45,
          maxScore: 50,
          status: 'pass',
          evidence: 'Verified',
        },
      ],
      overallStatus: 'pass',
      notes: 'Clean',
    });
    expect(valid.ok).toBe(true);

    const invalidCases = [
      { criteria: [] },
      { ownerDivision: 'invalid-div' },
      { ownerAgentId: 25 },
      { overallStatus: 'pending' },
      {
        criteria: [
          { name: 'Zero weight', weight: 0, score: 5, maxScore: 10, status: 'pass', evidence: '' },
        ],
      },
      {
        criteria: [
          { name: 'Zero max', weight: 10, score: 0, maxScore: 0, status: 'fail', evidence: '' },
        ],
      },
      {
        criteria: [
          { name: 'Negative score', weight: 10, score: -1, maxScore: 10, status: 'fail', evidence: '' },
        ],
      },
      {
        criteria: [
          { name: 'Exceeds max', weight: 10, score: 11, maxScore: 10, status: 'pass', evidence: '' },
        ],
      },
      {
        criteria: [
          { name: 'NaN weight', weight: Number.NaN, score: 5, maxScore: 10, status: 'pass', evidence: '' },
        ],
      },
    ];

    for (const patch of invalidCases) {
      const res = validateCreateRubricInput({
        title: 'Test',
        workflowName: 'Docs',
        ownerDivision: 'devops',
        ownerAgentId: 12,
        contractRef: 'contract-1',
        criteria: [
          { name: 'C1', weight: 10, score: 10, maxScore: 10, status: 'pass', evidence: '' },
        ],
        overallStatus: 'pass',
        ...patch,
      });
      expect(res.ok).toBe(false);
    }

    const idMismatch = validateUpdateRubricInput('r-1', {
      id: 'r-2',
      overallStatus: 'partial',
    });
    expect(idMismatch.ok).toBe(false);
  });

  it('builds plain excerpts stripping markdown syntax', () => {
    const excerpt = buildPlainExcerpt(
      '# Heading\n\nSee [contract](https://example.com) and `code`.\n```mermaid\ngraph TD;\n```',
    );
    expect(excerpt).toContain('Heading See contract and code.');
    expect(excerpt).not.toContain('```');
  });
});
