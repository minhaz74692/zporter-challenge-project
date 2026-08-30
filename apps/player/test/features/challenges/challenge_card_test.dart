import 'package:challenge/features/challenges/presentation/widgets/challenge_card.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../support/fixtures.dart';

void main() {
  setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);

  // The card is taller than the default 800x600 test surface — give it room so
  // every section is on-screen and tappable.
  Future<void> pumpCard(WidgetTester tester, Widget card) async {
    await tester.binding.setSurfaceSize(const Size(500, 3000));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    await tester.pumpWidget(
      MaterialApp(home: Scaffold(body: SingleChildScrollView(child: card))),
    );
    await tester.pump();
  }

  testWidgets('renders the headline, stats, pills and Open action', (tester) async {
    await pumpCard(
      tester,
      ChallengeCard(
        challenge: buildChallenge(title: 'Challenge headline 1'),
        onOpen: () {},
      ),
    );

    expect(find.text('Challenge headline 1'), findsOneWidget);
    expect(find.text('15min'), findsOneWidget); // durationMinutes
    expect(find.text('Gym'), findsOneWidget); // location label
    expect(find.text('Technics'), findsOneWidget); // mainCategory label
    expect(find.text('Balls'), findsOneWidget); // equipment pill, '#' stripped
    expect(find.widgetWithText(ElevatedButton, 'Open'), findsOneWidget);
  });

  testWidgets('Description toggle reveals the body text', (tester) async {
    await pumpCard(tester, ChallengeCard(challenge: buildChallenge(), onOpen: () {}));

    expect(find.textContaining('One attempt, no hands'), findsNothing);

    await tester.tap(find.text('Description'));
    await tester.pump();

    expect(find.textContaining('One attempt, no hands'), findsOneWidget);
  });

  testWidgets('Open fires the callback', (tester) async {
    var opened = false;
    await pumpCard(
      tester,
      ChallengeCard(challenge: buildChallenge(), onOpen: () => opened = true),
    );

    await tester.tap(find.widgetWithText(ElevatedButton, 'Open'));
    expect(opened, isTrue);
  });
}
