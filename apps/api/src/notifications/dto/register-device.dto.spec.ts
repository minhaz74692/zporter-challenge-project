import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { RegisterDeviceDto } from './register-device.dto.js';

const errorProps = (dto: object) => validateSync(dto).map((e) => e.property);

describe('RegisterDeviceDto', () => {
  it('accepts a token with a known platform', () => {
    for (const platform of ['ios', 'android', 'web']) {
      expect(errorProps(plainToInstance(RegisterDeviceDto, { token: 'fcm-abc', platform }))).toEqual(
        [],
      );
    }
  });

  it('rejects an empty token', () => {
    expect(errorProps(plainToInstance(RegisterDeviceDto, { token: '', platform: 'ios' }))).toContain(
      'token',
    );
  });

  it('rejects an unknown platform', () => {
    expect(
      errorProps(plainToInstance(RegisterDeviceDto, { token: 'fcm-abc', platform: 'desktop' })),
    ).toContain('platform');
  });

  it('rejects a missing body', () => {
    expect(errorProps(plainToInstance(RegisterDeviceDto, {}))).toEqual(
      expect.arrayContaining(['token', 'platform']),
    );
  });
});
