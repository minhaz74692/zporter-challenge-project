import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../network/api_exception.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

/// Renders the four states of an [AsyncValue] consistently across the app:
/// spinner while loading, a friendly error with Retry, an empty-state when the
/// data is an empty list, and [data] otherwise.
///
/// [onRetry] is typically `() => ref.invalidate(theProvider)`.
class AsyncView<T> extends StatelessWidget {
  const AsyncView({
    required this.value,
    required this.data,
    required this.onRetry,
    this.emptyMessage = 'Nothing here yet.',
    this.isEmpty,
    this.loading,
    super.key,
  });

  final AsyncValue<T> value;
  final Widget Function(T data) data;
  final VoidCallback onRetry;
  final String emptyMessage;

  /// Defaults to "T is an empty Iterable".
  final bool Function(T data)? isEmpty;

  /// Shown on first load / reload. Defaults to a centered spinner; pass a
  /// skeleton for a smoother transition.
  final Widget? loading;

  @override
  Widget build(BuildContext context) {
    return value.when(
      loading: () => loading ?? const Center(child: CircularProgressIndicator()),
      error: (err, _) => _Message(
        icon: Icons.wifi_off_rounded,
        text: err is ApiException ? err.message : 'Something went wrong.',
        actionLabel: 'Retry',
        onAction: onRetry,
      ),
      data: (value) {
        final empty = isEmpty?.call(value) ??
            (value is Iterable && value.isEmpty);
        if (empty) {
          return _Message(icon: Icons.inbox_rounded, text: emptyMessage);
        }
        return data(value);
      },
    );
  }
}

class _Message extends StatelessWidget {
  const _Message({
    required this.icon,
    required this.text,
    this.actionLabel,
    this.onAction,
  });

  final IconData icon;
  final String text;
  final String? actionLabel;
  final VoidCallback? onAction;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxxl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 40, color: AppColors.faint),
            const SizedBox(height: AppSpacing.md),
            Text(
              text,
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.muted),
            ),
            if (actionLabel != null) ...[
              const SizedBox(height: AppSpacing.lg),
              OutlinedButton(onPressed: onAction, child: Text(actionLabel!)),
            ],
          ],
        ),
      ),
    );
  }
}
