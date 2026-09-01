import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import type { SignupRequest, Team } from '@zporter/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserRecord } from '../users/entities/user.entity.js';
import type { UsersService } from '../users/users.service.js';
import type { TeamsService } from '../teams/teams.service.js';
import { AuthService } from './auth.service.js';
import type { NewSession, SessionRecord } from './entities/session.entity.js';
import type { SessionsRepository } from './sessions.repository.js';
import { parseRefreshToken, sha256 } from './refresh-token.js';
import type { JwtPayload } from './types.js';

class FakeUsersService {
  private readonly byId = new Map<string, UserRecord>();
  private seq = 0;

  async create(input: SignupRequest): Promise<UserRecord> {
    const user: UserRecord = {
      id: `user${++this.seq}`,
      email: input.email.trim().toLowerCase(),
      passwordHash: `hash:${input.password}`,
      displayName: input.displayName.trim(),
      role: input.role,
      createdAt: new Date().toISOString(),
    };
    this.byId.set(user.id, user);
    return user;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const needle = email.trim().toLowerCase();
    return [...this.byId.values()].find((u) => u.email === needle) ?? null;
  }

  async getById(id: string): Promise<UserRecord> {
    const user = this.byId.get(id);
    if (!user) throw new Error('not found');
    return user;
  }

  async verifyPassword(user: UserRecord, plain: string): Promise<boolean> {
    return user.passwordHash === `hash:${plain}`;
  }
}

class FakeSessionsRepository {
  readonly rows = new Map<string, SessionRecord>();
  revokeAllForUser = vi.fn(async (userId: string) => {
    for (const s of this.rows.values()) {
      if (s.userId === userId) s.revokedAt = new Date().toISOString();
    }
  });

  private seq = 0;
  private key(userId: string, id: string) {
    return `${userId}/${id}`;
  }

  async create(userId: string, data: NewSession): Promise<SessionRecord> {
    const record: SessionRecord = {
      id: `sess${++this.seq}`,
      userId,
      createdAt: new Date().toISOString(),
      ...data,
    };
    this.rows.set(this.key(userId, record.id), record);
    return record;
  }

  async findById(userId: string, id: string): Promise<SessionRecord | null> {
    return this.rows.get(this.key(userId, id)) ?? null;
  }

  async rotate(
    userId: string,
    id: string,
    data: { refreshTokenHash: string; expiresAt: string },
  ): Promise<void> {
    Object.assign(this.rows.get(this.key(userId, id))!, data);
  }

  async revoke(userId: string, id: string): Promise<void> {
    const s = this.rows.get(this.key(userId, id));
    if (s) s.revokedAt = new Date().toISOString();
  }
}

class FakeTeamsService {
  createForCoach = vi.fn(
    async (coachId: string, name: string): Promise<Team> => ({
      id: 'team1',
      name,
      coachId,
      createdAt: new Date().toISOString(),
    }),
  );
  addPlayer = vi.fn(async (_userId: string, _teamId: string): Promise<void> => {});
}

const SIGNUP: SignupRequest = {
  email: 'coach@zporter.test',
  password: 'Passw0rd!',
  displayName: 'Coach',
  role: 'coach',
  teamName: 'Maj FC',
};

function build() {
  const users = new FakeUsersService();
  const teams = new FakeTeamsService();
  const sessions = new FakeSessionsRepository();
  const jwt = new JwtService({ secret: 'test-secret' });
  const config = {
    getOrThrow: () => ({ accessSecret: 'test-secret', accessTtl: '15m', refreshTtlDays: 14 }),
  } as unknown as ConfigService;
  const service = new AuthService(
    users as unknown as UsersService,
    teams as unknown as TeamsService,
    sessions as unknown as SessionsRepository,
    jwt,
    config,
  );
  return { service, users, teams, sessions, jwt };
}

describe('AuthService', () => {
  let ctx: ReturnType<typeof build>;

  beforeEach(() => {
    ctx = build();
  });

  it('signup issues a verifiable access token and a hashed session', async () => {
    const res = await ctx.service.signup(SIGNUP, 'vitest-agent');

    const claims = ctx.jwt.verify<JwtPayload>(res.accessToken);
    expect(claims).toMatchObject({ sub: res.user.id, role: 'coach' });

    const parsed = parseRefreshToken(res.refreshToken)!;
    expect(parsed.userId).toBe(res.user.id);
    const session = ctx.sessions.rows.get(`${parsed.userId}/${parsed.sessionId}`)!;
    expect(session.refreshTokenHash).toBe(sha256(parsed.secret));
    expect(session.userAgent).toBe('vitest-agent');
  });

  it('coach signup creates the coach`s squad', async () => {
    const res = await ctx.service.signup(SIGNUP);
    expect(ctx.teams.createForCoach).toHaveBeenCalledWith(res.user.id, 'Maj FC');
  });

  it('coach signup without a team name is rejected', async () => {
    await expect(
      ctx.service.signup({ ...SIGNUP, teamName: '  ' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('player signup joins the chosen squad', async () => {
    const res = await ctx.service.signup({
      email: 'p@zporter.test',
      password: 'Passw0rd!',
      displayName: 'Player',
      role: 'player',
      teamId: 'team1',
    });
    expect(ctx.teams.addPlayer).toHaveBeenCalledWith(res.user.id, 'team1');
    expect(ctx.teams.createForCoach).not.toHaveBeenCalled();
  });

  it('player signup without a team id is rejected', async () => {
    await expect(
      ctx.service.signup({
        email: 'p@zporter.test',
        password: 'Passw0rd!',
        displayName: 'Player',
        role: 'player',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('login rejects a wrong password and an unknown email', async () => {
    await ctx.service.signup(SIGNUP);
    await expect(
      ctx.service.login({ email: SIGNUP.email, password: 'nope' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(
      ctx.service.login({ email: 'ghost@zporter.test', password: 'x' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refresh rotates the token: the new one works, the old one is dead', async () => {
    const first = await ctx.service.signup(SIGNUP);

    const rotated = await ctx.service.refresh(first.refreshToken);
    expect(rotated.refreshToken).not.toBe(first.refreshToken);
    ctx.jwt.verify(rotated.accessToken);

    // Replaying the original (already-rotated) token is treated as reuse.
    await expect(ctx.service.refresh(first.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(ctx.sessions.revokeAllForUser).toHaveBeenCalledWith(first.user.id);
  });

  it('refresh rejects a malformed token', async () => {
    await expect(ctx.service.refresh('not-a-token')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('refresh rejects an expired session', async () => {
    const res = await ctx.service.signup(SIGNUP);
    const parsed = parseRefreshToken(res.refreshToken)!;
    ctx.sessions.rows.get(`${parsed.userId}/${parsed.sessionId}`)!.expiresAt =
      new Date(Date.now() - 1000).toISOString();

    await expect(ctx.service.refresh(res.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('logout revokes the session so its refresh token stops working', async () => {
    const res = await ctx.service.signup(SIGNUP);
    await ctx.service.logout(res.user.id, res.refreshToken);

    await expect(ctx.service.refresh(res.refreshToken)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('logout with a token that is not the caller`s is a no-op', async () => {
    const res = await ctx.service.signup(SIGNUP);
    await ctx.service.logout('someone-else', res.refreshToken);

    const parsed = parseRefreshToken(res.refreshToken)!;
    expect(
      ctx.sessions.rows.get(`${parsed.userId}/${parsed.sessionId}`)!.revokedAt,
    ).toBeUndefined();
  });
});
