import 'package:challenge/features/challenges/domain/challenge_enums.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('ChallengeCategory keeps the Figma tab order and API query values', () {
    expect(ChallengeCategory.values.map((c) => c.label).toList(),
        ['Done', 'Active', 'New', 'Declined', 'Ended']);
    expect(ChallengeCategory.fresh.apiValue, 'new');
  });

  group('fromApi falls back instead of throwing on an unknown value', () {
    test('ChallengeStatus -> active', () {
      expect(ChallengeStatus.fromApi('ended'), ChallengeStatus.ended);
      expect(ChallengeStatus.fromApi('who-knows'), ChallengeStatus.active);
      expect(ChallengeStatus.fromApi(null), ChallengeStatus.active);
    });

    test('InviteState -> invited', () {
      expect(InviteState.fromApi('accepted'), InviteState.accepted);
      expect(InviteState.fromApi('garbage'), InviteState.invited);
    });

    test('ResultState -> pending', () {
      expect(ResultState.fromApi('completed'), ResultState.completed);
      expect(ResultState.fromApi(null), ResultState.pending);
    });

    test('ChallengeMainCategory -> other', () {
      expect(ChallengeMainCategory.fromApi('technical'), ChallengeMainCategory.technical);
      expect(ChallengeMainCategory.fromApi('nutrition'), ChallengeMainCategory.other);
    });

    test('ChallengeLocation -> anywhere', () {
      expect(ChallengeLocation.fromApi('gym'), ChallengeLocation.gym);
      expect(ChallengeLocation.fromApi('moon'), ChallengeLocation.anywhere);
    });

    test('ResultType -> count', () {
      expect(ResultType.fromApi('time'), ResultType.time);
      expect(ResultType.fromApi('mystery'), ResultType.count);
    });

    test('ResultUnit -> count', () {
      expect(ResultUnit.fromApi('kg'), ResultUnit.kg);
      expect(ResultUnit.fromApi('furlongs'), ResultUnit.count);
    });

    test('ScoringDirection -> higherBetter', () {
      expect(ScoringDirection.fromApi('lower_better'), ScoringDirection.lowerBetter);
      expect(ScoringDirection.fromApi('sideways'), ScoringDirection.higherBetter);
    });
  });

  test('Zporter labels: technical="Technics", tactical="Tactics"', () {
    expect(ChallengeMainCategory.technical.label, 'Technics');
    expect(ChallengeMainCategory.tactical.label, 'Tactics');
  });

  test('ResultUnit.short is the compact value suffix', () {
    expect(ResultUnit.seconds.short, 's');
    expect(ResultUnit.kg.short, 'kg');
    expect(ResultUnit.count.short, '');
  });
}
