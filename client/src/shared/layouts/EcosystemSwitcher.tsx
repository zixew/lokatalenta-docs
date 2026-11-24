import { ExternalLink } from 'lucide-react';
import { isSafeHttpUrl } from '../lib/securityGuards.ts';

interface EcosystemAppLink {
  id: 'lms' | 'backlog' | 'sprint-planner' | 'docs' | 'office-3d';
  label: string;
  portLabel: string;
  href: string;
  testId: string;
  active?: boolean;
}

function resolveEnvUrl(raw: string | undefined, fallback: string): string {
  const candidate = (raw ?? '').trim();
  return isSafeHttpUrl(candidate) ? candidate : fallback;
}

export function EcosystemSwitcher() {
  const isLocalHost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const links: EcosystemAppLink[] = [
    {
      id: 'lms',
      label: 'LMS Psikotes',
      portLabel: '4100',
      href: resolveEnvUrl(
        import.meta.env.VITE_LMS_URL,
        isLocalHost ? 'http://localhost:4100' : 'https://lokatalenta.vercel.app',
      ),
      testId: 'ecosystem-link-lms',
    },
    {
      id: 'backlog',
      label: 'Backlog',
      portLabel: '4102',
      href: resolveEnvUrl(
        import.meta.env.VITE_BACKLOG_URL,
        isLocalHost ? 'http://localhost:4102' : 'https://lokatalenta-backlog.vercel.app',
      ),
      testId: 'ecosystem-link-backlog',
    },
    {
      id: 'sprint-planner',
      label: 'Sprint Planner',
      portLabel: '4103',
      href: resolveEnvUrl(
        import.meta.env.VITE_SPRINT_URL || import.meta.env.VITE_SPRINT_PLANNER_URL,
        isLocalHost ? 'http://localhost:4103' : 'https://lokatalenta-sprint-planner.vercel.app',
      ),
      testId: 'ecosystem-link-sprint-planner',
    },
    {
      id: 'docs',
      label: 'Docs Hub',
      portLabel: '4104',
      href: resolveEnvUrl(import.meta.env.VITE_DOCS_URL, isLocalHost ? 'http://localhost:4104' : '/'),
      testId: 'ecosystem-link-docs',
      active: true,
    },
    {
      id: 'office-3d',
      label: '3D Office',
      portLabel: '4105',
      href: resolveEnvUrl(
        import.meta.env.VITE_OFFICE_3D_URL,
        isLocalHost ? 'http://localhost:4105' : 'https://lokatalenta-office-3d.vercel.app',
      ),
      testId: 'ecosystem-link-office-3d',
    },
  ];

  return (
    <nav
      data-testid="ecosystem-switcher"
      aria-label="LokaTalenta Ecosystem Switcher"
      className="border-b border-[#E5E3DC] bg-white/95 dark:border-zinc-800 dark:bg-[#161B22]/95"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-2 sm:px-6">
        <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-slate-400">
          LokaTalenta Ecosystem
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {links.map((item) => (
            <a
              key={item.id}
              href={item.href}
              data-testid={item.testId}
              data-active={item.active ? 'true' : 'false'}
              aria-current={item.active ? 'page' : undefined}
              className={`inline-flex min-h-[36px] shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 ${
                item.active
                  ? 'border-[#0F766E]/30 bg-teal-50 text-[#0F766E] dark:border-teal-700 dark:bg-teal-950/60 dark:text-teal-300'
                  : 'border-[#E5E3DC] bg-[#F6F5F1]/60 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-[#0D1117] dark:text-slate-300 dark:hover:bg-zinc-800'
              }`}
            >
              <span>{item.label}</span>
              <span className="font-mono-tabular text-[10px] opacity-75">
                :{item.portLabel}
              </span>
              {!item.active ? (
                <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
              ) : null}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
