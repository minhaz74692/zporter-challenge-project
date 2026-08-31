import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
  class ApiError extends Error {
    status: number;
    body: unknown;
    constructor(status: number, body: unknown) {
      super(typeof body === 'string' ? body : `err ${status}`);
      this.status = status;
      this.body = body;
      this.name = 'ApiError';
    }
  }
  return {
    ApiError,
    apiMock: vi.fn(),
    setSession: vi.fn(),
    clearSession: vi.fn(),
    getRefreshToken: vi.fn(),
    redirect: vi.fn((to: string) => {
      throw new Error(`REDIRECT:${to}`);
    }),
  };
});
const { ApiError, apiMock, setSession, clearSession, getRefreshToken } = h;

vi.mock('@/lib/api', () => ({ api: h.apiMock, ApiError: h.ApiError }));
vi.mock('@/lib/session', () => ({
  setSession: h.setSession,
  clearSession: h.clearSession,
  getRefreshToken: h.getRefreshToken,
}));
vi.mock('next/navigation', () => ({ redirect: h.redirect }));

import { login, logout, signup } from './actions';

function form(entries: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(entries)) fd.append(k, v);
  return fd;
}

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => vi.clearAllMocks());

describe('login', () => {
  it('rejects a submission missing email or password without calling the API', async () => {
    const state = await login({}, form({ email: 'coach@z.test' }));
    expect(state).toEqual({ error: 'Email and password are required.' });
    expect(apiMock).not.toHaveBeenCalled();
  });

  it('persists the session and redirects to ?next on success', async () => {
    apiMock.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

    await expect(
      login({}, form({ email: 'coach@z.test', password: 'pw', next: '/challenges/c1' })),
    ).rejects.toThrow('REDIRECT:/challenges/c1');

    expect(apiMock).toHaveBeenCalledWith('/auth/login', {
      auth: false,
      body: { email: 'coach@z.test', password: 'pw' },
    });
    expect(setSession).toHaveBeenCalledWith({ accessToken: 'a', refreshToken: 'r' });
  });

  it('defaults the redirect target to /challenges', async () => {
    apiMock.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
    await expect(login({}, form({ email: 'c@z.test', password: 'pw' }))).rejects.toThrow(
      'REDIRECT:/challenges',
    );
  });

  it('surfaces the ApiError message and does not set a session', async () => {
    apiMock.mockRejectedValue(new ApiError(401, 'Invalid credentials'));
    const state = await login({}, form({ email: 'c@z.test', password: 'bad' }));
    expect(state).toEqual({ error: 'Invalid credentials' });
    expect(setSession).not.toHaveBeenCalled();
  });

  it('falls back to a generic message for a non-ApiError failure', async () => {
    apiMock.mockRejectedValue(new Error('socket hang up'));
    expect(await login({}, form({ email: 'c@z.test', password: 'pw' }))).toEqual({
      error: 'Could not sign in.',
    });
  });

  it('trims whitespace around the submitted fields', async () => {
    apiMock.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
    await expect(
      login({}, form({ email: '  c@z.test  ', password: '  pw  ' })),
    ).rejects.toThrow();
    expect(apiMock).toHaveBeenCalledWith('/auth/login', {
      auth: false,
      body: { email: 'c@z.test', password: 'pw' },
    });
  });
});

describe('signup', () => {
  it('requires email, password and displayName', async () => {
    expect(await signup({}, form({ email: 'c@z.test', password: 'pw' }))).toEqual({
      error: 'All fields are required.',
    });
  });

  it('always registers with the coach role and redirects to /challenges', async () => {
    apiMock.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });
    await expect(
      signup({}, form({ email: 'c@z.test', password: 'pw', displayName: 'Coach' })),
    ).rejects.toThrow('REDIRECT:/challenges');

    expect(apiMock).toHaveBeenCalledWith('/auth/signup', {
      auth: false,
      body: { email: 'c@z.test', password: 'pw', displayName: 'Coach', role: 'coach' },
    });
  });

  it('returns the ApiError text (e.g. duplicate email)', async () => {
    apiMock.mockRejectedValue(new ApiError(409, 'Email already registered'));
    expect(
      await signup({}, form({ email: 'c@z.test', password: 'pw', displayName: 'Coach' })),
    ).toEqual({ error: 'Email already registered' });
  });
});

describe('logout', () => {
  it('revokes the refresh token, clears cookies and redirects to /login', async () => {
    getRefreshToken.mockResolvedValue('r-token');
    apiMock.mockResolvedValue(undefined);

    await expect(logout()).rejects.toThrow('REDIRECT:/login');
    expect(apiMock).toHaveBeenCalledWith('/auth/logout', { body: { refreshToken: 'r-token' } });
    expect(clearSession).toHaveBeenCalled();
  });

  it('still clears the session when there is no refresh token', async () => {
    getRefreshToken.mockResolvedValue(null);
    await expect(logout()).rejects.toThrow('REDIRECT:/login');
    expect(apiMock).not.toHaveBeenCalled();
    expect(clearSession).toHaveBeenCalled();
  });

  it('ignores an API error during revocation and still logs the user out', async () => {
    getRefreshToken.mockResolvedValue('r-token');
    apiMock.mockRejectedValue(new Error('api down'));
    await expect(logout()).rejects.toThrow('REDIRECT:/login');
    expect(clearSession).toHaveBeenCalled();
  });
});
