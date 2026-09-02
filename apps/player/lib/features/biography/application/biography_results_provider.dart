import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/biography_repository_impl.dart';
import '../domain/challenge_result.dart';

/// The signed-in user's reported results — the Biography "Challenges" tab.
final biographyResultsProvider =
    AsyncNotifierProvider<BiographyResultsNotifier, List<ChallengeResult>>(
  BiographyResultsNotifier.new,
);

class BiographyResultsNotifier extends AsyncNotifier<List<ChallengeResult>> {
  @override
  Future<List<ChallengeResult>> build() {
    return ref.watch(biographyRepositoryProvider).myResults();
  }
}
