import 'package:challenge/core/storage/token_storage.dart';

/// In-memory [TokenStorage] for tests — no platform channels.
class FakeTokenStorage implements TokenStorage {
  FakeTokenStorage({this.access, this.refresh});

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
