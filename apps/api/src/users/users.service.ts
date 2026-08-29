import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { SignupRequest } from '@zporter/shared';
import * as argon2 from 'argon2';
import type { UserRecord } from './entities/user.entity.js';
import { UsersRepository } from './users.repository.js';

/**
 * User lifecycle + password mechanics. Owns argon2id hashing/verification so
 * both `AuthModule` and the seed script go through one place.
 */
@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  async create(input: SignupRequest): Promise<UserRecord> {
    const email = normalizeEmail(input.email);
    if (await this.repo.findByEmail(email)) {
      throw new ConflictException('Email is already registered');
    }
    return this.repo.create({
      email,
      passwordHash: await argon2.hash(input.password, { type: argon2.argon2id }),
      displayName: input.displayName.trim(),
      role: input.role,
    });
  }

  findByEmail(email: string): Promise<UserRecord | null> {
    return this.repo.findByEmail(normalizeEmail(email));
  }

  async getById(id: string): Promise<UserRecord> {
    const user = await this.repo.findById(id);
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  verifyPassword(record: UserRecord, plainPassword: string): Promise<boolean> {
    return argon2.verify(record.passwordHash, plainPassword);
  }

  search(query: string): Promise<UserRecord[]> {
    return this.repo.search(query);
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}
