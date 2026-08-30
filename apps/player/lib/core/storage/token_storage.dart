import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// The access + refresh token pair returned by `/auth/{login,signup,refresh}`.
class AuthTokens {
  const AuthTokens({required this.accessToken, required this.refreshToken});

  factory AuthTokens.fromJson(Map<String, dynamic> json) => AuthTokens(
    accessToken: json['accessToken'] as String,
    refreshToken: json['refreshToken'] as String,
  );

  final String accessToken;
  final String refreshToken;
}

/// Persists the auth tokens. An interface so the network layer depends on the
/// contract, not on `flutter_secure_storage` — tests inject an in-memory fake.
abstract interface class TokenStorage {
  Future<String?> readAccessToken();
  Future<String?> readRefreshToken();
  Future<void> save(AuthTokens tokens);
  Future<void> clear();
}

/// Production implementation backed by the platform keystore / keychain.
class SecureTokenStorage implements TokenStorage {
  const SecureTokenStorage(this._store);

  final FlutterSecureStorage _store;

  static const _accessKey = 'zp_access_token';
  static const _refreshKey = 'zp_refresh_token';

  @override
  Future<String?> readAccessToken() => _store.read(key: _accessKey);

  @override
  Future<String?> readRefreshToken() => _store.read(key: _refreshKey);

  @override
  Future<void> save(AuthTokens tokens) async {
    await _store.write(key: _accessKey, value: tokens.accessToken);
    await _store.write(key: _refreshKey, value: tokens.refreshToken);
  }

  @override
  Future<void> clear() async {
    await _store.delete(key: _accessKey);
    await _store.delete(key: _refreshKey);
  }
}
