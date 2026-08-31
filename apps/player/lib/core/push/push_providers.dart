import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/application/auth_notifier.dart';
import '../../features/notifications/application/notifications_provider.dart';
import '../network/network_providers.dart';
import '../router/app_router.dart';
import 'push_service.dart';

final pushApiProvider = Provider<PushApi>(
  (ref) => PushApi(ref.watch(dioProvider)),
);

final pushServiceProvider = Provider<PushService>(
  (ref) => PushService(
    api: ref.watch(pushApiProvider),
    router: ref.watch(appRouterProvider),
    onInboxChanged: () => ref.invalidate(notificationsProvider),
  ),
);

/// Watched once at the app root: registers the FCM token on sign-in and drops
/// it on sign-out.
final pushRegistrarProvider = Provider<void>((ref) {
  ref.listen(
    authNotifierProvider,
    (previous, next) {
      final wasSignedIn = previous?.valueOrNull != null;
      final isSignedIn = next.valueOrNull != null;
      final push = ref.read(pushServiceProvider);
      if (isSignedIn && !wasSignedIn) push.syncToken();
      if (!isSignedIn && wasSignedIn) push.clear();
    },
    fireImmediately: true,
  );
});
