import { ApiProperty } from '@nestjs/swagger';
import type { AuthResponse, User, UserRole } from '@zporter/shared';

class PublicUserDto implements User {
  @ApiProperty() id!: string;
  @ApiProperty() email!: string;
  @ApiProperty() displayName!: string;
  @ApiProperty({ enum: ['player', 'coach', 'admin'] }) role!: UserRole;
  @ApiProperty({ format: 'date-time' }) createdAt!: string;
}

/** Response body for signup / login / refresh. Documentation-only. */
export class AuthResponseDto implements AuthResponse {
  @ApiProperty({ type: PublicUserDto }) user!: User;
  @ApiProperty() accessToken!: string;
  @ApiProperty({ description: '`<userId>.<sessionId>.<secret>`' }) refreshToken!: string;
}
