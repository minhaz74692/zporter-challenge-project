import type { HTMLAttributes } from 'react';
import { cn } from './cn';

/**
 * Surface panel. `padded` (default) applies the standard inset; pass
 * `padded={false}` when a child needs to bleed to the edges (e.g. a cover
 * image) and add your own spacing inside.
 */
export function Card({
  className,
  padded = true,
  ...props
}: HTMLAttributes<HTMLDivElement> & { padded?: boolean }) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-card)] border border-border bg-surface',
        padded && 'p-5',
        className,
      )}
      {...props}
    />
  );
}
