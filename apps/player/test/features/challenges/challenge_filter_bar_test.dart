import 'package:challenge/features/challenges/application/challenge_filter_provider.dart';
import 'package:challenge/features/challenges/domain/challenge_enums.dart';
import 'package:challenge/features/challenges/domain/challenge_filter.dart';
import 'package:challenge/features/challenges/presentation/widgets/challenge_filter_bar.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

void main() {
  setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);

  testWidgets('shows the green filter summary and opens both sheets', (
    tester,
  ) async {
    final container = ProviderContainer();
    addTearDown(container.dispose);
    container.read(challengeFilterProvider.notifier).update(
      const ChallengeFilter(
        sort: ChallengeSort.newest,
        location: ChallengeLocation.field,
      ),
    );

    await tester.pumpWidget(
      UncontrolledProviderScope(
        container: container,
        child: const MaterialApp(
          home: Scaffold(body: ChallengeFilterBar()),
        ),
      ),
    );

    expect(find.text('Latest, Field'), findsOneWidget);

    await tester.tap(find.byIcon(Icons.filter_list_rounded));
    await tester.pumpAndSettle();
    expect(find.text('Filter Challenges'), findsOneWidget);
    await tester.tap(find.byIcon(Icons.close_rounded));
    await tester.pumpAndSettle();

    await tester.tap(find.byIcon(Icons.swap_vert_rounded));
    await tester.pumpAndSettle();
    expect(find.text('Sort by'), findsOneWidget);
    expect(find.text('Ending soon'), findsOneWidget); // a sort option row
  });
}
