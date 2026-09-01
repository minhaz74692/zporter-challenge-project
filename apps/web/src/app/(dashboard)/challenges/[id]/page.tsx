import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { ChallengeDetail, User } from '@zporter/shared';
import { api, ApiError } from '@/lib/api';
import { ChallengeDetailView } from './challenge-detail-view';

export default async function ChallengeDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ media?: string }>;
}) {
  const { id } = await params;
  const { media } = await searchParams;

  // Only the two cheap reads block the first paint; the tabs load on demand.
  let challenge: ChallengeDetail;
  let me: User;
  try {
    [challenge, me] = await Promise.all([
      api<ChallengeDetail>(`/challenges/${id}`),
      api<User>('/auth/me'),
    ]);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/challenges" className="mb-4 inline-block text-[13px] text-muted hover:text-fg">
        ← Your challenges
      </Link>
      {media === 'failed' && (
        <p className="mb-4 rounded-[var(--radius-control)] border border-danger/40 bg-danger/10 px-3 py-2 text-[12px] text-danger">
          The challenge was saved, but some media could not be uploaded. Try adding it again below.
        </p>
      )}
      <ChallengeDetailView challenge={challenge} isOwner={me.id === challenge.createdBy} />
    </div>
  );
}
