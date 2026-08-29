import { ApiProperty } from '@nestjs/swagger';
import type { RefreshRequest } from '@zporter/shared';
import { IsString, MinLength } from 'class-validator';

export class RefreshDto implements RefreshRequest {
  @ApiProperty({ description: '`<userId>.<sessionId>.<secret>`' })
  @IsString()
  @MinLength(1)
  refreshToken!: string;
}
