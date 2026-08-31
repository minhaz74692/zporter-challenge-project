import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../application/challenge_filter_provider.dart';
import '../domain/challenge_filter.dart';

/// Quick sort picker behind the ⇅ icon in the filter bar — the four
/// [ChallengeSort] options, tap to apply and close. The full filter sheet
/// carries the same "Sort by" field.
Future<void> showChallengeSortSheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (_) => const _SortSheet(),
  );
}

class _SortSheet extends ConsumerWidget {
  const _SortSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final current = ref.watch(challengeFilterProvider.select((f) => f.sort));
    final notifier = ref.read(challengeFilterProvider.notifier);

    return SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Padding(
            padding: EdgeInsets.fromLTRB(20, 18, 20, 8),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Text(
                'Sort by',
                style: TextStyle(
                  color: AppColors.fg,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          for (final sort in ChallengeSort.values)
            ListTile(
              title: Text(
                sort.label,
                style: const TextStyle(color: AppColors.fg),
              ),
              trailing: sort == current
                  ? const Icon(Icons.check_rounded, color: AppColors.accent)
                  : null,
              onTap: () {
                notifier.update(
                  ref.read(challengeFilterProvider).copyWith(sort: sort),
                );
                Navigator.of(context).pop();
              },
            ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}
