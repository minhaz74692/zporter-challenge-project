import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import 'app_icon.dart';

/// The thin row under the tabs / above a list: a green summary of the active
/// sort + filters on the left, a sort (⇅) and a filter (☰) trigger on the
/// right. Presentational — callers wire the taps and supply the summary.
///
/// Figma: 16px side margins, 11px top, `#09E099` 14/400 summary, white icons.
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
      // 11px above (Figma), a tighter 6px below so the first card sits close.
      padding: const EdgeInsets.fromLTRB(16, 11, 16, 6),
      child: Row(
        children: [
          Expanded(
            child: Text(
              summary,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(
                color: AppColors.completed,
                fontSize: 14,
                fontWeight: FontWeight.w400,
                height: 17 / 14,
              ),
            ),
          ),
          _BarIcon(asset: AppIconAsset.order, tooltip: 'Sort', onTap: onSort),
          const SizedBox(width: 16),
          _BarIcon(
            asset: AppIconAsset.sort,
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
    required this.asset,
    required this.tooltip,
    required this.onTap,
  });

  final AppIconAsset asset;
  final String tooltip;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 3),
          child: AppIcon(asset, size: 18, color: AppColors.fgStrong),
        ),
      ),
    );
  }
}
