import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Team, TeamMember, TeamSummary } from '@zporter/shared';
import { UsersService } from '../users/users.service.js';
import { TeamsRepository } from './teams.repository.js';

@Injectable()
export class TeamsService {
  constructor(
    private readonly repo: TeamsRepository,
    private readonly users: UsersService,
  ) {}

  listForCoach(coachId: string): Promise<Team[]> {
    return this.repo.listByCoach(coachId);
  }

  /** Coach signup: create the squad and add the coach as its first member. */
  async createForCoach(coachId: string, name: string): Promise<Team> {
    const team = await this.repo.create({ name: name.trim(), coachId });
    await this.repo.addMember(team.id, { userId: coachId, role: 'coach' });
    return team;
  }

  /** Player signup: join an existing squad. */
  async addPlayer(userId: string, teamId: string): Promise<void> {
    await this.requireTeam(teamId);
    await this.repo.addMember(teamId, { userId, role: 'player' });
  }

  /** Public squad list for the player signup picker. */
  async listDirectory(): Promise<TeamSummary[]> {
    const teams = await this.repo.listAll();
    return Promise.all(
      teams.map(async (team) => {
        const coach = await this.users
          .summaryById(team.coachId)
          .catch(() => null);
        return { id: team.id, name: team.name, coachName: coach?.displayName ?? '' };
      }),
    );
  }

  /** Members of a squad the caller coaches. */
  async listMembers(teamId: string, requesterId: string): Promise<TeamMember[]> {
    await this.assertCoachOf(teamId, requesterId);
    return this.repo.listMembers(teamId);
  }

  /**
   * Player user ids of a squad the caller coaches — the challenge invite
   * fan-out. Coaches are excluded: they create and verify challenges, they
   * don't compete in them.
   */
  async invitableMemberIds(teamId: string, requesterId: string): Promise<string[]> {
    await this.assertCoachOf(teamId, requesterId);
    const members = await this.repo.listMembers(teamId);
    return members.filter((m) => m.role !== 'coach').map((m) => m.userId);
  }

  /** Every member id across all squads the coach owns — invite scoping. */
  async squadPlayerIds(coachId: string): Promise<Set<string>> {
    const teams = await this.repo.listByCoach(coachId);
    const ids = new Set<string>();
    for (const team of teams) {
      const members = await this.repo.listMembers(team.id);
      for (const member of members) ids.add(member.userId);
    }
    return ids;
  }

  private async requireTeam(teamId: string): Promise<Team> {
    const team = await this.repo.findById(teamId);
    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  private async assertCoachOf(teamId: string, requesterId: string): Promise<Team> {
    const team = await this.requireTeam(teamId);
    if (team.coachId !== requesterId) {
      throw new ForbiddenException('Not your team');
    }
    return team;
  }
}
