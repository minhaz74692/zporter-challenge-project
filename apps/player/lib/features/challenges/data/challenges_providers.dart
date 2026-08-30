import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/network_providers.dart';
import '../domain/challenges_repository.dart';
import 'challenges_repository_impl.dart';

/// Binds [ChallengesRepository] to its REST implementation. Override in tests.
final challengesRepositoryProvider = Provider<ChallengesRepository>(
  (ref) => ChallengesRepositoryImpl(ref.watch(dioProvider)),
);
