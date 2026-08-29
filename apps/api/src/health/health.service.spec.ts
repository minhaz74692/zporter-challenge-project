import type { Firestore } from 'firebase-admin/firestore';
import { describe, expect, it } from 'vitest';
import { HealthService } from './health.service.js';

function dbReturning(get: () => Promise<unknown>): Firestore {
  return {
    collection: () => ({ doc: () => ({ get }) }),
  } as unknown as Firestore;
}

describe('HealthService', () => {
  it('reports ok when the Firestore ping resolves', async () => {
    const service = new HealthService(dbReturning(() => Promise.resolve({})));

    const report = await service.check();

    expect(report.status).toBe('ok');
    expect(report.checks.firestore.ok).toBe(true);
    expect(report.checks.firestore.latencyMs).toBeTypeOf('number');
  });

  it('reports degraded with the error message when the ping rejects', async () => {
    const service = new HealthService(
      dbReturning(() => Promise.reject(new Error('permission denied'))),
    );

    const report = await service.check();

    expect(report.status).toBe('degraded');
    expect(report.checks.firestore).toMatchObject({ ok: false, error: 'permission denied' });
  });
});
