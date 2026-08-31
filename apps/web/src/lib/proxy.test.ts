import { afterEach, describe, expect, it, vi } from 'vitest';

const h = vi.hoisted(() => {
  class ApiError extends Error {
    status: number;
    body: unknown;
    constructor(status: number, body: unknown) {
      super(typeof body === 'string' ? body : `err ${status}`);
      this.status = status;
      this.body = body;
    }
  }
  return { ApiError, apiMock: vi.fn() };
});
const { ApiError, apiMock } = h;

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) =>
      new Response(JSON.stringify(body), {
        status: init?.status ?? 200,
        headers: { 'content-type': 'application/json' },
      }),
  },
}));
vi.mock('./api', () => ({ api: h.apiMock, ApiError: h.ApiError }));

import { proxyGet } from './proxy';

afterEach(() => vi.clearAllMocks());

describe('proxyGet', () => {
  it('passes the payload straight through with a 200', async () => {
    apiMock.mockResolvedValue([{ id: 'u1' }]);
    const res = await proxyGet('/users?query=nair');

    expect(apiMock).toHaveBeenCalledWith('/users?query=nair');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: 'u1' }]);
  });

  it('mirrors the upstream ApiError status and message', async () => {
    apiMock.mockRejectedValue(new ApiError(404, 'Not found'));
    const res = await proxyGet('/challenges/missing/leaderboard');

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'Not found' });
  });

  it('collapses a status-0 ApiError to a 502', async () => {
    apiMock.mockRejectedValue(new ApiError(0, 'boom'));
    const res = await proxyGet('/x');
    expect(res.status).toBe(502);
  });

  it('returns a generic 502 for a non-ApiError failure', async () => {
    apiMock.mockRejectedValue(new Error('unexpected'));
    const res = await proxyGet('/x');

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: 'Request failed' });
  });
});
