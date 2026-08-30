import type { Challenge, ChallengeTemplate } from '@zporter/shared';
import { api } from '@/lib/api';
import { CreateChallengeForm } from './create-challenge-form';
import { prefillFromChallenge, prefillFromTemplate, type ChallengePrefill } from './prefill';

export default async function NewChallengePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string; from?: string }>;
}) {
  const { template, from } = await searchParams;

  let prefill: ChallengePrefill | null = null;
  if (template) {
    const tpl = await api<ChallengeTemplate>(`/templates/${template}`).catch(() => null);
    prefill = tpl && prefillFromTemplate(tpl);
  } else if (from) {
    const src = await api<Challenge>(`/challenges/${from}`).catch(() => null);
    prefill = src && prefillFromChallenge(src);
  }

  return <CreateChallengeForm prefill={prefill} />;
}
