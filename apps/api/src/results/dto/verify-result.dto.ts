import { ApiProperty } from '@nestjs/swagger';
import type { VerifyResultRequest } from '@zporter/shared';
import { IsBoolean } from 'class-validator';

export class VerifyResultDto implements VerifyResultRequest {
  @ApiProperty({ description: 'true = approve the result, false = reject it.' })
  @IsBoolean()
  approved!: boolean;
}
