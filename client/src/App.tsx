import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import {
  BookOpen,
  Building2,
  ClipboardCheck,
  Moon,
  Network,
  Sun,
} from 'lucide-react';
import { ContractRegistryPage } from './features/contracts/ContractRegistryPage.tsx';
import { DivisionMatrixPage } from './features/divisions/DivisionMatrixPage.tsx';
import { DocsWorkspacePage } from './features/docs/DocsWorkspacePage.tsx';
import { RubricEvaluatorPage } from './features/rubrics/RubricEvaluatorPage.tsx';
import { LiveSearchBar } from './features/search/LiveSearchBar.tsx';
import { docsApi } from './shared/api/docsApi.ts';
import { EcosystemSwitcher } from './shared/layouts/EcosystemSwitcher.tsx';
import { useThemeStore } from './shared/stores/useThemeStore.ts';
import type { DivisionId, DocCategory } from './shared/types/domain.ts';

type ActiveTab = 'docs' | 'divisions' | 'contracts' | 'rubrics';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: 1,
    },
  },
});

export function DocsHubShell() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('docs');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<DocCategory | ''>('');
  const [divisionFilter, setDivisionFilter] = useState<DivisionId | ''>('');
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);

  const contractsQuery = useQuery({
    queryKey: ['canonical-contracts'],
    queryFn: docsApi.getCanonicalContracts,
  });

  const divisions = contractsQuery.data?.divisions ?? [];
  const agents = contractsQuery.data?.agents ?? [];
  const collaborationPairs = contractsQuery.data?.collaborationPairs ?? [];
  const ports = contractsQuery.data?.ports ?? [];

  const navTabs: Array<{
    id: ActiveTab;
    label: string;
    icon: typeof BookOpen;
    testId: string;
  }> = [
    { id: 'docs', label: 'Documents', icon: BookOpen, testId: 'nav-tab-docs' },
    {
      id: 'divisions',
      label: '6 Divisions & 24 Agents',
      icon: Building2,
      testId: 'nav-tab-divisions',
    },
    {
      id: 'contracts',
      label: 'Contract Registry',
      icon: Network,
      testId: 'nav-tab-contracts',
    },
    {
      id: 'rubrics',
      label: 'Rubric Evaluator',
      icon: ClipboardCheck,
      testId: 'nav-tab-rubrics',
    },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#F6F5F1] text-[#18181B] dark:bg-[#0D1117] dark:text-slate-100">
      <EcosystemSwitcher />

      <header className="sticky top-0 z-30 border-b border-[#E5E3DC] bg-white/95 backdrop-blur-sm dark:border-zinc-800 dark:bg-[#161B22]/95">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#0F766E]/20 bg-teal-50 text-[#0F766E] dark:border-teal-800 dark:bg-teal-950/60 dark:text-teal-300">
                <BookOpen className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base font-extrabold tracking-tight text-[#18181B] dark:text-slate-100">
                  LokaTalenta Docs Hub
                </h1>
                <p className="text-[11px] text-zinc-500 dark:text-slate-400">
                  Architecture · ADRs · Integration Contracts · Workflow Rubrics
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              data-testid="theme-toggle-btn"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[#E5E3DC] bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-[#0D1117] dark:text-slate-200 dark:hover:bg-zinc-800 lg:hidden"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-end">
            <LiveSearchBar
              categoryFilter={categoryFilter}
              divisionFilter={divisionFilter}
              onSelectDoc={(slug) => {
                setSelectedSlug(slug);
                setActiveTab('docs');
              }}
            />

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              className="hidden min-h-[38px] min-w-[38px] items-center justify-center rounded-lg border border-[#E5E3DC] bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-[#0D1117] dark:text-slate-200 dark:hover:bg-zinc-800 lg:inline-flex"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl items-center gap-1.5 overflow-x-auto border-t border-[#E5E3DC] px-4 py-2 dark:border-zinc-800 sm:px-6">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                data-testid={tab.testId}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all duration-200 ease-out sm:min-h-[36px] ${
                  active
                    ? 'border-[#0F766E]/30 bg-teal-50 text-[#0F766E] dark:border-teal-700 dark:bg-teal-950/60 dark:text-teal-300'
                    : 'border-transparent text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-slate-400 dark:hover:bg-zinc-800 dark:hover:text-slate-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6">
        {activeTab === 'docs' ? (
          <DocsWorkspacePage
            selectedSlug={selectedSlug}
            onSelectSlug={setSelectedSlug}
            categoryFilter={categoryFilter}
            divisionFilter={divisionFilter}
            onCategoryFilterChange={setCategoryFilter}
            onDivisionFilterChange={setDivisionFilter}
            divisions={divisions}
            agents={agents}
          />
        ) : null}

        {activeTab === 'divisions' ? (
          <DivisionMatrixPage
            divisions={divisions}
            agents={agents}
            collaborationPairs={collaborationPairs}
          />
        ) : null}

        {activeTab === 'contracts' ? <ContractRegistryPage ports={ports} /> : null}

        {activeTab === 'rubrics' ? <RubricEvaluatorPage agents={agents} /> : null}
      </main>

      <footer className="border-t border-[#E5E3DC] bg-white/80 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-[#161B22]/80 dark:text-slate-400">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 sm:px-6">
          <span>LokaTalenta Documentation Hub · SQLite FTS5 + Event Gateway</span>
          <span className="font-mono-tabular">API :4104 · Dev :4114 · 24 Agents</span>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DocsHubShell />
    </QueryClientProvider>
  );
}

export default App;
