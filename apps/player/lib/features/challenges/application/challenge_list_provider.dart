import 'package:flutter_riverpod/flutter_riverpod.dart';

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
  Future<List<Challenge>> build(ChallengeCategory arg) {
    return ref.watch(challengesRepositoryProvider).list(arg);
  }
}
