/**
 * Shared domain types for Zporter Challenges.
 *
 * These mirror the Firestore data model in `project-plan.md` §6 and the API
 * contract in §7. `@zporter/api` is the source of truth (NestJS DTOs +
 * Swagger); `@zporter/web` consumes these types and the generated client.
 *
 * Fleshed out in Phase 0 ("Shared types package") — placeholder for now.
 */

export type UserRole = 'player' | 'coach' | 'admin';

export type ResultType =
  | 'count'
  | 'time'
  | 'boolean'
  | 'score'
  | 'text'
  | 'proof';

export type ScoringDirection = 'higher_better' | 'lower_better';

export type ChallengeStatus = 'draft' | 'active' | 'ended';

export type InviteState = 'invited' | 'accepted' | 'declined';

export type ResultState = 'pending' | 'submitted' | 'completed';

export {};
