import { Inject, Injectable } from '@nestjs/common';
import type { Challenge, LeaderboardEntry } from '@zporter/shared';
import type {
  CollectionReference,
  DocumentData,
  Firestore,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.constants.js';

const COLLECTION = 'challenges';

/** Fields the repository writes (id = doc id, createdAt/status set here). */
export type NewChallenge = Omit<Challenge, 'id' | 'createdAt' | 'participantCount'>;

@Injectable()
export class ChallengesRepository {
  private readonly col: CollectionReference<DocumentData>;

  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {
    this.col = db.collection(COLLECTION);
  }

  async findById(id: string): Promise<Challenge | null> {
    const snap = await this.col.doc(id).get();
    return snap.exists ? this.fromDoc(snap as QueryDocumentSnapshot) : null;
  }

  async findManyByIds(ids: string[]): Promise<Challenge[]> {
    if (ids.length === 0) return [];
    const refs = ids.map((id) => this.col.doc(id));
    const snaps = await this.db.getAll(...refs);
    return snaps
      .filter((s) => s.exists)
      .map((s) => this.fromDoc(s as QueryDocumentSnapshot));
  }

  async listGlobal(): Promise<Challenge[]> {
    const snap = await this.col.where('visibility', '==', 'global').get();
    return snap.docs.map((d) => this.fromDoc(d));
  }

  async create(data: NewChallenge): Promise<Challenge> {
    const ref = this.col.doc();
    const record: Challenge = {
      id: ref.id,
      participantCount: 0,
      createdAt: new Date().toISOString(),
      ...data,
    };
    const { id: _id, ...doc } = record;
    await ref.set(doc);
    return record;
  }

  /** `challenges/{id}/leaderboard`, ordered by rank (limit small for previews). */
  async leaderboard(challengeId: string, limit = 5): Promise<LeaderboardEntry[]> {
    const snap = await this.col
      .doc(challengeId)
      .collection('leaderboard')
      .orderBy('rank')
      .limit(limit)
      .get();
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        userId: data.userId ?? d.id,
        displayName: data.displayName,
        value: data.value,
        rank: data.rank,
        updatedAt: data.updatedAt,
      };
    });
  }

  private fromDoc(snap: QueryDocumentSnapshot<DocumentData>): Challenge {
    const data = snap.data();
    return {
      id: snap.id,
      templateId: data.templateId,
      title: data.title,
      description: data.description,
      category: data.category,
      resultType: data.resultType,
      scoringDirection: data.scoringDirection,
      rules: data.rules,
      reward: data.reward,
      startAt: data.startAt,
      deadline: data.deadline,
      status: data.status,
      visibility: data.visibility,
      createdBy: data.createdBy,
      participantCount: data.participantCount ?? 0,
      createdAt: data.createdAt,
    };
  }
}
