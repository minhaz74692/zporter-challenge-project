import { ApiProperty } from '@nestjs/swagger';
import type { FeedTab } from '@zporter/shared';
import { IsIn, IsOptional } from 'class-validator';

const TABS: FeedTab[] = ['team', 'yours', 'saved'];

export class ListFeedQuery {
  @ApiProperty({ enum: TABS, required: false, default: 'yours' })
  @IsOptional()
  @IsIn(TABS)
  tab: FeedTab = 'yours';
}
