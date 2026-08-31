import 'package:equatable/equatable.dart';

import 'challenge.dart';
import 'challenge_enums.dart';

/// How the filtered list is ordered. [label] is the full option text in the
/// filter sheet; [short] is the compact form in the green summary bar.
enum ChallengeSort {
  mostPopular('Most popular', 'Popular'),
  newest('Newest', 'Latest'),
  endingSoon('Ending soon', 'Ending soon'),
  topRated('Top rated', 'Top rated');

  const ChallengeSort(this.label, this.short);
  final String label;
  final String short;
}

/// ISO-ish country codes for the summary bar (`Sweden` → `SE`).
const _countryCodes = {
  'Sweden': 'SE',
  'Norway': 'NO',
  'Denmark': 'DK',
  'Finland': 'FI',
};

/// Age buckets for the "Age group" field. `from`/`to` are inclusive bounds
/// (null = open); a challenge matches when its own age range overlaps.
enum AgeGroup {
  all('All', null, null),
  under12('Under 12', null, 12),
  age12to15('12–15', 12, 15),
  age16to19('16–19', 16, 19),
  senior('18+', 18, null);

  const AgeGroup(this.label, this.from, this.to);
  final String label;
  final int? from;
  final int? to;
}

/// Playing-position buckets for the "Role" field.
enum ChallengeRole {
  all('All'),
  forwards('Forwards'),
  midfielders('Midfielders'),
  defenders('Defenders'),
  goalkeepers('Goalkeepers');

  const ChallengeRole(this.label);
  final String label;
}

/// The active challenge-list filter. Applied client-side to the rows already
/// fetched for a tab — see [apply]. `Country` and `Users` are part of the Figma
/// sheet but a challenge carries no such data, so they are captured and shown
/// but don't affect results yet.
class ChallengeFilter extends Equatable {
  const ChallengeFilter({
    this.sort = ChallengeSort.mostPopular,
    this.location,
    this.ageGroup = AgeGroup.all,
    this.role = ChallengeRole.all,
    this.country = 'All',
    this.users = 'All',
  });

  final ChallengeSort sort;
  final ChallengeLocation? location; // null = "All"
  final AgeGroup ageGroup;
  final ChallengeRole role;
  final String country;
  final String users;

  static const none = ChallengeFilter();

  /// True when anything narrows the list (sort alone doesn't count).
  bool get isNarrowing =>
      location != null ||
      ageGroup != AgeGroup.all ||
      role != ChallengeRole.all ||
      country != 'All' ||
      users != 'All';

  /// Compact pieces for the green summary bar, e.g. `['Latest', 'SE', 'Field']`.
  /// The sort is always shown; the rest only when set.
  List<String> get summaryParts => [
    sort.short,
    if (country != 'All') _countryCodes[country] ?? country,
    if (location != null) location!.label,
    if (ageGroup != AgeGroup.all) ageGroup.label,
    if (role != ChallengeRole.all) role.label,
    if (users != 'All') users,
  ];

  ChallengeFilter copyWith({
    ChallengeSort? sort,
    ChallengeLocation? location,
    bool clearLocation = false,
    AgeGroup? ageGroup,
    ChallengeRole? role,
    String? country,
    String? users,
  }) => ChallengeFilter(
    sort: sort ?? this.sort,
    location: clearLocation ? null : (location ?? this.location),
    ageGroup: ageGroup ?? this.ageGroup,
    role: role ?? this.role,
    country: country ?? this.country,
    users: users ?? this.users,
  );

  /// Filter then sort. Pure — returns a new list.
  List<Challenge> apply(List<Challenge> input) {
    final filtered = input.where(_matches).toList();
    filtered.sort(_compare);
    return filtered;
  }

  bool _matches(Challenge c) {
    if (location != null && c.location != location) return false;
    if (!_ageOverlaps(c)) return false;
    if (!_roleMatches(c)) return false;
    return true;
  }

  bool _ageOverlaps(Challenge c) {
    if (ageGroup == AgeGroup.all) return true;
    final cFrom = c.ageFrom ?? 0;
    final cTo = c.ageTo ?? 200;
    final gFrom = ageGroup.from ?? 0;
    final gTo = ageGroup.to ?? 200;
    return cFrom <= gTo && gFrom <= cTo;
  }

  bool _roleMatches(Challenge c) {
    if (role == ChallengeRole.all) return true;
    final pos = c.position?.toLowerCase().trim();
    if (pos == null || pos.isEmpty || pos == 'all') return true;
    return pos == role.label.toLowerCase();
  }

  int _compare(Challenge a, Challenge b) {
    switch (sort) {
      case ChallengeSort.mostPopular:
        final byLikes = b.likeCount.compareTo(a.likeCount);
        return byLikes != 0
            ? byLikes
            : b.participantCount.compareTo(a.participantCount);
      case ChallengeSort.newest:
        return b.createdAt.compareTo(a.createdAt);
      case ChallengeSort.endingSoon:
        return a.deadline.compareTo(b.deadline);
      case ChallengeSort.topRated:
        return (b.ratingAverage ?? 0).compareTo(a.ratingAverage ?? 0);
    }
  }

  @override
  List<Object?> get props => [sort, location, ageGroup, role, country, users];
}
