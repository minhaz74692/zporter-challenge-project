import type { IsoDateTime, UserRole } from './common.js';

/** Preferred foot (Biography). */
export type PreferredFoot = 'left' | 'right' | 'both';

/** Outbound social links shown on the Biography screen. All optional URLs. */
export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  whatsapp?: string;
  youtube?: string;
  tiktok?: string;
  veo?: string;
}

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

  // --- Biography profile (all optional; only the player screen uses them) ---
  /** ISO date — the screen derives age + shows it as the birth date. */
  birthDate?: IsoDateTime;
  heightCm?: number;
  weightKg?: number;
  foot?: PreferredFoot;
  /** Free text so `"? M€"` renders verbatim (Figma). */
  marketValue?: string;
  /** Short scouting-style blurb under the profile card. */
  bio?: string;
  /** 0–100 — the star row + "NN%" under the avatar. */
  ratingPercent?: number;
  friendsCount?: number;
  fansCount?: number;
  followsCount?: number;
  socials?: SocialLinks;
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
