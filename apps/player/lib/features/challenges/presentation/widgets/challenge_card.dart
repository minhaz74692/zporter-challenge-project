import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/primary_button.dart';
import '../../domain/challenge.dart';
import 'challenge_cover_header.dart';
import 'challenge_meta.dart';
import 'rich_description.dart';

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
    final hasPills = c.equipmentTags.isNotEmpty || c.collections.isNotEmpty;

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
                ChallengeStatsRow(c),
                const SizedBox(height: 12),
                ChallengeDatesRow(c),
                if (hasPills) ...[
                  const SizedBox(height: 12),
                  ChallengePillRows(c),
                ],
                const SizedBox(height: 12),
                _DescriptionToggle(
                  open: _descriptionOpen,
                  onTap: () =>
                      setState(() => _descriptionOpen = !_descriptionOpen),
                ),
                if (_descriptionOpen) ...[
                  const SizedBox(height: 12),
                  RichDescription(c.description),
                  if (c.creator != null) ...[
                    const SizedBox(height: 14),
                    CreatorRow(c.creator!),
                  ],
                ],
                const SizedBox(height: 12),
                ChallengeRatingRow(c),
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
              open
                  ? Icons.keyboard_arrow_down_rounded
                  : Icons.chevron_right_rounded,
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
