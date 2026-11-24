import { Network } from 'lucide-react';
import type { CanonicalServicePort } from '../../shared/types/domain.ts';
import { Badge } from '../../shared/ui/Badge.tsx';
import { MermaidDiagram } from '../../shared/ui/MermaidDiagram.tsx';

interface ContractRegistryPageProps {
  ports: CanonicalServicePort[];
}

const INTEGRATION_DIAGRAM = `flowchart LR
  LMS[LMS Psikotes :4100] -->|POST /events| GW[Event Gateway :4101]
  BL[Backlog :4102] -->|POST /events| GW
  SP[Sprint Planner :4103] -->|POST /events| GW
  SP -->|PATCH /api/items/:id| BL
  DOCS[Docs Hub :4104] -->|POST /events| GW
  GH[GitHub Webhooks] -->|X-Hub-Signature-256| GW
  GW -->|WS /ws & SSE| OFFICE[3D Office :4105]`;

const EVENT_SCHEMA_FIELDS = [
  { key: 'id', type: 'string (1..128)', desc: 'UUID or deterministic idempotency key' },
  { key: 'timestamp', type: 'ISO 8601 UTC', desc: 'Event emission timestamp' },
  {
    key: 'source',
    type: 'enum',
    desc: 'backlog | sprint-planner | docs | lms-psikotes | github | office-sim',
  },
  {
    key: 'type',
    type: 'enum',
    desc: 'backlog.updated | sprint.updated | doc.updated | lms.activity | agent.task.completed | github.*',
  },
  {
    key: 'divisionId',
    type: 'enum',
    desc: 'executive | architecture | engineering | qa | devops | lounge',
  },
  { key: 'agentId', type: 'integer (0..23)', desc: 'Canonical LokaTalenta agent ID' },
  { key: 'entityId', type: 'string | null', desc: 'Domain ID (e.g. BL-46, ADR-001)' },
  { key: 'title', type: 'string (1..160)', desc: 'Short event headline' },
  { key: 'summary', type: 'string (1..500)', desc: 'Ticker-ready event description' },
  {
    key: 'targetZone',
    type: 'enum',
    desc: 'workspace | boardroom | cafeteria | lobby | lounge | gym | musholla',
  },
  { key: 'targetFloor', type: '1 | 2 | 3', desc: 'Target 3D Office floor' },
  { key: 'severity', type: 'enum', desc: 'info | success | warning | alert' },
  {
    key: 'metadata',
    type: 'object',
    desc: 'Non-PII metadata (e.g. action: doc.created | doc.updated | doc.deleted | rubric.updated)',
  },
];

export function ContractRegistryPage({ ports }: ContractRegistryPageProps) {
  return (
    <div data-testid="contract-registry-view" className="space-y-6">
      <section className="rounded-xl border border-[#E5E3DC] bg-white p-5 dark:border-zinc-800 dark:bg-[#161B22]">
        <h2 className="flex items-center gap-2 text-lg font-bold text-[#18181B] dark:text-slate-100">
          <Network className="h-5 w-5 text-[#0F766E] dark:text-teal-400" />
          Cross-App Service &amp; Port Registry
        </h2>
        <p className="mt-0.5 text-xs text-zinc-600 dark:text-slate-400">
          Canonical endpoints, ports, and real-time Event Gateway channels across all 6 repositories.
        </p>

        <div className="mt-4 overflow-x-auto rounded-lg border border-[#E5E3DC] dark:border-zinc-800">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead className="border-b border-[#E5E3DC] bg-[#F6F5F1] text-zinc-800 dark:border-zinc-800 dark:bg-[#0D1117] dark:text-slate-200">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Service</th>
                <th className="px-3 py-2.5 font-semibold">API Port</th>
                <th className="px-3 py-2.5 font-semibold">Dev UI Port</th>
                <th className="px-3 py-2.5 font-semibold">Health / Streams</th>
                <th className="px-3 py-2.5 font-semibold">Repository</th>
              </tr>
            </thead>
            <tbody>
              {ports.map((svc) => (
                <tr
                  key={svc.id}
                  data-testid={`contract-row-${svc.id}`}
                  className="border-t border-[#E5E3DC] dark:border-zinc-800"
                >
                  <td className="px-3 py-2.5">
                    <div className="font-semibold text-[#18181B] dark:text-slate-100">
                      {svc.name}
                    </div>
                    <div className="font-mono-tabular text-[11px] text-zinc-500 dark:text-slate-400">
                      {svc.id}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 font-mono-tabular">
                    <Badge tone="teal">:{svc.apiPort}</Badge>
                  </td>
                  <td className="px-3 py-2.5 font-mono-tabular text-zinc-700 dark:text-slate-300">
                    {svc.devUiPort ? `:${svc.devUiPort}` : '—'}
                  </td>
                  <td className="px-3 py-2.5 font-mono-tabular text-xs text-zinc-700 dark:text-slate-300">
                    <div>GET {svc.healthPath}</div>
                    {svc.wsUrl ? <div>WS /ws · SSE /events/stream</div> : null}
                  </td>
                  <td className="px-3 py-2.5">
                    <a
                      href={svc.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono-tabular text-xs font-medium text-[#0F766E] underline decoration-teal-600/40 underline-offset-2 dark:text-teal-400"
                    >
                      {svc.githubRepo}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="rounded-xl border border-[#E5E3DC] bg-white p-5 dark:border-zinc-800 dark:bg-[#161B22] lg:col-span-7">
          <h3 className="text-base font-bold text-[#18181B] dark:text-slate-100">
            13-Field Telemetry Contract (`event-schema.json`)
          </h3>
          <p className="mt-0.5 text-xs text-zinc-600 dark:text-slate-400">
            Strict <span className="font-mono-tabular">additionalProperties: false</span> payload sent via{' '}
            <span className="font-mono-tabular">POST /events</span>.
          </p>
          <div className="mt-3 overflow-x-auto rounded-lg border border-[#E5E3DC] dark:border-zinc-800">
            <table className="w-full border-collapse text-left text-xs">
              <thead className="border-b border-[#E5E3DC] bg-[#F6F5F1] dark:border-zinc-800 dark:bg-[#0D1117]">
                <tr>
                  <th className="px-3 py-2 font-semibold">Field</th>
                  <th className="px-3 py-2 font-semibold">Type</th>
                  <th className="px-3 py-2 font-semibold">Specification</th>
                </tr>
              </thead>
              <tbody>
                {EVENT_SCHEMA_FIELDS.map((f) => (
                  <tr key={f.key} className="border-t border-[#E5E3DC] dark:border-zinc-800">
                    <td className="px-3 py-1.5 font-mono-tabular font-semibold text-[#0F766E] dark:text-teal-400">
                      {f.key}
                    </td>
                    <td className="px-3 py-1.5 font-mono-tabular text-zinc-600 dark:text-slate-400">
                      {f.type}
                    </td>
                    <td className="px-3 py-1.5 text-zinc-700 dark:text-slate-300">
                      {f.desc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-[#E5E3DC] bg-white p-5 dark:border-zinc-800 dark:bg-[#161B22] lg:col-span-5">
          <h3 className="text-base font-bold text-[#18181B] dark:text-slate-100">
            Ecosystem Event Flow
          </h3>
          <p className="mt-0.5 text-xs text-zinc-600 dark:text-slate-400">
            Live Mermaid architecture diagram rendered with{' '}
            <span className="font-mono-tabular">securityLevel: strict</span>.
          </p>
          <MermaidDiagram chart={INTEGRATION_DIAGRAM} />
        </div>
      </section>
    </div>
  );
}
