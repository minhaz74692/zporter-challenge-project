import 'package:challenge/core/network/api_exception.dart';
import 'package:challenge/features/feed/application/feed_provider.dart';
import 'package:challenge/features/feed/data/feed_repository_impl.dart';
import 'package:challenge/features/feed/domain/feed_post.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../support/fake_feed_repository.dart';
import 'feed_post_test.dart' show challengePostJson;

void main() {
  late FakeFeedRepository repo;

  ProviderContainer containerWith() {
    final c = ProviderContainer(
      overrides: [feedRepositoryProvider.overrideWithValue(repo)],
    );
    addTearDown(c.dispose);
    return c;
  }

  FeedPost post({bool liked = false, int likeCount = 0, bool saved = false}) =>
      FeedPost.fromJson({
        ...challengePostJson(),
        'id': 'p1',
        'likedByMe': liked,
        'likeCount': likeCount,
        'savedByMe': saved,
      });

  setUp(() => repo = FakeFeedRepository());

  test('toggleLike optimistically flips the flag + count, then calls the repo', () async {
    repo.seed(FeedTab.yours, [post(likeCount: 2)]);
    final container = containerWith();
    await container.read(feedProvider(FeedTab.yours).future);

    await container.read(feedProvider(FeedTab.yours).notifier).toggleLike('p1');

    final updated = container.read(feedProvider(FeedTab.yours)).value!.single;
    expect(updated.likedByMe, isTrue);
    expect(updated.likeCount, 3);
    expect(repo.likeCalls, [(id: 'p1', liked: true)]);
  });

  test('a failed toggleLike rolls back and rethrows ApiException', () async {
    repo.seed(FeedTab.yours, [post(liked: true, likeCount: 5)]);
    repo.writeError =
        const ApiException(statusCode: 500, message: 'nope');
    final container = containerWith();
    await container.read(feedProvider(FeedTab.yours).future);

    await expectLater(
      container.read(feedProvider(FeedTab.yours).notifier).toggleLike('p1'),
      throwsA(isA<ApiException>()),
    );

    final rolledBack = container.read(feedProvider(FeedTab.yours)).value!.single;
    expect(rolledBack.likedByMe, isTrue);
    expect(rolledBack.likeCount, 5);
  });

  test('toggleSave flips the flag and invalidates the Saved tab', () async {
    repo.seed(FeedTab.yours, [post()]);
    final container = containerWith();
    await container.read(feedProvider(FeedTab.yours).future);
    // Prime the Saved tab so we can observe it being invalidated.
    repo.seed(FeedTab.saved, [post(saved: true)]);
    await container.read(feedProvider(FeedTab.saved).future);

    await container.read(feedProvider(FeedTab.yours).notifier).toggleSave('p1');

    expect(
      container.read(feedProvider(FeedTab.yours)).value!.single.savedByMe,
      isTrue,
    );
    expect(repo.saveCalls, [(id: 'p1', saved: true)]);
  });

  test('un-saving from the Saved tab removes the row immediately', () async {
    repo.seed(FeedTab.saved, [post(saved: true), post(saved: true)]);
    // Give the two posts distinct ids.
    repo.seed(FeedTab.saved, [
      FeedPost.fromJson({...challengePostJson(), 'id': 'p1', 'savedByMe': true}),
      FeedPost.fromJson({...challengePostJson(), 'id': 'p2', 'savedByMe': true}),
    ]);
    final container = containerWith();
    await container.read(feedProvider(FeedTab.saved).future);

    await container.read(feedProvider(FeedTab.saved).notifier).toggleSave('p1');

    final remaining = container.read(feedProvider(FeedTab.saved)).value!;
    expect(remaining.map((p) => p.id), ['p2']);
    expect(repo.saveCalls, [(id: 'p1', saved: false)]);
  });
}
