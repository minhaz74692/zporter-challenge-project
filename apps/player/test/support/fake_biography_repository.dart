import 'package:challenge/features/biography/domain/biography_repository.dart';
import 'package:challenge/features/biography/domain/challenge_result.dart';

/// In-memory [BiographyRepository] for provider + widget tests.
class FakeBiographyRepository implements BiographyRepository {
  List<ChallengeResult> results = const [];
  Object? error;
  int calls = 0;

  @override
  Future<List<ChallengeResult>> myResults() async {
    calls++;
    if (error != null) throw error!;
    return results;
  }
}
