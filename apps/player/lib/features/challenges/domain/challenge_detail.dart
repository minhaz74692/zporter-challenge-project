import 'package:equatable/equatable.dart';

import 'badge.dart';
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
    this.rewardBadge,
  });

  final Challenge challenge;
  final ParticipantSummary? viewerParticipant;
  final List<LeaderboardEntry> leaderboardPreview;

  /// The recognition badge granted on a verified result, resolved from
  /// `rewardBadgeId` so the screen can show the reward before it is earned.
  final Badge? rewardBadge;

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
    rewardBadge: json['rewardBadge'] == null
        ? null
        : Badge.fromJson(json['rewardBadge'] as Map<String, dynamic>),
  );

  ChallengeDetail copyWith({
    ParticipantSummary? viewerParticipant,
    bool clearViewerParticipant = false,
  }) => ChallengeDetail(
    challenge: challenge,
    viewerParticipant:
        clearViewerParticipant ? null : (viewerParticipant ?? this.viewerParticipant),
    leaderboardPreview: leaderboardPreview,
    rewardBadge: rewardBadge,
  );

  @override
  List<Object?> get props => [
    challenge,
    viewerParticipant,
    leaderboardPreview,
    rewardBadge,
  ];
}
