import 'package:dio/dio.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/storage/token_storage.dart';
import '../domain/auth_repository.dart';
import '../domain/user.dart';

/// REST implementation of [AuthRepository].
///
/// The player app self-registers as `player` only, so [signup] hard-codes the
/// role rather than exposing it.
class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl({required Dio dio, required TokenStorage storage})
    : _dio = dio,
      _storage = storage;

  final Dio _dio;
  final TokenStorage _storage;

  @override
  Future<User> login({required String email, required String password}) {
    return guardApiCall(() async {
      final res = await _dio.post<Map<String, dynamic>>(
        '/auth/login',
        data: {'email': email, 'password': password},
      );
      return _storeSessionAndReturnUser(res.data!);
    });
  }

  @override
  Future<User> signup({
    required String email,
    required String password,
    required String displayName,
  }) {
    return guardApiCall(() async {
      final res = await _dio.post<Map<String, dynamic>>(
        '/auth/signup',
        data: {
          'email': email,
          'password': password,
          'displayName': displayName,
          'role': 'player',
        },
      );
      return _storeSessionAndReturnUser(res.data!);
    });
  }

  @override
  Future<User> me() {
    return guardApiCall(() async {
      final res = await _dio.get<Map<String, dynamic>>('/auth/me');
      return User.fromJson(res.data!);
    });
  }

  @override
  Future<void> logout() async {
    final refreshToken = await _storage.readRefreshToken();
    try {
      if (refreshToken != null) {
        await _dio.post<void>('/auth/logout', data: {'refreshToken': refreshToken});
      }
    } on DioException {
      // Best-effort server revoke; the local session is cleared regardless.
    } finally {
      await _storage.clear();
    }
  }

  /// `/auth/{login,signup}` return `{ user, accessToken, refreshToken }`.
  Future<User> _storeSessionAndReturnUser(Map<String, dynamic> body) async {
    await _storage.save(AuthTokens.fromJson(body));
    return User.fromJson(body['user'] as Map<String, dynamic>);
  }
}
