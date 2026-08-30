'use client';

import { useState } from 'react';
import { cn } from '@/components/ui/cn';

/** Figma "Main Category" / "Share with" — a grid of pill buttons, one selected (solid orange). */
export function Segmented<T extends string>({
  name,
  options,
  defaultValue,
  columns = 4,
}: {
  name: string;
  options: { value: T; label: string }[];
  defaultValue: T;
  columns?: number;
}) {
  const [value, setValue] = useState<T>(defaultValue);
  return (
    <>
      <input type="hidden" name={name} value={value} />
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => setValue(o.value)}
              className={cn(
                'h-9 rounded-[var(--radius-pill)] px-3 text-[12.5px] font-medium transition-colors',
                active
                  ? 'bg-accent text-black'
                  : 'bg-surface-2 text-muted hover:bg-surface-3 hover:text-fg',
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </>
  );
}
