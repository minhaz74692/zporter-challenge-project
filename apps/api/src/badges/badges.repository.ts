import { Inject, Injectable } from '@nestjs/common';
import type { Badge } from '@zporter/shared';
import type {
  CollectionReference,
  DocumentData,
  Firestore,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.constants.js';

const COLLECTION = 'badges';

/** Firestore access for the seed-only `badges` collection. */
@Injectable()
export class BadgesRepository {
  private readonly col: CollectionReference<DocumentData>;

  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {
    this.col = db.collection(COLLECTION);
  }

  async findById(id: string): Promise<Badge | null> {
    const snap = await this.col.doc(id).get();
    return snap.exists ? this.toBadge(snap as QueryDocumentSnapshot) : null;
  }

  async list(): Promise<Badge[]> {
    const snap = await this.col.get();
    return snap.docs
      .map((d) => this.toBadge(d))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private toBadge(snap: QueryDocumentSnapshot<DocumentData>): Badge {
    const data = snap.data();
    return {
      id: snap.id,
      name: data.name,
      icon: data.icon,
      description: data.description,
    };
  }
}
