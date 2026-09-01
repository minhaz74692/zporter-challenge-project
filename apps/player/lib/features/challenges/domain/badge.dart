import 'package:equatable/equatable.dart';

/// A recognition badge (seed data). Granted to a participant when their result
/// is verified; also embedded on `GET /challenges/:id` as `rewardBadge` so the
/// detail screen can show the reward before it is earned.
class Badge extends Equatable {
  const Badge({
    required this.id,
    required this.name,
    required this.icon,
    this.description = '',
  });

  final String id;
  final String name;

  /// Emoji or short glyph used as the badge mark.
  final String icon;
  final String description;

  factory Badge.fromJson(Map<String, dynamic> json) => Badge(
    id: json['id'] as String,
    name: json['name'] as String? ?? '',
    icon: json['icon'] as String? ?? '🏅',
    description: json['description'] as String? ?? '',
  );

  @override
  List<Object?> get props => [id, name, icon, description];
}
