import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
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
    this.coverStatus = CoverStatus.none,
    super.key,
  });

  final Challenge challenge;
  final VoidCallback onOpen;

  /// Cover status disc: green on the "Done" tab, red on "Declined".
  final CoverStatus coverStatus;

  @override
  State<ChallengeCard> createState() => _ChallengeCardState();
}

class _ChallengeCardState extends State<ChallengeCard> {
  bool _descriptionOpen = false;

  Challenge get c => widget.challenge;

  @override
  Widget build(BuildContext context) {
    final hasPills = c.equipmentTags.isNotEmpty || c.collections.isNotEmpty;
    // Image cards overlay content down to the description; video cards stop at
    // the start/end dates and keep the rest on the solid body.
    final overVideo = c.hasVideoCover;

    final dates = ChallengeDatesRow(c);
    final pills = hasPills ? ChallengePillRows(c) : null;
    final description = Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      mainAxisSize: MainAxisSize.min,
      children: [
        _DescriptionToggle(
          open: _descriptionOpen,
          onTap: () => setState(() => _descriptionOpen = !_descriptionOpen),
        ),
        if (_descriptionOpen) ...[
          const SizedBox(height: 12),
          RichDescription(c.description),
          if (c.creator != null) ...[
            const SizedBox(height: 14),
            CreatorRow(c.creator!),
          ],
        ],
      ],
    );

    return Container(
      // 10px gap between the Open button and the next card.
      margin: const EdgeInsets.only(bottom: 10),
      clipBehavior: Clip.antiAlias,
      // Figma card fill — a subtle top-to-bottom gradient, rounded top corners.
      // The cover photo is full-bleed horizontally; only the body below is padded.
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [AppColors.cardTop, AppColors.cardBottom],
        ),
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(AppRadii.card)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ChallengeCoverHeader(
            challenge: c,
            coverStatus: widget.coverStatus,
            topRadius: AppRadii.card,
            overlayFooter: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              mainAxisSize: MainAxisSize.min,
              children: [
                // Stats align with the headline (23px).
                Padding(
                  padding: const EdgeInsets.only(left: 23, right: 7),
                  child: ChallengeStatsRow(c),
                ),
                // Image cards also carry the dates + pills over the image;
                // video cards keep everything from the dates onward on the body.
                if (!overVideo) ...[
                  const SizedBox(height: 12),
                  dates,
                  if (pills != null) ...[
                    const SizedBox(height: 12),
                    pills,
                  ],
                ],
              ],
            ),
          ),
          Padding(
            // Tight bottom inset so the Open button nearly meets the card edge;
            // the 10px gap to the next card comes from the outer margin.
            padding: const EdgeInsets.fromLTRB(15, 14, 15, 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Video cards: dates + pills lead the body (image cards show
                // these over the cover); the description onward is always here.
                if (overVideo) ...[
                  dates,
                  if (pills != null) ...[
                    const SizedBox(height: 12),
                    pills,
                  ],
                  const SizedBox(height: 8),
                ],
                description,
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

/// Figma "Group 3603": a centred 16px "Description" label with a chevron pinned
/// to the right edge — no divider rules. The chevron flips to a down-arrow while
/// the description is expanded.
class _DescriptionToggle extends StatelessWidget {
  const _DescriptionToggle({required this.open, required this.onTap});

  final bool open;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: SizedBox(
        height: 24,
        child: Stack(
          alignment: Alignment.center,
          children: [
            const Text(
              'Description',
              style: TextStyle(
                color: AppColors.tabInactive,
                fontSize: 16,
                fontWeight: FontWeight.w400,
                height: 22 / 16,
              ),
            ),
            Align(
              alignment: Alignment.centerRight,
              child: Icon(
                open
                    ? Icons.keyboard_arrow_down_rounded
                    : Icons.chevron_right_rounded,
                color: AppColors.tabInactive,
                size: 24,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
