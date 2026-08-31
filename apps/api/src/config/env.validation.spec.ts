import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { NodeEnv, validateEnv } from './env.validation.js';

const BASE = {
  FIREBASE_PROJECT_ID: 'zporter-test',
  JWT_ACCESS_SECRET: 'super-secret',
  GOOGLE_APPLICATION_CREDENTIALS: '/tmp/key.json',
};

describe('validateEnv', () => {
  it('accepts a minimal valid config and applies defaults', () => {
    const env = validateEnv({ ...BASE });
    expect(env.NODE_ENV).toBe(NodeEnv.Development);
    expect(env.PORT).toBe(3000);
    expect(env.JWT_ACCESS_TTL).toBe('15m');
    expect(env.JWT_REFRESH_TTL_DAYS).toBe(14);
  });

  it('coerces numeric strings for PORT and JWT_REFRESH_TTL_DAYS', () => {
    const env = validateEnv({ ...BASE, PORT: '8080', JWT_REFRESH_TTL_DAYS: '30' });
    expect(env.PORT).toBe(8080);
    expect(env.JWT_REFRESH_TTL_DAYS).toBe(30);
  });

  it('throws when FIREBASE_PROJECT_ID is missing', () => {
    const { FIREBASE_PROJECT_ID: _omit, ...rest } = BASE;
    expect(() => validateEnv(rest)).toThrow(/FIREBASE_PROJECT_ID/);
  });

  it('throws when JWT_ACCESS_SECRET is missing', () => {
    const { JWT_ACCESS_SECRET: _omit, ...rest } = BASE;
    expect(() => validateEnv(rest)).toThrow(/JWT_ACCESS_SECRET/);
  });

  it('rejects a PORT outside 0-65535', () => {
    expect(() => validateEnv({ ...BASE, PORT: '70000' })).toThrow(/PORT/);
  });

  it('rejects an unknown NODE_ENV', () => {
    expect(() => validateEnv({ ...BASE, NODE_ENV: 'staging' })).toThrow(/NODE_ENV/);
  });

  it('requires a Firebase credential source outside production', () => {
    const { GOOGLE_APPLICATION_CREDENTIALS: _omit, ...rest } = BASE;
    expect(() => validateEnv(rest)).toThrow(/Firebase credentials/);
  });

  it('allows production with no explicit credential source (ADC)', () => {
    const { GOOGLE_APPLICATION_CREDENTIALS: _omit, ...rest } = BASE;
    const env = validateEnv({ ...rest, NODE_ENV: 'production' });
    expect(env.NODE_ENV).toBe(NodeEnv.Production);
  });

  it('accepts the inline service-account key as the credential source', () => {
    const { GOOGLE_APPLICATION_CREDENTIALS: _omit, ...rest } = BASE;
    expect(() =>
      validateEnv({ ...rest, FIREBASE_SERVICE_ACCOUNT_KEY: '{"type":"service_account"}' }),
    ).not.toThrow();
  });
});
