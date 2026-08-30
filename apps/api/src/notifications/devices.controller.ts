import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { DevicesService } from './devices.service.js';
import { RegisterDeviceDto } from './dto/register-device.dto.js';

@ApiTags('devices')
@ApiBearerAuth('access-token')
@Controller('devices')
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  /** Register / refresh this device's FCM token for the current user. */
  @Post('fcm-token')
  @HttpCode(200)
  register(
    @Body() dto: RegisterDeviceDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.devices.register(user.userId, dto);
  }
}
