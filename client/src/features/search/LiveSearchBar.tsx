import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { docsApi } from '../../shared/api/docsApi.ts';
import type {
  DivisionId,
  DocCategory,
  DocSearchResult,
} from '../../shared/types/domain.ts';
import { Badge } from '../../shared/ui/Badge.tsx';

interface LiveSearchBarProps {
  categoryFilter: DocCategory | '';
  divisionFilter: DivisionId | '';
  onSelectDoc: (slug: string) => void;
}

function renderHighlightedSnippet(snippet: string) {
  const parts = snippet.split(/(\[\[.*?\]\])/g);
  return parts.map((part, idx) => {
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const text = part.slice(2, -2);
      return (
        <mark
          key={idx}
          className="rounded bg-teal-100 px-1 py-0.5 font-medium text-teal-900 dark:bg-teal-900/60 dark:text-teal-200"
        >
          {text}
        </mark>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

export function LiveSearchBar({
  categoryFilter,
  divisionFilter,
  onSelectDoc,
}: LiveSearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<DocSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await docsApi.searchDocs({
          q: trimmed,
          category: categoryFilter,
          division: divisionFilter,
        });
        if (!cancelled) {
          setResults(res.results);
          setOpen(true);
        }
      } catch {
        if (!cancelled) {
          setResults([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, categoryFilter, divisionFilter]);

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <div className="relative flex items-center">
        <Search
          className="pointer-events-none absolute left-3 h-4 w-4 text-zinc-400"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="search"
          value={query}
          onFocus={() => {
            if (query.trim()) setOpen(true);
          }}
          onChange={(e) => {
            const nextVal = e.target.value;
            setQuery(nextVal);
            if (nextVal.trim()) {
              setOpen(true);
            } else {
              setResults([]);
              setLoading(false);
              setOpen(false);
            }
          }}
          placeholder="Search docs, ADRs, contracts... (Ctrl+K)"
          aria-label="Search documentation"
          data-testid="docs-search-input"
          className="min-h-[44px] w-full rounded-lg border border-[#E5E3DC] bg-[#F6F5F1]/80 pl-9 pr-9 text-sm text-[#18181B] placeholder:text-zinc-500 focus:border-[#0F766E] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]/20 dark:border-zinc-700 dark:bg-[#0D1117] dark:text-slate-100 dark:placeholder:text-slate-400 sm:min-h-[38px]"
        />
        {query ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery('');
              setResults([]);
              setOpen(false);
            }}
            className="absolute right-2 rounded p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {open && query.trim() ? (
        <div
          data-testid="docs-search-results"
          className="absolute left-0 right-0 top-full z-40 mt-1.5 max-h-96 overflow-y-auto rounded-xl border border-[#E5E3DC] bg-white p-2 shadow-lg dark:border-zinc-700 dark:bg-[#161B22]"
        >
          {loading ? (
            <p className="px-3 py-4 text-center text-xs text-zinc-500 dark:text-slate-400">
              Searching FTS5 index...
            </p>
          ) : results.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-zinc-500 dark:text-slate-400">
              No documents match &ldquo;{query.trim()}&rdquo;.
            </p>
          ) : (
            <ul className="space-y-1">
              {results.map((item) => (
                <li key={item.slug}>
                  <button
                    type="button"
                    onClick={() => {
                      onSelectDoc(item.slug);
                      setOpen(false);
                    }}
                    className="w-full rounded-lg border border-transparent p-2.5 text-left transition-colors hover:border-[#E5E3DC] hover:bg-[#F6F5F1] dark:hover:border-zinc-700 dark:hover:bg-zinc-800/70"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-[#18181B] dark:text-slate-100">
                        {item.title}
                      </span>
                      <div className="flex shrink-0 items-center gap-1">
                        <Badge tone="teal">{item.category}</Badge>
                        <Badge tone="slate">{item.divisionId}</Badge>
                      </div>
                    </div>
                    {item.snippet ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-600 dark:text-slate-400">
                        {renderHighlightedSnippet(item.snippet)}
                      </p>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
