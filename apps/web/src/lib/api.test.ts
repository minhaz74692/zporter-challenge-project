import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./env', () => ({
  API_URL: 'https://api.test',
  COOKIE: { access: 'zp_access', refresh: 'zp_refresh' },
  ACCESS_MAX_AGE: 1,
  REFRESH_MAX_AGE: 1,
}));

const getAccessToken = vi.fn<() => Promise<string | null>>();
vi.mock('./session', () => ({ getAccessToken: () => getAccessToken() }));

import { api, ApiError } from './api';

function jsonResponse(status: number, body: unknown): Response {
  return new Response(body === undefined ? '' : JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);
  getAccessToken.mockResolvedValue('tok-123');
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('api()', () => {
  it('GETs when there is no body and returns the parsed JSON', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: 'c1' }));
    const out = await api<{ id: string }>('/challenges/c1');

    expect(out).toEqual({ id: 'c1' });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://api.test/challenges/c1');
    expect(init.method).toBe('GET');
    expect(init.cache).toBe('no-store');
  });

  it('defaults to POST and JSON-encodes an object body', async () => {
    fetchMock.mockResolvedValue(jsonResponse(201, {}));
    await api('/challenges', { body: { title: 'X' } });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe('POST');
    expect(init.body).toBe('{"title":"X"}');
    expect(new Headers(init.headers).get('content-type')).toBe('application/json');
  });

  it('sends FormData as-is without forcing a JSON content-type', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, {}));
    const fd = new FormData();
    fd.append('file', new Blob(['x']), 'a.png');
    await api('/challenges/c1/cover', { body: fd });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.body).toBeInstanceOf(FormData);
    expect(new Headers(init.headers).get('content-type')).toBeNull();
  });

  it('attaches the bearer token by default and omits it when auth:false', async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, {}));
    await api('/auth/me');
    expect(new Headers(fetchMock.mock.calls[0][1].headers).get('authorization')).toBe(
      'Bearer tok-123',
    );

    fetchMock.mockResolvedValue(jsonResponse(200, {}));
    await api('/auth/login', { auth: false, body: { email: 'a' } });
    expect(new Headers(fetchMock.mock.calls[1][1].headers).get('authorization')).toBeNull();
    expect(getAccessToken).toHaveBeenCalledTimes(1);
  });

  it('throws an ApiError carrying the status and the first validation message', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(400, { message: ['email must be an email', 'weak password'] }),
    );

    const err = (await api('/auth/signup', { body: {} }).catch((e) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    expect(err.message).toBe('email must be an email');
  });

  it('wraps a transport failure as ApiError status 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('fetch failed'));

    const err = (await api('/challenges').catch((e) => e)) as ApiError;
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(0);
    expect(err.message).toContain('Cannot reach the API');
  });

  it('returns null for an empty 2xx body', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    await expect(api('/challenges/c1', { method: 'DELETE' })).resolves.toBeNull();
  });
});

describe('ApiError.friendly', () => {
  it('uses a bare string message from the body', () => {
    expect(new ApiError(403, { message: 'Forbidden resource' }).message).toBe('Forbidden resource');
  });

  it('falls back to a status line when the body has no message', () => {
    expect(new ApiError(500, null).message).toBe('Request failed (500).');
  });

  it('uses the unreachable-API line for status 0', () => {
    expect(new ApiError(0, {}).message).toBe('Cannot reach the API.');
  });
});
