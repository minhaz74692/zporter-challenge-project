import { describe, expect, it, vi } from 'vitest';
import { DevicesController } from './devices.controller.js';
import type { DevicesService } from './devices.service.js';
import { NotificationsController } from './notifications.controller.js';
import type { NotificationsService } from './notifications.service.js';

describe('NotificationsController', () => {
  const build = () => {
    const svc = {
      listForUser: vi.fn().mockResolvedValue([]),
      markRead: vi.fn().mockResolvedValue(undefined),
    };
    return { svc, controller: new NotificationsController(svc as unknown as NotificationsService) };
  };

  it('list scopes notifications to the caller', async () => {
    const { svc, controller } = build();
    await controller.list({ userId: 'u1', role: 'player' });
    expect(svc.listForUser).toHaveBeenCalledWith('u1');
  });

  it('read passes the caller id first so ownership can be enforced', async () => {
    const { svc, controller } = build();
    await controller.read('n1', { userId: 'u1', role: 'player' });
    expect(svc.markRead).toHaveBeenCalledWith('u1', 'n1');
  });
});

describe('DevicesController', () => {
  it('register pairs the caller id with the registration DTO', async () => {
    const register = vi.fn().mockResolvedValue({ id: 'd1' });
    const controller = new DevicesController({ register } as unknown as DevicesService);
    await controller.register({ token: 't', platform: 'ios' }, { userId: 'u1', role: 'player' });
    expect(register).toHaveBeenCalledWith('u1', { token: 't', platform: 'ios' });
  });
});
