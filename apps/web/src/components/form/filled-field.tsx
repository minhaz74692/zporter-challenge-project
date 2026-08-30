import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/components/ui/cn';
import { ChevronDown } from 'lucide-react';

/** The Figma field: a filled dark box with a small label floating top-left. */
export function FilledField({
  label,
  hint,
  right,
  className,
  children,
}: {
  label: string;
  hint?: string;
  right?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <div className="relative rounded-[var(--radius-control)] bg-surface-2 px-3.5 pt-5 pb-2 focus-within:ring-1 focus-within:ring-primary/50">
        <span className="pointer-events-none absolute left-3.5 top-2 text-[10.5px] font-medium uppercase tracking-wide text-faint">
          {label}
        </span>
        {children}
        {right && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">{right}</span>
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
