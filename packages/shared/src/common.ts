/**
 * Cross-cutting primitives and enums, mirroring the Firestore data model in
 * `project-plan.md` §6. These are the *wire* shapes: timestamps are ISO-8601
 * strings (Firestore `Timestamp` is serialised to a string by the API), never
 * `Date` objects.
 */

/** ISO-8601 datetime string, e.g. `2026-08-30T12:00:00.000Z`. */
export type IsoDateTime = string;

/**
 * `player` — mobile participant. `coach` — creates challenges for their own
 * squad/invitees. `admin` — CMS super-user, creates platform-wide "global"
 * challenges. In this slice `coach` and `admin` share creator permissions;
 * `admin` is seed-only (no self-signup).
 */
export type UserRole = 'player' | 'coach' | 'admin';

export type ResultType = 'count' | 'time' | 'boolean' | 'score' | 'text' | 'proof';

export type ScoringDirection = 'higher_better' | 'lower_better';

/** A challenge media-gallery item. `youtube` stores the watch URL + a thumbnail. */
export type MediaKind = 'image' | 'video' | 'youtube';

export type ChallengeStatus = 'draft' | 'active' | 'ended';

/**
 * Figma "Share with". `private` — invite-only (the coach flow). `all` — every
 * player sees it in New, no invite (admin CMS "global" push). `friends` /
 * `fans` are audience buckets that behave like `private` in this slice (no
 * relationship graph yet).
 */
export type ChallengeVisibility = 'private' | 'friends' | 'fans' | 'all';

/** Figma "Main Category" (single-select on the create form). */
export type ChallengeMainCategory =
  | 'physical'
  | 'technical'
  | 'tactical'
  | 'mental'
  | 'rehab'
  | 'other';

/** Figma "Location" — where the challenge is performed. */
export type ChallengeLocation = 'anywhere' | 'field' | 'gym' | 'court' | 'home';

/** Display unit for a result value (the "kg" in "125 kg"). */
export type ResultUnit =
  | 'reps'
  | 'count'
  | 'seconds'
  | 'kg'
  | 'meters'
  | 'points'
  | 'boolean';

/** Player-facing list tabs — see the category→query mapping in §6. */
export type ChallengeCategory = 'new' | 'active' | 'done' | 'declined' | 'ended';

export type InviteState = 'invited' | 'accepted' | 'declined';

export type ResultState = 'pending' | 'submitted' | 'completed';

export type DevicePlatform = 'ios' | 'android' | 'web';

export type NotificationType =
  | 'challenge_invite'
  | 'challenge_launched'
  | 'result_submitted'
  /** A player named you as the controller and wants their result verified. */
  | 'result_verify_request'
  /** Your controller verified (or rejected) your result. */
  | 'result_verified'
  | 'challenge_ended'
  /** "closes in 48h — we have not seen your results yet" (sent via the manual `POST /challenges/:id/remind`). */
  | 'challenge_reminder'
  /** Your verified result earned the challenge's recognition badge. */
  | 'badge_earned';
