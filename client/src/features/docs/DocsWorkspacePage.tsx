import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Check,
  Copy,
  FileText,
  ListTree,
  Pencil,
  Plus,
  Save,
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

  function openCreateEditor() {
    setFormError(null);
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
              className="min-h-[38px] rounded-lg border border-[#E5E3DC] bg-[#F6F5F1] px-2.5 text-xs font-medium text-zinc-800 focus:border-[#0F766E] focus:outline-none dark:border-zinc-700 dark:bg-[#0D1117] dark:text-slate-200"
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
              className="min-h-[38px] rounded-lg border border-[#E5E3DC] bg-[#F6F5F1] px-2.5 text-xs font-medium text-zinc-800 focus:border-[#0F766E] focus:outline-none dark:border-zinc-700 dark:bg-[#0D1117] dark:text-slate-200"
            >
              <option value="">All Divisions</option>
              {CANONICAL_DIVISION_IDS.map((divId) => (
                <option key={divId} value={divId}>
                  {divId}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-4" data-testid="docs-list">
            {docsQuery.isLoading ? (
              <p className="py-6 text-center text-xs text-zinc-500 dark:text-slate-400">
                Loading documents...
              </p>
            ) : docsList.length === 0 ? (
              <div
                data-testid="docs-empty-state"
                className="rounded-lg border border-dashed border-[#E5E3DC] bg-[#F6F5F1]/60 p-5 text-center dark:border-zinc-700 dark:bg-[#0D1117]"
              >
                <FileText className="mx-auto h-6 w-6 text-zinc-400" />
                <p className="mt-2 text-xs font-medium text-zinc-700 dark:text-slate-300">
                  No documents match this filter
                </p>
                <p className="mt-1 text-[11px] text-zinc-500 dark:text-slate-400">
                  Create a new architecture spec, ADR, or contract.
                </p>
              </div>
            ) : (
              <ul className="space-y-1.5">
                {docsList.map((doc) => {
                  const isActive = doc.slug === selectedSlug && editorMode !== 'create';
                  return (
                    <li key={doc.slug}>
                      <button
                        type="button"
                        data-testid={`doc-item-${doc.slug}`}
                        onClick={() => {
                          setEditorMode('none');
                          onSelectSlug(doc.slug);
                        }}
                        className={`w-full rounded-lg border p-3 text-left transition-all duration-200 ease-out ${
                          isActive
                            ? 'border-[#0F766E]/40 bg-teal-50/70 dark:border-teal-700 dark:bg-teal-950/40'
                            : 'border-[#E5E3DC] bg-white hover:bg-[#F6F5F1]/70 dark:border-zinc-800 dark:bg-[#161B22] dark:hover:bg-zinc-800/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="line-clamp-2 text-xs font-semibold text-[#18181B] dark:text-slate-100">
                            {doc.title}
                          </span>
                          <Badge tone={STATUS_TONE[doc.status]}>{doc.status}</Badge>
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Badge tone="teal">{CATEGORY_LABELS[doc.category]}</Badge>
                          <Badge tone="slate">{doc.divisionId}</Badge>
                        </div>
                      </button>
                    </li>
                  );
                })}
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
            className="rounded-xl border border-[#E5E3DC] bg-white p-5 dark:border-zinc-800 dark:bg-[#161B22]"
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
                  className="min-h-[38px] w-full rounded-lg border border-[#E5E3DC] px-3 text-sm font-mono-tabular disabled:opacity-60 dark:border-zinc-700"
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
                  className="min-h-[38px] w-full rounded-lg border border-[#E5E3DC] px-3 text-sm dark:border-zinc-700"
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
                  className="min-h-[38px] w-full rounded-lg border border-[#E5E3DC] px-2.5 text-sm dark:border-zinc-700"
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
                  className="min-h-[38px] w-full rounded-lg border border-[#E5E3DC] px-2.5 text-sm dark:border-zinc-700"
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
                  className="min-h-[38px] w-full rounded-lg border border-[#E5E3DC] px-2.5 text-sm dark:border-zinc-700"
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
                  className="min-h-[38px] w-full rounded-lg border border-[#E5E3DC] px-2.5 text-sm dark:border-zinc-700"
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
                  className="min-h-[38px] w-full rounded-lg border border-[#E5E3DC] px-3 text-sm dark:border-zinc-700"
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
                  className="w-full rounded-lg border border-[#E5E3DC] p-3 font-mono text-xs leading-relaxed dark:border-zinc-700"
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
                  <h2 className="mt-2 text-2xl font-bold text-[#18181B] dark:text-slate-100">
                    {activeDoc.title}
                  </h2>
                </div>
                <div className="flex flex-wrap items-center gap-2">
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
