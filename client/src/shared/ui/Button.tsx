import type { ButtonHTMLAttributes, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-[#0F766E] text-white border-[#0F766E] hover:bg-[#115E59] dark:bg-teal-600 dark:border-teal-500 dark:hover:bg-teal-500',
  secondary:
    'bg-white text-[#18181B] border-[#E5E3DC] hover:bg-[#F6F5F1] dark:bg-[#161B22] dark:text-slate-100 dark:border-zinc-700 dark:hover:bg-zinc-800',
  ghost:
    'bg-transparent text-zinc-700 border-transparent hover:bg-zinc-100 dark:text-slate-300 dark:hover:bg-zinc-800',
  danger:
    'bg-[#E11D48] text-white border-[#E11D48] hover:bg-rose-700 dark:bg-rose-600 dark:border-rose-500 dark:hover:bg-rose-500',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'min-h-[44px] sm:min-h-[34px] px-3 py-1.5 text-xs',
  md: 'min-h-[44px] sm:min-h-[38px] px-4 py-2 text-sm',
};

export function Button({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border font-medium transition-all duration-200 ease-out active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 dark:focus-visible:ring-teal-400 dark:focus-visible:ring-offset-[#0D1117] ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
