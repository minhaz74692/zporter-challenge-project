import 'package:flutter/material.dart' hide Badge;

import '../../../../core/theme/app_colors.dart';
import '../../../../core/util/formatters.dart';
import '../../domain/badge.dart';
import '../../domain/participant.dart';
import 'result_video_player.dart';

/// Read-only view of a reported result. Shared by the "Report" tab (the player
/// looking at their own submission) and the controller's verify sheet (someone
/// reviewing another player's submission).
class ResultSummaryCard extends StatelessWidget {
  const ResultSummaryCard({
    required this.result,
    this.rank,
    this.badge,
    this.submitterName,
    this.title = 'Result reported',
    super.key,
  });

  final SubmittedResult result;
  final int? rank;

  /// Recognition badge earned once the result is verified — shows a celebratory
  /// header + an "Earned …" chip when set.
  final Badge? badge;

  /// Whose result this is — shown only when reviewing someone else's.
  final String? submitterName;
  final String title;

  String get _value {
    final v = result.value;
    if (v is bool) return v ? 'Completed' : 'Not completed';
    return '$v ${result.unit.short}'.trim();
  }

  @override
  Widget build(BuildContext context) {
    final hasVideo = result.videoUrl.isNotEmpty;
    final heading = badge != null ? 'Challenge completed 🎉' : title;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(
              Icons.check_circle_rounded,
              color: AppColors.success,
              size: 22,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                heading,
                style: const TextStyle(
                  color: AppColors.fg,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            if (rank != null)
              Text(
                '#$rank',
                style: const TextStyle(
                  color: AppColors.success,
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
          ],
        ),
        if (badge != null) ...[
          const SizedBox(height: 10),
          _BadgeChip(badge: badge!),
        ],
        if (submitterName != null) ...[
          const SizedBox(height: 4),
          Text(
            'Submitted by $submitterName',
            style: const TextStyle(color: AppColors.muted, fontSize: 13),
          ),
        ],
        const SizedBox(height: 16),
        Text(
          _value,
          style: const TextStyle(
            color: AppColors.fg,
            fontSize: 30,
            fontWeight: FontWeight.w700,
          ),
        ),
        if (result.isReviewed) ...[
          const SizedBox(height: 10),
          _VerdictChip(approved: result.verified!, at: result.verifiedAt),
        ],
        const SizedBox(height: 20),
        _Line(label: 'Performed', value: formatDateAtTime(result.performedAt)),
        if (result.arena != null && result.arena!.isNotEmpty)
          _Line(label: 'Arena', value: result.arena!),
        _Line(label: 'Controller', value: result.controllerRef),
        if (result.note != null && result.note!.isNotEmpty)
          _Line(label: 'Note', value: result.note!),
        if (result.shareToFeed)
          const _Line(label: 'Feed', value: 'Shared to your feed'),
        const SizedBox(height: 16),
        if (hasVideo)
          ResultVideoPlayer(url: result.videoUrl, fullBleed: true)
        else
          const _Line(label: 'Video', value: 'Not attached'),
        const SizedBox(height: 16),
        Text(
          'Reported ${formatDateAtTime(result.submittedAt)}',
          style: const TextStyle(color: AppColors.faint, fontSize: 12),
        ),
      ],
    );
  }
}

/// Recognition badge earned on a verified result.
class _BadgeChip extends StatelessWidget {
  const _BadgeChip({required this.badge});

  final Badge badge;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.success.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(badge.icon, style: const TextStyle(fontSize: 14)),
          const SizedBox(width: 6),
          Text(
            'Earned ${badge.name}',
            style: const TextStyle(
              color: AppColors.success,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _VerdictChip extends StatelessWidget {
  const _VerdictChip({required this.approved, this.at});

  final bool approved;
  final DateTime? at;

  @override
  Widget build(BuildContext context) {
    final color = approved ? AppColors.success : AppColors.danger;
    final label = approved ? 'Verified' : 'Not approved';
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            approved ? Icons.verified_rounded : Icons.cancel_rounded,
            color: color,
            size: 16,
          ),
          const SizedBox(width: 6),
          Text(
            at == null ? label : '$label · ${formatDateAtTime(at!)}',
            style: TextStyle(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class _Line extends StatelessWidget {
  const _Line({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 92,
            child: Text(
              label,
              style: const TextStyle(color: AppColors.muted, fontSize: 13),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(color: AppColors.fg, fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}
