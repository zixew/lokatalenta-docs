import { isValidElement, useMemo, type ReactNode } from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { isSafeMarkdownUrl } from '../lib/securityGuards.ts';
import { MermaidDiagram } from './MermaidDiagram.tsx';

export interface DocHeading {
  level: 2 | 3;
  text: string;
  id: string;
}

function slugifyHeading(text: string): string {
  return (
    text
      .toLowerCase()
      .replace(/[`*_~[\]()]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section'
  );
}

function createHeadingSlugger() {
  const seen = new Map<string, number>();
  return (text: string): string => {
    const base = slugifyHeading(text);
    const count = (seen.get(base) ?? 0) + 1;
    seen.set(base, count);
    return count === 1 ? base : `${base}-${count}`;
  };
}

function extractNodeText(node: ReactNode): string {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractNodeText).join('');
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return extractNodeText(node.props.children);
  }
  return '';
}

/** Parse level-2 and level-3 markdown headings outside fenced code blocks. */
export function extractHeadings(markdown: string): DocHeading[] {
  const headings: DocHeading[] = [];
  const nextSlug = createHeadingSlugger();
  let inFence = false;

  for (const rawLine of markdown.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (/^(`{3,}|~{3,})/.test(trimmed)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(trimmed);
    if (!match) continue;
    const level = match[1].length as 2 | 3;
    const text = match[2].replace(/[`*_~]/g, '').trim();
    if (!text) continue;
    headings.push({ level, text, id: nextSlug(text) });
  }
  return headings;
}

interface SafeMarkdownProps {
  content: string;
  className?: string;
}

function createMarkdownComponents(): Components {
  const nextSlug = createHeadingSlugger();

  return {
    h1: ({ children }) => (
      <h1 className="mb-4 mt-2 border-b border-[#E5E3DC] pb-2 text-2xl font-bold text-[#18181B] dark:border-zinc-800 dark:text-slate-100">
        {children}
      </h1>
    ),
    h2: ({ children }) => {
      const id = nextSlug(extractNodeText(children));
      return (
        <h2
          id={id}
          className="group mb-3 mt-6 scroll-mt-24 text-xl font-semibold text-[#18181B] dark:text-slate-100"
        >
          {children}
          <a
            href={`#${id}`}
            aria-label="Link to section"
            className="ml-2 text-sm font-normal text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#0F766E] dark:text-slate-500 dark:hover:text-teal-400"
          >
            #
          </a>
        </h2>
      );
    },
    h3: ({ children }) => {
      const id = nextSlug(extractNodeText(children));
      return (
        <h3
          id={id}
          className="group mb-2 mt-5 scroll-mt-24 text-base font-semibold text-[#18181B] dark:text-slate-100"
        >
          {children}
          <a
            href={`#${id}`}
            aria-label="Link to subsection"
            className="ml-1.5 text-xs font-normal text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100 hover:text-[#0F766E] dark:text-slate-500 dark:hover:text-teal-400"
          >
            #
          </a>
        </h3>
      );
    },
  p: ({ children }) => (
    <p className="my-3 text-sm leading-7 text-zinc-700 dark:text-slate-300">
      {children}
    </p>
  ),
  ul: ({ children }) => (
    <ul className="my-3 list-disc space-y-1.5 pl-6 text-sm text-zinc-700 dark:text-slate-300">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="my-3 list-decimal space-y-1.5 pl-6 text-sm text-zinc-700 dark:text-slate-300">
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="leading-6">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l-2 border-[#0F766E] bg-teal-50/40 px-4 py-2 text-sm text-zinc-700 dark:border-teal-400 dark:bg-teal-950/20 dark:text-slate-300">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-4 w-full max-w-full overflow-x-auto rounded-lg border border-[#E5E3DC] dark:border-zinc-800">
      <table className="w-full border-collapse text-left text-xs sm:text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-[#E5E3DC] bg-[#F6F5F1] text-zinc-800 dark:border-zinc-800 dark:bg-[#0D1117] dark:text-slate-200">
      {children}
    </thead>
  ),
  th: ({ children }) => <th className="px-3 py-2 font-semibold">{children}</th>,
  td: ({ children }) => (
    <td className="border-t border-[#E5E3DC] px-3 py-2 text-zinc-700 dark:border-zinc-800 dark:text-slate-300">
      {children}
    </td>
  ),
  a: ({ href, children }) => {
    if (!href || !isSafeMarkdownUrl(href)) {
      return (
        <span className="text-zinc-500 line-through dark:text-slate-500">
          {children}
        </span>
      );
    }
    const isExternal = /^https?:/i.test(href);
    return (
      <a
        href={href}
        target={isExternal ? '_blank' : undefined}
        rel={isExternal ? 'noopener noreferrer' : undefined}
        className="font-medium text-[#0F766E] underline decoration-teal-600/40 underline-offset-2 hover:text-[#115E59] dark:text-teal-400 dark:hover:text-teal-300"
      >
        {children}
      </a>
    );
  },
  img: ({ src, alt }) => {
    if (!src || !isSafeMarkdownUrl(src)) {
      return (
        <span className="inline-block rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300">
          Blocked unsafe image URL
        </span>
      );
    }
    return (
      <img
        src={src}
        alt={alt ?? ''}
        loading="lazy"
        className="my-3 max-w-full rounded-lg border border-[#E5E3DC] dark:border-zinc-800"
      />
    );
  },
  pre: ({ children }) => <>{children}</>,
  code: ({ className, children }) => {
    const raw = String(children).replace(/\n$/, '');
    const match = /language-([a-zA-Z0-9_-]+)/.exec(className ?? '');
    const language = match?.[1]?.toLowerCase();

    if (language === 'mermaid') {
      return <MermaidDiagram chart={raw} />;
    }

    const isBlock = Boolean(language) || raw.includes('\n');
    if (isBlock) {
      return (
        <pre className="my-3 w-full max-w-full overflow-x-auto rounded-lg border border-[#E5E3DC] bg-[#0D1117] p-3.5 font-mono text-xs leading-relaxed text-slate-100 dark:border-zinc-800">
          <code>{raw}</code>
        </pre>
      );
    }

    return (
      <code className="break-words rounded border border-[#E5E3DC] bg-[#F6F5F1] px-1.5 py-0.5 font-mono text-xs text-[#0F766E] dark:border-zinc-700 dark:bg-zinc-800 dark:text-teal-300">
        {raw}
      </code>
    );
  },
  };
}

export function SafeMarkdown({ content, className = '' }: SafeMarkdownProps) {
  const components = useMemo(() => createMarkdownComponents(), [content]);
  return (
    <div className={`w-full min-w-0 break-words ${className}`} data-testid="safe-markdown">
      <Markdown
        remarkPlugins={[remarkGfm]}
        urlTransform={(url) => (isSafeMarkdownUrl(url) ? url : '')}
        components={components}
      >
        {content}
      </Markdown>
    </div>
  );
}
