import 'package:challenge/features/auth/domain/auth_repository.dart';
import 'package:challenge/features/auth/domain/user.dart';

/// Scriptable [AuthRepository] for `application/` tests. Set the `*Result` /
/// `*Error` fields to control each method's outcome.
class FakeAuthRepository implements AuthRepository {
  User? loginResult;
  Object? loginError;

  User? signupResult;
  Object? signupError;

  User? meResult;
  Object? meError;

  int logoutCount = 0;

  @override
  Future<User> login({required String email, required String password}) async {
    if (loginError != null) throw loginError!;
    return loginResult!;
  }

  @override
  Future<User> signup({
    required String email,
    required String password,
    required String displayName,
  }) async {
    if (signupError != null) throw signupError!;
    return signupResult!;
  }

  @override
  Future<User> me() async {
    if (meError != null) throw meError!;
    return meResult!;
  }

  @override
  Future<void> logout() async => logoutCount++;
}
