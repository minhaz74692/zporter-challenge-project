import 'package:challenge/features/challenges/domain/leaderboard_entry.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('LeaderboardEntry.fromJson parses a full ranked row', () {
    final e = LeaderboardEntry.fromJson({
      'userId': 'u1',
      'displayName': 'Mohamed Salah',
      'handle': '#MohSal',
      'avatarUrl': 'https://a/x.png',
      'club': 'Maj FC',
      'value': 1903,
      'rank': 1,
      'updatedAt': '2023-12-05T00:00:00.000Z',
    });
    expect(e.userId, 'u1');
    expect(e.value, 1903);
    expect(e.rank, 1);
    expect(e.updatedAt, DateTime.utc(2023, 12, 5));
  });

  test('defaults handle/value/rank and allows a null avatar & club', () {
    final e = LeaderboardEntry.fromJson({
      'userId': 'u2',
      'displayName': 'Anon',
      'updatedAt': '2023-12-05T00:00:00.000Z',
    });
    expect(e.handle, '');
    expect(e.value, 0);
    expect(e.rank, 0);
    expect(e.avatarUrl, isNull);
    expect(e.club, isNull);
  });

  test('coerces a double rank to int', () {
    final e = LeaderboardEntry.fromJson({
      'userId': 'u3',
      'displayName': 'X',
      'rank': 4.0,
      'updatedAt': '2023-12-05T00:00:00.000Z',
    });
    expect(e.rank, 4);
  });

  test('equality is value-based', () {
    Map<String, dynamic> json() => {
          'userId': 'u1',
          'displayName': 'Salah',
          'handle': '#s',
          'value': 10,
          'rank': 1,
          'updatedAt': '2023-12-05T00:00:00.000Z',
        };
    expect(LeaderboardEntry.fromJson(json()), LeaderboardEntry.fromJson(json()));
  });
}
