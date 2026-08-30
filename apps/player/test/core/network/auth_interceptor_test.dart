import 'package:challenge/core/network/api_exception.dart';
import 'package:challenge/core/network/dio_client.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../support/fake_http_adapter.dart';
import '../../support/fake_token_storage.dart';

void main() {
  group('AuthInterceptor', () {
    test(
      'concurrent 401s trigger exactly one refresh, then all retries succeed',
      () async {
        var refreshCalls = 0;
        final storage = FakeTokenStorage(access: 'stale', refresh: 'valid-refresh');

        final adapter = FakeHttpAdapter((options) async {
          if (options.path.contains('/auth/refresh')) {
            refreshCalls++;
            await Future<void>.delayed(const Duration(milliseconds: 40));
            return jsonResponse({
              'accessToken': 'fresh',
              'refreshToken': 'valid-refresh-2',
              'user': <String, dynamic>{},
            }, 200);
          }
          // Protected endpoint: 401 unless the caller presents the fresh token.
          final auth = options.headers['Authorization'];
          if (auth == 'Bearer fresh') return jsonResponse({'ok': true}, 200);
          return jsonResponse({'statusCode': 401, 'message': 'Unauthorized'}, 401);
        });

        final dio = DioClient.build(
          baseUrl: 'http://test.local',
          storage: storage,
          onAuthLost: () {},
          adapter: adapter,
        );

        final responses = await Future.wait([
          dio.get<dynamic>('/challenges'),
          dio.get<dynamic>('/challenges'),
          dio.get<dynamic>('/challenges'),
        ]);

        expect(refreshCalls, 1);
        expect(responses.map((r) => r.statusCode), everyElement(200));
        expect(storage.access, 'fresh');
      },
    );

    test('failed refresh clears storage, notifies, surfaces ApiException', () async {
      var authLost = false;
      final storage = FakeTokenStorage(access: 'stale', refresh: 'expired-refresh');

      final adapter = FakeHttpAdapter((options) async {
        if (options.path.contains('/auth/refresh')) {
          return jsonResponse({'statusCode': 401, 'message': 'Refresh token expired'}, 401);
        }
        return jsonResponse({'statusCode': 401, 'message': 'Unauthorized'}, 401);
      });

      final dio = DioClient.build(
        baseUrl: 'http://test.local',
        storage: storage,
        onAuthLost: () => authLost = true,
        adapter: adapter,
      );

      await expectLater(
        dio.get<dynamic>('/challenges'),
        throwsA(
          isA<DioException>().having(
            (e) => e.error,
            'error',
            isA<ApiException>().having((x) => x.statusCode, 'statusCode', 401),
          ),
        ),
      );

      expect(authLost, isTrue);
      expect(storage.clearCount, 1);
    });

    test('no Authorization header is sent on auth endpoints', () async {
      String? seenAuthHeader = 'unset';
      final storage = FakeTokenStorage(access: 'stale', refresh: 'r');

      final adapter = FakeHttpAdapter((options) async {
        seenAuthHeader = options.headers['Authorization'] as String?;
        return jsonResponse({
          'accessToken': 'a',
          'refreshToken': 'b',
          'user': <String, dynamic>{},
        }, 200);
      });

      final dio = DioClient.build(
        baseUrl: 'http://test.local',
        storage: storage,
        onAuthLost: () {},
        adapter: adapter,
      );

      await dio.post<dynamic>('/auth/login', data: {'email': 'x', 'password': 'y'});

      expect(seenAuthHeader, isNull);
    });
  });
}
