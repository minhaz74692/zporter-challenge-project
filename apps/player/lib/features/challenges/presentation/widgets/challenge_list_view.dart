import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/app_routes.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/async_view.dart';
import '../../application/challenge_filter_provider.dart';
import '../../application/challenge_list_provider.dart';
import '../../domain/challenge.dart';
import '../../domain/challenge_enums.dart';
import 'challenge_card.dart';
import 'challenge_card_skeleton.dart';
import 'challenge_cover_header.dart';

/// One list tab. Watches its own [challengeListProvider] family instance, so
/// the five tabs load and refresh independently, then applies the shared
/// [challengeFilterProvider] client-side.
class ChallengeListView extends ConsumerWidget {
  const ChallengeListView({required this.category, super.key});

  final ChallengeCategory category;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final value = ref.watch(challengeListProvider(category));
    final filter = ref.watch(challengeFilterProvider);

    return RefreshIndicator(
      onRefresh: () => ref.refresh(challengeListProvider(category).future),
      child: AsyncView<List<Challenge>>(
        value: value,
        loading: const ChallengeListSkeleton(),
        onRetry: () => ref.invalidate(challengeListProvider(category)),
        emptyMessage: 'No ${category.label.toLowerCase()} challenges.',
        data: (challenges) {
          final shown = filter.apply(challenges);
          if (shown.isEmpty) {
            return const _NoMatches();
          }
          return ListView.builder(
            physics: const AlwaysScrollableScrollPhysics(),
            // No horizontal padding — the cards (and their cover photos) are
            // full-bleed; each card pads its own body content. No top inset
            // either: the filter/sort bar already sets the gap to the first card.
            padding: const EdgeInsets.only(bottom: 24),
            itemCount: shown.length,
            itemBuilder: (context, i) {
              final challenge = shown[i];
              return ChallengeCard(
                challenge: challenge,
                coverStatus: switch (category) {
                  ChallengeCategory.done => CoverStatus.completed,
                  ChallengeCategory.declined => CoverStatus.declined,
                  _ => CoverStatus.none,
                },
                onOpen: () =>
                    context.push(AppRoutes.challengeDetail(challenge.id)),
              );
            },
          );
        },
      ),
    );
  }
}

/// Shown when the tab has challenges but the active filter excludes them all.
class _NoMatches extends ConsumerWidget {
  const _NoMatches();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListView(
      // Scrollable so pull-to-refresh still works.
      physics: const AlwaysScrollableScrollPhysics(),
      children: [
        Padding(
          padding: const EdgeInsets.only(top: 96),
          child: Column(
            children: [
              const Icon(Icons.filter_alt_off_rounded,
                  size: 40, color: AppColors.faint),
              const SizedBox(height: AppSpacing.md),
              const Text(
                'No challenges match your filters.',
                style: TextStyle(color: AppColors.muted),
              ),
              const SizedBox(height: AppSpacing.lg),
              OutlinedButton(
                onPressed: () =>
                    ref.read(challengeFilterProvider.notifier).reset(),
                child: const Text('Clear filters'),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
