import type { User, UserRole, UserSummary } from '@zporter/shared';

/**
 * Internal user representation as stored in Firestore (`users/{id}`). Includes
 * `passwordHash`, which must never leave the API — use {@link toPublicUser}
 * before returning a user in any response.
 */
export interface UserRecord {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  role: UserRole;
  handle: string;
  avatarUrl?: string;
  country?: string;
  city?: string;
  club?: string;
  position?: string;
  /** ISO-8601; the repository converts to/from Firestore types. */
  createdAt: string;
}

/** Fields the repository writes (id = doc id, createdAt/handle set on create). */
export type NewUser = Omit<UserRecord, 'id' | 'createdAt'>;

export function toPublicUser(record: UserRecord): User {
  const { passwordHash: _passwordHash, ...pub } = record;
  return pub;
}

export function toUserSummary(record: UserRecord): UserSummary {
  return {
    id: record.id,
    displayName: record.displayName,
    handle: record.handle,
    avatarUrl: record.avatarUrl,
    club: record.club,
    position: record.position,
  };
}
