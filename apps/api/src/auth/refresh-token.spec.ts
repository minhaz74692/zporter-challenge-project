import { describe, expect, it } from 'vitest';
import {
  formatRefreshToken,
  generateRefreshSecret,
  parseRefreshToken,
  sha256,
} from './refresh-token.js';

describe('sha256', () => {
  it('is deterministic and hex-encoded', () => {
    expect(sha256('abc')).toBe(sha256('abc'));
    expect(sha256('abc')).toMatch(/^[0-9a-f]{64}$/);
  });

  it('differs for different inputs', () => {
    expect(sha256('a')).not.toBe(sha256('b'));
  });
});

describe('generateRefreshSecret', () => {
  it('returns a 64-hex-char secret whose hash matches sha256(secret)', () => {
    const { secret, hash } = generateRefreshSecret();
    expect(secret).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).toBe(sha256(secret));
  });

  it('is unique per call', () => {
    expect(generateRefreshSecret().secret).not.toBe(generateRefreshSecret().secret);
  });
});

describe('formatRefreshToken / parseRefreshToken', () => {
  it('round-trips the three parts', () => {
    const token = formatRefreshToken('user1', 'sess1', 'deadbeef');
    expect(token).toBe('user1.sess1.deadbeef');
    expect(parseRefreshToken(token)).toEqual({
      userId: 'user1',
      sessionId: 'sess1',
      secret: 'deadbeef',
    });
  });

  it('rejects a token without exactly three dot-separated parts', () => {
    expect(parseRefreshToken('only.two')).toBeNull();
    expect(parseRefreshToken('a.b.c.d')).toBeNull();
    expect(parseRefreshToken('nodots')).toBeNull();
  });

  it('rejects a token with an empty part', () => {
    expect(parseRefreshToken('user1..secret')).toBeNull();
    expect(parseRefreshToken('.sess1.secret')).toBeNull();
    expect(parseRefreshToken('user1.sess1.')).toBeNull();
  });

  it('rejects a non-string input', () => {
    expect(parseRefreshToken(undefined as unknown as string)).toBeNull();
    expect(parseRefreshToken(null as unknown as string)).toBeNull();
    expect(parseRefreshToken(123 as unknown as string)).toBeNull();
  });
});
