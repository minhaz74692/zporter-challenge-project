import { ApiProperty } from '@nestjs/swagger';
import type { MediaItem, MediaKind, SetMediaRequest } from '@zporter/shared';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

const MEDIA_KINDS: MediaKind[] = ['image', 'video', 'youtube'];

export class MediaItemDto implements MediaItem {
  @ApiProperty()
  @IsString()
  url!: string;

  @ApiProperty({ enum: MEDIA_KINDS })
  @IsIn(MEDIA_KINDS)
  type!: MediaKind;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;
}

export class SetMediaDto implements SetMediaRequest {
  @ApiProperty({ type: [MediaItemDto] })
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => MediaItemDto)
  items!: MediaItemDto[];
}
