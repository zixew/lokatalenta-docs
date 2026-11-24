import { useMemo, useState } from 'react';
import { Building2, Users } from 'lucide-react';
import type {
  CanonicalAgent,
  CanonicalDivision,
  CollaborationPair,
  DivisionId,
} from '../../shared/types/domain.ts';
import { Badge, type BadgeTone } from '../../shared/ui/Badge.tsx';

interface DivisionMatrixPageProps {
  divisions: CanonicalDivision[];
  agents: CanonicalAgent[];
  collaborationPairs: CollaborationPair[];
}

const DIVISION_TONE: Record<DivisionId, BadgeTone> = {
  executive: 'blue',
  architecture: 'purple',
  engineering: 'emerald',
  qa: 'amber',
  devops: 'cyan',
  lounge: 'pink',
};

export function DivisionMatrixPage({
  divisions,
  agents,
  collaborationPairs,
}: DivisionMatrixPageProps) {
  const [selectedDivision, setSelectedDivision] = useState<DivisionId | 'all'>('all');

  const agentsById = useMemo(
    () => new Map(agents.map((a) => [a.id, a])),
    [agents],
  );

  const filteredAgents = useMemo(() => {
    if (selectedDivision === 'all') return agents;
    return agents.filter((a) => a.divisionId === selectedDivision);
  }, [agents, selectedDivision]);

  return (
    <div data-testid="division-matrix-view" className="space-y-6">
      {/* Division Charters Grid */}
      <section className="rounded-xl border border-[#E5E3DC] bg-white p-5 dark:border-zinc-800 dark:bg-[#161B22]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-[#18181B] dark:text-slate-100">
              <Building2 className="h-5 w-5 text-[#0F766E] dark:text-teal-400" />
              6-Division Charter &amp; Spatial Assignments
            </h2>
            <p className="mt-0.5 text-xs text-zinc-600 dark:text-slate-400">
              Sourced directly from canonical M1 contracts (`divisions.json` &amp; `agents.json`).
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedDivision('all')}
              className={`min-h-[34px] rounded-lg border px-2.5 text-xs font-medium transition-colors ${
                selectedDivision === 'all'
                  ? 'border-[#0F766E] bg-teal-50 text-[#0F766E] dark:border-teal-600 dark:bg-teal-950/50 dark:text-teal-300'
                  : 'border-[#E5E3DC] text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-slate-300 dark:hover:bg-zinc-800'
              }`}
            >
              All ({agents.length})
            </button>
            {divisions.map((div) => (
              <button
                key={div.id}
                type="button"
                onClick={() => setSelectedDivision(div.id)}
                className={`min-h-[34px] rounded-lg border px-2.5 text-xs font-medium transition-colors ${
                  selectedDivision === div.id
                    ? 'border-[#0F766E] bg-teal-50 text-[#0F766E] dark:border-teal-600 dark:bg-teal-950/50 dark:text-teal-300'
                    : 'border-[#E5E3DC] text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-slate-300 dark:hover:bg-zinc-800'
                }`}
              >
                {div.id} ({div.agentIds.length})
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {divisions.map((div) => (
            <div
              key={div.id}
              data-testid={`division-card-${div.id}`}
              className="rounded-xl border border-[#E5E3DC] bg-[#F6F5F1]/50 p-4 dark:border-zinc-800 dark:bg-[#0D1117]"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge tone={DIVISION_TONE[div.id]}>{div.id}</Badge>
                  <h3 className="mt-2 text-sm font-bold text-[#18181B] dark:text-slate-100">
                    {div.name}
                  </h3>
                </div>
                <span className="font-mono-tabular rounded border border-[#E5E3DC] bg-white px-2 py-0.5 text-[11px] font-medium text-zinc-700 dark:border-zinc-700 dark:bg-[#161B22] dark:text-slate-300">
                  F{div.defaultFloor} · {div.defaultZone}
                </span>
              </div>
              <p className="mt-2 text-xs italic text-zinc-600 dark:text-slate-400">
                &ldquo;{div.motto}&rdquo;
              </p>
              <div className="mt-3 flex flex-wrap gap-1">
                {div.agentIds.map((aid) => {
                  const agent = agentsById.get(aid);
                  return (
                    <span
                      key={aid}
                      className="font-mono-tabular rounded border border-[#E5E3DC] bg-white px-1.5 py-0.5 text-[11px] text-zinc-700 dark:border-zinc-700 dark:bg-[#161B22] dark:text-slate-300"
                    >
                      #{aid} {agent?.shortName ?? ''}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 24-Agent Canonical Matrix */}
      <section className="rounded-xl border border-[#E5E3DC] bg-white p-5 dark:border-zinc-800 dark:bg-[#161B22]">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[#18181B] dark:text-slate-100">
          <Users className="h-5 w-5 text-[#0F766E] dark:text-teal-400" />
          Canonical 24-Agent Skills &amp; Responsibility Matrix ({filteredAgents.length})
        </h2>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              data-testid={`agent-card-${agent.id}`}
              className="flex flex-col justify-between rounded-xl border border-[#E5E3DC] bg-white p-4 dark:border-zinc-800 dark:bg-[#0D1117]"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E5E3DC] bg-[#F6F5F1] text-base dark:border-zinc-700 dark:bg-[#161B22]"
                      aria-hidden="true"
                    >
                      {agent.avatar}
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono-tabular text-xs font-semibold text-[#0F766E] dark:text-teal-400">
                          #{agent.id}
                        </span>
                        <h3 className="text-sm font-bold text-[#18181B] dark:text-slate-100">
                          {agent.name}
                        </h3>
                      </div>
                      <p className="text-xs text-zinc-600 dark:text-slate-400">
                        {agent.role}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge tone={DIVISION_TONE[agent.divisionId]}>
                    {agent.divisionId}
                  </Badge>
                  <Badge tone="slate">
                    F{agent.defaultFloor} · {agent.defaultZone}
                  </Badge>
                </div>

                <ul className="mt-3 space-y-1 text-xs text-zinc-700 dark:text-slate-300">
                  {agent.skills.primary.slice(0, 3).map((skill) => (
                    <li key={skill} className="truncate">
                      • {skill}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-3 border-t border-[#E5E3DC] pt-2.5 dark:border-zinc-800">
                <p className="text-[11px] font-medium text-zinc-500 dark:text-slate-400">
                  Stack: {agent.skills.stack.slice(0, 4).join(', ')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Collaboration Pairs */}
      <section className="rounded-xl border border-[#E5E3DC] bg-white p-5 dark:border-zinc-800 dark:bg-[#161B22]">
        <h2 className="text-base font-bold text-[#18181B] dark:text-slate-100">
          Canonical Collaboration Pairs ({collaborationPairs.length})
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          {collaborationPairs.map((pair) => {
            const init = agentsById.get(pair.initiator);
            const target = agentsById.get(pair.target);
            return (
              <div
                key={pair.id}
                className="rounded-lg border border-[#E5E3DC] bg-[#F6F5F1]/60 p-3.5 text-xs dark:border-zinc-800 dark:bg-[#0D1117]"
              >
                <div className="flex items-center justify-between gap-2 font-semibold text-[#18181B] dark:text-slate-100">
                  <span>{pair.taskDesc}</span>
                  <span className="font-mono-tabular text-[#0F766E] dark:text-teal-400">
                    #{pair.initiator} → #{pair.target}
                  </span>
                </div>
                <p className="mt-2 text-zinc-600 dark:text-slate-400">
                  <strong>{init?.shortName ?? `#${pair.initiator}`}:</strong> &ldquo;
                  {pair.dialogueInitiator}&rdquo;
                </p>
                <p className="mt-1 text-zinc-600 dark:text-slate-400">
                  <strong>{target?.shortName ?? `#${pair.target}`}:</strong> &ldquo;
                  {pair.dialogueTarget}&rdquo;
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
