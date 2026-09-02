import 'package:challenge/features/auth/application/auth_notifier.dart';
import 'package:challenge/features/auth/domain/user.dart';
import 'package:challenge/features/biography/data/biography_repository_impl.dart';
import 'package:challenge/features/biography/domain/challenge_result.dart';
import 'package:challenge/features/biography/presentation/biography_screen.dart';
import 'package:challenge/features/challenges/domain/participant.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../support/fake_biography_repository.dart';
import '../../support/fixtures.dart';

void main() {
  setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);

  final user = User(
    id: 'u1',
    email: 'p@zporter.test',
    displayName: 'Neo Jönsson',
    role: UserRole.player,
    handle: '#NeoJon070119',
    country: 'SE',
    position: 'FW',
    createdAt: DateTime.utc(2021, 1, 14),
    birthDate: DateTime.utc(2007, 1, 19),
    heightCm: 152,
    weightKg: 46,
    foot: PreferredFoot.left,
    marketValue: '? M€',
    bio: 'Two footed, quick, technical playmaker.',
    ratingPercent: 75,
    friendsCount: 20,
    socials: const {'instagram': 'https://ig/x'},
  );

  ChallengeResult resultEntry() => ChallengeResult(
    challenge: buildChallenge(title: 'Bench Press Max'),
    result: SubmittedResult.fromJson({
      'value': 120,
      'unit': 'kg',
      'videoUrl': 'https://v/clip.mp4',
      'performedAt': '2026-01-31T18:15:00.000Z',
      'arena': 'SATS Häggvik',
      'controllerRef': '#Coach',
      'submittedAt': '2026-02-01T00:00:00.000Z',
    }),
  );

  Future<FakeBiographyRepository> pump(
    WidgetTester tester, {
    List<ChallengeResult> results = const [],
  }) async {
    await tester.binding.setSurfaceSize(const Size(500, 2400));
    addTearDown(() => tester.binding.setSurfaceSize(null));
    final repo = FakeBiographyRepository()..results = results;
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          biographyRepositoryProvider.overrideWithValue(repo),
          authNotifierProvider.overrideWith(() => _StubAuth(user)),
        ],
        child: const MaterialApp(home: BiographyScreen()),
      ),
    );
    await tester.pumpAndSettle();
    return repo;
  }

  testWidgets('renders identity, stats and the bio blurb', (tester) async {
    await pump(tester);

    expect(find.text('Biography'), findsOneWidget);
    expect(find.text('Neo Jönsson'), findsOneWidget);
    expect(find.text('#NeoJon070119'), findsOneWidget);
    expect(find.text('FW'), findsOneWidget);
    expect(find.text('152cm'), findsOneWidget);
    expect(find.text('LEFT'), findsOneWidget);
    expect(find.text('75%'), findsOneWidget);
    expect(find.textContaining('Two footed'), findsOneWidget);
    // Challenges / Programs / Tests tabs.
    expect(find.text('Challenges'), findsOneWidget);
    expect(find.text('Programs'), findsOneWidget);
    expect(find.text('Tests'), findsOneWidget);
  });

  testWidgets('Challenges tab lists the reported results', (tester) async {
    await pump(tester, results: [resultEntry()]);

    expect(find.text('Bench Press Max'), findsOneWidget);
    expect(find.text('120 kg'), findsOneWidget);
    expect(find.textContaining('SATS Häggvik'), findsOneWidget);
  });

  testWidgets('switching to Programs shows the stub, not results', (tester) async {
    await pump(tester, results: [resultEntry()]);

    await tester.tap(find.text('Programs'));
    await tester.pumpAndSettle();

    expect(find.text('Bench Press Max'), findsNothing);
    expect(find.text('Nothing here yet.'), findsOneWidget);
  });
}

/// Minimal [AuthNotifier] stub that resolves straight to [user].
class _StubAuth extends AuthNotifier {
  _StubAuth(this._user);

  final User _user;

  @override
  Future<User?> build() async => _user;
}
