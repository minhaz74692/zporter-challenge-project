import { ConflictException, NotFoundException } from '@nestjs/common';
import type { SignupRequest } from '@zporter/shared';
import * as argon2 from 'argon2';
import { beforeEach, describe, expect, it } from 'vitest';
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

  async search(): Promise<UserRecord[]> {
    return [...this.rows.values()];
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

  beforeEach(() => {
    service = new UsersService(new FakeUsersRepository() as unknown as UsersRepository);
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
});
