import type { Participant } from '@zporter/shared';
import type { DocumentData, DocumentSnapshot } from 'firebase-admin/firestore';

/** `challenges/{id}/participants/{userId}` document → domain {@link Participant}. */
export function participantFromDoc(snap: DocumentSnapshot<DocumentData>): Participant {
  const data = snap.data() ?? {};
  return {
    id: snap.id,
    challengeId: data.challengeId,
    userId: data.userId ?? snap.id,
    displayName: data.displayName,
    handle: data.handle,
    avatarUrl: data.avatarUrl,
    club: data.club,
    position: data.position,
    inviteState: data.inviteState,
    resultState: data.resultState,
    submittedResult: data.submittedResult,
    rank: data.rank,
    awardedBadge: data.awardedBadge,
    joinedAt: data.joinedAt,
    respondedAt: data.respondedAt,
  };
}
