import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type {
  Challenge,
  ChallengeDetail,
  LeaderboardEntry,
  Participant,
} from '@zporter/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { ChallengesService } from './challenges.service.js';
import { CreateChallengeDto } from './dto/create-challenge.dto.js';
import { InviteDto } from './dto/invite.dto.js';
import { ListChallengesQuery } from './dto/list-challenges.query.js';

@ApiTags('challenges')
@ApiBearerAuth('access-token')
@Controller('challenges')
export class ChallengesController {
  constructor(private readonly challenges: ChallengesService) {}

  /** The caller's challenges for one player tab. */
  @Get()
  list(
    @Query() query: ListChallengesQuery,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Challenge[]> {
    return this.challenges.listByCategory(user.userId, query.category);
  }

  @Get(':id')
  detail(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ChallengeDetail> {
    return this.challenges.getDetail(id, user);
  }

  @Get(':id/participants')
  participants(@Param('id') id: string): Promise<Participant[]> {
    return this.challenges.listParticipants(id);
  }

  @Get(':id/leaderboard')
  leaderboard(@Param('id') id: string): Promise<LeaderboardEntry[]> {
    return this.challenges.leaderboard(id);
  }

  @Post()
  @Roles('coach', 'admin')
  create(
    @Body() dto: CreateChallengeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Challenge> {
    return this.challenges.create(dto, user);
  }

  @Post(':id/accept')
  @HttpCode(200)
  accept(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Participant> {
    return this.challenges.accept(id, user);
  }

  @Post(':id/decline')
  @HttpCode(200)
  decline(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Participant> {
    return this.challenges.decline(id, user);
  }

  @Post(':id/invite')
  @Roles('coach', 'admin')
  invite(
    @Param('id') id: string,
    @Body() dto: InviteDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<{ invited: number }> {
    return this.challenges.invite(id, dto, user);
  }
}
