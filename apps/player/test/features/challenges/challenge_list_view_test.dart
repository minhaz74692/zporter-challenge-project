import 'dart:async';

import 'package:challenge/features/challenges/data/challenges_providers.dart';
import 'package:challenge/features/challenges/domain/challenge_enums.dart';
import 'package:challenge/features/challenges/presentation/widgets/challenge_card_skeleton.dart';
import 'package:challenge/features/challenges/presentation/widgets/challenge_list_view.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../support/fake_challenges_repository.dart';
import '../../support/fixtures.dart';

void main() {
  setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);

  Widget host(FakeChallengesRepository repo, ChallengeCategory category) {
    return ProviderScope(
      overrides: [challengesRepositoryProvider.overrideWithValue(repo)],
      child: MaterialApp(home: Scaffold(body: ChallengeListView(category: category))),
    );
  }

  testWidgets('shows a card per challenge for the tab', (tester) async {
    await tester.binding.setSurfaceSize(const Size(500, 4000));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final repo = FakeChallengesRepository()
      ..lists[ChallengeCategory.done] = [
        buildChallenge(id: 'a', title: 'Challenge headline 1'),
        buildChallenge(id: 'b', title: 'Challenge headline 2'),
      ];

    await tester.pumpWidget(host(repo, ChallengeCategory.done));
    await tester.pumpAndSettle();

    expect(find.text('Challenge headline 1'), findsOneWidget);
    expect(find.text('Challenge headline 2'), findsOneWidget);
    expect(find.widgetWithText(ElevatedButton, 'Open'), findsNWidgets(2));
  });

  testWidgets('empty tab shows the empty message', (tester) async {
    await tester.pumpWidget(host(FakeChallengesRepository(), ChallengeCategory.declined));
    await tester.pumpAndSettle();

    expect(find.text('No declined challenges.'), findsOneWidget);
  });

  testWidgets('a load error shows Retry', (tester) async {
    final repo = FakeChallengesRepository()..listError = Exception('boom');

    await tester.pumpWidget(host(repo, ChallengeCategory.active));
    await tester.pumpAndSettle();

    expect(find.text('Retry'), findsOneWidget);
  });

  testWidgets('shows the shimmer skeleton while loading, then the cards', (
    tester,
  ) async {
    final gate = Completer<void>();
    final repo = FakeChallengesRepository()
      ..listGate = gate
      ..lists[ChallengeCategory.active] = [buildChallenge(title: 'Loaded')];

    await tester.pumpWidget(host(repo, ChallengeCategory.active));
    await tester.pump(); // one frame — do NOT settle (shimmer animates forever)

    expect(find.byType(ChallengeListSkeleton), findsOneWidget);
    expect(find.text('Loaded'), findsNothing);

    gate.complete();
    await tester.pumpAndSettle();

    expect(find.byType(ChallengeListSkeleton), findsNothing);
    expect(find.text('Loaded'), findsOneWidget);
  });
}
