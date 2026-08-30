import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/network/network_providers.dart';
import '../data/auth_providers.dart';
import '../domain/user.dart';

final authNotifierProvider =
    AsyncNotifierProvider<AuthNotifier, User?>(AuthNotifier.new);

/// The app-wide auth state: `AsyncData(null)` = signed out, `AsyncData(user)` =
/// signed in, `AsyncLoading` = restoring the session on boot, `AsyncError` =
/// the last sign-in attempt failed (the router treats this as signed out).
///
/// The router watches this to gate routes; screens watch it for the current
/// user and to show sign-in progress / errors.
class AuthNotifier extends AsyncNotifier<User?> {
  @override
  Future<User?> build() async {
    // A failed refresh deep in the network layer means the session is gone.
    final sub = ref
        .read(sessionEventsProvider)
        .onExpired
        .listen((_) => state = const AsyncData(null));
    ref.onDispose(sub.cancel);

    return _restoreSession();
  }

  Future<User?> _restoreSession() async {
    final storage = ref.read(tokenStorageProvider);
    if (await storage.readAccessToken() == null) return null;
    try {
      return await ref.read(authRepositoryProvider).me();
    } on ApiException {
      await storage.clear();
      return null;
    }
  }

  Future<void> login({required String email, required String password}) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard<User?>(
      () => ref.read(authRepositoryProvider).login(email: email, password: password),
    );
  }

  Future<void> register({
    required String email,
    required String password,
    required String displayName,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard<User?>(
      () => ref.read(authRepositoryProvider).signup(
        email: email,
        password: password,
        displayName: displayName,
      ),
    );
  }

  Future<void> logout() async {
    await ref.read(authRepositoryProvider).logout();
    state = const AsyncData(null);
  }
}
