/**
 * Cross-cutting primitives and enums, mirroring the Firestore data model in
 * `project-plan.md` §6. These are the *wire* shapes: timestamps are ISO-8601
 * strings (Firestore `Timestamp` is serialised to a string by the API), never
 * `Date` objects.
 */

/** ISO-8601 datetime string, e.g. `2026-08-30T12:00:00.000Z`. */
export type IsoDateTime = string;

export type UserRole = 'player' | 'coach' | 'admin';

export type ResultType = 'count' | 'time' | 'boolean' | 'score' | 'text' | 'proof';

export type ScoringDirection = 'higher_better' | 'lower_better';

export type ChallengeStatus = 'draft' | 'active' | 'ended';

/** Player-facing list tabs — see the category→query mapping in §6. */
export type ChallengeCategory = 'new' | 'active' | 'done' | 'declined' | 'ended';

export type InviteState = 'invited' | 'accepted' | 'declined';

export type ResultState = 'pending' | 'submitted' | 'completed';

export type DevicePlatform = 'ios' | 'android' | 'web';

export type NotificationType =
  | 'challenge_invite'
  | 'challenge_launched'
  | 'result_submitted'
  | 'challenge_ended';
