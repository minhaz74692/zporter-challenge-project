import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { SignupRequest, UserRole } from '@zporter/shared';
import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const SIGNUP_ROLES: UserRole[] = ['player', 'coach'];

export class SignupDto implements SignupRequest {
  @ApiProperty({ example: 'coach@zporter.test' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, maxLength: 128, example: 'Passw0rd!' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ minLength: 1, maxLength: 80, example: 'Coach Carter' })
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  displayName!: string;

  @ApiProperty({ enum: SIGNUP_ROLES, example: 'coach' })
  @IsIn(SIGNUP_ROLES)
  role!: UserRole;

  @ApiPropertyOptional({
    minLength: 1,
    maxLength: 80,
    example: 'Maj FC',
    description: 'Squad created and owned by the new coach. Required when role is "coach".',
  })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  teamName?: string;

  @ApiPropertyOptional({
    example: 'aBc123',
    description: 'Existing squad to join (from GET /teams/directory). Required when role is "player".',
  })
  @IsOptional()
  @IsString()
  teamId?: string;
}
