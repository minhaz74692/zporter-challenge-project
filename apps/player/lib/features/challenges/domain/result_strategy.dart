import 'challenge_enums.dart';

/// How a result of a given [ResultType] is entered, validated and submitted.
///
/// Mirrors the backend's `ResultStrategy` registry: adding `score` / `text` /
/// `proof` later is one new class + one `switch` arm, nothing else (Open/Closed).
sealed class ResultStrategy {
  const ResultStrategy();

  /// A yes/no result renders as a toggle; everything else as a number field.
  bool get isBoolean => false;

  /// Keyboard for the number field (null for boolean).
  bool get allowsDecimal => false;

  /// Placeholder shown in the empty number field.
  String get hint;

  /// Turn the field's state into the value to submit.
  /// [rawText] is the number field's text; [toggle] the boolean switch.
  Object? parse(String rawText, bool toggle);

  /// `null` when [value] is acceptable, else the message to show.
  String? validate(Object? value);

  /// Nudge the number field by [delta] steps; returns the new text.
  String step(String rawText, int delta) {
    final current = double.tryParse(rawText) ?? 0;
    final next = current + delta;
    return allowsDecimal ? next.toString() : next.toInt().toString();
  }
}

class CountResultStrategy extends ResultStrategy {
  const CountResultStrategy();

  @override
  String get hint => '0';

  @override
  Object? parse(String rawText, bool toggle) => int.tryParse(rawText.trim());

  @override
  String? validate(Object? value) {
    if (value is! int) return 'Enter a whole number';
    if (value < 0) return 'Must be zero or more';
    return null;
  }
}

class TimeResultStrategy extends ResultStrategy {
  const TimeResultStrategy();

  @override
  bool get allowsDecimal => true;

  @override
  String get hint => 'seconds, e.g. 12.4';

  @override
  Object? parse(String rawText, bool toggle) => double.tryParse(rawText.trim());

  @override
  String? validate(Object? value) {
    if (value is! double && value is! int) return 'Enter a time in seconds';
    if ((value as num) <= 0) return 'Must be greater than zero';
    return null;
  }
}

class BooleanResultStrategy extends ResultStrategy {
  const BooleanResultStrategy();

  @override
  bool get isBoolean => true;

  @override
  String get hint => '';

  @override
  Object? parse(String rawText, bool toggle) => toggle;

  @override
  String? validate(Object? value) =>
      value is bool ? null : 'Toggle whether you completed it';
}

ResultStrategy resultStrategyFor(ResultType type) => switch (type) {
  ResultType.time => const TimeResultStrategy(),
  ResultType.boolean => const BooleanResultStrategy(),
  _ => const CountResultStrategy(),
};
