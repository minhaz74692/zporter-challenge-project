'use server';

import { redirect } from 'next/navigation';
import type { AuthResponse } from '@zporter/shared';
import { api, ApiError } from '@/lib/api';
import { clearSession, getRefreshToken, setSession } from '@/lib/session';

export interface FormState {
  error?: string;
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim();

export async function login(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, 'email');
  const password = str(fd, 'password');
  const next = str(fd, 'next') || '/challenges';
  if (!email || !password) return { error: 'Email and password are required.' };

  let auth: AuthResponse;
  try {
    auth = await api<AuthResponse>('/auth/login', {
      auth: false,
      body: { email, password },
    });
  } catch (e) {
    console.error('[login]', e);
    return { error: e instanceof ApiError ? e.message : 'Could not sign in.' };
  }
  await setSession(auth);
  redirect(next);
}

export async function signup(_prev: FormState, fd: FormData): Promise<FormState> {
  const email = str(fd, 'email');
  const password = str(fd, 'password');
  const displayName = str(fd, 'displayName');
  const teamName = str(fd, 'teamName');
  if (!email || !password || !displayName || !teamName) {
    return { error: 'All fields are required.' };
  }

  let auth: AuthResponse;
  try {
    // Creator signup is a team account: the API creates the squad the new
    // coach owns, so `teamName` is required alongside the coach's own details.
    auth = await api<AuthResponse>('/auth/signup', {
      auth: false,
      body: { email, password, displayName, role: 'coach', teamName },
    });
  } catch (e) {
    return { error: e instanceof ApiError ? e.message : 'Could not create the account.' };
  }
  await setSession(auth);
  redirect('/challenges');
}

export async function logout(): Promise<void> {
  const refreshToken = await getRefreshToken();
  if (refreshToken) {
    await api('/auth/logout', { body: { refreshToken } }).catch(() => undefined);
  }
  await clearSession();
  redirect('/login');
}
