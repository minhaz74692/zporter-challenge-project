import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { Badge, InviteState, Participant, UserSummary } from '@zporter/shared';
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.constants.js';
import { participantFromDoc } from './participant.mapper.js';

const CHALLENGES = 'challenges';
const SUBCOLLECTION = 'participants';

/** Firestore raises gRPC code 9 (FAILED_PRECONDITION) when an index is absent or building. */
function isMissingIndex(err: unknown): boolean {
  const e = err as { code?: number; message?: string };
  return e?.code === 9 || /requires an index|index.*not ready/i.test(e?.message ?? '');
}

/** The user fields denormalised onto every participant row. */
function denormalisedUser(user: UserSummary) {
  return {
    userId: user.id,
    displayName: user.displayName,
    handle: user.handle,
    avatarUrl: user.avatarUrl,
    club: user.club,
    position: user.position,
  };
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
    return snap.exists ? participantFromDoc(snap) : null;
  }

  /** Stamp the controller's verdict onto an already-submitted result. */
  async setResultVerification(
    challengeId: string,
    userId: string,
    verified: boolean,
  ): Promise<void> {
    await this.col(challengeId).doc(userId).update({
      'submittedResult.verified': verified,
      'submittedResult.verifiedAt': new Date().toISOString(),
    });
  }

  /**
   * Grant a recognition badge to a participant (denormalised id + name + icon).
   * Called once, after a result is approved — the service guards against
   * re-awarding.
   */
  async awardBadge(
    challengeId: string,
    userId: string,
    badge: Badge,
  ): Promise<void> {
    await this.col(challengeId).doc(userId).update({ awardedBadge: badge });
  }

  async listByChallenge(challengeId: string): Promise<Participant[]> {
    const snap = await this.col(challengeId).get();
    return snap.docs.map(participantFromDoc);
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
      return snap.docs.map(participantFromDoc);
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
   * Adds `invited` rows for users who do not already have one. Returns the
   * subset that was actually written (so the caller can notify them).
   */
  async addInvites(challengeId: string, invites: UserSummary[]): Promise<UserSummary[]> {
    if (invites.length === 0) return [];
    const existing = await this.listByChallenge(challengeId);
    const known = new Set(existing.map((p) => p.userId));
    const fresh = invites.filter((i) => !known.has(i.id));
    if (fresh.length === 0) return [];

    const now = new Date().toISOString();
    const batch = this.db.batch();
    for (const user of fresh) {
      batch.set(this.col(challengeId).doc(user.id), {
        challengeId,
        ...denormalisedUser(user),
        inviteState: 'invited',
        resultState: 'pending',
        joinedAt: now,
      });
    }
    await batch.commit();
    return fresh;
  }

  /**
   * Transactionally move the caller into `accepted` and keep `participantCount`
   * in step. Re-accepting is a no-op. For a public challenge a missing row is
   * created; for an invited one it is rejected.
   */
  accept(
    challengeId: string,
    member: UserSummary,
    isPublic: boolean,
  ): Promise<Participant> {
    return this.transition(challengeId, member, isPublic, 'accepted');
  }

  /** Transactionally move the caller into `declined` (creating the row if public). */
  decline(
    challengeId: string,
    member: UserSummary,
    isPublic: boolean,
  ): Promise<Participant> {
    return this.transition(challengeId, member, isPublic, 'declined');
  }

  private async transition(
    challengeId: string,
    member: UserSummary,
    isPublic: boolean,
    target: Extract<InviteState, 'accepted' | 'declined'>,
  ): Promise<Participant> {
    const challengeRef = this.db.collection(CHALLENGES).doc(challengeId);
    const participantRef = this.ref(challengeId, member.id);

    return this.db.runTransaction(async (tx) => {
      const [challengeSnap, participantSnap] = await Promise.all([
        tx.get(challengeRef),
        tx.get(participantRef),
      ]);
      if (!challengeSnap.exists) throw new NotFoundException('Challenge not found');

      const current = participantSnap.exists ? participantFromDoc(participantSnap) : null;
      if (!current && !isPublic) {
        throw new ForbiddenException('You were not invited to this challenge');
      }
      if (current?.inviteState === target) return current; // idempotent

      const now = new Date().toISOString();
      const next: Participant = {
        id: member.id,
        challengeId,
        ...denormalisedUser(member),
        // keep the row's own denormalised name if it already had one
        displayName: current?.displayName ?? member.displayName,
        inviteState: target,
        resultState: current?.resultState ?? 'pending',
        submittedResult: current?.submittedResult,
        rank: current?.rank,
        joinedAt: current?.joinedAt ?? now,
        respondedAt: now,
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
}
