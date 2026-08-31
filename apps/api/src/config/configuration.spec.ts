import 'reflect-metadata';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { configuration } from './configuration.js';
import { NodeEnv } from './env.validation.js';

const KEYS = [
  'NODE_ENV',
  'PORT',
  'FIREBASE_PROJECT_ID',
  'GOOGLE_APPLICATION_CREDENTIALS',
  'FIREBASE_SERVICE_ACCOUNT_KEY',
  'FIREBASE_STORAGE_BUCKET',
  'JWT_ACCESS_SECRET',
  'JWT_ACCESS_TTL',
  'JWT_REFRESH_TTL_DAYS',
] as const;

describe('configuration()', () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = Object.fromEntries(KEYS.map((k) => [k, process.env[k]]));
    for (const k of KEYS) delete process.env[k];
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it('maps the flat env into the nested typed tree', () => {
    Object.assign(process.env, {
      NODE_ENV: 'production',
      PORT: '8080',
      FIREBASE_PROJECT_ID: 'proj',
      FIREBASE_STORAGE_BUCKET: 'proj.appspot.com',
      GOOGLE_APPLICATION_CREDENTIALS: '/k.json',
      JWT_ACCESS_SECRET: 'sekret',
      JWT_ACCESS_TTL: '1h',
      JWT_REFRESH_TTL_DAYS: '7',
    });

    expect(configuration()).toEqual({
      app: { nodeEnv: NodeEnv.Production, port: 8080, isProduction: true },
      firebase: {
        projectId: 'proj',
        credentialsPath: '/k.json',
        serviceAccountKey: undefined,
        storageBucket: 'proj.appspot.com',
      },
      auth: { accessSecret: 'sekret', accessTtl: '1h', refreshTtlDays: 7 },
    });
  });

  it('falls back to development defaults when optionals are unset', () => {
    process.env.FIREBASE_PROJECT_ID = 'proj';
    process.env.JWT_ACCESS_SECRET = 'sekret';

    const cfg = configuration();
    expect(cfg.app).toEqual({ nodeEnv: NodeEnv.Development, port: 3000, isProduction: false });
    expect(cfg.auth).toEqual({ accessSecret: 'sekret', accessTtl: '15m', refreshTtlDays: 14 });
  });

  it('flags isProduction only for NODE_ENV=production', () => {
    process.env.NODE_ENV = 'test';
    expect(configuration().app.isProduction).toBe(false);
  });
});
