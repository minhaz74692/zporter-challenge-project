import type { NextRequest } from 'next/server';
import type { UserSummary } from '@zporter/shared';
import { proxyGet } from '@/lib/proxy';

export function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get('query') ?? '';
  return proxyGet<UserSummary[]>(`/users?query=${encodeURIComponent(query)}`);
}
