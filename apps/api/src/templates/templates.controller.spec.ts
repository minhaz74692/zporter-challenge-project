import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { ROLES_KEY } from '../auth/decorators/roles.decorator.js';
import { TemplatesController } from './templates.controller.js';
import type { TemplatesService } from './templates.service.js';

function build() {
  const svc = {
    list: vi.fn().mockResolvedValue([]),
    getById: vi.fn().mockResolvedValue({ id: 't1' }),
    create: vi.fn().mockResolvedValue({ id: 't1' }),
  };
  return { svc, controller: new TemplatesController(svc as unknown as TemplatesService) };
}

describe('TemplatesController', () => {
  it('list passes the caller id and the mine flag', async () => {
    const { svc, controller } = build();
    await controller.list({ mine: true }, { userId: 'coach1', role: 'coach' });
    expect(svc.list).toHaveBeenCalledWith('coach1', true);
  });

  it('get resolves a template by id (no auth scoping)', async () => {
    const { svc, controller } = build();
    await controller.get('t1');
    expect(svc.getById).toHaveBeenCalledWith('t1');
  });

  it('create forwards the dto and the creator id', async () => {
    const { svc, controller } = build();
    await controller.create({ title: 'X' } as never, { userId: 'coach1', role: 'coach' });
    expect(svc.create).toHaveBeenCalledWith({ title: 'X' }, 'coach1');
  });

  it('restricts create to coach + admin only', () => {
    expect(Reflect.getMetadata(ROLES_KEY, TemplatesController.prototype.create)).toEqual([
      'coach',
      'admin',
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, TemplatesController.prototype.list)).toBeUndefined();
  });
});
