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

  /** Every squad — backs the public signup directory (prototype scale). */
  async listAll(): Promise<Team[]> {
    const snap = await this.col.get();
    return snap.docs
      .map((d) => this.toTeam(d))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  /** Create a squad with an auto id; the coach's `members` row is written separately. */
  async create(input: { name: string; coachId: string }): Promise<Team> {
    const ref = this.col.doc();
    const team: Team = {
      id: ref.id,
      name: input.name,
      coachId: input.coachId,
      createdAt: new Date().toISOString(),
    };
    await ref.set({ name: team.name, coachId: team.coachId, createdAt: team.createdAt });
    return team;
  }

  /** Upsert a `teams/{teamId}/members/{userId}` join row. */
  async addMember(
    teamId: string,
    member: { userId: string; role: TeamMember['role'] },
  ): Promise<void> {
    await this.col.doc(teamId).collection('members').doc(member.userId).set({
      userId: member.userId,
      teamId,
      role: member.role,
      joinedAt: new Date().toISOString(),
    });
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
