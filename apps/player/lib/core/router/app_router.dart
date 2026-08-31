import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/application/auth_notifier.dart';
import '../../features/auth/domain/user.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/signup_screen.dart';
import '../../features/challenges/presentation/challenge_detail_screen.dart';
import '../../features/challenges/presentation/challenges_screen.dart';
import '../../features/notifications/presentation/notifications_screen.dart';
import '../theme/app_colors.dart';
import 'app_routes.dart';

/// The app router. Its [GoRouter.redirect] is the single auth gate:
/// - session still restoring  → `/splash` (so no authenticated screen mounts
///   and fires API calls before the token is ready)
/// - signed out               → force `/login` (allow `/signup`)
/// - signed in on an auth/splash page → send to `/`
///
/// [GoRouter.refreshListenable] is fed by [authNotifierProvider] so every
/// auth-state change (login, logout, expiry) re-runs the redirect.
final appRouterProvider = Provider<GoRouter>((ref) {
  final authListenable = ValueNotifier<AsyncValue<User?>>(const AsyncLoading());
  // The splash only covers the *initial* session restore. Once auth has
  // resolved once, a later loading state (an in-flight login) stays put — the
  // login button shows its own spinner.
  var restored = false;
  ref.listen(
    authNotifierProvider,
    (_, next) {
      if (!next.isLoading) restored = true;
      authListenable.value = next;
    },
    fireImmediately: true,
  );
  ref.onDispose(authListenable.dispose);

  return GoRouter(
    initialLocation: AppRoutes.splash,
    refreshListenable: authListenable,
    debugLogDiagnostics: kDebugMode,
    redirect: (context, state) {
      final auth = authListenable.value;
      final loc = state.matchedLocation;

      if (auth.isLoading && !restored) {
        return loc == AppRoutes.splash ? null : AppRoutes.splash;
      }
      if (auth.isLoading) return null; // in-flight login/refresh — stay put

      final signedIn = auth.valueOrNull != null;

      if (!signedIn) {
        return (loc == AppRoutes.login || loc == AppRoutes.signup)
            ? null
            : AppRoutes.login;
      }
      final atGate = loc == AppRoutes.login ||
          loc == AppRoutes.signup ||
          loc == AppRoutes.splash;
      if (atGate) return AppRoutes.home;
      return null;
    },
    routes: [
      GoRoute(
        path: AppRoutes.splash,
        builder: (_, __) => const _SplashScreen(),
      ),
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
        path: AppRoutes.notifications,
        builder: (_, __) => const NotificationsScreen(),
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

/// Shown while the stored session is being restored on launch.
class _SplashScreen extends StatelessWidget {
  const _SplashScreen();

  @override
  Widget build(BuildContext context) => const Scaffold(
    backgroundColor: AppColors.bg,
    body: Center(child: CircularProgressIndicator()),
  );
}
