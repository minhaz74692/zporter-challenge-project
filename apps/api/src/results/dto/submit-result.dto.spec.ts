import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { SubmitResultDto } from './submit-result.dto.js';

const errorProps = (dto: object) => validateSync(dto).map((e) => e.property);

const VALID = {
  value: 12,
  videoUrl: 'https://storage.test/v.mp4',
  performedAt: '2026-01-01T10:00:00.000Z',
  controllerRef: '#CoachRef',
};

describe('SubmitResultDto', () => {
  it('accepts a well-formed submission', () => {
    expect(errorProps(plainToInstance(SubmitResultDto, VALID))).toEqual([]);
  });

  it('accepts a boolean or string value (per-resultType checking is in the service)', () => {
    expect(errorProps(plainToInstance(SubmitResultDto, { ...VALID, value: true }))).toEqual([]);
    expect(errorProps(plainToInstance(SubmitResultDto, { ...VALID, value: 'false' }))).toEqual([]);
  });

  it('rejects a missing value (IsDefined)', () => {
    const { value: _omit, ...rest } = VALID;
    expect(errorProps(plainToInstance(SubmitResultDto, rest))).toContain('value');
  });

  it('rejects a non-ISO performedAt', () => {
    expect(
      errorProps(plainToInstance(SubmitResultDto, { ...VALID, performedAt: 'yesterday' })),
    ).toContain('performedAt');
  });

  it('enforces maxLength on arena (200) and note (500)', () => {
    const dto = plainToInstance(SubmitResultDto, {
      ...VALID,
      arena: 'a'.repeat(201),
      note: 'n'.repeat(501),
    });
    expect(errorProps(dto)).toEqual(expect.arrayContaining(['arena', 'note']));
  });

  it('allows videoUrl / controllerRef to be omitted at the DTO layer (service enforces them)', () => {
    const { videoUrl: _v, controllerRef: _c, ...rest } = VALID;
    expect(errorProps(plainToInstance(SubmitResultDto, rest))).toEqual([]);
  });
});
