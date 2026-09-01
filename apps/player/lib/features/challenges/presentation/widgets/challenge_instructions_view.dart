import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/widgets/gradient_panel.dart';
import '../../domain/challenge.dart';
import 'challenge_cover_header.dart';
import 'challenge_meta.dart';
import 'rich_description.dart';

/// The "Instructions" tab of the challenge detail screen — the full-bleed
/// cover, then one continuous gradient panel (rounded top, tucked under the
/// image) holding the stats, dates, pills, instructions text, creator and
/// rating.
class ChallengeInstructionsView extends StatelessWidget {
  const ChallengeInstructionsView(this.challenge, {super.key});

  final Challenge challenge;

  @override
  Widget build(BuildContext context) {
    final c = challenge;

    return SingleChildScrollView(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ChallengeCoverHeader(
            challenge: c,
            showMeta: false,
            topRadius: AppRadii.panel,
          ),
          // Overlap the image bottom so its hard edge sits behind the rounded
          // corners.
          Transform.translate(
            offset: const Offset(0, -24),
            child: GradientPanel(
              padding: const EdgeInsets.fromLTRB(16, 24, 16, 20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  ChallengeStatsRow(c),
                  const SizedBox(height: 20),
                  ChallengeDatesRow(c),
                  const SizedBox(height: 20),
                  ChallengePillRows(c),
                  const SizedBox(height: 26),
                  const Text(
                    'Description',
                    style: TextStyle(
                      color: AppColors.muted,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 12),
                  RichDescription(c.description),
                  const SizedBox(height: 24),
                  if (c.creator != null) ...[
                    CreatorRow(c.creator!),
                    const SizedBox(height: 16),
                  ],
                  ChallengeRatingRow(c),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
