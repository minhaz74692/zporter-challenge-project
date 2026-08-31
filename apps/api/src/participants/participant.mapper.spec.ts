import type { DocumentData, DocumentSnapshot } from 'firebase-admin/firestore';
import { describe, expect, it } from 'vitest';
import { participantFromDoc } from './participant.mapper.js';

function snap(id: string, data: DocumentData | undefined): DocumentSnapshot<DocumentData> {
  return { id, data: () => data } as unknown as DocumentSnapshot<DocumentData>;
}

describe('participantFromDoc', () => {
  it('maps a full document onto the domain Participant', () => {
    const p = participantFromDoc(
      snap('player1', {
        challengeId: 'c1',
        userId: 'player1',
        displayName: 'Priya Nair',
        handle: '#PriNai',
        avatarUrl: 'https://x/a.png',
        club: 'Maj FC',
        position: 'FW',
        inviteState: 'accepted',
        resultState: 'submitted',
        submittedResult: { value: 12, submittedAt: '2020-01-01T00:00:00.000Z' },
        rank: 2,
        joinedAt: '2020-01-01T00:00:00.000Z',
        respondedAt: '2020-01-02T00:00:00.000Z',
      }),
    );

    expect(p).toMatchObject({
      id: 'player1',
      challengeId: 'c1',
      userId: 'player1',
      inviteState: 'accepted',
      resultState: 'submitted',
      rank: 2,
      submittedResult: { value: 12 },
    });
  });

  it('falls back to the doc id for userId when the field is absent', () => {
    expect(participantFromDoc(snap('player9', { challengeId: 'c1' })).userId).toBe('player9');
  });

  it('tolerates a snapshot with no data', () => {
    const p = participantFromDoc(snap('player1', undefined));
    expect(p.id).toBe('player1');
    expect(p.userId).toBe('player1');
    expect(p.challengeId).toBeUndefined();
  });
});
