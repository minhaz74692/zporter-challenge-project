import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/util/formatters.dart';
import '../../../core/widgets/async_view.dart';
import '../application/notifications_provider.dart';
import '../domain/app_notification.dart';
import 'verify_result_sheet.dart';

/// The bell-icon inbox — `GET /notifications`, newest first. Tapping marks the
/// row read and either deep-links to the challenge or, for a verify request,
/// opens the approve / reject sheet.
class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final value = ref.watch(notificationsProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        title: const Text('Notifications'),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(notificationsProvider.future),
        child: AsyncView<List<AppNotification>>(
          value: value,
          onRetry: () => ref.invalidate(notificationsProvider),
          emptyMessage: 'No notifications yet.',
          data: (items) => ListView.separated(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(vertical: 8),
            itemCount: items.length,
            separatorBuilder: (_, __) =>
                const Divider(color: AppColors.borderSoft, height: 1),
            itemBuilder: (context, i) => _NotificationTile(
              notification: items[i],
              onTap: () => _handleTap(context, ref, items[i]),
            ),
          ),
        ),
      ),
    );
  }

  void _handleTap(BuildContext context, WidgetRef ref, AppNotification n) {
    ref.read(notificationsProvider.notifier).markRead(n.id);
    if (n.isVerifyRequest) {
      showVerifyResultSheet(context, n);
    } else if (n.challengeId != null) {
      context.push(AppRoutes.challengeDetail(n.challengeId!));
    }
  }
}

class _NotificationTile extends StatelessWidget {
  const _NotificationTile({required this.notification, required this.onTap});

  final AppNotification notification;
  final VoidCallback onTap;

  ({IconData icon, Color color}) get _leading => switch (notification.type) {
    AppNotificationType.challengeInvite => (
      icon: Icons.mail_outline_rounded,
      color: AppColors.primary,
    ),
    AppNotificationType.resultVerifyRequest => (
      icon: Icons.fact_check_outlined,
      color: AppColors.accent,
    ),
    AppNotificationType.resultVerified => (
      icon: Icons.verified_outlined,
      color: AppColors.success,
    ),
    AppNotificationType.resultSubmitted => (
      icon: Icons.flag_outlined,
      color: AppColors.primary,
    ),
    AppNotificationType.challengeReminder => (
      icon: Icons.alarm_rounded,
      color: AppColors.accent,
    ),
    AppNotificationType.badgeEarned => (
      icon: Icons.workspace_premium_rounded,
      color: AppColors.success,
    ),
    AppNotificationType.challengeEnded => (
      icon: Icons.timer_off_outlined,
      color: AppColors.muted,
    ),
    _ => (icon: Icons.notifications_none_rounded, color: AppColors.muted),
  };

  @override
  Widget build(BuildContext context) {
    final unread = !notification.read;
    final l = _leading;

    return InkWell(
      onTap: onTap,
      child: Container(
        color: unread ? AppColors.primary.withValues(alpha: 0.06) : null,
        padding: const EdgeInsets.fromLTRB(16, 14, 16, 14),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(l.icon, color: l.color, size: 22),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    notification.title,
                    style: TextStyle(
                      color: AppColors.fg,
                      fontSize: 14,
                      fontWeight: unread ? FontWeight.w700 : FontWeight.w500,
                    ),
                  ),
                  if (notification.body.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      notification.body,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.muted,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text(
                  formatRelative(notification.createdAt),
                  style: const TextStyle(color: AppColors.faint, fontSize: 11),
                ),
                if (unread) ...[
                  const SizedBox(height: 6),
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: AppColors.primary,
                      shape: BoxShape.circle,
                    ),
                  ),
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }
}
