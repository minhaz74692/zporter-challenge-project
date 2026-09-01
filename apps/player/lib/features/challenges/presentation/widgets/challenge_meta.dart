import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/util/formatters.dart';
import '../../../../core/widgets/app_icon.dart';
import '../../../../core/widgets/pill.dart';
import '../../../../core/widgets/star_rating.dart';
import '../../domain/challenge.dart';

/// Shared building blocks for the challenge card and the detail screen — one
/// definition each so the two stay visually identical.

/// People / duration / points / category quartet — Figma "Group 2204".
///
/// Each cell is a blue icon + 16px value on one line, a 13px sub-label under
/// it, everything in the muted tab-inactive grey (`#818389`). The trailing
/// category cell is icon-less and right-aligned.
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
            icon: AppIconAsset.people,
            value: '${c.participantCount}',
            sub: formatAgeRange(c.ageFrom, c.ageTo),
          ),
        ),
        Expanded(
          child: _Stat(
            icon: AppIconAsset.alarm,
            value: '${c.durationMinutes}min',
            sub: c.location.label,
          ),
        ),
        Expanded(
          child: _Stat(
            icon: AppIconAsset.trophy,
            value: '${c.rewardPoints}p',
            sub: '${c.pointsToParticipate}p',
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

  final AppIconAsset? icon;
  final String value;
  final String sub;
  final bool alignEnd;

  @override
  Widget build(BuildContext context) {
    // Figma: the icon cells carry a 16px value; the icon-less category cell's
    // top line ("Technics") is 14px.
    final valueSize = icon == null ? 14.0 : 16.0;
    return Column(
      crossAxisAlignment:
          alignEnd ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (icon != null) ...[
              AppIcon(icon!),
              const SizedBox(width: AppSpacing.xs),
            ],
            Flexible(
              child: Text(
                value,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  color: AppColors.tabInactive,
                  fontSize: valueSize,
                  fontWeight: FontWeight.w400,
                  height: 22 / valueSize,
                ),
              ),
            ),
          ],
        ),
        Text(
          sub,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: const TextStyle(
            color: AppColors.tabInactive,
            fontSize: 13,
            fontWeight: FontWeight.w400,
            height: 22 / 13,
          ),
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
    // Figma "Start … / End …": Gilroy 11 / 400 / 16, white.
    const style = TextStyle(
      color: AppColors.fgStrong,
      fontSize: 11,
      fontWeight: FontWeight.w400,
      height: 16 / 11,
    );
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
    // Figma: 4.5px between pills, 8px between rows.
    spacing: 4.5,
    runSpacing: 8,
    children: [
      for (final label in labels) Pill(label.replaceFirst('#', ''), tone: tone),
    ],
  );
}

/// Creator block (Figma): 52px rounded avatar, name + handle + location on the
/// left, role + club on the right, a grey chevron.
class CreatorRow extends StatelessWidget {
  const CreatorRow(this.creator, {this.onTap, super.key});

  final CreatorSummary creator;
  final VoidCallback? onTap;

  // 11 / 400 / 16 — grey (#818389) for handle + role, white for location + club.
  static const _greySub = TextStyle(
    color: AppColors.tabInactive,
    fontSize: 11,
    fontWeight: FontWeight.w400,
    height: 16 / 11,
  );
  static const _whiteSub = TextStyle(
    color: AppColors.fgStrong,
    fontSize: 11,
    fontWeight: FontWeight.w400,
    height: 16 / 11,
  );

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _Avatar(url: creator.avatarUrl, name: creator.displayName),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  creator.displayName,
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
                Text(creator.handle, style: _greySub),
                if (creator.location != null)
                  Text(creator.location!, style: _whiteSub),
              ],
            ),
          ),
          const SizedBox(width: 8),
          if (creator.position != null || creator.club != null)
            Padding(
              padding: const EdgeInsets.only(top: 25),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (creator.position != null)
                    Text(creator.position!, style: _greySub),
                  if (creator.club != null)
                    Text(creator.club!, style: _whiteSub),
                ],
              ),
            ),
          const SizedBox(width: 6),
          const Padding(
            padding: EdgeInsets.only(top: 28),
            child: Icon(
              Icons.chevron_right_rounded,
              color: AppColors.tabInactive,
              size: 18,
            ),
          ),
        ],
      ),
    );
  }
}

/// 52×52 rounded-rect avatar, initial fallback.
class _Avatar extends StatelessWidget {
  const _Avatar({required this.url, required this.name});

  final String? url;
  final String name;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(10),
      child: SizedBox(
        width: 52,
        height: 52,
        child: url != null
            ? Image.network(
                url!,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => _fallback(),
              )
            : _fallback(),
      ),
    );
  }

  Widget _fallback() => ColoredBox(
    color: AppColors.surfaceOverlay,
    child: Center(
      child: Text(
        name.isNotEmpty ? name[0] : '?',
        style: const TextStyle(color: AppColors.fg, fontSize: 18),
      ),
    ),
  );
}

/// Green star rating on the left, comment count on the right.
class ChallengeRatingRow extends StatelessWidget {
  const ChallengeRatingRow(this.c, {super.key});

  final Challenge c;

  @override
  Widget build(BuildContext context) {
    return Padding(
      // Figma: the rating row is inset a further 8px each side of the body.
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          StarRating(c.ratingAverage ?? 0),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.chat_bubble_outline_rounded,
                size: 22,
                color: AppColors.tabInactive,
              ),
              if (c.commentCount > 0) ...[
                const SizedBox(width: 5),
                Text(
                  '${c.commentCount}',
                  style: const TextStyle(
                    color: AppColors.tabInactive,
                    fontSize: 12,
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
