import { describe, expect, it, vi } from 'vitest';
import type { AuthenticatedUser } from '../auth/types.js';
import { FeedController } from './feed.controller.js';
import type { FeedService } from './feed.service.js';

const USER: AuthenticatedUser = { userId: 'u1', role: 'player' };

function build() {
  const svc = {
    list: vi.fn().mockResolvedValue([]),
    like: vi.fn().mockResolvedValue({ likeCount: 1, liked: true }),
    unlike: vi.fn().mockResolvedValue({ likeCount: 0, liked: false }),
    save: vi.fn().mockResolvedValue({ saved: true }),
    unsave: vi.fn().mockResolvedValue({ saved: false }),
  };
  return { svc, controller: new FeedController(svc as unknown as FeedService) };
}

describe('FeedController', () => {
  it('list forwards the tab and scopes to the caller', async () => {
    const { svc, controller } = build();
    await controller.list({ tab: 'team' }, USER);
    expect(svc.list).toHaveBeenCalledWith('team', 'u1');
  });

  it('like / unlike pair the post id with the caller', async () => {
    const { svc, controller } = build();
    await controller.like('p1', USER);
    await controller.unlike('p1', USER);
    expect(svc.like).toHaveBeenCalledWith('p1', 'u1');
    expect(svc.unlike).toHaveBeenCalledWith('p1', 'u1');
  });

  it('save / unsave pair the post id with the caller', async () => {
    const { svc, controller } = build();
    await controller.save('p1', USER);
    await controller.unsave('p1', USER);
    expect(svc.save).toHaveBeenCalledWith('p1', 'u1');
    expect(svc.unsave).toHaveBeenCalledWith('p1', 'u1');
  });
});
