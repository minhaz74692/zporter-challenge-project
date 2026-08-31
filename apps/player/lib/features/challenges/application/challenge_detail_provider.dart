import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../data/challenges_providers.dart';
import '../domain/challenge_detail.dart';
import '../domain/challenge_enums.dart';
import '../domain/challenges_repository.dart';
import '../domain/participant.dart';
import 'challenge_list_provider.dart';

/// One challenge's full detail (challenge + the viewer's participation +
/// leaderboard preview). Also owns the accept / decline actions, applied
/// optimistically so the button reacts instantly.
final challengeDetailProvider = AsyncNotifierProvider.family<
    ChallengeDetailNotifier, ChallengeDetail, String>(
  ChallengeDetailNotifier.new,
);

class ChallengeDetailNotifier
    extends FamilyAsyncNotifier<ChallengeDetail, String> {
  @override
  Future<ChallengeDetail> build(String arg) {
    return ref.watch(challengesRepositoryProvider).getById(arg);
  }

  Future<void> accept() => _respond(
        InviteState.accepted,
        (repo) => repo.accept(arg),
      );

  Future<void> decline() => _respond(
        InviteState.declined,
        (repo) => repo.decline(arg),
      );

  /// Flip `viewerParticipant` locally, call the API, roll back on failure.
  /// Throws [ApiException] so the screen can show it.
  Future<void> _respond(
    InviteState next,
    Future<void> Function(ChallengesRepository repo) call,
  ) async {
    final current = state.valueOrNull;
    if (current == null) return;

    final previous = current.viewerParticipant;
    final optimistic = (previous ??
            const ParticipantSummary(
              inviteState: InviteState.invited,
              resultState: ResultState.pending,
            ))
        .copyWith(inviteState: next);

    state = AsyncData(current.copyWith(viewerParticipant: optimistic));

    try {
      await call(ref.read(challengesRepositoryProvider));
      // The tabs (New / Active / Declined) now hold stale membership.
      ref.invalidate(challengeListProvider);
    } on ApiException {
      state = AsyncData(
        current.copyWith(
          viewerParticipant: previous,
          clearViewerParticipant: previous == null,
        ),
      );
      rethrow;
    }
  }
}

/// Full participant list for the Participants tab.
final challengeParticipantsProvider =
    FutureProvider.family<List<Participant>, String>((ref, id) {
  return ref.watch(challengesRepositoryProvider).participants(id);
});
