import { useEffect, useId, useRef, useState } from 'react';
import { Code2, Eye } from 'lucide-react';
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
  const [status, setStatus] = useState<'loading' | 'rendered' | 'fallback'>('loading');
  const [showSource, setShowSource] = useState(false);

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

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-[#E5E3DC] bg-[#F6F5F1]/60 dark:border-zinc-800 dark:bg-[#0D1117]">
      <div className="flex items-center justify-between border-b border-[#E5E3DC] bg-white px-3 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:bg-[#161B22] dark:text-slate-400">
        <span className="font-mono-tabular font-medium uppercase tracking-wider text-[#0F766E] dark:text-teal-400">
          Mermaid Diagram
        </span>
        <button
          type="button"
          onClick={() => setShowSource((prev) => !prev)}
          className="inline-flex min-h-[32px] items-center gap-1 rounded border border-[#E5E3DC] px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-slate-300 dark:hover:bg-zinc-800"
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

      {showSource || status === 'fallback' ? (
        <pre
          data-testid="mermaid-fallback"
          className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-zinc-800 dark:text-slate-200"
        >
          <code>{chart}</code>
        </pre>
      ) : (
        <div
          ref={containerRef}
          data-testid="mermaid-diagram"
          className="overflow-x-auto p-4 [&_svg]:mx-auto [&_svg]:max-w-full"
        >
          {status === 'loading' ? (
            <p className="text-xs text-zinc-500 dark:text-slate-400">
              Rendering diagram...
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
