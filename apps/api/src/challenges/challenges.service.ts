import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type {
  Challenge,
  ChallengeCategory,
  ChallengeDetail,
  ChallengeResultEntry,
  LeaderboardEntry,
  MediaItem,
  Participant,
  ParticipantSummary,
  ResultType,
  ResultUnit,
  SubmitResultRequest,
  UserSummary,
} from '@zporter/shared';
import {
  deriveLegacy,
  storagePathFromDownloadUrl,
  toYoutubeItem,
} from './media.util.js';
import { BadgesService } from '../badges/badges.service.js';
import { FeedService } from '../feed/feed.service.js';
import { notificationCopy } from '../notifications/notification-copy.js';
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
    private readonly badges: BadgesService,
    private readonly feed: FeedService,
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

    const withCreator = await this.withCreator(challenge);
    // Every launch shows up in the activity feed — `all` publicly, otherwise
    // scoped to the creator's squad (best-effort).
    await this.feed.publishChallenge(withCreator);
    return withCreator;
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
    // Don't leave feed posts pointing at a challenge that no longer opens.
    await this.feed.removeForChallenge(id);
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
        actorId: user.userId,
        ...notificationCopy('result_submitted', challenge.title, participant.displayName),
      });
    }

    // Ask the named controller to verify (Zporter "Tests"-style flow).
    const controllerRef = dto.controllerRef?.trim();
    const controller = controllerRef
      ? await this.users.summaryByHandle(controllerRef)
      : null;
    if (controller && controller.id !== user.userId) {
      await this.notifications.notify({
        userId: controller.id,
        type: 'result_verify_request',
        challengeId: challenge.id,
        actorId: user.userId,
        ...notificationCopy(
          'result_verify_request',
          challenge.title,
          participant.displayName,
        ),
      });
    }

    // "Share to my feed" was ticked on the report form (best-effort).
    if (dto.shareToFeed) {
      await this.feed.publishResult(challenge, participant);
    }

    return participant;
  }

  /**
   * The controller named on a result approves or rejects it. Only the user
   * whose `#Handle` matches the result's `controllerRef` may call this.
   */
  async verifyResult(
    challengeId: string,
    subjectUserId: string,
    caller: AuthenticatedUser,
    approved: boolean,
  ): Promise<Participant> {
    const challenge = await this.requireChallenge(challengeId);
    const participant = await this.participants.findOne(challengeId, subjectUserId);
    if (!participant?.submittedResult) {
      throw new NotFoundException('No result to verify');
    }

    const callerHandle = (await this.users.getById(caller.userId)).handle;
    if (
      participant.submittedResult.controllerRef.trim().toLowerCase() !==
      callerHandle.trim().toLowerCase()
    ) {
      throw new ForbiddenException('You are not the controller for this result');
    }

    await this.participants.setResultVerification(
      challengeId,
      subjectUserId,
      approved,
    );

    // The leaderboard ranks verified results only, so an approval adds this
    // participant's score and a rejection takes it back off.
    await this.results.rebuildLeaderboard(challenge);

    // Recognition: an approved result earns the challenge's reward badge (once).
    if (approved && !participant.awardedBadge && challenge.rewardBadgeId) {
      const badge = await this.badges.getById(challenge.rewardBadgeId);
      if (badge) {
        await this.participants.awardBadge(challengeId, subjectUserId, badge);
        await this.notifications.notify({
          userId: subjectUserId,
          type: 'badge_earned',
          challengeId: challenge.id,
          actorId: caller.userId,
          ...notificationCopy('badge_earned', challenge.title, badge.name),
        });
      }
    }

    await this.notifications.notify({
      userId: subjectUserId,
      type: 'result_verified',
      challengeId: challenge.id,
      actorId: caller.userId,
      ...notificationCopy('result_verified', challenge.title),
      ...(approved ? {} : { title: 'Your result was not approved' }),
    });

    const updated = (await this.participants.findOne(challengeId, subjectUserId))!;

    // A witnessed (approved) result belongs on the feed — publish it now, or
    // refresh the existing card with the freshly-earned badge. A rejection
    // pulls any shared post back down.
    if (approved) {
      await this.feed.publishResult(this.withComputedStatus(challenge), updated);
    } else {
      await this.feed.removeResultPost(challengeId, subjectUserId);
    }

    return updated;
  }

  /**
   * "Deadline soon" nudge — notify every participant who accepted but has not
   * reported a result yet. Manually triggered by the creator (no scheduler in
   * this slice); the Figma copy lives in `notificationCopy('challenge_reminder')`.
   */
  async remindPending(
    challengeId: string,
    user: AuthenticatedUser,
  ): Promise<{ reminded: number }> {
    const challenge = this.withComputedStatus(
      await this.requireOwned(challengeId, user),
    );
    if (challenge.status === 'ended') {
      throw new BadRequestException('This challenge has already ended');
    }

    const roster = await this.participants.listByChallenge(challengeId);
    const pending = roster.filter(
      (p) => p.inviteState === 'accepted' && p.resultState === 'pending',
    );

    await Promise.all(
      pending.map((p) =>
        this.notifications.notify({
          userId: p.userId,
          type: 'challenge_reminder',
          challengeId: challenge.id,
          ...notificationCopy('challenge_reminder', challenge.title),
        }),
      ),
    );
    return { reminded: pending.length };
  }

  async listByCategory(
    userId: string,
    category: ChallengeCategory,
  ): Promise<Challenge[]> {
    const parts = await this.participants.listByUser(userId);
    const partByChallenge = new Map(parts.map((p) => [p.challengeId, p]));

    const challenges = await this.repo.findManyByIds([...partByChallenge.keys()]);
    if (category === 'new') {
      // Challenges the player can see in New without an invite: `all` (every
      // player) + `team` challenges created by one of the player's squad-mates.
      const squadmates = await this.teams.squadmateIds(userId);
      const noInvite = [
        ...(await this.repo.listPublic()),
        ...(await this.repo.listTeamVisible()).filter((c) =>
          squadmates.has(c.createdBy),
        ),
      ];
      for (const challenge of noInvite) {
        if (!partByChallenge.has(challenge.id)) challenges.push(challenge);
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

  /**
   * Every result the caller has reported, paired with its challenge, newest
   * first — the Biography "Challenges" tab.
   */
  async listMyResults(userId: string): Promise<ChallengeResultEntry[]> {
    const parts = (await this.participants.listByUser(userId)).filter(
      (p) => p.submittedResult,
    );
    if (parts.length === 0) return [];

    const challenges = new Map(
      (await this.repo.findManyByIds(parts.map((p) => p.challengeId))).map((c) => [
        c.id,
        c,
      ]),
    );
    const withCreators = await this.withCreators(
      [...challenges.values()].map((c) => this.withComputedStatus(c)),
    );
    const byId = new Map(withCreators.map((c) => [c.id, c]));

    return parts
      .filter((p) => byId.has(p.challengeId))
      .map((p) => ({ challenge: byId.get(p.challengeId)!, result: p.submittedResult! }))
      .sort((a, b) =>
        b.result.submittedAt.localeCompare(a.result.submittedAt),
      );
  }

  async getDetail(
    challengeId: string,
    viewer: AuthenticatedUser,
  ): Promise<ChallengeDetail> {
    const challenge = await this.requireChallenge(challengeId);
    const [participant, leaderboardPreview, creator, rewardBadge] = await Promise.all([
      this.participants.findOne(challengeId, viewer.userId),
      this.repo.leaderboard(challengeId, 5),
      this.users.summaryById(challenge.createdBy).catch(() => undefined),
      challenge.rewardBadgeId
        ? this.badges.getById(challenge.rewardBadgeId).catch(() => null)
        : null,
    ]);
    return {
      ...this.withComputedStatus(challenge),
      creator,
      viewerParticipant: participant ? this.toSummary(participant) : undefined,
      leaderboardPreview,
      rewardBadge: rewardBadge ?? undefined,
    };
  }

  /**
   * Upload / replace the primary cover image — it becomes the first `image`
   * item in the media gallery (kept for the web `CoverUpload` component).
   */
  async setCover(
    challengeId: string,
    user: AuthenticatedUser,
    image: UploadedImage,
  ): Promise<Challenge> {
    const challenge = await this.requireOwned(challengeId, user);
    const url = await this.storage.uploadImage({
      buffer: image.buffer,
      mimeType: image.mimetype,
      path: `challenges/${challenge.id}/media/${randomUUID()}`,
    });
    const media: MediaItem[] = [
      { url, type: 'image' },
      ...challenge.media.filter((m) => m.url !== challenge.mediaImageUrl),
    ];
    return this.writeMedia(challenge, media);
  }

  /** Append uploaded files + YouTube links to the media gallery (owner/admin). */
  async addMedia(
    challengeId: string,
    user: AuthenticatedUser,
    files: UploadedImage[],
    youtubeLinks: string[],
  ): Promise<Challenge> {
    const challenge = await this.requireOwned(challengeId, user);
    if (files.length === 0 && youtubeLinks.length === 0) {
      throw new BadRequestException('Add at least one file or YouTube link');
    }

    const uploaded: MediaItem[] = [];
    for (const file of files) {
      const isVideo = file.mimetype.startsWith('video/');
      const path = `challenges/${challengeId}/media/${randomUUID()}`;
      const url = isVideo
        ? await this.storage.uploadVideo({ buffer: file.buffer, mimeType: file.mimetype, path })
        : await this.storage.uploadImage({ buffer: file.buffer, mimeType: file.mimetype, path });
      uploaded.push({ url, type: isVideo ? 'video' : 'image' });
    }
    const links = youtubeLinks.map((l) => toYoutubeItem(l));

    return this.writeMedia(challenge, [...challenge.media, ...uploaded, ...links]);
  }

  /** Replace / reorder the whole gallery (owner/admin). */
  async setMedia(
    challengeId: string,
    user: AuthenticatedUser,
    items: MediaItem[],
  ): Promise<Challenge> {
    const challenge = await this.requireOwned(challengeId, user);
    const normalised = items.map((it) =>
      it.type === 'youtube' ? toYoutubeItem(it.url) : { url: it.url, type: it.type },
    );
    return this.writeMedia(challenge, normalised);
  }

  /** Drop the gallery item at `index` (owner/admin); best-effort Storage delete. */
  async removeMedia(
    challengeId: string,
    user: AuthenticatedUser,
    index: number,
  ): Promise<Challenge> {
    const challenge = await this.requireOwned(challengeId, user);
    if (!Number.isInteger(index) || index < 0 || index >= challenge.media.length) {
      throw new BadRequestException('No media item at that position');
    }
    const [removed] = challenge.media.slice(index, index + 1);
    const next = challenge.media.filter((_, i) => i !== index);

    const path = removed && storagePathFromDownloadUrl(removed.url);
    if (path) await this.storage.deleteObject(path).catch(() => undefined);

    return this.writeMedia(challenge, next);
  }

  /**
   * Persist a new gallery and return the challenge. Only `media` is stored —
   * `mediaImageUrl` / `mediaVideoUrl` are re-derived from it on every read
   * (`ChallengesRepository.fromDoc`), so they never need writing.
   */
  private async writeMedia(
    challenge: Challenge,
    media: MediaItem[],
  ): Promise<Challenge> {
    await this.repo.updateFields(challenge.id, { media });
    const legacy = deriveLegacy(media);
    return this.withCreator({
      ...challenge,
      media,
      mediaImageUrl: legacy.mediaImageUrl ?? undefined,
      mediaVideoUrl: legacy.mediaVideoUrl ?? undefined,
    });
  }

  /**
   * Store a result video and return its URL. The caller then submits it as
   * `videoUrl` in `POST /challenges/:id/results`. Any authenticated user who
   * can see the challenge may upload; `submitResult` enforces participation.
   */
  async uploadResultVideo(
    challengeId: string,
    user: AuthenticatedUser,
    video: UploadedImage,
  ): Promise<{ videoUrl: string }> {
    await this.requireChallenge(challengeId);
    const videoUrl = await this.storage.uploadVideo({
      buffer: video.buffer,
      mimeType: video.mimetype,
      path: `challenges/${challengeId}/results/${user.userId}/video`,
    });
    return { videoUrl };
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
        // No participant row → it's a no-invite challenge (`all`, or a `team`
        // challenge already filtered to the viewer's squad in `listByCategory`).
        return participant
          ? participant.inviteState === 'invited'
          : challenge.visibility === 'all' || challenge.visibility === 'team';
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
      awardedBadge: participant.awardedBadge,
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

  /**
   * Resolve who to invite: explicit `userIds` (scoped to the coach's own squad)
   * merged with a team's players. `admin` may invite anyone; the requester is
   * always dropped.
   */
  private async resolveTargets(
    input: { userIds?: string[]; teamId?: string },
    requester: AuthenticatedUser,
  ): Promise<string[]> {
    const explicit = input.userIds ?? [];
    const ids = new Set<string>();

    if (explicit.length > 0) {
      if (requester.role === 'admin') {
        for (const id of explicit) ids.add(id);
      } else {
        const squad = await this.teams.squadPlayerIds(requester.userId);
        for (const id of explicit) if (squad.has(id)) ids.add(id);
      }
    }

    if (input.teamId) {
      const memberIds = await this.teams.invitableMemberIds(
        input.teamId,
        requester.userId,
      );
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
          ...notificationCopy('challenge_invite', challenge.title),
        }),
      ),
    );
    return invited;
  }
}
