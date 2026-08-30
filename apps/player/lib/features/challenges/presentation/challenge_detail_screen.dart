import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';

/// Challenge detail. Fleshed out in Phase 4 Step 4 (cover, instructions,
/// leaderboard preview, participants, accept/decline) — a stub for now so the
/// list's Open action has somewhere to go.
class ChallengeDetailScreen extends StatelessWidget {
  const ChallengeDetailScreen({required this.challengeId, super.key});

  final String challengeId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        title: const Text('Challenge'),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xxl),
          child: Text(
            'Detail for $challengeId\ncoming in the next step.',
            textAlign: TextAlign.center,
            style: const TextStyle(color: AppColors.muted),
          ),
        ),
      ),
    );
  }
}
