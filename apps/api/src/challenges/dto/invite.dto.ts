import { ApiPropertyOptional } from '@nestjs/swagger';
import type { InviteRequest } from '@zporter/shared';
import { ArrayNotEmpty, IsArray, IsOptional, IsString } from 'class-validator';

/** At least one of `userIds` / `teamId` must be present (checked in the service). */
export class InviteDto implements InviteRequest {
  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  userIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  teamId?: string;
}
