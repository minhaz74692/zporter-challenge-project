import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { BadgesModule } from './badges/badges.module.js';
import { ChallengesModule } from './challenges/challenges.module.js';
import { CommonModule } from './common/common.module.js';
import { ConfigModule } from './config/config.module.js';
import { FirebaseModule } from './firebase/firebase.module.js';
import { HealthModule } from './health/health.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { ParticipantsModule } from './participants/participants.module.js';
import { ResultsModule } from './results/results.module.js';
import { StorageModule } from './storage/storage.module.js';
import { TeamsModule } from './teams/teams.module.js';
import { TemplatesModule } from './templates/templates.module.js';
import { UsersModule } from './users/users.module.js';

@Module({
  imports: [
    ConfigModule,
    CommonModule,
    FirebaseModule,
    StorageModule,
    HealthModule,
    UsersModule,
    AuthModule,
    TemplatesModule,
    TeamsModule,
    ParticipantsModule,
    ResultsModule,
    NotificationsModule,
    BadgesModule,
    ChallengesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
