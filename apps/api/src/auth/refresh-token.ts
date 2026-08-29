import { createHash, randomBytes } from 'node:crypto';

/**
 * The refresh token handed to the client is `<userId>.<sessionId>.<secret>`.
 * Only `sha256(secret)` is stored (in `users/{userId}/sessions/{sessionId}`),
 * so a leaked database cannot be used to mint tokens. `userId`/`sessionId` are
 * Firestore auto-ids (`[A-Za-z0-9]`), so `.` is a safe separator.
 */

export interface ParsedRefreshToken {
  userId: string;
  sessionId: string;
  secret: string;
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function generateRefreshSecret(): { secret: string; hash: string } {
  const secret = randomBytes(32).toString('hex');
  return { secret, hash: sha256(secret) };
}

export function formatRefreshToken(
  userId: string,
  sessionId: string,
  secret: string,
): string {
  return `${userId}.${sessionId}.${secret}`;
}

export function parseRefreshToken(token: string): ParsedRefreshToken | null {
  const parts = typeof token === 'string' ? token.split('.') : [];
  if (parts.length !== 3 || parts.some((p) => p.length === 0)) return null;
  return { userId: parts[0], sessionId: parts[1], secret: parts[2] };
}
