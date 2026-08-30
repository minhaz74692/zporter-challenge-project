import type { LeaderboardEntry } from '@zporter/shared';
import { Info, ListFilter, Search } from 'lucide-react';
import { cn } from '@/components/ui/cn';

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
}

function Avatar({ entry, size }: { entry: LeaderboardEntry; size: number }) {
  return (
    <span
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-3 font-semibold text-muted"
      style={{ height: size, width: size, fontSize: size * 0.32 }}
    >
      {entry.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={entry.avatarUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        initials(entry.displayName)
      )}
    </span>
  );
}

const RANK_BADGE = ['bg-primary', 'bg-success', 'bg-[#22d3ee]'] as const;

function PodiumSlot({ entry, place }: { entry: LeaderboardEntry; place: 1 | 2 | 3 }) {
  const size = place === 1 ? 84 : 64;
  return (
    <div className={cn('flex flex-col items-center text-center', place === 1 ? 'order-2' : place === 2 ? 'order-1' : 'order-3')}>
      <div className="relative">
        <Avatar entry={entry} size={size} />
        <span
          className={cn(
            'absolute -bottom-1 left-1/2 flex h-6 w-6 -translate-x-1/2 items-center justify-center rounded-full text-[11px] font-bold text-white ring-2 ring-canvas',
            RANK_BADGE[place - 1],
          )}
        >
          {place}
        </span>
      </div>
      <p className="mt-2.5 max-w-[7rem] truncate text-[13px] font-semibold text-fg">
        {entry.displayName}
      </p>
      {entry.club && <p className="text-[11px] text-faint">{entry.club}</p>}
    </div>
  );
}

/** Figma "Leaderboard" tab — top-3 podium + full players table. Reused by create + detail. */
export function LeaderboardBoard({ entries }: { entries: LeaderboardEntry[] }) {
  const ranked = [...entries].sort((a, b) => a.rank - b.rank);
  const [first, second, third] = ranked;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] font-semibold text-fg">Leaderboard</h3>
        <Info className="h-4 w-4 text-muted" />
      </div>

      {ranked.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-faint">
          The leaderboard populates once players report results.
        </p>
      ) : (
        <>
          <div className="flex items-end justify-center gap-5 pt-2">
            {second && <PodiumSlot entry={second} place={2} />}
            {first && <PodiumSlot entry={first} place={1} />}
            {third && <PodiumSlot entry={third} place={3} />}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-success">
                {ranked.length} {ranked.length === 1 ? 'Player' : 'Players'}
              </span>
              <span className="flex items-center gap-3 text-muted">
                <Search className="h-4 w-4" />
                <ListFilter className="h-4 w-4" />
              </span>
            </div>

            <div className="overflow-hidden rounded-[var(--radius-control)] ring-1 ring-white/[0.04]">
              <table className="w-full text-left text-[12px]">
                <thead className="bg-field/60 text-faint">
                  <tr>
                    <th className="w-12 px-3 py-2 font-medium">Nr</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    <th className="px-3 py-2 font-medium">Team</th>
                    <th className="w-16 px-3 py-2 text-right font-medium">Index</th>
                  </tr>
                </thead>
                <tbody>
                  {ranked.map((e) => (
                    <tr key={e.userId} className="border-t border-white/[0.04]">
                      <td className="px-3 py-2 text-muted">{e.rank}</td>
                      <td className="px-3 py-2 text-fg">{e.displayName}</td>
                      <td className="px-3 py-2 text-muted">{e.club ?? '—'}</td>
                      <td className="px-3 py-2 text-right font-semibold text-fg">{e.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
