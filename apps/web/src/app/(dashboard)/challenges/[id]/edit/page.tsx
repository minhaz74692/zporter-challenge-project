import { notFound } from 'next/navigation';
import type { Challenge, User } from '@zporter/shared';
import { api, ApiError } from '@/lib/api';
import { updateChallenge } from '../../actions';
import { CreateChallengeForm } from '../../new/create-challenge-form';
import { prefillFromChallenge } from '../../new/prefill';

export default async function EditChallengePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let challenge: Challenge;
  let me: User | null;
  try {
    [challenge, me] = await Promise.all([
      api<Challenge>(`/challenges/${id}`),
      api<User>('/auth/me').catch(() => null),
    ]);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <CreateChallengeForm
      prefill={prefillFromChallenge(challenge, 'edit')}
      onSubmit={updateChallenge.bind(null, id)}
      canPublishToAll={me?.role === 'admin'}
      heading="Edit Challenge"
      submitLabel="Save changes"
      pendingLabel="Saving…"
    />
  );
}
