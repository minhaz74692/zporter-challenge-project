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

/** Fields the repository writes (id/createdAt/participantCount/creator set elsewhere). */
export type NewChallenge = Omit<
  Challenge,
  'id' | 'createdAt' | 'participantCount' | 'creator'
>;

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

  /** Challenges visible to everyone without an invite (Figma "Share with: All"). */
  async listPublic(): Promise<Challenge[]> {
    const snap = await this.col.where('visibility', '==', 'all').get();
    return snap.docs.map((d) => this.fromDoc(d));
  }

  /** A creator's own challenges (Figma "Yours" tab). */
  async listByCreator(userId: string): Promise<Challenge[]> {
    const snap = await this.col.where('createdBy', '==', userId).get();
    return snap.docs
      .map((d) => this.fromDoc(d))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async updateFields(id: string, patch: Partial<Challenge>): Promise<void> {
    await this.col.doc(id).set(patch, { merge: true });
  }

  async create(data: NewChallenge): Promise<Challenge> {
    const ref = this.col.doc();
    const record: Challenge = {
      id: ref.id,
      participantCount: 0,
      createdAt: new Date().toISOString(),
      ...data,
    };
    const { id: _id, creator: _creator, ...doc } = record;
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
        handle: data.handle,
        avatarUrl: data.avatarUrl,
        club: data.club,
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
      ingress: data.ingress,
      description: data.description,
      mainCategory: data.mainCategory,
      collections: data.collections ?? [],
      equipmentTags: data.equipmentTags ?? [],
      resultType: data.resultType,
      resultUnit: data.resultUnit,
      scoringDirection: data.scoringDirection,
      durationMinutes: data.durationMinutes ?? 20,
      location: data.location ?? 'anywhere',
      startAt: data.startAt,
      deadline: data.deadline,
      status: data.status,
      visibility: data.visibility,
      pointsToParticipate: data.pointsToParticipate ?? 0,
      rewardPoints: data.rewardPoints ?? 0,
      rewardBadgeId: data.rewardBadgeId,
      minParticipants: data.minParticipants ?? 1,
      ageFrom: data.ageFrom,
      ageTo: data.ageTo,
      position: data.position,
      mediaImageUrl: data.mediaImageUrl,
      mediaVideoUrl: data.mediaVideoUrl,
      ratingAverage: data.ratingAverage,
      ratingCount: data.ratingCount,
      createdBy: data.createdBy,
      participantCount: data.participantCount ?? 0,
      createdAt: data.createdAt,
    };
  }
}
