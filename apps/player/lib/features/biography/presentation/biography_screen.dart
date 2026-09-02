import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/router/app_routes.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/async_view.dart';
import '../../../core/widgets/section_tab_bar.dart';
import '../../../core/widgets/shimmer.dart';
import '../../auth/application/auth_notifier.dart';
import '../../challenges/presentation/widgets/app_drawer.dart';
import '../../notifications/application/notifications_provider.dart';
import '../application/biography_results_provider.dart';
import '../domain/challenge_result.dart';
import 'widgets/bio_profile_card.dart';
import 'widgets/bio_result_card.dart';
import 'widgets/bio_social_row.dart';

/// The signed-in player's Biography (Figma "Biography – Challenges Tab"):
/// identity card + rating ring, the scouting blurb, the
/// `Challenges · Programs · Tests` tabs (only Challenges carries real data —
/// the player's reported results), then the social links.
class BiographyScreen extends ConsumerWidget {
  const BiographyScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authNotifierProvider).valueOrNull;

    return Scaffold(
      backgroundColor: AppColors.bg,
      drawer: const AppDrawer(),
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        title: const Text('Biography'),
        actions: [
          const _TopBarIcon(icon: Icons.chat_bubble_outline_rounded),
          _NotificationsBell(
            onTap: () => context.push(AppRoutes.notifications),
          ),
          const _TopBarIcon(icon: Icons.search_rounded),
          const SizedBox(width: 10),
        ],
      ),
      body: user == null
          ? const Center(child: CircularProgressIndicator())
          : DefaultTabController(
              length: 3,
              child: RefreshIndicator(
                onRefresh: () => ref.refresh(biographyResultsProvider.future),
                child: ListView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.only(bottom: 24),
                  children: [
                    // Full-bleed — no left/right margin (Figma).
                    Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: BioProfileCard(user: user),
                    ),
                    if ((user.bio ?? '').isNotEmpty)
                      Padding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
                        child: Text(
                          user.bio!,
                          style: const TextStyle(
                            color: AppColors.fg,
                            fontSize: 14,
                            height: 1.45,
                          ),
                        ),
                      ),
                    const SizedBox(height: 8),
                    const _TabsBar(),
                    const _TabBody(),
                    const SizedBox(height: 20),
                    BioSocialRow(socials: user.socials),
                  ],
                ),
              ),
            ),
    );
  }
}

/// The tab strip with the "+" action floated over its right edge (Figma).
class _TabsBar extends StatelessWidget {
  const _TabsBar();

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.centerRight,
      children: [
        const Align(
          alignment: Alignment.centerLeft,
          child: SectionTabBar(labels: ['Challenges', 'Programs', 'Tests']),
        ),
        Padding(
          padding: const EdgeInsets.only(right: 12),
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTap: () => ScaffoldMessenger.of(context)
              ..hideCurrentSnackBar()
              ..showSnackBar(
                const SnackBar(content: Text('Adding entries is out of scope')),
              ),
            child: Container(
              width: 40,
              height: 40,
              decoration: const BoxDecoration(
                color: AppColors.primary,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.add_rounded,
                  color: AppColors.onPrimary, size: 24),
            ),
          ),
        ),
      ],
    );
  }
}

/// Renders the body for whichever tab is selected. `Programs` / `Tests` are
/// concept stubs; `Challenges` shows the player's reported results.
class _TabBody extends StatelessWidget {
  const _TabBody();

  @override
  Widget build(BuildContext context) {
    final controller = DefaultTabController.of(context);
    return ListenableBuilder(
      listenable: controller,
      builder: (context, _) => switch (controller.index) {
        0 => const _ChallengesTab(),
        _ => const _EmptyTab(),
      },
    );
  }
}

class _ChallengesTab extends ConsumerWidget {
  const _ChallengesTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final value = ref.watch(biographyResultsProvider);
    return AsyncView<List<ChallengeResult>>(
      value: value,
      loading: const _ResultsSkeleton(),
      onRetry: () => ref.invalidate(biographyResultsProvider),
      emptyMessage: 'No reported results yet.\nComplete a challenge and it '
          'shows up here.',
      data: (entries) => Column(
        children: [for (final e in entries) BioResultCard(entry: e)],
      ),
    );
  }
}

class _EmptyTab extends StatelessWidget {
  const _EmptyTab();

  @override
  Widget build(BuildContext context) => const Padding(
    padding: EdgeInsets.symmetric(vertical: 48),
    child: Center(
      child: Text(
        'Nothing here yet.',
        style: TextStyle(color: AppColors.muted, fontSize: 13),
      ),
    ),
  );
}

class _ResultsSkeleton extends StatelessWidget {
  const _ResultsSkeleton();

  @override
  Widget build(BuildContext context) {
    return Shimmer(
      child: Column(
        children: [
          for (var i = 0; i < 2; i++)
            Container(
              margin: const EdgeInsets.fromLTRB(14, 14, 14, 0),
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.surfaceDim,
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SkeletonBox(width: 180, height: 14),
                  SizedBox(height: 8),
                  SkeletonBox(width: 120, height: 10),
                  SizedBox(height: 12),
                  AspectRatio(
                    aspectRatio: 16 / 10,
                    child: SkeletonBox(radius: 12),
                  ),
                ],
              ),
            ),
        ],
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
