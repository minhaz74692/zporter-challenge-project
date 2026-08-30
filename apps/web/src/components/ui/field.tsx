import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from './cn';

const control =
  'w-full rounded-[var(--radius-control)] border border-border bg-surface-2 px-3 py-2 text-sm text-fg ' +
  'placeholder:text-faint focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30';

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted">{label}</span>
      {children}
      {hint && !error && <span className="block text-xs text-faint">{hint}</span>}
      {error && <span className="block text-xs text-danger">{error}</span>}
    </label>
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(control, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(control, 'min-h-24 resize-y', className)} {...props} />;
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cn(control, 'appearance-none', className)} {...props} />;
}
