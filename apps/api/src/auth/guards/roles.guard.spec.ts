import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import type { UserRole } from '@zporter/shared';
import { describe, expect, it } from 'vitest';
import type { AuthenticatedUser } from '../types.js';
import { RolesGuard } from './roles.guard.js';

function contextWith(user: AuthenticatedUser | undefined): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

function guardFor(roles: UserRole[] | undefined) {
  const reflector = new Reflector();
  reflector.getAllAndOverride = (() => roles) as typeof reflector.getAllAndOverride;
  return new RolesGuard(reflector);
}

const player: AuthenticatedUser = { userId: 'u1', role: 'player' };
const coach: AuthenticatedUser = { userId: 'u2', role: 'coach' };

describe('RolesGuard', () => {
  it('allows a route with no @Roles metadata', () => {
    expect(guardFor(undefined).canActivate(contextWith(player))).toBe(true);
  });

  it('allows a route with an empty @Roles list', () => {
    expect(guardFor([]).canActivate(contextWith(player))).toBe(true);
  });

  it('allows a user whose role is in the list', () => {
    expect(guardFor(['coach', 'admin']).canActivate(contextWith(coach))).toBe(true);
  });

  it('blocks a user whose role is not in the list', () => {
    expect(guardFor(['coach', 'admin']).canActivate(contextWith(player))).toBe(false);
  });

  it('blocks an unauthenticated request even when roles are required', () => {
    expect(guardFor(['coach']).canActivate(contextWith(undefined))).toBe(false);
  });
});
