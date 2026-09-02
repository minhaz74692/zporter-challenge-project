import 'package:equatable/equatable.dart';

import '../../challenges/domain/challenge.dart';
import '../../challenges/domain/participant.dart';

/// One entry of `GET /challenges/mine/results` — a result the signed-in user
/// reported, with the challenge it belongs to. Backs the Biography
/// "Challenges" tab.
class ChallengeResult extends Equatable {
  const ChallengeResult({required this.challenge, required this.result});

  final Challenge challenge;
  final SubmittedResult result;

  factory ChallengeResult.fromJson(Map<String, dynamic> json) => ChallengeResult(
    challenge: Challenge.fromJson(json['challenge'] as Map<String, dynamic>),
    result: SubmittedResult.fromJson(json['result'] as Map<String, dynamic>),
  );

  @override
  List<Object?> get props => [challenge, result];
}
