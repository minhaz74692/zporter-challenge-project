import type { IsoDateTime, UserRole } from './common.js';

/** Public user shape — what `GET /auth/me` returns. */
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  /** Public handle shown next to the name, e.g. `#NeoJon070119`. */
  handle: string;
  avatarUrl?: string;
  country?: string;
  city?: string;
  club?: string;
  /** Playing position, e.g. `FW`, `CM`, `GK`. */
  position?: string;
  createdAt: IsoDateTime;
}

/** Trimmed user shape embedded in challenge / participant / leaderboard rows. */
export type UserSummary = Pick<
  User,
  'id' | 'displayName' | 'handle' | 'avatarUrl' | 'club' | 'position'
>;

export interface SignupRequest {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** Response of `POST /auth/signup`, `/auth/login`, `/auth/refresh`. */
export interface AuthResponse extends AuthTokens {
  user: User;
}
