'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

/** Figma "Tags" — selected tags as blue pills, a grid of popular tags to add. */
export function TagPicker({
  name,
  options,
  defaultValue = [],
}: {
  name: string;
  options: string[];
  defaultValue?: string[];
}) {
  const [selected, setSelected] = useState<string[]>(defaultValue);
  const add = (t: string) => setSelected((c) => (c.includes(t) ? c : [...c, t]));
  const remove = (t: string) => setSelected((c) => c.filter((x) => x !== t));

  return (
    <div className="space-y-3">
      {selected.map((t) => (
        <input key={t} type="hidden" name={name} value={t} />
      ))}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((t) => (
            <span
              key={t}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-primary px-3 py-1 text-[12px] font-medium text-white"
            >
              {t}
              <button type="button" onClick={() => remove(t)} aria-label={`Remove ${t}`}>
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div>
        <p className="mb-2 text-[11px] text-faint">Popular tags</p>
        <div className="flex flex-wrap gap-2">
          {options
            .filter((o) => !selected.includes(o))
            .map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => add(o)}
                className="h-7 rounded-[var(--radius-pill)] bg-surface-2 px-3 text-[12px] text-muted transition-colors hover:bg-surface-3 hover:text-fg"
              >
                {o}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
}
