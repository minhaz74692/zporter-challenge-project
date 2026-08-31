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

/// Backed by the platform keystore / keychain, with an in-memory cache so a
/// token written at login is readable by the very next request without waiting
/// for the platform write to become visible (which otherwise races the first
/// authenticated call and 401s it).
class SecureTokenStorage implements TokenStorage {
  SecureTokenStorage(this._store);

  final FlutterSecureStorage _store;

  static const _accessKey = 'zp_access_token';
  static const _refreshKey = 'zp_refresh_token';

  String? _access;
  String? _refresh;
  bool _hydrated = false;

  /// Pull whatever the platform has into the cache once, on first read.
  Future<void> _hydrate() async {
    if (_hydrated) return;
    _access = await _store.read(key: _accessKey);
    _refresh = await _store.read(key: _refreshKey);
    _hydrated = true;
  }

  @override
  Future<String?> readAccessToken() async {
    await _hydrate();
    return _access;
  }

  @override
  Future<String?> readRefreshToken() async {
    await _hydrate();
    return _refresh;
  }

  @override
  Future<void> save(AuthTokens tokens) async {
    _access = tokens.accessToken;
    _refresh = tokens.refreshToken;
    _hydrated = true;
    await _store.write(key: _accessKey, value: tokens.accessToken);
    await _store.write(key: _refreshKey, value: tokens.refreshToken);
  }

  @override
  Future<void> clear() async {
    _access = null;
    _refresh = null;
    _hydrated = true;
    await _store.delete(key: _accessKey);
    await _store.delete(key: _refreshKey);
  }
}
