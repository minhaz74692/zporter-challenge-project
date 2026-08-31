import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/util/formatters.dart';
import '../../../../core/widgets/pill.dart';
import '../../../../core/widgets/star_rating.dart';
import '../../domain/challenge.dart';

/// Shared building blocks for the challenge card and the detail screen — one
/// definition each so the two stay visually identical.

/// People / duration / category trio.
class ChallengeStatsRow extends StatelessWidget {
  const ChallengeStatsRow(this.c, {super.key});

  final Challenge c;

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          child: _Stat(
            icon: Icons.people_alt_rounded,
            value: '${c.participantCount}',
            sub: formatAgeRange(c.ageFrom, c.ageTo),
          ),
        ),
        Expanded(
          child: _Stat(
            icon: Icons.access_time_rounded,
            value: '${c.durationMinutes}min',
            sub: c.location.label,
          ),
        ),
        Expanded(
          child: _Stat(
            value: c.mainCategory.label,
            sub: c.position ?? 'All',
            alignEnd: true,
          ),
        ),
      ],
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({
    required this.value,
    required this.sub,
    this.icon,
    this.alignEnd = false,
  });

  final IconData? icon;
  final String value;
  final String sub;
  final bool alignEnd;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment:
          alignEnd ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 16, color: AppColors.primary),
              const SizedBox(width: 5),
            ],
            Flexible(
              child: Text(
                value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.fg,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Text(
          sub,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(color: AppColors.muted, fontSize: 12),
        ),
      ],
    );
  }
}

/// `Start …` / `End …` line.
class ChallengeDatesRow extends StatelessWidget {
  const ChallengeDatesRow(this.c, {super.key});

  final Challenge c;

  @override
  Widget build(BuildContext context) {
    const style = TextStyle(color: AppColors.muted, fontSize: 11);
    return Row(
      children: [
        Expanded(
          child: Text(
            'Start ${formatDateAtTime(c.startAt)}',
            style: style,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            'End ${formatDateAtTime(c.deadline)}',
            style: style,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.end,
          ),
        ),
      ],
    );
  }
}

/// Grey equipment pills then solid-blue collection pills, each row optional.
class ChallengePillRows extends StatelessWidget {
  const ChallengePillRows(this.c, {super.key});

  final Challenge c;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (c.equipmentTags.isNotEmpty)
          _Wrap(labels: c.equipmentTags, tone: PillTone.grey),
        if (c.equipmentTags.isNotEmpty && c.collections.isNotEmpty)
          const SizedBox(height: 8),
        if (c.collections.isNotEmpty)
          _Wrap(labels: c.collections, tone: PillTone.primary),
      ],
    );
  }
}

class _Wrap extends StatelessWidget {
  const _Wrap({required this.labels, required this.tone});

  final List<String> labels;
  final PillTone tone;

  @override
  Widget build(BuildContext context) => Wrap(
    spacing: 8,
    runSpacing: 8,
    children: [
      for (final label in labels) Pill(label.replaceFirst('#', ''), tone: tone),
    ],
  );
}

/// Creator block: avatar, name + handle + club, role on the right, chevron.
class CreatorRow extends StatelessWidget {
  const CreatorRow(this.creator, {this.onTap, super.key});

  final CreatorSummary creator;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Row(
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor: AppColors.surfaceOverlay,
            backgroundImage: creator.avatarUrl != null
                ? NetworkImage(creator.avatarUrl!)
                : null,
            child: creator.avatarUrl == null
                ? Text(
                    creator.displayName.isNotEmpty
                        ? creator.displayName[0]
                        : '?',
                    style: const TextStyle(color: AppColors.fg),
                  )
                : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  creator.displayName,
                  style: const TextStyle(
                    color: AppColors.fg,
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                Text(
                  creator.handle,
                  style: const TextStyle(color: AppColors.muted, fontSize: 12),
                ),
              ],
            ),
          ),
          if (creator.position != null || creator.club != null)
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                if (creator.position != null)
                  Text(
                    creator.position!,
                    style: const TextStyle(
                      color: AppColors.muted,
                      fontSize: 12,
                    ),
                  ),
                if (creator.club != null)
                  Text(
                    creator.club!,
                    style: const TextStyle(
                      color: AppColors.muted,
                      fontSize: 12,
                    ),
                  ),
              ],
            ),
          const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
        ],
      ),
    );
  }
}

/// Green star rating on the left, comment count on the right.
class ChallengeRatingRow extends StatelessWidget {
  const ChallengeRatingRow(this.c, {super.key});

  final Challenge c;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        StarRating(c.ratingAverage ?? 0),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.chat_bubble_outline_rounded,
              size: 18,
              color: AppColors.muted,
            ),
            if (c.commentCount > 0) ...[
              const SizedBox(width: 5),
              Text(
                '${c.commentCount}',
                style: const TextStyle(color: AppColors.muted, fontSize: 12),
              ),
            ],
          ],
        ),
      ],
    );
  }
}
