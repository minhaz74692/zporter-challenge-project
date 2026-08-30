import 'package:equatable/equatable.dart';

/// One ranked row of `GET /challenges/:id/leaderboard` (also used for the
/// detail-screen preview).
class LeaderboardEntry extends Equatable {
  const LeaderboardEntry({
    required this.userId,
    required this.displayName,
    required this.handle,
    this.avatarUrl,
    this.club,
    required this.value,
    required this.rank,
    required this.updatedAt,
  });

  final String userId;
  final String displayName;
  final String handle;
  final String? avatarUrl;
  final String? club;
  final num value;
  final int rank;
  final DateTime updatedAt;

  factory LeaderboardEntry.fromJson(Map<String, dynamic> json) => LeaderboardEntry(
    userId: json['userId'] as String,
    displayName: json['displayName'] as String,
    handle: json['handle'] as String? ?? '',
    avatarUrl: json['avatarUrl'] as String?,
    club: json['club'] as String?,
    value: json['value'] as num? ?? 0,
    rank: (json['rank'] as num?)?.toInt() ?? 0,
    updatedAt: DateTime.parse(json['updatedAt'] as String),
  );

  @override
  List<Object?> get props =>
      [userId, displayName, handle, avatarUrl, club, value, rank, updatedAt];
}
