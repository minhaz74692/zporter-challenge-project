import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { ROLES_KEY } from '../auth/decorators/roles.decorator.js';
import { TeamsController } from './teams.controller.js';
import type { TeamsService } from './teams.service.js';

function build() {
  const svc = {
    listForCoach: vi.fn().mockResolvedValue([]),
    listMembers: vi.fn().mockResolvedValue([]),
  };
  return { svc, controller: new TeamsController(svc as unknown as TeamsService) };
}

describe('TeamsController', () => {
  it('list scopes squads to the calling coach', async () => {
    const { svc, controller } = build();
    await controller.list({ userId: 'coach1', role: 'coach' });
    expect(svc.listForCoach).toHaveBeenCalledWith('coach1');
  });

  it('members passes the team id and the caller for the ownership check', async () => {
    const { svc, controller } = build();
    await controller.members('team1', { userId: 'coach1', role: 'coach' });
    expect(svc.listMembers).toHaveBeenCalledWith('team1', 'coach1');
  });

  it('applies the coach/admin role restriction at the controller class level', () => {
    expect(Reflect.getMetadata(ROLES_KEY, TeamsController)).toEqual(['coach', 'admin']);
  });
});
