import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { AuthResponse, User, UserRole } from '@zporter/shared';

class PublicUserDto implements User {
  @ApiProperty() id!: string;
  @ApiProperty() email!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ enum: ['player', 'coach', 'admin'] }) role!: UserRole;
  @ApiProperty({ example: '#NeoJon041872' }) handle!: string;
  @ApiPropertyOptional() avatarUrl?: string;
  @ApiPropertyOptional() country?: string;
  @ApiPropertyOptional() city?: string;
  @ApiPropertyOptional() club?: string;
  @ApiPropertyOptional({ example: 'FW' }) position?: string;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
}

/** Response body for signup / login / refresh. Documentation-only. */
export class AuthResponseDto implements AuthResponse {
  @ApiProperty({ type: PublicUserDto }) user!: User;
  @ApiProperty() accessToken!: string;
  @ApiProperty({ description: '`<userId>.<sessionId>.<secret>`' }) refreshToken!: string;
}
