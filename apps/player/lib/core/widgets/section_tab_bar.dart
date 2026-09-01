import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// The app's one category tab bar (Figma "Text Tab") — scrollable, left-aligned,
/// generous label spacing, and a flat orange underline that spans the whole tab
/// cell. Colours + label typography come from `AppTheme`'s `tabBarTheme`.
///
/// Used by the challenge list and the challenge detail screen so the two stay
/// identical.
class SectionTabBar extends StatelessWidget implements PreferredSizeWidget {
  const SectionTabBar({required this.labels, super.key});

  final List<String> labels;

  @override
  Size get preferredSize => const Size.fromHeight(48);

  @override
  Widget build(BuildContext context) {
    return TabBar(
      isScrollable: true,
      tabAlignment: TabAlignment.start,
      labelPadding: const EdgeInsets.symmetric(horizontal: 28),
      indicatorSize: TabBarIndicatorSize.tab,
      indicator: const UnderlineTabIndicator(
        borderSide: BorderSide(width: 3, color: AppColors.tabActive),
      ),
      tabs: [for (final label in labels) Tab(text: label)],
    );
  }
}
