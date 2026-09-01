import 'package:equatable/equatable.dart';

/// Mirrors the API's `NotificationType`.
enum AppNotificationType {
  challengeInvite('challenge_invite'),
  challengeLaunched('challenge_launched'),
  resultSubmitted('result_submitted'),
  resultVerifyRequest('result_verify_request'),
  resultVerified('result_verified'),
  challengeEnded('challenge_ended'),
  challengeReminder('challenge_reminder'),
  badgeEarned('badge_earned'),
  other('');

  const AppNotificationType(this.apiValue);
  final String apiValue;

  static AppNotificationType fromApi(String? value) => values.firstWhere(
    (e) => e.apiValue == value,
    orElse: () => AppNotificationType.other,
  );
}

/// An in-app notification row (`GET /notifications`).
class AppNotification extends Equatable {
  const AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.body,
    required this.read,
    required this.createdAt,
    this.challengeId,
    this.actorId,
  });

  final String id;
  final AppNotificationType type;
  final String title;
  final String body;
  final bool read;
  final DateTime createdAt;

  /// The challenge it's about, if any (used to deep-link).
  final String? challengeId;

  /// Who triggered it — e.g. the player whose result needs verifying.
  final String? actorId;

  bool get isVerifyRequest => type == AppNotificationType.resultVerifyRequest;

  AppNotification copyWith({bool? read}) => AppNotification(
    id: id,
    type: type,
    title: title,
    body: body,
    read: read ?? this.read,
    createdAt: createdAt,
    challengeId: challengeId,
    actorId: actorId,
  );

  factory AppNotification.fromJson(Map<String, dynamic> json) => AppNotification(
    id: json['id'] as String,
    type: AppNotificationType.fromApi(json['type'] as String?),
    title: json['title'] as String? ?? '',
    body: json['body'] as String? ?? '',
    read: json['read'] as bool? ?? false,
    createdAt: DateTime.parse(json['createdAt'] as String),
    challengeId: json['challengeId'] as String?,
    actorId: json['actorId'] as String?,
  );

  @override
  List<Object?> get props => [id, type, title, body, read, createdAt, challengeId, actorId];
}
