import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/push/push_providers.dart';
import 'core/router/app_router.dart';
import 'core/theme/app_theme.dart';

/// Root widget. Owns the [MaterialApp] and wires in the router (which carries
/// the auth gate) and the app-wide dark theme.
class ZporterChallengeApp extends ConsumerWidget {
  const ZporterChallengeApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Keeps the FCM token in sync with sign-in / sign-out.
    ref.watch(pushRegistrarProvider);

    return MaterialApp.router(
      title: 'Zporter',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      routerConfig: ref.watch(appRouterProvider),
    );
  }
}
