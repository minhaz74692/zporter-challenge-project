import 'package:challenge/core/util/formatters.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('date formatters', () {
    final dt = DateTime(2023, 2, 1, 8, 5); // local, single-digit month/day/hour

    test('formatDateAtTime pads every component', () {
      expect(formatDateAtTime(dt), '2023-02-01 at 08:05');
    });

    test('formatDayMonth uses a padded day and a short month name', () {
      expect(formatDayMonth(DateTime(2023, 12, 21)), '21-Dec');
      expect(formatDayMonth(dt), '01-Feb');
    });

    test('formatTime is a zero-padded 24h clock', () {
      expect(formatTime(DateTime(2023, 1, 1, 19, 7)), '19:07');
      expect(formatTime(dt), '08:05');
    });

    test('formatDate is spaced dd / mm / yyyy', () {
      expect(formatDate(DateTime(2023, 12, 3)), '03 / 12 / 2023');
    });

    test('formatDmy is slash-joined dd/mm/yyyy', () {
      expect(formatDmy(DateTime(2023, 12, 5)), '05/12/2023');
    });
  });

  group('formatScore', () {
    test('space-groups thousands for integers', () {
      expect(formatScore(1903), '1 903');
      expect(formatScore(1000000), '1 000 000');
    });

    test('leaves values under 1000 ungrouped', () {
      expect(formatScore(0), '0');
      expect(formatScore(999), '999');
    });

    test('treats a whole double as an integer', () {
      expect(formatScore(1903.0), '1 903');
    });

    test('keeps the fractional part and only groups the integer side', () {
      expect(formatScore(12.4), '12.4');
      expect(formatScore(1234.5), '1 234.5');
    });

    test('preserves a leading minus sign', () {
      expect(formatScore(-1234), '-1 234');
    });
  });

  group('formatAgeRange', () {
    test('both bounds -> "from-toY"', () => expect(formatAgeRange(8, 12), '8-12Y'));
    test('only a lower bound -> "from+"', () => expect(formatAgeRange(8, null), '8+'));
    test('only an upper bound -> "<=to"', () => expect(formatAgeRange(null, 12), '≤12'));
    test('no bounds -> "All"', () => expect(formatAgeRange(null, null), 'All'));
  });
}
