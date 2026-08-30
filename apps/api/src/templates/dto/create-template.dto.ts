import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  CreateTemplateRequest,
  ResultType,
  ScoringDirection,
} from '@zporter/shared';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const RESULT_TYPES: ResultType[] = ['count', 'time', 'boolean', 'score', 'text', 'proof'];
const SCORING_DIRECTIONS: ScoringDirection[] = ['higher_better', 'lower_better'];

export class CreateTemplateDto implements CreateTemplateRequest {
  @ApiProperty({ maxLength: 120, example: 'Keepie-Uppies Century' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description!: string;

  @ApiProperty({ maxLength: 60, example: 'Technique' })
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  category!: string;

  @ApiProperty({ enum: RESULT_TYPES })
  @IsIn(RESULT_TYPES)
  resultType!: ResultType;

  @ApiProperty({ enum: SCORING_DIRECTIONS })
  @IsIn(SCORING_DIRECTIONS)
  scoringDirection!: ScoringDirection;

  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  rules!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultRewardBadgeId?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
