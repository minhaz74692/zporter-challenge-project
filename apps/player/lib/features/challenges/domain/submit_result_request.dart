/// Body of `POST /challenges/:id/results` (the Figma "Add result" form).
class SubmitResultRequest {
  const SubmitResultRequest({
    required this.value,
    required this.videoUrl,
    required this.performedAt,
    required this.controllerRef,
    this.arena,
    this.note,
    this.shareToFeed = false,
  });

  /// `num` for count/time/score, `bool` for boolean, `String` for text.
  final Object value;
  final String videoUrl;
  final DateTime performedAt;

  /// Handle of the witness (`#code`).
  final String controllerRef;
  final String? arena;
  final String? note;

  /// "Share to my feed" concept toggle — sent through, no feed pipeline yet.
  final bool shareToFeed;

  Map<String, dynamic> toJson() => {
    'value': value,
    'videoUrl': videoUrl,
    'performedAt': performedAt.toUtc().toIso8601String(),
    'controllerRef': controllerRef,
    if (arena != null && arena!.isNotEmpty) 'arena': arena,
    if (note != null && note!.isNotEmpty) 'note': note,
    if (shareToFeed) 'shareToFeed': true,
  };
}
