/**
 * A refresh-token session (`users/{userId}/sessions/{id}`). One per successful
 * login/signup; rotated in place on every `/auth/refresh`.
 */
export interface SessionRecord {
  id: string;
  userId: string;
  /** sha256 of the current refresh secret. */
  refreshTokenHash: string;
  userAgent?: string;
  /** ISO-8601. */
  expiresAt: string;
  createdAt: string;
  revokedAt?: string;
}

export interface NewSession {
  refreshTokenHash: string;
  userAgent?: string;
  expiresAt: string;
}
