import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiQuery, ApiTags } from '@nestjs/swagger';
import type { User, UserSummary } from '@zporter/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Roles } from '../auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { parseImageUpload, type MulterFile } from '../storage/image-upload.pipe.js';
import { UsersService } from './users.service.js';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** Invite-picker search (creator flow). Empty query returns a first page. */
  @Get()
  @Roles('coach', 'admin')
  @ApiQuery({ name: 'query', required: false })
  search(@Query('query') query = ''): Promise<UserSummary[]> {
    return this.users.searchSummaries(query);
  }

  /**
   * The caller's club-mates (any authenticated user). The player app uses this
   * to pick a result controller — "your coach or your friend".
   */
  @Get('teammates')
  teammates(@CurrentUser() user: AuthenticatedUser): Promise<UserSummary[]> {
    return this.users.teammates(user.userId);
  }

  /** Upload / replace the current user's avatar (JPEG/PNG/WebP, ≤5 MB). */
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  setAvatar(
    @UploadedFile(parseImageUpload) file: MulterFile,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<User> {
    return this.users.setAvatar(user.userId, file);
  }

  @Delete('me/avatar')
  @HttpCode(200)
  clearAvatar(@CurrentUser() user: AuthenticatedUser): Promise<User> {
    return this.users.clearAvatar(user.userId);
  }
}
