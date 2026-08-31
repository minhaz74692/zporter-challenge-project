import 'package:challenge/core/network/api_exception.dart';
import 'package:challenge/features/challenges/application/challenge_detail_provider.dart';
import 'package:challenge/features/challenges/data/challenges_providers.dart';
import 'package:challenge/features/challenges/domain/challenge_enums.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../support/fake_challenges_repository.dart';
import '../../support/fixtures.dart';

void main() {
  late FakeChallengesRepository repo;

  ProviderContainer containerWith() {
    final c = ProviderContainer(
      overrides: [challengesRepositoryProvider.overrideWithValue(repo)],
    );
    addTearDown(c.dispose);
    return c;
  }

  setUp(() => repo = FakeChallengesRepository());

  test('accept optimistically flips viewerParticipant and calls the repo', () async {
    repo.detail = buildChallengeDetail(id: 'x');
    final container = containerWith();
    await container.read(challengeDetailProvider('x').future);

    await container.read(challengeDetailProvider('x').notifier).accept();

    expect(
      container.read(challengeDetailProvider('x')).value!.viewerParticipant!
          .inviteState,
      InviteState.accepted,
    );
    expect(repo.accepted, ['x']);
  });

  test('a failed accept rolls back to invited and throws ApiException', () async {
    repo.detail = buildChallengeDetail(id: 'x');
    repo.respondError =
        const ApiException(statusCode: 409, message: 'This challenge has ended');
    final container = containerWith();
    await container.read(challengeDetailProvider('x').future);

    await expectLater(
      container.read(challengeDetailProvider('x').notifier).accept(),
      throwsA(isA<ApiException>()),
    );

    expect(
      container.read(challengeDetailProvider('x')).value!.viewerParticipant!
          .inviteState,
      InviteState.invited,
    );
  });

  test('decline flips to declined', () async {
    repo.detail = buildChallengeDetail(id: 'y');
    final container = containerWith();
    await container.read(challengeDetailProvider('y').future);

    await container.read(challengeDetailProvider('y').notifier).decline();

    expect(
      container.read(challengeDetailProvider('y')).value!.viewerParticipant!
          .inviteState,
      InviteState.declined,
    );
    expect(repo.declined, ['y']);
  });
}
