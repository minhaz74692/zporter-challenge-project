import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Challenge } from '@zporter/shared';
import {
  Bookmark,
  ChevronRight,
  Clock,
  Heart,
  MessageSquare,
  Share2,
  Timer,
  Trophy,
  Users,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Pill } from '@/components/ui/pill';
import { cn } from '@/components/ui/cn';
import { CoverHeader } from './cover-header';

const STATUS_BADGE: Record<'draft' | 'ended', string> = {
  draft: 'bg-black/55 text-white/90',
  ended: 'bg-danger/90 text-white',
};

const pad = (n: number) => String(n).padStart(2, '0');
/** Figma date format: `2023-12-01 at 18:00`. */
const fmtWhen = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} at ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const ageLabel = (from?: number, to?: number) => {
  if (from && to) return `${from}-${to}Y`;
  if (from) return `${from}Y+`;
  if (to) return `≤${to}Y`;
  return 'All ages';
};

export function ChallengeCard({
  challenge,
  priority = false,
}: {
  challenge: Challenge;
  priority?: boolean;
}) {
  const detailHref = `/challenges/${challenge.id}`;
  const badge = challenge.status !== 'active' ? STATUS_BADGE[challenge.status] : null;

  return (
    <Card
      padded={false}
      className="flex h-full flex-col overflow-hidden transition-colors hover:border-primary/50"
    >
      <Link href={detailHref} className="block">
        <CoverHeader
          src={challenge.mediaImageUrl}
          media={challenge.media}
          interactiveMedia={false}
          title={challenge.title}
          subtitle={challenge.ingress}
          priority={priority}
          topLeft={
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm">
              <Timer className="h-4 w-4 text-white" strokeWidth={1.75} />
            </span>
          }
          topRight={
            badge ? (
              <span
                className={cn(
                  'rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize backdrop-blur-sm',
                  badge,
                )}
              >
                {challenge.status}
              </span>
            ) : undefined
          }
        />
      </Link>

      <div className="flex flex-1 flex-col px-4 pb-3.5 pt-3">
        <div className="space-y-2">
          {/* stat trio — icon + value, spread edge to edge (Figma) */}
          <div className="flex items-center justify-between">
            <Stat icon={<Users className="h-4 w-4" />} value={challenge.participantCount} />
            <Stat icon={<Clock className="h-4 w-4" />} value={`${challenge.durationMinutes} min`} />
            <Stat icon={<Trophy className="h-4 w-4" />} value={`${challenge.rewardPoints}p`} />
          </div>

          {/* meta quad — age · location · category · position */}
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span>{ageLabel(challenge.ageFrom, challenge.ageTo)}</span>
            <span className="capitalize">{challenge.location}</span>
            <span className="capitalize">{challenge.mainCategory}</span>
            <span className="max-w-[25%] truncate">{challenge.position ?? 'All'}</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted">
            <span>Start {fmtWhen(challenge.startAt)}</span>
            <span>Stop {fmtWhen(challenge.deadline)}</span>
          </div>

          {challenge.equipmentTags.length > 0 && (
            <TagRow items={challenge.equipmentTags} tone="equip" />
          )}
          {challenge.collections.length > 0 && (
            <TagRow items={challenge.collections} tone="primary" />
          )}
        </div>

        <div className="mt-auto space-y-2.5 border-t border-border-soft pt-2.5">
          <Link
            href={detailHref}
            className="relative flex items-center justify-center text-[13px] font-semibold text-fg hover:text-accent"
          >
            Challenge details
            <ChevronRight className="absolute right-0 h-4 w-4 text-muted" />
          </Link>

          {/* Feed engagement — presentational on the card; actions live on the detail page. */}
          <div className="flex items-center gap-6 text-[12px] text-muted">
            <span className="flex items-center gap-1.5">
              <Heart className="h-[18px] w-[18px] fill-success text-success" />
              {challenge.likeCount}
            </span>
            <Share2 className="h-[18px] w-[18px]" />
            <span className="flex items-center gap-1.5">
              <MessageSquare className="h-[18px] w-[18px]" />
              {challenge.commentCount}
            </span>
            <Bookmark className="ml-auto h-[18px] w-[18px]" />
          </div>

          <Link
            href={`/challenges/new?from=${challenge.id}`}
            className="flex h-10 items-center justify-center rounded-[var(--radius-control)] bg-surface-2 text-[13px] font-bold tracking-wider text-fg hover:bg-surface-3"
          >
            COPY
          </Link>
        </div>
      </div>
    </Card>
  );
}

function Stat({ icon, value }: { icon: ReactNode; value: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-[13px] font-semibold text-fg">
      <span className="text-muted">{icon}</span>
      {value}
    </span>
  );
}

function TagRow({ items, tone }: { items: string[]; tone: 'equip' | 'primary' }) {
  const MAX = 4;
  const shown = items.slice(0, MAX);
  const rest = items.length - shown.length;
  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((t) => (
        <Pill key={t} tone={tone} className="capitalize">
          {t}
        </Pill>
      ))}
      {rest > 0 && <Pill tone="neutral">+{rest}</Pill>}
    </div>
  );
}
