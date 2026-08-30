import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Team, TeamMember } from '@zporter/shared';
import { TeamsRepository } from './teams.repository.js';

@Injectable()
export class TeamsService {
  constructor(private readonly repo: TeamsRepository) {}

  listForCoach(coachId: string): Promise<Team[]> {
    return this.repo.listByCoach(coachId);
  }

  /** Members of a squad the caller coaches. */
  async listMembers(teamId: string, requesterId: string): Promise<TeamMember[]> {
    await this.assertCoachOf(teamId, requesterId);
    return this.repo.listMembers(teamId);
  }

  /** User ids of every squad member — used by the challenge invite fan-out. */
  async memberUserIds(teamId: string, requesterId: string): Promise<string[]> {
    await this.assertCoachOf(teamId, requesterId);
    const members = await this.repo.listMembers(teamId);
    return members.map((m) => m.userId);
  }

  private async assertCoachOf(teamId: string, requesterId: string): Promise<Team> {
    const team = await this.repo.findById(teamId);
    if (!team) throw new NotFoundException('Team not found');
    if (team.coachId !== requesterId) {
      throw new ForbiddenException('Not your team');
    }
    return team;
  }
}
