import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { Challenge, ChallengeTemplate, Participant } from '@zporter/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParticipantsRepository } from '../participants/participants.repository.js';
import type { ParticipantsService } from '../participants/participants.service.js';
import type { ResultsService } from '../results/results.service.js';
import type { NotificationsService } from '../notifications/notifications.service.js';
import type { TeamsService } from '../teams/teams.service.js';
import type { TemplatesService } from '../templates/templates.service.js';
import type { UsersService } from '../users/users.service.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { makeChallenge, makeParticipant, makeUserSummary } from '../testing/fixtures.js';
import { ChallengesService } from './challenges.service.js';
import type { ChallengesRepository } from './challenges.repository.js';

const FUTURE = new Date(Date.now() + 7 * 86_400_000).toISOString();
const PAST = new Date(Date.now() - 86_400_000).toISOString();

const coach: AuthenticatedUser = { userId: 'coach1', role: 'coach' };
const admin: AuthenticatedUser = { userId: 'admin1', role: 'admin' };

const TEMPLATE: ChallengeTemplate = {
  id: 'sprint',
  title: 'Tpl',
  description: 'from template',
  rules: 'tpl rules',
  mainCategory: 'physical',
  collections: ['speed'],
  equipmentTags: ['#Cones'],
  resultType: 'time',
  resultUnit: 'seconds',
  scoringDirection: 'lower_better',
  durationMinutes: 5,
  location: 'field',
  pointsToParticipate: 10,
  rewardPoints: 100,
  isPublic: true,
  createdBy: 'coach1',
  createdAt: PAST,
};

function build() {
  const challenges: Challenge[] = [];
  const parts: Participant[] = [];

  const repo = {
    create: vi.fn(async (data: Omit<Challenge, 'id' | 'createdAt' | 'participantCount' | 'creator'>) => {
      const c = makeChallenge({ ...data, id: `c${challenges.length + 1}` });
      challenges.push(c);
      return c;
    }),
    findById: vi.fn(async (id: string) => challenges.find((c) => c.id === id) ?? null),
    findManyByIds: vi.fn(async (ids: string[]) => challenges.filter((c) => ids.includes(c.id))),
    listPublic: vi.fn(async () => challenges.filter((c) => c.visibility === 'all')),
    leaderboard: vi.fn(async () => []),
    updateFields: vi.fn(async (id: string, patch: Partial<Challenge>) => {
      const c = challenges.find((x) => x.id === id);
      if (c) Object.assign(c, patch);
    }),
    delete: vi.fn(async (id: string) => {
      const i = challenges.findIndex((x) => x.id === id);
      if (i >= 0) challenges.splice(i, 1);
    }),
  };
  const participants = {
    listByUser: vi.fn(async (userId: string) => parts.filter((p) => p.userId === userId)),
    findOne: vi.fn(async (cid: string, uid: string) =>
      parts.find((p) => p.challengeId === cid && p.userId === uid) ?? null,
    ),
    listByChallenge: vi.fn(async (cid: string) => parts.filter((p) => p.challengeId === cid)),
    addInvites: vi.fn(async (_cid: string, invites: { id: string }[]) => invites),
  };
  const templates = { getById: vi.fn(async (): Promise<ChallengeTemplate> => TEMPLATE) };
  const participation = {
    accept: vi.fn(async () => makeParticipant({ inviteState: 'accepted' })),
    decline: vi.fn(async () => makeParticipant({ inviteState: 'declined' })),
  };
  const results = {
    submit: vi.fn(async (c: Challenge, userId: string) =>
      makeParticipant({ userId, challengeId: c.id, resultState: 'completed' }),
    ),
  };
  const notifications = { notify: vi.fn(async () => undefined) };
  const storage = { uploadImage: vi.fn(async () => 'https://img.test/x') };
  const teams = { memberUserIds: vi.fn(async () => ['player1', 'player2', 'player3']) };
  const users = {
    summaryById: vi.fn(async (id: string) => makeUserSummary({ id, displayName: `User ${id}` })),
  };

  const service = new ChallengesService(
    repo as unknown as ChallengesRepository,
    participants as unknown as ParticipantsRepository,
    participation as unknown as ParticipantsService,
    results as unknown as ResultsService,
    notifications as unknown as NotificationsService,
    storage as unknown as import('../storage/storage.service.js').StorageService,
    templates as unknown as TemplatesService,
    teams as unknown as TeamsService,
    users as unknown as UsersService,
  );
  return { service, repo, participants, participation, results, notifications, users, challenges, parts };
}

describe('ChallengesService', () => {
  let ctx: ReturnType<typeof build>;
  beforeEach(() => {
    ctx = build();
  });

  describe('create', () => {
    const dates = { startAt: PAST, deadline: FUTURE };

    it('blocks a non-admin from publishing to everyone (visibility: all)', async () => {
      await expect(
        ctx.service.create({ ...dates, visibility: 'all', templateId: 't' } as never, coach),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('allows an admin to publish to everyone', async () => {
      const c = await ctx.service.create(
        { ...dates, visibility: 'all', templateId: 't' } as never,
        admin,
      );
      expect(c.visibility).toBe('all');
    });

    it('fills content from the template when only templateId is given', async () => {
      const c = await ctx.service.create({ ...dates, templateId: 'sprint' } as never, coach);
      expect(c).toMatchObject({
        title: 'Tpl',
        resultType: 'time',
        resultUnit: 'seconds',
        scoringDirection: 'lower_better',
        mainCategory: 'physical',
        rewardPoints: 100,
      });
      // template rules folded into description
      expect(c.description).toContain('tpl rules');
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
      const passed = ctx.participants.addInvites.mock.calls[0][1].map((u: { id: string }) => u.id).sort();
      expect(passed).toEqual(['player1', 'player2', 'player3', 'x']);
      expect(res.invited).toBe(4);
    });

    it('403s when the caller does not own the challenge', async () => {
      const c = await ctx.service.create({ startAt: PAST, deadline: FUTURE, templateId: 't' } as never, coach);
      await expect(
        ctx.service.invite(c.id, { userIds: ['player1'] }, { userId: 'coach2', role: 'coach' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('notifies each newly invited user', async () => {
      const c = await ctx.service.create({ startAt: PAST, deadline: FUTURE, templateId: 't' } as never, coach);
      await ctx.service.invite(c.id, { userIds: ['player1', 'player2'] }, coach);
      const notified = ctx.notifications.notify.mock.calls.map((call) => call[0].userId).sort();
      expect(notified).toEqual(['player1', 'player2']);
      expect(ctx.notifications.notify.mock.calls[0][0]).toMatchObject({ type: 'challenge_invite' });
    });
  });

  describe('update / remove', () => {
    it('403s when the caller does not own the challenge', async () => {
      const c = await ctx.service.create({ startAt: PAST, deadline: FUTURE, templateId: 't' } as never, coach);
      await expect(
        ctx.service.update(c.id, { title: 'nope' } as never, { userId: 'coach2', role: 'coach' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('blocks a non-admin from switching visibility to all', async () => {
      const c = await ctx.service.create({ startAt: PAST, deadline: FUTURE, templateId: 't' } as never, coach);
      await expect(
        ctx.service.update(c.id, { visibility: 'all' } as never, coach),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('validates deadline against the stored startAt when only deadline changes', async () => {
      ctx.challenges.push(
        makeChallenge({
          id: 'c-far',
          createdBy: 'coach1',
          startAt: FUTURE,
          deadline: '2099-06-01T00:00:00.000Z',
        }),
      );
      await expect(
        ctx.service.update('c-far', { deadline: PAST } as never, coach),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('applies a defined-only patch and returns the merged challenge', async () => {
      const c = await ctx.service.create({ startAt: PAST, deadline: FUTURE, templateId: 't' } as never, coach);
      const out = await ctx.service.update(c.id, { title: 'new title', ingress: undefined } as never, coach);
      expect(out.title).toBe('new title');
      const patch = ctx.repo.updateFields.mock.calls[0][1];
      expect(patch).not.toHaveProperty('ingress');
    });

    it('remove: 403 for a non-owner, deletes for the owner', async () => {
      const c = await ctx.service.create({ startAt: PAST, deadline: FUTURE, templateId: 't' } as never, coach);
      await expect(
        ctx.service.remove(c.id, { userId: 'x', role: 'player' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await ctx.service.remove(c.id, coach);
      expect(ctx.repo.delete).toHaveBeenCalledWith(c.id);
    });
  });

  describe('accept / decline', () => {
    it('loads the challenge, resolves the user summary, delegates to ParticipantsService', async () => {
      const c = await ctx.service.create({ startAt: PAST, deadline: FUTURE, templateId: 't' } as never, coach);
      await ctx.service.accept(c.id, { userId: 'player1', role: 'player' });

      expect(ctx.participation.accept).toHaveBeenCalledWith(
        expect.objectContaining({ id: c.id }),
        expect.objectContaining({ id: 'player1', handle: expect.any(String) }),
      );
    });

    it('passes the lazily-ended status through so ParticipantsService can reject it', async () => {
      ctx.challenges.push(makeChallenge({ id: 'c-late', deadline: PAST }));
      await ctx.service.decline('c-late', { userId: 'player1', role: 'player' });
      expect(ctx.participation.decline.mock.calls[0][0].status).toBe('ended');
    });

    it('submitResult notifies the challenge creator (not when the creator submits)', async () => {
      ctx.challenges.push(makeChallenge({ id: 'c-mine', createdBy: 'coach1', deadline: FUTURE }));
      await ctx.service.submitResult('c-mine', { userId: 'player1', role: 'player' }, { value: 10 } as never);
      expect(ctx.notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'coach1', type: 'result_submitted' }),
      );

      ctx.notifications.notify.mockClear();
      await ctx.service.submitResult('c-mine', { userId: 'coach1', role: 'coach' }, { value: 10 } as never);
      expect(ctx.notifications.notify).not.toHaveBeenCalled();
    });
  });

  describe('listByCategory', () => {
    beforeEach(() => {
      ctx.challenges.push(
        makeChallenge({ id: 'c-new', deadline: FUTURE }),
        makeChallenge({ id: 'c-active', deadline: FUTURE }),
        makeChallenge({ id: 'c-done', deadline: FUTURE }),
        makeChallenge({ id: 'c-declined', deadline: FUTURE }),
        makeChallenge({ id: 'c-late', deadline: PAST }),
        makeChallenge({ id: 'c-public', visibility: 'all', deadline: FUTURE }),
      );
      ctx.parts.push(
        makeParticipant({ challengeId: 'c-new', inviteState: 'invited' }),
        makeParticipant({ challengeId: 'c-active', inviteState: 'accepted', resultState: 'pending' }),
        makeParticipant({ challengeId: 'c-done', inviteState: 'accepted', resultState: 'submitted' }),
        makeParticipant({ challengeId: 'c-declined', inviteState: 'declined' }),
        makeParticipant({ challengeId: 'c-late', inviteState: 'accepted', resultState: 'pending' }),
      );
    });

    const ids = async (cat: Parameters<ChallengesService['listByCategory']>[1]) =>
      (await ctx.service.listByCategory('player1', cat)).map((c) => c.id).sort();

    it('new = invited-and-not-ended, plus un-joined public', async () => {
      expect(await ids('new')).toEqual(['c-new', 'c-public']);
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
