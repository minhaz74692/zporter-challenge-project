import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../domain/challenge_filter.dart';

/// The active list filter, shared across all five tabs. Applied client-side in
/// `ChallengeListView`; changing it re-filters without re-fetching.
final challengeFilterProvider =
    NotifierProvider<ChallengeFilterNotifier, ChallengeFilter>(
  ChallengeFilterNotifier.new,
);

class ChallengeFilterNotifier extends Notifier<ChallengeFilter> {
  @override
  ChallengeFilter build() => ChallengeFilter.none;

  void update(ChallengeFilter filter) => state = filter;

  void reset() => state = ChallengeFilter.none;
}
