import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/application/auth_notifier.dart';
import '../../features/auth/domain/user.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/signup_screen.dart';
import '../../features/challenges/presentation/challenge_detail_screen.dart';
import '../../features/challenges/presentation/challenges_screen.dart';
import 'app_routes.dart';

/// The app router. Its [GoRouter.redirect] is the single auth gate:
/// - session still restoring  → stay put (the splash renders on `/`)
/// - signed out               → force `/login` (allow `/signup`)
/// - signed in on an auth page → send to `/`
///
/// [GoRouter.refreshListenable] is fed by [authNotifierProvider] so every
/// auth-state change (login, logout, expiry) re-runs the redirect.
final appRouterProvider = Provider<GoRouter>((ref) {
  final authListenable = ValueNotifier<AsyncValue<User?>>(const AsyncLoading());
  ref.listen(
    authNotifierProvider,
    (_, next) => authListenable.value = next,
    fireImmediately: true,
  );
  ref.onDispose(authListenable.dispose);

  return GoRouter(
    initialLocation: AppRoutes.home,
    refreshListenable: authListenable,
    debugLogDiagnostics: kDebugMode,
    redirect: (context, state) {
      final auth = authListenable.value;
      if (auth.isLoading) return null;

      final signedIn = auth.valueOrNull != null;
      final atAuthScreen = state.matchedLocation == AppRoutes.login ||
          state.matchedLocation == AppRoutes.signup;

      if (!signedIn) return atAuthScreen ? null : AppRoutes.login;
      if (atAuthScreen) return AppRoutes.home;
      return null;
    },
    routes: [
      GoRoute(
        path: AppRoutes.login,
        builder: (_, __) => const LoginScreen(),
      ),
      GoRoute(
        path: AppRoutes.signup,
        builder: (_, __) => const SignupScreen(),
      ),
      GoRoute(
        path: AppRoutes.home,
        builder: (_, __) => const ChallengesScreen(),
      ),
      GoRoute(
        path: AppRoutes.challengeDetailPattern,
        builder: (_, state) => ChallengeDetailScreen(
          challengeId: state.pathParameters['id']!,
        ),
      ),
    ],
  );
});
