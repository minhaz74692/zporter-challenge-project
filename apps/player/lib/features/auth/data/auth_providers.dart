import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/network_providers.dart';
import '../domain/auth_repository.dart';
import '../domain/team_option.dart';
import 'auth_repository_impl.dart';

/// Binds the [AuthRepository] contract to its REST implementation. Override
/// this provider in tests to inject a fake.
final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepositoryImpl(
    dio: ref.watch(dioProvider),
    storage: ref.watch(tokenStorageProvider),
  ),
);

/// Squads available on the signup screen. `autoDispose` so a fresh list is
/// fetched each time the screen is opened.
final teamsProvider = FutureProvider.autoDispose<List<TeamOption>>(
  (ref) => ref.watch(authRepositoryProvider).fetchTeams(),
);
