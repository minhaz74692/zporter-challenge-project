import 'package:challenge/features/challenges/data/challenges_providers.dart';
import 'package:challenge/features/challenges/presentation/widgets/challenge_report_view.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../support/fake_challenges_repository.dart';
import '../../support/fixtures.dart';

void main() {
  setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);

  Future<FakeChallengesRepository> pump(
    WidgetTester tester, {
    bool canReport = true,
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
                canReport: canReport,
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
    await pump(tester, canReport: false);
    expect(
      find.text('Accept this challenge to report a result.'),
      findsOneWidget,
    );
    expect(find.text('Video documentation'), findsNothing);
  });

  testWidgets('renders the form fields', (tester) async {
    await pump(tester);
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
    final repo = await pump(tester);

    await tester.enterText(find.byType(TextField).first, '25'); // result value
    await tester.tap(find.widgetWithText(ElevatedButton, 'Save'));
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));

    expect(find.text('Video must be added to report Challenge'), findsOneWidget);
    expect(repo.submitted, isEmpty);
  });
}
