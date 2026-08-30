import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { ChallengeTemplate } from '@zporter/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { CreateTemplateDto } from './dto/create-template.dto.js';
import { ListTemplatesQuery } from './dto/list-templates.query.js';
import { TemplatesService } from './templates.service.js';

@ApiTags('templates')
@ApiBearerAuth('access-token')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templates: TemplatesService) {}

  @Get()
  list(
    @Query() query: ListTemplatesQuery,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ChallengeTemplate[]> {
    return this.templates.list(user.userId, query.mine);
  }

  @Get(':id')
  get(@Param('id') id: string): Promise<ChallengeTemplate> {
    return this.templates.getById(id);
  }

  @Post()
  @Roles('coach', 'admin')
  create(
    @Body() dto: CreateTemplateDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ChallengeTemplate> {
    return this.templates.create(dto, user.userId);
  }
}
