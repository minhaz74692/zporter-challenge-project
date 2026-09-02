import 'challenge_result.dart';

/// The Biography data boundary. `data/` implements it against the REST API;
/// tests supply a fake.
abstract interface class BiographyRepository {
  /// The signed-in user's reported results, newest first.
  Future<List<ChallengeResult>> myResults();
}
