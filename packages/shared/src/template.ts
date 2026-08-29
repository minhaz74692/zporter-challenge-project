import type { IsoDateTime, ResultType, ScoringDirection } from './common.js';

/** A reusable blueprint a coach copies to launch a live challenge. */
export interface ChallengeTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  resultType: ResultType;
  scoringDirection: ScoringDirection;
  rules: string;
  defaultRewardBadgeId?: string;
  isPublic: boolean;
  createdBy: string;
  createdAt: IsoDateTime;
}

/** Body of `POST /templates`. */
export interface CreateTemplateRequest {
  title: string;
  description: string;
  category: string;
  resultType: ResultType;
  scoringDirection: ScoringDirection;
  rules: string;
  defaultRewardBadgeId?: string;
  isPublic?: boolean;
}
