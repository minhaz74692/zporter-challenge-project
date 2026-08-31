import { afterEach, describe, expect, it, vi } from 'vitest';

async function loadEnv() {
  vi.resetModules();
  return import('./env');
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('API_URL', () => {
  it('falls back to the IPv4 loopback when NEXT_PUBLIC_API_URL is unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', undefined as unknown as string);
    const { API_URL } = await loadEnv();
    expect(API_URL).toBe('http://127.0.0.1:3000');
  });

  it('strips exactly one trailing slash from the configured value', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.zporter.test/');
    const { API_URL } = await loadEnv();
    expect(API_URL).toBe('https://api.zporter.test');
  });

  it('leaves a slash-free value untouched', async () => {
    vi.stubEnv('NEXT_PUBLIC_API_URL', 'https://api.zporter.test');
    const { API_URL } = await loadEnv();
    expect(API_URL).toBe('https://api.zporter.test');
  });
});

describe('cookie + lifetime constants', () => {
  it('names the two session cookies', async () => {
    const { COOKIE } = await loadEnv();
    expect(COOKIE).toEqual({ access: 'zp_access', refresh: 'zp_refresh' });
  });

  it('keeps the access cookie under the 15-minute JWT and the refresh cookie at 14 days', async () => {
    const { ACCESS_MAX_AGE, REFRESH_MAX_AGE } = await loadEnv();
    expect(ACCESS_MAX_AGE).toBe(60 * 14);
    expect(ACCESS_MAX_AGE).toBeLessThan(60 * 15);
    expect(REFRESH_MAX_AGE).toBe(60 * 60 * 24 * 14);
  });
});
