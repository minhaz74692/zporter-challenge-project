import 'package:challenge/core/network/api_exception.dart';
import 'package:challenge/core/network/network_providers.dart';
import 'package:challenge/features/auth/application/auth_notifier.dart';
import 'package:challenge/features/auth/data/auth_providers.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../support/fake_auth_repository.dart';
import '../../support/fake_token_storage.dart';
import '../../support/fixtures.dart';

void main() {
  late FakeAuthRepository repo;
  late FakeTokenStorage storage;

  ProviderContainer makeContainer() {
    final container = ProviderContainer(
      overrides: [
        authRepositoryProvider.overrideWithValue(repo),
        tokenStorageProvider.overrideWithValue(storage),
      ],
    );
    addTearDown(container.dispose);
    return container;
  }

  setUp(() {
    repo = FakeAuthRepository();
    storage = FakeTokenStorage();
  });

  test('boot with no token resolves to signed-out', () async {
    final container = makeContainer();

    final user = await container.read(authNotifierProvider.future);

    expect(user, isNull);
  });

  test('boot with a stored token restores the session via me()', () async {
    storage.access = 'stored';
    repo.meResult = buildUser(displayName: 'Restored');

    final container = makeContainer();

    final user = await container.read(authNotifierProvider.future);

    expect(user?.displayName, 'Restored');
  });

  test('a rejected stored token clears storage and signs out', () async {
    storage.access = 'stale';
    repo.meError = const ApiException(statusCode: 401, message: 'expired');

    final container = makeContainer();

    expect(await container.read(authNotifierProvider.future), isNull);
    expect(storage.clearCount, 1);
  });

  test('login success moves state to the user', () async {
    repo.loginResult = buildUser(displayName: 'Logged In');
    final container = makeContainer();
    await container.read(authNotifierProvider.future);

    await container
        .read(authNotifierProvider.notifier)
        .login(email: 'player1@zporter.test', password: 'password123#');

    expect(container.read(authNotifierProvider).value?.displayName, 'Logged In');
  });

  test('login failure surfaces as AsyncError(ApiException), stays signed out', () async {
    repo.loginError = const ApiException(statusCode: 401, message: 'Bad credentials');
    final container = makeContainer();
    await container.read(authNotifierProvider.future);

    await container
        .read(authNotifierProvider.notifier)
        .login(email: 'x@y.z', password: 'nope');

    final state = container.read(authNotifierProvider);
    expect(state.hasError, isTrue);
    expect(state.error, isA<ApiException>());
  });

  test('logout delegates to the repository and clears state', () async {
    repo.loginResult = buildUser();
    final container = makeContainer();
    await container.read(authNotifierProvider.future);
    await container
        .read(authNotifierProvider.notifier)
        .login(email: 'a@b.c', password: 'x');

    await container.read(authNotifierProvider.notifier).logout();

    expect(repo.logoutCount, 1);
    expect(container.read(authNotifierProvider).value, isNull);
  });
}
