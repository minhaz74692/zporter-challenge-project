import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { IS_PUBLIC_KEY } from './decorators/public.decorator.js';
import { AuthController } from './auth.controller.js';
import type { AuthService } from './auth.service.js';

function build() {
  const auth = {
    signup: vi.fn().mockResolvedValue({ user: { id: 'u1' }, accessToken: 'a', refreshToken: 'r' }),
    login: vi.fn().mockResolvedValue({ user: { id: 'u1' }, accessToken: 'a', refreshToken: 'r' }),
    refresh: vi.fn().mockResolvedValue({ user: { id: 'u1' }, accessToken: 'a2', refreshToken: 'r2' }),
    logout: vi.fn().mockResolvedValue(undefined),
    me: vi.fn().mockResolvedValue({ id: 'u1', email: 'coach@zporter.test' }),
  };
  return { auth, controller: new AuthController(auth as unknown as AuthService) };
}

describe('AuthController', () => {
  it('signup forwards the DTO and the user-agent header', async () => {
    const { auth, controller } = build();
    await controller.signup({ email: 'a@b.co' } as never, 'vitest-agent');
    expect(auth.signup).toHaveBeenCalledWith({ email: 'a@b.co' }, 'vitest-agent');
  });

  it('login forwards the DTO and the user-agent header', async () => {
    const { auth, controller } = build();
    await controller.login({ email: 'a@b.co', password: 'x' } as never, 'agent');
    expect(auth.login).toHaveBeenCalledWith({ email: 'a@b.co', password: 'x' }, 'agent');
  });

  it('refresh unwraps refreshToken from the body', async () => {
    const { auth, controller } = build();
    await controller.refresh({ refreshToken: 'r1' });
    expect(auth.refresh).toHaveBeenCalledWith('r1');
  });

  it('logout pairs the current user id with the supplied refresh token', async () => {
    const { auth, controller } = build();
    await controller.logout({ refreshToken: 'r1' }, { userId: 'u9', role: 'player' });
    expect(auth.logout).toHaveBeenCalledWith('u9', 'r1');
  });

  it('me resolves the current user id', async () => {
    const { auth, controller } = build();
    await controller.me({ userId: 'u9', role: 'player' });
    expect(auth.me).toHaveBeenCalledWith('u9');
  });

  it('marks signup, login and refresh @Public() but not logout / me', () => {
    const isPublic = (fn: object) => Reflect.getMetadata(IS_PUBLIC_KEY, fn) === true;
    expect(isPublic(AuthController.prototype.signup)).toBe(true);
    expect(isPublic(AuthController.prototype.login)).toBe(true);
    expect(isPublic(AuthController.prototype.refresh)).toBe(true);
    expect(isPublic(AuthController.prototype.logout)).toBe(false);
    expect(isPublic(AuthController.prototype.me)).toBe(false);
  });
});
