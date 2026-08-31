import { afterEach, describe, expect, it, vi } from 'vitest';

const proxyGet = vi.fn((path: string) => Promise.resolve(new Response(path)));
vi.mock('@/lib/proxy', () => ({ proxyGet: (path: string) => proxyGet(path) }));

import { GET } from './route';

function req(url: string) {
  return { nextUrl: new URL(url) } as unknown as Parameters<typeof GET>[0];
}

afterEach(() => vi.clearAllMocks());

describe('GET /api/users', () => {
  it('forwards the query term to the upstream users search', async () => {
    await GET(req('http://localhost/api/users?query=nair'));
    expect(proxyGet).toHaveBeenCalledWith('/users?query=nair');
  });

  it('URL-encodes the search term', async () => {
    await GET(req('http://localhost/api/users?query=a%20b%26c'));
    expect(proxyGet).toHaveBeenCalledWith('/users?query=a%20b%26c');
  });

  it('defaults to an empty query when the param is absent', async () => {
    await GET(req('http://localhost/api/users'));
    expect(proxyGet).toHaveBeenCalledWith('/users?query=');
  });
});
