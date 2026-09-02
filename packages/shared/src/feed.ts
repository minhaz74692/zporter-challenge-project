import type { IsoDateTime, ResultUnit } from './common.js';
import type { UserSummary } from './auth.js';
import type { Badge } from './badge.js';
import type { Challenge } from './challenge.js';

/**
 * A social post in the activity feed (Figma "Challenge – Feed" screens).
 *
 * Two kinds:
 * - `challenge_published` — a coach/admin launched a non-private challenge;
 *   the card embeds the whole challenge so it renders like a challenge card
 *   with ❤ / comment / 🔖 actions and an **Open** button.
 * - `result_update` — a player shared a reported result ("Share to my feed"
 *   toggle on the report form); the card shows the headline, the value + unit,
 *   the arena / date, and the result video thumbnail.
 *
 * The `challenge` (and `result`) payloads are **denormalised snapshots** taken
 * when the post is created — the feed renders with no extra reads and a later
 * edit to the source challenge does not rewrite historic posts.
 */
export type FeedPostType = 'challenge_published' | 'result_update';

/**
 * Who a post is meant for. Mirrors the source challenge's `visibility`
 * (`all` → `public`). `friends` / `fans` behave like `public` in this slice —
 * there is no relationship graph yet (documented next step).
 */
export type FeedAudience = 'public' | 'friends' | 'fans' | 'team';

/** Feed tabs (Figma: `Team · Yours · Saved`). */
export type FeedTab = 'team' | 'yours' | 'saved';

/** The result half of a `result_update` post. */
export interface FeedResultSnapshot {
  /** Raw reported value (count/time → number, boolean → bool). */
  value: number | boolean | string;
  /** Display unit, echoed from the challenge (`kg` in "120 kg"). */
  unit: ResultUnit;
  /** Video documentation URL. */
  videoUrl: string;
  /** Venue / arena free text. */
  arena?: string;
  /** When the attempt was performed. */
  performedAt: IsoDateTime;
  /** Recognition badge, if this result had already earned one. */
  awardedBadge?: Badge;
}

/** One post in `GET /feed`. */
export interface FeedPost {
  id: string;
  type: FeedPostType;
  /** Who posted — the challenge creator, or the player who shared the result. */
  author: UserSummary;
  audience: FeedAudience;
  /** Denormalised snapshot of the challenge the post is about. */
  challenge: Challenge;
  /** Present only on `result_update` posts. */
  result?: FeedResultSnapshot;
  likeCount: number;
  commentCount: number;
  /** Whether the current viewer has liked / saved this post. */
  likedByMe: boolean;
  savedByMe: boolean;
  createdAt: IsoDateTime;
}

/** Response of `POST` / `DELETE /feed/:id/like`. */
export interface FeedLikeResult {
  likeCount: number;
  liked: boolean;
}

/** Response of `POST` / `DELETE /feed/:id/save`. */
export interface FeedSaveResult {
  saved: boolean;
}
