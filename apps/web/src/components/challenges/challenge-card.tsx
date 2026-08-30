import Link from 'next/link';
import type { Challenge } from '@zporter/shared';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';

const STATUS_TONE = {
  draft: 'neutral',
  active: 'success',
  ended: 'danger',
} as const;

export function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const deadline = new Date(challenge.deadline).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
  });

  return (
    <Link href={`/challenges/${challenge.id}`} className="block">
      <Card className="h-full transition-colors hover:border-primary/50">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-sm font-semibold text-fg">{challenge.title}</h3>
          <Pill tone={STATUS_TONE[challenge.status]} className="shrink-0 capitalize">
            {challenge.status}
          </Pill>
        </div>
        {challenge.ingress && (
          <p className="mt-1 line-clamp-2 text-xs text-muted">{challenge.ingress}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <span>👥 {challenge.participantCount}</span>
          <span>⏱ {challenge.durationMinutes}m</span>
          <span>🏆 {challenge.rewardPoints}p</span>
          <span className="capitalize">{challenge.mainCategory}</span>
          <span>ends {deadline}</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {challenge.collections.slice(0, 3).map((c) => (
            <Pill key={c} tone="skill" className="capitalize">
              {c}
            </Pill>
          ))}
          {challenge.equipmentTags.slice(0, 2).map((t) => (
            <Pill key={t} tone="equip">
              {t}
            </Pill>
          ))}
        </div>
      </Card>
    </Link>
  );
}
