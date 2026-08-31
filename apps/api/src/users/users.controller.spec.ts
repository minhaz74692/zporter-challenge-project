import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { ROLES_KEY } from '../auth/decorators/roles.decorator.js';
import type { MulterFile } from '../storage/image-upload.pipe.js';
import { UsersController } from './users.controller.js';
import type { UsersService } from './users.service.js';

function build() {
  const svc = {
    searchSummaries: vi.fn().mockResolvedValue([]),
    setAvatar: vi.fn().mockResolvedValue({ id: 'u1' }),
    clearAvatar: vi.fn().mockResolvedValue({ id: 'u1' }),
  };
  return { svc, controller: new UsersController(svc as unknown as UsersService) };
}

const file: MulterFile = {
  buffer: Buffer.from('x'),
  mimetype: 'image/png',
  size: 1,
  originalname: 'a.png',
};

describe('UsersController', () => {
  it('search forwards the query string (defaulting to empty)', async () => {
    const { svc, controller } = build();
    await controller.search('nair');
    await controller.search();
    expect(svc.searchSummaries).toHaveBeenNthCalledWith(1, 'nair');
    expect(svc.searchSummaries).toHaveBeenNthCalledWith(2, '');
  });

  it('setAvatar / clearAvatar act on the current user id', async () => {
    const { svc, controller } = build();
    await controller.setAvatar(file, { userId: 'u9', role: 'player' });
    await controller.clearAvatar({ userId: 'u9', role: 'player' });
    expect(svc.setAvatar).toHaveBeenCalledWith('u9', file);
    expect(svc.clearAvatar).toHaveBeenCalledWith('u9');
  });

  it('restricts the invite-picker search to coach + admin', () => {
    expect(Reflect.getMetadata(ROLES_KEY, UsersController.prototype.search)).toEqual([
      'coach',
      'admin',
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, UsersController.prototype.setAvatar)).toBeUndefined();
  });
});
