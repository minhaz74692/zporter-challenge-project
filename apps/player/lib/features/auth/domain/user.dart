import 'package:equatable/equatable.dart';

/// Who can sign in. The player app only ever *creates* `player` accounts, but
/// `coach` / `admin` can still log in here (they mostly use the web app).
enum UserRole { player, coach, admin }

/// The authenticated user — mirrors the API's `GET /auth/me` shape.
///
/// Immutable value object: [Equatable] gives `==` / `hashCode` from [props];
/// [fromJson] parses the API body. No code generation.
class User extends Equatable {
  const User({
    required this.id,
    required this.email,
    required this.displayName,
    required this.role,
    required this.handle,
    this.avatarUrl,
    this.country,
    this.city,
    this.club,
    this.position,
    required this.createdAt,
  });

  final String id;
  final String email;
  final String displayName;
  final UserRole role;

  /// Public handle shown beside the name, e.g. `#NeoJon070119`.
  final String handle;
  final String? avatarUrl;
  final String? country;
  final String? city;
  final String? club;

  /// Playing position, e.g. `FW`, `CM`, `GK`.
  final String? position;
  final DateTime createdAt;

  factory User.fromJson(Map<String, dynamic> json) => User(
    id: json['id'] as String,
    email: json['email'] as String,
    displayName: json['displayName'] as String,
    role: UserRole.values.byName(json['role'] as String),
    handle: json['handle'] as String,
    avatarUrl: json['avatarUrl'] as String?,
    country: json['country'] as String?,
    city: json['city'] as String?,
    club: json['club'] as String?,
    position: json['position'] as String?,
    createdAt: DateTime.parse(json['createdAt'] as String),
  );

  @override
  List<Object?> get props => [
    id,
    email,
    displayName,
    role,
    handle,
    avatarUrl,
    country,
    city,
    club,
    position,
    createdAt,
  ];
}
