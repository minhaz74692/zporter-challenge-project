import { Inject, Injectable } from '@nestjs/common';
import type {
  CollectionReference,
  DocumentData,
  Firestore,
} from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.constants.js';
import type { NewSession, SessionRecord } from './entities/session.entity.js';

/** Firestore access for the `users/{userId}/sessions` subcollection. */
@Injectable()
export class SessionsRepository {
  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {}

  private collection(userId: string): CollectionReference<DocumentData> {
    return this.db.collection('users').doc(userId).collection('sessions');
  }

  async create(userId: string, data: NewSession): Promise<SessionRecord> {
    const ref = this.collection(userId).doc();
    const record: SessionRecord = {
      id: ref.id,
      userId,
      createdAt: new Date().toISOString(),
      ...data,
    };
    const { id: _id, userId: _userId, ...doc } = record;
    await ref.set(doc);
    return record;
  }

  async findById(userId: string, sessionId: string): Promise<SessionRecord | null> {
    const snap = await this.collection(userId).doc(sessionId).get();
    if (!snap.exists) return null;
    const data = snap.data() as DocumentData;
    return {
      id: snap.id,
      userId,
      refreshTokenHash: data.refreshTokenHash,
      userAgent: data.userAgent,
      expiresAt: data.expiresAt,
      createdAt: data.createdAt,
      revokedAt: data.revokedAt,
    };
  }

  /** Overwrite the stored hash + sliding expiry (rotation). */
  async rotate(
    userId: string,
    sessionId: string,
    data: { refreshTokenHash: string; expiresAt: string },
  ): Promise<void> {
    await this.collection(userId).doc(sessionId).update({ ...data });
  }

  async revoke(userId: string, sessionId: string): Promise<void> {
    await this.collection(userId)
      .doc(sessionId)
      .set({ revokedAt: new Date().toISOString() }, { merge: true });
  }

  /** Reuse-detection response: kill every live session for the user. */
  async revokeAllForUser(userId: string): Promise<void> {
    const snap = await this.collection(userId).get();
    if (snap.empty) return;
    const now = new Date().toISOString();
    const batch = this.db.batch();
    for (const doc of snap.docs) {
      if (!doc.data().revokedAt) batch.update(doc.ref, { revokedAt: now });
    }
    await batch.commit();
  }
}
