import type { Challenge, ChallengeTemplate, User } from '@zporter/shared';
import { api } from '@/lib/api';
import { createChallenge } from '../actions';
import { CreateChallengeForm } from './create-challenge-form';
import { prefillFromChallenge, prefillFromTemplate, type ChallengePrefill } from './prefill';

export default async function NewChallengePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; from?: string }>;
}) {
  const { template, from } = await searchParams;

  const [me, prefill] = await Promise.all([
    api<User>('/auth/me').catch(() => null),
    resolvePrefill(template, from),
  ]);

  return (
    <CreateChallengeForm
      prefill={prefill}
      onSubmit={createChallenge}
      canPublishToAll={me?.role === 'admin'}
    />
  );
}

async function resolvePrefill(
  template?: string,
  from?: string,
): Promise<ChallengePrefill | null> {
  if (template) {
    const tpl = await api<ChallengeTemplate>(`/templates/${template}`).catch(() => null);
    return tpl && prefillFromTemplate(tpl);
  }
  if (from) {
    const src = await api<Challenge>(`/challenges/${from}`).catch(() => null);
    return src && prefillFromChallenge(src);
  }
  return null;
}
