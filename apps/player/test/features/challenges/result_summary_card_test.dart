import 'package:challenge/features/challenges/domain/badge.dart';
import 'package:challenge/features/challenges/domain/challenge_enums.dart';
import 'package:challenge/features/challenges/domain/participant.dart';
import 'package:challenge/features/challenges/presentation/widgets/result_summary_card.dart';
import 'package:flutter/material.dart' hide Badge;
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

void main() {
  setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);

  SubmittedResult result({bool shareToFeed = false}) => SubmittedResult(
    value: 42,
    unit: ResultUnit.reps,
    videoUrl: '',
    performedAt: DateTime.utc(2026, 8, 30, 10),
    controllerRef: '#Coach',
    submittedAt: DateTime.utc(2026, 8, 30, 12),
    shareToFeed: shareToFeed,
  );

  Future<void> pump(WidgetTester tester, Widget child) => tester.pumpWidget(
    MaterialApp(home: Scaffold(body: SingleChildScrollView(child: child))),
  );

  testWidgets('no badge → plain header, no chip', (tester) async {
    await pump(tester, ResultSummaryCard(result: result()));
    expect(find.text('Result reported'), findsOneWidget);
    expect(find.textContaining('Earned'), findsNothing);
  });

  testWidgets('with a badge → celebratory header + "Earned <name>" chip', (
    tester,
  ) async {
    await pump(
      tester,
      ResultSummaryCard(
        result: result(),
        badge: const Badge(id: 'sharp-shooter', name: 'Sharp Shooter', icon: '🎯'),
      ),
    );
    expect(find.text('Challenge completed 🎉'), findsOneWidget);
    expect(find.text('Earned Sharp Shooter'), findsOneWidget);
  });

  testWidgets('shows the "Shared to your feed" line when the flag is set', (
    tester,
  ) async {
    await pump(tester, ResultSummaryCard(result: result(shareToFeed: true)));
    expect(find.text('Shared to your feed'), findsOneWidget);
  });
}
