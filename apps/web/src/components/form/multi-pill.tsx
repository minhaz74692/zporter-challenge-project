'use client';

import { useState } from 'react';
import { cn } from '@/components/ui/cn';

/** Figma "Add to Collections as" — a wrapping grid of togglable dark pills. */
export function MultiPill({
  name,
  options,
  defaultValue = [],
  grid,
}: {
  name: string;
  options: string[];
  defaultValue?: string[];
  grid?: number;
}) {
  const [selected, setSelected] = useState<string[]>(defaultValue);
  const toggle = (v: string) =>
    setSelected((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));

  return (
    <>
      {selected.map((v) => (
        <input key={v} type="hidden" name={name} value={v} />
      ))}
      <div
        className={cn('flex flex-wrap gap-2', grid && 'grid')}
        style={grid ? { gridTemplateColumns: `repeat(${grid}, minmax(0,1fr))` } : undefined}
      >
        {options.map((o) => {
          const active = selected.includes(o);
          return (
            <button
              key={o}
              type="button"
              onClick={() => toggle(o)}
              className={cn(
                'h-8 rounded-[var(--radius-pill)] px-3 text-[12px] font-medium transition-colors',
                grid ? 'w-full' : '',
                active
                  ? 'bg-primary/20 text-primary ring-1 ring-primary/50'
                  : 'bg-surface-2 text-muted hover:bg-surface-3 hover:text-fg',
              )}
            >
              {o}
            </button>
          );
        })}
      </div>
    </>
  );
}
