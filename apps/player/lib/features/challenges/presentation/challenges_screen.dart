import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../notifications/application/notifications_provider.dart';
import '../domain/challenge_enums.dart';
import 'widgets/app_drawer.dart';
import 'widgets/challenge_filter_bar.dart';
import 'widgets/challenge_list_view.dart';

/// The challenge list: a top bar, the five category tabs (Done / Active / New /
/// Declined / Ended), a filter/sort bar, then each tab's [ChallengeListView].
class ChallengesScreen extends StatelessWidget {
  const ChallengesScreen({super.key});

  static const _tabs = ChallengeCategory.values;

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: _tabs.length,
      child: Scaffold(
        backgroundColor: AppColors.bg,
        drawer: const AppDrawer(),
        appBar: AppBar(
          backgroundColor: AppColors.bg,
          title: const Text('Challenges'),
          actions: [
            const _TopBarIcon(icon: Icons.chat_bubble_outline_rounded),
            _NotificationsBell(
              onTap: () => context.push(AppRoutes.notifications),
            ),
            const _TopBarIcon(icon: Icons.search_rounded),
            const SizedBox(width: 8),
          ],
          bottom: TabBar(
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            indicatorColor: AppColors.accent,
            indicatorSize: TabBarIndicatorSize.label,
            labelColor: AppColors.accent,
            unselectedLabelColor: AppColors.muted,
            labelStyle: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w600,
            ),
            tabs: [for (final c in _tabs) Tab(text: c.label)],
          ),
        ),
        body: Column(
          children: [
            const ChallengeFilterBar(),
            Expanded(
              child: TabBarView(
                children: [for (final c in _tabs) ChallengeListView(category: c)],
              ),
            ),
          ],
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
    padding: const EdgeInsets.symmetric(horizontal: 4),
    child: Icon(icon, color: AppColors.fg, size: 22),
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
        padding: const EdgeInsets.symmetric(horizontal: 4),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            const Icon(
              Icons.notifications_none_rounded,
              color: AppColors.fg,
              size: 22,
            ),
            if (hasUnread)
              Positioned(
                right: -1,
                top: -1,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: AppColors.primary,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
