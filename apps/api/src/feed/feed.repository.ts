import { Inject, Injectable } from '@nestjs/common';
import type { Challenge, FeedResultSnapshot } from '@zporter/shared';
import {
  FieldValue,
  type CollectionReference,
  type DocumentData,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase-admin/firestore';
import { FIRESTORE } from '../firebase/firebase.constants.js';
import type { FeedPostRecord, NewFeedPost } from './entities/feed-post.entity.js';

const POSTS = 'feedPosts';
const LIKES = 'feedLikes';
const SAVES = 'feedSaves';

/** Composite key for a per-user edge doc (`feedLikes` / `feedSaves`). */
const edgeId = (userId: string, postId: string): string => `${userId}_${postId}`;

/**
 * Firestore access for the feed: the `feedPosts` collection plus two flat
 * edge collections, `feedLikes` and `feedSaves`, keyed `{userId}_{postId}`.
 *
 * Flat edge collections (rather than `feedPosts/{id}/likes` sub-collections)
 * keep every read a single indexed `where` query — "did I like this",
 * "posts I saved" — with no collection-group index to provision.
 */
@Injectable()
export class FeedRepository {
  private readonly posts: CollectionReference<DocumentData>;
  private readonly likes: CollectionReference<DocumentData>;
  private readonly saves: CollectionReference<DocumentData>;

  constructor(@Inject(FIRESTORE) private readonly db: Firestore) {
    this.posts = db.collection(POSTS);
    this.likes = db.collection(LIKES);
    this.saves = db.collection(SAVES);
  }

  async create(data: NewFeedPost): Promise<FeedPostRecord> {
    const ref = this.posts.doc();
    return this.write(ref.id, data);
  }

  /**
   * Deterministic id for a player's result post on a challenge, so a submit
   * (with "share to feed") and a later controller verification converge on the
   * **same** post instead of creating a duplicate.
   */
  resultPostId(challengeId: string, userId: string): string {
    return `result_${challengeId}_${userId}`;
  }

  /** Create or refresh the single result post for `(challengeId, userId)`. */
  async upsertResultPost(
    id: string,
    data: NewFeedPost,
  ): Promise<FeedPostRecord> {
    const existing = await this.posts.doc(id).get();
    return this.write(id, data, {
      likeCount: (existing.data()?.likeCount as number | undefined) ?? 0,
      commentCount: (existing.data()?.commentCount as number | undefined) ?? 0,
      createdAt:
        (existing.data()?.createdAt as string | undefined) ??
        new Date().toISOString(),
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.posts.doc(id).delete();
  }

  /** Drop every post for a challenge (called when the challenge is deleted). */
  async deleteByChallenge(challengeId: string): Promise<void> {
    const snap = await this.posts
      .where('challengeId', '==', challengeId)
      .get();
    await Promise.all(snap.docs.map((d) => d.ref.delete()));
  }

  private async write(
    id: string,
    data: NewFeedPost,
    keep: { likeCount: number; commentCount: number; createdAt: string } = {
      likeCount: 0,
      commentCount: 0,
      createdAt: new Date().toISOString(),
    },
  ): Promise<FeedPostRecord> {
    const record: FeedPostRecord = {
      id,
      type: data.type,
      author: data.author,
      audience: data.audience,
      challenge: data.challenge,
      result: data.result,
      likeCount: keep.likeCount,
      commentCount: keep.commentCount,
      createdAt: keep.createdAt,
    };
    const { id: _id, ...doc } = record;
    // `challengeId` is denormalised alongside the snapshot so posts can be
    // found / removed by challenge without scanning the nested map.
    await this.posts.doc(id).set({ ...doc, challengeId: data.challenge.id });
    return record;
  }

  /** Newest posts first. Prototype scale — no cursor pagination yet. */
  async listRecent(limit = 50): Promise<FeedPostRecord[]> {
    const snap = await this.posts
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    return snap.docs.map((d) => this.fromDoc(d));
  }

  /** Which of `postIds` the user has liked. */
  async likedAmong(userId: string, postIds: string[]): Promise<Set<string>> {
    return this.edgesAmong(this.likes, userId, postIds);
  }

  /** Which of `postIds` the user has saved. */
  async savedAmong(userId: string, postIds: string[]): Promise<Set<string>> {
    return this.edgesAmong(this.saves, userId, postIds);
  }

  /** Post ids the user has saved (backs the "Saved" tab). */
  async savedPostIds(userId: string): Promise<string[]> {
    const snap = await this.saves.where('userId', '==', userId).get();
    return snap.docs.map((d) => d.data().postId as string);
  }

  async getById(id: string): Promise<FeedPostRecord | null> {
    const snap = await this.posts.doc(id).get();
    return snap.exists ? this.fromDoc(snap as QueryDocumentSnapshot) : null;
  }

  /**
   * Toggle a like in one transaction so `likeCount` can never drift from the
   * edge docs. Returns the resulting count + state; a no-op (liking twice)
   * just returns the current values.
   */
  async setLike(
    userId: string,
    postId: string,
    liked: boolean,
  ): Promise<{ likeCount: number; liked: boolean }> {
    const postRef = this.posts.doc(postId);
    const edgeRef = this.likes.doc(edgeId(userId, postId));
    return this.db.runTransaction(async (tx) => {
      const [postSnap, edgeSnap] = await tx.getAll(postRef, edgeRef);
      const current = (postSnap.data()?.likeCount as number | undefined) ?? 0;
      const exists = edgeSnap.exists;

      if (liked && !exists) {
        tx.set(edgeRef, { userId, postId, createdAt: new Date().toISOString() });
        tx.update(postRef, { likeCount: FieldValue.increment(1) });
        return { likeCount: current + 1, liked: true };
      }
      if (!liked && exists) {
        tx.delete(edgeRef);
        tx.update(postRef, { likeCount: FieldValue.increment(-1) });
        return { likeCount: Math.max(0, current - 1), liked: false };
      }
      return { likeCount: current, liked };
    });
  }

  async setSave(userId: string, postId: string, saved: boolean): Promise<void> {
    const ref = this.saves.doc(edgeId(userId, postId));
    if (saved) {
      await ref.set({ userId, postId, createdAt: new Date().toISOString() });
    } else {
      await ref.delete();
    }
  }

  private async edgesAmong(
    col: CollectionReference<DocumentData>,
    userId: string,
    postIds: string[],
  ): Promise<Set<string>> {
    if (postIds.length === 0) return new Set();
    const refs = postIds.map((pid) => col.doc(edgeId(userId, pid)));
    const snaps = await this.db.getAll(...refs);
    return new Set(
      snaps.filter((s) => s.exists).map((s) => s.data()!.postId as string),
    );
  }

  private fromDoc(snap: QueryDocumentSnapshot<DocumentData>): FeedPostRecord {
    const data = snap.data();
    return {
      id: snap.id,
      type: data.type,
      author: data.author,
      audience: data.audience,
      challenge: data.challenge as Challenge,
      result: data.result as FeedResultSnapshot | undefined,
      likeCount: data.likeCount ?? 0,
      commentCount: data.commentCount ?? 0,
      createdAt: data.createdAt,
    };
  }
}
