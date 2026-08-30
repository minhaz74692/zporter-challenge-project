import type { ResultType } from '@zporter/shared';

export type ResultValue = number | boolean | string;

/** One row fed into the leaderboard ranker. */
export interface RankInput {
  userId: string;
  displayName: string;
  handle: string;
  avatarUrl?: string;
  club?: string;
  value: ResultValue;
}

/**
 * Per-`resultType` behaviour. Adding `score` / `text` / `proof` later is a new
 * class registered in `ResultsModule` — no other file changes (Open/Closed).
 */
export interface ResultStrategy {
  readonly type: ResultType;

  /** Validate + normalise the raw submitted value. Throws `BadRequestException`. */
  parse(value: unknown): ResultValue;

  /** Map the value onto the numeric axis the leaderboard ranks by. */
  toScore(value: ResultValue): number;

  /** Whether this value means the challenge is finished (→ `resultState: 'completed'`). */
  isCompletion(value: ResultValue): boolean;
}
