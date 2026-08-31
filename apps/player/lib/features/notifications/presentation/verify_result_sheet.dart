import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_exception.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../challenges/data/challenges_providers.dart';
import '../application/notifications_provider.dart';
import '../domain/app_notification.dart';

/// Opened from a `result_verify_request` notification — the controller approves
/// or rejects the named player's result.
Future<void> showVerifyResultSheet(
  BuildContext context,
  AppNotification notification,
) {
  return showModalBottomSheet<void>(
    context: context,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (_) => _VerifyResultSheet(notification: notification),
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
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
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
            const SizedBox(height: AppSpacing.xl),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.danger,
                      side: const BorderSide(color: AppColors.danger),
                      minimumSize: const Size.fromHeight(46),
                    ),
                    onPressed: _busy ? null : () => _submit(false),
                    child: const Text('REJECT'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    onPressed: _busy ? null : () => _submit(true),
                    child: _busy
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
          ],
        ),
      ),
    );
  }
}
