// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DocsWorkspacePage } from '../client/src/features/docs/DocsWorkspacePage.tsx';
import { docsApi } from '../client/src/shared/api/docsApi.ts';
import type {
  CanonicalAgent,
  CanonicalDivision,
  DocRecord,
  DocSummary,
} from '../client/src/shared/types/domain.ts';

const MOCK_DIVISIONS: CanonicalDivision[] = [
  {
    id: 'executive',
    name: 'Executive & Governance',
    shortName: 'Executive',
    motto: 'Quality gates',
    color: '#0F766E',
    threeColor: '#0F766E',
    defaultFloor: 3,
    defaultZone: 'workspace',
    agentIds: [0],
  },
  {
    id: 'architecture',
    name: 'Architecture',
    shortName: 'Architecture',
    motto: 'Clean boundaries',
    color: '#0F766E',
    threeColor: '#0F766E',
    defaultFloor: 2,
    defaultZone: 'workspace',
    agentIds: [4],
  },
  {
    id: 'engineering',
    name: 'Engineering',
    shortName: 'Engineering',
    motto: 'Zero slop',
    color: '#0F766E',
    threeColor: '#0F766E',
    defaultFloor: 2,
    defaultZone: 'workspace',
    agentIds: [5, 20],
  },
  {
    id: 'qa',
    name: 'Quality Assurance',
    shortName: 'QA',
    motto: '3-POV rigor',
    color: '#0F766E',
    threeColor: '#0F766E',
    defaultFloor: 1,
    defaultZone: 'workspace',
    agentIds: [8],
  },
  {
    id: 'devops',
    name: 'DevOps',
    shortName: 'DevOps',
    motto: 'Telemetry first',
    color: '#0F766E',
    threeColor: '#0F766E',
    defaultFloor: 1,
    defaultZone: 'workspace',
    agentIds: [11],
  },
];

const MOCK_AGENTS: CanonicalAgent[] = [
  {
    id: 0,
    name: 'Rizco Renova',
    shortName: 'Rizco Renova',
    role: 'Team Leader & Release Sign-Off Authority',
    divisionId: 'executive',
    category: 'lead',
    avatar: '👑',
    skills: { primary: [], stack: [] },
    methodology: [],
    certifications: [],
    defaultZone: 'workspace',
    defaultFloor: 3,
  },
  {
    id: 5,
    name: 'Farel Faza Nugraha',
    shortName: 'Faza Nugraha',
    role: 'Staff Frontend Engineer',
    divisionId: 'engineering',
    category: 'tech',
    avatar: '💻',
    skills: { primary: [], stack: [] },
    methodology: [],
    certifications: [],
    defaultZone: 'workspace',
    defaultFloor: 2,
  },
  {
    id: 8,
    name: 'Qaisar Al-Ghaffar',
    shortName: 'Qash Al-Ghaffar',
    role: 'QA Automation Lead',
    divisionId: 'qa',
    category: 'qa',
    avatar: '🤖',
    skills: { primary: [], stack: [] },
    methodology: [],
    certifications: [],
    defaultZone: 'workspace',
    defaultFloor: 1,
  },
  {
    id: 20,
    name: 'Nadia Maharani, S.Ds.',
    shortName: 'Nadia Maharani',
    role: 'Lead UI/UX Product Designer',
    divisionId: 'engineering',
    category: 'design',
    avatar: '🎨',
    skills: { primary: [], stack: [] },
    methodology: [],
    certifications: [],
    defaultZone: 'workspace',
    defaultFloor: 2,
  },
];

const MOCK_DOCS: DocRecord[] = [
  {
    slug: 'ecosystem-architecture-overview',
    title: 'Ecosystem Architecture Overview',
    category: 'architecture',
    divisionId: 'architecture',
    authorAgentId: 0,
    status: 'approved',
    tags: ['architecture'],
    content: '# Ecosystem Overview\n\n## Core Topology\n\nAll services are decoupled.',
    createdAt: '2026-11-24T10:00:00.000Z',
    updatedAt: '2026-11-24T10:00:00.000Z',
  },
  {
    slug: 'adr-001-event-gateway',
    title: 'ADR-001 Event Gateway',
    category: 'adr',
    divisionId: 'executive',
    authorAgentId: 0,
    status: 'approved',
    tags: ['adr'],
    content: '# ADR-001\n\nDecoupled gateway decision.',
    createdAt: '2026-11-24T10:00:00.000Z',
    updatedAt: '2026-11-24T10:00:00.000Z',
  },
  {
    slug: 'sop-charter-governance',
    title: 'SOP Charter Governance',
    category: 'charter',
    divisionId: 'executive',
    authorAgentId: 0,
    status: 'approved',
    tags: ['charter'],
    content: '# Charter\n\nDivision governance.',
    createdAt: '2026-11-24T10:00:00.000Z',
    updatedAt: '2026-11-24T10:00:00.000Z',
  },
  {
    slug: 'sprint-16-qa-grooming',
    title: 'Sprint 16 QA Grooming',
    category: 'grooming',
    divisionId: 'qa',
    authorAgentId: 8,
    status: 'reviewed',
    tags: ['grooming'],
    content: '# Grooming\n\n3-POV verification.',
    createdAt: '2026-11-24T10:00:00.000Z',
    updatedAt: '2026-11-24T10:00:00.000Z',
  },
  {
    slug: 'ops-runbook-ports',
    title: 'Ops Runbook Ports',
    category: 'runbook',
    divisionId: 'devops',
    authorAgentId: 5,
    status: 'draft',
    tags: ['runbook'],
    content: '# Runbook\n\nPort checks.',
    createdAt: '2026-11-24T10:00:00.000Z',
    updatedAt: '2026-11-24T10:00:00.000Z',
  },
];

function createStorageMock(): Storage {
  let store: Record<string, string> = {};
  return {
    get length() {
      return Object.keys(store).length;
    },
    clear() {
      store = {};
    },
    getItem(key: string) {
      return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
    },
    key(index: number) {
      return Object.keys(store)[index] ?? null;
    },
    removeItem(key: string) {
      delete store[key];
    },
    setItem(key: string, value: string) {
      store[key] = String(value);
    },
  };
}

function renderWorkspace(initialSlug = 'ecosystem-architecture-overview') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  let currentSlug: string | null = initialSlug;
  const onSelectSlug = vi.fn((slug: string | null) => {
    currentSlug = slug;
  });

  const utils = render(
    <QueryClientProvider client={queryClient}>
      <DocsWorkspacePage
        selectedSlug={currentSlug}
        onSelectSlug={onSelectSlug}
        categoryFilter=""
        divisionFilter=""
        onCategoryFilterChange={vi.fn()}
        onDivisionFilterChange={vi.fn()}
        divisions={MOCK_DIVISIONS}
        agents={MOCK_AGENTS}
      />
    </QueryClientProvider>,
  );

  return { ...utils, queryClient, onSelectSlug };
}

beforeEach(() => {
  Object.defineProperty(window, 'localStorage', {
    value: createStorageMock(),
    configurable: true,
    writable: true,
  });

  vi.spyOn(docsApi, 'listDocs').mockResolvedValue({
    docs: MOCK_DOCS.map<DocSummary>(
      ({ content: _content, ...summary }) => summary,
    ),
  });

  vi.spyOn(docsApi, 'getDoc').mockImplementation(async (slug: string) => {
    const found = MOCK_DOCS.find((d) => d.slug === slug) ?? MOCK_DOCS[0];
    return { doc: found };
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('DocsWorkspacePage Confluence features', () => {
  it('renders Space Tree with collapsible category folders and toggles to List view', async () => {
    renderWorkspace();

    const tree = await screen.findByTestId('docs-space-tree');
    expect(tree).toBeInTheDocument();
    expect(screen.getByTestId('space-count-architecture-adr')).toHaveTextContent('2');
    expect(screen.getByTestId('space-count-charter')).toHaveTextContent('1');
    expect(screen.getByTestId('space-count-grooming')).toHaveTextContent('1');
    expect(screen.getByTestId('space-count-runbook')).toHaveTextContent('1');

    // Collapse Architecture & ADRs folder
    const folderToggle = screen.getByTestId('space-folder-toggle-architecture-adr');
    expect(folderToggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(folderToggle);
    expect(folderToggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('doc-item-adr-001-event-gateway')).not.toBeInTheDocument();

    // Switch to flat List view
    fireEvent.click(screen.getByTestId('sidebar-view-list-btn'));
    expect(screen.queryByTestId('docs-space-tree')).not.toBeInTheDocument();
    expect(screen.getByTestId('docs-list')).toBeInTheDocument();
    expect(screen.getByTestId('doc-item-adr-001-event-gateway')).toBeInTheDocument();
  });

  it('toggles Starred pages, persists to localStorage, and filters by Starred pill', async () => {
    renderWorkspace();

    const starBtn = await screen.findByTestId('doc-star-btn');
    expect(starBtn).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(starBtn);
    expect(starBtn).toHaveAttribute('aria-pressed', 'true');

    const stored = JSON.parse(window.localStorage.getItem('lokatalenta-docs-starred') ?? '[]');
    expect(stored).toEqual(['ecosystem-architecture-overview']);

    // Filter sidebar by Starred pill
    const starredFilter = screen.getByTestId('docs-starred-filter');
    expect(starredFilter).toHaveTextContent('(1)');
    fireEvent.click(starredFilter);

    expect(screen.getByTestId('doc-item-ecosystem-architecture-overview')).toBeInTheDocument();
    expect(screen.queryByTestId('doc-item-ops-runbook-ports')).not.toBeInTheDocument();
  });

  it('displays Confluence breadcrumbs in viewer header and Blueprint Templates in create mode', async () => {
    renderWorkspace();

    const breadcrumbs = await screen.findByTestId('doc-breadcrumbs');
    expect(breadcrumbs).toHaveTextContent(
      'LokaTalenta Docs / Architecture / Ecosystem Architecture Overview',
    );

    // Open Create Document editor and verify Blueprint Templates
    fireEvent.click(screen.getByTestId('doc-new-btn'));
    const blueprintBar = await screen.findByTestId('doc-blueprint-bar');
    expect(within(blueprintBar).getByTestId('blueprint-btn-adr')).toBeInTheDocument();
    expect(within(blueprintBar).getByTestId('blueprint-btn-charter')).toBeInTheDocument();
    expect(within(blueprintBar).getByTestId('blueprint-btn-grooming')).toBeInTheDocument();
    expect(within(blueprintBar).getByTestId('blueprint-btn-runbook')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('blueprint-btn-grooming'));
    expect(screen.getByTestId('doc-input-category')).toHaveValue('grooming');
    const contentField = screen.getByTestId('doc-input-content') as HTMLTextAreaElement;
    expect(contentField.value).toContain('```mermaid');
    expect(contentField.value).toContain('3-POV Verification Matrix');
  });

  it('persists page-level review comments per slug in localStorage and supports delete', async () => {
    renderWorkspace();

    const commentsSection = await screen.findByTestId('doc-comments-section');
    expect(commentsSection).toHaveTextContent('0 comments');

    const authorSelect = screen.getByTestId('doc-comment-author') as HTMLSelectElement;
    expect(authorSelect.textContent).toContain('#0 Rizco Renova');
    expect(authorSelect.textContent).toContain('#5 Farel Faza Nugraha');
    expect(authorSelect.textContent).toContain('#8 Qaisar Al-Ghaffar');
    expect(authorSelect.textContent).toContain('#20 Nadia Maharani, S.Ds.');

    fireEvent.change(authorSelect, { target: { value: '20' } });
    fireEvent.change(screen.getByTestId('doc-comment-input'), {
      target: { value: 'Verified 1px border & 375px layout parity.' },
    });
    fireEvent.click(screen.getByTestId('doc-comment-submit'));

    expect(commentsSection).toHaveTextContent('1 comments');
    expect(commentsSection).toHaveTextContent('#20 Nadia Maharani, S.Ds.');
    expect(commentsSection).toHaveTextContent('Verified 1px border & 375px layout parity.');

    const persisted = JSON.parse(
      window.localStorage.getItem('lokatalenta-docs-comments') ?? '{}',
    ) as Record<string, Array<{ id: string; body: string }>>;
    const savedComment = persisted['ecosystem-architecture-overview']?.[0];
    expect(savedComment?.body).toBe('Verified 1px border & 375px layout parity.');

    fireEvent.click(screen.getByTestId(`doc-comment-delete-${savedComment.id}`));
    expect(commentsSection).toHaveTextContent('0 comments');
  });
});
