import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, type JwtSignOptions } from '@nestjs/jwt';
import type {
  AuthResponse,
  LoginRequest,
  SignupRequest,
  User,
} from '@zporter/shared';
import type { AuthConfig } from '../config/configuration.js';
import { toPublicUser, type UserRecord } from '../users/entities/user.entity.js';
import { UsersService } from '../users/users.service.js';
import { SessionsRepository } from './sessions.repository.js';
import {
  formatRefreshToken,
  generateRefreshSecret,
  parseRefreshToken,
  sha256,
} from './refresh-token.js';
import type { JwtPayload } from './types.js';

const DAY_MS = 86_400_000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly config: AuthConfig;

  constructor(
    private readonly users: UsersService,
    private readonly sessions: SessionsRepository,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.config = config.getOrThrow<AuthConfig>('auth');
  }

  async signup(dto: SignupRequest, userAgent?: string): Promise<AuthResponse> {
    const user = await this.users.create(dto);
    return this.startSession(user, userAgent);
  }

  async login(dto: LoginRequest, userAgent?: string): Promise<AuthResponse> {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !(await this.users.verifyPassword(user, dto.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }
    return this.startSession(user, userAgent);
  }

  /**
   * Rotate: validate the presented token, overwrite the stored hash, issue a
   * fresh pair. A token whose secret no longer matches (replay of a rotated
   * token) revokes every session for that user.
   */
  async refresh(refreshToken: string): Promise<AuthResponse> {
    const parsed = parseRefreshToken(refreshToken);
    if (!parsed) throw new UnauthorizedException('Malformed refresh token');

    const session = await this.sessions.findById(parsed.userId, parsed.sessionId);
    const isLive =
      session && !session.revokedAt && Date.parse(session.expiresAt) > Date.now();
    if (!session || !isLive) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    if (sha256(parsed.secret) !== session.refreshTokenHash) {
      this.logger.warn(
        `Refresh-token reuse detected for user ${parsed.userId}; revoking all sessions`,
      );
      await this.sessions.revokeAllForUser(parsed.userId);
      throw new UnauthorizedException('Refresh token already used');
    }

    const user = await this.users.getById(parsed.userId);
    const secret = generateRefreshSecret();
    await this.sessions.rotate(session.userId, session.id, {
      refreshTokenHash: secret.hash,
      expiresAt: this.refreshExpiry(),
    });
    return {
      user: toPublicUser(user),
      accessToken: await this.signAccessToken(user),
      refreshToken: formatRefreshToken(user.id, session.id, secret.secret),
    };
  }

  /** Idempotent — a missing/foreign/already-revoked token is a no-op. */
  async logout(userId: string, refreshToken: string): Promise<void> {
    const parsed = parseRefreshToken(refreshToken);
    if (!parsed || parsed.userId !== userId) return;
    await this.sessions.revoke(parsed.userId, parsed.sessionId);
  }

  async me(userId: string): Promise<User> {
    return toPublicUser(await this.users.getById(userId));
  }

  private async startSession(
    user: UserRecord,
    userAgent?: string,
  ): Promise<AuthResponse> {
    const secret = generateRefreshSecret();
    const session = await this.sessions.create(user.id, {
      refreshTokenHash: secret.hash,
      userAgent,
      expiresAt: this.refreshExpiry(),
    });
    return {
      user: toPublicUser(user),
      accessToken: await this.signAccessToken(user),
      refreshToken: formatRefreshToken(user.id, session.id, secret.secret),
    };
  }

  private signAccessToken(user: UserRecord): Promise<string> {
    const payload: JwtPayload = { sub: user.id, role: user.role };
    // `expiresIn` is typed as the `ms` template-literal union; the value comes
    // from validated config (e.g. `15m`), so a widening cast is safe here.
    const options = { expiresIn: this.config.accessTtl } as JwtSignOptions;
    return this.jwt.signAsync(payload, options);
  }

  private refreshExpiry(): string {
    return new Date(Date.now() + this.config.refreshTtlDays * DAY_MS).toISOString();
  }
}
