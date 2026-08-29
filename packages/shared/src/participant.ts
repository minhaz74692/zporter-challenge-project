import type { InviteState, IsoDateTime, ResultState } from './common.js';

export interface SubmittedResult {
  /** Raw value in the unit implied by the challenge's `resultType`. */
  value: number | boolean | string;
  proofUrl?: string;
  note?: string;
  submittedAt: IsoDateTime;
}

/** A user's membership + progress in one challenge (`challenges/{id}/participants`). */
export interface Participant {
  id: string;
  challengeId: string;
  userId: string;
  displayName: string;
  inviteState: InviteState;
  resultState: ResultState;
  submittedResult?: SubmittedResult;
  rank?: number;
  joinedAt: IsoDateTime;
}

/** Trimmed participant view embedded in `ChallengeDetail` for the current user. */
export type ParticipantSummary = Pick<
  Participant,
  'inviteState' | 'resultState' | 'rank' | 'submittedResult'
>;
