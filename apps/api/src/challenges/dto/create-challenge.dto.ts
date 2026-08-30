import { ApiPropertyOptional } from '@nestjs/swagger';
import type {
  ChallengeLocation,
  ChallengeMainCategory,
  ChallengeVisibility,
  CreateChallengeRequest,
  ResultType,
  ResultUnit,
  ScoringDirection,
} from '@zporter/shared';
import {
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const RESULT_TYPES: ResultType[] = ['count', 'time', 'boolean', 'score', 'text', 'proof'];
const RESULT_UNITS: ResultUnit[] = ['reps', 'count', 'seconds', 'kg', 'meters', 'points', 'boolean'];
const SCORING: ScoringDirection[] = ['higher_better', 'lower_better'];
const VISIBILITY: ChallengeVisibility[] = ['private', 'friends', 'fans', 'all'];
const MAIN_CATEGORIES: ChallengeMainCategory[] = [
  'physical',
  'technical',
  'tactical',
  'mental',
  'rehab',
  'other',
];
const LOCATIONS: ChallengeLocation[] = ['anywhere', 'field', 'gym', 'court', 'home'];

/**
 * Content fields are optional: with `templateId` they fall back to the template
 * (merged server-side). `startAt` / `deadline` are always required.
 */
export class CreateChallengeDto implements CreateChallengeRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ maxLength: 40 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  title?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  ingress?: string;

  @ApiPropertyOptional({ maxLength: 4000 })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @ApiPropertyOptional({ enum: MAIN_CATEGORIES })
  @IsOptional()
  @IsIn(MAIN_CATEGORIES)
  mainCategory?: ChallengeMainCategory;

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

  @ApiPropertyOptional({ enum: RESULT_TYPES })
  @IsOptional()
  @IsIn(RESULT_TYPES)
  resultType?: ResultType;

  @ApiPropertyOptional({ enum: RESULT_UNITS })
  @IsOptional()
  @IsIn(RESULT_UNITS)
  resultUnit?: ResultUnit;

  @ApiPropertyOptional({ enum: SCORING })
  @IsOptional()
  @IsIn(SCORING)
  scoringDirection?: ScoringDirection;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMinutes?: number;

  @ApiPropertyOptional({ enum: LOCATIONS })
  @IsOptional()
  @IsIn(LOCATIONS)
  location?: ChallengeLocation;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsISO8601()
  startAt!: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsISO8601()
  deadline!: string;

  @ApiPropertyOptional({ enum: VISIBILITY, default: 'private' })
  @IsOptional()
  @IsIn(VISIBILITY)
  visibility?: ChallengeVisibility;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  pointsToParticipate?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  rewardPoints?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rewardBadgeId?: string;

  @ApiPropertyOptional({ minimum: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  minParticipants?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  ageFrom?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  ageTo?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  position?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mediaImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mediaVideoUrl?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  invitedUserIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invitedTeamId?: string;
}
