import { notFound } from 'next/navigation';
import type { Challenge } from '@zporter/shared';
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
  try {
    challenge = await api<Challenge>(`/challenges/${id}`);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound();
    throw e;
  }

  return (
    <CreateChallengeForm
      prefill={prefillFromChallenge(challenge, 'edit')}
      onSubmit={updateChallenge.bind(null, id)}
      heading="Edit Challenge"
      submitLabel="Save changes"
      pendingLabel="Saving…"
    />
  );
}
