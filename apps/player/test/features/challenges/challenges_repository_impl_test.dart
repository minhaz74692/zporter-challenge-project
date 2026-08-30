import 'package:challenge/core/network/api_exception.dart';
import 'package:challenge/core/network/dio_client.dart';
import 'package:challenge/features/challenges/data/challenges_repository_impl.dart';
import 'package:challenge/features/challenges/domain/challenge_enums.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../support/fake_http_adapter.dart';
import '../../support/fake_token_storage.dart';
import '../../support/fixtures.dart';

void main() {
  ChallengesRepositoryImpl build(
    Future<ResponseBody> Function(RequestOptions) handle,
  ) {
    final dio = DioClient.build(
      baseUrl: 'http://test.local',
      storage: FakeTokenStorage(access: 'tok'),
      onAuthLost: () {},
      adapter: FakeHttpAdapter(handle),
    );
    return ChallengesRepositoryImpl(dio);
  }

  test('list() sends ?category= and parses rows + embedded creator', () async {
    RequestOptions? seen;
    final repo = build((options) async {
      seen = options;
      return jsonResponse([
        challengeJson(id: 'a', title: 'Challenge headline 1'),
        challengeJson(id: 'b', title: 'Challenge headline 2'),
      ], 200);
    });

    final result = await repo.list(ChallengeCategory.done);

    expect(seen?.path, contains('/challenges'));
    expect(seen?.queryParameters['category'], 'done');
    expect(result, hasLength(2));
    expect(result.first.title, 'Challenge headline 1');
    expect(result.first.mainCategory, ChallengeMainCategory.technical);
    expect(result.first.mainCategory.label, 'Technics');
    expect(result.first.location, ChallengeLocation.gym);
    expect(result.first.creator?.displayName, 'Nicklas Jönsson');
    expect(result.first.collections, ['ballcontrol', 'shooting']);
  });

  test('getById() parses viewerParticipant + leaderboardPreview', () async {
    final repo = build((_) async {
      return jsonResponse({
        ...challengeJson(id: 'x'),
        'viewerParticipant': {
          'inviteState': 'accepted',
          'resultState': 'completed',
          'rank': 1,
        },
        'leaderboardPreview': [
          {
            'userId': 'u1',
            'displayName': 'Priya Nair',
            'handle': '#PriNai',
            'club': 'Maj FC',
            'value': 30,
            'rank': 1,
            'updatedAt': '2026-08-30T10:23:11.521Z',
          },
        ],
      }, 200);
    });

    final detail = await repo.getById('x');

    expect(detail.challenge.id, 'x');
    expect(detail.viewerParticipant?.hasAccepted, isTrue);
    expect(detail.viewerParticipant?.resultState, ResultState.completed);
    expect(detail.leaderboardPreview.single.displayName, 'Priya Nair');
  });

  test('accept() POSTs to the accept route', () async {
    RequestOptions? seen;
    final repo = build((options) async {
      seen = options;
      return jsonResponse(const <String, dynamic>{}, 204);
    });

    await repo.accept('c_9');

    expect(seen?.method, 'POST');
    expect(seen?.path, endsWith('/challenges/c_9/accept'));
  });

  test('an ended-challenge 409 surfaces as ApiException with the API message', () async {
    final repo = build((_) async {
      return jsonResponse({
        'statusCode': 409,
        'message': 'This challenge has ended',
      }, 409);
    });

    await expectLater(
      repo.accept('c_9'),
      throwsA(
        isA<ApiException>()
            .having((e) => e.statusCode, 'statusCode', 409)
            .having((e) => e.message, 'message', 'This challenge has ended'),
      ),
    );
  });
}
