import { describe, expect, it, vi } from 'vitest';
import type { DevicesRepository } from './devices.repository.js';
import { DevicesService } from './devices.service.js';

describe('DevicesService', () => {
  it('trims the token and forwards userId + platform to the repository upsert', async () => {
    const upsert = vi.fn().mockResolvedValue({ id: 'd1' });
    const service = new DevicesService({ upsert } as unknown as DevicesRepository);

    await service.register('user1', { token: '  fcm-token  ', platform: 'ios' });

    expect(upsert).toHaveBeenCalledWith('user1', 'fcm-token', 'ios');
  });

  it('returns the record the repository produced', async () => {
    const record = { id: 'd1', userId: 'user1', fcmToken: 'fcm-token', platform: 'android' };
    const service = new DevicesService({
      upsert: vi.fn().mockResolvedValue(record),
    } as unknown as DevicesRepository);

    await expect(
      service.register('user1', { token: 'fcm-token', platform: 'android' }),
    ).resolves.toBe(record);
  });
});
