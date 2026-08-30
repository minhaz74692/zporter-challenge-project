import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { InviteState, Participant, SubmittedResult } from '@zporter/shared';
import {
  FieldValue,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
  type WriteBatch,
} from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.constants.js';

const CHALLENGES = 'challenges';
const SUBCOLLECTION = 'participants';

export interface NewInvite {
  userId: string;
  displayName: string;
}

/** Firestore raises gRPC code 9 (FAILED_PRECONDITION) when an index is absent or building. */
function isMissingIndex(err: unknown): boolean {
  const e = err as { code?: number; message?: string };
  return e?.code === 9 || /requires an index|index.*not ready/i.test(e?.message ?? '');
}

/**
 * Firestore access for `challenges/{challengeId}/participants` (doc id = userId).
 * Also owns the denormalized `participantCount` on the challenge root, so an
 * accept / decline is a single transaction. Shared by the `challenges`,
 * `participants` and `results` modules.
 */
@Injectable()
export class ParticipantsRepository {
  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {}

  private col(challengeId: string) {
    return this.db.collection(CHALLENGES).doc(challengeId).collection(SUBCOLLECTION);
  }

  ref(challengeId: string, userId: string) {
    return this.col(challengeId).doc(userId);
  }

  async findOne(challengeId: string, userId: string): Promise<Participant | null> {
    const snap = await this.col(challengeId).doc(userId).get();
    return snap.exists ? this.fromDoc(snap as QueryDocumentSnapshot) : null;
  }

  async listByChallenge(challengeId: string): Promise<Participant[]> {
    const snap = await this.col(challengeId).get();
    return snap.docs.map((d) => this.fromDoc(d));
  }

  /**
   * Every participant row for a user, across all challenges. Needs the
   * `participants.userId` collection-group index (see `FIREBASE_SETUP.md` §7).
   */
  async listByUser(userId: string): Promise<Participant[]> {
    try {
      const snap = await this.db
        .collectionGroup(SUBCOLLECTION)
        .where('userId', '==', userId)
        .get();
      return snap.docs.map((d) => this.fromDoc(d));
    } catch (err) {
      if (isMissingIndex(err)) {
        throw new ServiceUnavailableException(
          'Firestore is still building the participants.userId index — retry in a minute ' +
            '(deploy it with `firebase deploy --only firestore:indexes`).',
        );
      }
      throw err;
    }
  }

  /**
   * Adds `invited` rows for users who do not already have one. Returns how many
   * were actually written.
   */
  async addInvites(challengeId: string, invites: NewInvite[]): Promise<number> {
    if (invites.length === 0) return 0;
    const existing = await this.listByChallenge(challengeId);
    const known = new Set(existing.map((p) => p.userId));
    const fresh = invites.filter((i) => !known.has(i.userId));
    if (fresh.length === 0) return 0;

    const now = new Date().toISOString();
    const batch = this.db.batch();
    for (const invite of fresh) {
      batch.set(this.col(challengeId).doc(invite.userId), {
        challengeId,
        userId: invite.userId,
        displayName: invite.displayName,
        inviteState: 'invited',
        resultState: 'pending',
        joinedAt: now,
      });
    }
    await batch.commit();
    return fresh.length;
  }

  /**
   * Transactionally move the caller into `accepted` and keep `participantCount`
   * in step. Re-accepting is a no-op. For a `global` challenge a missing row is
   * created; for an invited one it is rejected.
   */
  accept(
    challengeId: string,
    member: NewInvite,
    isGlobal: boolean,
  ): Promise<Participant> {
    return this.transition(challengeId, member, isGlobal, 'accepted');
  }

  /** Transactionally move the caller into `declined` (creating the row if `global`). */
  decline(
    challengeId: string,
    member: NewInvite,
    isGlobal: boolean,
  ): Promise<Participant> {
    return this.transition(challengeId, member, isGlobal, 'declined');
  }

  private async transition(
    challengeId: string,
    member: NewInvite,
    isGlobal: boolean,
    target: Extract<InviteState, 'accepted' | 'declined'>,
  ): Promise<Participant> {
    const challengeRef = this.db.collection(CHALLENGES).doc(challengeId);
    const participantRef = this.ref(challengeId, member.userId);

    return this.db.runTransaction(async (tx) => {
      const [challengeSnap, participantSnap] = await Promise.all([
        tx.get(challengeRef),
        tx.get(participantRef),
      ]);
      if (!challengeSnap.exists) throw new NotFoundException('Challenge not found');

      const current = participantSnap.exists
        ? this.fromDoc(participantSnap as QueryDocumentSnapshot)
        : null;
      if (!current && !isGlobal) {
        throw new ForbiddenException('You were not invited to this challenge');
      }
      if (current?.inviteState === target) return current; // idempotent

      const now = new Date().toISOString();
      const next: Participant = {
        id: member.userId,
        challengeId,
        userId: member.userId,
        displayName: current?.displayName ?? member.displayName,
        inviteState: target,
        resultState: current?.resultState ?? 'pending',
        submittedResult: current?.submittedResult,
        rank: current?.rank,
        joinedAt: current?.joinedAt ?? now,
      };

      const { id: _id, ...doc } = next;
      tx.set(participantRef, doc);

      const countDelta =
        (target === 'accepted' ? 1 : 0) -
        (current?.inviteState === 'accepted' ? 1 : 0);
      if (countDelta !== 0) {
        tx.set(
          challengeRef,
          { participantCount: FieldValue.increment(countDelta) },
          { merge: true },
        );
      }
      return next;
    });
  }

  setInBatch(
    batch: WriteBatch,
    challengeId: string,
    userId: string,
    patch: Partial<{
      inviteState: Participant['inviteState'];
      resultState: Participant['resultState'];
      submittedResult: SubmittedResult;
      rank: number;
    }>,
  ): void {
    batch.set(this.ref(challengeId, userId), patch, { merge: true });
  }

  private fromDoc(snap: QueryDocumentSnapshot<DocumentData>): Participant {
    const data = snap.data();
    return {
      id: snap.id,
      challengeId: data.challengeId,
      userId: data.userId ?? snap.id,
      displayName: data.displayName,
      inviteState: data.inviteState,
      resultState: data.resultState,
      submittedResult: data.submittedResult,
      rank: data.rank,
      joinedAt: data.joinedAt,
    };
  }
}
