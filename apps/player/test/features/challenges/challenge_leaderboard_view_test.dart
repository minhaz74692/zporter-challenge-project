import 'package:challenge/core/network/network_providers.dart';
import 'package:challenge/features/auth/data/auth_providers.dart';
import 'package:challenge/features/challenges/data/challenges_providers.dart';
import 'package:challenge/features/challenges/presentation/widgets/challenge_leaderboard_view.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../support/fake_auth_repository.dart';
import '../../support/fake_challenges_repository.dart';
import '../../support/fake_token_storage.dart';
import '../../support/fixtures.dart';

void main() {
  setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);

  Future<void> pump(WidgetTester tester, {String meId = 'u_me'}) async {
    await tester.binding.setSurfaceSize(const Size(500, 1600));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final repo = FakeChallengesRepository()..leaderboardRows = buildLeaderboard();
    final authRepo = FakeAuthRepository()..meResult = buildUser(id: meId);

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          challengesRepositoryProvider.overrideWithValue(repo),
          authRepositoryProvider.overrideWithValue(authRepo),
          tokenStorageProvider.overrideWithValue(
            FakeTokenStorage(access: 'tok'),
          ),
        ],
        child: const MaterialApp(
          home: Scaffold(body: ChallengeLeaderboardView('c1')),
        ),
      ),
    );
    await tester.pumpAndSettle();
  }

  testWidgets('renders the last-updated line, podium and every ranked row', (
    tester,
  ) async {
    await pump(tester);

    expect(find.text('Last updated: 05/12/2023'), findsOneWidget);
    expect(find.text('#MohSal123456'), findsOneWidget); // podium #1 handle
    expect(find.text('Mohamed Salah'), findsOneWidget); // table row
    expect(find.text('1 903'), findsOneWidget); // space-grouped score
    expect(find.text('Leo Messi'), findsOneWidget);
  });

  testWidgets("the viewer's own row is green", (tester) async {
    await pump(tester);

    final mine = tester.widget<Text>(find.text('Mohamed Salah'));
    expect(mine.style?.color, const Color(0xFF25D07D)); // AppColors.success
  });
}
