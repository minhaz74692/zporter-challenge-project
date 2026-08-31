import 'package:challenge/features/challenges/domain/challenge.dart';
import 'package:challenge/features/challenges/domain/challenge_enums.dart';
import 'package:challenge/features/challenges/domain/challenge_filter.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../support/fixtures.dart';

void main() {
  final gym = buildChallenge(id: 'gym'); // location 'gym', age 8-12, position Forwards
  final field = Challenge.fromJson({
    ...challengeJson(id: 'field'),
    'location': 'field',
    'ageFrom': 16,
    'ageTo': 19,
    'position': 'Goalkeepers',
    'likeCount': 99,
    'ratingAverage': 5.0,
  });

  test('location filter keeps only the matching venue', () {
    const filter = ChallengeFilter(location: ChallengeLocation.gym);
    final out = filter.apply([gym, field]);
    expect(out.map((c) => c.id), ['gym']);
  });

  test('age group filter keeps challenges whose range overlaps the bucket', () {
    const filter = ChallengeFilter(ageGroup: AgeGroup.age16to19);
    final out = filter.apply([gym, field]);
    expect(out.map((c) => c.id), ['field']);
  });

  test('role filter matches the challenge position (or passes when "All")', () {
    const filter = ChallengeFilter(role: ChallengeRole.goalkeepers);
    expect(filter.apply([gym, field]).map((c) => c.id), ['field']);
  });

  test('"Most popular" sorts by like count desc', () {
    const filter = ChallengeFilter();
    final out = filter.apply([gym, field]);
    expect(out.first.id, 'field'); // likeCount 99 > 4
  });

  test('"Top rated" sorts by rating desc', () {
    const filter = ChallengeFilter(sort: ChallengeSort.topRated);
    final out = filter.apply([gym, field]);
    expect(out.first.id, 'field'); // 5.0 > 3.5
  });

  test('Country / Users are inert for now (no data on a challenge)', () {
    const filter = ChallengeFilter(country: 'Norway', users: 'Admins');
    expect(filter.apply([gym, field]), hasLength(2));
    expect(filter.isNarrowing, isTrue); // still counts as "filter active" for the badge
  });

  test('summaryParts is the sort short form plus any set filters', () {
    const filter = ChallengeFilter(
      sort: ChallengeSort.newest,
      country: 'Sweden',
      location: ChallengeLocation.field,
    );
    expect(filter.summaryParts, ['Latest', 'SE', 'Field']);
    expect(const ChallengeFilter().summaryParts, ['Popular']);
  });
}
