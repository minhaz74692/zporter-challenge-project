import type { Badge } from './badge.js';
import type { InviteState, IsoDateTime, ResultState, ResultUnit } from './common.js';

/** A reported result (Figma "Add result" form). */
export interface SubmittedResult {
  /** Raw value in the challenge's `resultType` (count/time → number, boolean → bool). */
  value: number | boolean | string;
  /** Echo of the challenge's `resultUnit`, so the row is self-describing. */
  unit: ResultUnit;
  /** Video documentation — required to report. */
  videoUrl: string;
  /** When the attempt was performed (separate from `submittedAt`). */
  performedAt: IsoDateTime;
  /** Venue / arena free text, e.g. "SATS – Häggvik, Sollentuna". */
  arena?: string;
  /** Handle of the controller (witness) the submitter asked to verify. */
  controllerRef: string;
  note?: string;
  submittedAt: IsoDateTime;
  /** Set by the controller via the verify endpoint; undefined = not reviewed. */
  verified?: boolean;
  verifiedAt?: IsoDateTime;
  /** "Share to my feed" concept toggle (no feed pipeline yet — see next steps). */
  shareToFeed?: boolean;
}

/** A user's membership + progress in one challenge (`challenges/{id}/participants`). */
export interface Participant {
  id: string;
  challengeId: string;
  userId: string;
  displayName: string;
  handle: string;
  avatarUrl?: string;
  country?: string;
  city?: string;
  club?: string;
  position?: string;
  inviteState: InviteState;
  resultState: ResultState;
  submittedResult?: SubmittedResult;
  rank?: number;
  /**
   * Recognition badge earned when the controller verified this result.
   * Denormalised (id + name + icon) so clients render it without a lookup.
   */
  awardedBadge?: Badge;
  joinedAt: IsoDateTime;
  /** When the player accepted or declined the invite. */
  respondedAt?: IsoDateTime;
}

/** Trimmed participant view embedded in `ChallengeDetail` for the current user. */
export type ParticipantSummary = Pick<
  Participant,
  'inviteState' | 'resultState' | 'rank' | 'submittedResult' | 'awardedBadge'
>;
