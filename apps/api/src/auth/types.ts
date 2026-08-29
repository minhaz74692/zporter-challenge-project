import type { UserRole } from '@zporter/shared';

/** Claims carried by the access-token JWT (`project-plan.md` §8). */
export interface JwtPayload {
  sub: string;
  role: UserRole;
}

/** What `JwtStrategy.validate` puts on `req.user` — no DB round-trip. */
export interface AuthenticatedUser {
  userId: string;
  role: UserRole;
}
