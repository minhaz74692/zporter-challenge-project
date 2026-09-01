import 'team_option.dart';
import 'user.dart';

/// The auth boundary the app depends on. The `data/` layer implements this
/// against the REST API + secure storage; tests supply a fake.
///
/// Implementations own token persistence: a successful [login] / [signup]
/// stores the token pair, [logout] clears it.
abstract interface class AuthRepository {
  Future<User> login({required String email, required String password});

  Future<User> signup({
    required String email,
    required String password,
    required String displayName,
    required String teamId,
  });

  /// The squads a new player can join (`GET /teams/directory`). Public — no
  /// token required.
  Future<List<TeamOption>> fetchTeams();

  /// The current user from a stored token. Throws if the token is missing or
  /// rejected.
  Future<User> me();

  Future<void> logout();
}
