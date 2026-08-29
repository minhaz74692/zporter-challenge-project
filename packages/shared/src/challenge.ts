import type {
  ChallengeStatus,
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
  createdBy: string;
  participantCount: number;
  createdAt: IsoDateTime;
}

/** Body of `POST /challenges`. Omitted fields fall back to the template. */
export interface CreateChallengeRequest {
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
  invitedUserIds?: string[];
}

/** Body of `POST /challenges/:id/invite`. */
export interface InviteRequest {
  userIds: string[];
}

/**
 * `GET /challenges/:id` — the challenge plus the caller's participation and a
 * short leaderboard preview, so the detail screen needs one request.
 */
export interface ChallengeDetail extends Challenge {
  viewerParticipant?: ParticipantSummary;
  leaderboardPreview: LeaderboardEntry[];
}
