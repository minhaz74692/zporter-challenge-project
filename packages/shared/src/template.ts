import type {
  ChallengeLocation,
  ChallengeMainCategory,
  IsoDateTime,
  ResultType,
  ResultUnit,
  ScoringDirection,
} from './common.js';

/**
 * A reusable blueprint a coach copies to launch a live challenge. Its content
 * fields pre-fill the create form; `rules` is appended to the challenge's
 * `description` on copy (challenges have no separate `rules` field).
 */
export interface ChallengeTemplate {
  id: string;
  title: string;
  ingress?: string;
  description: string;
  rules: string;
  mainCategory: ChallengeMainCategory;
  collections: string[];
  equipmentTags: string[];
  resultType: ResultType;
  resultUnit: ResultUnit;
  scoringDirection: ScoringDirection;
  durationMinutes: number;
  location: ChallengeLocation;
  pointsToParticipate: number;
  rewardPoints: number;
  defaultRewardBadgeId?: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: IsoDateTime;
}

/** Body of `POST /templates`. */
export interface CreateTemplateRequest {
  title: string;
  ingress?: string;
  description: string;
  rules: string;
  mainCategory: ChallengeMainCategory;
  collections?: string[];
  equipmentTags?: string[];
  resultType: ResultType;
  resultUnit: ResultUnit;
  scoringDirection: ScoringDirection;
  durationMinutes?: number;
  location?: ChallengeLocation;
  pointsToParticipate?: number;
  rewardPoints?: number;
  defaultRewardBadgeId?: string;
  isPublic?: boolean;
}
