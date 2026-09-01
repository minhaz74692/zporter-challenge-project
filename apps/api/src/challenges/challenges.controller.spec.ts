import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { ROLES_KEY } from '../auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { ChallengesController } from './challenges.controller.js';
import type { ChallengesService } from './challenges.service.js';

const player: AuthenticatedUser = { userId: 'player1', role: 'player' };
const coach: AuthenticatedUser = { userId: 'coach1', role: 'coach' };

function build() {
  const svc = {
    listByCategory: vi.fn().mockResolvedValue([]),
    listMine: vi.fn().mockResolvedValue([]),
    getDetail: vi.fn().mockResolvedValue({}),
    listParticipants: vi.fn().mockResolvedValue([]),
    leaderboard: vi.fn().mockResolvedValue([]),
    create: vi.fn().mockResolvedValue({ id: 'c1' }),
    update: vi.fn().mockResolvedValue({ id: 'c1' }),
    remove: vi.fn().mockResolvedValue(undefined),
    accept: vi.fn().mockResolvedValue({ id: 'player1' }),
    decline: vi.fn().mockResolvedValue({ id: 'player1' }),
    submitResult: vi.fn().mockResolvedValue({ id: 'player1' }),
    uploadResultVideo: vi.fn().mockResolvedValue({ videoUrl: 'https://v/x.mp4' }),
    invite: vi.fn().mockResolvedValue({ invited: 2 }),
    remindPending: vi.fn().mockResolvedValue({ reminded: 3 }),
    setCover: vi.fn().mockResolvedValue({ id: 'c1' }),
    addMedia: vi.fn().mockResolvedValue({ id: 'c1' }),
    setMedia: vi.fn().mockResolvedValue({ id: 'c1' }),
    removeMedia: vi.fn().mockResolvedValue({ id: 'c1' }),
  };
  return { svc, controller: new ChallengesController(svc as unknown as ChallengesService) };
}

describe('ChallengesController', () => {
  it('list maps the caller + category query to listByCategory', async () => {
    const { svc, controller } = build();
    await controller.list({ category: 'active' }, player);
    expect(svc.listByCategory).toHaveBeenCalledWith('player1', 'active');
  });

  it('mine lists the caller`s own challenges', async () => {
    const { svc, controller } = build();
    await controller.mine(coach);
    expect(svc.listMine).toHaveBeenCalledWith('coach1');
  });

  it('detail passes the whole authenticated user (needed for viewer participant)', async () => {
    const { svc, controller } = build();
    await controller.detail('c1', player);
    expect(svc.getDetail).toHaveBeenCalledWith('c1', player);
  });

  it('create / update / remove forward id, dto and user', async () => {
    const { svc, controller } = build();
    await controller.create({ title: 'x' } as never, coach);
    await controller.update('c1', { title: 'y' } as never, coach);
    await controller.remove('c1', coach);
    expect(svc.create).toHaveBeenCalledWith({ title: 'x' }, coach);
    expect(svc.update).toHaveBeenCalledWith('c1', { title: 'y' }, coach);
    expect(svc.remove).toHaveBeenCalledWith('c1', coach);
  });

  it('accept / decline forward the challenge id and caller', async () => {
    const { svc, controller } = build();
    await controller.accept('c1', player);
    await controller.decline('c1', player);
    expect(svc.accept).toHaveBeenCalledWith('c1', player);
    expect(svc.decline).toHaveBeenCalledWith('c1', player);
  });

  it('submitResult forwards id, caller, then dto', async () => {
    const { svc, controller } = build();
    await controller.submitResult('c1', { value: 10 } as never, player);
    expect(svc.submitResult).toHaveBeenCalledWith('c1', player, { value: 10 });
  });

  it('uploadResultVideo / setCover forward the uploaded file', async () => {
    const { svc, controller } = build();
    const file = { buffer: Buffer.from(''), mimetype: 'video/mp4', size: 1, originalname: 'v.mp4' };
    await controller.uploadResultVideo('c1', file, player);
    await controller.setCover('c1', { ...file, mimetype: 'image/png' }, coach);
    expect(svc.uploadResultVideo).toHaveBeenCalledWith('c1', player, file);
    expect(svc.setCover).toHaveBeenCalledWith('c1', coach, expect.objectContaining({ mimetype: 'image/png' }));
  });

  it('invite forwards id, dto and caller', async () => {
    const { svc, controller } = build();
    await controller.invite('c1', { userIds: ['p1'] }, coach);
    expect(svc.invite).toHaveBeenCalledWith('c1', { userIds: ['p1'] }, coach);
  });

  it('remind forwards the challenge id and caller', async () => {
    const { svc, controller } = build();
    await controller.remind('c1', coach);
    expect(svc.remindPending).toHaveBeenCalledWith('c1', coach);
  });

  it('media routes forward files, links, items and index', async () => {
    const { svc, controller } = build();
    const files = [{ buffer: Buffer.from(''), mimetype: 'image/png', size: 1, originalname: 'a' }];
    await controller.addMedia('c1', files, 'https://youtu.be/b1Dp2Yl3ARw', coach);
    expect(svc.addMedia).toHaveBeenCalledWith('c1', coach, files, ['https://youtu.be/b1Dp2Yl3ARw']);

    await controller.addMedia('c1', undefined, ['x', ' ', 'y'], coach);
    expect(svc.addMedia).toHaveBeenLastCalledWith('c1', coach, [], ['x', 'y']);

    await controller.setMedia('c1', { items: [{ url: 'u', type: 'image' }] }, coach);
    expect(svc.setMedia).toHaveBeenCalledWith('c1', coach, [{ url: 'u', type: 'image' }]);

    await controller.removeMedia('c1', 2, coach);
    expect(svc.removeMedia).toHaveBeenCalledWith('c1', coach, 2);
  });

  it('restricts create/update/remove/mine/invite/remind/cover to coach+admin, leaves player routes open', () => {
    const roles = (fn: object) => Reflect.getMetadata(ROLES_KEY, fn);
    expect(roles(ChallengesController.prototype.create)).toEqual(['coach', 'admin']);
    expect(roles(ChallengesController.prototype.update)).toEqual(['coach', 'admin']);
    expect(roles(ChallengesController.prototype.remove)).toEqual(['coach', 'admin']);
    expect(roles(ChallengesController.prototype.mine)).toEqual(['coach', 'admin']);
    expect(roles(ChallengesController.prototype.invite)).toEqual(['coach', 'admin']);
    expect(roles(ChallengesController.prototype.remind)).toEqual(['coach', 'admin']);
    expect(roles(ChallengesController.prototype.setCover)).toEqual(['coach', 'admin']);
    expect(roles(ChallengesController.prototype.addMedia)).toEqual(['coach', 'admin']);
    expect(roles(ChallengesController.prototype.setMedia)).toEqual(['coach', 'admin']);
    expect(roles(ChallengesController.prototype.removeMedia)).toEqual(['coach', 'admin']);
    expect(roles(ChallengesController.prototype.accept)).toBeUndefined();
    expect(roles(ChallengesController.prototype.list)).toBeUndefined();
  });
});
