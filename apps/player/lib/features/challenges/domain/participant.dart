import 'package:equatable/equatable.dart';

import 'badge.dart';
import 'challenge_enums.dart';

/// A result a player has reported (Figma "Add result" form).
class SubmittedResult extends Equatable {
  const SubmittedResult({
    required this.value,
    required this.unit,
    required this.videoUrl,
    required this.performedAt,
    required this.controllerRef,
    this.arena,
    this.note,
    required this.submittedAt,
    this.verified,
    this.verifiedAt,
    this.shareToFeed = false,
  });

  /// Raw value: `num` for count/time/score, `bool` for boolean, `String` for text.
  final Object value;
  final ResultUnit unit;
  final String videoUrl;
  final DateTime performedAt;

  /// Handle of the witness who verified the result.
  final String controllerRef;
  final String? arena;
  final String? note;
  final DateTime submittedAt;

  /// The controller's verdict: `null` = not reviewed yet, `true` = approved,
  /// `false` = rejected.
  final bool? verified;
  final DateTime? verifiedAt;

  /// "Share to my feed" concept toggle — no feed pipeline yet (next step).
  final bool shareToFeed;

  bool get isReviewed => verified != null;

  factory SubmittedResult.fromJson(Map<String, dynamic> json) => SubmittedResult(
    value: json['value'] as Object,
    unit: ResultUnit.fromApi(json['unit'] as String?),
    videoUrl: json['videoUrl'] as String? ?? '',
    performedAt: DateTime.parse(json['performedAt'] as String),
    controllerRef: json['controllerRef'] as String? ?? '',
    arena: json['arena'] as String?,
    note: json['note'] as String?,
    submittedAt: DateTime.parse(json['submittedAt'] as String),
    verified: json['verified'] as bool?,
    verifiedAt: json['verifiedAt'] == null
        ? null
        : DateTime.parse(json['verifiedAt'] as String),
    shareToFeed: json['shareToFeed'] as bool? ?? false,
  );

  @override
  List<Object?> get props => [
    value,
    unit,
    videoUrl,
    performedAt,
    controllerRef,
    arena,
    note,
    submittedAt,
    verified,
    verifiedAt,
    shareToFeed,
  ];
}

/// A user's membership + progress in one challenge
/// (`GET /challenges/:id/participants`).
class Participant extends Equatable {
  const Participant({
    required this.userId,
    required this.displayName,
    required this.handle,
    this.avatarUrl,
    this.club,
    this.position,
    required this.inviteState,
    required this.resultState,
    this.submittedResult,
    this.rank,
    this.awardedBadge,
    required this.joinedAt,
    this.respondedAt,
  });

  final String userId;
  final String displayName;
  final String handle;
  final String? avatarUrl;
  final String? club;
  final String? position;
  final InviteState inviteState;
  final ResultState resultState;
  final SubmittedResult? submittedResult;
  final int? rank;

  /// Recognition badge earned when the controller verified this result.
  final Badge? awardedBadge;
  final DateTime joinedAt;
  final DateTime? respondedAt;

  factory Participant.fromJson(Map<String, dynamic> json) => Participant(
    userId: json['userId'] as String,
    displayName: json['displayName'] as String,
    handle: json['handle'] as String? ?? '',
    avatarUrl: json['avatarUrl'] as String?,
    club: json['club'] as String?,
    position: json['position'] as String?,
    inviteState: InviteState.fromApi(json['inviteState'] as String?),
    resultState: ResultState.fromApi(json['resultState'] as String?),
    submittedResult: json['submittedResult'] == null
        ? null
        : SubmittedResult.fromJson(json['submittedResult'] as Map<String, dynamic>),
    rank: (json['rank'] as num?)?.toInt(),
    awardedBadge: json['awardedBadge'] == null
        ? null
        : Badge.fromJson(json['awardedBadge'] as Map<String, dynamic>),
    joinedAt: DateTime.parse(json['joinedAt'] as String),
    respondedAt: json['respondedAt'] == null
        ? null
        : DateTime.parse(json['respondedAt'] as String),
  );

  @override
  List<Object?> get props => [
    userId,
    displayName,
    handle,
    avatarUrl,
    club,
    position,
    inviteState,
    resultState,
    submittedResult,
    rank,
    awardedBadge,
    joinedAt,
    respondedAt,
  ];
}

/// The caller's own participation, embedded in `GET /challenges/:id`.
class ParticipantSummary extends Equatable {
  const ParticipantSummary({
    required this.inviteState,
    required this.resultState,
    this.rank,
    this.submittedResult,
    this.awardedBadge,
  });

  final InviteState inviteState;
  final ResultState resultState;
  final int? rank;
  final SubmittedResult? submittedResult;

  /// Recognition badge earned once the caller's result is verified.
  final Badge? awardedBadge;

  bool get hasAccepted => inviteState == InviteState.accepted;
  bool get hasDeclined => inviteState == InviteState.declined;
  bool get hasSubmitted => resultState != ResultState.pending;

  factory ParticipantSummary.fromJson(Map<String, dynamic> json) => ParticipantSummary(
    inviteState: InviteState.fromApi(json['inviteState'] as String?),
    resultState: ResultState.fromApi(json['resultState'] as String?),
    rank: (json['rank'] as num?)?.toInt(),
    submittedResult: json['submittedResult'] == null
        ? null
        : SubmittedResult.fromJson(json['submittedResult'] as Map<String, dynamic>),
    awardedBadge: json['awardedBadge'] == null
        ? null
        : Badge.fromJson(json['awardedBadge'] as Map<String, dynamic>),
  );

  ParticipantSummary copyWith({
    InviteState? inviteState,
    ResultState? resultState,
  }) => ParticipantSummary(
    inviteState: inviteState ?? this.inviteState,
    resultState: resultState ?? this.resultState,
    rank: rank,
    submittedResult: submittedResult,
    awardedBadge: awardedBadge,
  );

  @override
  List<Object?> get props => [
    inviteState,
    resultState,
    rank,
    submittedResult,
    awardedBadge,
  ];
}
