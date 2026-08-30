import 'dart:convert';
import 'dart:typed_data';

import 'package:challenge/core/network/api_exception.dart';
import 'package:challenge/core/network/dio_client.dart';
import 'package:challenge/core/storage/token_storage.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

/// In-memory [TokenStorage].
class _FakeTokenStorage implements TokenStorage {
  _FakeTokenStorage({this.access, this.refresh});

  String? access;
  String? refresh;
  int clearCount = 0;

  @override
  Future<String?> readAccessToken() async => access;

  @override
  Future<String?> readRefreshToken() async => refresh;

  @override
  Future<void> save(AuthTokens tokens) async {
    access = tokens.accessToken;
    refresh = tokens.refreshToken;
  }

  @override
  Future<void> clear() async {
    clearCount++;
    access = null;
    refresh = null;
  }
}

/// Drives Dio from a plain request→response function, no sockets.
class _FakeAdapter implements HttpClientAdapter {
  _FakeAdapter(this.handle);

  final Future<ResponseBody> Function(RequestOptions options) handle;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) => handle(options);

  @override
  void close({bool force = false}) {}
}

ResponseBody _json(Map<String, dynamic> body, int status) => ResponseBody.fromString(
  jsonEncode(body),
  status,
  headers: {
    Headers.contentTypeHeader: [Headers.jsonContentType],
  },
);

void main() {
  group('AuthInterceptor', () {
    test(
      'concurrent 401s trigger exactly one refresh, then all retries succeed',
      () async {
        var refreshCalls = 0;
        final storage = _FakeTokenStorage(access: 'stale', refresh: 'valid-refresh');

        final adapter = _FakeAdapter((options) async {
          if (options.path.contains('/auth/refresh')) {
            refreshCalls++;
            await Future<void>.delayed(const Duration(milliseconds: 40));
            return _json({
              'accessToken': 'fresh',
              'refreshToken': 'valid-refresh-2',
              'user': <String, dynamic>{},
            }, 200);
          }
          // Protected endpoint: 401 unless the caller presents the fresh token.
          final auth = options.headers['Authorization'];
          if (auth == 'Bearer fresh') return _json({'ok': true}, 200);
          return _json({'statusCode': 401, 'message': 'Unauthorized'}, 401);
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
      final storage = _FakeTokenStorage(access: 'stale', refresh: 'expired-refresh');

      final adapter = _FakeAdapter((options) async {
        if (options.path.contains('/auth/refresh')) {
          return _json({'statusCode': 401, 'message': 'Refresh token expired'}, 401);
        }
        return _json({'statusCode': 401, 'message': 'Unauthorized'}, 401);
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
      final storage = _FakeTokenStorage(access: 'stale', refresh: 'r');

      final adapter = _FakeAdapter((options) async {
        seenAuthHeader = options.headers['Authorization'] as String?;
        return _json({
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
