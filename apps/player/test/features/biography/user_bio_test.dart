import 'package:challenge/features/auth/domain/user.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  Map<String, dynamic> json([Map<String, dynamic> extra = const {}]) => {
    'id': 'u1',
    'email': 'p@zporter.test',
    'displayName': 'Neo Jönsson',
    'role': 'player',
    'handle': '#NeoJon070119',
    'country': 'SE',
    'createdAt': '2021-01-14T00:00:00.000Z',
    ...extra,
  };

  test('parses the biography profile fields', () {
    final u = User.fromJson(json({
      'birthDate': '2007-01-19',
      'heightCm': 152,
      'weightKg': 46,
      'foot': 'left',
      'marketValue': '? M€',
      'bio': 'Two footed, quick…',
      'ratingPercent': 75,
      'friendsCount': 20,
      'fansCount': 0,
      'followsCount': 0,
      'socials': {'instagram': 'https://ig/x', 'veo': 'https://veo'},
    }));

    expect(u.heightCm, 152);
    expect(u.weightKg, 46);
    expect(u.foot, PreferredFoot.left);
    expect(u.foot!.label, 'LEFT');
    expect(u.marketValue, '? M€');
    expect(u.ratingPercent, 75);
    expect(u.ratingStars, 3.75);
    expect(u.friendsCount, 20);
    expect(u.socials['instagram'], 'https://ig/x');
  });

  test('age is whole years from birthDate', () {
    final tenYearsAgo = DateTime.now().subtract(const Duration(days: 365 * 10 + 5));
    final u = User.fromJson(json({'birthDate': tenYearsAgo.toIso8601String()}));
    expect(u.age, anyOf(9, 10));
  });

  test('missing bio fields decode to null / empty without throwing', () {
    final u = User.fromJson(json());
    expect(u.age, isNull);
    expect(u.foot, isNull);
    expect(u.ratingPercent, isNull);
    expect(u.ratingStars, 0);
    expect(u.socials, isEmpty);
  });
}
