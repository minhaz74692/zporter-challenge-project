import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/section_tab_bar.dart';
import '../../challenges/presentation/widgets/app_drawer.dart';
import '../../notifications/application/notifications_provider.dart';
import '../domain/feed_post.dart';
import 'widgets/feed_list_view.dart';

/// The activity feed (Figma "Feed"): a top bar, the `Team · Yours · Saved`
/// tabs, then each tab's [FeedListView]. Mirrors the challenge-list chrome so
/// the two screens feel like one app.
class FeedScreen extends StatelessWidget {
  const FeedScreen({super.key});

  static const _tabs = FeedTab.values;

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: _tabs.length,
      initialIndex: FeedTab.yours.index,
      child: Scaffold(
        backgroundColor: AppColors.bg,
        drawer: const AppDrawer(),
        appBar: AppBar(
          title: const Text('Feed'),
          actions: [
            const _TopBarIcon(icon: Icons.chat_bubble_outline_rounded),
            _NotificationsBell(
              onTap: () => context.push(AppRoutes.notifications),
            ),
            const _TopBarIcon(icon: Icons.search_rounded),
            const SizedBox(width: 10),
          ],
          bottom: SectionTabBar(labels: [for (final t in _tabs) t.label]),
        ),
        body: TabBarView(
          children: [for (final t in _tabs) FeedListView(tab: t)],
        ),
      ),
    );
  }
}

class _TopBarIcon extends StatelessWidget {
  const _TopBarIcon({required this.icon});

  final IconData icon;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 6),
    child: Icon(icon),
  );
}

/// Bell with an unread dot from [unreadNotificationCountProvider].
class _NotificationsBell extends ConsumerWidget {
  const _NotificationsBell({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hasUnread = ref.watch(unreadNotificationCountProvider) > 0;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            const Icon(Icons.notifications_none_rounded),
            if (hasUnread)
              Positioned(
                right: -1,
                top: -1,
                child: Container(
                  width: 12,
                  height: 12,
                  decoration: BoxDecoration(
                    color: AppColors.badge,
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.bg, width: 2),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
