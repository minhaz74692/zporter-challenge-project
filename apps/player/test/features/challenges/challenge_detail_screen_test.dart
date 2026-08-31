import 'package:challenge/features/challenges/data/challenges_providers.dart';
import 'package:challenge/features/challenges/domain/challenge_enums.dart';
import 'package:challenge/features/challenges/presentation/challenge_detail_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../support/fake_challenges_repository.dart';
import '../../support/fixtures.dart';

void main() {
  setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);

  Future<FakeChallengesRepository> pumpScreen(
    WidgetTester tester, {
    InviteState? inviteState = InviteState.invited,
    bool ended = false,
  }) async {
    await tester.binding.setSurfaceSize(const Size(500, 1600));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final repo = FakeChallengesRepository()
      ..detail = buildChallengeDetail(
        id: 'x',
        inviteState: inviteState,
        ended: ended,
      );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [challengesRepositoryProvider.overrideWithValue(repo)],
        child: const MaterialApp(
          home: ChallengeDetailScreen(challengeId: 'x'),
        ),
      ),
    );
    await tester.pumpAndSettle();
    return repo;
  }

  testWidgets('shows the title, the three tabs and the instructions body', (
    tester,
  ) async {
    await pumpScreen(tester);

    expect(find.text('Keepie-Uppies Century'), findsWidgets); // app-bar title
    expect(find.text('Instructions'), findsOneWidget);
    expect(find.text('Report'), findsOneWidget);
    expect(find.text('Participants'), findsOneWidget);
    expect(find.text('Description'), findsOneWidget);
  });

  testWidgets('an invited viewer sees DECLINE / ACCEPT', (tester) async {
    await pumpScreen(tester);

    expect(find.text('DECLINE'), findsOneWidget);
    expect(find.text('ACCEPT'), findsOneWidget);
  });

  testWidgets('ACCEPT calls the repo and confirms with a snackbar', (
    tester,
  ) async {
    final repo = await pumpScreen(tester);

    await tester.tap(find.text('ACCEPT'));
    await tester.pump(); // start the future
    await tester.pump(const Duration(milliseconds: 50));

    expect(repo.accepted, ['x']);
    expect(find.text('Challenge accepted'), findsOneWidget);
  });

  testWidgets('an ended challenge disables the action bar', (tester) async {
    await pumpScreen(tester, ended: true);

    expect(find.text('Challenge ended'), findsOneWidget);
    expect(find.text('ACCEPT'), findsNothing);
  });

  testWidgets('an accepted viewer gets the Report action', (tester) async {
    await pumpScreen(tester, inviteState: InviteState.accepted);

    expect(find.text('Report result'), findsOneWidget);
  });

  testWidgets('a declined challenge shows no action bar', (tester) async {
    await pumpScreen(tester, inviteState: InviteState.declined);

    expect(find.text('DECLINE'), findsNothing);
    expect(find.text('ACCEPT'), findsNothing);
    expect(find.text('Report result'), findsNothing);
  });
}
