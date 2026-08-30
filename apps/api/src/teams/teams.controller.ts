import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Team, TeamMember } from '@zporter/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { TeamsService } from './teams.service.js';

@ApiTags('teams')
@ApiBearerAuth('access-token')
@Controller('teams')
@Roles('coach', 'admin')
export class TeamsController {
  constructor(private readonly teams: TeamsService) {}

  /** The caller's squads — for the "invite team" picker. */
  @Get()
  list(@CurrentUser() user: AuthenticatedUser): Promise<Team[]> {
    return this.teams.listForCoach(user.userId);
  }

  @Get(':id/members')
  members(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<TeamMember[]> {
    return this.teams.listMembers(id, user.userId);
  }
}
