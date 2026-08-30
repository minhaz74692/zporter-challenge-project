import 'package:equatable/equatable.dart';

import 'challenge.dart';
import 'leaderboard_entry.dart';
import 'participant.dart';

/// `GET /challenges/:id` — the challenge plus the caller's participation and a
/// short leaderboard preview, so the detail screen needs one request.
class ChallengeDetail extends Equatable {
  const ChallengeDetail({
    required this.challenge,
    this.viewerParticipant,
    this.leaderboardPreview = const [],
  });

  final Challenge challenge;
  final ParticipantSummary? viewerParticipant;
  final List<LeaderboardEntry> leaderboardPreview;

  factory ChallengeDetail.fromJson(Map<String, dynamic> json) => ChallengeDetail(
    challenge: Challenge.fromJson(json),
    viewerParticipant: json['viewerParticipant'] == null
        ? null
        : ParticipantSummary.fromJson(
            json['viewerParticipant'] as Map<String, dynamic>,
          ),
    leaderboardPreview: (json['leaderboardPreview'] as List?)
            ?.map((e) => LeaderboardEntry.fromJson(e as Map<String, dynamic>))
            .toList(growable: false) ??
        const [],
  );

  ChallengeDetail copyWith({ParticipantSummary? viewerParticipant}) => ChallengeDetail(
    challenge: challenge,
    viewerParticipant: viewerParticipant ?? this.viewerParticipant,
    leaderboardPreview: leaderboardPreview,
  );

  @override
  List<Object?> get props => [challenge, viewerParticipant, leaderboardPreview];
}
