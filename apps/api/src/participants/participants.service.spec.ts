import { ConflictException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeChallenge, makeParticipant, makeUserSummary } from '../testing/fixtures.js';
import type { ParticipantsRepository } from './participants.repository.js';
import { ParticipantsService } from './participants.service.js';

const member = makeUserSummary();
const accepted = makeParticipant({ inviteState: 'accepted' });

describe('ParticipantsService', () => {
  let repo: { accept: ReturnType<typeof vi.fn>; decline: ReturnType<typeof vi.fn> };
  let service: ParticipantsService;

  beforeEach(() => {
    repo = { accept: vi.fn().mockResolvedValue(accepted), decline: vi.fn().mockResolvedValue(accepted) };
    service = new ParticipantsService(repo as unknown as ParticipantsRepository);
  });

  it('accept delegates with isPublic=false for a private challenge', async () => {
    await service.accept(makeChallenge(), member);
    expect(repo.accept).toHaveBeenCalledWith('c1', member, false);
  });

  it('accept delegates with isPublic=true for an `all` challenge', async () => {
    await service.accept(makeChallenge({ visibility: 'all' }), member);
    expect(repo.accept).toHaveBeenCalledWith('c1', member, true);
  });

  it('decline delegates to the repository', async () => {
    await service.decline(makeChallenge(), member);
    expect(repo.decline).toHaveBeenCalledWith('c1', member, false);
  });

  it('rejects accept / decline on an ended challenge', async () => {
    const ended = makeChallenge({ status: 'ended' });
    await expect(service.accept(ended, member)).rejects.toBeInstanceOf(ConflictException);
    await expect(service.decline(ended, member)).rejects.toBeInstanceOf(ConflictException);
    expect(repo.accept).not.toHaveBeenCalled();
  });
});
