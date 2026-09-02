import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/widgets/async_view.dart';
import '../../challenges/application/challenge_detail_provider.dart';
import '../../challenges/data/challenges_providers.dart';
import '../../challenges/domain/participant.dart';
import '../../challenges/presentation/widgets/result_summary_card.dart';
import '../application/notifications_provider.dart';
import '../domain/app_notification.dart';

/// Opened from a `result_verify_request` notification — the controller sees the
/// full reported result (value, arena, controller, video) and approves or
/// rejects it.
Future<void> showVerifyResultSheet(
  BuildContext context,
  AppNotification notification,
) {
  return showModalBottomSheet<void>(
    context: context,
    backgroundColor: AppColors.surface,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (_) => FractionallySizedBox(
      heightFactor: 0.9,
      child: _VerifyResultSheet(notification: notification),
    ),
  );
}

class _VerifyResultSheet extends ConsumerStatefulWidget {
  const _VerifyResultSheet({required this.notification});

  final AppNotification notification;

  @override
  ConsumerState<_VerifyResultSheet> createState() => _VerifyResultSheetState();
}

class _VerifyResultSheetState extends ConsumerState<_VerifyResultSheet> {
  bool _busy = false;

  Future<void> _submit(bool approved) async {
    final n = widget.notification;
    if (n.challengeId == null || n.actorId == null) return;

    setState(() => _busy = true);
    final messenger = ScaffoldMessenger.of(context);
    try {
      await ref.read(challengesRepositoryProvider).verifyResult(
            challengeId: n.challengeId!,
            subjectUserId: n.actorId!,
            approved: approved,
          );
      ref.invalidate(notificationsProvider);
      ref.invalidate(challengeParticipantsProvider(n.challengeId!));
      if (mounted) Navigator.of(context).pop();
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(
          SnackBar(content: Text(approved ? 'Result verified' : 'Result rejected')),
        );
    } on ApiException catch (e) {
      if (mounted) setState(() => _busy = false);
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final n = widget.notification;
    final canLoad = n.challengeId != null && n.actorId != null;
    final participants = canLoad
        ? ref.watch(challengeParticipantsProvider(n.challengeId!))
        : const AsyncData<List<Participant>>(<Participant>[]);

    return SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 8),
          Container(
            width: 36,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.border,
              borderRadius: BorderRadius.circular(999),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 8),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(
                  n.title,
                  style: const TextStyle(
                    color: AppColors.fg,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  n.body,
                  style: const TextStyle(color: AppColors.muted, fontSize: 13),
                ),
              ],
            ),
          ),
          const Divider(color: AppColors.borderSoft, height: 1),
          Expanded(
            child: AsyncView<List<Participant>>(
              value: participants,
              onRetry: () => ref.invalidate(
                challengeParticipantsProvider(n.challengeId!),
              ),
              isEmpty: (list) => _resultFor(list) == null,
              emptyMessage: 'This result is no longer available.',
              data: (list) {
                final result = _resultFor(list)!;
                final submitter = _submitterFor(list);
                return SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
                  child: ResultSummaryCard(
                    result: result,
                    submitterName: submitter?.displayName,
                  ),
                );
              },
            ),
          ),
          _Actions(
            result: _resultFor(participants.valueOrNull ?? const []),
            busy: _busy,
            onVerify: () => _submit(true),
            onReject: () => _submit(false),
          ),
        ],
      ),
    );
  }

  SubmittedResult? _resultFor(List<Participant> list) =>
      _submitterFor(list)?.submittedResult;

  Participant? _submitterFor(List<Participant> list) {
    for (final p in list) {
      if (p.userId == widget.notification.actorId) return p;
    }
    return null;
  }
}

/// The bottom action bar. Hidden until the result has loaded; replaced with a
/// note once a verdict already exists.
class _Actions extends StatelessWidget {
  const _Actions({
    required this.result,
    required this.busy,
    required this.onVerify,
    required this.onReject,
  });

  final SubmittedResult? result;
  final bool busy;
  final VoidCallback onVerify;
  final VoidCallback onReject;

  @override
  Widget build(BuildContext context) {
    if (result == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 16),
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: AppColors.borderSoft)),
      ),
      child: result!.isReviewed
          ? Text(
              result!.verified!
                  ? 'You verified this result.'
                  : 'You rejected this result.',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.muted, fontSize: 13),
            )
          : Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      // Figma "DECLINE": #FF1D00 text + 2px border, Gilroy
                      // 14 / 700 / 17, 0 1px 3px rgba(0,0,0,0.2) shadow.
                      foregroundColor: AppColors.declined,
                      side: const BorderSide(color: AppColors.declined, width: 2),
                      minimumSize: const Size.fromHeight(36),
                      textStyle: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 14,
                        height: 17 / 14,
                      ),
                      elevation: 2,
                      shadowColor: const Color(0x33000000),
                    ),
                    onPressed: busy ? null : onReject,
                    child: const Text('REJECT'),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      minimumSize: const Size.fromHeight(36),
                    ),
                    onPressed: busy ? null : onVerify,
                    child: busy
                        ? const SizedBox.square(
                            dimension: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.onPrimary,
                            ),
                          )
                        : const Text('VERIFY'),
                  ),
                ),
              ],
            ),
    );
  }
}
