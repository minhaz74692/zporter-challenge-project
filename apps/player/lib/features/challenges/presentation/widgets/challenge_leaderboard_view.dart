import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/util/formatters.dart';
import '../../../../core/widgets/async_view.dart';
import '../../../../core/widgets/filter_sort_bar.dart';
import '../../../../core/widgets/gradient_panel.dart';
import '../../../auth/application/auth_notifier.dart';
import '../../application/challenge_detail_provider.dart';
import '../../domain/leaderboard_entry.dart';

/// The "Leaderboard" tab: a podium for the top three, a "last updated" line,
/// then a Nr / Name / Club / Result table with the viewer's own row picked out
/// in green. Built to the Figma "Challenge - Leaderboard" frame.
class ChallengeLeaderboardView extends ConsumerWidget {
  const ChallengeLeaderboardView(this.challengeId, {super.key});

  final String challengeId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final value = ref.watch(challengeLeaderboardProvider(challengeId));
    final meId = ref.watch(authNotifierProvider).valueOrNull?.id;

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
                          fontSize: 12,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    _Podium(entries: sorted.take(3).toList()),
                    const SizedBox(height: 20),
                    const _TableHeader(),
                    const Divider(color: AppColors.border, height: 12),
                    for (final e in sorted)
                      _TableRow(entry: e, isMe: e.userId == meId),
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
      crossAxisAlignment: CrossAxisAlignment.end,
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

  @override
  Widget build(BuildContext context) {
    final e = entry;
    if (e == null) return const SizedBox.shrink();
    final size = rank == 1 ? 74.0 : 60.0;

    return Column(
      children: [
        Container(
          width: 24,
          height: 24,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: _badgeColor,
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(
            '$rank',
            style: const TextStyle(
              color: AppColors.bg,
              fontWeight: FontWeight.w800,
              fontSize: 13,
            ),
          ),
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: e.avatarUrl != null
              ? Image.network(
                  e.avatarUrl!,
                  width: size,
                  height: size,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => _avatarFallback(size),
                )
              : _avatarFallback(size),
        ),
        const SizedBox(height: 6),
        Text(
          e.handle,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            color: AppColors.fg,
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
        ),
        if (e.club != null)
          Text(
            e.club!,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(color: AppColors.muted, fontSize: 11),
          ),
      ],
    );
  }

  Widget _avatarFallback(double size) => Container(
    width: size,
    height: size,
    color: AppColors.surfaceOverlay,
    child: const Icon(Icons.person_rounded, color: AppColors.faint),
  );
}

const _nrWidth = 36.0;
const _resultWidth = 56.0;

class _TableHeader extends StatelessWidget {
  const _TableHeader();

  @override
  Widget build(BuildContext context) {
    const style = TextStyle(color: AppColors.muted, fontSize: 12);
    return const Row(
      children: [
        SizedBox(
          width: _nrWidth,
          child: Text('Nr', style: style),
        ),
        Expanded(flex: 3, child: Text('Name', style: style)),
        Expanded(flex: 2, child: Text('Club', style: style)),
        SizedBox(
          width: _resultWidth,
          child: Text('Result', style: style, textAlign: TextAlign.right),
        ),
        SizedBox(width: 20),
      ],
    );
  }
}

class _TableRow extends StatelessWidget {
  const _TableRow({required this.entry, required this.isMe});

  final LeaderboardEntry entry;
  final bool isMe;

  @override
  Widget build(BuildContext context) {
    final color = isMe ? AppColors.success : AppColors.fg;
    final weight = isMe ? FontWeight.w700 : FontWeight.w500;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 11),
      child: Row(
        children: [
          SizedBox(
            width: _nrWidth,
            child: Text(
              '${entry.rank}',
              style: TextStyle(color: color, fontSize: 15, fontWeight: weight),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              entry.displayName,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(color: color, fontSize: 14, fontWeight: weight),
            ),
          ),
          Expanded(
            flex: 2,
            child: Text(
              entry.club ?? '',
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: isMe ? AppColors.success : AppColors.muted,
                fontSize: 13,
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
              style: TextStyle(color: color, fontSize: 15, fontWeight: weight),
            ),
          ),
          Icon(
            Icons.chevron_right_rounded,
            size: 20,
            color: isMe ? AppColors.success : AppColors.muted,
          ),
        ],
      ),
    );
  }
}
