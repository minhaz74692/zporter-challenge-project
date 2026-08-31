import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/async_view.dart';
import '../../../../core/widgets/filter_sort_bar.dart';
import '../../../../core/widgets/gradient_panel.dart';
import '../../application/challenge_detail_provider.dart';
import '../../domain/challenge_enums.dart';
import '../../domain/participant.dart';

/// The "Participants" tab — everyone invited to the challenge with their
/// accept state, built to the Figma row layout.
class ChallengeParticipantsView extends ConsumerStatefulWidget {
  const ChallengeParticipantsView(this.challengeId, {super.key});

  final String challengeId;

  @override
  ConsumerState<ChallengeParticipantsView> createState() =>
      _ChallengeParticipantsViewState();
}

enum _Sort {
  position('Position'),
  name('Name'),
  club('Club');

  const _Sort(this.label);
  final String label;
}

class _ChallengeParticipantsViewState
    extends ConsumerState<ChallengeParticipantsView> {
  _Sort _sort = _Sort.position;
  bool _ascending = true;

  List<Participant> _sorted(List<Participant> input) {
    final list = [...input];
    int cmp(Participant a, Participant b) => switch (_sort) {
      _Sort.name => a.displayName.compareTo(b.displayName),
      _Sort.club => (a.club ?? '').compareTo(b.club ?? ''),
      _Sort.position => (a.position ?? '').compareTo(b.position ?? ''),
    };
    list.sort((a, b) => _ascending ? cmp(a, b) : -cmp(a, b));
    return list;
  }

  Future<void> _pickSort() async {
    final picked = await showModalBottomSheet<_Sort>(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            for (final s in _Sort.values)
              ListTile(
                title: Text(
                  s.label,
                  style: const TextStyle(color: AppColors.fg),
                ),
                trailing: s == _sort
                    ? const Icon(Icons.check_rounded, color: AppColors.accent)
                    : null,
                onTap: () => Navigator.pop(context, s),
              ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
    if (picked != null) setState(() => _sort = picked);
  }

  @override
  Widget build(BuildContext context) {
    final value = ref.watch(challengeParticipantsProvider(widget.challengeId));

    return GradientPanel(
      child: Column(
        children: [
          FilterSortBar(
            summary: '${_sort.label}${_ascending ? ' ↑' : ' ↓'}',
            onSort: () => setState(() => _ascending = !_ascending),
            onFilter: _pickSort,
          ),
          Expanded(
            child: AsyncView<List<Participant>>(
              value: value,
              onRetry: () => ref.invalidate(
                challengeParticipantsProvider(widget.challengeId),
              ),
              emptyMessage: 'No one has been invited yet.',
              data: (people) {
                final rows = _sorted(people);
                return ListView.separated(
                  padding: const EdgeInsets.fromLTRB(16, 4, 12, 24),
                  itemCount: rows.length,
                  separatorBuilder: (_, __) =>
                      const Divider(color: AppColors.borderSoft, height: 22),
                  itemBuilder: (_, i) => _ParticipantRow(rows[i], index: i + 1),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

class _ParticipantRow extends StatelessWidget {
  const _ParticipantRow(this.p, {required this.index});

  final Participant p;
  final int index;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _Avatar(p: p, index: index),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                p.displayName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.fg,
                  fontSize: 17,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 2),
              _MetaLine(left: p.handle, right: p.position),
              _MetaLine(left: p.club, right: null),
            ],
          ),
        ),
        const SizedBox(width: 8),
        _StateBox(p.inviteState),
        const SizedBox(width: 6),
        const Icon(
          Icons.chevron_right_rounded,
          color: AppColors.muted,
          size: 22,
        ),
      ],
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({required this.p, required this.index});

  final Participant p;
  final int index;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 56,
      height: 56,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: p.avatarUrl != null
                ? Image.network(
                    p.avatarUrl!,
                    width: 56,
                    height: 56,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const _AvatarFallback(),
                  )
                : const _AvatarFallback(),
          ),
          // Lavender row index, top-left.
          Positioned(
            left: -2,
            top: -6,
            child: Text(
              '$index',
              style: const TextStyle(
                color: AppColors.indexLavender,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          // Presence dot, bottom-right.
          Positioned(
            right: -1,
            bottom: -1,
            child: Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                color: AppColors.success,
                shape: BoxShape.circle,
                // 2px ring in the page colour (black) to separate it from the avatar.
                border: Border.all(width: 2),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _AvatarFallback extends StatelessWidget {
  const _AvatarFallback();

  @override
  Widget build(BuildContext context) => Container(
    width: 56,
    height: 56,
    color: AppColors.surfaceOverlay,
    child: const Icon(Icons.person_rounded, color: AppColors.faint),
  );
}

class _MetaLine extends StatelessWidget {
  const _MetaLine({required this.left, required this.right});

  final String? left;
  final String? right;

  @override
  Widget build(BuildContext context) {
    if ((left == null || left!.isEmpty) && (right == null || right!.isEmpty)) {
      return const SizedBox.shrink();
    }
    const style = TextStyle(color: AppColors.muted, fontSize: 12);
    return Padding(
      padding: const EdgeInsets.only(top: 2),
      child: Row(
        children: [
          Expanded(
            child: Text(
              left ?? '',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: style,
            ),
          ),
          if (right != null && right!.isNotEmpty) Text(right!, style: style),
        ],
      ),
    );
  }
}

/// Accept-state checkbox: green ✓ accepted · red ✓ declined · empty pending.
class _StateBox extends StatelessWidget {
  const _StateBox(this.state);

  final InviteState state;

  @override
  Widget build(BuildContext context) {
    final (fill, border, showCheck) = switch (state) {
      InviteState.accepted => (AppColors.success, AppColors.success, true),
      InviteState.declined => (AppColors.danger, AppColors.danger, true),
      InviteState.invited => (Colors.transparent, AppColors.muted, false),
    };
    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        color: fill,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: border, width: 1.5),
      ),
      child: showCheck
          ? const Icon(Icons.check_rounded, size: 16, color: Colors.white)
          : null,
    );
  }
}
