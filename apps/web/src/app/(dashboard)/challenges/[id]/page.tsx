import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ChallengeDetail, LeaderboardEntry, Participant } from '@zporter/shared';
import { api, ApiError } from '@/lib/api';
import { ChallengeDetailView } from './challenge-detail-view';

export default async function ChallengeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let challenge: ChallengeDetail;
  try {
    challenge = await api<ChallengeDetail>(`/challenges/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }
  const [participants, leaderboard] = await Promise.all([
    api<Participant[]>(`/challenges/${id}/participants`),
    api<LeaderboardEntry[]>(`/challenges/${id}/leaderboard`),
  ]);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/challenges" className="mb-4 inline-block text-[13px] text-muted hover:text-fg">
        ← Your challenges
      </Link>
      <ChallengeDetailView
        challenge={challenge}
        participants={participants}
        leaderboard={leaderboard}
      />
    </div>
  );
}
