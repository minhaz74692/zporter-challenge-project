/**
 * Read a JWT's `exp` without verifying it — the API is the only party that
 * verifies. Used by middleware to decide whether to refresh proactively.
 */
export function jwtExpMs(token: string): number | null {
  const part = token.split('.')[1];
  if (!part) return null;
  try {
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    const { exp } = JSON.parse(json) as { exp?: number };
    return typeof exp === 'number' ? exp * 1000 : null;
  } catch {
    return null;
  }
}

/** True if the token is missing an exp or expires within `skewMs`. */
export function isExpiring(token: string, skewMs = 60_000): boolean {
  const exp = jwtExpMs(token);
  return exp === null || exp - Date.now() < skewMs;
}
