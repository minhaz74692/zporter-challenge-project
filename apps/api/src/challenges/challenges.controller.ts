import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { parseImageUpload, type MulterFile } from '../storage/image-upload.pipe.js';
import type {
  Challenge,
  ChallengeDetail,
  LeaderboardEntry,
  Participant,
} from '@zporter/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { SubmitResultDto } from '../results/dto/submit-result.dto.js';
import { ChallengesService } from './challenges.service.js';
import { CreateChallengeDto } from './dto/create-challenge.dto.js';
import { UpdateChallengeDto } from './dto/update-challenge.dto.js';
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

  /** Challenges the caller created (Figma "Yours" tab). Declared before `:id`. */
  @Get('mine')
  @Roles('coach', 'admin')
  mine(@CurrentUser() user: AuthenticatedUser): Promise<Challenge[]> {
    return this.challenges.listMine(user.userId);
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

  /** Edit a challenge (owner or admin). */
  @Patch(':id')
  @Roles('coach', 'admin')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateChallengeDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Challenge> {
    return this.challenges.update(id, dto, user);
  }

  /** Delete a challenge (owner or admin). */
  @Delete(':id')
  @Roles('coach', 'admin')
  @HttpCode(204)
  remove(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.challenges.remove(id, user);
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

  @Post(':id/results')
  @HttpCode(200)
  submitResult(
    @Param('id') id: string,
    @Body() dto: SubmitResultDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Participant> {
    return this.challenges.submitResult(id, user, dto);
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

  /** Upload / replace the cover image (owner only; JPEG/PNG/WebP, ≤5 MB). */
  @Post(':id/cover')
  @Roles('coach', 'admin')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  setCover(
    @Param('id') id: string,
    @UploadedFile(parseImageUpload) file: MulterFile,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<Challenge> {
    return this.challenges.setCover(id, user, file);
  }
}
