import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeChallenge, makeParticipant, makeUserSummary } from '../testing/fixtures.js';
import type { TeamsService } from '../teams/teams.service.js';
import type { FeedPostRecord } from './entities/feed-post.entity.js';
import { FeedRepository } from './feed.repository.js';
import { FeedService } from './feed.service.js';

function makePost(over: Partial<FeedPostRecord> = {}): FeedPostRecord {
  return {
    id: 'p1',
    type: 'challenge_published',
    author: makeUserSummary({ id: 'coach1' }),
    audience: 'public',
    challenge: makeChallenge(),
    likeCount: 0,
    commentCount: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...over,
  };
}

function build(posts: FeedPostRecord[]) {
  const repo = {
    listRecent: vi.fn(async () => posts),
    savedPostIds: vi.fn(async () => [] as string[]),
    likedAmong: vi.fn(async () => new Set<string>()),
    savedAmong: vi.fn(async () => new Set<string>()),
    getById: vi.fn(async (id: string) => posts.find((p) => p.id === id) ?? null),
    setLike: vi.fn(async (_u: string, _p: string, liked: boolean) => ({
      likeCount: liked ? 1 : 0,
      liked,
    })),
    setSave: vi.fn(async () => undefined),
    create: vi.fn(async () => makePost()),
    resultPostId: (c: string, u: string) => `result_${c}_${u}`,
    upsertResultPost: vi.fn(async () => makePost({ type: 'result_update' })),
    deleteById: vi.fn(async () => undefined),
    deleteByChallenge: vi.fn(async () => undefined),
  };
  const teams = { squadmateIds: vi.fn(async () => new Set<string>()) };
  const service = new FeedService(
    repo as unknown as FeedRepository,
    teams as unknown as TeamsService,
  );
  return { service, repo, teams };
}

describe('FeedService.list', () => {
  const own = makePost({ id: 'own', author: makeUserSummary({ id: 'me' }), audience: 'team' });
  const publicPost = makePost({ id: 'pub', author: makeUserSummary({ id: 'stranger' }), audience: 'public' });
  const squadPost = makePost({ id: 'sq', author: makeUserSummary({ id: 'mate' }), audience: 'team' });
  const strangerPrivate = makePost({ id: 'hidden', author: makeUserSummary({ id: 'stranger' }), audience: 'team' });

  it('"yours" = public posts + your own + your squad-mates', async () => {
    const { service, teams } = build([own, publicPost, squadPost, strangerPrivate]);
    teams.squadmateIds.mockResolvedValue(new Set(['mate']));

    const feed = await service.list('yours', 'me');

    expect(feed.map((p) => p.id).sort()).toEqual(['own', 'pub', 'sq']);
  });

  it('"team" = only posts authored by a squad-mate', async () => {
    const { service, teams } = build([own, publicPost, squadPost]);
    teams.squadmateIds.mockResolvedValue(new Set(['mate']));

    const feed = await service.list('team', 'me');

    expect(feed.map((p) => p.id)).toEqual(['sq']);
  });

  it('"saved" = only posts the viewer bookmarked', async () => {
    const { service, repo } = build([own, publicPost, squadPost]);
    repo.savedPostIds.mockResolvedValue(['pub']);

    const feed = await service.list('saved', 'me');

    expect(feed.map((p) => p.id)).toEqual(['pub']);
  });

  it('stamps likedByMe / savedByMe from the edge lookups', async () => {
    const { service, repo } = build([publicPost]);
    repo.likedAmong.mockResolvedValue(new Set(['pub']));
    repo.savedAmong.mockResolvedValue(new Set());

    const [post] = await service.list('yours', 'me');

    expect(post).toMatchObject({ likedByMe: true, savedByMe: false });
  });
});

describe('FeedService like / save', () => {
  let ctx: ReturnType<typeof build>;
  beforeEach(() => {
    ctx = build([makePost({ id: 'p1' })]);
  });

  it('like → setLike(true), unlike → setLike(false)', async () => {
    await ctx.service.like('p1', 'me');
    expect(ctx.repo.setLike).toHaveBeenCalledWith('me', 'p1', true);

    await ctx.service.unlike('p1', 'me');
    expect(ctx.repo.setLike).toHaveBeenCalledWith('me', 'p1', false);
  });

  it('save → setSave(true) and returns { saved: true }', async () => {
    await expect(ctx.service.save('p1', 'me')).resolves.toEqual({ saved: true });
    expect(ctx.repo.setSave).toHaveBeenCalledWith('me', 'p1', true);
  });

  it('404s when the post does not exist', async () => {
    await expect(ctx.service.like('nope', 'me')).rejects.toBeInstanceOf(NotFoundException);
  });
});

describe('FeedService.publishChallenge', () => {
  it('posts an invite-only (private) challenge as a squad-scoped "team" post', async () => {
    const { service, repo } = build([]);
    await service.publishChallenge(
      makeChallenge({ visibility: 'private', creator: makeUserSummary({ id: 'coach1' }) }),
    );
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'challenge_published', audience: 'team' }),
    );
  });

  it('skips when the challenge has no embedded creator', async () => {
    const { service, repo } = build([]);
    await service.publishChallenge(makeChallenge({ visibility: 'all', creator: undefined }));
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('creates a challenge_published post, mapping visibility:all → audience:public', async () => {
    const { service, repo } = build([]);
    const challenge = makeChallenge({ visibility: 'all', creator: makeUserSummary({ id: 'coach1' }) });

    await service.publishChallenge(challenge);

    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'challenge_published', audience: 'public', challenge }),
    );
  });

  it('never throws when the repository write fails', async () => {
    const { service, repo } = build([]);
    repo.create.mockRejectedValue(new Error('firestore down'));
    await expect(
      service.publishChallenge(makeChallenge({ visibility: 'all', creator: makeUserSummary() })),
    ).resolves.toBeUndefined();
  });
});

describe('FeedService.publishResult', () => {
  const challenge = makeChallenge({ visibility: 'private', resultUnit: 'kg' });

  it('skips when the participant has no submitted result', async () => {
    const { service, repo } = build([]);
    await service.publishResult(challenge, makeParticipant({ submittedResult: undefined }));
    expect(repo.upsertResultPost).not.toHaveBeenCalled();
  });

  it('upserts one public result_update post keyed by challenge + player', async () => {
    const { service, repo } = build([]);
    const participant = makeParticipant({
      userId: 'player1',
      submittedResult: {
        value: 120,
        unit: 'kg',
        videoUrl: 'https://v.test/clip.mp4',
        performedAt: '2026-01-02T10:00:00.000Z',
        arena: 'SATS Häggvik',
        controllerRef: '#Coach',
        submittedAt: '2026-01-02T11:00:00.000Z',
      },
    });

    await service.publishResult(challenge, participant);

    expect(repo.upsertResultPost).toHaveBeenCalledWith(
      'result_c1_player1',
      expect.objectContaining({
        type: 'result_update',
        audience: 'public',
        author: expect.objectContaining({ id: 'player1' }),
        result: expect.objectContaining({ value: 120, unit: 'kg', arena: 'SATS Häggvik' }),
      }),
    );
  });

  it('removeResultPost deletes the deterministic post id', async () => {
    const { service, repo } = build([]);
    await service.removeResultPost('c1', 'player1');
    expect(repo.deleteById).toHaveBeenCalledWith('result_c1_player1');
  });
});
