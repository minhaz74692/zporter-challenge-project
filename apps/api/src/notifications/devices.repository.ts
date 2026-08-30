import { Inject, Injectable } from '@nestjs/common';
import type { DevicePlatform } from '@zporter/shared';
import type { CollectionReference, DocumentData, Firestore } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.constants.js';
import type { DeviceTokenRecord } from './entities/notification.entity.js';

const COLLECTION = 'deviceTokens';

@Injectable()
export class DevicesRepository {
  private readonly col: CollectionReference<DocumentData>;

  constructor(@Inject(FIRESTORE) db: Firestore) {
    this.col = db.collection(COLLECTION);
  }

  /** One token per (user, platform); re-registering overwrites. */
  async upsert(
    userId: string,
    fcmToken: string,
    platform: DevicePlatform,
  ): Promise<DeviceTokenRecord> {
    const id = `${userId}_${platform}`;
    const record: DeviceTokenRecord = {
      id,
      userId,
      fcmToken,
      platform,
      updatedAt: new Date().toISOString(),
    };
    const { id: _id, ...doc } = record;
    await this.col.doc(id).set(doc);
    return record;
  }

  async tokensForUser(userId: string): Promise<string[]> {
    const snap = await this.col.where('userId', '==', userId).get();
    return snap.docs.map((d) => d.data().fcmToken as string).filter(Boolean);
  }
}
