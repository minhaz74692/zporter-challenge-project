// Wire <-> domain enums for the challenge feature.
//
// Every enum carries its API string (`apiValue`) and a display `label`, and a
// tolerant `fromApi` that falls back rather than throwing on an unknown value
// (the server is the source of truth, but a prototype shouldn't crash on a new
// enum member it hasn't shipped support for yet).

/// The five player list tabs, in Figma order. `apiValue` is the `?category=`
/// query value.
enum ChallengeCategory {
  done('done', 'Done'),
  active('active', 'Active'),
  fresh('new', 'New'),
  declined('declined', 'Declined'),
  ended('ended', 'Ended');

  const ChallengeCategory(this.apiValue, this.label);
  final String apiValue;
  final String label;
}

enum ChallengeStatus {
  draft('draft', 'Draft'),
  active('active', 'Active'),
  ended('ended', 'Ended');

  const ChallengeStatus(this.apiValue, this.label);
  final String apiValue;
  final String label;

  static ChallengeStatus fromApi(String? raw) =>
      values.firstWhere((e) => e.apiValue == raw, orElse: () => ChallengeStatus.active);
}

enum InviteState {
  invited('invited'),
  accepted('accepted'),
  declined('declined');

  const InviteState(this.apiValue);
  final String apiValue;

  static InviteState fromApi(String? raw) =>
      values.firstWhere((e) => e.apiValue == raw, orElse: () => InviteState.invited);
}

enum ResultState {
  pending('pending'),
  submitted('submitted'),
  completed('completed');

  const ResultState(this.apiValue);
  final String apiValue;

  static ResultState fromApi(String? raw) =>
      values.firstWhere((e) => e.apiValue == raw, orElse: () => ResultState.pending);
}

/// Figma "Main Category". Note the Zporter labels: `technical` shows as
/// "Technics", `tactical` as "Tactics".
enum ChallengeMainCategory {
  physical('physical', 'Physical'),
  technical('technical', 'Technics'),
  tactical('tactical', 'Tactics'),
  mental('mental', 'Mental'),
  rehab('rehab', 'Rehab'),
  other('other', 'Other');

  const ChallengeMainCategory(this.apiValue, this.label);
  final String apiValue;
  final String label;

  static ChallengeMainCategory fromApi(String? raw) => values.firstWhere(
    (e) => e.apiValue == raw,
    orElse: () => ChallengeMainCategory.other,
  );
}

enum ChallengeLocation {
  anywhere('anywhere', 'Anywhere'),
  field('field', 'Field'),
  gym('gym', 'Gym'),
  court('court', 'Court'),
  home('home', 'Home');

  const ChallengeLocation(this.apiValue, this.label);
  final String apiValue;
  final String label;

  static ChallengeLocation fromApi(String? raw) => values.firstWhere(
    (e) => e.apiValue == raw,
    orElse: () => ChallengeLocation.anywhere,
  );
}

/// How a submitted result is entered and scored.
enum ResultType {
  count('count'),
  time('time'),
  boolean('boolean'),
  score('score'),
  text('text'),
  proof('proof');

  const ResultType(this.apiValue);
  final String apiValue;

  static ResultType fromApi(String? raw) =>
      values.firstWhere((e) => e.apiValue == raw, orElse: () => ResultType.count);
}

/// Display unit for a result value (the "kg" in "125 kg").
enum ResultUnit {
  reps('reps', 'reps'),
  count('count', ''),
  seconds('seconds', 's'),
  kg('kg', 'kg'),
  meters('meters', 'm'),
  points('points', 'p'),
  boolean('boolean', '');

  const ResultUnit(this.apiValue, this.short);
  final String apiValue;

  /// Compact suffix for values, e.g. `12.4 s`.
  final String short;

  static ResultUnit fromApi(String? raw) =>
      values.firstWhere((e) => e.apiValue == raw, orElse: () => ResultUnit.count);
}

enum ScoringDirection {
  higherBetter('higher_better'),
  lowerBetter('lower_better');

  const ScoringDirection(this.apiValue);
  final String apiValue;

  static ScoringDirection fromApi(String? raw) => values.firstWhere(
    (e) => e.apiValue == raw,
    orElse: () => ScoringDirection.higherBetter,
  );
}
