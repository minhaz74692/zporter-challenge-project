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
      const [challengeSnap, rosterSnap, submitterSnap] = await Promise.all([
        tx.get(challengeRef),
        tx.get(participantsCol),
        tx.get(participantsCol.doc(submitterId)),
      ]);
      if (!challengeSnap.exists) throw new NotFoundException('Challenge not found');
      if (!submitterSnap.exists) {
        throw new ForbiddenException('You are not a participant in this challenge');
      }

      const submitter = participantFromDoc(submitterSnap);
      if (submitter.inviteState !== 'accepted') {
        throw new ConflictException('Accept the challenge before submitting a result');
      }

      const updatedSubmitter: Participant = {
        ...submitter,
        submittedResult: submission,
        resultState,
      };

      const roster = rosterSnap.docs
        .map(participantFromDoc)
        .filter((p) => p.userId !== submitterId);
      roster.push(updatedSubmitter);

      const ranked = rank(
        roster
          .filter((p) => p.submittedResult != null)
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

      tx.set(
        participantsCol.doc(submitterId),
        {
          submittedResult: submission,
          resultState,
          rank: rankByUser.get(submitterId) ?? null,
        },
        { merge: true },
      );
      for (const entry of ranked) {
        tx.set(leaderboardCol.doc(entry.userId), { ...entry, updatedAt: now });
        if (entry.userId !== submitterId) {
          tx.set(participantsCol.doc(entry.userId), { rank: entry.rank }, { merge: true });
        }
      }

      return { ...updatedSubmitter, rank: rankByUser.get(submitterId) };
    });
  }
}
