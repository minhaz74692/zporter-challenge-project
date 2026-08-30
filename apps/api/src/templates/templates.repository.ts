import { Inject, Injectable } from '@nestjs/common';
import type { ChallengeTemplate } from '@zporter/shared';
import type {
  CollectionReference,
  DocumentData,
  Firestore,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.constants.js';

const COLLECTION = 'challengeTemplates';

/** Fields the repository writes (id = doc id, createdAt set on create). */
export type NewTemplate = Omit<ChallengeTemplate, 'id' | 'createdAt'>;

/** All Firestore access for `challengeTemplates`. */
@Injectable()
export class TemplatesRepository {
  private readonly col: CollectionReference<DocumentData>;

  constructor(@Inject(FIRESTORE) db: Firestore) {
    this.col = db.collection(COLLECTION);
  }

  async findById(id: string): Promise<ChallengeTemplate | null> {
    const snap = await this.col.doc(id).get();
    return snap.exists ? this.fromDoc(snap as QueryDocumentSnapshot) : null;
  }

  async listPublic(): Promise<ChallengeTemplate[]> {
    const snap = await this.col.where('isPublic', '==', true).get();
    return this.sortNewestFirst(snap.docs.map((d) => this.fromDoc(d)));
  }

  async listByCreator(userId: string): Promise<ChallengeTemplate[]> {
    const snap = await this.col.where('createdBy', '==', userId).get();
    return this.sortNewestFirst(snap.docs.map((d) => this.fromDoc(d)));
  }

  async create(data: NewTemplate): Promise<ChallengeTemplate> {
    const ref = this.col.doc();
    const record: ChallengeTemplate = {
      id: ref.id,
      createdAt: new Date().toISOString(),
      ...data,
    };
    const { id: _id, ...doc } = record;
    await ref.set(doc);
    return record;
  }

  private sortNewestFirst(rows: ChallengeTemplate[]): ChallengeTemplate[] {
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private fromDoc(snap: QueryDocumentSnapshot<DocumentData>): ChallengeTemplate {
    const data = snap.data();
    return {
      id: snap.id,
      title: data.title,
      description: data.description,
      category: data.category,
      resultType: data.resultType,
      scoringDirection: data.scoringDirection,
      rules: data.rules,
      defaultRewardBadgeId: data.defaultRewardBadgeId,
      isPublic: data.isPublic,
      createdBy: data.createdBy,
      createdAt: data.createdAt,
    };
  }
}
