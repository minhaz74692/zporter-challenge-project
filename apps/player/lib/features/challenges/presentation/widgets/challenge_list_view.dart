import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/app_routes.dart';
import '../../../../core/widgets/async_view.dart';
import '../../application/challenge_list_provider.dart';
import '../../domain/challenge.dart';
import '../../domain/challenge_enums.dart';
import 'challenge_card.dart';
import 'challenge_card_skeleton.dart';

/// One list tab. Watches its own [challengeListProvider] family instance, so
/// the five tabs load and refresh independently.
class ChallengeListView extends ConsumerWidget {
  const ChallengeListView({required this.category, super.key});

  final ChallengeCategory category;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final value = ref.watch(challengeListProvider(category));

    return RefreshIndicator(
      onRefresh: () => ref.refresh(challengeListProvider(category).future),
      child: AsyncView<List<Challenge>>(
        value: value,
        loading: const ChallengeListSkeleton(),
        onRetry: () => ref.invalidate(challengeListProvider(category)),
        emptyMessage: 'No ${category.label.toLowerCase()} challenges.',
        data: (challenges) => ListView.builder(
          physics: const AlwaysScrollableScrollPhysics(),
          // No horizontal padding — the cards (and their cover photos) are
          // full-bleed; each card pads its own body content.
          padding: const EdgeInsets.only(top: 8, bottom: 24),
          itemCount: challenges.length,
          itemBuilder: (context, i) {
            final challenge = challenges[i];
            return ChallengeCard(
              challenge: challenge,
              showCheck: category == ChallengeCategory.done,
              onOpen: () => context.push(AppRoutes.challengeDetail(challenge.id)),
            );
          },
        ),
      ),
    );
  }
}
