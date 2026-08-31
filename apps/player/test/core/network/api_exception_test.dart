import 'package:challenge/core/network/api_exception.dart';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';

DioException _dio({int? status, Object? data}) {
  final options = RequestOptions(path: '/challenges');
  return DioException(
    requestOptions: options,
    response: status == null
        ? null
        : Response(requestOptions: options, statusCode: status, data: data),
  );
}

void main() {
  group('ApiException.fromDio', () {
    test('maps a response-less failure to a network error (status 0)', () {
      final e = ApiException.fromDio(_dio());
      expect(e.statusCode, 0);
      expect(e.isNetworkError, isTrue);
      expect(e.message, contains('Cannot reach the server'));
    });

    test('uses the first entry of a class-validator message list and keeps them all', () {
      final e = ApiException.fromDio(
        _dio(status: 400, data: {
          'message': ['email must be an email', 'password too short'],
        }),
      );
      expect(e.statusCode, 400);
      expect(e.message, 'email must be an email');
      expect(e.fieldErrors, ['email must be an email', 'password too short']);
    });

    test('uses a plain string message as-is', () {
      final e = ApiException.fromDio(_dio(status: 403, data: {'message': 'Forbidden resource'}));
      expect(e.message, 'Forbidden resource');
      expect(e.fieldErrors, isEmpty);
    });

    test('falls back to a generic line when the body carries no message', () {
      expect(ApiException.fromDio(_dio(status: 500, data: {})).message, 'Request failed (500).');
      expect(ApiException.fromDio(_dio(status: 502, data: 'not json')).message,
          'Request failed (502).');
    });

    test('isUnauthorized flags a 401', () {
      expect(ApiException.fromDio(_dio(status: 401, data: {})).isUnauthorized, isTrue);
      expect(ApiException.fromDio(_dio(status: 400, data: {})).isUnauthorized, isFalse);
    });

    test('toString includes status and message', () {
      final e = ApiException.fromDio(_dio(status: 404, data: {'message': 'nope'}));
      expect(e.toString(), 'ApiException(404): nope');
    });
  });

  group('guardApiCall', () {
    test('returns the request result untouched on success', () async {
      expect(await guardApiCall(() async => 42), 42);
    });

    test('rethrows an ApiException that a Dio interceptor already attached', () async {
      const attached = ApiException(statusCode: 409, message: 'conflict');
      final call = guardApiCall(() async {
        throw DioException(requestOptions: RequestOptions(path: '/x'), error: attached);
      });
      await expectLater(call, throwsA(same(attached)));
    });

    test('wraps a raw DioException into an ApiException', () async {
      final call = guardApiCall(() async {
        throw _dio(status: 400, data: {'message': 'bad body'});
      });
      await expectLater(
        call,
        throwsA(isA<ApiException>()
            .having((e) => e.statusCode, 'statusCode', 400)
            .having((e) => e.message, 'message', 'bad body')),
      );
    });
  });
}
