import 'package:equatable/equatable.dart';

import 'challenge_enums.dart';

/// The trimmed creator shape the API embeds on list + detail responses.
class CreatorSummary extends Equatable {
  const CreatorSummary({
    required this.id,
    required this.displayName,
    required this.handle,
    this.avatarUrl,
    this.club,
    this.position,
  });

  final String id;
  final String displayName;
  final String handle;
  final String? avatarUrl;
  final String? club;
  final String? position;

  factory CreatorSummary.fromJson(Map<String, dynamic> json) => CreatorSummary(
    id: json['id'] as String,
    displayName: json['displayName'] as String,
    handle: json['handle'] as String,
    avatarUrl: json['avatarUrl'] as String?,
    club: json['club'] as String?,
    position: json['position'] as String?,
  );

  @override
  List<Object?> get props => [id, displayName, handle, avatarUrl, club, position];
}

/// A live challenge instance. Field set mirrors `GET /challenges` list rows;
/// the extra detail payload lives on [ChallengeDetail].
class Challenge extends Equatable {
  const Challenge({
    required this.id,
    this.templateId,
    required this.title,
    this.ingress,
    required this.description,
    required this.mainCategory,
    required this.collections,
    required this.equipmentTags,
    required this.resultType,
    required this.resultUnit,
    required this.scoringDirection,
    required this.durationMinutes,
    required this.location,
    required this.startAt,
    required this.deadline,
    required this.status,
    required this.pointsToParticipate,
    required this.rewardPoints,
    required this.minParticipants,
    this.ageFrom,
    this.ageTo,
    this.position,
    this.mediaImageUrl,
    this.mediaVideoUrl,
    this.ratingAverage,
    this.ratingCount,
    required this.likeCount,
    required this.commentCount,
    required this.createdBy,
    this.creator,
    required this.participantCount,
    required this.createdAt,
  });

  final String id;
  final String? templateId;

  /// Figma "Headline".
  final String title;

  /// Figma "Ingress" — short subtitle under the headline.
  final String? ingress;
  final String description;
  final ChallengeMainCategory mainCategory;

  /// Skill-focus tags — rendered as the solid-blue pill row.
  final List<String> collections;

  /// Equipment hashtags — rendered as the grey pill row.
  final List<String> equipmentTags;
  final ResultType resultType;
  final ResultUnit resultUnit;
  final ScoringDirection scoringDirection;
  final int durationMinutes;
  final ChallengeLocation location;
  final DateTime startAt;
  final DateTime deadline;
  final ChallengeStatus status;
  final int pointsToParticipate;
  final int rewardPoints;
  final int minParticipants;
  final int? ageFrom;
  final int? ageTo;

  /// Target playing position, e.g. `Forwards`, `All`.
  final String? position;
  final String? mediaImageUrl;
  final String? mediaVideoUrl;
  final double? ratingAverage;
  final int? ratingCount;
  final int likeCount;
  final int commentCount;
  final String createdBy;
  final CreatorSummary? creator;
  final int participantCount;
  final DateTime createdAt;

  /// True once the deadline has passed — the API also reports this via
  /// [status], this is the lazy client-side equivalent for freshly loaded data.
  bool get hasEnded =>
      status == ChallengeStatus.ended || DateTime.now().isAfter(deadline);

  factory Challenge.fromJson(Map<String, dynamic> json) => Challenge(
    id: json['id'] as String,
    templateId: json['templateId'] as String?,
    title: json['title'] as String,
    ingress: json['ingress'] as String?,
    description: json['description'] as String? ?? '',
    mainCategory: ChallengeMainCategory.fromApi(json['mainCategory'] as String?),
    collections: _stringList(json['collections']),
    equipmentTags: _stringList(json['equipmentTags']),
    resultType: ResultType.fromApi(json['resultType'] as String?),
    resultUnit: ResultUnit.fromApi(json['resultUnit'] as String?),
    scoringDirection: ScoringDirection.fromApi(json['scoringDirection'] as String?),
    durationMinutes: (json['durationMinutes'] as num?)?.toInt() ?? 0,
    location: ChallengeLocation.fromApi(json['location'] as String?),
    startAt: DateTime.parse(json['startAt'] as String),
    deadline: DateTime.parse(json['deadline'] as String),
    status: ChallengeStatus.fromApi(json['status'] as String?),
    pointsToParticipate: (json['pointsToParticipate'] as num?)?.toInt() ?? 0,
    rewardPoints: (json['rewardPoints'] as num?)?.toInt() ?? 0,
    minParticipants: (json['minParticipants'] as num?)?.toInt() ?? 0,
    ageFrom: (json['ageFrom'] as num?)?.toInt(),
    ageTo: (json['ageTo'] as num?)?.toInt(),
    position: json['position'] as String?,
    mediaImageUrl: json['mediaImageUrl'] as String?,
    mediaVideoUrl: json['mediaVideoUrl'] as String?,
    ratingAverage: (json['ratingAverage'] as num?)?.toDouble(),
    ratingCount: (json['ratingCount'] as num?)?.toInt(),
    likeCount: (json['likeCount'] as num?)?.toInt() ?? 0,
    commentCount: (json['commentCount'] as num?)?.toInt() ?? 0,
    createdBy: json['createdBy'] as String,
    creator: json['creator'] == null
        ? null
        : CreatorSummary.fromJson(json['creator'] as Map<String, dynamic>),
    participantCount: (json['participantCount'] as num?)?.toInt() ?? 0,
    createdAt: DateTime.parse(json['createdAt'] as String),
  );

  static List<String> _stringList(Object? raw) =>
      (raw as List?)?.map((e) => e.toString()).toList(growable: false) ?? const [];

  @override
  List<Object?> get props => [
    id,
    title,
    ingress,
    description,
    mainCategory,
    collections,
    equipmentTags,
    resultType,
    resultUnit,
    scoringDirection,
    durationMinutes,
    location,
    startAt,
    deadline,
    status,
    pointsToParticipate,
    rewardPoints,
    minParticipants,
    ageFrom,
    ageTo,
    position,
    mediaImageUrl,
    mediaVideoUrl,
    ratingAverage,
    ratingCount,
    likeCount,
    commentCount,
    createdBy,
    creator,
    participantCount,
    createdAt,
  ];
}
