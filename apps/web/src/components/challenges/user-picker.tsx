'use client';

import { useEffect, useMemo, useState } from 'react';
import type { UserSummary } from '@zporter/shared';
import { cn } from '@/components/ui/cn';
import { Search, X } from 'lucide-react';

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

function Avatar({ user }: { user: UserSummary }) {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-3 text-[10px] font-semibold text-muted">
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        initials(user.displayName)
      )}
    </span>
  );
}

/**
 * Reusable multi-select user search. Knows nothing about challenges or invites —
 * it just resolves people and emits `<input name={name}>` per selection so it
 * drops straight into any form.
 */
export function UserPicker({
  name,
  excludeIds = [],
}: {
  name: string;
  excludeIds?: string[];
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSummary[]>([]);
  const [selected, setSelected] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const hidden = useMemo(
    () => new Set([...excludeIds, ...selected.map((s) => s.id)]),
    [excludeIds, selected],
  );

  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(async () => {
      if (cancelled) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/users?query=${encodeURIComponent(query)}`, {
          cache: 'no-store',
        });
        const data = res.ok ? ((await res.json()) as UserSummary[]) : [];
        if (!cancelled) setResults(data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);

  const visible = results.filter((u) => !hidden.has(u.id));

  return (
    <div className="space-y-3">
      {selected.map((u) => (
        <input key={u.id} type="hidden" name={name} value={u.id} />
      ))}

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selected.map((u) => (
            <span
              key={u.id}
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-primary/15 py-1 pl-1 pr-2 text-[12px] text-primary"
            >
              <Avatar user={u} />
              {u.displayName}
              <button
                type="button"
                onClick={() => setSelected((s) => s.filter((x) => x.id !== u.id))}
                aria-label={`Remove ${u.displayName}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 rounded-[var(--radius-control)] bg-surface-2 px-3">
        <Search className="h-4 w-4 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search players by name"
          className="h-10 w-full bg-transparent text-[13px] text-fg placeholder:text-faint focus:outline-none"
        />
      </div>

      <ul className="max-h-56 overflow-y-auto rounded-[var(--radius-control)] border border-border-soft">
        {loading && <li className="px-3 py-2 text-[12px] text-faint">Searching…</li>}
        {!loading && visible.length === 0 && (
          <li className="px-3 py-2 text-[12px] text-faint">No players found.</li>
        )}
        {visible.map((u) => (
          <li key={u.id}>
            <button
              type="button"
              onClick={() => setSelected((s) => [...s, u])}
              className={cn(
                'flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-surface-2',
              )}
            >
              <Avatar user={u} />
              <span className="min-w-0">
                <span className="block truncate text-[13px] text-fg">{u.displayName}</span>
                <span className="block truncate text-[11px] text-faint">
                  {u.handle}
                  {u.club ? ` · ${u.club}` : ''}
                  {u.position ? ` · ${u.position}` : ''}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
