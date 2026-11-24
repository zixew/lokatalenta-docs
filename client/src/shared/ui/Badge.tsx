import type { ReactNode } from 'react';

export type BadgeTone =
  | 'teal'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'blue'
  | 'purple'
  | 'cyan'
  | 'pink'
  | 'slate';

const TONE_CLASSES: Record<BadgeTone, string> = {
  teal: 'bg-teal-50 text-[#0F766E] border-teal-200 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800',
  emerald:
    'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800',
  amber:
    'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800',
  rose: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800',
  blue: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800',
  purple:
    'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800',
  cyan: 'bg-cyan-50 text-cyan-800 border-cyan-200 dark:bg-cyan-950/60 dark:text-cyan-300 dark:border-cyan-800',
  pink: 'bg-pink-50 text-pink-800 border-pink-200 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-800',
  slate:
    'bg-zinc-100 text-zinc-700 border-[#E5E3DC] dark:bg-zinc-800/80 dark:text-slate-300 dark:border-zinc-700',
};

interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}

export function Badge({ tone = 'slate', children, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium tracking-tight ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
