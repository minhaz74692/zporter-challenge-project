import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Team, TeamMember } from '@zporter/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import type { TeamsRepository } from './teams.repository.js';
import { TeamsService } from './teams.service.js';

const TEAM: Team = {
  id: 'team1',
  name: 'Falcons',
  coachId: 'coach1',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const MEMBERS: TeamMember[] = [
  { userId: 'coach1', teamId: 'team1', role: 'coach', joinedAt: TEAM.createdAt },
  { userId: 'p1', teamId: 'team1', role: 'player', joinedAt: TEAM.createdAt },
  { userId: 'p2', teamId: 'team1', role: 'player', joinedAt: TEAM.createdAt },
];

class FakeTeamsRepository {
  async findById(id: string): Promise<Team | null> {
    return id === TEAM.id ? TEAM : null;
  }
  async listByCoach(coachId: string): Promise<Team[]> {
    return coachId === TEAM.coachId ? [TEAM] : [];
  }
  async listMembers(teamId: string): Promise<TeamMember[]> {
    return teamId === TEAM.id ? MEMBERS : [];
  }
}

describe('TeamsService', () => {
  let service: TeamsService;

  beforeEach(() => {
    service = new TeamsService(new FakeTeamsRepository() as unknown as TeamsRepository);
  });

  it('lists the coach`s own squads', async () => {
    expect(await service.listForCoach('coach1')).toEqual([TEAM]);
    expect(await service.listForCoach('coach2')).toEqual([]);
  });

  it('returns members to the owning coach', async () => {
    expect(await service.listMembers('team1', 'coach1')).toHaveLength(3);
  });

  it('memberUserIds returns just the ids, for the invite fan-out', async () => {
    expect(await service.memberUserIds('team1', 'coach1')).toEqual(['coach1', 'p1', 'p2']);
  });

  it('rejects a non-owner with Forbidden', async () => {
    await expect(service.listMembers('team1', 'coach2')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('throws NotFound for a missing team', async () => {
    await expect(service.listMembers('ghost', 'coach1')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
