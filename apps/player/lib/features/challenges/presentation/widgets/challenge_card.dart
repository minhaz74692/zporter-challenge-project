import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/util/formatters.dart';
import '../../../../core/widgets/pill.dart';
import '../../../../core/widgets/primary_button.dart';
import '../../../../core/widgets/star_rating.dart';
import '../../domain/challenge.dart';
import 'challenge_cover_header.dart';

/// The Figma challenge card: cover hero, a three-cell stat row, start/end
/// dates, equipment + skill pill rows, a collapsible description (with the
/// creator block), a rating row, and the Open action.
class ChallengeCard extends StatefulWidget {
  const ChallengeCard({
    required this.challenge,
    required this.onOpen,
    this.showCheck = false,
    super.key,
  });

  final Challenge challenge;
  final VoidCallback onOpen;

  /// Green completion check on the cover — shown on the "Done" tab.
  final bool showCheck;

  @override
  State<ChallengeCard> createState() => _ChallengeCardState();
}

class _ChallengeCardState extends State<ChallengeCard> {
  bool _descriptionOpen = false;

  Challenge get c => widget.challenge;

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      // Figma card fill — a subtle top-to-bottom gradient. The cover photo is
      // deliberately full-bleed (no horizontal inset, no corner radius); only
      // the body content below it is padded.
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [AppColors.cardTop, AppColors.cardBottom],
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ChallengeCoverHeader(challenge: c, showCheck: widget.showCheck),
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 14, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _StatRow(c),
                const SizedBox(height: 12),
                _StartEndRow(c),
                const SizedBox(height: 12),
                if (c.equipmentTags.isNotEmpty) ...[
                  _PillWrap(
                    labels: c.equipmentTags,
                    tone: PillTone.grey,
                  ),
                  const SizedBox(height: 8),
                ],
                if (c.collections.isNotEmpty) ...[
                  _PillWrap(labels: c.collections, tone: PillTone.primary),
                  const SizedBox(height: 8),
                ],
                _DescriptionToggle(
                  open: _descriptionOpen,
                  onTap: () =>
                      setState(() => _descriptionOpen = !_descriptionOpen),
                ),
                if (_descriptionOpen) ...[
                  const SizedBox(height: 12),
                  Text(
                    c.description,
                    style: const TextStyle(
                      color: AppColors.muted,
                      fontSize: 13,
                      height: 1.5,
                    ),
                  ),
                  if (c.creator != null) ...[
                    const SizedBox(height: 14),
                    _CreatorRow(c),
                  ],
                ],
                const SizedBox(height: 12),
                _RatingRow(c),
                const SizedBox(height: 12),
                PrimaryButton(label: 'Open', onPressed: widget.onOpen),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatRow extends StatelessWidget {
  const _StatRow(this.c);

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

class _StartEndRow extends StatelessWidget {
  const _StartEndRow(this.c);

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

class _PillWrap extends StatelessWidget {
  const _PillWrap({required this.labels, required this.tone});

  final List<String> labels;
  final PillTone tone;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final label in labels)
          Pill(label.replaceFirst('#', ''), tone: tone),
      ],
    );
  }
}

class _DescriptionToggle extends StatelessWidget {
  const _DescriptionToggle({required this.open, required this.onTap});

  final bool open;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: Row(
          children: [
            const Expanded(child: Divider(color: AppColors.border, height: 1)),
            const SizedBox(width: 12),
            const Text(
              'Description',
              style: TextStyle(
                color: AppColors.muted,
                fontSize: 13,
                fontWeight: FontWeight.w600,
              ),
            ),
            Icon(
              open ? Icons.keyboard_arrow_down_rounded : Icons.chevron_right_rounded,
              color: AppColors.muted,
              size: 20,
            ),
            const SizedBox(width: 12),
            const Expanded(child: Divider(color: AppColors.border, height: 1)),
          ],
        ),
      ),
    );
  }
}

class _CreatorRow extends StatelessWidget {
  const _CreatorRow(this.c);

  final Challenge c;

  @override
  Widget build(BuildContext context) {
    final creator = c.creator!;
    return Row(
      children: [
        CircleAvatar(
          radius: 22,
          backgroundColor: AppColors.surfaceOverlay,
          backgroundImage:
              creator.avatarUrl != null ? NetworkImage(creator.avatarUrl!) : null,
          child: creator.avatarUrl == null
              ? Text(
                  creator.displayName.isNotEmpty ? creator.displayName[0] : '?',
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
              if (creator.club != null)
                Text(
                  creator.club!,
                  style: const TextStyle(color: AppColors.muted, fontSize: 12),
                ),
            ],
          ),
        ),
        if (creator.position != null)
          Padding(
            padding: const EdgeInsets.only(left: 8),
            child: Text(
              creator.position!,
              style: const TextStyle(color: AppColors.muted, fontSize: 12),
            ),
          ),
        const Icon(Icons.chevron_right_rounded, color: AppColors.muted),
      ],
    );
  }
}

class _RatingRow extends StatelessWidget {
  const _RatingRow(this.c);

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
