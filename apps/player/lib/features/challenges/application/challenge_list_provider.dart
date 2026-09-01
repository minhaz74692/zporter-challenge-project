import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/application/auth_notifier.dart';
import '../data/challenges_providers.dart';
import '../domain/challenge.dart';
import '../domain/challenge_enums.dart';

/// The caller's challenges for one list tab. One instance per
/// [ChallengeCategory] (a provider family), so the five tabs load and cache
/// independently.
///
/// Pull-to-refresh: `ref.refresh(challengeListProvider(category).future)`.
/// After an accept/decline elsewhere, `ref.invalidate(challengeListProvider)`
/// re-fetches every tab.
final challengeListProvider = AsyncNotifierProvider.family<
    ChallengeListNotifier, List<Challenge>, ChallengeCategory>(
  ChallengeListNotifier.new,
);

class ChallengeListNotifier
    extends FamilyAsyncNotifier<List<Challenge>, ChallengeCategory> {
  @override
  Future<List<Challenge>> build(ChallengeCategory arg) async {
    // Gate the fetch on an established session. Right after login the access
    // token can lag the navigation by a frame, so a request fired the instant
    // the screen mounts may 401; awaiting the auth future keeps the tab on its
    // shimmer until the session is ready, and rebuilds it cleanly (never
    // inheriting a previous session's error) when the account changes.
    final user = await ref.watch(authNotifierProvider.future);
    if (user == null) return const <Challenge>[];

    return ref.watch(challengesRepositoryProvider).list(arg);
  }
}
