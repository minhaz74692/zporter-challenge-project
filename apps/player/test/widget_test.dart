import 'package:challenge/app.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('app boots to the foundation placeholder', (tester) async {
    await tester.pumpWidget(const ProviderScope(child: ZporterChallengeApp()));

    expect(find.text('Zporter Challenges'), findsOneWidget);
  });
}
