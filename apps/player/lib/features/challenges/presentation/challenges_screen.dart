import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../domain/challenge_enums.dart';
import 'widgets/app_drawer.dart';
import 'widgets/challenge_list_view.dart';

/// The challenge list: a top bar and the five category tabs
/// (New / Active / Done / Declined / Ended), each an independent
/// [ChallengeListView].
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
          actions: const [
            _TopBarIcon(icon: Icons.chat_bubble_outline_rounded),
            _TopBarIcon(icon: Icons.notifications_none_rounded, dot: true),
            _TopBarIcon(icon: Icons.search_rounded),
            SizedBox(width: 8),
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
        body: TabBarView(
          children: [for (final c in _tabs) ChallengeListView(category: c)],
        ),
      ),
    );
  }
}

class _TopBarIcon extends StatelessWidget {
  const _TopBarIcon({required this.icon, this.dot = false});

  final IconData icon;
  final bool dot;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 4),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Icon(icon, color: AppColors.fg, size: 22),
          if (dot)
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
    );
  }
}
