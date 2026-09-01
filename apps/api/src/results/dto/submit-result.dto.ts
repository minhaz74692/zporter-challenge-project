import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { SubmitResultRequest } from '@zporter/shared';
import {
  IsBoolean,
  IsDefined,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class SubmitResultDto implements SubmitResultRequest {
  @ApiProperty({
    description: 'count/time → number, boolean → true|false. Validated per the challenge resultType.',
  })
  @IsDefined()
  value!: number | boolean | string;

  // Required in practice, but validated in the service so the client gets the
  // exact Figma copy ("Video must be added to report Challenge").
  @ApiProperty({ description: 'Video documentation URL — required.' })
  @IsOptional()
  @IsString()
  videoUrl!: string;

  @ApiProperty({ format: 'date-time', description: 'When the attempt was performed.' })
  @IsISO8601()
  performedAt!: string;

  @ApiPropertyOptional({ description: 'Venue / arena free text.' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  arena?: string;

  @ApiProperty({ description: 'Handle of the witness verifying the result — required.' })
  @IsOptional()
  @IsString()
  controllerRef!: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @ApiPropertyOptional({
    description:
      '"Share to my feed" concept toggle — persisted, but no feed pipeline in this slice.',
  })
  @IsOptional()
  @IsBoolean()
  shareToFeed?: boolean;
}
