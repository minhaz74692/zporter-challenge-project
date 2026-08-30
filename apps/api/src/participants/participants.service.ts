import { ConflictException, Injectable } from '@nestjs/common';
import type { Challenge, Participant } from '@zporter/shared';
import { ParticipantsRepository } from './participants.repository.js';

export interface JoiningMember {
  userId: string;
  displayName: string;
}

/**
 * Owns the participant invite-state machine (`invited → accepted | declined`).
 * The caller (`ChallengesService`) passes the already-loaded challenge — with
 * its status already lazily computed — so this service never re-reads it and
 * stays free of a dependency on the challenges module.
 */
@Injectable()
export class ParticipantsService {
  constructor(private readonly repo: ParticipantsRepository) {}

  async accept(challenge: Challenge, member: JoiningMember): Promise<Participant> {
    this.assertOpen(challenge);
    return this.repo.accept(challenge.id, member, challenge.visibility === 'global');
  }

  async decline(challenge: Challenge, member: JoiningMember): Promise<Participant> {
    this.assertOpen(challenge);
    return this.repo.decline(challenge.id, member, challenge.visibility === 'global');
  }

  listForChallenge(challengeId: string): Promise<Participant[]> {
    return this.repo.listByChallenge(challengeId);
  }

  private assertOpen(challenge: Challenge): void {
    if (challenge.status === 'ended') {
      throw new ConflictException('This challenge has ended');
    }
  }
}
