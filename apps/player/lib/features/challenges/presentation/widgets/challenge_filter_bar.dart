import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/widgets/filter_sort_bar.dart';
import '../../application/challenge_filter_provider.dart';
import '../challenge_filter_sheet.dart';
import '../challenge_sort_sheet.dart';

/// The [FilterSortBar] for the challenge list — bound to the shared
/// [challengeFilterProvider] and its two sheets.
class ChallengeFilterBar extends ConsumerWidget {
  const ChallengeFilterBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = ref
        .watch(challengeFilterProvider.select((f) => f.summaryParts))
        .join(', ');

    return FilterSortBar(
      summary: summary,
      onSort: () => showChallengeSortSheet(context),
      onFilter: () => showChallengeFilterSheet(context),
    );
  }
}
