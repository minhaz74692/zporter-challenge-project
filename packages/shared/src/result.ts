import type { IsoDateTime } from './common.js';

/** Body of `POST /challenges/:id/results`. */
export interface SubmitResultRequest {
  /** Interpreted per the challenge's `resultType` (count/time → number, etc.). */
  value: number | boolean | string;
  note?: string;
  proofUrl?: string;
}

/** One row of `GET /challenges/:id/leaderboard` (denormalised, §6). */
export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  value: number;
  rank: number;
  updatedAt: IsoDateTime;
}
