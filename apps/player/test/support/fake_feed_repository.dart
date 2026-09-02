import 'package:challenge/features/feed/domain/feed_post.dart';
import 'package:challenge/features/feed/domain/feed_repository.dart';

/// In-memory [FeedRepository] for provider + widget tests.
class FakeFeedRepository implements FeedRepository {
  FakeFeedRepository({Map<FeedTab, List<FeedPost>>? posts})
      : _posts = posts ?? {for (final t in FeedTab.values) t: const []};

  final Map<FeedTab, List<FeedPost>> _posts;

  /// Set to make the next write throw.
  Object? writeError;

  final List<({String id, bool liked})> likeCalls = [];
  final List<({String id, bool saved})> saveCalls = [];

  void seed(FeedTab tab, List<FeedPost> posts) => _posts[tab] = posts;

  @override
  Future<List<FeedPost>> list(FeedTab tab) async => _posts[tab] ?? const [];

  @override
  Future<int> setLike(String postId, {required bool liked}) async {
    if (writeError != null) throw writeError!;
    likeCalls.add((id: postId, liked: liked));
    return liked ? 1 : 0;
  }

  @override
  Future<void> setSave(String postId, {required bool saved}) async {
    if (writeError != null) throw writeError!;
    saveCalls.add((id: postId, saved: saved));
  }
}
