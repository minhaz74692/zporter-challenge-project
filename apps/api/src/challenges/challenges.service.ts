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
  LeaderboardEntry,
  Participant,
  ParticipantSummary,
  ResultType,
  ResultUnit,
  SubmitResultRequest,
  UserSummary,
} from '@zporter/shared';
import { NotificationsService } from '../notifications/notifications.service.js';
import { ParticipantsRepository } from '../participants/participants.repository.js';
import { StorageService, type UploadedImage } from '../storage/storage.service.js';
import { ParticipantsService } from '../participants/participants.service.js';
import { ResultsService } from '../results/results.service.js';
import { TeamsService } from '../teams/teams.service.js';
import { TemplatesService } from '../templates/templates.service.js';
import type { AuthenticatedUser } from '../auth/types.js';
import { UsersService } from '../users/users.service.js';
import { ChallengesRepository, type NewChallenge } from './challenges.repository.js';
import type { CreateChallengeDto } from './dto/create-challenge.dto.js';
import type { UpdateChallengeDto } from './dto/update-challenge.dto.js';
import type { InviteDto } from './dto/invite.dto.js';

const DEFAULT_UNIT: Record<ResultType, ResultUnit> = {
  count: 'reps',
  time: 'seconds',
  boolean: 'boolean',
  score: 'points',
  text: 'count',
  proof: 'count',
};

@Injectable()
export class ChallengesService {
  constructor(
    private readonly repo: ChallengesRepository,
    private readonly participants: ParticipantsRepository,
    private readonly participation: ParticipantsService,
    private readonly results: ResultsService,
    private readonly notifications: NotificationsService,
    private readonly storage: StorageService,
    private readonly templates: TemplatesService,
    private readonly teams: TeamsService,
    private readonly users: UsersService,
  ) {}

  async create(dto: CreateChallengeDto, creator: AuthenticatedUser): Promise<Challenge> {
    const visibility = dto.visibility ?? 'private';
    if (visibility === 'all' && creator.role !== 'admin') {
      throw new ForbiddenException('Only admins can publish a challenge to everyone');
    }
    if (Date.parse(dto.deadline) <= Date.parse(dto.startAt)) {
      throw new BadRequestException('deadline must be after startAt');
    }

    const content = await this.buildContent(dto);
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
      await this.writeInvites(challenge, launchInvites);
    }
    return this.withCreator(challenge);
  }

  /** Edit an existing challenge (owner or admin). Full-form PATCH from the web. */
  async update(
    id: string,
    dto: UpdateChallengeDto,
    user: AuthenticatedUser,
  ): Promise<Challenge> {
    const challenge = await this.requireOwned(id, user);
    if (dto.visibility === 'all' && user.role !== 'admin') {
      throw new ForbiddenException('Only admins can publish a challenge to everyone');
    }

    const startAt = dto.startAt ?? challenge.startAt;
    const deadline = dto.deadline ?? challenge.deadline;
    if (Date.parse(deadline) <= Date.parse(startAt)) {
      throw new BadRequestException('deadline must be after startAt');
    }

    const patch = this.definedOnly({
      title: dto.title?.trim(),
      ingress: dto.ingress?.trim(),
      description: dto.description,
      mainCategory: dto.mainCategory,
      collections: dto.collections,
      equipmentTags: dto.equipmentTags,
      resultType: dto.resultType,
      resultUnit: dto.resultUnit,
      scoringDirection: dto.scoringDirection,
      durationMinutes: dto.durationMinutes,
      location: dto.location,
      startAt: dto.startAt,
      deadline: dto.deadline,
      visibility: dto.visibility,
      pointsToParticipate: dto.pointsToParticipate,
      rewardPoints: dto.rewardPoints,
      rewardBadgeId: dto.rewardBadgeId,
      minParticipants: dto.minParticipants,
      ageFrom: dto.ageFrom,
      ageTo: dto.ageTo,
      position: dto.position,
      mediaImageUrl: dto.mediaImageUrl,
      mediaVideoUrl: dto.mediaVideoUrl,
    });

    await this.repo.updateFields(id, patch);
    return this.withCreator({ ...challenge, ...patch });
  }

  /** Delete a challenge (owner or admin). */
  async remove(id: string, user: AuthenticatedUser): Promise<void> {
    await this.requireOwned(id, user);
    await this.repo.delete(id);
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
    const invited = await this.writeInvites(challenge, targets);
    return { invited: invited.length };
  }

  /** Player accepts an invite (or joins a public challenge). */
  async accept(challengeId: string, user: AuthenticatedUser): Promise<Participant> {
    const challenge = this.withComputedStatus(await this.requireChallenge(challengeId));
    const member = await this.users.summaryById(user.userId);
    return this.participation.accept(challenge, member);
  }

  async decline(challengeId: string, user: AuthenticatedUser): Promise<Participant> {
    const challenge = this.withComputedStatus(await this.requireChallenge(challengeId));
    const member = await this.users.summaryById(user.userId);
    return this.participation.decline(challenge, member);
  }

  async submitResult(
    challengeId: string,
    user: AuthenticatedUser,
    dto: SubmitResultRequest,
  ): Promise<Participant> {
    const challenge = this.withComputedStatus(await this.requireChallenge(challengeId));
    const participant = await this.results.submit(challenge, user.userId, dto);
    if (challenge.createdBy !== user.userId) {
      await this.notifications.notify({
        userId: challenge.createdBy,
        type: 'result_submitted',
        challengeId: challenge.id,
        title: `${participant.displayName} submitted a result`,
        body: challenge.title,
      });
    }
    return participant;
  }

  async listByCategory(
    userId: string,
    category: ChallengeCategory,
  ): Promise<Challenge[]> {
    const parts = await this.participants.listByUser(userId);
    const partByChallenge = new Map(parts.map((p) => [p.challengeId, p]));

    const challenges = await this.repo.findManyByIds([...partByChallenge.keys()]);
    if (category === 'new') {
      for (const publicChallenge of await this.repo.listPublic()) {
        if (!partByChallenge.has(publicChallenge.id)) challenges.push(publicChallenge);
      }
    }

    const filtered = challenges
      .map((c) => this.withComputedStatus(c))
      .filter((c) => this.matchesCategory(c, partByChallenge.get(c.id), category))
      .sort((a, b) => a.deadline.localeCompare(b.deadline));
    return this.withCreators(filtered);
  }

  /** A creator's own challenges, newest first, with `creator` embedded. */
  async listMine(userId: string): Promise<Challenge[]> {
    const challenges = await this.repo.listByCreator(userId);
    return this.withCreators(challenges.map((c) => this.withComputedStatus(c)));
  }

  async getDetail(
    challengeId: string,
    viewer: AuthenticatedUser,
  ): Promise<ChallengeDetail> {
    const challenge = await this.requireChallenge(challengeId);
    const [participant, leaderboardPreview, creator] = await Promise.all([
      this.participants.findOne(challengeId, viewer.userId),
      this.repo.leaderboard(challengeId, 5),
      this.users.summaryById(challenge.createdBy).catch(() => undefined),
    ]);
    return {
      ...this.withComputedStatus(challenge),
      creator,
      viewerParticipant: participant ? this.toSummary(participant) : undefined,
      leaderboardPreview,
    };
  }

  /** Upload / replace the challenge's cover image (Figma create-form media). */
  async setCover(
    challengeId: string,
    user: AuthenticatedUser,
    image: UploadedImage,
  ): Promise<Challenge> {
    const challenge = await this.requireOwned(challengeId, user);
    const mediaImageUrl = await this.storage.uploadImage({
      buffer: image.buffer,
      mimeType: image.mimetype,
      path: `challenges/${challenge.id}/cover`,
    });
    await this.repo.updateFields(challenge.id, { mediaImageUrl });
    return this.withCreator({ ...challenge, mediaImageUrl });
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

  /** Drop `undefined` values so Firestore `set(..., { merge: true })` won't choke. */
  private definedOnly<T extends object>(obj: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== undefined),
    ) as Partial<T>;
  }

  /** `active` challenges past their deadline read as `ended` (not persisted). */
  private withComputedStatus(challenge: Challenge): Challenge {
    if (challenge.status === 'active' && Date.parse(challenge.deadline) < Date.now()) {
      return { ...challenge, status: 'ended' };
    }
    return challenge;
  }

  private async withCreator(challenge: Challenge): Promise<Challenge> {
    return {
      ...challenge,
      creator: await this.users.summaryById(challenge.createdBy).catch(() => undefined),
    };
  }

  private async withCreators(challenges: Challenge[]): Promise<Challenge[]> {
    const ids = [...new Set(challenges.map((c) => c.createdBy))];
    const summaries = new Map<string, UserSummary | undefined>(
      await Promise.all(
        ids.map(
          async (id) =>
            [id, await this.users.summaryById(id).catch(() => undefined)] as const,
        ),
      ),
    );
    return challenges.map((c) => ({ ...c, creator: summaries.get(c.createdBy) }));
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
          : challenge.visibility === 'all';
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

  /**
   * Merge create-form fields with the template (if any) and sensible defaults.
   * `title` / `description` / `resultType` / `scoringDirection` must resolve to a
   * value; the rest fall back. The template's `rules` (success criteria) is
   * folded into the challenge `description` on copy.
   */
  private async buildContent(
    dto: CreateChallengeDto,
  ): Promise<
    Omit<
      NewChallenge,
      'templateId' | 'startAt' | 'deadline' | 'status' | 'visibility' | 'createdBy'
    >
  > {
    const t = dto.templateId ? await this.templates.getById(dto.templateId) : null;

    const title = dto.title ?? t?.title;
    const resultType = dto.resultType ?? t?.resultType;
    const scoringDirection = dto.scoringDirection ?? t?.scoringDirection;
    const description =
      dto.description ??
      (t ? [t.description, t.rules].filter(Boolean).join('\n\n') : undefined);

    const missing = Object.entries({ title, description, resultType, scoringDirection })
      .filter(([, v]) => v == null || v === '')
      .map(([k]) => k);
    if (missing.length > 0) {
      throw new BadRequestException(
        `Missing required field(s): ${missing.join(', ')} (no template to fall back on)`,
      );
    }

    return {
      title: title!.trim(),
      ingress: (dto.ingress ?? t?.ingress)?.trim(),
      description: description!,
      mainCategory: dto.mainCategory ?? t?.mainCategory ?? 'other',
      collections: dto.collections ?? t?.collections ?? [],
      equipmentTags: dto.equipmentTags ?? t?.equipmentTags ?? [],
      resultType: resultType!,
      resultUnit: dto.resultUnit ?? t?.resultUnit ?? DEFAULT_UNIT[resultType!],
      scoringDirection: scoringDirection!,
      durationMinutes: dto.durationMinutes ?? t?.durationMinutes ?? 20,
      location: dto.location ?? t?.location ?? 'anywhere',
      pointsToParticipate: dto.pointsToParticipate ?? t?.pointsToParticipate ?? 0,
      rewardPoints: dto.rewardPoints ?? t?.rewardPoints ?? 0,
      rewardBadgeId: dto.rewardBadgeId ?? t?.defaultRewardBadgeId,
      minParticipants: dto.minParticipants ?? 1,
      ageFrom: dto.ageFrom,
      ageTo: dto.ageTo,
      position: dto.position,
      mediaImageUrl: dto.mediaImageUrl,
      mediaVideoUrl: dto.mediaVideoUrl,
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

  /** Resolve user summaries, write the invite rows, notify whoever was new. */
  private async writeInvites(
    challenge: Challenge,
    userIds: string[],
  ): Promise<UserSummary[]> {
    const summaries = (
      await Promise.all(
        userIds.map((id) => this.users.summaryById(id).catch(() => null)),
      )
    ).filter((s): s is UserSummary => s !== null);

    const invited = await this.participants.addInvites(challenge.id, summaries);
    await Promise.all(
      invited.map((user) =>
        this.notifications.notify({
          userId: user.id,
          type: 'challenge_invite',
          challengeId: challenge.id,
          title: 'You have a new challenge',
          body: challenge.title,
        }),
      ),
    );
    return invited;
  }
}
