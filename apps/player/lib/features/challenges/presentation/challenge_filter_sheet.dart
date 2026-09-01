import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/app_icon.dart';
import '../../../core/widgets/labeled_dropdown.dart';
import '../application/challenge_filter_provider.dart';
import '../domain/challenge_enums.dart';
import '../domain/challenge_filter.dart';

/// Opens the Figma "Filter Challenges" sheet — a bordered panel pinned just
/// below the app bar over a dimmed challenge list. It fades in (the Figma has no
/// slide), selections apply live to [challengeFilterProvider], and closing or
/// tapping the dimmed area just dismisses.
Future<void> showChallengeFilterSheet(BuildContext context) {
  return showGeneralDialog<void>(
    context: context,
    barrierDismissible: true,
    barrierLabel: MaterialLocalizations.of(context).modalBarrierDismissLabel,
    barrierColor: Colors.black.withValues(alpha: 0.62),
    transitionDuration: const Duration(milliseconds: 180),
    pageBuilder: (_, _, _) => const ChallengeFilterSheet(),
    transitionBuilder: (_, animation, _, child) => FadeTransition(
      opacity: CurvedAnimation(parent: animation, curve: Curves.easeOut),
      child: child,
    ),
  );
}

// Options for the two fields a challenge carries no data for — shown for
// parity with the Figma, inert until the model/API grows to support them.
const _countries = ['All', 'Sweden', 'Norway', 'Denmark', 'Finland'];
const _userScopes = ['All', 'My coach', 'Admins'];

class ChallengeFilterSheet extends ConsumerWidget {
  const ChallengeFilterSheet({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final filter = ref.watch(challengeFilterProvider);
    final notifier = ref.read(challengeFilterProvider.notifier);
    final media = MediaQuery.of(context);

    // Panel top: status bar + a standard 56px app bar. It grows with its
    // content and only scrolls once it would reach the bottom inset.
    const appBarHeight = 56.0;
    final topOffset = media.padding.top + appBarHeight;
    final maxHeight = media.size.height - topOffset - media.padding.bottom - 12;

    return Material(
      type: MaterialType.transparency,
      child: Padding(
        padding: EdgeInsets.only(top: topOffset, left: 8, right: 8),
        child: Align(
          alignment: Alignment.topCenter,
          child: ConstrainedBox(
            constraints: BoxConstraints(maxHeight: maxHeight),
            child: Container(
              decoration: BoxDecoration(
                color: AppColors.cardTop,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.outline),
                boxShadow: const [
                  BoxShadow(
                    color: Color(0x33000000), // black @ 20%
                    offset: Offset(0, 1),
                    blurRadius: 3,
                  ),
                ],
              ),
              clipBehavior: Clip.antiAlias,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  _Header(onClose: () => Navigator.of(context).pop()),
                  Flexible(
                    child: ListView(
                      shrinkWrap: true,
                      padding: const EdgeInsets.fromLTRB(20, 4, 20, 24),
                      children: [
                        LabeledDropdown<ChallengeSort>(
                          label: 'Sort by',
                          value: filter.sort,
                          items: ChallengeSort.values,
                          itemLabel: (s) => s.label,
                          onChanged: (s) =>
                              notifier.update(filter.copyWith(sort: s)),
                        ),
                        const SizedBox(height: 16),
                        LabeledDropdown<String>(
                          label: 'Country',
                          value: filter.country,
                          items: _countries,
                          itemLabel: (c) => c,
                          onChanged: (c) =>
                              notifier.update(filter.copyWith(country: c)),
                        ),
                        const SizedBox(height: 16),
                        LabeledDropdown<ChallengeLocation?>(
                          label: 'Location',
                          value: filter.location,
                          items: const [null, ...ChallengeLocation.values],
                          itemLabel: (l) => l?.label ?? 'All',
                          onChanged: (l) => notifier.update(
                            filter.copyWith(
                              location: l,
                              clearLocation: l == null,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        LabeledDropdown<String>(
                          label: 'Users',
                          value: filter.users,
                          items: _userScopes,
                          itemLabel: (u) => u,
                          onChanged: (u) =>
                              notifier.update(filter.copyWith(users: u)),
                        ),
                        const SizedBox(height: 16),
                        LabeledDropdown<AgeGroup>(
                          label: 'Age group',
                          value: filter.ageGroup,
                          items: AgeGroup.values,
                          itemLabel: (a) => a.label,
                          onChanged: (a) =>
                              notifier.update(filter.copyWith(ageGroup: a)),
                        ),
                        const SizedBox(height: 16),
                        LabeledDropdown<ChallengeRole>(
                          label: 'Role',
                          value: filter.role,
                          items: ChallengeRole.values,
                          itemLabel: (r) => r.label,
                          onChanged: (r) =>
                              notifier.update(filter.copyWith(role: r)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.onClose});

  final VoidCallback onClose;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 18, 12, 10),
      child: Row(
        children: [
          const AppIcon(AppIconAsset.sort, size: 24, color: AppColors.fgStrong),
          Expanded(
            child: Center(
              child: Text(
                'Filter Challenges',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontSize: 16,
                  fontWeight: FontWeight.w400,
                  color: AppColors.fgStrong,
                ),
              ),
            ),
          ),
          Material(
            color: AppColors.discFill,
            shape: const CircleBorder(),
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: onClose,
              child: const SizedBox.square(
                dimension: 48,
                child: Icon(Icons.close_rounded, color: AppColors.fg, size: 24),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
