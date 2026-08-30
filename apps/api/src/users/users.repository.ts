import { Inject, Injectable } from '@nestjs/common';
import {
  FieldValue,
  type CollectionReference,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.constants.js';
import type { NewUser, UserRecord } from './entities/user.entity.js';

const COLLECTION = 'users';

/**
 * All Firestore access for the `users` collection. Converts between stored
 * documents and the domain {@link UserRecord}; nothing above this layer sees a
 * Firestore type.
 */
@Injectable()
export class UsersRepository {
  private readonly col: CollectionReference<DocumentData>;

  constructor(@Inject(FIRESTORE) db: Firestore) {
    this.col = db.collection(COLLECTION);
  }

  async findById(id: string): Promise<UserRecord | null> {
    const snap = await this.col.doc(id).get();
    return snap.exists ? this.fromDoc(snap as QueryDocumentSnapshot) : null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const snap = await this.col.where('email', '==', email).limit(1).get();
    return snap.empty ? null : this.fromDoc(snap.docs[0]);
  }

  async setAvatarUrl(id: string, avatarUrl: string): Promise<void> {
    await this.col.doc(id).set({ avatarUrl }, { merge: true });
  }

  async clearAvatarUrl(id: string): Promise<void> {
    await this.col.doc(id).update({ avatarUrl: FieldValue.delete() });
  }

  async create(data: NewUser): Promise<UserRecord> {
    const ref = this.col.doc();
    const record: UserRecord = {
      id: ref.id,
      createdAt: new Date().toISOString(),
      ...data,
    };
    const { id: _id, ...doc } = record;
    await ref.set(doc);
    return record;
  }

  /**
   * Invite-picker search. Firestore has no substring index, so this fetches a
   * capped page and filters in memory — fine at prototype scale (tens of users).
   */
  async search(query: string, limit = 20): Promise<UserRecord[]> {
    const snap = await this.col.orderBy('displayName').limit(200).get();
    const needle = query.trim().toLowerCase();
    const users = snap.docs.map((d) => this.fromDoc(d));
    if (!needle) return users.slice(0, limit);
    return users
      .filter(
        (u) =>
          u.displayName.toLowerCase().includes(needle) ||
          u.email.toLowerCase().includes(needle),
      )
      .slice(0, limit);
  }

  private fromDoc(snap: QueryDocumentSnapshot<DocumentData>): UserRecord {
    const data = snap.data();
    return {
      id: snap.id,
      email: data.email,
      passwordHash: data.passwordHash,
      displayName: data.displayName,
      role: data.role,
      handle: data.handle,
      avatarUrl: data.avatarUrl,
      country: data.country,
      city: data.city,
      club: data.club,
      position: data.position,
      createdAt: data.createdAt,
    };
  }
}
