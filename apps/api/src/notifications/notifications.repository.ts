import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { AppNotification } from '@zporter/shared';
import type {
  CollectionReference,
  DocumentData,
  Firestore,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.constants.js';
import type { NewNotification } from './entities/notification.entity.js';

const COLLECTION = 'notifications';

@Injectable()
export class NotificationsRepository {
  private readonly col: CollectionReference<DocumentData>;

  constructor(@Inject(FIRESTORE) db: Firestore) {
    this.col = db.collection(COLLECTION);
  }

  async create(data: NewNotification): Promise<AppNotification> {
    const ref = this.col.doc();
    const record: AppNotification = {
      id: ref.id,
      userId: data.userId,
      type: data.type,
      challengeId: data.challengeId,
      title: data.title,
      body: data.body,
      read: false,
      createdAt: new Date().toISOString(),
    };
    const { id: _id, ...doc } = record;
    await ref.set(doc);
    return record;
  }

  /** Caller's notifications, newest first (sorted in memory — no composite index). */
  async listByUser(userId: string, limit = 50): Promise<AppNotification[]> {
    const snap = await this.col.where('userId', '==', userId).get();
    return snap.docs
      .map((d) => this.fromDoc(d))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit);
  }

  async markRead(userId: string, id: string): Promise<void> {
    const ref = this.col.doc(id);
    const snap = await ref.get();
    if (!snap.exists || snap.data()?.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }
    await ref.set({ read: true }, { merge: true });
  }

  private fromDoc(snap: QueryDocumentSnapshot<DocumentData>): AppNotification {
    const data = snap.data();
    return {
      id: snap.id,
      userId: data.userId,
      type: data.type,
      challengeId: data.challengeId,
      title: data.title,
      body: data.body,
      read: data.read ?? false,
      createdAt: data.createdAt,
    };
  }
}
