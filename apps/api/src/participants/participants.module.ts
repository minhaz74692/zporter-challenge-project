import { Module } from '@nestjs/common';
import { ParticipantsRepository } from './participants.repository.js';
import { ParticipantsService } from './participants.service.js';

/**
 * The accept/decline routes live on `ChallengesController` (they are
 * `POST /challenges/:id/accept`), so this module exposes no controller of its
 * own — it exports the service + repository for `challenges` and (later)
 * `results` to compose.
 */
@Module({
  providers: [ParticipantsRepository, ParticipantsService],
  exports: [ParticipantsRepository, ParticipantsService],
})
export class ParticipantsModule {}
