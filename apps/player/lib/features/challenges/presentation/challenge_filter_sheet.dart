import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/labeled_dropdown.dart';
import '../application/challenge_filter_provider.dart';
import '../domain/challenge_enums.dart';
import '../domain/challenge_filter.dart';

/// Opens the Figma "Filter Challenges" sheet — a bordered panel over a dimmed
/// challenge list. Selections apply live to [challengeFilterProvider]; closing
/// just dismisses.
Future<void> showChallengeFilterSheet(BuildContext context) {
  return showModalBottomSheet<void>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    barrierColor: Colors.black.withValues(alpha: 0.62),
    builder: (_) => const ChallengeFilterSheet(),
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
    final topInset = MediaQuery.of(context).padding.top;

    return Padding(
      padding: EdgeInsets.only(top: topInset + 56, left: 12, right: 12, bottom: 12),
      child: Container(
        decoration: BoxDecoration(
          color: AppColors.bg,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.border),
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
                      filter.copyWith(location: l, clearLocation: l == null),
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
          const Icon(Icons.sort_rounded, color: AppColors.fg, size: 22),
          Expanded(
            child: Center(
              child: Text(
                'Filter Challenges',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
          Material(
            color: AppColors.surfaceOverlay,
            shape: const CircleBorder(),
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: onClose,
              child: const Padding(
                padding: EdgeInsets.all(8),
                child: Icon(Icons.close_rounded, color: AppColors.fg, size: 20),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
