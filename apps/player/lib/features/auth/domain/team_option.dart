import 'package:equatable/equatable.dart';

/// One squad in the signup team picker — mirrors the API's
/// `GET /teams/directory` (`TeamSummary`) shape. A player joins exactly one
/// team at signup.
class TeamOption extends Equatable {
  const TeamOption({
    required this.id,
    required this.name,
    required this.coachName,
  });

  final String id;
  final String name;
  final String coachName;

  factory TeamOption.fromJson(Map<String, dynamic> json) => TeamOption(
    id: json['id'] as String,
    name: json['name'] as String,
    coachName: (json['coachName'] as String?) ?? '',
  );

  @override
  List<Object?> get props => [id, name, coachName];
}
