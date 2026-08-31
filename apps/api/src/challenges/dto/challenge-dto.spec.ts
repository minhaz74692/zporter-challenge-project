import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateChallengeDto } from './create-challenge.dto.js';
import { InviteDto } from './invite.dto.js';
import { ListChallengesQuery } from './list-challenges.query.js';
import { UpdateChallengeDto } from './update-challenge.dto.js';

const errorProps = (dto: object) => validateSync(dto).map((e) => e.property);

const DATES = { startAt: '2099-01-01T00:00:00.000Z', deadline: '2099-02-01T00:00:00.000Z' };

describe('CreateChallengeDto', () => {
  it('accepts a bare template copy with just the two required dates', () => {
    expect(errorProps(plainToInstance(CreateChallengeDto, { ...DATES, templateId: 't1' }))).toEqual(
      [],
    );
  });

  it('requires startAt and deadline', () => {
    expect(errorProps(plainToInstance(CreateChallengeDto, {}))).toEqual(
      expect.arrayContaining(['startAt', 'deadline']),
    );
  });

  it('rejects a non-ISO date', () => {
    expect(
      errorProps(plainToInstance(CreateChallengeDto, { ...DATES, startAt: '01/01/2099' })),
    ).toContain('startAt');
  });

  it('rejects an out-of-enum mainCategory / resultType / visibility / location', () => {
    const dto = plainToInstance(CreateChallengeDto, {
      ...DATES,
      mainCategory: 'nutrition',
      resultType: 'vibes',
      visibility: 'public',
      location: 'moon',
    });
    expect(errorProps(dto)).toEqual(
      expect.arrayContaining(['mainCategory', 'resultType', 'visibility', 'location']),
    );
  });

  it('accepts every valid visibility value', () => {
    for (const visibility of ['private', 'friends', 'fans', 'all']) {
      expect(
        errorProps(plainToInstance(CreateChallengeDto, { ...DATES, templateId: 't', visibility })),
      ).toEqual([]);
    }
  });

  it('rejects a title over 40 chars and a description over 4000 chars', () => {
    const dto = plainToInstance(CreateChallengeDto, {
      ...DATES,
      title: 'x'.repeat(41),
      description: 'y'.repeat(4001),
    });
    expect(errorProps(dto)).toEqual(expect.arrayContaining(['title', 'description']));
  });

  it('rejects negative points and a sub-1 duration', () => {
    const dto = plainToInstance(CreateChallengeDto, {
      ...DATES,
      rewardPoints: -5,
      pointsToParticipate: -1,
      durationMinutes: 0,
    });
    expect(errorProps(dto)).toEqual(
      expect.arrayContaining(['rewardPoints', 'pointsToParticipate', 'durationMinutes']),
    );
  });

  it('rejects a non-string entry inside collections / equipmentTags / invitedUserIds', () => {
    const dto = plainToInstance(CreateChallengeDto, {
      ...DATES,
      collections: ['ok', 3],
      equipmentTags: [true],
      invitedUserIds: [{}],
    });
    expect(errorProps(dto)).toEqual(
      expect.arrayContaining(['collections', 'equipmentTags', 'invitedUserIds']),
    );
  });
});

describe('UpdateChallengeDto (PartialType)', () => {
  it('accepts an empty patch', () => {
    expect(errorProps(plainToInstance(UpdateChallengeDto, {}))).toEqual([]);
  });

  it('still enforces field rules when a field is present', () => {
    expect(errorProps(plainToInstance(UpdateChallengeDto, { visibility: 'nope' }))).toContain(
      'visibility',
    );
  });
});

describe('InviteDto', () => {
  it('accepts a userIds-only body', () => {
    expect(errorProps(plainToInstance(InviteDto, { userIds: ['p1', 'p2'] }))).toEqual([]);
  });

  it('accepts a teamId-only body', () => {
    expect(errorProps(plainToInstance(InviteDto, { teamId: 'team1' }))).toEqual([]);
  });

  it('rejects an empty userIds array (ArrayNotEmpty)', () => {
    expect(errorProps(plainToInstance(InviteDto, { userIds: [] }))).toContain('userIds');
  });

  it('rejects non-string ids', () => {
    expect(errorProps(plainToInstance(InviteDto, { userIds: [1, 2] }))).toContain('userIds');
  });
});

describe('ListChallengesQuery', () => {
  it('accepts each of the five player categories', () => {
    for (const category of ['new', 'active', 'done', 'declined', 'ended']) {
      expect(errorProps(plainToInstance(ListChallengesQuery, { category }))).toEqual([]);
    }
  });

  it('rejects a missing or unknown category', () => {
    expect(errorProps(plainToInstance(ListChallengesQuery, {}))).toContain('category');
    expect(errorProps(plainToInstance(ListChallengesQuery, { category: 'archived' }))).toContain(
      'category',
    );
  });
});
