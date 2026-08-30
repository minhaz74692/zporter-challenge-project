'use client';

import { useState } from 'react';
import type {
  ChallengeDetail,
  InviteState,
  LeaderboardEntry,
  Participant,
  ResultState,
} from '@zporter/shared';
import { cn } from '@/components/ui/cn';
import { Pill } from '@/components/ui/pill';

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

const TABS = ['Details', 'Participants', 'Leaderboard'] as const;

export function ChallengeDetailView({
  challenge,
  participants,
  leaderboard,
}: {
  challenge: ChallengeDetail;
  participants: Participant[];
  leaderboard: LeaderboardEntry[];
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Details');
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
        <span>{challenge.resultType} · {challenge.resultUnit}</span>
        <span className="capitalize">{challenge.visibility}</span>
      </div>
      <div className="mt-1 text-[12px] text-faint">
        {fmt(challenge.startAt)} → {fmt(challenge.deadline)}
      </div>

      <div className="mt-5 mb-4 flex gap-6 border-b border-border-soft text-[13px]">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
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
        <ul className="divide-y divide-border-soft">
          {participants.length === 0 && (
            <li className="py-4 text-[13px] text-muted">No one invited yet.</li>
          )}
          {participants.map((p) => (
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

      {tab === 'Leaderboard' && (
        <ol className="space-y-1.5">
          {leaderboard.length === 0 && (
            <li className="py-4 text-[13px] text-muted">No results reported yet.</li>
          )}
          {leaderboard.map((e) => (
            <li
              key={e.userId}
              className="flex items-center justify-between rounded-[var(--radius-control)] bg-surface-2 px-3 py-2"
            >
              <span className="flex items-center gap-3">
                <span className="w-5 text-center text-[12px] font-semibold text-accent">
                  {e.rank}
                </span>
                <span className="text-[13px] text-fg">{e.displayName}</span>
                {e.club && <span className="text-[11px] text-faint">{e.club}</span>}
              </span>
              <span className="text-[13px] font-semibold text-fg">{e.value}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
