import { ApiProperty } from '@nestjs/swagger';
import type { DevicePlatform, RegisterDeviceRequest } from '@zporter/shared';
import { IsIn, IsNotEmpty, IsString } from 'class-validator';

const PLATFORMS: DevicePlatform[] = ['ios', 'android', 'web'];

export class RegisterDeviceDto implements RegisterDeviceRequest {
  @ApiProperty({ description: 'FCM registration token from the client SDK.' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ enum: PLATFORMS })
  @IsIn(PLATFORMS)
  platform!: DevicePlatform;
}
