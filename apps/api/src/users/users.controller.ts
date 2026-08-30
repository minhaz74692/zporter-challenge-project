import {
  Controller,
  Delete,
  HttpCode,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import type { User } from '@zporter/shared';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { parseImageUpload } from '../storage/image-upload.pipe.js';
import { UsersService } from './users.service.js';

@ApiTags('users')
@ApiBearerAuth('access-token')
@Controller('users')
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** Upload / replace the current user's avatar (JPEG/PNG/WebP, ≤5 MB). */
  @Post('me/avatar')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } },
  })
  setAvatar(
    @UploadedFile(parseImageUpload) file: Express.Multer.File,
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
