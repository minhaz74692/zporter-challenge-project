import 'package:challenge/features/challenges/application/challenge_filter_provider.dart';
import 'package:challenge/features/challenges/domain/challenge_enums.dart';
import 'package:challenge/features/challenges/presentation/challenge_filter_sheet.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

void main() {
  setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);

  testWidgets('renders all six fields and writes selections to the provider', (
    tester,
  ) async {
    await tester.binding.setSurfaceSize(const Size(500, 1400));
    addTearDown(() => tester.binding.setSurfaceSize(null));

    final container = ProviderContainer();
    addTearDown(container.dispose);

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) => ElevatedButton(
                onPressed: () => showChallengeFilterSheet(context),
                child: const Text('open'),
              ),
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();

    for (final label in [
      'Sort by',
      'Country',
      'Location',
      'Users',
      'Age group',
      'Role',
    ]) {
      expect(find.text(label), findsOneWidget);
    }

    // Change Location -> Field via its dropdown menu.
    await tester.tap(find.byType(DropdownButtonFormField<ChallengeLocation?>));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Field').last);
    await tester.pumpAndSettle();

    expect(container.read(challengeFilterProvider).location, ChallengeLocation.field);
    expect(container.read(challengeFilterProvider).isNarrowing, isTrue);
  });

  testWidgets('close button dismisses the sheet', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        child: MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) => ElevatedButton(
                onPressed: () => showChallengeFilterSheet(context),
                child: const Text('open'),
              ),
            ),
          ),
        ),
      ),
    );

    await tester.tap(find.text('open'));
    await tester.pumpAndSettle();
    expect(find.text('Filter Challenges'), findsOneWidget);

    await tester.tap(find.byIcon(Icons.close_rounded));
    await tester.pumpAndSettle();
    expect(find.text('Filter Challenges'), findsNothing);
  });
}
