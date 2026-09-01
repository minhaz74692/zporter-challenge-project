import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Badge } from '@zporter/shared';
import { BadgesService } from './badges.service.js';

@ApiTags('badges')
@ApiBearerAuth('access-token')
@Controller('badges')
export class BadgesController {
  constructor(private readonly badges: BadgesService) {}

  /** All recognition badges — for showing what a challenge's reward looks like. */
  @Get()
  list(): Promise<Badge[]> {
    return this.badges.list();
  }

  @Get(':id')
  detail(@Param('id') id: string): Promise<Badge> {
    return this.badges.require(id);
  }
}
