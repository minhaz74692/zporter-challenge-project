'use client';

import { useEffect, useMemo, useState } from 'react';
import type { UserSummary } from '@zporter/shared';
import { ChevronDown, ListFilter, Search } from 'lucide-react';
import { cn } from '@/components/ui/cn';

const TABS = ['Teammates', 'Friends', 'Fans', 'Search'] as const;
type Tab = (typeof TABS)[number];
const COLS = ['Name', 'Role', 'Club', 'Status'] as const;

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
 * Figma "Challenge Invites" — Teammates / Friends / Fans / Search sub-tabs over
 * a Name / Role / Club / Status table with row checkboxes. Only Search is wired
 * (no friend/fan graph in the prototype); checked rows emit
 * `<input name="invitedUserIds">` straight into the create form.
 */
export function InvitesPanel() {
  const [tab, setTab] = useState<Tab>('Search');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState<Record<string, UserSummary>>({});

  useEffect(() => {
    let off = false;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users?query=${encodeURIComponent(query)}`, {
          cache: 'no-store',
        });
        const data = res.ok ? ((await res.json()) as UserSummary[]) : [];
        if (!off) setResults(data);
      } finally {
        if (!off) setLoading(false);
      }
    }, 250);
    return () => {
      off = true;
      clearTimeout(t);
    };
  }, [query]);

  const pickedList = useMemo(() => Object.values(picked), [picked]);
  const toggle = (u: UserSummary) =>
    setPicked((cur) => {
      const next = { ...cur };
      if (next[u.id]) delete next[u.id];
      else next[u.id] = u;
      return next;
    });

  // Search tab shows live results; other tabs would show their own roster — here
  // they fall back to whoever's already picked so the selection stays visible.
  const rows = tab === 'Search' ? results : pickedList;

  return (
    <div className="space-y-4">
      {pickedList.map((u) => (
        <input key={u.id} type="hidden" name="invitedUserIds" value={u.id} />
      ))}

      <div className="flex gap-7 border-b border-border-soft text-[13px]">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              'pb-2',
              tab === t
                ? 'border-b-2 border-accent font-medium text-accent'
                : 'text-muted hover:text-fg',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-success">
          {pickedList.length} Selected
        </span>
        <span className="flex items-center gap-3 text-muted">
          <ListFilter className="h-4 w-4" />
        </span>
      </div>

      {tab === 'Search' && (
        <div className="flex items-center gap-2 rounded-[var(--radius-control)] bg-field/80 px-3 ring-1 ring-white/[0.04]">
          <Search className="h-4 w-4 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search players by name"
            className="h-10 w-full bg-transparent text-[13px] text-fg placeholder:text-faint focus:outline-none"
          />
        </div>
      )}

      <div className="overflow-hidden rounded-[var(--radius-control)] ring-1 ring-white/[0.04]">
        <table className="w-full text-left text-[12px]">
          <thead className="bg-field/60 text-faint">
            <tr>
              <th className="w-10 px-3 py-2" />
              {COLS.map((c) => (
                <th key={c} className="px-3 py-2 font-medium">
                  <span className="inline-flex items-center gap-1">
                    {c}
                    <ChevronDown className="h-3 w-3" />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tab !== 'Search' && pickedList.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-faint">
                  {tab} aren’t available in the prototype — use{' '}
                  <span className="text-muted">Search</span> to invite players.
                </td>
              </tr>
            ) : loading && rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-faint">
                  Searching…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-faint">
                  No players found.
                </td>
              </tr>
            ) : (
              rows.map((u) => {
                const on = !!picked[u.id];
                return (
                  <tr
                    key={u.id}
                    onClick={() => toggle(u)}
                    className="cursor-pointer border-t border-white/[0.04] hover:bg-white/[0.02]"
                  >
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          'flex h-4 w-4 items-center justify-center rounded-[4px] ring-1',
                          on ? 'bg-primary ring-primary' : 'ring-border',
                        )}
                      >
                        {on && (
                          <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none">
                            <path
                              d="M2.5 6.5l2.5 2.5 4.5-5"
                              stroke="currentColor"
                              strokeWidth="1.8"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className="flex items-center gap-2 text-fg">
                        <Avatar user={u} />
                        {u.displayName}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted">{u.position ?? '—'}</td>
                    <td className="px-3 py-2 text-muted">{u.club ?? '—'}</td>
                    <td className="px-3 py-2 text-faint">-</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
