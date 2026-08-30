import { Inject, Injectable } from '@nestjs/common';
import type { Team, TeamMember } from '@zporter/shared';
import type {
  CollectionReference,
  DocumentData,
  Firestore,
  QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.constants.js';

const COLLECTION = 'teams';

/** Firestore access for `teams` and the `teams/{id}/members` join. */
@Injectable()
export class TeamsRepository {
  private readonly col: CollectionReference<DocumentData>;

  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {
    this.col = db.collection(COLLECTION);
  }

  async findById(id: string): Promise<Team | null> {
    const snap = await this.col.doc(id).get();
    return snap.exists ? this.toTeam(snap as QueryDocumentSnapshot) : null;
  }

  async listByCoach(coachId: string): Promise<Team[]> {
    const snap = await this.col.where('coachId', '==', coachId).get();
    return snap.docs
      .map((d) => this.toTeam(d))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async listMembers(teamId: string): Promise<TeamMember[]> {
    const snap = await this.col.doc(teamId).collection('members').get();
    return snap.docs.map((d) => this.toMember(d));
  }

  private toTeam(snap: QueryDocumentSnapshot<DocumentData>): Team {
    const data = snap.data();
    return {
      id: snap.id,
      name: data.name,
      coachId: data.coachId,
      createdAt: data.createdAt,
    };
  }

  private toMember(snap: QueryDocumentSnapshot<DocumentData>): TeamMember {
    const data = snap.data();
    return {
      userId: data.userId ?? snap.id,
      teamId: data.teamId,
      role: data.role,
      joinedAt: data.joinedAt,
    };
  }
}
