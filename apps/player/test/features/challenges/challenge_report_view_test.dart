import 'package:challenge/features/challenges/data/challenges_providers.dart';
import 'package:challenge/features/challenges/domain/challenge_enums.dart';
import 'package:challenge/features/challenges/domain/participant.dart';
import 'package:challenge/features/challenges/presentation/widgets/challenge_report_view.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../support/fake_challenges_repository.dart';
import '../../support/fixtures.dart';

void main() {
  setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);

  const accepted = ParticipantSummary(
    inviteState: InviteState.accepted,
    resultState: ResultState.pending,
  );

  Future<FakeChallengesRepository> pump(
    WidgetTester tester, {
    ParticipantSummary? participant,
  }) async {
    await tester.binding.setSurfaceSize(const Size(500, 1600));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final repo = FakeChallengesRepository();
    await tester.pumpWidget(
      ProviderScope(
        overrides: [challengesRepositoryProvider.overrideWithValue(repo)],
        child: MaterialApp(
          home: DefaultTabController(
            length: 1,
            child: Scaffold(
              body: ChallengeReportView(
                challenge: buildChallenge(),
                participant: participant,
              ),
            ),
          ),
        ),
      ),
    );
    await tester.pump();
    return repo;
  }

  testWidgets('without acceptance it prompts to accept first', (tester) async {
    await pump(tester);
    expect(
      find.text('Accept this challenge to report a result.'),
      findsOneWidget,
    );
    expect(find.text('Video documentation'), findsNothing);
  });

  testWidgets('an accepted, un-submitted viewer sees the form', (tester) async {
    await pump(tester, participant: accepted);
    expect(find.text('Video documentation'), findsOneWidget);
    expect(find.text('Challenge result'), findsOneWidget);
    expect(find.text('Date'), findsOneWidget);
    expect(find.text('Time'), findsOneWidget);
    expect(find.text('Arena'), findsOneWidget);
    expect(find.text('Controller'), findsOneWidget);
    expect(find.widgetWithText(ElevatedButton, 'Save'), findsOneWidget);
  });

  testWidgets('Save without a video shows the Figma error and does not call the API', (
    tester,
  ) async {
    final repo = await pump(tester, participant: accepted);

    await tester.enterText(find.byType(TextField).first, '25'); // result value
    await tester.tap(find.widgetWithText(ElevatedButton, 'Save'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));

    expect(find.text('Video must be added to report Challenge'), findsOneWidget);
    expect(repo.submitted, isEmpty);
  });

  testWidgets('after submitting it shows the read-only result summary', (
    tester,
  ) async {
    final submitted = ParticipantSummary(
      inviteState: InviteState.accepted,
      resultState: ResultState.completed,
      rank: 1,
      submittedResult: SubmittedResult(
        value: 42,
        unit: ResultUnit.reps,
        videoUrl: 'https://v.test/x.mp4',
        performedAt: DateTime.utc(2026, 8, 30, 9),
        controllerRef: '#CoaCar900002',
        arena: 'Malmo IP',
        submittedAt: DateTime.utc(2026, 8, 30, 10),
      ),
    );

    await pump(tester, participant: submitted);

    expect(find.text('Result reported'), findsOneWidget);
    expect(find.text('42 reps'), findsOneWidget);
    expect(find.text('#1'), findsOneWidget);
    expect(find.text('#CoaCar900002'), findsOneWidget);
    expect(find.text('Malmo IP'), findsOneWidget);
    expect(find.text('Video documentation'), findsNothing); // no form
  });
}
