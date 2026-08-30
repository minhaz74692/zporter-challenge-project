/**
 * Base URL of the NestJS API. Public so middleware + client + server all see it.
 * Defaults to 127.0.0.1 (not `localhost`) — Node's fetch/undici resolves
 * `localhost` to `::1` first, which fails against an IPv4-only dev server.
 */
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:3000';

export const COOKIE = {
  access: 'zp_access',
  refresh: 'zp_refresh',
} as const;

/** Access-token cookie lifetime (a touch under the JWT's 15 min). */
export const ACCESS_MAX_AGE = 60 * 14;
/** Refresh-token cookie lifetime (matches the API's 14-day default). */
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 14;
