import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/section_tab_bar.dart';
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
          title: const Text('Challenges'),
          actions: [
            const _TopBarIcon(icon: Icons.chat_bubble_outline_rounded),
            _NotificationsBell(
              onTap: () => context.push(AppRoutes.notifications),
            ),
            const _TopBarIcon(icon: Icons.search_rounded),
            // Trails the last icon to a 16px inset from the screen edge.
            const SizedBox(width: 10),
          ],
          bottom: SectionTabBar(
            labels: [for (final c in _tabs) c.label],
          ),
        ),
        body: Column(
          children: [
            // The "Done" tab has no filter / sort controls.
            Builder(
              builder: (context) {
                final controller = DefaultTabController.of(context);
                return ListenableBuilder(
                  listenable: controller,
                  builder: (context, _) =>
                      _tabs[controller.index] == ChallengeCategory.done
                      ? const SizedBox.shrink()
                      : const ChallengeFilterBar(),
                );
              },
            ),
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
    padding: const EdgeInsets.symmetric(horizontal: 6),
    // Colour + 24px size come from AppBarTheme.actionsIconTheme.
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
            // Colour + 24px size come from AppBarTheme.actionsIconTheme.
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
