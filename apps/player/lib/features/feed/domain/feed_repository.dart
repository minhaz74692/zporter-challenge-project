import 'feed_post.dart';

/// The feed data boundary. `data/` implements it against the REST API; tests
/// supply a fake.
abstract interface class FeedRepository {
  /// One tab's posts, newest first.
  Future<List<FeedPost>> list(FeedTab tab);

  /// Like / unlike a post — returns the server's new like count.
  Future<int> setLike(String postId, {required bool liked});

  /// Save / unsave a post.
  Future<void> setSave(String postId, {required bool saved});
}
