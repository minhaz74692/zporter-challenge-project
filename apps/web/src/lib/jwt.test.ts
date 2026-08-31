import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isExpiring, jwtExpMs } from './jwt';

/** Build an unsigned JWT with the given payload (only the middle segment matters). */
function tokenWith(payload: object): string {
  const b64 = Buffer.from(JSON.stringify(payload))
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `header.${b64}.signature`;
}

describe('jwtExpMs', () => {
  it('returns the exp claim converted from seconds to milliseconds', () => {
    expect(jwtExpMs(tokenWith({ exp: 1_700_000_000 }))).toBe(1_700_000_000_000);
  });

  it('returns null when the token has no second segment', () => {
    expect(jwtExpMs('nodots')).toBeNull();
  });

  it('returns null when the payload has no numeric exp', () => {
    expect(jwtExpMs(tokenWith({ sub: 'u1' }))).toBeNull();
    expect(jwtExpMs(tokenWith({ exp: 'soon' }))).toBeNull();
  });

  it('returns null on a non-decodable payload segment', () => {
    expect(jwtExpMs('header.%%%not-base64%%%.sig')).toBeNull();
  });
});

describe('isExpiring', () => {
  const NOW = 1_700_000_000_000;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('is false for a token comfortably in the future', () => {
    expect(isExpiring(tokenWith({ exp: NOW / 1000 + 600 }))).toBe(false);
  });

  it('is true once the token is within the default 60s skew', () => {
    expect(isExpiring(tokenWith({ exp: NOW / 1000 + 30 }))).toBe(true);
  });

  it('is true for an already-expired token', () => {
    expect(isExpiring(tokenWith({ exp: NOW / 1000 - 10 }))).toBe(true);
  });

  it('honours a custom skew window', () => {
    const token = tokenWith({ exp: NOW / 1000 + 120 });
    expect(isExpiring(token, 60_000)).toBe(false);
    expect(isExpiring(token, 180_000)).toBe(true);
  });

  it('treats a token with no exp as expiring', () => {
    expect(isExpiring('garbage')).toBe(true);
  });
});
