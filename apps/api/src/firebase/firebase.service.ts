import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  applicationDefault,
  cert,
  deleteApp,
  getApps,
  initializeApp,
  type App,
  type Credential,
} from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { getMessaging, type Messaging } from 'firebase-admin/messaging';
import { getStorage, type Storage } from 'firebase-admin/storage';
import type { FirebaseConfig } from '../config/configuration.js';
import { FIREBASE_APP_NAME } from './firebase.constants.js';

/**
 * The one and only place `firebase-admin` is touched. Owns the Admin app
 * lifecycle and hands out `firestore` / `messaging` / `storage`. Anything that
 * needs Firebase depends on this service (or the `FIRESTORE` token), never on
 * the SDK directly.
 *
 * The Admin app is created in the constructor (a cheap, synchronous, no-network
 * call) so it is ready for any provider that consumes it during module init.
 */
@Injectable()
export class FirebaseService implements OnModuleDestroy {
  private readonly logger = new Logger(FirebaseService.name);
  private readonly app: App;
  private readonly storageBucket?: string;

  constructor(config: ConfigService) {
    const firebase = config.getOrThrow<FirebaseConfig>('firebase');
    this.storageBucket = firebase.storageBucket;
    this.app =
      getApps().find((a) => a.name === FIREBASE_APP_NAME) ??
      initializeApp(
        {
          credential: this.resolveCredential(firebase),
          projectId: firebase.projectId,
          storageBucket: firebase.storageBucket,
        },
        FIREBASE_APP_NAME,
      );

    getFirestore(this.app).settings({ ignoreUndefinedProperties: true });
    this.logger.log(`Firebase Admin initialised for project "${firebase.projectId}"`);
  }

  async onModuleDestroy(): Promise<void> {
    await deleteApp(this.app);
  }

  get firestore(): Firestore {
    return getFirestore(this.app);
  }

  get messaging(): Messaging {
    return getMessaging(this.app);
  }

  get storage(): Storage {
    return getStorage(this.app);
  }

  /** The configured bucket name, or `undefined` if uploads are not enabled. */
  get bucketName(): string | undefined {
    return this.storageBucket;
  }

  /**
   * Local/dev: an explicit service-account key (file path or inline JSON).
   * Cloud Run / any Google runtime: Application Default Credentials.
   * Chosen by what's provided, not by NODE_ENV, so it stays testable.
   */
  private resolveCredential(firebase: FirebaseConfig): Credential {
    if (firebase.serviceAccountKey) {
      return cert(this.parseInlineKey(firebase.serviceAccountKey));
    }
    if (firebase.credentialsPath) {
      // `cert(path)` reads the file itself.
      return cert(firebase.credentialsPath);
    }
    this.logger.log('No explicit credentials — using Application Default Credentials');
    return applicationDefault();
  }

  private parseInlineKey(raw: string): Record<string, unknown> {
    const json = raw.trim().startsWith('{')
      ? raw
      : Buffer.from(raw, 'base64').toString('utf8');
    try {
      return JSON.parse(json) as Record<string, unknown>;
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON (raw or base64).');
    }
  }
}
