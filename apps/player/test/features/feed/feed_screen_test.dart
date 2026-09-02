import 'package:challenge/features/feed/data/feed_repository_impl.dart';
import 'package:challenge/features/feed/domain/feed_post.dart';
import 'package:challenge/features/feed/presentation/feed_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../support/fake_feed_repository.dart';
import 'feed_post_test.dart' show challengePostJson, resultPostJson;

void main() {
  setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);

  Future<FakeFeedRepository> pump(WidgetTester tester) async {
    await tester.binding.setSurfaceSize(const Size(500, 3000));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final repo = FakeFeedRepository();
    repo.seed(FeedTab.yours, [
      FeedPost.fromJson({...challengePostJson(), 'likedByMe': false}),
    ]);
    repo.seed(FeedTab.team, [FeedPost.fromJson(resultPostJson())]);
    final router = GoRouter(
      routes: [
        GoRoute(path: '/', builder: (_, __) => const FeedScreen()),
        GoRoute(
          path: '/challenges/:id',
          builder: (_, s) => Text('challenge ${s.pathParameters['id']}'),
        ),
      ],
    );
    await tester.pumpWidget(
      ProviderScope(
        overrides: [feedRepositoryProvider.overrideWithValue(repo)],
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pumpAndSettle();
    return repo;
  }

  testWidgets('renders the three tabs and the Yours feed by default', (tester) async {
    await pump(tester);

    expect(find.text('Feed'), findsOneWidget);
    expect(find.text('Team'), findsOneWidget);
    expect(find.text('Yours'), findsOneWidget);
    expect(find.text('Saved'), findsOneWidget);
    // The challenge_published post's Open button is on screen.
    expect(find.widgetWithText(ElevatedButton, 'Open'), findsOneWidget);
  });

  testWidgets('tapping the heart calls the repo with liked: true', (tester) async {
    final repo = await pump(tester);

    await tester.tap(find.byIcon(Icons.favorite_border_rounded));
    await tester.pumpAndSettle();

    expect(repo.likeCalls, [(id: 'p1', liked: true)]);
  });

  testWidgets('Open on a challenge post deep-links to the challenge', (tester) async {
    await pump(tester);

    await tester.tap(find.widgetWithText(ElevatedButton, 'Open'));
    await tester.pumpAndSettle();

    expect(find.text('challenge c_1'), findsOneWidget);
  });
}
