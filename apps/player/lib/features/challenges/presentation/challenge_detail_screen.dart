import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/async_view.dart';
import '../application/challenge_detail_provider.dart';
import '../domain/challenge_detail.dart';
import '../domain/challenge_enums.dart';
import 'widgets/challenge_instructions_view.dart';
import 'widgets/challenge_leaderboard_view.dart';
import 'widgets/challenge_participants_view.dart';
import 'widgets/challenge_report_view.dart';

/// Challenge detail — Instructions / Add result / Participants tabs, with a
/// Decline / Accept action bar while the invite is still open.
class ChallengeDetailScreen extends ConsumerWidget {
  const ChallengeDetailScreen({required this.challengeId, super.key});

  final String challengeId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final value = ref.watch(challengeDetailProvider(challengeId));
    final detail = value.valueOrNull;
    final state = detail?.viewerParticipant?.inviteState;

    // Declining ends your involvement — drop the report tab for it.
    final showReportTab = state != InviteState.declined;
    final hasSubmitted = detail?.viewerParticipant?.submittedResult != null;
    final showActionBar = detail != null &&
        (state == null || state == InviteState.invited);

    final tabLabels = [
      'Instructions',
      if (showReportTab) (hasSubmitted ? 'Report' : 'Add Result'),
      'Participants',
      'Leaderboard',
    ];

    return DefaultTabController(
      // Re-key so the controller rebuilds cleanly if the tab count changes.
      key: ValueKey(tabLabels.length),
      length: tabLabels.length,
      child: Scaffold(
        backgroundColor: AppColors.bg,
        appBar: AppBar(
          backgroundColor: AppColors.bg,
          titleSpacing: 0,
          title: Text(
            detail?.challenge.title ?? 'Challenge',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          actions: const [
            Icon(Icons.ios_share_rounded, color: AppColors.fg, size: 22),
            SizedBox(width: 16),
          ],
          bottom: TabBar(
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            indicatorColor: AppColors.accent,
            indicatorSize: TabBarIndicatorSize.label,
            labelColor: AppColors.accent,
            unselectedLabelColor: AppColors.muted,
            labelStyle:
                const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
            tabs: [for (final label in tabLabels) Tab(text: label)],
          ),
        ),
        body: AsyncView<ChallengeDetail>(
          value: value,
          onRetry: () => ref.invalidate(challengeDetailProvider(challengeId)),
          data: (detail) {
            return TabBarView(
              children: [
                ChallengeInstructionsView(detail.challenge),
                if (showReportTab)
                  ChallengeReportView(
                    challenge: detail.challenge,
                    participant: detail.viewerParticipant,
                  ),
                ChallengeParticipantsView(challengeId),
                ChallengeLeaderboardView(challengeId),
              ],
            );
          },
        ),
        bottomNavigationBar: showActionBar
            ? _ActionBar(
                challengeId: challengeId,
                ended: detail.challenge.hasEnded,
              )
            : null,
      ),
    );
  }
}

class _ActionBar extends ConsumerWidget {
  const _ActionBar({required this.challengeId, required this.ended});

  final String challengeId;
  final bool ended;

  Future<void> _run(
    BuildContext context,
    Future<void> Function() action,
    String successMessage,
  ) async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      await action();
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(successMessage)));
    } on ApiException catch (e) {
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifier = ref.read(challengeDetailProvider(challengeId).notifier);

    final Widget content = ended
        ? const SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: null,
              child: Text('Challenge ended'),
            ),
          )
        : Row(
            children: [
              Expanded(
                flex: 2,
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.danger,
                    side: const BorderSide(color: AppColors.danger),
                    minimumSize: const Size.fromHeight(48),
                  ),
                  onPressed: () =>
                      _run(context, notifier.decline, 'Challenge declined'),
                  child: const Text('DECLINE'),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 3,
                child: ElevatedButton(
                  onPressed: () =>
                      _run(context, notifier.accept, 'Challenge accepted'),
                  child: const Text('ACCEPT'),
                ),
              ),
            ],
          );

    return SafeArea(
      child: Container(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
        decoration: const BoxDecoration(
          color: AppColors.bg,
          border: Border(top: BorderSide(color: AppColors.borderSoft)),
        ),
        child: content,
      ),
    );
  }
}
