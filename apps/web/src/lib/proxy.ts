import { NextResponse } from 'next/server';
import { api, ApiError } from './api';

/**
 * Shared body for `app/api/*` route handlers that let client components read
 * from the NestJS API without holding the access token. Server-side only.
 */
export async function proxyGet<T>(apiPath: string): Promise<NextResponse> {
  try {
    return NextResponse.json(await api<T>(apiPath));
  } catch (e) {
    const status = e instanceof ApiError && e.status ? e.status : 502;
    return NextResponse.json(
      { error: e instanceof ApiError ? e.message : 'Request failed' },
      { status },
    );
  }
}
