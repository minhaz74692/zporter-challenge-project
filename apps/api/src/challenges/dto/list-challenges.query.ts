import { ApiProperty } from '@nestjs/swagger';
import type { ChallengeCategory } from '@zporter/shared';
import { IsIn } from 'class-validator';

const CATEGORIES: ChallengeCategory[] = ['new', 'active', 'done', 'declined', 'ended'];

export class ListChallengesQuery {
  @ApiProperty({ enum: CATEGORIES })
  @IsIn(CATEGORIES)
  category!: ChallengeCategory;
}
