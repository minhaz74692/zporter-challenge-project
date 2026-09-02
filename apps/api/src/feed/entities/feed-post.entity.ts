import type {
  Challenge,
  FeedAudience,
  FeedPost,
  FeedPostType,
  FeedResultSnapshot,
  UserSummary,
} from '@zporter/shared';

/**
 * What a caller supplies to `FeedRepository.create`. `id` / `likeCount` /
 * `commentCount` / `createdAt` are set by the repository.
 */
export interface NewFeedPost {
  type: FeedPostType;
  author: UserSummary;
  audience: FeedAudience;
  /** Denormalised snapshot — stored as-is, never re-resolved on read. */
  challenge: Challenge;
  result?: FeedResultSnapshot;
}

/**
 * A stored post, before the per-viewer `likedByMe` / `savedByMe` flags are
 * mixed in by `FeedService.list`.
 */
export type FeedPostRecord = Omit<FeedPost, 'likedByMe' | 'savedByMe'>;
