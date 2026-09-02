import 'package:equatable/equatable.dart';

import '../../challenges/domain/badge.dart';
import '../../challenges/domain/challenge.dart';
import '../../challenges/domain/challenge_enums.dart';

/// Feed tabs — Figma `Team · Yours · Saved`.
enum FeedTab {
  team('team', 'Team'),
  yours('yours', 'Yours'),
  saved('saved', 'Saved');

  const FeedTab(this.apiValue, this.label);

  final String apiValue;
  final String label;
}

/// Kind of feed post. Mirrors the API's `FeedPostType`.
enum FeedPostKind {
  challengePublished('challenge_published'),
  resultUpdate('result_update'),
  unknown('');

  const FeedPostKind(this.apiValue);

  final String apiValue;

  static FeedPostKind fromApi(String? value) => values.firstWhere(
    (e) => e.apiValue == value,
    orElse: () => FeedPostKind.unknown,
  );
}

/// The reported-result half of a `result_update` post.
class FeedResult extends Equatable {
  const FeedResult({
    required this.value,
    required this.unit,
    required this.videoUrl,
    required this.performedAt,
    this.arena,
    this.awardedBadge,
  });

  final Object value;
  final ResultUnit unit;
  final String videoUrl;
  final DateTime performedAt;
  final String? arena;
  final Badge? awardedBadge;

  /// `120 kg` — the value with its unit, boolean rendered as Done / Not done.
  String get display {
    final v = value;
    if (v is bool) return v ? 'Done' : 'Not done';
    final suffix = unit.short.isEmpty ? '' : ' ${unit.short}';
    return '$v$suffix'.trim();
  }

  factory FeedResult.fromJson(Map<String, dynamic> json) => FeedResult(
    value: (json['value'] ?? 0) as Object,
    unit: ResultUnit.fromApi(json['unit'] as String?),
    videoUrl: json['videoUrl'] as String? ?? '',
    performedAt: DateTime.parse(json['performedAt'] as String),
    arena: json['arena'] as String?,
    awardedBadge: json['awardedBadge'] == null
        ? null
        : Badge.fromJson(json['awardedBadge'] as Map<String, dynamic>),
  );

  @override
  List<Object?> get props => [value, unit, videoUrl, performedAt, arena, awardedBadge];
}

/// One activity-feed post (`GET /feed`). The [challenge] is a denormalised
/// snapshot captured when the post was created, so the card renders with no
/// extra request.
class FeedPost extends Equatable {
  const FeedPost({
    required this.id,
    required this.kind,
    required this.author,
    required this.challenge,
    required this.likeCount,
    required this.commentCount,
    required this.likedByMe,
    required this.savedByMe,
    required this.createdAt,
    this.result,
  });

  final String id;
  final FeedPostKind kind;

  /// Who posted — the challenge creator, or the player who shared the result.
  final CreatorSummary author;
  final Challenge challenge;
  final FeedResult? result;
  final int likeCount;
  final int commentCount;
  final bool likedByMe;
  final bool savedByMe;
  final DateTime createdAt;

  bool get isResultUpdate => kind == FeedPostKind.resultUpdate;

  /// Optimistic local edit for the like toggle.
  FeedPost withLike({required bool liked}) => _copy(
    liked: liked,
    likeCount: (likeCount + (liked ? 1 : -1)).clamp(0, 1 << 30),
  );

  /// Optimistic local edit for the save toggle.
  FeedPost withSave({required bool saved}) => _copy(saved: saved);

  FeedPost _copy({bool? liked, bool? saved, int? likeCount}) => FeedPost(
    id: id,
    kind: kind,
    author: author,
    challenge: challenge,
    result: result,
    likeCount: likeCount ?? this.likeCount,
    commentCount: commentCount,
    likedByMe: liked ?? likedByMe,
    savedByMe: saved ?? savedByMe,
    createdAt: createdAt,
  );

  factory FeedPost.fromJson(Map<String, dynamic> json) => FeedPost(
    id: json['id'] as String,
    kind: FeedPostKind.fromApi(json['type'] as String?),
    author: CreatorSummary.fromJson(json['author'] as Map<String, dynamic>),
    challenge: Challenge.fromJson(json['challenge'] as Map<String, dynamic>),
    result: json['result'] == null
        ? null
        : FeedResult.fromJson(json['result'] as Map<String, dynamic>),
    likeCount: (json['likeCount'] as num?)?.toInt() ?? 0,
    commentCount: (json['commentCount'] as num?)?.toInt() ?? 0,
    likedByMe: json['likedByMe'] as bool? ?? false,
    savedByMe: json['savedByMe'] as bool? ?? false,
    createdAt: DateTime.parse(json['createdAt'] as String),
  );

  @override
  List<Object?> get props => [
    id,
    kind,
    author,
    challenge,
    result,
    likeCount,
    commentCount,
    likedByMe,
    savedByMe,
    createdAt,
  ];
}
