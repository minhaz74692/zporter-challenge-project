import { NextResponse, type NextRequest } from 'next/server';
import type { AuthResponse } from '@zporter/shared';
import { ACCESS_MAX_AGE, API_URL, COOKIE, REFRESH_MAX_AGE } from './lib/env';
import { isExpiring } from './lib/jwt';

const PROTECTED = ['/challenges', '/templates', '/teams'];
const AUTH_PAGES = ['/login', '/signup'];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const access = req.cookies.get(COOKIE.access)?.value;
  const refresh = req.cookies.get(COOKIE.refresh)?.value;
  const hasSession = !!access || !!refresh;

  if (AUTH_PAGES.includes(pathname)) {
    return hasSession
      ? NextResponse.redirect(new URL('/challenges', req.url))
      : NextResponse.next();
  }

  const needsAuth =
    pathname === '/' || PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!needsAuth) return NextResponse.next();

  if (access && !isExpiring(access)) return NextResponse.next();

  if (refresh) {
    const pair = await refreshTokens(refresh);
    if (pair) {
      const res =
        pathname === '/'
          ? NextResponse.redirect(new URL('/challenges', req.url))
          : NextResponse.next();
      writeCookies(res, pair.accessToken, pair.refreshToken);
      return res;
    }
  }

  const login = new URL('/login', req.url);
  if (pathname !== '/') login.searchParams.set('next', pathname);
  const res = NextResponse.redirect(login);
  res.cookies.delete(COOKIE.access);
  res.cookies.delete(COOKIE.refresh);
  return res;
}

async function refreshTokens(refreshToken: string): Promise<AuthResponse | null> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    return res.ok ? ((await res.json()) as AuthResponse) : null;
  } catch {
    return null;
  }
}

function writeCookies(res: NextResponse, access: string, refresh: string) {
  const opts = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };
  res.cookies.set(COOKIE.access, access, { ...opts, maxAge: ACCESS_MAX_AGE });
  res.cookies.set(COOKIE.refresh, refresh, { ...opts, maxAge: REFRESH_MAX_AGE });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.).*)'],
};
