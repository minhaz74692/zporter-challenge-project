import 'package:equatable/equatable.dart';

/// Who can sign in. The player app only ever *creates* `player` accounts, but
/// `coach` / `admin` can still log in here (they mostly use the web app).
enum UserRole { player, coach, admin }

/// Preferred foot (Biography).
enum PreferredFoot {
  left('left', 'LEFT'),
  right('right', 'RIGHT'),
  both('both', 'BOTH');

  const PreferredFoot(this.apiValue, this.label);

  final String apiValue;
  final String label;

  static PreferredFoot? fromApi(String? raw) {
    for (final f in values) {
      if (f.apiValue == raw) return f;
    }
    return null;
  }
}

/// Outbound social links on the Biography screen — a platform → URL map.
typedef SocialLinks = Map<String, String>;

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
    this.birthDate,
    this.heightCm,
    this.weightKg,
    this.foot,
    this.marketValue,
    this.bio,
    this.ratingPercent,
    this.friendsCount,
    this.fansCount,
    this.followsCount,
    this.socials = const {},
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

  // --- Biography profile (all optional) ---
  final DateTime? birthDate;
  final int? heightCm;
  final int? weightKg;
  final PreferredFoot? foot;
  final String? marketValue;
  final String? bio;
  final int? ratingPercent;
  final int? friendsCount;
  final int? fansCount;
  final int? followsCount;
  final SocialLinks socials;

  /// Whole years from [birthDate] to today.
  int? get age {
    final b = birthDate;
    if (b == null) return null;
    final now = DateTime.now();
    var years = now.year - b.year;
    if (now.month < b.month || (now.month == b.month && now.day < b.day)) {
      years--;
    }
    return years;
  }

  /// Stars (0–5) from [ratingPercent].
  double get ratingStars => (ratingPercent ?? 0) / 20;

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
    birthDate: _date(json['birthDate']),
    heightCm: (json['heightCm'] as num?)?.toInt(),
    weightKg: (json['weightKg'] as num?)?.toInt(),
    foot: PreferredFoot.fromApi(json['foot'] as String?),
    marketValue: json['marketValue'] as String?,
    bio: json['bio'] as String?,
    ratingPercent: (json['ratingPercent'] as num?)?.toInt(),
    friendsCount: (json['friendsCount'] as num?)?.toInt(),
    fansCount: (json['fansCount'] as num?)?.toInt(),
    followsCount: (json['followsCount'] as num?)?.toInt(),
    socials: (json['socials'] as Map?)?.map(
          (k, v) => MapEntry(k.toString(), v.toString()),
        ) ??
        const {},
  );

  static DateTime? _date(Object? raw) =>
      raw is String && raw.isNotEmpty ? DateTime.tryParse(raw) : null;

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
    birthDate,
    heightCm,
    weightKg,
    foot,
    marketValue,
    bio,
    ratingPercent,
    friendsCount,
    fansCount,
    followsCount,
    socials,
  ];
}
