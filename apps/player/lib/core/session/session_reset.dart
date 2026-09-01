import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../features/auth/application/auth_notifier.dart';
import '../../features/challenges/application/challenge_detail_provider.dart';
import '../../features/challenges/application/challenge_filter_provider.dart';
import '../../features/notifications/application/notifications_provider.dart';

/// Watched once at the app root. When the signed-in user changes — sign-out, or
/// switching accounts on the same device — this drops every provider that holds
/// the previous user's data, so the UI never shows a stale list/inbox before
/// the first fetch of the new session.
final sessionResetProvider = Provider<void>((ref) {
  ref.listen(
    authNotifierProvider.select((s) => s.valueOrNull?.id),
    (previousUserId, nextUserId) {
      if (previousUserId == nextUserId) return;
      // challengeListProvider watches the auth user itself, so it rebuilds on
      // this change without help — the rest still need a nudge.
      ref.invalidate(challengeDetailProvider);
      ref.invalidate(challengeParticipantsProvider);
      ref.invalidate(challengeLeaderboardProvider);
      ref.invalidate(challengeFilterProvider);
      ref.invalidate(notificationsProvider);
    },
  );
});
