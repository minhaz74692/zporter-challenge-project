import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Documentation-only shapes for the Swagger response schema. */
class PublicUserDto {
  @ApiProperty({ type: String }) id!: string;
  @ApiProperty({ type: String }) email!: string;
  @ApiProperty({ type: String }) displayName!: string;
  @ApiProperty({ type: String, enum: ['player', 'coach', 'admin'] }) role!: string;
  @ApiProperty({ type: String, example: '#NeoJon041872' }) handle!: string;
  @ApiPropertyOptional({ type: String }) avatarUrl?: string;
  @ApiPropertyOptional({ type: String }) country?: string;
  @ApiPropertyOptional({ type: String }) city?: string;
  @ApiPropertyOptional({ type: String }) club?: string;
  @ApiPropertyOptional({ type: String, example: 'FW' }) position?: string;
  @ApiProperty({ type: String, format: 'date-time' }) createdAt!: string;
}

export class AuthResponseDto {
  @ApiProperty({ type: PublicUserDto }) user!: PublicUserDto;
  @ApiProperty({ type: String }) accessToken!: string;
  @ApiProperty({ type: String, description: '`<userId>.<sessionId>.<secret>`' })
  refreshToken!: string;
}
