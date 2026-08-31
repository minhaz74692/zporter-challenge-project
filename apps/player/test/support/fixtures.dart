import 'package:challenge/features/auth/domain/user.dart';
import 'package:challenge/features/challenges/domain/challenge.dart';
import 'package:challenge/features/challenges/domain/challenge_detail.dart';
import 'package:challenge/features/challenges/domain/challenge_enums.dart';
import 'package:challenge/features/challenges/domain/leaderboard_entry.dart';
import 'package:challenge/features/challenges/domain/participant.dart';

User buildUser({
  String id = 'u_player1',
  String displayName = 'Priya Player',
  String handle = '#PriPla010203',
  UserRole role = UserRole.player,
}) => User(
  id: id,
  email: 'player1@zporter.test',
  displayName: displayName,
  role: role,
  handle: handle,
  createdAt: DateTime.utc(2026),
);

/// A `Challenge` list-row JSON body, shaped like the live API.
Map<String, dynamic> challengeJson({
  String id = 'c_1',
  String title = 'Keepie-Uppies Century',
  String status = 'active',
  bool withCreator = true,
}) => {
  'id': id,
  'title': title,
  'ingress': 'How high can you count without the ball touching the ground?',
  'description': 'One attempt, no hands. Report your best count.',
  'mainCategory': 'technical',
  'collections': ['ballcontrol', 'shooting'],
  'equipmentTags': ['#Balls', '#Cones'],
  'resultType': 'count',
  'resultUnit': 'reps',
  'scoringDirection': 'higher_better',
  'durationMinutes': 15,
  'location': 'gym',
  'startAt': '2026-08-30T00:00:00.000Z',
  'deadline': '2026-11-30T00:00:00.000Z',
  'status': status,
  'visibility': 'private',
  'pointsToParticipate': 10,
  'rewardPoints': 50,
  'minParticipants': 2,
  'ageFrom': 8,
  'ageTo': 12,
  'position': 'Forwards',
  'mediaImageUrl': 'https://img.test/cover.jpg',
  'ratingAverage': 3.5,
  'ratingCount': 12,
  'likeCount': 4,
  'commentCount': 2,
  'createdBy': 'u_coach',
  if (withCreator)
    'creator': {
      'id': 'u_coach',
      'displayName': 'Nicklas Jönsson',
      'handle': '#NicJon680305C',
      'club': 'Maj FC',
      'position': 'Head Coach',
    },
  'participantCount': 2,
  'createdAt': '2026-08-30T10:22:19.655Z',
};

Challenge buildChallenge({
  String id = 'c_1',
  String title = 'Keepie-Uppies Century',
  String status = 'active',
}) =>
    Challenge.fromJson(challengeJson(id: id, title: title, status: status));

List<Participant> buildParticipants() => [
  Participant(
    userId: 'u1',
    displayName: 'Neo Jönsson',
    handle: '#NeoJon070119',
    club: 'Hammarby IF',
    position: 'RW',
    inviteState: InviteState.accepted,
    resultState: ResultState.pending,
    joinedAt: DateTime.utc(2026),
  ),
  Participant(
    userId: 'u2',
    displayName: 'Mark Hammil',
    handle: '#MarHam345678',
    club: 'Wework AB',
    position: 'Agent',
    inviteState: InviteState.invited,
    resultState: ResultState.pending,
    joinedAt: DateTime.utc(2026),
  ),
  Participant(
    userId: 'u3',
    displayName: 'John Lundstram',
    handle: '#JohLun432567',
    club: 'Hammarby IF',
    position: 'Coach',
    inviteState: InviteState.declined,
    resultState: ResultState.pending,
    joinedAt: DateTime.utc(2026),
  ),
];

List<LeaderboardEntry> buildLeaderboard() => [
  LeaderboardEntry(
    userId: 'u_me',
    displayName: 'Mohamed Salah',
    handle: '#MohSal123456',
    club: 'Maj FC',
    value: 1903,
    rank: 1,
    updatedAt: DateTime.utc(2023, 12, 5),
  ),
  LeaderboardEntry(
    userId: 'u2',
    displayName: 'Raheem Sterling',
    handle: '#RaySte654321',
    club: 'Maj FC',
    value: 1781,
    rank: 2,
    updatedAt: DateTime.utc(2023, 12, 4),
  ),
  LeaderboardEntry(
    userId: 'u3',
    displayName: 'Leo Messi',
    handle: '#LeoMes321456',
    club: 'Maj FC',
    value: 1650,
    rank: 3,
    updatedAt: DateTime.utc(2023, 12, 3),
  ),
];

ChallengeDetail buildChallengeDetail({
  String id = 'c_1',
  InviteState? inviteState = InviteState.invited,
  bool ended = false,
}) => ChallengeDetail(
  challenge: buildChallenge(id: id, status: ended ? 'ended' : 'active'),
  viewerParticipant: inviteState == null
      ? null
      : ParticipantSummary(
          inviteState: inviteState,
          resultState: ResultState.pending,
        ),
);

/// The JSON body `/auth/login` returns.
Map<String, dynamic> authResponseJson({String access = 'access-1'}) => {
  'user': {
    'id': 'u_player1',
    'email': 'player1@zporter.test',
    'displayName': 'Priya Player',
    'role': 'player',
    'handle': '#PriPla010203',
    'createdAt': '2026-01-01T00:00:00.000Z',
  },
  'accessToken': access,
  'refreshToken': 'refresh-1',
};
