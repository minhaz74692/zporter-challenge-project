import 'package:equatable/equatable.dart';

import 'challenge_enums.dart';

/// The trimmed creator shape the API embeds on list + detail responses.
class CreatorSummary extends Equatable {
  const CreatorSummary({
    required this.id,
    required this.displayName,
    required this.handle,
    this.avatarUrl,
    this.country,
    this.city,
    this.club,
    this.position,
  });

  final String id;
  final String displayName;
  final String handle;
  final String? avatarUrl;
  final String? country;
  final String? city;
  final String? club;
  final String? position;

  /// `SE/Stockholm` when both are set, else whichever exists.
  String? get location {
    final parts = [country, city].where((p) => p != null && p.isNotEmpty);
    return parts.isEmpty ? null : parts.join('/');
  }

  factory CreatorSummary.fromJson(Map<String, dynamic> json) => CreatorSummary(
    id: json['id'] as String,
    displayName: json['displayName'] as String,
    handle: json['handle'] as String,
    avatarUrl: json['avatarUrl'] as String?,
    country: json['country'] as String?,
    city: json['city'] as String?,
    club: json['club'] as String?,
    position: json['position'] as String?,
  );

  @override
  List<Object?> get props =>
      [id, displayName, handle, avatarUrl, country, city, club, position];
}

/// Kind of a media-gallery item. `youtube` carries the watch URL + a thumbnail.
enum MediaKind {
  image('image'),
  video('video'),
  youtube('youtube');

  const MediaKind(this.apiValue);
  final String apiValue;

  static MediaKind fromApi(String? value) => values.firstWhere(
    (e) => e.apiValue == value,
    orElse: () => MediaKind.image,
  );
}

/// One item in a challenge's ordered media gallery.
class MediaItem extends Equatable {
  const MediaItem({required this.url, required this.type, this.thumbnailUrl});

  final String url;
  final MediaKind type;
  final String? thumbnailUrl;

  /// A 16:9 `img.youtube.com` still for a YouTube item. `default/hqdefault/
  /// sddefault.jpg` are 4:3 with baked-in letterbox bars, so those are rewritten
  /// to `hq720.jpg` even when the API supplied them; a missing thumbnail is
  /// derived the same way.
  String? get resolvedThumbnail {
    final given = thumbnailUrl;
    if (given != null && given.isNotEmpty) {
      if (type != MediaKind.youtube) return given;
      return given.replaceFirst(
        RegExp(r'/(?:default|hqdefault|sddefault)\.jpg(\?.*)?$'),
        '/hq720.jpg',
      );
    }
    return _youtubeStill('hq720.jpg');
  }

  /// Guaranteed-to-exist 16:9 fallback still if [resolvedThumbnail] 404s.
  String? get fallbackThumbnail => _youtubeStill('mqdefault.jpg');

  String? _youtubeStill(String name) {
    if (type != MediaKind.youtube) return null;
    final id = youtubeId(url);
    return id == null ? null : 'https://img.youtube.com/vi/$id/$name';
  }

  /// The 11-char video id from a `watch?v=` / `youtu.be/` URL, for in-app
  /// playback. Null if [url] isn't a recognisable YouTube link.
  static String? youtubeId(String url) {
    final uri = Uri.tryParse(url);
    if (uri == null) return null;
    final v = uri.queryParameters['v'];
    if (v != null && v.length == 11) return v;
    final last = uri.pathSegments.isEmpty ? null : uri.pathSegments.last;
    return (last != null && last.length == 11) ? last : null;
  }

  factory MediaItem.fromJson(Map<String, dynamic> json) => MediaItem(
    url: json['url'] as String? ?? '',
    type: MediaKind.fromApi(json['type'] as String?),
    thumbnailUrl: json['thumbnailUrl'] as String?,
  );

  @override
  List<Object?> get props => [url, type, thumbnailUrl];
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
    this.media = const [],
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

  /// Ordered media gallery. Empty for challenges created before the gallery
  /// existed — use [galleryItems], which falls back to the legacy fields.
  final List<MediaItem> media;
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

  /// The gallery to render: [media] when present, else a synthesised list from
  /// the legacy `mediaImageUrl` / `mediaVideoUrl` fields.
  List<MediaItem> get galleryItems {
    if (media.isNotEmpty) return media;
    return [
      if (mediaImageUrl != null && mediaImageUrl!.isNotEmpty)
        MediaItem(url: mediaImageUrl!, type: MediaKind.image),
      if (mediaVideoUrl != null && mediaVideoUrl!.isNotEmpty)
        MediaItem(url: mediaVideoUrl!, type: MediaKind.video),
    ];
  }

  /// True when the gallery holds a video / YouTube item anywhere (the cover
  /// image is usually item 0, so `first` alone is unreliable). Drives the
  /// card's shorter cover treatment.
  bool get hasVideoCover =>
      galleryItems.any((m) => m.type != MediaKind.image);

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
    media: (json['media'] as List?)
            ?.map((e) => MediaItem.fromJson(e as Map<String, dynamic>))
            .toList(growable: false) ??
        const [],
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
    media,
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
