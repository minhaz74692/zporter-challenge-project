import { Module } from '@nestjs/common';
import { NotificationsModule } from '../notifications/notifications.module.js';
import { ParticipantsModule } from '../participants/participants.module.js';
import { ResultsModule } from '../results/results.module.js';
import { TeamsModule } from '../teams/teams.module.js';
import { TemplatesModule } from '../templates/templates.module.js';
import { UsersModule } from '../users/users.module.js';
import { ChallengesController } from './challenges.controller.js';
import { ChallengesRepository } from './challenges.repository.js';
import { ChallengesService } from './challenges.service.js';

@Module({
  imports: [
    ParticipantsModule,
    ResultsModule,
    NotificationsModule,
    TemplatesModule,
    TeamsModule,
    UsersModule,
  ],
  controllers: [ChallengesController],
  providers: [ChallengesService, ChallengesRepository],
  exports: [ChallengesService, ChallengesRepository],
})
export class ChallengesModule {}
