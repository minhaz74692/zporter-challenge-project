'use client';

import { useRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { ChevronDown, CircleX } from 'lucide-react';
import { cn } from '@/components/ui/cn';

/**
 * The Figma create-form field: a small label above a dark filled box, an
 * optional hint below, an optional trailing adornment, and an optional
 * circular clear button (clears the box's input/textarea).
 */
export function FilledField({
  label,
  hint,
  right,
  clearable,
  className,
  children,
}: {
  label: string;
  hint?: string;
  right?: ReactNode;
  clearable?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const clear = () => {
    const el = box.current?.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      'input, textarea',
    );
    if (el) {
      el.value = '';
      el.focus();
    }
  };

  return (
    <div className={className}>
      <span className="mb-1 block pl-1 text-[11px] font-medium text-faint">{label}</span>
      <div
        ref={box}
        className="relative rounded-[var(--radius-control)] bg-field/80 px-3.5 py-2.5 ring-1 ring-white/[0.04] focus-within:ring-primary/50"
      >
        {children}
        {clearable && (
          <button
            type="button"
            onClick={clear}
            aria-label={`Clear ${label}`}
            className="absolute right-2.5 top-2.5 text-faint transition-colors hover:text-fg"
          >
            <CircleX className="h-[18px] w-[18px]" />
          </button>
        )}
        {right && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
            {right}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 pl-1 text-[11px] text-faint">{hint}</p>}
    </div>
  );
}

const bare =
  'w-full bg-transparent text-[13.5px] text-fg placeholder:text-faint focus:outline-none';

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(bare, className)} {...props} />;
}

export function TextArea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(bare, 'block min-h-24 resize-y', className)} {...props} />;
}

export function SelectInput({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select className={cn(bare, 'appearance-none pr-6', className)} {...props}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
    </div>
  );
}
