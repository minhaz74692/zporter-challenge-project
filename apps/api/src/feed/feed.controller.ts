import { Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { FeedLikeResult, FeedPost, FeedSaveResult } from '@zporter/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { ListFeedQuery } from './dto/list-feed.query.js';
import { FeedService } from './feed.service.js';

@ApiTags('feed')
@ApiBearerAuth('access-token')
@Controller('feed')
export class FeedController {
  constructor(private readonly feed: FeedService) {}

  /** One feed tab (`team` / `yours` / `saved`), newest first. */
  @Get()
  list(
    @Query() query: ListFeedQuery,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<FeedPost[]> {
    return this.feed.list(query.tab, user.userId);
  }

  @Post(':id/like')
  like(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<FeedLikeResult> {
    return this.feed.like(id, user.userId);
  }

  @Delete(':id/like')
  unlike(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<FeedLikeResult> {
    return this.feed.unlike(id, user.userId);
  }

  @Post(':id/save')
  save(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<FeedSaveResult> {
    return this.feed.save(id, user.userId);
  }

  @Delete(':id/save')
  unsave(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<FeedSaveResult> {
    return this.feed.unsave(id, user.userId);
  }
}
