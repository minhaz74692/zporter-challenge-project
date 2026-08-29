import { ApiProperty } from '@nestjs/swagger';
import type { SignupRequest, UserRole } from '@zporter/shared';
import { IsEmail, IsIn, IsString, MaxLength, MinLength } from 'class-validator';

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
}
