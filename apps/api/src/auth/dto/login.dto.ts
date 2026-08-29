import { ApiProperty } from '@nestjs/swagger';
import type { LoginRequest } from '@zporter/shared';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto implements LoginRequest {
  @ApiProperty({ example: 'coach@zporter.test' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'Passw0rd!' })
  @IsString()
  @MinLength(1)
  password!: string;
}
