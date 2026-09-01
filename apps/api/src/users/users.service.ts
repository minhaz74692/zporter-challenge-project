import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { SignupRequest, User, UserSummary } from '@zporter/shared';
import * as argon2 from 'argon2';
import { StorageService, type UploadedImage } from '../storage/storage.service.js';
import {
  toPublicUser,
  toUserSummary,
  type UserRecord,
} from './entities/user.entity.js';
import { UsersRepository } from './users.repository.js';

/** Object path for a user's single avatar (overwritten on re-upload). */
const avatarPath = (userId: string) => `avatars/${userId}`;

/** Optional profile fields the seed can supply; signup leaves them blank. */
export type UserProfileInput = Partial<
  Pick<UserRecord, 'avatarUrl' | 'country' | 'city' | 'club' | 'position'>
>;

/**
 * User lifecycle + password mechanics. Owns argon2id hashing/verification so
 * both `AuthModule` and the seed script go through one place.
 */
@Injectable()
export class UsersService {
  constructor(
    private readonly repo: UsersRepository,
    private readonly storage: StorageService,
  ) {}

  async create(
    input: SignupRequest,
    profile: UserProfileInput = {},
  ): Promise<UserRecord> {
    const email = normalizeEmail(input.email);
    if (await this.repo.findByEmail(email)) {
      throw new ConflictException('Email is already registered');
    }
    const displayName = input.displayName.trim();
    return this.repo.create({
      email,
      passwordHash: await argon2.hash(input.password, { type: argon2.argon2id }),
      displayName,
      role: input.role,
      handle: generateHandle(displayName),
      ...profile,
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

  /** Trimmed shape for embedding in challenge / participant / leaderboard rows. */
  async summaryById(id: string): Promise<UserSummary> {
    return toUserSummary(await this.getById(id));
  }

  /** Resolve a `#Handle` to a user summary, or `null` if no such user. */
  async summaryByHandle(handle: string): Promise<UserSummary | null> {
    const user = await this.repo.findByHandle(handle.trim());
    return user ? toUserSummary(user) : null;
  }

  async setAvatar(userId: string, image: UploadedImage): Promise<User> {
    await this.getById(userId); // 404 if the user is gone
    const url = await this.storage.uploadImage({
      buffer: image.buffer,
      mimeType: image.mimetype,
      path: avatarPath(userId),
    });
    await this.repo.setAvatarUrl(userId, url);
    return toPublicUser(await this.getById(userId));
  }

  async clearAvatar(userId: string): Promise<User> {
    await this.getById(userId);
    await this.storage.deleteObject(avatarPath(userId));
    await this.repo.clearAvatarUrl(userId);
    return toPublicUser(await this.getById(userId));
  }

  verifyPassword(record: UserRecord, plainPassword: string): Promise<boolean> {
    return argon2.verify(record.passwordHash, plainPassword);
  }

  search(query: string): Promise<UserRecord[]> {
    return this.repo.search(query);
  }

  /** Invite-picker search — trimmed shape, no email. */
  async searchSummaries(query: string): Promise<UserSummary[]> {
    const rows = await this.repo.search(query);
    return rows.map(toUserSummary);
  }

  /**
   * The caller's club-mates — the prototype's stand-in for "friends", used by
   * the player app to nominate a result controller. Empty if the user has no
   * club set.
   */
  async teammates(userId: string): Promise<UserSummary[]> {
    const me = await this.getById(userId);
    if (!me.club) return [];
    const mates = await this.repo.listByClub(me.club, userId);
    return mates.map(toUserSummary);
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** `#{First3}{First3}{6 digits}`, e.g. "Neo Jönsson" → `#NeoJon041872`. */
function generateHandle(displayName: string): string {
  const parts = displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p.replace(/[^A-Za-z]/g, ''));
  const first = (parts[0] ?? 'zpz').slice(0, 3);
  const last = (parts[1] ?? parts[0] ?? 'ply').slice(0, 3);
  const digits = Math.floor(100000 + Math.random() * 900000);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  return `#${cap(first)}${cap(last)}${digits}`;
}
