import { Module } from '@nestjs/common';
import { TeamsModule } from '../teams/teams.module.js';
import { FeedController } from './feed.controller.js';
import { FeedRepository } from './feed.repository.js';
import { FeedService } from './feed.service.js';

/**
 * The activity feed. `FeedService` is exported so `ChallengesModule` can post
 * to the feed when a challenge is launched or a result is shared.
 */
@Module({
  imports: [TeamsModule],
  controllers: [FeedController],
  providers: [FeedService, FeedRepository],
  exports: [FeedService],
})
export class FeedModule {}
