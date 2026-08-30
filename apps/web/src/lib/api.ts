import 'server-only';
import { API_URL } from './env';
import { getAccessToken } from './session';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`API ${status}`);
    this.name = 'ApiError';
  }

  /** First validation message, or the plain message. */
  get message(): string {
    const b = this.body as { message?: string | string[] } | null;
    if (b?.message) return Array.isArray(b.message) ? b.message[0] : b.message;
    return `Request failed (${this.status})`;
  }
}

interface Options extends Omit<RequestInit, 'body'> {
  /** JSON-serialised unless it's a `FormData`. */
  body?: FormData | object;
  /** Attach the access-token cookie (default true). */
  auth?: boolean;
}

/**
 * The single typed gateway to the NestJS API for Server Components and Server
 * Actions. Reads the access-token cookie; middleware keeps it fresh.
 */
export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const { body, auth = true, headers, method, ...rest } = options;
  const h = new Headers(headers);

  let payload: BodyInit | undefined;
  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    h.set('content-type', 'application/json');
    payload = JSON.stringify(body);
  }

  // default to POST when there's a body, GET otherwise
  const verb = method ?? (payload !== undefined ? 'POST' : 'GET');

  if (auth) {
    const token = await getAccessToken();
    if (token) h.set('authorization', `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...rest,
      method: verb,
      headers: h,
      body: payload,
      cache: 'no-store',
    });
  } catch (cause) {
    throw new ApiError(0, {
      message: `Cannot reach the API at ${API_URL}. Is it running?`,
      cause: String(cause),
    });
  }

  const text = await res.text();
  const parsed = text ? safeJson(text) : null;
  if (!res.ok) throw new ApiError(res.status, parsed);
  return parsed as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
