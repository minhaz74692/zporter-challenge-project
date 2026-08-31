import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { LoginDto } from './login.dto.js';
import { RefreshDto } from './refresh.dto.js';
import { SignupDto } from './signup.dto.js';

const errorProps = (dto: object) => validateSync(dto).map((e) => e.property);

describe('SignupDto', () => {
  const valid = {
    email: 'coach@zporter.test',
    password: 'Passw0rd!',
    displayName: 'Coach Carter',
    role: 'coach',
  };

  it('passes a well-formed signup body', () => {
    expect(errorProps(plainToInstance(SignupDto, valid))).toEqual([]);
  });

  it('rejects a malformed email', () => {
    expect(errorProps(plainToInstance(SignupDto, { ...valid, email: 'not-an-email' }))).toContain(
      'email',
    );
  });

  it('rejects a password shorter than 8 characters', () => {
    expect(errorProps(plainToInstance(SignupDto, { ...valid, password: 'short' }))).toContain(
      'password',
    );
  });

  it('rejects a password longer than 128 characters', () => {
    expect(
      errorProps(plainToInstance(SignupDto, { ...valid, password: 'a'.repeat(129) })),
    ).toContain('password');
  });

  it('rejects an empty displayName', () => {
    expect(errorProps(plainToInstance(SignupDto, { ...valid, displayName: '' }))).toContain(
      'displayName',
    );
  });

  it('rejects self-service signup as admin (only player/coach allowed)', () => {
    expect(errorProps(plainToInstance(SignupDto, { ...valid, role: 'admin' }))).toContain('role');
  });
});

describe('LoginDto', () => {
  it('requires an email and a non-empty password', () => {
    expect(errorProps(plainToInstance(LoginDto, {}))).toEqual(
      expect.arrayContaining(['email', 'password']),
    );
  });

  it('accepts any non-empty password (no length rule on login)', () => {
    expect(
      errorProps(plainToInstance(LoginDto, { email: 'a@b.co', password: 'x' })),
    ).toEqual([]);
  });
});

describe('RefreshDto', () => {
  it('requires a non-empty refreshToken string', () => {
    expect(errorProps(plainToInstance(RefreshDto, { refreshToken: '' }))).toContain('refreshToken');
    expect(errorProps(plainToInstance(RefreshDto, {}))).toContain('refreshToken');
  });

  it('accepts a present token', () => {
    expect(errorProps(plainToInstance(RefreshDto, { refreshToken: 'u.s.secret' }))).toEqual([]);
  });
});
