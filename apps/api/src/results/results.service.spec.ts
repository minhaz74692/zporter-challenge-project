import { BadRequestException, ConflictException } from '@nestjs/common';
import type { SubmitResultRequest } from '@zporter/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { makeChallenge } from '../testing/fixtures.js';
import { ResultsService } from './results.service.js';
import type { RankedEntry, ResultsRepository } from './results.repository.js';
import type { RankInput } from './strategies/result-strategy.js';
import { ResultStrategyRegistry } from './strategies/result-strategy.registry.js';
import { CountResultStrategy } from './strategies/count.strategy.js';
import { TimeResultStrategy } from './strategies/time.strategy.js';
import { BooleanResultStrategy } from './strategies/boolean.strategy.js';

const registry = new ResultStrategyRegistry([
  new CountResultStrategy(),
  new TimeResultStrategy(),
  new BooleanResultStrategy(),
]);

/** A valid report payload; individual tests override `value`. */
const req = (over: Partial<SubmitResultRequest>): SubmitResultRequest => ({
  value: 1,
  videoUrl: 'https://video.test/clip.mp4',
  performedAt: '2026-08-30T10:00:00.000Z',
  arena: 'Home pitch',
  controllerRef: '#RefUsr123456',
  ...over,
});

function build() {
  const repo = {
    submit: vi.fn(
      async (
        _cid: string,
        userId: string,
        submission: unknown,
        resultState: string,
        rank: (e: RankInput[]) => RankedEntry[],
      ) => ({ userId, submission, resultState, rank }),
    ),
  };
  const service = new ResultsService(registry, repo as unknown as ResultsRepository);
  return { service, repo };
}

describe('ResultsService', () => {
  let ctx: ReturnType<typeof build>;
  beforeEach(() => {
    ctx = build();
  });

  it('rejects a submission to an ended challenge', async () => {
    await expect(
      ctx.service.submit(makeChallenge({ status: 'ended' }), 'p1', req({ value: 5 })),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('requires a video and a controller (Figma copy)', async () => {
    await expect(
      ctx.service.submit(makeChallenge(), 'p1', req({ videoUrl: '' })),
    ).rejects.toThrow('Video must be added to report Challenge');
    await expect(
      ctx.service.submit(makeChallenge(), 'p1', req({ controllerRef: '  ' })),
    ).rejects.toThrow('Controller must be added to report Challenge');
  });

  it('validates the value with the type strategy', async () => {
    await expect(
      ctx.service.submit(makeChallenge({ resultType: 'count' }), 'p1', req({ value: -3 })),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('normalises the submission and echoes the challenge unit', async () => {
    await ctx.service.submit(
      makeChallenge({ resultType: 'count', resultUnit: 'reps' }),
      'p1',
      req({ value: '8', note: 'nice' }),
    );
    const [, userId, submission, resultState] = ctx.repo.submit.mock.calls[0];
    expect(userId).toBe('p1');
    expect(submission).toMatchObject({
      value: 8,
      unit: 'reps',
      note: 'nice',
      videoUrl: 'https://video.test/clip.mp4',
      arena: 'Home pitch',
      controllerRef: '#RefUsr123456',
      performedAt: '2026-08-30T10:00:00.000Z',
    });
    expect(submission).toHaveProperty('submittedAt');
    expect(resultState).toBe('completed');
  });

  it('persists the shareToFeed toggle (defaults to false)', async () => {
    await ctx.service.submit(makeChallenge(), 'p1', req({ value: 1, shareToFeed: true }));
    expect(ctx.repo.submit.mock.calls[0][2]).toMatchObject({ shareToFeed: true });

    await ctx.service.submit(makeChallenge(), 'p1', req({ value: 1 }));
    expect(ctx.repo.submit.mock.calls[1][2]).toMatchObject({ shareToFeed: false });
  });

  it('marks boolean=false as submitted (not completed)', async () => {
    await ctx.service.submit(makeChallenge({ resultType: 'boolean' }), 'p1', req({ value: false }));
    expect(ctx.repo.submit.mock.calls[0][3]).toBe('submitted');
  });

  it('ranker: higher_better orders desc, lower_better orders asc', async () => {
    const rows: RankInput[] = [
      { userId: 'a', displayName: 'A', handle: '#a', value: 10 },
      { userId: 'b', displayName: 'B', handle: '#b', value: 30 },
      { userId: 'c', displayName: 'C', handle: '#c', value: 20 },
    ];

    await ctx.service.submit(
      makeChallenge({ resultType: 'count', scoringDirection: 'higher_better' }),
      'a',
      req({ value: 1 }),
    );
    const higher = ctx.repo.submit.mock.calls[0][4](rows);
    expect(higher.map((r) => r.userId)).toEqual(['b', 'c', 'a']);
    expect(higher.map((r) => r.rank)).toEqual([1, 2, 3]);

    await ctx.service.submit(
      makeChallenge({ resultType: 'time', scoringDirection: 'lower_better' }),
      'a',
      req({ value: 1 }),
    );
    const lower = ctx.repo.submit.mock.calls[1][4](rows);
    expect(lower.map((r) => r.userId)).toEqual(['a', 'c', 'b']);
  });
});
