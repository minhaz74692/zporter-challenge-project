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
                  // Extra top inset so the first row's floating rank number
                  // isn't clipped; the separator gives the rest their headroom.
                  padding: const EdgeInsets.fromLTRB(16, 22, 12, 24),
                  itemCount: rows.length,
                  separatorBuilder: (_, __) =>
                      const Divider(color: AppColors.borderSoft, height: 28),
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

/// One participant row, built to the Figma spec:
///
/// ```
/// 173  ┌────┐  Neo Jönsson                              ✓        ›
///      │ 📷●│  #NeoJon070119                RW
///      └────┘  SE/Stockholm      Hammarby IF
/// ```
///
/// - `173` — purple rank number floating above the avatar's top-left
/// - 52px rounded avatar with a green presence dot inset bottom-right
/// - three tight lines: white name (16), grey handle + grey position (11),
///   white `country/city` + white club (11); position and club right-align to
///   the same edge
/// - green accept-state check (18) then a grey chevron pinned right
class _ParticipantRow extends StatelessWidget {
  const _ParticipantRow(this.p, {required this.index});

  final Participant p;
  final int index;

  static const _grey = AppColors.tabInactive; // Figma #818389
  static const _greyStyle = TextStyle(
    color: _grey,
    fontSize: 11,
    fontWeight: FontWeight.w400,
    height: 16 / 11,
  );
  static const _whiteStyle = TextStyle(
    color: AppColors.fgStrong,
    fontSize: 11,
    fontWeight: FontWeight.w400,
    height: 16 / 11,
  );

  String? get _location {
    final parts = [p.country, p.city].where((s) => s != null && s.isNotEmpty);
    return parts.isEmpty ? null : parts.join('/');
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _RankedAvatar(p: p, index: index),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                p.displayName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.fgStrong,
                  fontSize: 16,
                  fontWeight: FontWeight.w400,
                  height: 22 / 16,
                ),
              ),
              const SizedBox(height: 3),
              _MetaRow(left: p.handle, right: p.position, style: _greyStyle),
              const SizedBox(height: 2),
              _MetaRow(left: _location, right: p.club, style: _whiteStyle),
            ],
          ),
        ),
        const SizedBox(width: 12),
        _StateBox(p.inviteState),
        // The Figma gap between the check and the chevron.
        const SizedBox(width: 44),
        const Icon(
          Icons.chevron_right_rounded,
          color: _grey,
          size: 20,
        ),
      ],
    );
  }
}

class _RankedAvatar extends StatelessWidget {
  const _RankedAvatar({required this.p, required this.index});

  final Participant p;
  final int index;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 52,
      height: 52,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: p.avatarUrl != null
                ? Image.network(
                    p.avatarUrl!,
                    width: 52,
                    height: 52,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const _AvatarFallback(),
                  )
                : const _AvatarFallback(),
          ),
          // Purple rank, floating just above the avatar's top-left corner.
          Positioned(
            left: -11,
            top: -14,
            child: Text(
              '$index',
              style: const TextStyle(
                color: AppColors.indexLavender,
                fontSize: 16,
                fontWeight: FontWeight.w400,
                height: 22 / 16,
              ),
            ),
          ),
          // Presence dot, inset at the bottom-right, ringed in the page colour
          // so it reads on any photo.
          Positioned(
            right: 3,
            bottom: 2,
            child: Container(
              width: 12,
              height: 12,
              decoration: BoxDecoration(
                color: AppColors.completed, // Figma #09E099
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.bg, width: 2),
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
    width: 52,
    height: 52,
    color: AppColors.surfaceOverlay,
    child: const Icon(Icons.person_rounded, color: AppColors.faint),
  );
}

/// A meta line: `left` fills and ellipsises, `right` (position / club) hugs the
/// right edge so both lines' right items align. If `left` is empty, `right`
/// takes the left slot instead.
class _MetaRow extends StatelessWidget {
  const _MetaRow({required this.left, required this.right, required this.style});

  final String? left;
  final String? right;
  final TextStyle style;

  @override
  Widget build(BuildContext context) {
    final hasLeft = left != null && left!.isNotEmpty;
    final hasRight = right != null && right!.isNotEmpty;
    if (!hasLeft && !hasRight) return const SizedBox.shrink();

    final leadingText = hasLeft ? left! : right!;
    final trailingText = hasLeft && hasRight ? right : null;

    return Row(
      children: [
        Expanded(
          child: Text(
            leadingText,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: style,
          ),
        ),
        if (trailingText != null) ...[
          const SizedBox(width: 10),
          Text(trailingText, style: style),
        ],
      ],
    );
  }
}

/// Accept-state check (Figma "Selection Control / Checkbox / On"): green ✓
/// accepted · red ✓ declined · empty outline pending.
class _StateBox extends StatelessWidget {
  const _StateBox(this.state);

  final InviteState state;

  @override
  Widget build(BuildContext context) {
    final (fill, border, showCheck) = switch (state) {
      InviteState.accepted => (AppColors.completed, AppColors.completed, true),
      InviteState.declined => (AppColors.danger, AppColors.danger, true),
      InviteState.invited => (Colors.transparent, AppColors.tabInactive, false),
    };
    return Container(
      width: 18,
      height: 18,
      decoration: BoxDecoration(
        color: fill,
        borderRadius: BorderRadius.circular(3),
        border: Border.all(color: border, width: 1.5),
      ),
      child: showCheck
          ? const Icon(Icons.check_rounded, size: 13, color: Colors.white)
          : null,
    );
  }
}
