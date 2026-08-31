import 'package:challenge/features/challenges/domain/challenge_enums.dart';
import 'package:challenge/features/challenges/domain/result_strategy.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('resultStrategyFor picks the right strategy (count is the fallback)', () {
    expect(resultStrategyFor(ResultType.count), isA<CountResultStrategy>());
    expect(resultStrategyFor(ResultType.time), isA<TimeResultStrategy>());
    expect(resultStrategyFor(ResultType.boolean), isA<BooleanResultStrategy>());
    expect(resultStrategyFor(ResultType.score), isA<CountResultStrategy>());
  });

  group('CountResultStrategy', () {
    const s = CountResultStrategy();
    test('parses a whole number and rejects non-integers / negatives', () {
      expect(s.parse('25', false), 25);
      expect(s.validate(s.parse('25', false)), isNull);
      expect(s.validate(s.parse('', false)), isNotNull);
      expect(s.validate(-1), isNotNull);
    });
    test('step nudges by whole numbers', () {
      expect(s.step('10', 1), '11');
      expect(s.step('', -1), '-1');
    });
  });

  group('TimeResultStrategy', () {
    const s = TimeResultStrategy();
    test('parses decimals and rejects zero / non-numbers', () {
      expect(s.parse('12.4', false), 12.4);
      expect(s.validate(12.4), isNull);
      expect(s.validate(0.0), isNotNull);
      expect(s.validate(s.parse('abc', false)), isNotNull);
    });
  });

  group('BooleanResultStrategy', () {
    const s = BooleanResultStrategy();
    test('parses the toggle and always validates a bool', () {
      expect(s.parse('', true), true);
      expect(s.validate(true), isNull);
      expect(s.validate(null), isNotNull);
    });
  });
}
