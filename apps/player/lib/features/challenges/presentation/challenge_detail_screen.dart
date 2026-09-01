import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/widgets/async_view.dart';
import '../../../core/widgets/section_tab_bar.dart';
import '../application/challenge_detail_provider.dart';
import '../domain/challenge.dart';
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
    final showActionBar =
        detail != null && (state == null || state == InviteState.invited);

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
          leading: IconButton(
            // Figma: a thin grey back chevron.
            icon: const Icon(
              Icons.chevron_left_rounded,
              color: AppColors.tabInactive,
              size: 26,
            ),
            onPressed: () => context.pop(),
          ),
          title: Text(
            detail?.challenge.title ?? 'Challenge',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          actions: [
            _ShareButton(challenge: detail?.challenge),
            const SizedBox(width: 12),
          ],
          bottom: SectionTabBar(labels: tabLabels),
        ),
        body: AsyncView<ChallengeDetail>(
          value: value,
          onRetry: () => ref.invalidate(challengeDetailProvider(challengeId)),
          data: (detail) {
            return TabBarView(
              // The Instructions tab hosts a horizontal media carousel; a
              // swipeable TabBarView would steal that drag. Tabs switch via the
              // always-visible tab bar instead.
              physics: const NeverScrollableScrollPhysics(),
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
              // Figma widths 138 : 182 ≈ 3 : 4, ~14px apart.
              Expanded(
                flex: 3,
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.declined, // Figma #FF1D00
                    side: const BorderSide(
                      color: AppColors.declined,
                      width: 2,
                    ),
                  ),
                  onPressed: () =>
                      _run(context, notifier.decline, 'Challenge declined'),
                  child: const Text('DECLINE'),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                flex: 4,
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

/// White share icon that opens the native share sheet (iOS + Android) with the
/// challenge headline + ingress. Disabled until the challenge has loaded.
class _ShareButton extends StatelessWidget {
  const _ShareButton({required this.challenge});

  final Challenge? challenge;

  Future<void> _share(BuildContext context) async {
    final c = challenge;
    if (c == null) return;

    final buffer = StringBuffer(
      '"${c.title}" — a football challenge on Zporter',
    );
    if (c.ingress != null && c.ingress!.trim().isNotEmpty) {
      buffer.write('\n\n${c.ingress!.trim()}');
    }

    // Anchor the popover on iPad; ignored elsewhere.
    final box = context.findRenderObject() as RenderBox?;
    final origin = box != null && box.hasSize
        ? box.localToGlobal(Offset.zero) & box.size
        : null;

    await Share.share(
      buffer.toString(),
      subject: c.title,
      sharePositionOrigin: origin,
    );
  }

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: const Icon(
        Icons.share_rounded,
        color: AppColors.fgStrong,
        size: 22,
      ),
      onPressed: challenge == null ? null : () => _share(context),
    );
  }
}
