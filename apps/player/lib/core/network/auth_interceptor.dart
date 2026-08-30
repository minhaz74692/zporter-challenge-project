import 'package:dio/dio.dart';

import '../storage/token_storage.dart';

/// Attaches the access token to every request and transparently recovers from
/// expiry.
///
/// On a `401` it calls `/auth/refresh` once — **single-flight**: concurrent
/// `401`s all await the same in-progress refresh instead of each firing their
/// own — then retries the original request with the new token. If the refresh
/// fails, it wipes the stored tokens and notifies [onAuthLost] so the app can
/// route back to login.
class AuthInterceptor extends Interceptor {
  AuthInterceptor({
    required TokenStorage storage,
    required Dio authFreeDio,
    required void Function() onAuthLost,
  }) : _storage = storage,
       _authFreeDio = authFreeDio,
       _onAuthLost = onAuthLost;

  final TokenStorage _storage;

  /// A Dio with no interceptors, used for the refresh call and the retry so
  /// neither can re-enter this interceptor.
  final Dio _authFreeDio;

  final void Function() _onAuthLost;

  /// Non-null while a refresh is in progress; the shared future every waiting
  /// request awaits. Resolves to the new access token, or `null` on failure.
  Future<String?>? _inFlightRefresh;

  static const _retriedFlag = 'auth_interceptor_retried';

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    if (!_isAuthEndpoint(options.path)) {
      final token = await _storage.readAccessToken();
      if (token != null) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final request = err.requestOptions;
    final isRecoverable = err.response?.statusCode == 401 &&
        !_isAuthEndpoint(request.path) &&
        request.extra[_retriedFlag] != true;

    if (!isRecoverable) {
      handler.next(err);
      return;
    }

    final newToken = await _refreshAccessToken();
    if (newToken == null) {
      await _storage.clear();
      _onAuthLost();
      handler.next(err);
      return;
    }

    try {
      request.extra[_retriedFlag] = true;
      request.headers['Authorization'] = 'Bearer $newToken';
      final retried = await _authFreeDio.fetch<dynamic>(request);
      handler.resolve(retried);
    } on DioException catch (retryError) {
      handler.next(retryError);
    }
  }

  Future<String?> _refreshAccessToken() {
    return _inFlightRefresh ??= _performRefresh().whenComplete(() {
      _inFlightRefresh = null;
    });
  }

  Future<String?> _performRefresh() async {
    final refreshToken = await _storage.readRefreshToken();
    if (refreshToken == null) return null;

    try {
      final res = await _authFreeDio.post<Map<String, dynamic>>(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
      );
      final tokens = AuthTokens.fromJson(res.data!);
      await _storage.save(tokens);
      return tokens.accessToken;
    } on DioException {
      return null;
    }
  }

  bool _isAuthEndpoint(String path) =>
      path.contains('/auth/login') ||
      path.contains('/auth/signup') ||
      path.contains('/auth/refresh');
}
