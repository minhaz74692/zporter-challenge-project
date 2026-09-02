import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/util/formatters.dart';
import '../../../../core/widgets/inline_video.dart';
import '../../../challenges/domain/participant.dart';
import '../../domain/challenge_result.dart';

/// One reported result on the Biography "Challenges" tab (Figma
/// "Biography – Challenges Tab" — same shape as the feed's Report-Update card,
/// minus the poster header): headline + value, the arena / date, the video,
/// and a display-only engagement row.
class BioResultCard extends StatelessWidget {
  const BioResultCard({required this.entry, super.key});

  final ChallengeResult entry;

  String _display(SubmittedResult r) {
    final v = r.value;
    if (v is bool) return v ? 'Done' : 'Not done';
    final suffix = r.unit.short.isEmpty ? '' : ' ${r.unit.short}';
    return '$v$suffix'.trim();
  }

  @override
  Widget build(BuildContext context) {
    final r = entry.result;
    final meta =
        '${r.arena?.isNotEmpty == true ? r.arena : 'Location'}, '
        '${formatDmy(r.performedAt)} at ${formatTime(r.performedAt)}';

    return Container(
      margin: const EdgeInsets.fromLTRB(14, 14, 14, 0),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceDim,
        borderRadius: BorderRadius.circular(14),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Expanded(
                child: Text(
                  entry.challenge.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.fgStrong,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Text(
                _display(r),
                style: const TextStyle(
                  color: AppColors.fgStrong,
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(meta, style: const TextStyle(color: AppColors.muted, fontSize: 11)),
          if (r.videoUrl.isNotEmpty) ...[
            const SizedBox(height: 10),
            InlineVideo(url: r.videoUrl),
          ],
          const SizedBox(height: 12),
          const _EngagementRow(),
        ],
      ),
    );
  }
}

/// Display-only ❤ 💬 🔖 — the Biography tab shows the affordances (Figma) but
/// there is no like/save on a bare result outside the feed.
class _EngagementRow extends StatelessWidget {
  const _EngagementRow();

  @override
  Widget build(BuildContext context) {
    return const Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Icon(Icons.favorite_rounded, color: AppColors.success, size: 22),
        SizedBox(width: 18),
        Icon(Icons.mode_comment_outlined, color: AppColors.muted, size: 22),
        SizedBox(width: 18),
        Icon(Icons.bookmark_border_rounded, color: AppColors.muted, size: 22),
      ],
    );
  }
}
