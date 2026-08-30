import 'server-only';
import { cookies } from 'next/headers';
import type { AuthTokens } from '@zporter/shared';
import { ACCESS_MAX_AGE, COOKIE, REFRESH_MAX_AGE } from './env';

const base = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

/** Persist a token pair. Only callable from Server Actions / Route Handlers. */
export async function setSession(tokens: AuthTokens): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE.access, tokens.accessToken, { ...base, maxAge: ACCESS_MAX_AGE });
  jar.set(COOKIE.refresh, tokens.refreshToken, { ...base, maxAge: REFRESH_MAX_AGE });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE.access);
  jar.delete(COOKIE.refresh);
}

export async function getAccessToken(): Promise<string | null> {
  return (await cookies()).get(COOKIE.access)?.value ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  return (await cookies()).get(COOKIE.refresh)?.value ?? null;
}
