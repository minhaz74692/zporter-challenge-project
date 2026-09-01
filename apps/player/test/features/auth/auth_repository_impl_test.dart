import 'package:challenge/core/network/api_exception.dart';
import 'package:challenge/core/network/dio_client.dart';
import 'package:challenge/features/auth/data/auth_repository_impl.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../support/fake_http_adapter.dart';
import '../../support/fake_token_storage.dart';
import '../../support/fixtures.dart';

void main() {
  ({AuthRepositoryImpl repo, FakeTokenStorage storage}) build(
    Future<ResponseBody> Function(RequestOptions) handle,
  ) {
    final storage = FakeTokenStorage();
    final dio = DioClient.build(
      baseUrl: 'http://test.local',
      storage: storage,
      onAuthLost: () {},
      adapter: FakeHttpAdapter(handle),
    );
    return (repo: AuthRepositoryImpl(dio: dio, storage: storage), storage: storage);
  }

  test('login persists the token pair and returns the user', () async {
    final ctx = build((options) async {
      expect(options.path, contains('/auth/login'));
      return jsonResponse(authResponseJson(access: 'tok-1'), 200);
    });

    final user = await ctx.repo.login(
      email: 'player1@zporter.test',
      password: 'password123#',
    );

    expect(user.handle, '#PriPla010203');
    expect(ctx.storage.access, 'tok-1');
    expect(ctx.storage.refresh, 'refresh-1');
  });

  test('signup sends role=player and the chosen teamId', () async {
    Map<String, dynamic>? sentBody;
    final ctx = build((options) async {
      sentBody = options.data as Map<String, dynamic>;
      return jsonResponse(authResponseJson(), 200);
    });

    await ctx.repo.signup(
      email: 'new@zporter.test',
      password: 'password123#',
      displayName: 'New Player',
      teamId: 'team-maj-fc',
    );

    expect(sentBody?['role'], 'player');
    expect(sentBody?['teamId'], 'team-maj-fc');
  });

  test('fetchTeams maps the public directory response', () async {
    final ctx = build((options) async {
      expect(options.path, contains('/teams/directory'));
      return jsonResponse([
        {'id': 't1', 'name': 'Maj FC', 'coachName': 'Carl Carter'},
        {'id': 't2', 'name': 'Ope IF', 'coachName': 'Erik Ericsson'},
      ], 200);
    });

    final teams = await ctx.repo.fetchTeams();

    expect(teams, hasLength(2));
    expect(teams.first.id, 't1');
    expect(teams.first.name, 'Maj FC');
    expect(teams.first.coachName, 'Carl Carter');
  });

  test('a 400 becomes an ApiException carrying the API message', () async {
    final ctx = build((options) async {
      return jsonResponse({
        'statusCode': 400,
        'message': ['email must be an email'],
      }, 400);
    });

    await expectLater(
      ctx.repo.login(email: 'bad', password: 'x'),
      throwsA(
        isA<ApiException>()
            .having((e) => e.statusCode, 'statusCode', 400)
            .having((e) => e.message, 'message', 'email must be an email'),
      ),
    );
  });

  test('logout clears local storage even if the server call fails', () async {
    final storage = FakeTokenStorage(access: 'a', refresh: 'r');
    final dio = DioClient.build(
      baseUrl: 'http://test.local',
      storage: storage,
      onAuthLost: () {},
      adapter: FakeHttpAdapter((_) async => jsonResponse({'statusCode': 500}, 500)),
    );

    await AuthRepositoryImpl(dio: dio, storage: storage).logout();

    expect(storage.access, isNull);
    expect(storage.refresh, isNull);
  });
}
