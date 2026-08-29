import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Firestore } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.constants.js';

export interface HealthReport {
  status: 'ok' | 'degraded';
  uptime: number;
  checks: {
    firestore: { ok: boolean; latencyMs?: number; error?: string };
  };
}

const FIRESTORE_PING_TIMEOUT_MS = 3000;

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {}

  async check(): Promise<HealthReport> {
    const firestore = await this.pingFirestore();
    return {
      status: firestore.ok ? 'ok' : 'degraded',
      uptime: Math.round(process.uptime()),
      checks: { firestore },
    };
  }

  /** Cheap read against a reserved doc — proves credentials + connectivity. */
  private async pingFirestore(): Promise<HealthReport['checks']['firestore']> {
    const startedAt = Date.now();
    try {
      const read = this.db.collection('_health').doc('ping').get();
      await Promise.race([read, this.timeout(FIRESTORE_PING_TIMEOUT_MS)]);
      return { ok: true, latencyMs: Date.now() - startedAt };
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      this.logger.error(`Firestore health check failed: ${error}`);
      return { ok: false, error };
    }
  }

  private timeout(ms: number): Promise<never> {
    return new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Firestore ping exceeded ${ms}ms`)), ms).unref(),
    );
  }
}
