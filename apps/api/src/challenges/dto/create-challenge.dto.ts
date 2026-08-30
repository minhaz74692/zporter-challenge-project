import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import type {
  ChallengeReward,
  ChallengeVisibility,
  CreateChallengeRequest,
  ResultType,
  ScoringDirection,
} from '@zporter/shared';
import {
  IsArray,
  IsIn,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

const RESULT_TYPES: ResultType[] = ['count', 'time', 'boolean', 'score', 'text', 'proof'];
const SCORING: ScoringDirection[] = ['higher_better', 'lower_better'];
const VISIBILITY: ChallengeVisibility[] = ['invited', 'global'];

class ChallengeRewardDto implements ChallengeReward {
  @ApiProperty({ example: 'Sharp Shooter badge' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  label!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  badgeId?: string;
}

/**
 * Content fields are optional: when `templateId` is set they fall back to the
 * template (merged server-side). `startAt` / `deadline` are always required —
 * templates carry no dates.
 */
export class CreateChallengeDto implements CreateChallengeRequest {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  templateId?: string;

  @ApiPropertyOptional({ maxLength: 120 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title?: string;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ maxLength: 60 })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  category?: string;

  @ApiPropertyOptional({ enum: RESULT_TYPES })
  @IsOptional()
  @IsIn(RESULT_TYPES)
  resultType?: ResultType;

  @ApiPropertyOptional({ enum: SCORING })
  @IsOptional()
  @IsIn(SCORING)
  scoringDirection?: ScoringDirection;

  @ApiPropertyOptional({ maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  rules?: string;

  @ApiPropertyOptional({ type: ChallengeRewardDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => ChallengeRewardDto)
  reward?: ChallengeRewardDto;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  startAt!: string;

  @ApiProperty({ format: 'date-time' })
  @IsISO8601()
  deadline!: string;

  @ApiPropertyOptional({ enum: VISIBILITY, default: 'invited' })
  @IsOptional()
  @IsIn(VISIBILITY)
  visibility?: ChallengeVisibility;

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
