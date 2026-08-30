import 'challenge.dart';
import 'challenge_detail.dart';
import 'challenge_enums.dart';
import 'leaderboard_entry.dart';
import 'participant.dart';

/// The challenge data boundary. `data/` implements this against the REST API;
/// tests supply a fake.
abstract interface class ChallengesRepository {
  /// The caller's challenges for one list tab (`GET /challenges?category=`).
  Future<List<Challenge>> list(ChallengeCategory category);

  /// One challenge with the caller's participation + leaderboard preview.
  Future<ChallengeDetail> getById(String id);

  /// Accept an invite. Idempotent server-side.
  Future<void> accept(String id);

  /// Decline an invite.
  Future<void> decline(String id);

  Future<List<Participant>> participants(String id);

  Future<List<LeaderboardEntry>> leaderboard(String id);
}
