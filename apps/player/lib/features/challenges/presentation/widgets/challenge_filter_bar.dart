import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../application/challenge_filter_provider.dart';
import '../challenge_filter_sheet.dart';
import '../challenge_sort_sheet.dart';

/// The row that sits between the tabs and the list: a green summary of the
/// active sort + filters on the left, the sort (⇅) and filter (☰) triggers on
/// the right.
class ChallengeFilterBar extends ConsumerWidget {
  const ChallengeFilterBar({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = ref
        .watch(challengeFilterProvider.select((f) => f.summaryParts))
        .join(', ');

    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 12, 6, 12),
      child: Row(
        children: [
          Expanded(
            child: Text(
              summary,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: AppColors.success,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          _BarIcon(
            icon: Icons.swap_vert_rounded,
            tooltip: 'Sort',
            onTap: () => showChallengeSortSheet(context),
          ),
          _BarIcon(
            icon: Icons.filter_list_rounded,
            tooltip: 'Filter',
            onTap: () => showChallengeFilterSheet(context),
          ),
        ],
      ),
    );
  }
}

class _BarIcon extends StatelessWidget {
  const _BarIcon({
    required this.icon,
    required this.tooltip,
    required this.onTap,
  });

  final IconData icon;
  final String tooltip;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return IconButton(
      onPressed: onTap,
      tooltip: tooltip,
      visualDensity: VisualDensity.compact,
      icon: Icon(icon, color: AppColors.fg, size: 22),
    );
  }
}
