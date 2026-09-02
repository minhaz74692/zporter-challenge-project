import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/feed_repository_impl.dart';
import '../domain/feed_post.dart';

/// One feed tab's posts. The three tabs load and cache independently
/// (`family` by [FeedTab]); a like / save is applied optimistically here and
/// rolled back if the write fails.
final feedProvider =
    AsyncNotifierProvider.family<FeedNotifier, List<FeedPost>, FeedTab>(
  FeedNotifier.new,
);

class FeedNotifier extends FamilyAsyncNotifier<List<FeedPost>, FeedTab> {
  @override
  Future<List<FeedPost>> build(FeedTab arg) {
    return ref.watch(feedRepositoryProvider).list(arg);
  }

  Future<void> toggleLike(String postId) async {
    final liked = _find(postId)?.likedByMe;
    if (liked == null) return;
    _patch(postId, (p) => p.withLike(liked: !liked));
    try {
      await ref.read(feedRepositoryProvider).setLike(postId, liked: !liked);
    } catch (_) {
      _patch(postId, (p) => p.withLike(liked: liked)); // roll back
      rethrow;
    }
  }

  Future<void> toggleSave(String postId) async {
    final current = _find(postId);
    if (current == null) return;
    final next = !current.savedByMe;

    // On the Saved tab, un-saving drops the row entirely; elsewhere just flip
    // the bookmark. The Saved tab is invalidated so it re-fetches on next view.
    final dropFromSavedTab = arg == FeedTab.saved && !next;
    if (dropFromSavedTab) {
      _removeById(postId);
    } else {
      _patch(postId, (p) => p.withSave(saved: next));
    }

    try {
      await ref.read(feedRepositoryProvider).setSave(postId, saved: next);
      if (arg != FeedTab.saved) ref.invalidate(feedProvider(FeedTab.saved));
    } catch (_) {
      if (dropFromSavedTab) {
        ref.invalidateSelf(); // simplest correct rollback: re-fetch the tab
      } else {
        _patch(postId, (p) => p.withSave(saved: current.savedByMe));
      }
      rethrow;
    }
  }

  FeedPost? _find(String id) {
    for (final p in state.valueOrNull ?? const <FeedPost>[]) {
      if (p.id == id) return p;
    }
    return null;
  }

  void _patch(String id, FeedPost Function(FeedPost) update) {
    final current = state.valueOrNull;
    if (current == null) return;
    state = AsyncData([
      for (final p in current) if (p.id == id) update(p) else p,
    ]);
  }

  void _removeById(String id) {
    final current = state.valueOrNull;
    if (current == null) return;
    state = AsyncData([
      for (final p in current) if (p.id != id) p,
    ]);
  }
}
