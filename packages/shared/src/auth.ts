import type { IsoDateTime, UserRole } from './common.js';

/** Public user shape — what `GET /auth/me` and embedded creator refs return. */
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: IsoDateTime;
}

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
