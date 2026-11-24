import { useEffect, useId, useRef, useState } from 'react';
import { Code2, Eye, Maximize2, Minimize2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { sanitizeSvgMarkup } from '../lib/svgSanitizer.ts';
import { useThemeStore } from '../stores/useThemeStore.ts';

interface MermaidDiagramProps {
  chart: string;
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const reactId = useId();
  const safeId = `mermaid-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const theme = useThemeStore((s) => s.theme);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const expandedContainerRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'rendered' | 'fallback'>('loading');
  const [showSource, setShowSource] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [expanded, setExpanded] = useState(false);
  const [renderedSvg, setRenderedSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderChart() {
      if (showSource) return;
      try {
        const mermaidMod = await import('mermaid');
        const mermaid = mermaidMod.default;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'strict',
          theme: theme === 'dark' ? 'dark' : 'neutral',
        });

        const { svg } = await mermaid.render(safeId, chart);
        if (cancelled) return;

        const cleanSvg = sanitizeSvgMarkup(svg);
        if (!cleanSvg || !containerRef.current) {
          setStatus('fallback');
          return;
        }

        const parser = new DOMParser();
        const doc = parser.parseFromString(cleanSvg, 'image/svg+xml');
        const svgElement = doc.documentElement;
        if (!svgElement || svgElement.tagName.toLowerCase() !== 'svg') {
          setStatus('fallback');
          return;
        }

        const imported = document.importNode(svgElement, true);
        containerRef.current.replaceChildren(imported);
        setRenderedSvg(cleanSvg);
        setStatus('rendered');
      } catch {
        if (!cancelled) {
          setStatus('fallback');
        }
      }
    }

    void renderChart();
    return () => {
      cancelled = true;
    };
  }, [chart, safeId, theme, showSource]);

  useEffect(() => {
    if (!expanded || !renderedSvg || !expandedContainerRef.current) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(renderedSvg, 'image/svg+xml');
    const svgElement = doc.documentElement;
    if (svgElement && svgElement.tagName.toLowerCase() === 'svg') {
      const imported = document.importNode(svgElement, true);
      expandedContainerRef.current.replaceChildren(imported);
    }
  }, [expanded, renderedSvg]);

  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExpanded(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [expanded]);

  const zoomOut = () => setZoom((z) => Math.max(0.5, Number((z - 0.25).toFixed(2))));
  const zoomIn = () => setZoom((z) => Math.min(2.25, Number((z + 0.25).toFixed(2))));
  const resetZoom = () => setZoom(1);

  return (
    <>
      <div className="my-4 overflow-hidden rounded-xl border border-[#E5E3DC] bg-[#F6F5F1]/60 dark:border-zinc-800 dark:bg-[#0D1117]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E3DC] bg-white px-3 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-[#161B22] dark:text-slate-400">
          <span className="font-mono-tabular font-medium uppercase tracking-wider text-[#0F766E] dark:text-teal-400">
            Mermaid Diagram
          </span>
          <div className="flex items-center gap-1.5">
            {!showSource && status === 'rendered' ? (
              <div className="inline-flex items-center rounded border border-[#E5E3DC] bg-[#F6F5F1]/70 dark:border-zinc-700 dark:bg-[#0D1117]">
                <button
                  type="button"
                  onClick={zoomOut}
                  aria-label="Zoom out diagram"
                  title="Zoom out"
                  className="inline-flex min-h-[28px] items-center justify-center px-1.5 text-zinc-600 hover:text-zinc-900 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={resetZoom}
                  title="Reset zoom"
                  className="font-mono-tabular min-h-[28px] border-x border-[#E5E3DC] px-2 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-slate-300 dark:hover:bg-zinc-800"
                >
                  {Math.round(zoom * 100)}%
                </button>
                <button
                  type="button"
                  onClick={zoomIn}
                  aria-label="Zoom in diagram"
                  title="Zoom in"
                  className="inline-flex min-h-[28px] items-center justify-center px-1.5 text-zinc-600 hover:text-zinc-900 dark:text-slate-400 dark:hover:text-slate-100"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : null}

            {!showSource && status === 'rendered' ? (
              <button
                type="button"
                onClick={() => setExpanded(true)}
                aria-label="Expand diagram"
                data-testid="mermaid-expand-btn"
                className="inline-flex min-h-[30px] items-center gap-1 rounded border border-[#E5E3DC] px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-slate-300 dark:hover:bg-zinc-800"
              >
                <Maximize2 className="h-3.5 w-3.5" />
                Expand
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => setShowSource((prev) => !prev)}
              className="inline-flex min-h-[30px] items-center gap-1 rounded border border-[#E5E3DC] px-2 py-1 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-slate-300 dark:hover:bg-zinc-800"
            >
              {showSource ? (
                <>
                  <Eye className="h-3.5 w-3.5" />
                  Preview
                </>
              ) : (
                <>
                  <Code2 className="h-3.5 w-3.5" />
                  Source
                </>
              )}
            </button>
          </div>
        </div>

        {showSource || status === 'fallback' ? (
          <pre
            data-testid="mermaid-fallback"
            className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-zinc-800 dark:text-slate-200"
          >
            <code>{chart}</code>
          </pre>
        ) : (
          <div className="overflow-auto p-4">
            <div
              ref={containerRef}
              data-testid="mermaid-diagram"
              style={
                zoom !== 1
                  ? {
                      transform: `scale(${zoom})`,
                      transformOrigin: 'top center',
                    }
                  : undefined
              }
              className="transition-transform duration-150 ease-out [&_svg]:mx-auto [&_svg]:max-w-full"
            >
              {status === 'loading' ? (
                <p className="text-xs text-zinc-500 dark:text-slate-400">
                  Rendering diagram...
                </p>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {expanded ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Expanded Mermaid Diagram"
          data-testid="mermaid-expanded-modal"
          className="fixed inset-0 z-50 flex flex-col bg-zinc-950/75 p-4 backdrop-blur-xs sm:p-6"
          onClick={() => setExpanded(false)}
        >
          <div
            className="mx-auto flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-[#E5E3DC] bg-white shadow-2xl dark:border-zinc-700 dark:bg-[#0D1117]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E3DC] bg-[#F6F5F1] px-4 py-2.5 dark:border-zinc-800 dark:bg-[#161B22]">
              <span className="font-mono-tabular text-xs font-semibold uppercase tracking-wider text-[#0F766E] dark:text-teal-400">
                Expanded Architecture Diagram
              </span>
              <div className="flex items-center gap-2">
                <div className="inline-flex items-center rounded border border-[#E5E3DC] bg-white dark:border-zinc-700 dark:bg-[#0D1117]">
                  <button
                    type="button"
                    onClick={zoomOut}
                    aria-label="Zoom out expanded diagram"
                    className="inline-flex min-h-[30px] items-center justify-center px-2 text-zinc-600 hover:text-zinc-900 dark:text-slate-400 dark:hover:text-slate-100"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="font-mono-tabular border-x border-[#E5E3DC] px-2.5 text-xs font-medium text-zinc-700 dark:border-zinc-700 dark:text-slate-300">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={zoomIn}
                    aria-label="Zoom in expanded diagram"
                    className="inline-flex min-h-[30px] items-center justify-center px-2 text-zinc-600 hover:text-zinc-900 dark:text-slate-400 dark:hover:text-slate-100"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={resetZoom}
                    aria-label="Reset zoom"
                    className="inline-flex min-h-[30px] items-center justify-center border-l border-[#E5E3DC] px-2 text-zinc-600 hover:text-zinc-900 dark:border-zinc-700 dark:text-slate-400 dark:hover:text-slate-100"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  className="inline-flex min-h-[30px] items-center gap-1 rounded border border-[#E5E3DC] bg-white px-2.5 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-[#0D1117] dark:text-slate-200 dark:hover:bg-zinc-800"
                >
                  <Minimize2 className="h-3.5 w-3.5" />
                  Close (Esc)
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-6">
              <div
                ref={expandedContainerRef}
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top center',
                }}
                className="transition-transform duration-150 ease-out [&_svg]:mx-auto [&_svg]:max-w-none"
              />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
