import { Reflector } from '@nestjs/core';
import type { ExecutionContext } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

const handler = () => undefined;
class Ctrl {}

function context(): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => Ctrl,
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  it('returns true for a @Public() route and never runs passport auth', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(true) } as unknown as Reflector;
    const guard = new JwtAuthGuard(reflector);
    const superSpy = vi
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockReturnValue(false);

    expect(guard.canActivate(context())).toBe(true);
    expect(superSpy).not.toHaveBeenCalled();
    superSpy.mockRestore();
  });

  it('reads the public flag off both the handler and the controller class', () => {
    const reflector = { getAllAndOverride: vi.fn().mockReturnValue(true) } as unknown as Reflector;
    new JwtAuthGuard(reflector).canActivate(context());
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [handler, Ctrl]);
  });

  it('delegates to the passport AuthGuard when the route is not public', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new JwtAuthGuard(reflector);
    const superSpy = vi
      .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
      .mockReturnValue('delegated' as unknown as boolean);

    expect(guard.canActivate(context())).toBe('delegated' as unknown as boolean);
    expect(superSpy).toHaveBeenCalledOnce();
    superSpy.mockRestore();
  });
});
