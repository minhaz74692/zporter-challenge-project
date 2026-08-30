import Link from 'next/link';
import type { Challenge } from '@zporter/shared';
import { api } from '@/lib/api';
import { ChallengeTabs } from '@/components/dashboard/challenge-tabs';
import { ChallengeCard } from '@/components/challenges/challenge-card';
import { IconPlus } from '@/components/ui/icons';

export default async function ChallengesPage() {
  const challenges = await api<Challenge[]>('/challenges/mine');

  return (
    <div className="mx-auto max-w-5xl">
      <ChallengeTabs count={challenges.length} />

      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-[15px] font-semibold text-fg">Your challenges</h1>
        <Link
          href="/challenges/new"
          className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-control)] bg-primary px-4 text-[13px] font-medium text-white hover:bg-primary-hover"
        >
          <IconPlus className="h-4 w-4" />
          New challenge
        </Link>
      </div>

      {challenges.length === 0 ? (
        <div className="rounded-[var(--radius-panel)] border border-border bg-surface py-16 text-center">
          <p className="text-sm text-muted">You haven&apos;t created any challenges yet.</p>
          <Link
            href="/challenges/new"
            className="mt-3 inline-flex h-9 items-center rounded-[var(--radius-control)] border border-border px-4 text-[13px] text-fg hover:bg-surface-2"
          >
            Create your first challenge
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {challenges.map((c) => (
            <ChallengeCard key={c.id} challenge={c} />
          ))}
        </div>
      )}
    </div>
  );
}
