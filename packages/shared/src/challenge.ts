import type {
  ChallengeLocation,
  ChallengeMainCategory,
  ChallengeStatus,
  ChallengeVisibility,
  IsoDateTime,
  ResultType,
  ResultUnit,
  ScoringDirection,
} from './common.js';
import type { UserSummary } from './auth.js';
import type { Badge } from './badge.js';
import type { MediaItem } from './media.js';
import type { LeaderboardEntry } from './result.js';
import type { ParticipantSummary } from './participant.js';

/** A live challenge instance (may be copied from a template). */
export interface Challenge {
  id: string;
  templateId?: string;
  /** Figma "Headline" — max 40 chars. */
  title: string;
  /** Figma "Ingress" — short subtitle, max 200 chars. */
  ingress?: string;
  /** Instructions body (plain text / markdown; the "Passed Challenge" etc. sections are authoring headings). */
  description: string;
  mainCategory: ChallengeMainCategory;
  /** Skill focus tags — Figma "Add to Collections as". */
  collections: string[];
  /** Equipment hashtags — Figma "Tags". */
  equipmentTags: string[];
  resultType: ResultType;
  /** Display unit for the result value. */
  resultUnit: ResultUnit;
  scoringDirection: ScoringDirection;
  /** How long the activity takes, minutes (Figma "Time"). */
  durationMinutes: number;
  location: ChallengeLocation;
  startAt: IsoDateTime;
  deadline: IsoDateTime;
  status: ChallengeStatus;
  /** Figma "Share with"; defaults to `private`. Only `admin` may create `all`. */
  visibility: ChallengeVisibility;
  /** Points it costs a player to join (Figma slider 5/10/20/50/100). */
  pointsToParticipate: number;
  /** Points earned for completing (Figma "50p" reward). */
  rewardPoints: number;
  /** Recognition badge granted on completion. */
  rewardBadgeId?: string;
  minParticipants: number;
  ageFrom?: number;
  ageTo?: number;
  /** Target playing position, e.g. `Forwards`, `All`. */
  position?: string;
  /** Ordered media gallery (images / videos / YouTube links); server-maintained. */
  media: MediaItem[];
  /** Derived from `media`: URL of the first `image` item. */
  mediaImageUrl?: string;
  /** Derived from `media`: URL of the first `video` item. */
  mediaVideoUrl?: string;
  ratingAverage?: number;
  ratingCount?: number;
  /** Feed engagement counters (denormalised; server-maintained). */
  likeCount: number;
  commentCount: number;
  createdBy: string;
  /** Populated by the API on list + detail responses. */
  creator?: UserSummary;
  participantCount: number;
  createdAt: IsoDateTime;
}

/**
 * Body of `POST /challenges`. When `templateId` is set, any omitted content
 * field falls back to the template (merged server-side), so content fields are
 * optional here; `startAt` / `deadline` are always required.
 */
export interface CreateChallengeRequest {
  templateId?: string;
  title?: string;
  ingress?: string;
  description?: string;
  mainCategory?: ChallengeMainCategory;
  collections?: string[];
  equipmentTags?: string[];
  resultType?: ResultType;
  resultUnit?: ResultUnit;
  scoringDirection?: ScoringDirection;
  durationMinutes?: number;
  location?: ChallengeLocation;
  startAt: IsoDateTime;
  deadline: IsoDateTime;
  /** Defaults to `private`. Only `admin` may set `all`. */
  visibility?: ChallengeVisibility;
  pointsToParticipate?: number;
  rewardPoints?: number;
  rewardBadgeId?: string;
  minParticipants?: number;
  ageFrom?: number;
  ageTo?: number;
  position?: string;
  mediaImageUrl?: string;
  mediaVideoUrl?: string;
  invitedUserIds?: string[];
  /** Fans out to every member of the team at launch. */
  invitedTeamId?: string;
}

/**
 * Body of `POST /challenges/:id/invite`. Supply `userIds`, `teamId`, or both —
 * a `teamId` is expanded to its members server-side and merged with `userIds`
 * (deduplicated). At least one must be present.
 */
export interface InviteRequest {
  userIds?: string[];
  teamId?: string;
}

/**
 * `GET /challenges/:id` — the challenge plus the caller's participation and a
 * short leaderboard preview, so the detail screen needs one request.
 */
export interface ChallengeDetail extends Challenge {
  viewerParticipant?: ParticipantSummary;
  leaderboardPreview: LeaderboardEntry[];
  /** Resolved from `rewardBadgeId` so the detail screen can show the reward. */
  rewardBadge?: Badge;
}
