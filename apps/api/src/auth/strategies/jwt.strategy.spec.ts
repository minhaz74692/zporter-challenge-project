import { ConfigService } from '@nestjs/config';
import { describe, expect, it } from 'vitest';
import type { JwtPayload } from '../types.js';
import { JwtStrategy } from './jwt.strategy.js';

const config = {
  getOrThrow: () => ({ accessSecret: 'test-secret', accessTtl: '15m', refreshTtlDays: 14 }),
} as unknown as ConfigService;

describe('JwtStrategy', () => {
  it('maps the JWT claims onto req.user (sub -> userId, role passthrough)', () => {
    const strategy = new JwtStrategy(config);
    const payload: JwtPayload = { sub: 'user-42', role: 'coach' };
    expect(strategy.validate(payload)).toEqual({ userId: 'user-42', role: 'coach' });
  });

  it('throws at construction if the access secret is not configured', () => {
    const broken = {
      getOrThrow: () => {
        throw new Error('missing auth config');
      },
    } as unknown as ConfigService;
    expect(() => new JwtStrategy(broken)).toThrow('missing auth config');
  });
});
