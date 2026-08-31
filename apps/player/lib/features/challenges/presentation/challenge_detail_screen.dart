import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/async_view.dart';
import '../application/challenge_detail_provider.dart';
import '../domain/challenge_detail.dart';
import '../domain/challenge_enums.dart';
import '../domain/participant.dart';
import 'widgets/challenge_instructions_view.dart';
import 'widgets/challenge_participants_view.dart';

/// Challenge detail — Instructions / Report / Participants tabs with a
/// persistent Decline / Accept action bar.
class ChallengeDetailScreen extends ConsumerWidget {
  const ChallengeDetailScreen({required this.challengeId, super.key});

  final String challengeId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final value = ref.watch(challengeDetailProvider(challengeId));
    final detail = value.valueOrNull;

    return DefaultTabController(
      length: 3,
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
          bottom: const TabBar(
            isScrollable: true,
            tabAlignment: TabAlignment.start,
            indicatorColor: AppColors.accent,
            indicatorSize: TabBarIndicatorSize.label,
            labelColor: AppColors.accent,
            unselectedLabelColor: AppColors.muted,
            labelStyle: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
            tabs: [
              Tab(text: 'Instructions'),
              Tab(text: 'Report'),
              Tab(text: 'Participants'),
            ],
          ),
        ),
        body: AsyncView<ChallengeDetail>(
          value: value,
          onRetry: () =>
              ref.invalidate(challengeDetailProvider(challengeId)),
          data: (detail) => TabBarView(
            children: [
              ChallengeInstructionsView(detail.challenge),
              const _ReportTabPlaceholder(),
              ChallengeParticipantsView(challengeId),
            ],
          ),
        ),
        // No action bar once the invite has been declined — the challenge
        // lives in the Declined tab and there's nothing left to do here.
        bottomNavigationBar: detail == null ||
                detail.viewerParticipant?.inviteState == InviteState.declined
            ? null
            : _ActionBar(
                challengeId: challengeId,
                participant: detail.viewerParticipant,
                ended: detail.challenge.hasEnded,
              ),
      ),
    );
  }
}

class _ActionBar extends ConsumerWidget {
  const _ActionBar({
    required this.challengeId,
    required this.participant,
    required this.ended,
  });

  final String challengeId;
  final ParticipantSummary? participant;
  final bool ended;

  Future<void> _run(
    BuildContext context,
    WidgetRef ref,
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
    final state = participant?.inviteState;

    final Widget content;
    if (ended) {
      content = const _FullWidth(
        child: OutlinedButton(onPressed: null, child: Text('Challenge ended')),
      );
    } else if (state == null || state == InviteState.invited) {
      content = Row(
        children: [
          Expanded(
            flex: 2,
            child: OutlinedButton(
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.danger,
                side: const BorderSide(color: AppColors.danger),
                minimumSize: const Size.fromHeight(48),
              ),
              onPressed: () => _run(
                context,
                ref,
                notifier.decline,
                'Challenge declined',
              ),
              child: const Text('DECLINE'),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            flex: 3,
            child: ElevatedButton(
              onPressed: () => _run(
                context,
                ref,
                notifier.accept,
                'Challenge accepted',
              ),
              child: const Text('ACCEPT'),
            ),
          ),
        ],
      );
    } else if (state == InviteState.accepted) {
      content = _FullWidth(
        child: ElevatedButton(
          onPressed: () => DefaultTabController.of(context).animateTo(1),
          child: const Text('Report result'),
        ),
      );
    } else {
      // Declined is handled one level up (no bar); nothing to show here.
      return const SizedBox.shrink();
    }

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

class _FullWidth extends StatelessWidget {
  const _FullWidth({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) => SizedBox(
    width: double.infinity,
    child: child,
  );
}

class _ReportTabPlaceholder extends StatelessWidget {
  const _ReportTabPlaceholder();

  @override
  Widget build(BuildContext context) => const Center(
    child: Padding(
      padding: EdgeInsets.all(AppSpacing.xxl),
      child: Text(
        'Report a result — coming in Phase 5.',
        textAlign: TextAlign.center,
        style: TextStyle(color: AppColors.muted),
      ),
    ),
  );
}
