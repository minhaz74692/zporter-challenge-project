import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../storage/token_storage.dart';
import 'api_exception.dart';
import 'auth_interceptor.dart';

/// Builds the app's configured [Dio].
///
/// Interceptor order matters: [AuthInterceptor] runs first so it can refresh
/// and retry a `401` before [ErrorInterceptor] gets a chance to turn it into an
/// [ApiException].
abstract final class DioClient {
  static Dio build({
    required String baseUrl,
    required TokenStorage storage,
    required void Function() onAuthLost,
    HttpClientAdapter? adapter, // injected by tests
  }) {
    final dio = Dio(_options(baseUrl));
    final authFreeDio = Dio(_options(baseUrl));

    if (adapter != null) {
      dio.httpClientAdapter = adapter;
      authFreeDio.httpClientAdapter = adapter;
    }

    dio.interceptors.add(
      AuthInterceptor(
        storage: storage,
        authFreeDio: authFreeDio,
        onAuthLost: onAuthLost,
      ),
    );
    dio.interceptors.add(ErrorInterceptor());

    // `adapter != null` means a test injected transport — skip the noisy logger.
    if (kDebugMode && adapter == null) {
      dio.interceptors.add(
        LogInterceptor(requestBody: true, responseBody: true),
      );
    }

    return dio;
  }

  static BaseOptions _options(String baseUrl) => BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 15),
    contentType: Headers.jsonContentType,
  );
}
