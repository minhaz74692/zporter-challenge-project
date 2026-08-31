import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/challenges_providers.dart';
import '../domain/challenge_enums.dart';
import '../domain/challenges_repository.dart';
import '../domain/participant.dart';
import '../domain/result_strategy.dart';
import '../domain/submit_result_request.dart';

/// Raised when the form fails a rule before it reaches the API. Carries the
/// exact Figma copy for the two hard requirements.
class ResultValidationException implements Exception {
  const ResultValidationException(this.message);
  final String message;
  @override
  String toString() => message;
}

/// The single use-case in the app (per the architecture notes): validate a
/// reported result against its [ResultStrategy] and the two required fields,
/// then submit it. Pure — the screen handles provider invalidation + navigation.
class SubmitResult {
  const SubmitResult(this._repo);

  final ChallengesRepository _repo;

  Future<Participant> call({
    required String challengeId,
    required ResultType resultType,
    required String rawValue,
    required bool toggleValue,
    required String videoUrl,
    required String controllerRef,
    required DateTime performedAt,
    String? arena,
    String? note,
  }) async {
    final strategy = resultStrategyFor(resultType);
    final value = strategy.parse(rawValue, toggleValue);

    final valueError = strategy.validate(value);
    if (valueError != null) throw ResultValidationException(valueError);

    if (videoUrl.trim().isEmpty) {
      throw const ResultValidationException(
        'Video must be added to report Challenge',
      );
    }
    if (controllerRef.trim().isEmpty) {
      throw const ResultValidationException(
        'Controller must be added to report Challenge',
      );
    }

    return _repo.submitResult(
      challengeId,
      SubmitResultRequest(
        value: value!,
        videoUrl: videoUrl.trim(),
        controllerRef: controllerRef.trim(),
        performedAt: performedAt,
        arena: arena?.trim(),
        note: note?.trim(),
      ),
    );
  }
}

final submitResultProvider = Provider<SubmitResult>(
  (ref) => SubmitResult(ref.watch(challengesRepositoryProvider)),
);
