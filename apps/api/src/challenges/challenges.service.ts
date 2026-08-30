import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type {
  Challenge,
  ChallengeCategory,
  ChallengeDetail,
  ChallengeReward,
  LeaderboardEntry,
  Participant,
  ParticipantSummary,
  ResultType,
  ScoringDirection,
} from '@zporter/shared';
import { ParticipantsRepository } from '../participants/participants.repository.js';
import { ParticipantsService } from '../participants/participants.service.js';
import { TeamsService } from '../teams/teams.service.js';
import { TemplatesService } from '../templates/templates.service.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { UsersService } from '../users/users.service.js';
import { ChallengesRepository } from './challenges.repository.js';
import type { CreateChallengeDto } from './dto/create-challenge.dto.js';
import type { InviteDto } from './dto/invite.dto.js';

interface ChallengeContent {
  title: string;
  description: string;
  category: string;
  resultType: ResultType;
  scoringDirection: ScoringDirection;
  rules: string;
  reward: ChallengeReward;
}

@Injectable()
export class ChallengesService {
  constructor(
    private readonly repo: ChallengesRepository,
    private readonly participants: ParticipantsRepository,
    private readonly participation: ParticipantsService,
    private readonly templates: TemplatesService,
    private readonly teams: TeamsService,
    private readonly users: UsersService,
  ) {}

  async create(dto: CreateChallengeDto, creator: AuthenticatedUser): Promise<Challenge> {
    const visibility = dto.visibility ?? 'invited';
    if (visibility === 'global' && creator.role !== 'admin') {
      throw new ForbiddenException('Only admins can create global challenges');
    }
    if (Date.parse(dto.deadline) <= Date.parse(dto.startAt)) {
      throw new BadRequestException('deadline must be after startAt');
    }

    const content = await this.resolveContent(dto);
    const challenge = await this.repo.create({
      templateId: dto.templateId,
      ...content,
      startAt: dto.startAt,
      deadline: dto.deadline,
      status: 'active',
      visibility,
      createdBy: creator.userId,
    });

    const launchInvites = await this.resolveTargets(
      { userIds: dto.invitedUserIds, teamId: dto.invitedTeamId },
      creator,
    );
    if (launchInvites.length > 0) {
      await this.writeInvites(challenge.id, launchInvites);
    }
    return challenge;
  }

  async invite(
    challengeId: string,
    dto: InviteDto,
    requester: AuthenticatedUser,
  ): Promise<{ invited: number }> {
    const challenge = await this.requireOwned(challengeId, requester);
    const targets = await this.resolveTargets(dto, requester);
    if (targets.length === 0) {
      throw new BadRequestException('Provide userIds and/or a teamId to invite');
    }
    const invited = await this.writeInvites(challenge.id, targets);
    return { invited };
  }

  /** Player accepts an invite (or joins a `global` challenge). */
  async accept(challengeId: string, user: AuthenticatedUser): Promise<Participant> {
    const challenge = this.withComputedStatus(await this.requireChallenge(challengeId));
    const account = await this.users.getById(user.userId);
    return this.participation.accept(challenge, {
      userId: user.userId,
      displayName: account.displayName,
    });
  }

  async decline(challengeId: string, user: AuthenticatedUser): Promise<Participant> {
    const challenge = this.withComputedStatus(await this.requireChallenge(challengeId));
    const account = await this.users.getById(user.userId);
    return this.participation.decline(challenge, {
      userId: user.userId,
      displayName: account.displayName,
    });
  }

  async listByCategory(
    userId: string,
    category: ChallengeCategory,
  ): Promise<Challenge[]> {
    const parts = await this.participants.listByUser(userId);
    const partByChallenge = new Map(parts.map((p) => [p.challengeId, p]));

    const challenges = await this.repo.findManyByIds([...partByChallenge.keys()]);
    if (category === 'new') {
      for (const globalChallenge of await this.repo.listGlobal()) {
        if (!partByChallenge.has(globalChallenge.id)) challenges.push(globalChallenge);
      }
    }

    return challenges
      .map((c) => this.withComputedStatus(c))
      .filter((c) => this.matchesCategory(c, partByChallenge.get(c.id), category))
      .sort((a, b) => a.deadline.localeCompare(b.deadline));
  }

  async getDetail(
    challengeId: string,
    viewer: AuthenticatedUser,
  ): Promise<ChallengeDetail> {
    const challenge = await this.requireChallenge(challengeId);
    const [participant, leaderboardPreview] = await Promise.all([
      this.participants.findOne(challengeId, viewer.userId),
      this.repo.leaderboard(challengeId, 5),
    ]);
    return {
      ...this.withComputedStatus(challenge),
      viewerParticipant: participant ? this.toSummary(participant) : undefined,
      leaderboardPreview,
    };
  }

  async listParticipants(challengeId: string): Promise<Participant[]> {
    await this.requireChallenge(challengeId);
    return this.participants.listByChallenge(challengeId);
  }

  async leaderboard(challengeId: string): Promise<LeaderboardEntry[]> {
    await this.requireChallenge(challengeId);
    return this.repo.leaderboard(challengeId, 100);
  }

  // --- helpers ---------------------------------------------------------------

  private async requireChallenge(id: string): Promise<Challenge> {
    const challenge = await this.repo.findById(id);
    if (!challenge) throw new NotFoundException('Challenge not found');
    return challenge;
  }

  private async requireOwned(id: string, user: AuthenticatedUser): Promise<Challenge> {
    const challenge = await this.requireChallenge(id);
    if (challenge.createdBy !== user.userId && user.role !== 'admin') {
      throw new ForbiddenException('Not your challenge');
    }
    return challenge;
  }

  /** `active` challenges past their deadline read as `ended` (not persisted). */
  private withComputedStatus(challenge: Challenge): Challenge {
    if (challenge.status === 'active' && Date.parse(challenge.deadline) < Date.now()) {
      return { ...challenge, status: 'ended' };
    }
    return challenge;
  }

  private matchesCategory(
    challenge: Challenge,
    participant: Participant | undefined,
    category: ChallengeCategory,
  ): boolean {
    const ended = challenge.status === 'ended';
    switch (category) {
      case 'new':
        if (ended) return false;
        return participant
          ? participant.inviteState === 'invited'
          : challenge.visibility === 'global';
      case 'active':
        return (
          !ended &&
          !!participant &&
          participant.inviteState === 'accepted' &&
          participant.resultState === 'pending'
        );
      case 'done':
        return (
          !!participant &&
          (participant.resultState === 'submitted' ||
            participant.resultState === 'completed')
        );
      case 'declined':
        return !!participant && participant.inviteState === 'declined';
      case 'ended':
        return ended && !!participant;
      default:
        return false;
    }
  }

  private toSummary(participant: Participant): ParticipantSummary {
    return {
      inviteState: participant.inviteState,
      resultState: participant.resultState,
      rank: participant.rank,
      submittedResult: participant.submittedResult,
    };
  }

  private async resolveContent(dto: CreateChallengeDto): Promise<ChallengeContent> {
    const base = dto.templateId
      ? await this.fromTemplate(dto.templateId)
      : ({} as Partial<ChallengeContent>);

    const merged: Partial<ChallengeContent> = {
      title: dto.title ?? base.title,
      description: dto.description ?? base.description,
      category: dto.category ?? base.category,
      resultType: dto.resultType ?? base.resultType,
      scoringDirection: dto.scoringDirection ?? base.scoringDirection,
      rules: dto.rules ?? base.rules,
      reward: dto.reward ?? base.reward,
    };

    const missing = (['title', 'description', 'category', 'resultType', 'scoringDirection', 'rules'] as const).filter(
      (k) => merged[k] == null || merged[k] === '',
    );
    if (missing.length > 0) {
      throw new BadRequestException(
        `Missing required field(s): ${missing.join(', ')} (no template to fall back on)`,
      );
    }
    if (!merged.reward) {
      merged.reward = { label: `${merged.title} — completed` };
    }
    return merged as ChallengeContent;
  }

  private async fromTemplate(templateId: string): Promise<Partial<ChallengeContent>> {
    const t = await this.templates.getById(templateId);
    return {
      title: t.title,
      description: t.description,
      category: t.category,
      resultType: t.resultType,
      scoringDirection: t.scoringDirection,
      rules: t.rules,
      reward: { label: `${t.title} — completed`, badgeId: t.defaultRewardBadgeId },
    };
  }

  /** Merge explicit `userIds` with a team's members, drop the requester. */
  private async resolveTargets(
    input: { userIds?: string[]; teamId?: string },
    requester: AuthenticatedUser,
  ): Promise<string[]> {
    const ids = new Set(input.userIds ?? []);
    if (input.teamId) {
      const memberIds = await this.teams.memberUserIds(input.teamId, requester.userId);
      for (const id of memberIds) ids.add(id);
    }
    ids.delete(requester.userId);
    return [...ids];
  }

  private async writeInvites(challengeId: string, userIds: string[]): Promise<number> {
    const entries = await Promise.all(
      userIds.map(async (userId) => {
        const user = await this.users.getById(userId).catch(() => null);
        return user ? { userId, displayName: user.displayName } : null;
      }),
    );
    return this.participants.addInvites(
      challengeId,
      entries.filter((e): e is { userId: string; displayName: string } => e !== null),
    );
  }
}
