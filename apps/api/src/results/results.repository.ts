import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { Participant, ResultState, SubmittedResult } from '@zporter/shared';
import type { Firestore } from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.constants.js';
import { participantFromDoc } from '../participants/participant.mapper.js';
import type { RankInput } from './strategies/result-strategy.js';

export interface RankedEntry {
  userId: string;
  displayName: string;
  handle: string;
  avatarUrl?: string;
  club?: string;
  value: number;
  rank: number;
}

/** Turns the full set of submitted rows into a ranked leaderboard. */
export type Ranker = (entries: RankInput[]) => RankedEntry[];

/**
 * Owns the write side of result submission: the participant's `submittedResult`
 * + `resultState` and the recomputed `challenges/{id}/leaderboard`, all in one
 * transaction so a rank is never briefly wrong. (Leaderboard *reads* for the
 * detail preview live in `ChallengesRepository`.)
 *
 * The leaderboard ranks **verified results only** — a reported result earns a
 * board slot when its controller approves it, and loses it on rejection or on
 * being re-submitted. So both {@link submit} and {@link rebuildLeaderboard}
 * (called from the verify flow) run the same {@link writeLeaderboard} pass.
 */
@Injectable()
export class ResultsRepository {
  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {}

  async submit(
    challengeId: string,
    submitterId: string,
    submission: SubmittedResult,
    resultState: ResultState,
    rank: Ranker,
  ): Promise<Participant> {
    const challengeRef = this.db.collection('challenges').doc(challengeId);
    const participantsCol = challengeRef.collection('participants');
    const leaderboardCol = challengeRef.collection('leaderboard');

    return this.db.runTransaction(async (tx) => {
      const [challengeSnap, rosterSnap, submitterSnap, boardSnap] =
        await Promise.all([
          tx.get(challengeRef),
          tx.get(participantsCol),
          tx.get(participantsCol.doc(submitterId)),
          tx.get(leaderboardCol),
        ]);
      if (!challengeSnap.exists) throw new NotFoundException('Challenge not found');
      if (!submitterSnap.exists) {
        throw new ForbiddenException('You are not a participant in this challenge');
      }

      const submitter = participantFromDoc(submitterSnap);
      if (submitter.inviteState !== 'accepted') {
        throw new ConflictException('Accept the challenge before submitting a result');
      }

      // Store the reported result. `update` (not merge-set) replaces the whole
      // `submittedResult` map, so a re-submission drops any prior verdict.
      tx.update(participantsCol.doc(submitterId), {
        submittedResult: submission,
        resultState,
      });

      // The new result is unverified, so this recompute leaves the submitter
      // off the board (and removes them if a previously-verified result is being
      // replaced) until the controller approves it.
      const roster = rosterSnap.docs
        .map(participantFromDoc)
        .filter((p) => p.userId !== submitterId);
      roster.push({ ...submitter, submittedResult: submission, resultState });
      this.writeLeaderboard(
        tx,
        challengeRef,
        roster,
        boardSnap.docs.map((d) => d.id),
        rank,
      );

      return { ...submitter, submittedResult: submission, resultState, rank: undefined };
    });
  }

  /**
   * Rebuild `challenges/{id}/leaderboard` from the current roster — called after
   * a controller approves or rejects a result, so the board reflects only
   * verified results.
   */
  async rebuildLeaderboard(challengeId: string, rank: Ranker): Promise<void> {
    const challengeRef = this.db.collection('challenges').doc(challengeId);
    await this.db.runTransaction(async (tx) => {
      const [rosterSnap, boardSnap] = await Promise.all([
        tx.get(challengeRef.collection('participants')),
        tx.get(challengeRef.collection('leaderboard')),
      ]);
      this.writeLeaderboard(
        tx,
        challengeRef,
        rosterSnap.docs.map(participantFromDoc),
        boardSnap.docs.map((d) => d.id),
        rank,
      );
    });
  }

  /**
   * Buffer the leaderboard writes for `roster` onto `tx`: rank only the
   * participants whose result the controller has **verified**, upsert those
   * rows, delete rows that fell off (`existingBoardIds` not re-ranked), and sync
   * each participant's denormalised `rank` (their slot, or `null` when off).
   */
  private writeLeaderboard(
    tx: FirebaseFirestore.Transaction,
    challengeRef: FirebaseFirestore.DocumentReference,
    roster: Participant[],
    existingBoardIds: string[],
    rank: Ranker,
  ): void {
    const participantsCol = challengeRef.collection('participants');
    const leaderboardCol = challengeRef.collection('leaderboard');

    const ranked = rank(
      roster
        .filter((p) => p.submittedResult?.verified === true)
        .map((p) => ({
          userId: p.userId,
          displayName: p.displayName,
          handle: p.handle,
          avatarUrl: p.avatarUrl,
          club: p.club,
          value: p.submittedResult!.value,
        })),
    );
    const rankByUser = new Map(ranked.map((r) => [r.userId, r.rank]));
    const now = new Date().toISOString();

    for (const entry of ranked) {
      tx.set(leaderboardCol.doc(entry.userId), { ...entry, updatedAt: now });
    }
    for (const id of existingBoardIds) {
      if (!rankByUser.has(id)) tx.delete(leaderboardCol.doc(id));
    }
    for (const p of roster) {
      const next = rankByUser.get(p.userId) ?? null;
      if ((p.rank ?? null) !== next) {
        tx.set(participantsCol.doc(p.userId), { rank: next }, { merge: true });
      }
    }
  }
}
