import { ConflictException } from '@nestjs/common';
import type { Challenge, Participant } from '@zporter/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParticipantsRepository } from './participants.repository.js';
import { ParticipantsService } from './participants.service.js';

function challenge(over: Partial<Challenge> = {}): Challenge {
  return {
    id: 'c1',
    title: 'C',
    description: 'd',
    category: 'Cat',
    resultType: 'count',
    scoringDirection: 'higher_better',
    rules: 'r',
    reward: { label: 'done' },
    startAt: '2026-01-01T00:00:00.000Z',
    deadline: '2099-01-01T00:00:00.000Z',
    status: 'active',
    visibility: 'invited',
    createdBy: 'coach1',
    participantCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

const member = { userId: 'player1', displayName: 'Priya' };
const accepted: Participant = {
  id: 'player1',
  challengeId: 'c1',
  userId: 'player1',
  displayName: 'Priya',
  inviteState: 'accepted',
  resultState: 'pending',
  joinedAt: '2026-01-01T00:00:00.000Z',
};

describe('ParticipantsService', () => {
  let repo: { accept: ReturnType<typeof vi.fn>; decline: ReturnType<typeof vi.fn> };
  let service: ParticipantsService;

  beforeEach(() => {
    repo = { accept: vi.fn().mockResolvedValue(accepted), decline: vi.fn().mockResolvedValue(accepted) };
    service = new ParticipantsService(repo as unknown as ParticipantsRepository);
  });

  it('accept delegates with isGlobal=false for an invited challenge', async () => {
    await service.accept(challenge(), member);
    expect(repo.accept).toHaveBeenCalledWith('c1', member, false);
  });

  it('accept delegates with isGlobal=true for a global challenge', async () => {
    await service.accept(challenge({ visibility: 'global' }), member);
    expect(repo.accept).toHaveBeenCalledWith('c1', member, true);
  });

  it('decline delegates to the repository', async () => {
    await service.decline(challenge(), member);
    expect(repo.decline).toHaveBeenCalledWith('c1', member, false);
  });

  it('rejects accept / decline on an ended challenge', async () => {
    const ended = challenge({ status: 'ended' });
    await expect(service.accept(ended, member)).rejects.toBeInstanceOf(ConflictException);
    await expect(service.decline(ended, member)).rejects.toBeInstanceOf(ConflictException);
    expect(repo.accept).not.toHaveBeenCalled();
  });
});
