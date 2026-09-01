import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Team, TeamMember, UserSummary } from '@zporter/shared';
import { beforeEach, describe, expect, it } from 'vitest';
import type { UsersService } from '../users/users.service.js';
import type { TeamsRepository } from './teams.repository.js';
import { TeamsService } from './teams.service.js';

const TEAM: Team = {
  id: 'team1',
  name: 'Falcons',
  coachId: 'coach1',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const TEAM2: Team = {
  id: 'team2',
  name: 'Strikers',
  coachId: 'coach1',
  createdAt: '2026-01-01T00:00:00.000Z',
};

const MEMBERS: Record<string, TeamMember[]> = {
  team1: [
    { userId: 'coach1', teamId: 'team1', role: 'coach', joinedAt: TEAM.createdAt },
    { userId: 'p1', teamId: 'team1', role: 'player', joinedAt: TEAM.createdAt },
    { userId: 'p2', teamId: 'team1', role: 'player', joinedAt: TEAM.createdAt },
  ],
  team2: [
    { userId: 'coach1', teamId: 'team2', role: 'coach', joinedAt: TEAM.createdAt },
    { userId: 'p3', teamId: 'team2', role: 'player', joinedAt: TEAM.createdAt },
  ],
};

class FakeTeamsRepository {
  readonly created: { name: string; coachId: string }[] = [];
  readonly members: { teamId: string; userId: string; role: string }[] = [];

  async findById(id: string): Promise<Team | null> {
    return { team1: TEAM, team2: TEAM2 }[id] ?? null;
  }
  async listByCoach(coachId: string): Promise<Team[]> {
    return coachId === 'coach1' ? [TEAM, TEAM2] : [];
  }
  async listAll(): Promise<Team[]> {
    return [TEAM, TEAM2];
  }
  async listMembers(teamId: string): Promise<TeamMember[]> {
    return MEMBERS[teamId] ?? [];
  }
  async create(input: { name: string; coachId: string }): Promise<Team> {
    this.created.push(input);
    return { ...TEAM, id: 'new-team', name: input.name, coachId: input.coachId };
  }
  async addMember(
    teamId: string,
    member: { userId: string; role: string },
  ): Promise<void> {
    this.members.push({ teamId, ...member });
  }
}

const usersStub = {
  summaryById: async (id: string): Promise<UserSummary> => ({
    id,
    displayName: id === 'coach1' ? 'Carl Carter' : id,
    handle: `#${id}`,
  }),
} as unknown as UsersService;

describe('TeamsService', () => {
  let repo: FakeTeamsRepository;
  let service: TeamsService;

  beforeEach(() => {
    repo = new FakeTeamsRepository();
    service = new TeamsService(repo as unknown as TeamsRepository, usersStub);
  });

  it('lists the coach`s own squads', async () => {
    expect(await service.listForCoach('coach1')).toEqual([TEAM, TEAM2]);
    expect(await service.listForCoach('coach2')).toEqual([]);
  });

  it('returns members to the owning coach', async () => {
    expect(await service.listMembers('team1', 'coach1')).toHaveLength(3);
  });

  it('createForCoach writes the squad and the coach member row', async () => {
    const team = await service.createForCoach('coach1', '  Maj FC  ');
    expect(repo.created).toEqual([{ name: 'Maj FC', coachId: 'coach1' }]);
    expect(repo.members).toContainEqual({
      teamId: team.id,
      userId: 'coach1',
      role: 'coach',
    });
  });

  it('addPlayer joins an existing squad', async () => {
    await service.addPlayer('p9', 'team1');
    expect(repo.members).toContainEqual({
      teamId: 'team1',
      userId: 'p9',
      role: 'player',
    });
  });

  it('addPlayer rejects an unknown team', async () => {
    await expect(service.addPlayer('p9', 'ghost')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('listDirectory resolves the coach name', async () => {
    expect(await service.listDirectory()).toEqual([
      { id: 'team1', name: 'Falcons', coachName: 'Carl Carter' },
      { id: 'team2', name: 'Strikers', coachName: 'Carl Carter' },
    ]);
  });

  it('invitableMemberIds drops the coach, for the invite fan-out', async () => {
    expect(await service.invitableMemberIds('team1', 'coach1')).toEqual(['p1', 'p2']);
  });

  it('squadPlayerIds unions every member across the coach`s squads', async () => {
    const ids = await service.squadPlayerIds('coach1');
    expect([...ids].sort()).toEqual(['coach1', 'p1', 'p2', 'p3']);
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
