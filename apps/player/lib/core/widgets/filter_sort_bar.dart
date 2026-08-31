import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// The thin row under the tabs / above a list: a green summary of the active
/// sort + filters on the left, a sort (⇅) and a filter (☰) trigger on the
/// right. Presentational — callers wire the taps and supply the summary.
class FilterSortBar extends StatelessWidget {
  const FilterSortBar({
    required this.summary,
    required this.onSort,
    required this.onFilter,
    super.key,
  });

  final String summary;
  final VoidCallback onSort;
  final VoidCallback onFilter;

  @override
  Widget build(BuildContext context) {
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
            onTap: onSort,
          ),
          _BarIcon(
            icon: Icons.filter_list_rounded,
            tooltip: 'Filter',
            onTap: onFilter,
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
