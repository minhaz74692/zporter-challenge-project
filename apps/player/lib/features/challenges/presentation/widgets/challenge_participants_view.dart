import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/async_view.dart';
import '../../application/challenge_detail_provider.dart';
import '../../domain/challenge_enums.dart';
import '../../domain/participant.dart';

/// The "Participants" tab — everyone invited to the challenge, with their
/// invite state or leaderboard rank.
class ChallengeParticipantsView extends ConsumerWidget {
  const ChallengeParticipantsView(this.challengeId, {super.key});

  final String challengeId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final value = ref.watch(challengeParticipantsProvider(challengeId));

    return AsyncView<List<Participant>>(
      value: value,
      onRetry: () =>
          ref.invalidate(challengeParticipantsProvider(challengeId)),
      emptyMessage: 'No one has been invited yet.',
      data: (people) => ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
        itemCount: people.length,
        separatorBuilder: (_, __) =>
            const Divider(color: AppColors.borderSoft, height: 20),
        itemBuilder: (_, i) => _ParticipantTile(people[i]),
      ),
    );
  }
}

class _ParticipantTile extends StatelessWidget {
  const _ParticipantTile(this.p);

  final Participant p;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        CircleAvatar(
          radius: 20,
          backgroundColor: AppColors.surfaceOverlay,
          backgroundImage:
              p.avatarUrl != null ? NetworkImage(p.avatarUrl!) : null,
          child: p.avatarUrl == null
              ? Text(
                  p.displayName.isNotEmpty ? p.displayName[0] : '?',
                  style: const TextStyle(color: AppColors.fg),
                )
              : null,
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                p.displayName,
                style: const TextStyle(
                  color: AppColors.fg,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Text(
                [p.handle, if (p.club != null) p.club!].join('  ·  '),
                style: const TextStyle(color: AppColors.muted, fontSize: 12),
              ),
            ],
          ),
        ),
        _Trailing(p),
      ],
    );
  }
}

class _Trailing extends StatelessWidget {
  const _Trailing(this.p);

  final Participant p;

  @override
  Widget build(BuildContext context) {
    if (p.rank != null) {
      return Text(
        '#${p.rank}',
        style: const TextStyle(
          color: AppColors.success,
          fontSize: 14,
          fontWeight: FontWeight.w700,
        ),
      );
    }

    final (label, color) = switch (p.inviteState) {
      InviteState.accepted => ('Accepted', AppColors.success),
      InviteState.declined => ('Declined', AppColors.danger),
      InviteState.invited => ('Invited', AppColors.muted),
    };
    return Text(
      label,
      style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.w600),
    );
  }
}
