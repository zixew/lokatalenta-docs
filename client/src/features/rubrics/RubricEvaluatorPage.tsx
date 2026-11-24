import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ClipboardCheck, Pencil, Plus, Save, X } from 'lucide-react';
import { docsApi } from '../../shared/api/docsApi.ts';
import {
  CANONICAL_DIVISION_IDS,
  RUBRIC_STATUSES,
  type CanonicalAgent,
  type DivisionId,
  type RubricCriterion,
  type RubricRecord,
  type RubricStatus,
} from '../../shared/types/domain.ts';
import { Badge, type BadgeTone } from '../../shared/ui/Badge.tsx';
import { Button } from '../../shared/ui/Button.tsx';

interface RubricEvaluatorPageProps {
  agents: CanonicalAgent[];
}

const RUBRIC_TONE: Record<RubricStatus, BadgeTone> = {
  pass: 'emerald',
  partial: 'amber',
  fail: 'rose',
};

function computeWeightedPercent(criteria: RubricCriterion[]): number {
  let totalWeight = 0;
  let weightedSum = 0;
  for (const c of criteria) {
    if (c.weight > 0 && c.maxScore > 0) {
      totalWeight += c.weight;
      weightedSum += (c.score / c.maxScore) * c.weight;
    }
  }
  if (totalWeight <= 0) return 0;
  return Math.round((weightedSum / totalWeight) * 100);
}

export function RubricEvaluatorPage({ agents }: RubricEvaluatorPageProps) {
  const queryClient = useQueryClient();
  const [divisionFilter, setDivisionFilter] = useState<DivisionId | ''>('');
  const [statusFilter, setStatusFilter] = useState<RubricStatus | ''>('');
  const [editingMode, setEditingMode] = useState<'none' | 'create' | 'edit'>('none');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const [titleInput, setTitleInput] = useState('');
  const [workflowInput, setWorkflowInput] = useState('');
  const [divisionInput, setDivisionInput] = useState<DivisionId>('devops');
  const [agentInput, setAgentInput] = useState<number>(12);
  const [contractRefInput, setContractRefInput] = useState('');
  const [backlogIdsInput, setBacklogIdsInput] = useState('');
  const [overallStatusInput, setOverallStatusInput] = useState<RubricStatus>('pass');
  const [notesInput, setNotesInput] = useState('');
  const [criteriaInput, setCriteriaInput] = useState<RubricCriterion[]>([
    {
      name: 'Contract & Acceptance Criteria Defined',
      weight: 50,
      score: 50,
      maxScore: 50,
      status: 'pass',
      evidence: '',
    },
  ]);

  const rubricsQuery = useQuery({
    queryKey: ['rubrics', divisionFilter, statusFilter],
    queryFn: () =>
      docsApi.listRubrics({
        division: divisionFilter,
        status: statusFilter,
      }),
  });

  const rubrics = rubricsQuery.data?.rubrics ?? [];

  const agentsById = useMemo(
    () => new Map(agents.map((a) => [a.id, a])),
    [agents],
  );

  const createMutation = useMutation({
    mutationFn: docsApi.createRubric,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rubrics'] });
      setEditingMode('none');
      setFormError(null);
    },
    onError: (err: Error) => {
      setFormError(err.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (vars: { id: string; payload: Parameters<typeof docsApi.updateRubric>[1] }) =>
      docsApi.updateRubric(vars.id, vars.payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['rubrics'] });
      setEditingMode('none');
      setEditingId(null);
      setFormError(null);
    },
    onError: (err: Error) => {
      setFormError(err.message);
    },
  });

  function openCreateForm() {
    setFormError(null);
    setEditingId(null);
    setTitleInput('');
    setWorkflowInput('Documentation');
    setDivisionInput('devops');
    setAgentInput(12);
    setContractRefInput('cross-app-integration-contracts');
    setBacklogIdsInput('ECO-01');
    setOverallStatusInput('pass');
    setNotesInput('');
    setCriteriaInput([
      {
        name: 'Integration Contract & Telemetry Verified',
        weight: 100,
        score: 100,
        maxScore: 100,
        status: 'pass',
        evidence: 'Verified API contract and Event Gateway emission.',
      },
    ]);
    setEditingMode('create');
  }

  function openEditForm(rubric: RubricRecord) {
    setFormError(null);
    setEditingId(rubric.id);
    setTitleInput(rubric.title);
    setWorkflowInput(rubric.workflowName);
    setDivisionInput(rubric.ownerDivision);
    setAgentInput(rubric.ownerAgentId);
    setContractRefInput(rubric.contractRef);
    setBacklogIdsInput(rubric.backlogItemIds.join(', '));
    setOverallStatusInput(rubric.overallStatus);
    setNotesInput(rubric.notes);
    setCriteriaInput(rubric.criteria.map((c) => ({ ...c })));
    setEditingMode('edit');
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const backlogItemIds = backlogIdsInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (editingMode === 'create') {
      createMutation.mutate({
        title: titleInput.trim(),
        workflowName: workflowInput.trim(),
        ownerDivision: divisionInput,
        ownerAgentId: Number(agentInput),
        contractRef: contractRefInput.trim(),
        backlogItemIds,
        criteria: criteriaInput,
        overallStatus: overallStatusInput,
        notes: notesInput.trim(),
      });
    } else if (editingMode === 'edit' && editingId) {
      updateMutation.mutate({
        id: editingId,
        payload: {
          title: titleInput.trim(),
          workflowName: workflowInput.trim(),
          ownerDivision: divisionInput,
          ownerAgentId: Number(agentInput),
          contractRef: contractRefInput.trim(),
          backlogItemIds,
          criteria: criteriaInput,
          overallStatus: overallStatusInput,
          notes: notesInput.trim(),
        },
      });
    }
  }

  return (
    <div data-testid="rubric-evaluator-view" className="space-y-6">
      <section className="rounded-xl border border-[#E5E3DC] bg-white p-5 dark:border-zinc-800 dark:bg-[#161B22]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-[#18181B] dark:text-slate-100">
              <ClipboardCheck className="h-5 w-5 text-[#0F766E] dark:text-teal-400" />
              Structured Cross-Workflow Rubric Evaluator
            </h2>
            <p className="mt-0.5 text-xs text-zinc-600 dark:text-slate-400">
              Tracks contract definition, owner division, prioritized backlog items, and weighted criteria per workflow.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter rubrics by division"
              value={divisionFilter}
              onChange={(e) => setDivisionFilter(e.target.value as DivisionId | '')}
              className="min-h-[38px] rounded-lg border border-[#E5E3DC] bg-[#F6F5F1] px-2.5 text-xs font-medium dark:border-zinc-700 dark:bg-[#0D1117]"
            >
              <option value="">All Divisions</option>
              {CANONICAL_DIVISION_IDS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <select
              aria-label="Filter rubrics by status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as RubricStatus | '')}
              className="min-h-[38px] rounded-lg border border-[#E5E3DC] bg-[#F6F5F1] px-2.5 text-xs font-medium dark:border-zinc-700 dark:bg-[#0D1117]"
            >
              <option value="">All Statuses</option>
              {RUBRIC_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <Button
              variant="primary"
              size="sm"
              onClick={openCreateForm}
              data-testid="rubric-create-btn"
            >
              <Plus className="h-3.5 w-3.5" />
              New Rubric
            </Button>
          </div>
        </div>

        {editingMode !== 'none' ? (
          <form
            onSubmit={handleSave}
            className="mt-5 rounded-xl border border-[#0F766E]/30 bg-[#F6F5F1]/60 p-4 dark:border-teal-800 dark:bg-[#0D1117]"
          >
            <div className="flex items-center justify-between gap-2 border-b border-[#E5E3DC] pb-3 dark:border-zinc-800">
              <h3 className="text-sm font-bold text-[#18181B] dark:text-slate-100">
                {editingMode === 'create'
                  ? 'Create Workflow Rubric Evaluation'
                  : `Edit Rubric: ${editingId}`}
              </h3>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingMode('none')}
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  data-testid="rubric-save-btn"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  <Save className="h-3.5 w-3.5" />
                  Save Rubric
                </Button>
              </div>
            </div>

            {formError ? (
              <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                {formError}
              </div>
            ) : null}

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium">Title</label>
                <input
                  type="text"
                  required
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="e.g. Sprint Planning Cross-App Readiness Rubric"
                  className="min-h-[38px] w-full rounded-lg border border-[#E5E3DC] px-3 text-sm dark:border-zinc-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Workflow Name</label>
                <input
                  type="text"
                  required
                  value={workflowInput}
                  onChange={(e) => setWorkflowInput(e.target.value)}
                  placeholder="Sprint Planning"
                  className="min-h-[38px] w-full rounded-lg border border-[#E5E3DC] px-3 text-sm dark:border-zinc-700"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Owner Division</label>
                <select
                  value={divisionInput}
                  onChange={(e) => setDivisionInput(e.target.value as DivisionId)}
                  className="min-h-[38px] w-full rounded-lg border border-[#E5E3DC] px-2.5 text-sm dark:border-zinc-700"
                >
                  {CANONICAL_DIVISION_IDS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Owner Agent</label>
                <select
                  value={agentInput}
                  onChange={(e) => setAgentInput(Number(e.target.value))}
                  className="min-h-[38px] w-full rounded-lg border border-[#E5E3DC] px-2.5 text-sm dark:border-zinc-700"
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>
                      #{a.id} {a.shortName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Overall Status</label>
                <select
                  value={overallStatusInput}
                  onChange={(e) => setOverallStatusInput(e.target.value as RubricStatus)}
                  className="min-h-[38px] w-full rounded-lg border border-[#E5E3DC] px-2.5 text-sm dark:border-zinc-700"
                >
                  {RUBRIC_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium">Contract Ref</label>
                <input
                  type="text"
                  required
                  value={contractRefInput}
                  onChange={(e) => setContractRefInput(e.target.value)}
                  className="min-h-[38px] w-full rounded-lg border border-[#E5E3DC] px-3 text-sm font-mono-tabular dark:border-zinc-700"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium">
                  Backlog Item IDs (comma-separated)
                </label>
                <input
                  type="text"
                  value={backlogIdsInput}
                  onChange={(e) => setBacklogIdsInput(e.target.value)}
                  placeholder="BL-01, ECO-02"
                  className="min-h-[38px] w-full rounded-lg border border-[#E5E3DC] px-3 text-sm font-mono-tabular dark:border-zinc-700"
                />
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold">Criteria</span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    setCriteriaInput((prev) => [
                      ...prev,
                      {
                        name: 'New Criterion',
                        weight: 25,
                        score: 25,
                        maxScore: 25,
                        status: 'pass',
                        evidence: '',
                      },
                    ])
                  }
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Criterion
                </Button>
              </div>
              {criteriaInput.map((crit, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-1 gap-2 rounded-lg border border-[#E5E3DC] bg-white p-3 dark:border-zinc-800 dark:bg-[#161B22] sm:grid-cols-12"
                >
                  <input
                    type="text"
                    required
                    value={crit.name}
                    onChange={(e) => {
                      const next = [...criteriaInput];
                      next[idx] = { ...crit, name: e.target.value };
                      setCriteriaInput(next);
                    }}
                    placeholder="Criterion name"
                    className="min-h-[34px] rounded border border-[#E5E3DC] px-2 text-xs dark:border-zinc-700 sm:col-span-4"
                  />
                  <input
                    type="number"
                    min={1}
                    step="any"
                    required
                    value={crit.weight}
                    onChange={(e) => {
                      const next = [...criteriaInput];
                      next[idx] = { ...crit, weight: Number(e.target.value) };
                      setCriteriaInput(next);
                    }}
                    aria-label="Weight"
                    className="min-h-[34px] rounded border border-[#E5E3DC] px-2 text-xs font-mono-tabular dark:border-zinc-700 sm:col-span-1"
                  />
                  <input
                    type="number"
                    min={0}
                    max={crit.maxScore}
                    step="any"
                    required
                    value={crit.score}
                    onChange={(e) => {
                      const next = [...criteriaInput];
                      next[idx] = { ...crit, score: Number(e.target.value) };
                      setCriteriaInput(next);
                    }}
                    aria-label="Score"
                    className="min-h-[34px] rounded border border-[#E5E3DC] px-2 text-xs font-mono-tabular dark:border-zinc-700 sm:col-span-1"
                  />
                  <input
                    type="number"
                    min={1}
                    step="any"
                    required
                    value={crit.maxScore}
                    onChange={(e) => {
                      const next = [...criteriaInput];
                      next[idx] = { ...crit, maxScore: Number(e.target.value) };
                      setCriteriaInput(next);
                    }}
                    aria-label="Max score"
                    className="min-h-[34px] rounded border border-[#E5E3DC] px-2 text-xs font-mono-tabular dark:border-zinc-700 sm:col-span-1"
                  />
                  <select
                    value={crit.status}
                    onChange={(e) => {
                      const next = [...criteriaInput];
                      next[idx] = {
                        ...crit,
                        status: e.target.value as RubricStatus,
                      };
                      setCriteriaInput(next);
                    }}
                    className="min-h-[34px] rounded border border-[#E5E3DC] px-2 text-xs dark:border-zinc-700 sm:col-span-2"
                  >
                    {RUBRIC_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={crit.evidence}
                    onChange={(e) => {
                      const next = [...criteriaInput];
                      next[idx] = { ...crit, evidence: e.target.value };
                      setCriteriaInput(next);
                    }}
                    placeholder="Evidence notes"
                    className="min-h-[34px] rounded border border-[#E5E3DC] px-2 text-xs dark:border-zinc-700 sm:col-span-3"
                  />
                </div>
              ))}
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-xs font-medium">Evaluator Notes</label>
              <textarea
                rows={2}
                value={notesInput}
                onChange={(e) => setNotesInput(e.target.value)}
                className="w-full rounded-lg border border-[#E5E3DC] p-2 text-xs dark:border-zinc-700"
              />
            </div>
          </form>
        ) : null}

        <div className="mt-5 space-y-4">
          {rubricsQuery.isLoading ? (
            <p className="py-8 text-center text-xs text-zinc-500 dark:text-slate-400">
              Loading workflow rubrics...
            </p>
          ) : rubrics.length === 0 ? (
            <div
              data-testid="rubrics-empty-state"
              className="rounded-xl border border-dashed border-[#E5E3DC] bg-[#F6F5F1]/60 p-8 text-center dark:border-zinc-700 dark:bg-[#0D1117]"
            >
              <CheckCircle2 className="mx-auto h-7 w-7 text-zinc-400" />
              <p className="mt-2 text-sm font-medium text-zinc-700 dark:text-slate-300">
                No rubric evaluations recorded yet
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-slate-400">
                Create a structured rubric evaluation for any cross-application workflow.
              </p>
            </div>
          ) : (
            rubrics.map((rubric) => {
              const pct = computeWeightedPercent(rubric.criteria);
              const owner = agentsById.get(rubric.ownerAgentId);
              return (
                <article
                  key={rubric.id}
                  data-testid={`rubric-row-${rubric.id}`}
                  className="rounded-xl border border-[#E5E3DC] bg-[#F6F5F1]/40 p-4 dark:border-zinc-800 dark:bg-[#0D1117]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="teal">{rubric.workflowName}</Badge>
                        <Badge tone={RUBRIC_TONE[rubric.overallStatus]}>
                          {rubric.overallStatus.toUpperCase()} · {pct}%
                        </Badge>
                        <Badge tone="slate">{rubric.ownerDivision}</Badge>
                        <span className="font-mono-tabular text-xs text-zinc-500 dark:text-slate-400">
                          {rubric.id}
                        </span>
                      </div>
                      <h3 className="mt-2 text-base font-bold text-[#18181B] dark:text-slate-100">
                        {rubric.title}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-600 dark:text-slate-400">
                        <span>
                          Evaluator:{' '}
                          <strong>
                            #{rubric.ownerAgentId}{' '}
                            {owner?.shortName ?? `Agent #${rubric.ownerAgentId}`}
                          </strong>
                        </span>
                        <span className="font-mono-tabular">
                          Contract: {rubric.contractRef}
                        </span>
                        {rubric.backlogItemIds.length > 0 ? (
                          <span className="font-mono-tabular">
                            Items: {rubric.backlogItemIds.join(', ')}
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => openEditForm(rubric)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Evaluate / Edit
                    </Button>
                  </div>

                  <div className="mt-3 overflow-x-auto rounded-lg border border-[#E5E3DC] bg-white dark:border-zinc-800 dark:bg-[#161B22]">
                    <table className="w-full border-collapse text-left text-xs">
                      <thead className="border-b border-[#E5E3DC] bg-[#F6F5F1] dark:border-zinc-800 dark:bg-[#0D1117]">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Criterion</th>
                          <th className="px-3 py-2 font-semibold">Weight</th>
                          <th className="px-3 py-2 font-semibold">Score</th>
                          <th className="px-3 py-2 font-semibold">Status</th>
                          <th className="px-3 py-2 font-semibold">Evidence</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rubric.criteria.map((c, idx) => (
                          <tr
                            key={idx}
                            className="border-t border-[#E5E3DC] dark:border-zinc-800"
                          >
                            <td className="px-3 py-2 font-medium text-[#18181B] dark:text-slate-100">
                              {c.name}
                            </td>
                            <td className="px-3 py-2 font-mono-tabular">{c.weight}</td>
                            <td className="px-3 py-2 font-mono-tabular">
                              {c.score}/{c.maxScore}
                            </td>
                            <td className="px-3 py-2">
                              <Badge tone={RUBRIC_TONE[c.status]}>{c.status}</Badge>
                            </td>
                            <td className="px-3 py-2 text-zinc-600 dark:text-slate-400">
                              {c.evidence || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {rubric.notes ? (
                    <p className="mt-2.5 text-xs text-zinc-600 dark:text-slate-400">
                      <strong>Notes:</strong> {rubric.notes}
                    </p>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
