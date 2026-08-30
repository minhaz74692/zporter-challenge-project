import type { Challenge, Participant, UserSummary } from '@zporter/shared';

/** Shared unit-test fixtures. Not a spec — never run directly. */

export const FUTURE = '2099-01-01T00:00:00.000Z';
export const PAST = '2020-01-01T00:00:00.000Z';

export function makeChallenge(over: Partial<Challenge> = {}): Challenge {
  return {
    id: 'c1',
    title: 'C',
    description: 'd',
    mainCategory: 'technical',
    collections: [],
    equipmentTags: [],
    resultType: 'count',
    resultUnit: 'reps',
    scoringDirection: 'higher_better',
    durationMinutes: 20,
    location: 'anywhere',
    startAt: PAST,
    deadline: FUTURE,
    status: 'active',
    visibility: 'private',
    pointsToParticipate: 0,
    rewardPoints: 0,
    minParticipants: 1,
    createdBy: 'coach1',
    participantCount: 0,
    likeCount: 0,
    commentCount: 0,
    createdAt: PAST,
    ...over,
  };
}

export function makeUserSummary(over: Partial<UserSummary> = {}): UserSummary {
  return {
    id: 'player1',
    displayName: 'Priya Nair',
    handle: '#PriNai900003',
    avatarUrl: 'https://example.test/a.png',
    club: 'Maj FC',
    position: 'FW',
    ...over,
  };
}

export function makeParticipant(over: Partial<Participant> = {}): Participant {
  return {
    id: 'player1',
    challengeId: 'c1',
    userId: 'player1',
    displayName: 'Priya Nair',
    handle: '#PriNai900003',
    inviteState: 'invited',
    resultState: 'pending',
    joinedAt: PAST,
    ...over,
  };
}
