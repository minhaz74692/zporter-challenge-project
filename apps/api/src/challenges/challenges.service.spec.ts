import { BadRequestException, ForbiddenException } from '@nestjs/common';
import type { Challenge, ChallengeTemplate, Participant } from '@zporter/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ParticipantsRepository } from '../participants/participants.repository.js';
import type { ParticipantsService } from '../participants/participants.service.js';
import type { ResultsService } from '../results/results.service.js';
import type { NotificationsService } from '../notifications/notifications.service.js';
import type { BadgesService } from '../badges/badges.service.js';
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
    setResultVerification: vi.fn(async () => undefined),
    awardBadge: vi.fn(async () => undefined),
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
    rebuildLeaderboard: vi.fn(async () => undefined),
  };
  const notifications = { notify: vi.fn(async () => undefined) };
  const feed = {
    publishChallenge: vi.fn(async () => undefined),
    publishResult: vi.fn(async () => undefined),
    removeForChallenge: vi.fn(async () => undefined),
    removeResultPost: vi.fn(async () => undefined),
  };
  const badges = {
    getById: vi.fn(async (id: string) => ({
      id,
      name: 'Sharp Shooter',
      icon: '🎯',
      description: 'Nailed it',
    })),
    list: vi.fn(async () => []),
  };
  const storage = {
    uploadImage: vi.fn(
      async () =>
        'https://firebasestorage.googleapis.com/v0/b/bkt/o/challenges%2Fc1%2Fmedia%2Fimg?alt=media&token=t',
    ),
    uploadVideo: vi.fn(
      async () =>
        'https://firebasestorage.googleapis.com/v0/b/bkt/o/challenges%2Fc1%2Fmedia%2Fvid?alt=media&token=t',
    ),
    deleteObject: vi.fn(async () => undefined),
  };
  const teams = {
    // Team fan-out excludes the coach; the coach's squad for invite scoping.
    invitableMemberIds: vi.fn(async () => ['player1', 'player2', 'player3']),
    squadPlayerIds: vi.fn(async () => new Set(['player1', 'player2', 'player3'])),
  };
  const users = {
    summaryById: vi.fn(async (id: string) => makeUserSummary({ id, displayName: `User ${id}` })),
    summaryByHandle: vi.fn(async () => null),
    getById: vi.fn(async (id: string) => ({ id, handle: `#user${id}` })),
  };

  const service = new ChallengesService(
    repo as unknown as ChallengesRepository,
    participants as unknown as ParticipantsRepository,
    participation as unknown as ParticipantsService,
    results as unknown as ResultsService,
    notifications as unknown as NotificationsService,
    badges as unknown as BadgesService,
    feed as unknown as import('../feed/feed.service.js').FeedService,
    storage as unknown as import('../storage/storage.service.js').StorageService,
    templates as unknown as TemplatesService,
    teams as unknown as TeamsService,
    users as unknown as UsersService,
  );
  return { service, repo, participants, participation, results, notifications, feed, badges, storage, users, challenges, parts };
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
    it('fans out a team, merges squad userIds, drops the requester, dedups', async () => {
      const c = await ctx.service.create({ startAt: PAST, deadline: FUTURE, templateId: 't' } as never, coach);
      const res = await ctx.service.invite(c.id, { userIds: ['player1', 'x'], teamId: 'team1' }, coach);
      const passed = ctx.participants.addInvites.mock.calls[0][1].map((u: { id: string }) => u.id).sort();
      // 'x' is not in the coach's squad → dropped; team fan-out adds player2/3.
      expect(passed).toEqual(['player1', 'player2', 'player3']);
      expect(res.invited).toBe(3);
    });

    it('drops explicit userIds outside the coach`s squad', async () => {
      const c = await ctx.service.create({ startAt: PAST, deadline: FUTURE, templateId: 't' } as never, coach);
      const res = await ctx.service.invite(c.id, { userIds: ['player1', 'outsider'] }, coach);
      const passed = ctx.participants.addInvites.mock.calls[0][1].map((u: { id: string }) => u.id);
      expect(passed).toEqual(['player1']);
      expect(res.invited).toBe(1);
    });

    it('lets an admin invite anyone, bypassing squad scoping', async () => {
      const c = await ctx.service.create(
        { startAt: PAST, deadline: FUTURE, templateId: 't', visibility: 'all' } as never,
        admin,
      );
      const res = await ctx.service.invite(c.id, { userIds: ['anyone', 'else'] }, admin);
      const passed = ctx.participants.addInvites.mock.calls[0][1].map((u: { id: string }) => u.id).sort();
      expect(passed).toEqual(['anyone', 'else']);
      expect(res.invited).toBe(2);
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

    it('submitResult asks the named controller to verify', async () => {
      ctx.challenges.push(makeChallenge({ id: 'c-ctrl', createdBy: 'coach1', deadline: FUTURE }));
      ctx.users.summaryByHandle.mockResolvedValueOnce(
        makeUserSummary({ id: 'ref-user', displayName: 'Ref' }),
      );
      await ctx.service.submitResult(
        'c-ctrl',
        { userId: 'player1', role: 'player' },
        { value: 10, controllerRef: '#RefUser' } as never,
      );
      expect(ctx.notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'ref-user', type: 'result_verify_request' }),
      );
    });

    it('verifyResult marks the result + notifies the submitter, only for the named controller', async () => {
      ctx.challenges.push(makeChallenge({ id: 'c-v', deadline: FUTURE }));
      ctx.participants.findOne.mockResolvedValue({
        userId: 'player1',
        displayName: 'Priya',
        submittedResult: { value: 10, controllerRef: '#ctrl' },
      });
      ctx.users.getById.mockResolvedValueOnce({ id: 'coach1', handle: '#wrong' });
      await expect(
        ctx.service.verifyResult('c-v', 'player1', { userId: 'coach1', role: 'coach' }, true),
      ).rejects.toThrow();

      ctx.users.getById.mockResolvedValueOnce({ id: 'coach1', handle: '#CTRL' }); // case-insensitive
      await ctx.service.verifyResult('c-v', 'player1', { userId: 'coach1', role: 'coach' }, true);
      expect(ctx.participants.setResultVerification).toHaveBeenCalledWith('c-v', 'player1', true);
      expect(ctx.notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'player1', type: 'result_verified' }),
      );
    });
  });

  describe('recognition: badge on verified result', () => {
    beforeEach(() => {
      ctx.challenges.push(
        makeChallenge({ id: 'c-badge', deadline: FUTURE, rewardBadgeId: 'sharp-shooter' }),
      );
      ctx.participants.findOne.mockResolvedValue({
        userId: 'player1',
        displayName: 'Priya',
        submittedResult: { value: 10, controllerRef: '#ctrl' },
      });
      ctx.users.getById.mockResolvedValue({ id: 'coach1', handle: '#ctrl' });
    });

    it('awards the challenge`s reward badge and notifies the player on approval', async () => {
      await ctx.service.verifyResult('c-badge', 'player1', coach, true);
      expect(ctx.participants.awardBadge).toHaveBeenCalledWith(
        'c-badge',
        'player1',
        expect.objectContaining({ id: 'sharp-shooter', name: 'Sharp Shooter' }),
      );
      expect(ctx.notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'player1', type: 'badge_earned' }),
      );
    });

    it('does not award a badge when the result is rejected', async () => {
      await ctx.service.verifyResult('c-badge', 'player1', coach, false);
      expect(ctx.participants.awardBadge).not.toHaveBeenCalled();
    });

    it('does not re-award when the participant already has a badge', async () => {
      ctx.participants.findOne.mockResolvedValue({
        userId: 'player1',
        displayName: 'Priya',
        submittedResult: { value: 10, controllerRef: '#ctrl' },
        awardedBadge: { id: 'sharp-shooter', name: 'Sharp Shooter', icon: '🎯', description: 'x' },
      });
      await ctx.service.verifyResult('c-badge', 'player1', coach, true);
      expect(ctx.participants.awardBadge).not.toHaveBeenCalled();
    });

    it('skips the award (no error) when the challenge has no reward badge', async () => {
      ctx.challenges.push(makeChallenge({ id: 'c-nobadge', deadline: FUTURE }));
      await ctx.service.verifyResult('c-nobadge', 'player1', coach, true);
      expect(ctx.participants.awardBadge).not.toHaveBeenCalled();
      expect(ctx.badges.getById).not.toHaveBeenCalled();
    });

    it('getDetail embeds the resolved reward badge', async () => {
      const detail = await ctx.service.getDetail('c-badge', { userId: 'player1', role: 'player' });
      expect(detail.rewardBadge).toMatchObject({ id: 'sharp-shooter', name: 'Sharp Shooter' });
    });
  });

  describe('remindPending', () => {
    beforeEach(() => {
      ctx.challenges.push(makeChallenge({ id: 'c-rem', createdBy: 'coach1', deadline: FUTURE }));
      ctx.parts.push(
        makeParticipant({ challengeId: 'c-rem', userId: 'p-accepted', inviteState: 'accepted', resultState: 'pending' }),
        makeParticipant({ challengeId: 'c-rem', userId: 'p-done', inviteState: 'accepted', resultState: 'submitted' }),
        makeParticipant({ challengeId: 'c-rem', userId: 'p-invited', inviteState: 'invited', resultState: 'pending' }),
      );
    });

    it('notifies only accepted participants who have not reported, and returns the count', async () => {
      const res = await ctx.service.remindPending('c-rem', coach);
      expect(res).toEqual({ reminded: 1 });
      expect(ctx.notifications.notify).toHaveBeenCalledTimes(1);
      expect(ctx.notifications.notify).toHaveBeenCalledWith(
        expect.objectContaining({ userId: 'p-accepted', type: 'challenge_reminder' }),
      );
    });

    it('403s when the caller does not own the challenge', async () => {
      await expect(
        ctx.service.remindPending('c-rem', { userId: 'coach2', role: 'coach' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('rejects a reminder on an already-ended challenge', async () => {
      ctx.challenges.push(makeChallenge({ id: 'c-rem-old', createdBy: 'coach1', deadline: PAST }));
      await expect(ctx.service.remindPending('c-rem-old', coach)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });
  });

  describe('media gallery', () => {
    beforeEach(() => {
      ctx.challenges.push(
        makeChallenge({
          id: 'c-media',
          createdBy: 'coach1',
          deadline: FUTURE,
          media: [{ url: 'https://img/existing.jpg', type: 'image' }],
        }),
      );
    });

    const file = (mimetype: string) => ({
      buffer: Buffer.from('x'),
      mimetype,
      size: 1,
      originalname: 'f',
    });

    it('addMedia appends uploads + youtube links and re-derives the cover', async () => {
      const out = await ctx.service.addMedia(
        'c-media',
        coach,
        [file('image/png'), file('video/mp4')],
        ['https://youtu.be/b1Dp2Yl3ARw'],
      );
      expect(out.media.map((m) => m.type)).toEqual(['image', 'image', 'video', 'youtube']);
      expect(out.media[3].url).toContain('watch?v=b1Dp2Yl3ARw');
      expect(out.mediaImageUrl).toBe('https://img/existing.jpg');
      expect(out.mediaVideoUrl).toContain('media%2Fvid');
    });

    it('addMedia 400s with neither files nor links', async () => {
      await expect(ctx.service.addMedia('c-media', coach, [], [])).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('removeMedia splices and deletes the uploaded object', async () => {
      ctx.challenges.find((c) => c.id === 'c-media')!.media = [
        {
          url: 'https://firebasestorage.googleapis.com/v0/b/bkt/o/challenges%2Fc-media%2Fmedia%2Fa?alt=media&token=t',
          type: 'image',
        },
        { url: 'https://www.youtube.com/watch?v=b1Dp2Yl3ARw', type: 'youtube' },
      ];
      const out = await ctx.service.removeMedia('c-media', coach, 0);
      expect(out.media).toHaveLength(1);
      expect(out.media[0].type).toBe('youtube');
      expect(ctx.storage.deleteObject).toHaveBeenCalledWith('challenges/c-media/media/a');
    });

    it('removeMedia 400s on an out-of-range index', async () => {
      await expect(ctx.service.removeMedia('c-media', coach, 9)).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('setMedia replaces the gallery and re-thumbs youtube items', async () => {
      const out = await ctx.service.setMedia('c-media', coach, [
        { url: 'https://youtu.be/b1Dp2Yl3ARw', type: 'youtube' },
        { url: 'https://img/new.jpg', type: 'image' },
      ]);
      expect(out.media[0].thumbnailUrl).toContain('img.youtube.com');
      expect(out.mediaImageUrl).toBe('https://img/new.jpg');
    });

    it('all media routes 403 for a non-owner', async () => {
      const stranger = { userId: 'coach2', role: 'coach' as const };
      await expect(ctx.service.addMedia('c-media', stranger, [file('image/png')], [])).rejects.toBeInstanceOf(ForbiddenException);
      await expect(ctx.service.setMedia('c-media', stranger, [])).rejects.toBeInstanceOf(ForbiddenException);
      await expect(ctx.service.removeMedia('c-media', stranger, 0)).rejects.toBeInstanceOf(ForbiddenException);
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
