import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/notifications_repository_impl.dart';
import '../domain/app_notification.dart';

final notificationsProvider =
    AsyncNotifierProvider<NotificationsNotifier, List<AppNotification>>(
  NotificationsNotifier.new,
);

class NotificationsNotifier extends AsyncNotifier<List<AppNotification>> {
  @override
  Future<List<AppNotification>> build() {
    return ref.watch(notificationsRepositoryProvider).list();
  }

  /// Optimistically flag one as read, then persist.
  Future<void> markRead(String id) async {
    final current = state.valueOrNull;
    if (current == null) return;
    state = AsyncData([
      for (final n in current) if (n.id == id) n.copyWith(read: true) else n,
    ]);
    try {
      await ref.read(notificationsRepositoryProvider).markRead(id);
    } catch (_) {
      ref.invalidateSelf();
    }
  }
}

/// How many unread — drives the bell dot.
final unreadNotificationCountProvider = Provider<int>((ref) {
  final list = ref.watch(notificationsProvider).valueOrNull;
  return list?.where((n) => !n.read).length ?? 0;
});
