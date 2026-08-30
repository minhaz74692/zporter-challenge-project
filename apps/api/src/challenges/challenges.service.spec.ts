import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { Challenge, ChallengeTemplate, Participant } from '@zporter/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParticipantsRepository } from '../participants/participants.repository.js';
import type { TeamsService } from '../teams/teams.service.js';
import type { TemplatesService } from '../templates/templates.service.js';
import type { UsersService } from '../users/users.service.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { ChallengesService } from './challenges.service.js';
import type { ChallengesRepository } from './challenges.repository.js';

const FUTURE = new Date(Date.now() + 7 * 86_400_000).toISOString();
const PAST = new Date(Date.now() - 86_400_000).toISOString();

function challenge(over: Partial<Challenge>): Challenge {
  return {
    id: 'c',
    title: 'C',
    description: 'd',
    category: 'Cat',
    resultType: 'count',
    scoringDirection: 'higher_better',
    rules: 'r',
    reward: { label: 'done' },
    startAt: PAST,
    deadline: FUTURE,
    status: 'active',
    visibility: 'invited',
    createdBy: 'coach1',
    participantCount: 0,
    createdAt: PAST,
    ...over,
  };
}

function participant(over: Partial<Participant>): Participant {
  return {
    id: 'p',
    challengeId: 'c',
    userId: 'player1',
    displayName: 'P',
    inviteState: 'invited',
    resultState: 'pending',
    joinedAt: PAST,
    ...over,
  };
}

const coach: AuthenticatedUser = { userId: 'coach1', role: 'coach' };
const admin: AuthenticatedUser = { userId: 'admin1', role: 'admin' };

function build() {
  const challenges: Challenge[] = [];
  const parts: Participant[] = [];

  const repo = {
    create: vi.fn(async (data: Omit<Challenge, 'id' | 'createdAt' | 'participantCount'>) => {
      const c = challenge({ ...data, id: `c${challenges.length + 1}` });
      challenges.push(c);
      return c;
    }),
    findById: vi.fn(async (id: string) => challenges.find((c) => c.id === id) ?? null),
    findManyByIds: vi.fn(async (ids: string[]) =>
      challenges.filter((c) => ids.includes(c.id)),
    ),
    listGlobal: vi.fn(async () => challenges.filter((c) => c.visibility === 'global')),
    leaderboard: vi.fn(async () => []),
  };
  const participants = {
    listByUser: vi.fn(async (userId: string) => parts.filter((p) => p.userId === userId)),
    findOne: vi.fn(async (cid: string, uid: string) =>
      parts.find((p) => p.challengeId === cid && p.userId === uid) ?? null,
    ),
    listByChallenge: vi.fn(async (cid: string) => parts.filter((p) => p.challengeId === cid)),
    addInvites: vi.fn(async (_cid: string, invites: { userId: string }[]) => invites.length),
  };
  const templates = {
    getById: vi.fn(
      async (id: string): Promise<ChallengeTemplate> => ({
        id,
        title: 'Tpl',
        description: 'from template',
        category: 'Speed',
        resultType: 'time',
        scoringDirection: 'lower_better',
        rules: 'tpl rules',
        isPublic: true,
        createdBy: 'coach1',
        createdAt: PAST,
      }),
    ),
  };
  const participation = {
    accept: vi.fn(async (c: Challenge, m: { userId: string; displayName: string }) => ({
      id: m.userId,
      challengeId: c.id,
      userId: m.userId,
      displayName: m.displayName,
      inviteState: 'accepted',
      resultState: 'pending',
      joinedAt: PAST,
    })),
    decline: vi.fn(async (c: Challenge, m: { userId: string }) => ({ userId: m.userId, inviteState: 'declined' })),
  };
  const teams = { memberUserIds: vi.fn(async () => ['player1', 'player2', 'player3']) };
  const users = { getById: vi.fn(async (id: string) => ({ id, displayName: `User ${id}` })) };

  const service = new ChallengesService(
    repo as unknown as ChallengesRepository,
    participants as unknown as ParticipantsRepository,
    participation as unknown as import('../participants/participants.service.js').ParticipantsService,
    templates as unknown as TemplatesService,
    teams as unknown as TeamsService,
    users as unknown as UsersService,
  );
  return { service, repo, participants, participation, teams, challenges, parts };
}

describe('ChallengesService', () => {
  let ctx: ReturnType<typeof build>;
  beforeEach(() => {
    ctx = build();
  });

  describe('create', () => {
    const dates = { startAt: PAST, deadline: FUTURE };

    it('blocks a non-admin from creating a global challenge', async () => {
      await expect(
        ctx.service.create({ ...dates, visibility: 'global', title: 'x', description: 'x', category: 'x', resultType: 'count', scoringDirection: 'higher_better', rules: 'x' } as never, coach),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows an admin to create a global challenge', async () => {
      const c = await ctx.service.create(
        { ...dates, visibility: 'global', title: 'G', description: 'd', category: 'c', resultType: 'count', scoringDirection: 'higher_better', rules: 'r' } as never,
        admin,
      );
      expect(c.visibility).toBe('global');
    });

    it('fills content from the template when only templateId is given', async () => {
      const c = await ctx.service.create({ ...dates, templateId: 'sprint' } as never, coach);
      expect(c).toMatchObject({ title: 'Tpl', resultType: 'time', scoringDirection: 'lower_better' });
      expect(c.reward.label).toContain('Tpl');
    });

    it('rejects a create with no template and missing fields', async () => {
      await expect(
        ctx.service.create({ ...dates, title: 'only a title' } as never, coach),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects deadline <= startAt', async () => {
      await expect(
        ctx.service.create({ startAt: FUTURE, deadline: FUTURE, templateId: 't' } as never, coach),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('invite', () => {
    it('fans out a team, merges userIds, drops the requester, dedups', async () => {
      const c = await ctx.service.create({ startAt: PAST, deadline: FUTURE, templateId: 't' } as never, coach);
      const res = await ctx.service.invite(c.id, { userIds: ['player1', 'x'], teamId: 'team1' }, coach);
      // team → player1,player2,player3 ; +userIds player1,x ; -requester coach1 ; dedup
      const passed = ctx.participants.addInvites.mock.calls[0][1].map((i: { userId: string }) => i.userId).sort();
      expect(passed).toEqual(['player1', 'player2', 'player3', 'x']);
      expect(res.invited).toBe(4);
    });

    it('403s when the caller does not own the challenge', async () => {
      const c = await ctx.service.create({ startAt: PAST, deadline: FUTURE, templateId: 't' } as never, coach);
      await expect(
        ctx.service.invite(c.id, { userIds: ['player1'] }, { userId: 'coach2', role: 'coach' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('accept / decline', () => {
    it('loads the challenge, resolves the display name, delegates to ParticipantsService', async () => {
      const c = await ctx.service.create({ startAt: PAST, deadline: FUTURE, templateId: 't' } as never, coach);
      await ctx.service.accept(c.id, { userId: 'player1', role: 'player' });

      expect(ctx.participation.accept).toHaveBeenCalledWith(
        expect.objectContaining({ id: c.id }),
        { userId: 'player1', displayName: 'User player1' },
      );
    });

    it('passes the lazily-ended status through so ParticipantsService can reject it', async () => {
      ctx.challenges.push(challenge({ id: 'c-late', deadline: PAST }));
      await ctx.service.decline('c-late', { userId: 'player1', role: 'player' });
      expect(ctx.participation.decline.mock.calls[0][0].status).toBe('ended');
    });
  });

  describe('listByCategory', () => {
    beforeEach(() => {
      ctx.challenges.push(
        challenge({ id: 'c-new', deadline: FUTURE }),
        challenge({ id: 'c-active', deadline: FUTURE }),
        challenge({ id: 'c-done', deadline: FUTURE }),
        challenge({ id: 'c-declined', deadline: FUTURE }),
        challenge({ id: 'c-late', deadline: PAST }),
        challenge({ id: 'c-global', visibility: 'global', deadline: FUTURE }),
      );
      ctx.parts.push(
        participant({ challengeId: 'c-new', inviteState: 'invited' }),
        participant({ challengeId: 'c-active', inviteState: 'accepted', resultState: 'pending' }),
        participant({ challengeId: 'c-done', inviteState: 'accepted', resultState: 'submitted' }),
        participant({ challengeId: 'c-declined', inviteState: 'declined' }),
        participant({ challengeId: 'c-late', inviteState: 'accepted', resultState: 'pending' }),
      );
    });

    const ids = async (cat: Parameters<ChallengesService['listByCategory']>[1]) =>
      (await ctx.service.listByCategory('player1', cat)).map((c) => c.id).sort();

    it('new = invited-and-not-ended, plus un-joined global', async () => {
      expect(await ids('new')).toEqual(['c-global', 'c-new']);
    });
    it('active = accepted + pending + not ended', async () => {
      expect(await ids('active')).toEqual(['c-active']);
    });
    it('done = submitted/completed', async () => {
      expect(await ids('done')).toEqual(['c-done']);
    });
    it('declined = declined', async () => {
      expect(await ids('declined')).toEqual(['c-declined']);
    });
    it('ended = past-deadline the user was in (lazy status)', async () => {
      expect(await ids('ended')).toEqual(['c-late']);
    });
  });
});
