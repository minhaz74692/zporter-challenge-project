import type { HTMLAttributes } from 'react';
import { cn } from './cn';

type Tone = 'skill' | 'primary' | 'equip' | 'neutral' | 'success' | 'accent' | 'danger';

const tones: Record<Tone, string> = {
  skill: 'bg-primary/15 text-primary',
  primary: 'bg-primary text-white',
  equip: 'bg-pill-equip text-fg/80',
  neutral: 'bg-surface-2 text-muted',
  success: 'bg-success/15 text-success',
  accent: 'bg-accent/15 text-accent',
  danger: 'bg-danger/15 text-danger',
};

export function Pill({
  tone = 'neutral',
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
