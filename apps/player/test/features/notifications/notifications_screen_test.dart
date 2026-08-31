import 'package:challenge/features/challenges/data/challenges_providers.dart';
import 'package:challenge/features/notifications/data/notifications_repository_impl.dart';
import 'package:challenge/features/notifications/domain/app_notification.dart';
import 'package:challenge/features/notifications/presentation/notifications_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../support/fake_challenges_repository.dart';
import '../../support/fake_notifications_repository.dart';

void main() {
  setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);

  Future<(FakeNotificationsRepository, FakeChallengesRepository)> pump(
    WidgetTester tester,
    List<AppNotification> items,
  ) async {
    final notif = FakeNotificationsRepository()..items = items;
    final challenges = FakeChallengesRepository();
    final router = GoRouter(
      routes: [
        GoRoute(path: '/', builder: (_, __) => const NotificationsScreen()),
        GoRoute(
          path: '/challenges/:id',
          builder: (_, s) => Text('challenge ${s.pathParameters['id']}'),
        ),
      ],
    );
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          notificationsRepositoryProvider.overrideWithValue(notif),
          challengesRepositoryProvider.overrideWithValue(challenges),
        ],
        child: MaterialApp.router(routerConfig: router),
      ),
    );
    await tester.pumpAndSettle();
    return (notif, challenges);
  }

  testWidgets('lists notifications; tapping an invite marks read + deep-links', (
    tester,
  ) async {
    final (notif, _) = await pump(tester, [
      buildNotification(title: 'New challenge', challengeId: 'c9'),
    ]);

    expect(find.text('New challenge'), findsOneWidget);

    await tester.tap(find.text('New challenge'));
    await tester.pumpAndSettle();

    expect(notif.readIds, ['n1']);
    expect(find.text('challenge c9'), findsOneWidget);
  });

  testWidgets('a verify request opens the approve/reject sheet', (tester) async {
    final (_, challenges) = await pump(tester, [
      buildNotification(
        id: 'v1',
        type: AppNotificationType.resultVerifyRequest,
        title: 'Priya asked you to verify a result',
        actorId: 'u_priya',
      ),
    ]);

    await tester.tap(find.text('Priya asked you to verify a result'));
    await tester.pumpAndSettle();

    expect(find.text('VERIFY'), findsOneWidget);
    expect(find.text('REJECT'), findsOneWidget);

    await tester.tap(find.text('VERIFY'));
    await tester.pumpAndSettle();

    expect(challenges.verified, [('c1', 'u_priya', true)]);
  });

  testWidgets('empty state', (tester) async {
    await pump(tester, const []);
    expect(find.text('No notifications yet.'), findsOneWidget);
  });
}
