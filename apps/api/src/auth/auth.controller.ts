import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import type { AuthResponse, User } from '@zporter/shared';
import { CurrentUser } from './decorators/current-user.decorator.js';
import { Public } from './decorators/public.decorator.js';
import { AuthResponseDto } from './dto/auth-response.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { RefreshDto } from './dto/refresh.dto.js';
import { SignupDto } from './dto/signup.dto.js';
import { AuthService } from './auth.service.js';
import type { AuthenticatedUser } from './types.js';

// The class inherits the module's default bucket (120/min) — enough headroom for
// the client's automatic /auth/me + /auth/refresh traffic. The two endpoints
// that accept credentials are the brute-force target, so they override that with
// a much tighter per-IP cap.
const CREDENTIAL_THROTTLE = { default: { limit: 30, ttl: 60_000 } };

@ApiTags('auth')
@Controller('auth')
@UseGuards(ThrottlerGuard)
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Throttle(CREDENTIAL_THROTTLE)
  @Post('signup')
  @ApiCreatedResponse({ type: AuthResponseDto })
  signup(
    @Body() dto: SignupDto,
    @Headers('user-agent') userAgent?: string,
  ): Promise<AuthResponse> {
    return this.auth.signup(dto, userAgent);
  }

  @Public()
  @Throttle(CREDENTIAL_THROTTLE)
  @Post('login')
  @HttpCode(200)
  @ApiOkResponse({ type: AuthResponseDto })
  login(
    @Body() dto: LoginDto,
    @Headers('user-agent') userAgent?: string,
  ): Promise<AuthResponse> {
    return this.auth.login(dto, userAgent);
  }

  @Public()
  @Post('refresh')
  @HttpCode(200)
  @ApiOkResponse({ type: AuthResponseDto })
  refresh(@Body() dto: RefreshDto): Promise<AuthResponse> {
    return this.auth.refresh(dto.refreshToken);
  }

  @ApiBearerAuth('access-token')
  @Post('logout')
  @HttpCode(204)
  logout(
    @Body() dto: RefreshDto,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<void> {
    return this.auth.logout(user.userId, dto.refreshToken);
  }

  @ApiBearerAuth('access-token')
  @Get('me')
  me(@CurrentUser() user: AuthenticatedUser): Promise<User> {
    return this.auth.me(user.userId);
  }
}
