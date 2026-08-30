import type {
  ChallengeStatus,
  ChallengeVisibility,
  IsoDateTime,
  ResultType,
  ScoringDirection,
} from './common.js';
import type { LeaderboardEntry } from './result.js';
import type { ParticipantSummary } from './participant.js';

export interface ChallengeReward {
  badgeId?: string;
  label: string;
}

/** A live challenge instance (may be copied from a template). */
export interface Challenge {
  id: string;
  templateId?: string;
  title: string;
  description: string;
  category: string;
  resultType: ResultType;
  scoringDirection: ScoringDirection;
  rules: string;
  reward: ChallengeReward;
  startAt: IsoDateTime;
  deadline: IsoDateTime;
  status: ChallengeStatus;
  /** Defaults to `invited`; `global` challenges are admin-created. */
  visibility: ChallengeVisibility;
  createdBy: string;
  participantCount: number;
  createdAt: IsoDateTime;
}

/**
 * Body of `POST /challenges`. When `templateId` is set, any omitted content
 * field falls back to the template (merged server-side), so the content fields
 * are optional here; `startAt` / `deadline` are always required.
 */
export interface CreateChallengeRequest {
  templateId?: string;
  title?: string;
  description?: string;
  category?: string;
  resultType?: ResultType;
  scoringDirection?: ScoringDirection;
  rules?: string;
  reward?: ChallengeReward;
  startAt: IsoDateTime;
  deadline: IsoDateTime;
  /** Defaults to `invited`. Only `admin` may create `global`. */
  visibility?: ChallengeVisibility;
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
}
