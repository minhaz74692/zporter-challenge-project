import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type {
  ChallengeLocation,
  ChallengeMainCategory,
  CreateTemplateRequest,
  ResultType,
  ResultUnit,
  ScoringDirection,
} from '@zporter/shared';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const RESULT_TYPES: ResultType[] = ['count', 'time', 'boolean', 'score', 'text', 'proof'];
const RESULT_UNITS: ResultUnit[] = ['reps', 'count', 'seconds', 'kg', 'meters', 'points', 'boolean'];
const SCORING_DIRECTIONS: ScoringDirection[] = ['higher_better', 'lower_better'];
const MAIN_CATEGORIES: ChallengeMainCategory[] = [
  'physical',
  'technical',
  'tactical',
  'mental',
  'rehab',
  'other',
];
const LOCATIONS: ChallengeLocation[] = ['anywhere', 'field', 'gym', 'court', 'home'];

export class CreateTemplateDto implements CreateTemplateRequest {
  @ApiProperty({ maxLength: 120, example: 'Keepie-Uppies Century' })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ingress?: string;

  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description!: string;

  @ApiProperty({ maxLength: 2000 })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  rules!: string;

  @ApiProperty({ enum: MAIN_CATEGORIES })
  @IsIn(MAIN_CATEGORIES)
  mainCategory!: ChallengeMainCategory;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  collections?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  equipmentTags?: string[];

  @ApiProperty({ enum: RESULT_TYPES })
  @IsIn(RESULT_TYPES)
  resultType!: ResultType;

  @ApiProperty({ enum: RESULT_UNITS })
  @IsIn(RESULT_UNITS)
  resultUnit!: ResultUnit;

  @ApiProperty({ enum: SCORING_DIRECTIONS })
  @IsIn(SCORING_DIRECTIONS)
  scoringDirection!: ScoringDirection;

  @ApiPropertyOptional({ minimum: 1, default: 20 })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @ApiPropertyOptional({ enum: LOCATIONS, default: 'anywhere' })
  @IsOptional()
  @IsIn(LOCATIONS)
  location?: ChallengeLocation;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  pointsToParticipate?: number;

  @ApiPropertyOptional({ minimum: 0, default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  rewardPoints?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  defaultRewardBadgeId?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
