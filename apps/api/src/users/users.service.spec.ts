import { ConflictException, NotFoundException } from '@nestjs/common';
import type { SignupRequest } from '@zporter/shared';
import * as argon2 from 'argon2';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { StorageService } from '../storage/storage.service.js';
import type { NewUser, UserRecord } from './entities/user.entity.js';
import { UsersService } from './users.service.js';
import type { UsersRepository } from './users.repository.js';

class FakeUsersRepository {
  private readonly rows = new Map<string, UserRecord>();

  async findById(id: string): Promise<UserRecord | null> {
    return this.rows.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    return [...this.rows.values()].find((u) => u.email === email) ?? null;
  }

  async create(data: NewUser): Promise<UserRecord> {
    const record: UserRecord = {
      id: `u_${this.rows.size + 1}`,
      createdAt: new Date().toISOString(),
      ...data,
    };
    this.rows.set(record.id, record);
    return record;
  }

  async setAvatarUrl(id: string, avatarUrl: string): Promise<void> {
    const row = this.rows.get(id);
    if (row) row.avatarUrl = avatarUrl;
  }

  async clearAvatarUrl(id: string): Promise<void> {
    const row = this.rows.get(id);
    if (row) delete row.avatarUrl;
  }

  async search(): Promise<UserRecord[]> {
    return [...this.rows.values()];
  }

  async listByClub(club: string, excludeId: string): Promise<UserRecord[]> {
    return [...this.rows.values()].filter(
      (u) => u.club === club && u.id !== excludeId,
    );
  }
}

const signup: SignupRequest = {
  email: '  Coach@Zporter.Test ',
  password: 'Passw0rd!',
  displayName: '  Coach Carter  ',
  role: 'coach',
};

describe('UsersService', () => {
  let service: UsersService;
  let storage: { uploadImage: ReturnType<typeof vi.fn>; deleteObject: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    storage = {
      uploadImage: vi.fn().mockResolvedValue('https://img.test/avatars/u_1'),
      deleteObject: vi.fn().mockResolvedValue(undefined),
    };
    service = new UsersService(
      new FakeUsersRepository() as unknown as UsersRepository,
      storage as unknown as StorageService,
    );
  });

  it('normalises email, trims name, and stores an argon2id hash (not the password)', async () => {
    const user = await service.create(signup);

    expect(user.email).toBe('coach@zporter.test');
    expect(user.displayName).toBe('Coach Carter');
    expect(user.passwordHash).not.toContain('Passw0rd!');
    expect(user.passwordHash.startsWith('$argon2id$')).toBe(true);
    await expect(argon2.verify(user.passwordHash, 'Passw0rd!')).resolves.toBe(true);
  });

  it('rejects a duplicate email regardless of casing/whitespace', async () => {
    await service.create(signup);
    await expect(
      service.create({ ...signup, email: 'coach@zporter.test' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('verifyPassword is true only for the right password', async () => {
    const user = await service.create(signup);
    await expect(service.verifyPassword(user, 'Passw0rd!')).resolves.toBe(true);
    await expect(service.verifyPassword(user, 'wrong')).resolves.toBe(false);
  });

  it('getById throws NotFound for an unknown id', async () => {
    await expect(service.getById('nope')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('setAvatar uploads to a per-user path and stores the returned URL', async () => {
    const user = await service.create(signup);
    const updated = await service.setAvatar(user.id, {
      buffer: Buffer.from('img'),
      mimetype: 'image/png',
    });

    expect(storage.uploadImage).toHaveBeenCalledWith(
      expect.objectContaining({ path: `avatars/${user.id}`, mimeType: 'image/png' }),
    );
    expect(updated.avatarUrl).toBe('https://img.test/avatars/u_1');
  });

  it('clearAvatar deletes the object and drops the URL', async () => {
    const user = await service.create(signup);
    await service.setAvatar(user.id, { buffer: Buffer.from('x'), mimetype: 'image/png' });

    const cleared = await service.clearAvatar(user.id);
    expect(storage.deleteObject).toHaveBeenCalledWith(`avatars/${user.id}`);
    expect(cleared.avatarUrl).toBeUndefined();
  });

  it('setAvatar rejects an unknown user before touching storage', async () => {
    await expect(
      service.setAvatar('ghost', { buffer: Buffer.from('x'), mimetype: 'image/png' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(storage.uploadImage).not.toHaveBeenCalled();
  });

  it('teammates returns same-club users minus the caller, no email', async () => {
    const me = await service.create({ ...signup, email: 'a@z.test' }, { club: 'Maj FC' });
    const mate = await service.create(
      { ...signup, email: 'b@z.test', displayName: 'Priya Nair' },
      { club: 'Maj FC' },
    );
    await service.create(
      { ...signup, email: 'c@z.test', displayName: 'Sam Silva' },
      { club: 'Ope IF' },
    );

    const mates = await service.teammates(me.id);
    expect(mates.map((m) => m.id)).toEqual([mate.id]);
    expect(mates[0]).not.toHaveProperty('email');
  });

  it('teammates is empty when the caller has no club', async () => {
    const me = await service.create({ ...signup, email: 'd@z.test' });
    expect(await service.teammates(me.id)).toEqual([]);
  });
});
