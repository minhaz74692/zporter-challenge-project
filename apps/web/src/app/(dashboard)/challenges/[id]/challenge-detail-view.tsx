'use client';

import Link from 'next/link';
import { useCallback, useState } from 'react';
import type {
  ChallengeDetail,
  InviteState,
  LeaderboardEntry,
  Participant,
  ResultState,
} from '@zporter/shared';
import { cn } from '@/components/ui/cn';
import { Pill } from '@/components/ui/pill';
import { deleteChallenge } from '../actions';
import { CoverUpload } from '@/components/challenges/cover-upload';
import { InvitePanel } from '@/components/challenges/invite-panel';
import { LeaderboardBoard } from '@/components/challenges/leaderboard-board';

const STATUS_TONE = { draft: 'neutral', active: 'success', ended: 'danger' } as const;
const INVITE_TONE: Record<InviteState, Parameters<typeof Pill>[0]['tone']> = {
  invited: 'neutral',
  accepted: 'success',
  declined: 'danger',
};
const RESULT_LABEL: Record<ResultState, string> = {
  pending: 'Not reported',
  submitted: 'Submitted',
  completed: 'Completed',
};

const BASE_TABS = ['Details', 'Participants', 'Leaderboard'] as const;
type Tab = (typeof BASE_TABS)[number] | 'Invite';

/** Cached, on-demand fetch of one JSON endpoint. */
function useLazy<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const load = useCallback(
    async (force = false) => {
      if (loading || (data && !force)) return;
      setLoading(true);
      try {
        const res = await fetch(url, { cache: 'no-store' });
        setData(res.ok ? ((await res.json()) as T) : ([] as unknown as T));
      } finally {
        setLoading(false);
      }
    },
    [url, loading, data],
  );
  return { data, loading, load };
}

export function ChallengeDetailView({
  challenge,
  isOwner = false,
}: {
  challenge: ChallengeDetail;
  isOwner?: boolean;
}) {
  const tabs: Tab[] = isOwner ? [...BASE_TABS, 'Invite'] : [...BASE_TABS];
  const [tab, setTab] = useState<Tab>('Details');

  const participants = useLazy<Participant[]>(`/api/challenges/${challenge.id}/participants`);
  const leaderboard = useLazy<LeaderboardEntry[]>(`/api/challenges/${challenge.id}/leaderboard`);

  const selectTab = (t: Tab) => {
    setTab(t);
    if (t === 'Participants' || t === 'Invite') void participants.load();
    if (t === 'Leaderboard') void leaderboard.load();
  };

  const fmt = (d: string) =>
    new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  return (
    <div className="rounded-[var(--radius-panel)] border border-border bg-surface p-6 sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[18px] font-semibold text-fg">{challenge.title}</h1>
          {challenge.ingress && <p className="mt-1 text-sm text-muted">{challenge.ingress}</p>}
        </div>
        <Pill tone={STATUS_TONE[challenge.status]} className="shrink-0 capitalize">
          {challenge.status}
        </Pill>
      </div>

      {challenge.creator && (
        <p className="mt-3 text-[12px] text-faint">
          by {challenge.creator.displayName} · {challenge.creator.handle}
          {challenge.creator.club ? ` · ${challenge.creator.club}` : ''}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-muted">
        <span>👥 {challenge.participantCount} accepted</span>
        <span>⏱ {challenge.durationMinutes} min</span>
        <span>🏆 {challenge.rewardPoints} pts · entry {challenge.pointsToParticipate}</span>
        <span className="capitalize">{challenge.mainCategory}</span>
        <span>
          {challenge.resultType} · {challenge.resultUnit}
        </span>
        <span className="capitalize">{challenge.visibility}</span>
      </div>
      <div className="mt-1 text-[12px] text-faint">
        {fmt(challenge.startAt)} → {fmt(challenge.deadline)}
      </div>

      {isOwner && (
        <>
          <div className="mt-5 flex gap-2">
            <Link
              href={`/challenges/${challenge.id}/edit`}
              className="inline-flex h-9 items-center rounded-[var(--radius-control)] border border-border px-4 text-[13px] font-medium text-fg hover:bg-surface-2"
            >
              Edit
            </Link>
            <form action={deleteChallenge.bind(null, challenge.id)}>
              <button
                type="submit"
                onClick={(e) => {
                  if (!window.confirm('Delete this challenge permanently?')) e.preventDefault();
                }}
                className="inline-flex h-9 items-center rounded-[var(--radius-control)] px-4 text-[13px] font-medium text-danger hover:bg-danger/10"
              >
                Delete
              </button>
            </form>
          </div>

          <div className="mt-5 border-t border-border-soft pt-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-faint">
              Cover image
            </p>
            <CoverUpload challengeId={challenge.id} current={challenge.mediaImageUrl} />
          </div>
        </>
      )}

      <div className="mt-5 mb-4 flex gap-6 border-b border-border-soft text-[13px]">
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => selectTab(t)}
            className={cn(
              'pb-2',
              tab === t
                ? 'border-b-2 border-accent font-medium text-accent'
                : 'text-muted hover:text-fg',
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Details' && (
        <div className="space-y-4">
          <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-fg/90">
            {challenge.description}
          </p>
          {(challenge.collections.length > 0 || challenge.equipmentTags.length > 0) && (
            <div className="flex flex-wrap gap-1.5">
              {challenge.collections.map((c) => (
                <Pill key={c} tone="skill" className="capitalize">
                  {c}
                </Pill>
              ))}
              {challenge.equipmentTags.map((t) => (
                <Pill key={t} tone="equip">
                  {t}
                </Pill>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'Participants' && (
        <>
          {participants.loading && !participants.data ? (
            <p className="py-4 text-[13px] text-faint">Loading participants…</p>
          ) : (
            <ul className="divide-y divide-border-soft">
              {participants.data?.length === 0 && (
                <li className="py-4 text-[13px] text-muted">No one invited yet.</li>
              )}
              {participants.data?.map((p) => (
                <li key={p.userId} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="text-[13px] text-fg">{p.displayName}</div>
                    <div className="text-[11px] text-faint">
                      {p.handle}
                      {p.club ? ` · ${p.club}` : ''}
                      {p.position ? ` · ${p.position}` : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted">{RESULT_LABEL[p.resultState]}</span>
                    <Pill tone={INVITE_TONE[p.inviteState]} className="capitalize">
                      {p.inviteState}
                    </Pill>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {tab === 'Leaderboard' && (
        <>
          {leaderboard.loading && !leaderboard.data ? (
            <p className="py-4 text-[13px] text-faint">Loading leaderboard…</p>
          ) : (
            <LeaderboardBoard entries={leaderboard.data ?? []} />
          )}
        </>
      )}

      {tab === 'Invite' && (
        <div className="space-y-3">
          <p className="text-[12px] text-muted">
            Search players and send them this challenge. Already-invited players are hidden.
          </p>
          <InvitePanel
            challengeId={challenge.id}
            invitedIds={(participants.data ?? []).map((p) => p.userId)}
            onInvited={() => void participants.load(true)}
          />
        </div>
      )}
    </div>
  );
}
