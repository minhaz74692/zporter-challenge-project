import type { ButtonHTMLAttributes } from 'react';
import { cn } from './cn';

type Variant = 'primary' | 'danger' | 'outline' | 'ghost';
type Size = 'sm' | 'md';

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover disabled:opacity-50',
  danger: 'bg-danger/10 text-danger border border-danger/40 hover:bg-danger/20',
  outline: 'border border-border text-fg hover:bg-surface-2',
  ghost: 'text-muted hover:text-fg hover:bg-surface-2',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)] font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
