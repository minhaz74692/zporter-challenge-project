import type { IsoDateTime } from './common.js';

/**
 * A squad. Membership is a many-to-many join (`teams/{id}/members/{userId}`),
 * mirroring `challenges/{id}/participants/{userId}` — a player can belong to
 * several squads (club, age group, training group, selection) with a different
 * role in each. Seed-backed in this slice; no squad-management UI/CRUD yet.
 */
export interface Team {
  id: string;
  name: string;
  coachId: string;
  createdAt: IsoDateTime;
}

/** One row of `teams/{teamId}/members` (doc id = userId). */
export interface TeamMember {
  userId: string;
  teamId: string;
  /** Role within this squad, independent of the account's `UserRole`. */
  role: 'player' | 'coach';
  joinedAt: IsoDateTime;
}
