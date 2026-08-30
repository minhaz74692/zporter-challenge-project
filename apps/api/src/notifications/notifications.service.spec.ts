import type { AppNotification } from '@zporter/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FirebaseService } from '../firebase/firebase.service.js';
import type { DevicesRepository } from './devices.repository.js';
import type { NewNotification } from './entities/notification.entity.js';
import type { NotificationsRepository } from './notifications.repository.js';
import { NotificationsService } from './notifications.service.js';

const PAYLOAD: NewNotification = {
  userId: 'u1',
  type: 'challenge_invite',
  title: 'You have a new challenge',
  body: 'Keepie-Uppies Century',
  challengeId: 'c1',
};

const SAVED: AppNotification = { ...PAYLOAD, id: 'n1', read: false, createdAt: '2026-01-01T00:00:00.000Z' };

function build() {
  const repo = { create: vi.fn().mockResolvedValue(SAVED) };
  const devices = { tokensForUser: vi.fn().mockResolvedValue(['tokA', 'tokB']) };
  const sendEachForMulticast = vi.fn().mockResolvedValue({ successCount: 2, failureCount: 0 });
  const firebase = { messaging: { sendEachForMulticast } } as unknown as FirebaseService;
  const service = new NotificationsService(
    repo as unknown as NotificationsRepository,
    devices as unknown as DevicesRepository,
    firebase,
  );
  return { service, repo, devices, sendEachForMulticast };
}

describe('NotificationsService.notify', () => {
  let ctx: ReturnType<typeof build>;
  beforeEach(() => {
    ctx = build();
  });

  it('persists the notification and pushes to every device token', async () => {
    await ctx.service.notify(PAYLOAD);
    expect(ctx.repo.create).toHaveBeenCalledWith(PAYLOAD);
    expect(ctx.sendEachForMulticast).toHaveBeenCalledWith(
      expect.objectContaining({
        tokens: ['tokA', 'tokB'],
        notification: { title: PAYLOAD.title, body: PAYLOAD.body },
        data: { type: 'challenge_invite', challengeId: 'c1' },
      }),
    );
  });

  it('skips the push when the user has no registered devices', async () => {
    ctx.devices.tokensForUser.mockResolvedValue([]);
    await ctx.service.notify(PAYLOAD);
    expect(ctx.sendEachForMulticast).not.toHaveBeenCalled();
  });

  it('never throws when FCM fails', async () => {
    ctx.sendEachForMulticast.mockRejectedValue(new Error('FCM down'));
    await expect(ctx.service.notify(PAYLOAD)).resolves.toBeUndefined();
  });

  it('never throws when persistence fails', async () => {
    ctx.repo.create.mockRejectedValue(new Error('firestore down'));
    await expect(ctx.service.notify(PAYLOAD)).resolves.toBeUndefined();
    expect(ctx.sendEachForMulticast).not.toHaveBeenCalled();
  });
});
