import type { IsoDateTime } from './common.js';

/** Body of `POST /challenges/:id/results` (Figma "Add result" form). */
export interface SubmitResultRequest {
  /** Interpreted per the challenge's `resultType` (count/time → number, etc.). */
  value: number | boolean | string;
  /** Video documentation URL — required. */
  videoUrl: string;
  /** When the attempt was performed (ISO-8601). */
  performedAt: IsoDateTime;
  /** Venue / arena free text. */
  arena?: string;
  /** Handle of the witness verifying the result — required. */
  controllerRef: string;
  note?: string;
  /**
   * "Share to my feed" concept toggle — persisted on the result, but there is
   * no feed pipeline in this slice (documented as a next step).
   */
  shareToFeed?: boolean;
}

/** One row of `GET /challenges/:id/leaderboard` (denormalised, §6). */
export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  handle: string;
  avatarUrl?: string;
  club?: string;
  value: number;
  rank: number;
  updatedAt: IsoDateTime;
}
