import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { IS_PUBLIC_KEY, Public } from './public.decorator.js';
import { ROLES_KEY, Roles } from './roles.decorator.js';

describe('@Public()', () => {
  it('sets the isPublic metadata flag to true on the target', () => {
    class Target {
      @Public()
      handler() {}
    }
    expect(Reflect.getMetadata(IS_PUBLIC_KEY, Target.prototype.handler)).toBe(true);
    expect(IS_PUBLIC_KEY).toBe('isPublic');
  });
});

describe('@Roles()', () => {
  it('stores the exact role list under the roles metadata key', () => {
    class Target {
      @Roles('coach', 'admin')
      handler() {}
    }
    expect(Reflect.getMetadata(ROLES_KEY, Target.prototype.handler)).toEqual(['coach', 'admin']);
    expect(ROLES_KEY).toBe('roles');
  });

  it('stores an empty list when called with no roles', () => {
    class Target {
      @Roles()
      handler() {}
    }
    expect(Reflect.getMetadata(ROLES_KEY, Target.prototype.handler)).toEqual([]);
  });
});
