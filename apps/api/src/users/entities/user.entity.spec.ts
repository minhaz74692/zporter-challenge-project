import { describe, expect, it } from 'vitest';
import { toPublicUser, toUserSummary, type UserRecord } from './user.entity.js';

const record: UserRecord = {
  id: 'u1',
  email: 'coach@zporter.test',
  passwordHash: '$argon2id$secret',
  displayName: 'Coach Carter',
  role: 'coach',
  handle: '#CoaCar1',
  avatarUrl: 'https://x/a.png',
  country: 'SE',
  city: 'Malmö',
  club: 'Maj FC',
  position: 'FW',
  createdAt: '2020-01-01T00:00:00.000Z',
};

describe('toPublicUser', () => {
  it('strips the password hash and keeps every other field', () => {
    const pub = toPublicUser(record);
    expect(pub).not.toHaveProperty('passwordHash');
    expect(pub).toMatchObject({
      id: 'u1',
      email: 'coach@zporter.test',
      role: 'coach',
      handle: '#CoaCar1',
      club: 'Maj FC',
    });
  });
});

describe('toUserSummary', () => {
  it('projects only the invite-picker fields', () => {
    expect(toUserSummary(record)).toEqual({
      id: 'u1',
      displayName: 'Coach Carter',
      handle: '#CoaCar1',
      avatarUrl: 'https://x/a.png',
      country: 'SE',
      city: 'Malmö',
      club: 'Maj FC',
      position: 'FW',
    });
  });

  it('passes undefined optionals through', () => {
    const summary = toUserSummary({ ...record, avatarUrl: undefined, club: undefined });
    expect(summary.avatarUrl).toBeUndefined();
    expect(summary.club).toBeUndefined();
  });
});
