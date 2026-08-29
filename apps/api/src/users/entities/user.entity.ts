import type { User, UserRole } from '@zporter/shared';

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
  /** ISO-8601; the repository converts to/from Firestore types. */
  createdAt: string;
}

/** Fields the repository writes (id = doc id, createdAt set on create). */
export type NewUser = Omit<UserRecord, 'id' | 'createdAt'>;

export function toPublicUser(record: UserRecord): User {
  const { passwordHash: _passwordHash, ...pub } = record;
  return pub;
}
