import 'dart:async';

import 'package:challenge/features/challenges/domain/challenge.dart';
import 'package:challenge/features/challenges/domain/challenge_detail.dart';
import 'package:challenge/features/challenges/domain/challenge_enums.dart';
import 'package:challenge/features/challenges/domain/challenges_repository.dart';
import 'package:challenge/features/challenges/domain/leaderboard_entry.dart';
import 'package:challenge/features/challenges/domain/participant.dart';

/// Scriptable [ChallengesRepository] for `application/` + widget tests.
class FakeChallengesRepository implements ChallengesRepository {
  /// Rows returned per tab. Missing keys yield an empty list.
  final Map<ChallengeCategory, List<Challenge>> lists = {};
  Object? listError;

  /// When set, `list()` waits on this before returning — lets a test observe
  /// the loading state.
  Completer<void>? listGate;

  ChallengeDetail? detail;
  final List<String> accepted = [];
  final List<String> declined = [];

  @override
  Future<List<Challenge>> list(ChallengeCategory category) async {
    if (listGate != null) await listGate!.future;
    if (listError != null) throw listError!;
    return lists[category] ?? const [];
  }

  @override
  Future<ChallengeDetail> getById(String id) async => detail!;

  @override
  Future<void> accept(String id) async => accepted.add(id);

  @override
  Future<void> decline(String id) async => declined.add(id);

  @override
  Future<List<Participant>> participants(String id) async => const [];

  @override
  Future<List<LeaderboardEntry>> leaderboard(String id) async => const [];
}
