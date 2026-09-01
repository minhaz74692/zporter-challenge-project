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
  'id' | 'displayName' | 'handle' | 'avatarUrl' | 'country' | 'city' | 'club' | 'position'
>;

export interface SignupRequest {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  /**
   * Coach signup = team account: the squad created and owned by the new coach.
   * Required when `role` is `coach`, ignored otherwise.
   */
  teamName?: string;
  /**
   * Player signup joins an existing squad (from `GET /teams/directory`).
   * Required when `role` is `player`, ignored otherwise.
   */
  teamId?: string;
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
