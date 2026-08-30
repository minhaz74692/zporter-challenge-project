import type { ChallengeTemplate } from '@zporter/shared';
import { api } from '@/lib/api';
import { CreateChallengeForm } from './create-challenge-form';

export default async function NewChallengePage({
  searchParams,
}: {
  searchParams: Promise<{ template?: string }>;
}) {
  const { template } = await searchParams;
  const tpl = template
    ? await api<ChallengeTemplate>(`/templates/${template}`).catch(() => null)
    : null;

  return <CreateChallengeForm template={tpl} />;
}
