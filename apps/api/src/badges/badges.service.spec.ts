import { NotFoundException } from '@nestjs/common';
import type { Badge } from '@zporter/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadgesService } from './badges.service.js';
import type { BadgesRepository } from './badges.repository.js';

const BADGE: Badge = {
  id: 'sharp-shooter',
  name: 'Sharp Shooter',
  icon: '🎯',
  description: 'Nailed the target',
};

function build() {
  const repo = {
    list: vi.fn(async () => [BADGE]),
    findById: vi.fn(async (id: string) => (id === BADGE.id ? BADGE : null)),
  };
  return { service: new BadgesService(repo as unknown as BadgesRepository), repo };
}

describe('BadgesService', () => {
  let ctx: ReturnType<typeof build>;
  beforeEach(() => {
    ctx = build();
  });

  it('list passes through the repository', async () => {
    expect(await ctx.service.list()).toEqual([BADGE]);
  });

  it('require returns the badge when it exists', async () => {
    expect(await ctx.service.require('sharp-shooter')).toEqual(BADGE);
  });

  it('require 404s on a miss', async () => {
    await expect(ctx.service.require('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getById returns null on a miss (callers treat it as "no reward")', async () => {
    expect(await ctx.service.getById('nope')).toBeNull();
  });
});
