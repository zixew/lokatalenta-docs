import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  Folder,
  FolderOpen,
  FolderTree,
  List,
  ListTree,
  MessageSquare,
  Pencil,
  Plus,
  Save,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { docsApi } from '../../shared/api/docsApi.ts';
import {
  CANONICAL_DIVISION_IDS,
  DOC_CATEGORIES,
  DOC_STATUSES,
  type CanonicalAgent,
  type CanonicalDivision,
  type DivisionId,
  type DocCategory,
  type DocStatus,
  type DocSummary,
} from '../../shared/types/domain.ts';
import { Badge, type BadgeTone } from '../../shared/ui/Badge.tsx';
import { Button } from '../../shared/ui/Button.tsx';
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog.tsx';
import { extractHeadings, SafeMarkdown } from '../../shared/ui/SafeMarkdown.tsx';

interface DocsWorkspacePageProps {
  selectedSlug: string | null;
  onSelectSlug: (slug: string | null) => void;
  categoryFilter: DocCategory | '';
  divisionFilter: DivisionId | '';
  onCategoryFilterChange: (val: DocCategory | '') => void;
  onDivisionFilterChange: (val: DivisionId | '') => void;
  divisions: CanonicalDivision[];
  agents: CanonicalAgent[];
}

const STARRED_STORAGE_KEY = 'lokatalenta-docs-starred';
const COMMENTS_STORAGE_KEY = 'lokatalenta-docs-comments';

type BlueprintId = 'adr' | 'charter' | 'grooming' | 'runbook';

interface DocBlueprint {
  id: BlueprintId;
  label: string;
  category: DocCategory;
  divisionId: DivisionId;
  defaultTitle: string;
  defaultTags: string;
  content: string;
}

interface SpaceGroup {
  id: string;
  label: string;
  categories: readonly DocCategory[];
}

interface DocComment {
  id: string;
  authorAgentId: number;
  authorLabel: string;
  body: string;
  createdAt: string;
}

const SPACE_GROUPS: readonly SpaceGroup[] = [
  {
    id: 'architecture-adr',
    label: 'Architecture & ADRs',
    categories: ['architecture', 'adr'],
  },
  {
    id: 'charter',
    label: 'Charters & SOPs',
    categories: ['charter'],
  },
  {
    id: 'grooming',
    label: 'QA & Grooming',
    categories: ['grooming'],
  },
  {
    id: 'runbook',
    label: 'Runbooks',
    categories: ['runbook'],
  },
  {
    id: 'contract',
    label: 'Contracts',
    categories: ['contract'],
  },
  {
    id: 'rubric',
    label: 'Rubrics',
    categories: ['rubric'],
  },
];

const DOC_BLUEPRINTS: readonly DocBlueprint[] = [
  {
    id: 'adr',
    label: 'ADR',
    category: 'adr',
    divisionId: 'architecture',
    defaultTitle: 'ADR-XXX: Architecture Decision Title',
    defaultTags: 'adr, architecture, decision',
    content: [
      '# ADR-XXX: Architecture Decision Title',
      '',
      '## Status',
      'Proposed — Pending Architecture & Executive Review.',
      '',
      '## Context',
      'Describe the technical constraints, ecosystem contracts, and trade-offs driving this decision.',
      '',
      '## Decision',
      'State the chosen approach clearly and reference affected repositories or ports.',
      '',
      '```mermaid',
      'flowchart LR',
      '  Client["Client Request"] --> Gateway["API / Event Gateway"]',
      '  Gateway --> Store["SQLite + FTS5 Store"]',
      '```',
      '',
      '## Consequences',
      '- **Positive:** Clear boundary ownership and zero cross-repo coupling.',
      '- **Mitigation:** Validate contract schema in CI before merge.',
      '',
    ].join('\n'),
  },
  {
    id: 'charter',
    label: 'SOP Charter',
    category: 'charter',
    divisionId: 'executive',
    defaultTitle: 'SOP Charter: Division Governance & Handoff Protocol',
    defaultTags: 'sop, charter, governance, divisions',
    content: [
      '# SOP Charter: Division Governance & Handoff Protocol',
      '',
      '## Purpose & Scope',
      'Define division ownership, quality gates, and sign-off responsibilities across the 6-division matrix.',
      '',
      '## Division Ownership Matrix',
      '| Gate | Owner | Deliverable | Verification |',
      '| --- | --- | --- | --- |',
      '| Design & Spec | #4 Architecture | ADR + Mermaid | Peer review |',
      '| Implementation | #5 Engineering | PR + Unit Tests | Typecheck & build |',
      '| Release Sign-Off | #0 Rizco Renova | QA 3-POV Pass | Zero regressions |',
      '',
      '```mermaid',
      'flowchart TD',
      '  Spec["1. Spec Approved"] --> Build["2. Build & Test"]',
      '  Build --> QA["3. QA 3-POV Audit"]',
      '  QA --> Release["4. Release Sign-Off"]',
      '```',
      '',
    ].join('\n'),
  },
  {
    id: 'grooming',
    label: 'QA Grooming',
    category: 'grooming',
    divisionId: 'qa',
    defaultTitle: 'Sprint Grooming: 3-POV QA & Risk Verification Plan',
    defaultTags: 'qa, grooming, 3-pov, verification',
    content: [
      '# Sprint Grooming: 3-POV QA & Risk Verification Plan',
      '',
      '## Acceptance Criteria',
      '- Zero horizontal overflow on 375px mobile viewports.',
      '- Dark and light mode contrast parity verified across all interactive states.',
      '- All unit, API, and build checks pass with zero skipped assertions.',
      '',
      '## 3-POV Verification Matrix',
      '| POV | Focus | Target Viewport | Owner |',
      '| --- | --- | --- | --- |',
      '| Functional | CRUD, Filters, Persistence | Desktop & Mobile | #8 Qaisar |',
      '| Visual / UX | 1px Borders, #0F766E Teal | 375px / 1280px | #20 Nadia Maharani |',
      '| Security | XSS Sanitization & Bounds | Automated Vitest | #12 DevOps / Sec |',
      '',
      '```mermaid',
      'sequenceDiagram',
      '  participant Dev as Engineering',
      '  participant QA as QA Division',
      '  participant Lead as Release Lead',
      '  Dev->>QA: Submit PR + Build Artifact',
      '  QA->>Lead: Report 3-POV Pass Matrix',
      '```',
      '',
    ].join('\n'),
  },
  {
    id: 'runbook',
    label: 'Runbook',
    category: 'runbook',
    divisionId: 'devops',
    defaultTitle: 'Operations Runbook: Service Healthcheck & Incident Triage',
    defaultTags: 'runbook, devops, operations, telemetry',
    content: [
      '# Operations Runbook: Service Healthcheck & Incident Triage',
      '',
      '## Pre-Flight Checks',
      '1. Verify `/api/health` returns `200 OK` with SQLite status.',
      '2. Confirm `lokatalenta-docs` build artifact and environment variables.',
      '',
      '## Triage Workflow',
      '```mermaid',
      'flowchart LR',
      '  Alert["Alert Triggered"] --> Health{"/api/health OK?"}',
      '  Health -- No --> Restart["Inspect Logs & Restart"]',
      '  Health -- Yes --> Trace["Check Event Gateway & DB"]',
      '  Restart --> Verify["Confirm Recovery"]',
      '  Trace --> Verify',
      '```',
      '',
      '## Rollback & Escalation',
      '- Escalate unresolved P1 incidents to `#11` DevOps Lead and `#0` Rizco Renova.',
      '',
    ].join('\n'),
  },
];

const FALLBACK_COMMENT_AUTHORS: ReadonlyArray<{ id: number; label: string }> = [
  { id: 0, label: '#0 Rizco Renova (executive)' },
  { id: 5, label: '#5 Farel Faza Nugraha (engineering)' },
  { id: 8, label: '#8 Qaisar Al-Ghaffar (qa)' },
  { id: 20, label: '#20 Nadia Maharani, S.Ds. (engineering)' },
];

const CATEGORY_LABELS: Record<DocCategory, string> = {
  architecture: 'Architecture',
  adr: 'ADR',
  contract: 'Contract',
  charter: 'Charter',
  grooming: 'Grooming',
  rubric: 'Rubric',
  runbook: 'Runbook',
};

const STATUS_TONE: Record<DocStatus, BadgeTone> = {
  draft: 'amber',
  reviewed: 'blue',
  approved: 'emerald',
};

function slugifyTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function readStarredSlugs(): string[] {
  try {
    const raw = window.localStorage.getItem(STARRED_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function writeStarredSlugs(slugs: string[]): void {
  try {
    window.localStorage.setItem(STARRED_STORAGE_KEY, JSON.stringify(slugs));
  } catch {
    // Ignore storage quota or private browsing failures
  }
}

function readCommentsBySlug(): Record<string, DocComment[]> {
  try {
    const raw = window.localStorage.getItem(COMMENTS_STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {};
    }
    const result: Record<string, DocComment[]> = {};
    for (const [slug, list] of Object.entries(parsed)) {
      if (!Array.isArray(list)) continue;
      result[slug] = list.filter(
        (item): item is DocComment =>
          Boolean(item) &&
          typeof item === 'object' &&
          typeof (item as DocComment).id === 'string' &&
          typeof (item as DocComment).authorAgentId === 'number' &&
          typeof (item as DocComment).authorLabel === 'string' &&
          typeof (item as DocComment).body === 'string' &&
          typeof (item as DocComment).createdAt === 'string',
      );
    }
    return result;
  } catch {
    return {};
  }
}

function writeCommentsBySlug(comments: Record<string, DocComment[]>): void {
  try {
    window.localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(comments));
  } catch {
    // Ignore storage quota or private browsing failures
  }
}

export function DocsWorkspacePage({
  selectedSlug,
  onSelectSlug,
  categoryFilter,
  divisionFilter,
  onCategoryFilterChange,
  onDivisionFilterChange,
  divisions,
  agents,
}: DocsWorkspacePageProps) {
  const queryClient = useQueryClient();
  const [editorMode, setEditorMode] = useState<'none' | 'create' | 'edit'>('none');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null);
  const [mobileTocOpen, setMobileTocOpen] = useState(false);

  // Confluence workspace state: Space Tree vs List, Starred pages, Page-level comments
  const [sidebarView, setSidebarView] = useState<'tree' | 'list'>('tree');
  const [starredOnly, setStarredOnly] = useState(false);
  const [starredSlugs, setStarredSlugs] = useState<string[]>(() => readStarredSlugs());
  const [collapsedSpaces, setCollapsedSpaces] = useState<Record<string, boolean>>({});
  const [selectedBlueprint, setSelectedBlueprint] = useState<BlueprintId | null>(null);
  const [commentsBySlug, setCommentsBySlug] = useState<Record<string, DocComment[]>>(() =>
    readCommentsBySlug(),
  );
  const [commentAuthorId, setCommentAuthorId] = useState<number>(0);
  const [commentBody, setCommentBody] = useState('');

  const [slugInput, setSlugInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<DocCategory>('architecture');
  const [divisionInput, setDivisionInput] = useState<DivisionId>('architecture');
  const [agentInput, setAgentInput] = useState<number>(4);
  const [statusInput, setStatusInput] = useState<DocStatus>('draft');
  const [tagsInput, setTagsInput] = useState('');
  const [contentInput, setContentInput] = useState('');

  const docsQuery = useQuery({
    queryKey: ['docs', categoryFilter, divisionFilter],
    queryFn: () =>
      docsApi.listDocs({
        category: categoryFilter,
        division: divisionFilter,
      }),
  });

  const docsList = useMemo(
    () => docsQuery.data?.docs ?? [],
    [docsQuery.data?.docs],
  );

  const starredSet = useMemo(() => new Set(starredSlugs), [starredSlugs]);

  const filteredDocsList = useMemo(
    () => (starredOnly ? docsList.filter((d) => starredSet.has(d.slug)) : docsList),
    [docsList, starredOnly, starredSet],
  );

  const starredCountInDocs = useMemo(
    () => docsList.filter((d) => starredSet.has(d.slug)).length,
    [docsList, starredSet],
  );

  const spaceSections = useMemo(
    () =>
      SPACE_GROUPS.map((group) => ({
        ...group,
        docs: filteredDocsList.filter((doc) => group.categories.includes(doc.category)),
      })).filter((group) => group.docs.length > 0),
    [filteredDocsList],
  );

  const commentAuthors = useMemo(() => {
    if (agents.length > 0) {
      return agents.map((a) => ({
        id: a.id,
        label: `#${a.id} ${a.name} (${a.divisionId})`,
      }));
    }
    return FALLBACK_COMMENT_AUTHORS;
  }, [agents]);

  const effectiveCommentAuthorId = commentAuthors.some((a) => a.id === commentAuthorId)
    ? commentAuthorId
    : (commentAuthors[0]?.id ?? 0);

  useEffect(() => {
    if (editorMode !== 'none') return;
    if (!selectedSlug && docsList.length > 0) {
      onSelectSlug(docsList[0].slug);
    } else if (
      selectedSlug &&
      docsList.length > 0 &&
      !docsList.some((d) => d.slug === selectedSlug)
    ) {
      onSelectSlug(docsList[0].slug);
    }
  }, [docsList, selectedSlug, editorMode, onSelectSlug]);

  const activeDocQuery = useQuery({
    queryKey: ['doc', selectedSlug],
    queryFn: () => docsApi.getDoc(selectedSlug as string),
    enabled: Boolean(selectedSlug) && editorMode !== 'create',
  });

  const activeDoc = activeDocQuery.data?.doc ?? null;

  const agentsById = useMemo(
    () => new Map(agents.map((a) => [a.id, a])),
    [agents],
  );
  const divisionsById = useMemo(
    () => new Map(divisions.map((d) => [d.id, d])),
    [divisions],
  );

  const createMutation = useMutation({
    mutationFn: docsApi.createDoc,
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['docs'] });
      void queryClient.invalidateQueries({ queryKey: ['doc', res.doc.slug] });
      onSelectSlug(res.doc.slug);
      setEditorMode('none');
      setFormError(null);
    },
    onError: (err: Error) => {
      setFormError(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { slug: string; payload: Parameters<typeof docsApi.updateDoc>[1] }) =>
      docsApi.updateDoc(vars.slug, vars.payload),
    onSuccess: (res) => {
      void queryClient.invalidateQueries({ queryKey: ['docs'] });
      void queryClient.invalidateQueries({ queryKey: ['doc', res.doc.slug] });
      setEditorMode('none');
      setFormError(null);
    },
    onError: (err: Error) => {
      setFormError(err.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: docsApi.deleteDoc,
    onSuccess: () => {
      setDeleteOpen(false);
      onSelectSlug(null);
      void queryClient.invalidateQueries({ queryKey: ['docs'] });
    },
  });

  function toggleStar(slug: string) {
    setStarredSlugs((prev) => {
      const next = prev.includes(slug)
        ? prev.filter((item) => item !== slug)
        : [...prev, slug];
      writeStarredSlugs(next);
      return next;
    });
  }

  function toggleSpace(spaceId: string) {
    setCollapsedSpaces((prev) => ({
      ...prev,
      [spaceId]: !prev[spaceId],
    }));
  }

  function applyBlueprint(blueprint: DocBlueprint) {
    const isDefaultOrEmptyTitle =
      !titleInput.trim() || DOC_BLUEPRINTS.some((bp) => bp.defaultTitle === titleInput);
    setSelectedBlueprint(blueprint.id);
    setCategoryInput(blueprint.category);
    setDivisionInput(blueprint.divisionId);
    setTagsInput(blueprint.defaultTags);
    setContentInput(blueprint.content);
    if (isDefaultOrEmptyTitle) {
      setTitleInput(blueprint.defaultTitle);
      setSlugInput(slugifyTitle(blueprint.defaultTitle));
    }
  }

  function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!activeDoc) return;
    const trimmed = commentBody.trim();
    if (!trimmed) return;
    const author =
      commentAuthors.find((a) => a.id === effectiveCommentAuthorId) ?? commentAuthors[0];
    const newComment: DocComment = {
      id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      authorAgentId: author?.id ?? 0,
      authorLabel: author?.label ?? '#0 Rizco Renova (executive)',
      body: trimmed,
      createdAt: new Date().toISOString(),
    };
    setCommentsBySlug((prev) => {
      const next = {
        ...prev,
        [activeDoc.slug]: [...(prev[activeDoc.slug] ?? []), newComment],
      };
      writeCommentsBySlug(next);
      return next;
    });
    setCommentBody('');
  }

  function handleDeleteComment(slug: string, commentId: string) {
    setCommentsBySlug((prev) => {
      const existing = prev[slug] ?? [];
      const next = {
        ...prev,
        [slug]: existing.filter((c) => c.id !== commentId),
      };
      writeCommentsBySlug(next);
      return next;
    });
  }

  function openCreateEditor() {
    setFormError(null);
    setSelectedBlueprint(null);
    setSlugInput('');
    setTitleInput('');
    setCategoryInput(categoryFilter || 'architecture');
    setDivisionInput(divisionFilter || 'architecture');
    setAgentInput(12);
    setStatusInput('draft');
    setTagsInput('architecture, ecosystem');
    setContentInput(
      '# New Document\n\nDescribe the architectural decision, contract, or runbook here.\n',
    );
    setEditorMode('create');
  }

  function openEditEditor() {
    if (!activeDoc) return;
    setFormError(null);
    setSelectedBlueprint(null);
    setSlugInput(activeDoc.slug);
    setTitleInput(activeDoc.title);
    setCategoryInput(activeDoc.category);
    setDivisionInput(activeDoc.divisionId);
    setAgentInput(activeDoc.authorAgentId);
    setStatusInput(activeDoc.status);
    setTagsInput(activeDoc.tags.join(', '));
    setContentInput(activeDoc.content);
    setEditorMode('edit');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (editorMode === 'create') {
      const effectiveSlug = slugInput.trim() || slugifyTitle(titleInput);
      createMutation.mutate({
        slug: effectiveSlug,
        title: titleInput.trim(),
        category: categoryInput,
        divisionId: divisionInput,
        authorAgentId: Number(agentInput),
        status: statusInput,
        tags: parsedTags,
        content: contentInput,
      });
    } else if (editorMode === 'edit' && activeDoc) {
      updateMutation.mutate({
        slug: activeDoc.slug,
        payload: {
          title: titleInput.trim(),
          category: categoryInput,
          divisionId: divisionInput,
          authorAgentId: Number(agentInput),
          status: statusInput,
          tags: parsedTags,
          content: contentInput,
        },
      });
    }
  }

  const authorAgent = activeDoc ? agentsById.get(activeDoc.authorAgentId) : undefined;
  const ownerDivision = activeDoc ? divisionsById.get(activeDoc.divisionId) : undefined;
  const headings = useMemo(
    () => (activeDoc ? extractHeadings(activeDoc.content) : []),
    [activeDoc],
  );

  useEffect(() => {
    setCopied(false);
    setActiveHeadingId(headings[0]?.id ?? null);
    setMobileTocOpen(false);
  }, [activeDoc?.slug, headings]);

  async function handleCopyMarkdown() {
    if (!activeDoc) return;
    try {
      await navigator.clipboard.writeText(activeDoc.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable in non-secure context
    }
  }

  function jumpToHeading(id: string) {
    setActiveHeadingId(id);
    setMobileTocOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  const isActiveDocStarred = activeDoc ? starredSet.has(activeDoc.slug) : false;
  const activeDocComments = activeDoc ? commentsBySlug[activeDoc.slug] ?? [] : [];

  function renderDocListItem(doc: DocSummary, compact = false) {
    const isActive = doc.slug === selectedSlug && editorMode !== 'create';
    const isStarred = starredSet.has(doc.slug);
    return (
      <li key={doc.slug}>
        <div
          className={`flex items-start gap-1.5 rounded-lg border transition-all duration-200 ease-out ${
            compact ? 'p-2.5' : 'p-3'
          } ${
            isActive
              ? 'border-[#0F766E]/40 bg-teal-50/70 dark:border-teal-700 dark:bg-teal-950/40'
              : 'border-[#E5E3DC] bg-white hover:bg-[#F6F5F1]/70 dark:border-zinc-800 dark:bg-[#161B22] dark:hover:bg-zinc-800/50'
          }`}
        >
          <button
            type="button"
            data-testid={`doc-item-${doc.slug}`}
            onClick={() => {
              setEditorMode('none');
              onSelectSlug(doc.slug);
            }}
            className="min-w-0 flex-1 text-left"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="line-clamp-2 min-w-0 break-words text-xs font-semibold text-[#18181B] dark:text-slate-100">
                {doc.title}
              </span>
              <Badge tone={STATUS_TONE[doc.status]}>{doc.status}</Badge>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge tone="teal">{CATEGORY_LABELS[doc.category]}</Badge>
              <Badge tone="slate">{doc.divisionId}</Badge>
            </div>
          </button>

          <button
            type="button"
            onClick={() => toggleStar(doc.slug)}
            aria-pressed={isStarred}
            aria-label={isStarred ? `Unstar ${doc.title}` : `Star ${doc.title}`}
            data-testid={`doc-sidebar-star-${doc.slug}`}
            title={isStarred ? 'Remove star' : 'Star page'}
            className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition-colors ${
              isStarred
                ? 'border-amber-300 bg-amber-50 text-amber-500 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-400'
                : 'border-transparent text-zinc-400 hover:border-[#E5E3DC] hover:bg-[#F6F5F1] hover:text-amber-500 dark:text-slate-500 dark:hover:border-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-amber-400'
            }`}
          >
            <Star className={`h-3.5 w-3.5 ${isStarred ? 'fill-current' : ''}`} />
          </button>
        </div>
      </li>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Sidebar Directory */}
      <aside className="min-w-0 lg:col-span-4 xl:col-span-3">
        <div className="rounded-xl border border-[#E5E3DC] bg-white p-4 dark:border-zinc-800 dark:bg-[#161B22]">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[#18181B] dark:text-slate-100">
              Document Directory
            </h2>
            <Button
              variant="primary"
              size="sm"
              onClick={openCreateEditor}
              data-testid="doc-new-btn"
            >
              <Plus className="h-3.5 w-3.5" />
              New Doc
            </Button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <select
              aria-label="Filter by category"
              value={categoryFilter}
              onChange={(e) =>
                onCategoryFilterChange(e.target.value as DocCategory | '')
              }
              data-testid="docs-category-filter"
              className="min-h-[38px] min-w-0 rounded-lg border border-[#E5E3DC] bg-[#F6F5F1] px-2.5 text-xs font-medium text-zinc-800 focus:border-[#0F766E] focus:outline-none dark:border-zinc-700 dark:bg-[#0D1117] dark:text-slate-200"
            >
              <option value="">All Categories</option>
              {DOC_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by division"
              value={divisionFilter}
              onChange={(e) =>
                onDivisionFilterChange(e.target.value as DivisionId | '')
              }
              data-testid="docs-division-filter"
              className="min-h-[38px] min-w-0 rounded-lg border border-[#E5E3DC] bg-[#F6F5F1] px-2.5 text-xs font-medium text-zinc-800 focus:border-[#0F766E] focus:outline-none dark:border-zinc-700 dark:bg-[#0D1117] dark:text-slate-200"
            >
              <option value="">All Divisions</option>
              {CANONICAL_DIVISION_IDS.map((divId) => (
                <option key={divId} value={divId}>
                  {divId}
                </option>
              ))}
            </select>
          </div>

          {/* Confluence Space Tree / List Toggle + Starred Quick Filter */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <div
              role="group"
              aria-label="Directory view mode"
              className="inline-flex rounded-lg border border-[#E5E3DC] bg-[#F6F5F1] p-0.5 dark:border-zinc-700 dark:bg-[#0D1117]"
            >
              <button
                type="button"
                onClick={() => setSidebarView('tree')}
                aria-pressed={sidebarView === 'tree'}
                data-testid="sidebar-view-tree-btn"
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
                  sidebarView === 'tree'
                    ? 'bg-white text-[#0F766E] shadow-xs dark:bg-[#161B22] dark:text-teal-300'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                <FolderTree className="h-3 w-3" />
                Space Tree
              </button>
              <button
                type="button"
                onClick={() => setSidebarView('list')}
                aria-pressed={sidebarView === 'list'}
                data-testid="sidebar-view-list-btn"
                className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-semibold transition-colors ${
                  sidebarView === 'list'
                    ? 'bg-white text-[#0F766E] shadow-xs dark:bg-[#161B22] dark:text-teal-300'
                    : 'text-zinc-600 hover:text-zinc-900 dark:text-slate-400 dark:hover:text-slate-100'
                }`}
              >
                <List className="h-3 w-3" />
                List
              </button>
            </div>

            <button
              type="button"
              onClick={() => setStarredOnly((prev) => !prev)}
              aria-pressed={starredOnly}
              data-testid="docs-starred-filter"
              className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                starredOnly
                  ? 'border-[#0F766E] bg-teal-50 text-[#0F766E] dark:border-teal-500 dark:bg-teal-950/60 dark:text-teal-300'
                  : 'border-[#E5E3DC] bg-[#F6F5F1] text-zinc-700 hover:border-amber-300 hover:bg-amber-50/70 dark:border-zinc-700 dark:bg-[#0D1117] dark:text-slate-300 dark:hover:border-amber-700'
              }`}
            >
              <Star
                className={`h-3 w-3 ${
                  starredOnly || starredCountInDocs > 0
                    ? 'fill-amber-400 text-amber-500 dark:text-amber-400'
                    : ''
                }`}
              />
              Starred
              <span className="font-mono-tabular text-[10px] opacity-80">
                ({starredCountInDocs})
              </span>
            </button>
          </div>

          <div className="mt-3.5">
            {docsQuery.isLoading ? (
              <p className="py-6 text-center text-xs text-zinc-500 dark:text-slate-400">
                Loading documents...
              </p>
            ) : filteredDocsList.length === 0 ? (
              <div
                data-testid="docs-empty-state"
                className="rounded-lg border border-dashed border-[#E5E3DC] bg-[#F6F5F1]/60 p-5 text-center dark:border-zinc-700 dark:bg-[#0D1117]"
              >
                <FileText className="mx-auto h-6 w-6 text-zinc-400" />
                <p className="mt-2 text-xs font-medium text-zinc-700 dark:text-slate-300">
                  {starredOnly
                    ? 'No starred documents match this filter'
                    : 'No documents match this filter'}
                </p>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-slate-400">
                  {starredOnly
                    ? 'Click the star icon on any page to pin it here.'
                    : 'Create a new architecture spec, ADR, or contract.'}
                </p>
              </div>
            ) : sidebarView === 'tree' ? (
              <div data-testid="docs-space-tree" className="space-y-2">
                {spaceSections.map((space) => {
                  const isCollapsed = Boolean(collapsedSpaces[space.id]);
                  return (
                    <div
                      key={space.id}
                      data-testid={`space-folder-${space.id}`}
                      className="overflow-hidden rounded-lg border border-[#E5E3DC] bg-[#F6F5F1]/40 dark:border-zinc-800 dark:bg-[#0D1117]/60"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSpace(space.id)}
                        aria-expanded={!isCollapsed}
                        data-testid={`space-folder-toggle-${space.id}`}
                        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-[#F6F5F1] dark:hover:bg-zinc-800/50"
                      >
                        <span className="flex min-w-0 items-center gap-1.5">
                          {isCollapsed ? (
                            <ChevronRight className="h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-slate-400" />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-zinc-500 dark:text-slate-400" />
                          )}
                          {isCollapsed ? (
                            <Folder className="h-3.5 w-3.5 shrink-0 text-[#0F766E] dark:text-teal-400" />
                          ) : (
                            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-[#0F766E] dark:text-teal-400" />
                          )}
                          <span className="truncate text-xs font-semibold text-[#18181B] dark:text-slate-100">
                            {space.label}
                          </span>
                        </span>
                        <span
                          data-testid={`space-count-${space.id}`}
                          className="font-mono-tabular shrink-0 rounded-full border border-[#E5E3DC] bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-[#161B22] dark:text-slate-300"
                        >
                          {space.docs.length}
                        </span>
                      </button>
                      {!isCollapsed ? (
                        <ul className="space-y-1.5 border-t border-[#E5E3DC] p-2 dark:border-zinc-800">
                          {space.docs.map((doc) => renderDocListItem(doc, true))}
                        </ul>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <ul data-testid="docs-list" className="space-y-1.5">
                {filteredDocsList.map((doc) => renderDocListItem(doc))}
              </ul>
            )}
          </div>
        </div>
      </aside>

      {/* Main Viewer / Split-Pane Editor */}
      <section className="min-w-0 lg:col-span-8 xl:col-span-9">
        {editorMode !== 'none' ? (
          <form
            onSubmit={handleSubmit}
            data-testid="doc-editor-form"
            className="rounded-xl border border-[#E5E3DC] bg-white p-4 dark:border-zinc-800 dark:bg-[#161B22] sm:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E3DC] pb-4 dark:border-zinc-800">
              <div>
                <h2 className="text-lg font-bold text-[#18181B] dark:text-slate-100">
                  {editorMode === 'create'
                    ? 'Create New Document'
                    : `Editing: ${activeDoc?.slug}`}
                </h2>
                <p className="text-xs text-zinc-500 dark:text-slate-400">
                  Markdown with GFM tables &amp; fenced Mermaid diagrams. Emits{' '}
                  <span className="font-mono-tabular">doc.updated</span> telemetry.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditorMode('none')}
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  data-testid="doc-save-btn"
                >
                  <Save className="h-3.5 w-3.5" />
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : 'Save Document'}
                </Button>
              </div>
            </div>

            {editorMode === 'create' ? (
              <div
                data-testid="doc-blueprint-bar"
                className="mt-4 rounded-lg border border-[#E5E3DC] bg-[#F6F5F1]/60 p-3 dark:border-zinc-800 dark:bg-[#0D1117]"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#18181B] dark:text-slate-100">
                    <Sparkles className="h-3.5 w-3.5 text-[#0F766E] dark:text-teal-400" />
                    Page Blueprints
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-slate-400">
                    1-click Markdown + Mermaid scaffolding
                  </span>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {DOC_BLUEPRINTS.map((bp) => {
                    const isSelected = selectedBlueprint === bp.id;
                    return (
                      <button
                        key={bp.id}
                        type="button"
                        onClick={() => applyBlueprint(bp)}
                        data-testid={`blueprint-btn-${bp.id}`}
                        aria-pressed={isSelected}
                        className={`inline-flex min-h-[34px] items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          isSelected
                            ? 'border-[#0F766E] bg-[#0F766E] text-white dark:border-teal-500 dark:bg-teal-600'
                            : 'border-[#E5E3DC] bg-white text-[#18181B] hover:border-[#0F766E]/50 hover:bg-teal-50/60 dark:border-zinc-700 dark:bg-[#161B22] dark:text-slate-200 dark:hover:border-teal-700 dark:hover:bg-teal-950/40'
                        }`}
                      >
                        {bp.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {formError ? (
              <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                {formError}
              </div>
            ) : null}

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-slate-300">
                  Slug (kebab-case)
                </label>
                <input
                  type="text"
                  required
                  disabled={editorMode === 'edit'}
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value)}
                  placeholder="adr-002-new-contract"
                  data-testid="doc-input-slug"
                  className="min-h-[38px] w-full rounded-lg border border-[#E5E3DC] bg-white px-3 text-sm text-[#18181B] font-mono-tabular disabled:opacity-60 dark:border-zinc-700 dark:bg-[#0D1117] dark:text-slate-100"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-slate-300">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={titleInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setTitleInput(val);
                    if (editorMode === 'create' && !slugInput) {
                      setSlugInput(slugifyTitle(val));
                    }
                  }}
                  placeholder="Document title"
                  data-testid="doc-input-title"
                  className="min-h-[38px] w-full rounded-lg border border-[#E5E3DC] bg-white px-3 text-sm text-[#18181B] dark:border-zinc-700 dark:bg-[#0D1117] dark:text-slate-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-slate-300">
                  Category
                </label>
                <select
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value as DocCategory)}
                  data-testid="doc-input-category"
                  className="min-h-[38px] w-full rounded-lg border border-[#E5E3DC] bg-white px-2.5 text-sm text-[#18181B] dark:border-zinc-700 dark:bg-[#0D1117] dark:text-slate-100"
                >
                  {DOC_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-slate-300">
                  Division
                </label>
                <select
                  value={divisionInput}
                  onChange={(e) => setDivisionInput(e.target.value as DivisionId)}
                  data-testid="doc-input-division"
                  className="min-h-[38px] w-full rounded-lg border border-[#E5E3DC] bg-white px-2.5 text-sm text-[#18181B] dark:border-zinc-700 dark:bg-[#0D1117] dark:text-slate-100"
                >
                  {CANONICAL_DIVISION_IDS.map((divId) => (
                    <option key={divId} value={divId}>
                      {divId}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-slate-300">
                  Author Agent (#0–#23)
                </label>
                <select
                  value={agentInput}
                  onChange={(e) => setAgentInput(Number(e.target.value))}
                  data-testid="doc-input-agent"
                  className="min-h-[38px] w-full rounded-lg border border-[#E5E3DC] bg-white px-2.5 text-sm text-[#18181B] dark:border-zinc-700 dark:bg-[#0D1117] dark:text-slate-100"
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      #{a.id} {a.shortName} ({a.divisionId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-slate-300">
                  Status
                </label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value as DocStatus)}
                  data-testid="doc-input-status"
                  className="min-h-[38px] w-full rounded-lg border border-[#E5E3DC] bg-white px-2.5 text-sm text-[#18181B] dark:border-zinc-700 dark:bg-[#0D1117] dark:text-slate-100"
                >
                  {DOC_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-slate-300">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="architecture, adr, telemetry"
                  className="min-h-[38px] w-full rounded-lg border border-[#E5E3DC] bg-white px-3 text-sm text-[#18181B] dark:border-zinc-700 dark:bg-[#0D1117] dark:text-slate-100"
                />
              </div>
            </div>

            {/* Split-pane Markdown & Live Preview */}
            <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
              <div className="min-w-0">
                <label className="mb-1 block text-xs font-medium text-zinc-700 dark:text-slate-300">
                  Markdown Source
                </label>
                <textarea
                  required
                  rows={18}
                  value={contentInput}
                  onChange={(e) => setContentInput(e.target.value)}
                  data-testid="doc-input-content"
                  className="w-full rounded-lg border border-[#E5E3DC] bg-white p-3 font-mono text-xs leading-relaxed text-[#18181B] dark:border-zinc-700 dark:bg-[#0D1117] dark:text-slate-100"
                />
              </div>
              <div className="min-w-0">
                <span className="mb-1 block text-xs font-medium text-zinc-700 dark:text-slate-300">
                  Live Safe Preview
                </span>
                <div className="h-[396px] overflow-y-auto overflow-x-hidden rounded-lg border border-[#E5E3DC] bg-[#F6F5F1]/40 p-4 dark:border-zinc-700 dark:bg-[#0D1117]">
                  <SafeMarkdown content={contentInput} />
                </div>
              </div>
            </div>
          </form>
        ) : activeDoc ? (
          <article
            data-testid="doc-viewer"
            className="min-w-0 overflow-hidden rounded-xl border border-[#E5E3DC] bg-white p-4 dark:border-zinc-800 dark:bg-[#161B22] sm:p-6"
          >
            <header className="border-b border-[#E5E3DC] pb-4 dark:border-zinc-800">
              <nav
                aria-label="Breadcrumb"
                data-testid="doc-breadcrumbs"
                className="mb-3 flex min-w-0 flex-wrap items-center gap-x-1 gap-y-0.5 text-xs text-zinc-500 dark:text-slate-400"
              >
                <button
                  type="button"
                  onClick={() => {
                    onCategoryFilterChange('');
                    onDivisionFilterChange('');
                  }}
                  className="font-medium text-[#0F766E] hover:underline dark:text-teal-400"
                >
                  LokaTalenta Docs
                </button>
                <span aria-hidden="true" className="text-zinc-400 dark:text-zinc-600">
                  {' / '}
                </span>
                <button
                  type="button"
                  onClick={() => onCategoryFilterChange(activeDoc.category)}
                  className="font-medium text-zinc-700 hover:text-[#0F766E] hover:underline dark:text-slate-300 dark:hover:text-teal-400"
                >
                  {CATEGORY_LABELS[activeDoc.category]}
                </button>
                <span aria-hidden="true" className="text-zinc-400 dark:text-zinc-600">
                  {' / '}
                </span>
                <span className="min-w-0 break-words font-semibold text-[#18181B] dark:text-slate-100">
                  {activeDoc.title}
                </span>
              </nav>

              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="teal">{CATEGORY_LABELS[activeDoc.category]}</Badge>
                    <Badge tone={STATUS_TONE[activeDoc.status]}>
                      {activeDoc.status}
                    </Badge>
                    <span className="font-mono-tabular break-all text-xs text-zinc-500 dark:text-slate-400">
                      /{activeDoc.slug}
                    </span>
                  </div>
                  <h2 className="mt-2 break-words text-2xl font-bold text-[#18181B] dark:text-slate-100">
                    {activeDoc.title}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => toggleStar(activeDoc.slug)}
                    aria-pressed={isActiveDocStarred}
                    aria-label={isActiveDocStarred ? 'Unstar document' : 'Star document'}
                    data-testid="doc-star-btn"
                    className={
                      isActiveDocStarred
                        ? 'border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-700 dark:bg-amber-950/50 dark:text-amber-300 dark:hover:bg-amber-950/80'
                        : ''
                    }
                  >
                    <Star
                      className={`h-3.5 w-3.5 ${
                        isActiveDocStarred
                          ? 'fill-amber-400 text-amber-500 dark:fill-amber-400 dark:text-amber-400'
                          : ''
                      }`}
                    />
                    {isActiveDocStarred ? 'Starred' : 'Star'}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void handleCopyMarkdown()}
                    data-testid="doc-copy-md-btn"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy MD
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={openEditEditor}
                    data-testid="doc-edit-btn"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setDeleteOpen(true)}
                    data-testid="doc-delete-btn"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-zinc-600 dark:text-slate-400">
                <span>
                  Division:{' '}
                  <strong className="font-medium text-zinc-900 dark:text-slate-200">
                    {ownerDivision?.name ?? activeDoc.divisionId}
                  </strong>
                </span>
                <span>
                  Author:{' '}
                  <strong className="font-medium text-zinc-900 dark:text-slate-200">
                    #{activeDoc.authorAgentId}{' '}
                    {authorAgent?.name ?? `Agent #${activeDoc.authorAgentId}`}
                  </strong>
                </span>
                <span className="font-mono-tabular">
                  Updated: {new Date(activeDoc.updatedAt).toLocaleString()}
                </span>
              </div>

              {activeDoc.tags.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {activeDoc.tags.map((tag) => (
                    <Badge key={tag} tone="slate">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </header>

            {headings.length > 0 ? (
              <div className="mt-4 xl:hidden">
                <button
                  type="button"
                  onClick={() => setMobileTocOpen((o) => !o)}
                  data-testid="doc-outline-toggle"
                  className="inline-flex w-full items-center justify-between rounded-lg border border-[#E5E3DC] bg-[#F6F5F1]/70 px-3 py-2 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-[#0D1117] dark:text-slate-300"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <ListTree className="h-3.5 w-3.5 text-[#0F766E] dark:text-teal-400" />
                    On This Page ({headings.length})
                  </span>
                  <span className="font-mono-tabular text-[11px] text-zinc-500">
                    {mobileTocOpen ? 'Hide' : 'Jump'}
                  </span>
                </button>
                {mobileTocOpen ? (
                  <nav
                    aria-label="Document outline"
                    className="mt-2 rounded-lg border border-[#E5E3DC] bg-[#F6F5F1]/40 p-2.5 dark:border-zinc-800 dark:bg-[#0D1117]"
                  >
                    <ul className="space-y-1">
                      {headings.map((h) => (
                        <li key={h.id}>
                          <button
                            type="button"
                            onClick={() => jumpToHeading(h.id)}
                            className={`w-full break-words rounded px-2 py-1 text-left text-xs transition-colors ${
                              h.level === 3 ? 'pl-5' : ''
                            } ${
                              activeHeadingId === h.id
                                ? 'bg-teal-50 font-semibold text-[#0F766E] dark:bg-teal-950/60 dark:text-teal-300'
                                : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-slate-400 dark:hover:bg-zinc-800 dark:hover:text-slate-100'
                            }`}
                          >
                            {h.text}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </nav>
                ) : null}
              </div>
            ) : null}

            <div
              className={`mt-5 min-w-0 ${
                headings.length > 0
                  ? 'xl:grid xl:grid-cols-[minmax(0,1fr)_210px] xl:gap-6'
                  : ''
              }`}
            >
              <SafeMarkdown content={activeDoc.content} />

              {headings.length > 0 ? (
                <aside className="hidden xl:block">
                  <nav
                    aria-label="Document outline"
                    data-testid="doc-outline-nav"
                    className="sticky top-28 rounded-lg border border-[#E5E3DC] bg-[#F6F5F1]/60 p-3 dark:border-zinc-800 dark:bg-[#0D1117]"
                  >
                    <div className="mb-2 flex items-center gap-1.5 border-b border-[#E5E3DC] pb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:text-slate-400">
                      <ListTree className="h-3.5 w-3.5 text-[#0F766E] dark:text-teal-400" />
                      Outline
                    </div>
                    <ul className="max-h-[60vh] space-y-1 overflow-y-auto pr-1">
                      {headings.map((h) => (
                        <li key={h.id}>
                          <button
                            type="button"
                            onClick={() => jumpToHeading(h.id)}
                            className={`w-full rounded px-2 py-1 text-left text-xs leading-snug transition-colors ${
                              h.level === 3 ? 'pl-4 text-[11px]' : 'font-medium'
                            } ${
                              activeHeadingId === h.id
                                ? 'border-l-2 border-[#0F766E] bg-teal-50/80 font-semibold text-[#0F766E] dark:border-teal-400 dark:bg-teal-950/50 dark:text-teal-300'
                                : 'text-zinc-600 hover:bg-white hover:text-zinc-900 dark:text-slate-400 dark:hover:bg-zinc-800/70 dark:hover:text-slate-100'
                            }`}
                          >
                            {h.text}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </aside>
              ) : null}
            </div>

            {/* Page-Level Review Comments */}
            <section
              aria-label="Review discussion"
              data-testid="doc-comments-section"
              className="mt-8 border-t border-[#E5E3DC] pt-6 dark:border-zinc-800"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="inline-flex items-center gap-2 text-sm font-bold text-[#18181B] dark:text-slate-100">
                  <MessageSquare className="h-4 w-4 text-[#0F766E] dark:text-teal-400" />
                  Review Discussion
                </h3>
                <Badge tone="teal">{activeDocComments.length} comments</Badge>
              </div>

              {activeDocComments.length === 0 ? (
                <p className="mt-3 rounded-lg border border-dashed border-[#E5E3DC] bg-[#F6F5F1]/60 px-3.5 py-4 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-[#0D1117] dark:text-slate-400">
                  No review comments yet. Select a reviewer below to record architectural feedback or sign-off notes for this page.
                </p>
              ) : (
                <ul className="mt-3 space-y-2.5">
                  {activeDocComments.map((comment) => (
                    <li
                      key={comment.id}
                      data-testid={`doc-comment-item-${comment.id}`}
                      className="rounded-lg border border-[#E5E3DC] bg-[#F6F5F1]/40 p-3 dark:border-zinc-800 dark:bg-[#0D1117]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <span className="block break-words text-xs font-semibold text-[#18181B] dark:text-slate-100">
                            {comment.authorLabel}
                          </span>
                          <span className="font-mono-tabular text-[11px] text-zinc-500 dark:text-slate-400">
                            {new Date(comment.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteComment(activeDoc.slug, comment.id)}
                          aria-label="Delete comment"
                          data-testid={`doc-comment-delete-${comment.id}`}
                          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-transparent text-zinc-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:border-rose-900 dark:hover:bg-rose-950/50 dark:hover:text-rose-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="mt-2 whitespace-pre-wrap break-words text-xs leading-relaxed text-zinc-700 dark:text-slate-300">
                        {comment.body}
                      </p>
                    </li>
                  ))}
                </ul>
              )}

              <form onSubmit={handleAddComment} className="mt-4 space-y-2.5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <label
                    htmlFor="doc-comment-author-select"
                    className="text-xs font-medium text-zinc-700 dark:text-slate-300"
                  >
                    Reviewer
                  </label>
                  <select
                    id="doc-comment-author-select"
                    value={effectiveCommentAuthorId}
                    onChange={(e) => setCommentAuthorId(Number(e.target.value))}
                    data-testid="doc-comment-author"
                    className="min-h-[38px] w-full min-w-0 rounded-lg border border-[#E5E3DC] bg-[#F6F5F1] px-2.5 text-xs font-medium text-[#18181B] focus:border-[#0F766E] focus:outline-none dark:border-zinc-700 dark:bg-[#0D1117] dark:text-slate-100 sm:w-auto sm:min-w-[260px]"
                  >
                    {commentAuthors.map((author) => (
                      <option key={author.id} value={author.id}>
                        {author.label}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  rows={3}
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Write review feedback, QA sign-off note, or follow-up question..."
                  data-testid="doc-comment-input"
                  aria-label="Review comment"
                  className="w-full rounded-lg border border-[#E5E3DC] bg-white p-3 text-xs leading-relaxed text-[#18181B] placeholder:text-zinc-400 focus:border-[#0F766E] focus:outline-none dark:border-zinc-700 dark:bg-[#0D1117] dark:text-slate-100 dark:placeholder:text-slate-500"
                />

                <div className="flex justify-end">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!commentBody.trim()}
                    data-testid="doc-comment-submit"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Post Comment
                  </Button>
                </div>
              </form>
            </section>
          </article>
        ) : (
          <div className="rounded-xl border border-[#E5E3DC] bg-white p-10 text-center dark:border-zinc-800 dark:bg-[#161B22]">
            <FileText className="mx-auto h-8 w-8 text-zinc-400" />
            <h3 className="mt-3 text-base font-semibold text-[#18181B] dark:text-slate-100">
              No document selected
            </h3>
            <p className="mt-1 text-sm text-zinc-500 dark:text-slate-400">
              Select a document from the directory or create a new specification.
            </p>
            <div className="mt-4">
              <Button variant="primary" onClick={openCreateEditor}>
                <Plus className="h-4 w-4" />
                Create First Document
              </Button>
            </div>
          </div>
        )}
      </section>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete document?"
        description={`This permanently removes "${activeDoc?.title ?? ''}" (${activeDoc?.slug ?? ''}) from SQLite and FTS5 index.`}
        confirmLabel="Delete Document"
        loading={deleteMutation.isPending}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => {
          if (activeDoc) {
            deleteMutation.mutate(activeDoc.slug);
          }
        }}
      />
    </div>
  );
}
