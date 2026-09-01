import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/util/formatters.dart';
import '../../../../core/widgets/async_view.dart';
import '../../../../core/widgets/filter_sort_bar.dart';
import '../../../../core/widgets/gradient_panel.dart';
import '../../application/challenge_detail_provider.dart';
import '../../domain/leaderboard_entry.dart';

/// The "Leaderboard" tab: a staggered podium for the top three drawn over a
/// faint football-pitch marking (centre circle + halfway line), a "last updated"
/// line, then a Nr / Name / Club / Result table with the leading row picked out
/// in green. Built to the Figma "Challenge - Leaderboard" frame.
class ChallengeLeaderboardView extends ConsumerWidget {
  const ChallengeLeaderboardView(this.challengeId, {super.key});

  final String challengeId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final value = ref.watch(challengeLeaderboardProvider(challengeId));

    return GradientPanel(
      child: Column(
        children: [
          FilterSortBar(summary: 'Rank', onSort: () {}, onFilter: () {}),
          Expanded(
            child: AsyncView<List<LeaderboardEntry>>(
              value: value,
              onRetry: () =>
                  ref.invalidate(challengeLeaderboardProvider(challengeId)),
              emptyMessage: 'No results reported yet.',
              data: (entries) {
                final sorted = [...entries]
                  ..sort((a, b) => a.rank.compareTo(b.rank));
                final lastUpdated = sorted
                    .map((e) => e.updatedAt)
                    .reduce((a, b) => a.isAfter(b) ? a : b);

                return ListView(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
                  children: [
                    Center(
                      child: Text(
                        'Last updated: ${formatDmy(lastUpdated)}',
                        style: const TextStyle(
                          color: AppColors.muted,
                          fontSize: 13,
                        ),
                      ),
                    ),
                    const SizedBox(height: 28),
                    // Podium + table header, over the pitch markings. The
                    // painter box is stretched _pitchOverflow past the header so
                    // the lower half of the centre circle spills onto the rows.
                    Stack(
                      clipBehavior: Clip.none,
                      children: [
                        const Positioned(
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: -_pitchOverflow,
                          child: CustomPaint(painter: _PitchPainter()),
                        ),
                        Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            _Podium(entries: sorted.take(3).toList()),
                            const SizedBox(height: 40),
                            const _TableHeader(),
                          ],
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    for (final e in sorted)
                      _TableRow(entry: e, highlight: e.rank == 1),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

/// Distance from the table-header baseline down to the pitch centre.
const _pitchCentreDrop = 20.0;

/// Circle radius as a fraction of the list's content width.
const _pitchRadiusRatio = 0.25;

/// How far the pitch-marking canvas extends below the table-header baseline —
/// must clear the centre (dropped [_pitchCentreDrop]) plus the largest radius
/// we expect, so the circle is never clipped.
const _pitchOverflow = 150.0;

/// Faint centre circle + halfway line — the "football ground" effect behind the
/// podium. The line passes through the exact centre of the circle, both sitting
/// [_pitchCentreDrop] below the table-header baseline.
class _PitchPainter extends CustomPainter {
  const _PitchPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final headerBaseline = size.height - _pitchOverflow;
    final centre = Offset(size.width / 2, headerBaseline + _pitchCentreDrop);
    final radius = size.width * _pitchRadiusRatio;

    final line = Paint()
      ..color = AppColors.pillEquipment.withValues(alpha: 0.30)
      ..strokeWidth = 2;
    final ring = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2
      ..color = AppColors.pillEquipment.withValues(alpha: 0.26);

    // The line runs through the circle's centre, bled past the list padding so
    // it spans the whole panel.
    canvas.drawLine(
      Offset(-16, centre.dy),
      Offset(size.width + 16, centre.dy),
      line,
    );
    canvas.drawCircle(centre, radius, ring);
  }

  @override
  bool shouldRepaint(covariant _PitchPainter oldDelegate) => false;
}

class _Podium extends StatelessWidget {
  const _Podium({required this.entries});

  final List<LeaderboardEntry> entries;

  LeaderboardEntry? _byRank(int rank) {
    for (final e in entries) {
      if (e.rank == rank) return e;
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: _Spot(entry: _byRank(2), rank: 2)),
        Expanded(child: _Spot(entry: _byRank(1), rank: 1)),
        Expanded(child: _Spot(entry: _byRank(3), rank: 3)),
      ],
    );
  }
}

class _Spot extends StatelessWidget {
  const _Spot({required this.entry, required this.rank});

  final LeaderboardEntry? entry;
  final int rank;

  Color get _badgeColor => switch (rank) {
    1 => AppColors.medalGold,
    2 => AppColors.medalSilver,
    _ => AppColors.medalBronze,
  };

  /// The winner stands tallest; 2nd and 3rd step down.
  double get _drop => switch (rank) {
    1 => 0,
    2 => 20,
    _ => 40,
  };

  @override
  Widget build(BuildContext context) {
    final e = entry;
    if (e == null) return const SizedBox.shrink();
    final avatar = rank == 1 ? 72.0 : 58.0;

    return Padding(
      padding: EdgeInsets.only(top: _drop),
      child: Column(
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              _Avatar(url: e.avatarUrl, size: avatar),
              Positioned(
                top: -16,
                left: -12,
                child: Container(
                  width: 27,
                  height: 27,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: _badgeColor,
                    borderRadius: BorderRadius.circular(7),
                    border: Border.all(color: AppColors.bg),
                  ),
                  child: Text(
                    '$rank',
                    style: const TextStyle(
                      color: AppColors.bg,
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            e.handle,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: AppColors.fgStrong,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
          if (e.club != null)
            Text(
              e.club!,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
              style: const TextStyle(
                color: AppColors.pillEquipment,
                fontSize: 11,
              ),
            ),
        ],
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({required this.size, this.url});

  final double size;
  final String? url;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(8),
      child: url != null
          ? Image.network(
              url!,
              width: size,
              height: size,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => _fallback(),
            )
          : _fallback(),
    );
  }

  Widget _fallback() => Container(
    width: size,
    height: size,
    color: AppColors.surfaceOverlay,
    child: const Icon(Icons.person_rounded, color: AppColors.faint),
  );
}

const _nrWidth = 48.0;
const _resultWidth = 58.0;
const _chevronWidth = 20.0;
const _rowLine = Color(0x1F818389); // #818389 @ ~12%

class _TableHeader extends StatelessWidget {
  const _TableHeader();

  @override
  Widget build(BuildContext context) {
    const style = TextStyle(color: AppColors.pillEquipment, fontSize: 14);
    return const Row(
      children: [
        SizedBox(
          width: _nrWidth,
          child: Row(
            children: [
              Text('Nr', style: style),
              Icon(
                Icons.arrow_drop_up_rounded,
                size: 15,
                color: AppColors.pillEquipment,
              ),
            ],
          ),
        ),
        Expanded(flex: 3, child: Text('Name', style: style)),
        Expanded(flex: 2, child: Text('Club', style: style)),
        SizedBox(
          width: _resultWidth,
          child: Text('Result', style: style, textAlign: TextAlign.right),
        ),
        SizedBox(width: _chevronWidth),
      ],
    );
  }
}

class _TableRow extends StatelessWidget {
  const _TableRow({required this.entry, required this.highlight});

  final LeaderboardEntry entry;

  /// The leading (rank-1) row is drawn in green.
  final bool highlight;

  @override
  Widget build(BuildContext context) {
    final color = highlight ? AppColors.completed : AppColors.fgStrong;
    final weight = highlight ? FontWeight.w600 : FontWeight.w500;

    return DecoratedBox(
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: _rowLine)),
      ),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 13),
        child: Row(
          children: [
            SizedBox(
              width: _nrWidth,
              child: Text(
                '${entry.rank}',
                style: TextStyle(
                  color: color,
                  fontSize: 16,
                  fontWeight: weight,
                ),
              ),
            ),
            Expanded(
              flex: 3,
              child: Text(
                entry.displayName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: color,
                  fontSize: 15,
                  fontWeight: weight,
                ),
              ),
            ),
            Expanded(
              flex: 2,
              child: Text(
                entry.club ?? '',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: color,
                  fontSize: 15,
                  fontWeight: weight,
                ),
              ),
            ),
            SizedBox(
              width: _resultWidth,
              child: Text(
                formatScore(entry.value),
                textAlign: TextAlign.right,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: color,
                  fontSize: 16,
                  fontWeight: weight,
                ),
              ),
            ),
            SizedBox(
              width: _chevronWidth,
              child: Icon(
                Icons.chevron_right_rounded,
                size: 20,
                color: highlight
                    ? AppColors.completed
                    : AppColors.pillEquipment,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
