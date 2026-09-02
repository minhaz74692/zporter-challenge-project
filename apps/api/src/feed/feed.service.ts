import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type {
  Challenge,
  FeedAudience,
  FeedLikeResult,
  FeedPost,
  FeedResultSnapshot,
  FeedSaveResult,
  FeedTab,
  Participant,
} from '@zporter/shared';
import { TeamsService } from '../teams/teams.service.js';
import type { FeedPostRecord } from './entities/feed-post.entity.js';
import { FeedRepository } from './feed.repository.js';

/** `challenge.visibility` → the audience a feed post is tagged with. */
function audienceFor(challenge: Challenge): FeedAudience {
  switch (challenge.visibility) {
    case 'all':
      return 'public';
    case 'friends':
      return 'friends';
    case 'fans':
      return 'fans';
    default:
      return 'team';
  }
}

/**
 * The activity feed. Posts are created as a side effect of two domain events
 * (a non-private challenge is launched; a player shares a reported result),
 * so `ChallengesService` calls `publishChallenge` / `publishResult` — both are
 * best-effort and swallow their own errors, exactly like `NotificationsService`.
 */
@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);

  constructor(
    private readonly repo: FeedRepository,
    private readonly teams: TeamsService,
  ) {}

  /**
   * One tab's worth of posts for `viewerId`, newest first.
   *
   * - `yours`  — the home feed: public posts + posts by a squad-mate + your own
   * - `team`   — only posts authored by someone in one of your squads
   * - `saved`  — posts you bookmarked
   *
   * `friends` / `fans` audiences are treated as `public` here — there is no
   * relationship graph in this slice (documented next step).
   */
  async list(tab: FeedTab, viewerId: string): Promise<FeedPost[]> {
    const [recent, squadmates] = await Promise.all([
      this.repo.listRecent(),
      this.teams.squadmateIds(viewerId),
    ]);

    let visible: FeedPostRecord[];
    if (tab === 'saved') {
      const savedIds = new Set(await this.repo.savedPostIds(viewerId));
      visible = recent.filter((p) => savedIds.has(p.id));
    } else if (tab === 'team') {
      visible = recent.filter((p) => squadmates.has(p.author.id));
    } else {
      visible = recent.filter(
        (p) =>
          p.audience === 'public' ||
          p.author.id === viewerId ||
          squadmates.has(p.author.id),
      );
    }

    const ids = visible.map((p) => p.id);
    const [liked, saved] = await Promise.all([
      this.repo.likedAmong(viewerId, ids),
      this.repo.savedAmong(viewerId, ids),
    ]);

    return visible.map((p) => ({
      ...p,
      likedByMe: liked.has(p.id),
      savedByMe: saved.has(p.id),
    }));
  }

  async like(postId: string, viewerId: string): Promise<FeedLikeResult> {
    await this.requirePost(postId);
    return this.repo.setLike(viewerId, postId, true);
  }

  async unlike(postId: string, viewerId: string): Promise<FeedLikeResult> {
    await this.requirePost(postId);
    return this.repo.setLike(viewerId, postId, false);
  }

  async save(postId: string, viewerId: string): Promise<FeedSaveResult> {
    await this.requirePost(postId);
    await this.repo.setSave(viewerId, postId, true);
    return { saved: true };
  }

  async unsave(postId: string, viewerId: string): Promise<FeedSaveResult> {
    await this.requirePost(postId);
    await this.repo.setSave(viewerId, postId, false);
    return { saved: false };
  }

  /**
   * A challenge was launched — post it to the feed. `all` → a `public` post
   * everyone sees; anything else (`private` invite-only, `friends`, `fans`) →
   * a `team` post, visible in the feed only to the creator's squad (the "Team"
   * tab and each squad-mate's "Yours"). There is no relationship graph in this
   * slice, so `friends` / `fans` are treated as squad-scoped too.
   */
  async publishChallenge(challenge: Challenge): Promise<void> {
    if (!challenge.creator) return;
    await this.safeCreate({
      type: 'challenge_published',
      author: challenge.creator,
      audience: audienceFor(challenge),
      challenge,
    });
  }

  /**
   * A player shared a result — on submit ("Share to my feed") or when the
   * controller verifies it. Both paths write the **same** post (deterministic
   * id), so a verification just refreshes the existing card (adding the earned
   * badge) rather than duplicating it. The post is `public` regardless of the
   * challenge's visibility: sharing a result is an explicit player action.
   */
  async publishResult(challenge: Challenge, participant: Participant): Promise<void> {
    const result = participant.submittedResult;
    if (!result) return;
    const author = {
      id: participant.userId,
      displayName: participant.displayName,
      handle: participant.handle,
      avatarUrl: participant.avatarUrl,
      country: participant.country,
      city: participant.city,
      club: participant.club,
      position: participant.position,
    };
    const snapshot: FeedResultSnapshot = {
      value: result.value,
      unit: result.unit,
      videoUrl: result.videoUrl,
      arena: result.arena,
      performedAt: result.performedAt,
      awardedBadge: participant.awardedBadge,
    };
    const id = this.repo.resultPostId(challenge.id, participant.userId);
    try {
      await this.repo.upsertResultPost(id, {
        type: 'result_update',
        author,
        audience: 'public',
        challenge,
        result: snapshot,
      });
    } catch (err) {
      this.logger.error(
        `Could not upsert result feed post for challenge ${challenge.id}`,
        err as Error,
      );
    }
  }

  /**
   * Re-sync the launch post's embedded challenge after any challenge write
   * (media uploaded/reordered after launch, an edited field, …). Best-effort.
   */
  async syncChallenge(challenge: Challenge): Promise<void> {
    try {
      await this.repo.updateChallengeSnapshot(challenge);
    } catch (err) {
      this.logger.error(
        `Could not sync feed snapshot for challenge ${challenge.id}`,
        err as Error,
      );
    }
  }

  /** Remove a challenge's posts (called when the challenge is deleted). */
  async removeForChallenge(challengeId: string): Promise<void> {
    try {
      await this.repo.deleteByChallenge(challengeId);
    } catch (err) {
      this.logger.error(
        `Could not remove feed posts for challenge ${challengeId}`,
        err as Error,
      );
    }
  }

  /** Pull one player's result post (e.g. the controller rejected the result). */
  async removeResultPost(challengeId: string, userId: string): Promise<void> {
    try {
      await this.repo.deleteById(this.repo.resultPostId(challengeId, userId));
    } catch (err) {
      this.logger.error(
        `Could not remove result feed post for challenge ${challengeId}`,
        err as Error,
      );
    }
  }

  private async safeCreate(
    data: Parameters<FeedRepository['create']>[0],
  ): Promise<void> {
    try {
      await this.repo.create(data);
    } catch (err) {
      this.logger.error(
        `Could not create feed post for challenge ${data.challenge.id}`,
        err as Error,
      );
    }
  }

  private async requirePost(id: string): Promise<FeedPostRecord> {
    const post = await this.repo.getById(id);
    if (!post) throw new NotFoundException('Feed post not found');
    return post;
  }
}
