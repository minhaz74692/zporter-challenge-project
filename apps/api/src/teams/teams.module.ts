import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { TeamsController } from './teams.controller.js';
import { TeamsRepository } from './teams.repository.js';
import { TeamsService } from './teams.service.js';

@Module({
  imports: [UsersModule],
  controllers: [TeamsController],
  providers: [TeamsService, TeamsRepository],
  exports: [TeamsService],
})
export class TeamsModule {}
