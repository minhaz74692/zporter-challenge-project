import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../application/challenge_detail_provider.dart';
import '../../data/teammates_provider.dart';
import '../../domain/challenge.dart';
import '../../domain/participant.dart';

/// The person a player nominates to verify their result.
class ControllerChoice {
  const ControllerChoice({
    required this.handle,
    required this.displayName,
    this.avatarUrl,
  });

  final String handle;
  final String displayName;
  final String? avatarUrl;
}

/// Bottom sheet to pick the result's controller — the challenge creator (coach)
/// or any participant. Returns `null` if dismissed. The pick is identified by
/// `#handle`, which is what the verify flow keys off server-side.
Future<ControllerChoice?> showControllerPicker(
  BuildContext context,
  WidgetRef ref, {
  required String challengeId,
  String? excludeUserId,
}) {
  return showModalBottomSheet<ControllerChoice>(
    context: context,
    backgroundColor: AppColors.surface,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
    ),
    builder: (_) => _ControllerPickerSheet(
      challengeId: challengeId,
      excludeUserId: excludeUserId,
    ),
  );
}

class _Candidate {
  const _Candidate({
    required this.userId,
    required this.displayName,
    required this.handle,
    required this.isCoach,
    this.avatarUrl,
  });

  final String userId;
  final String displayName;
  final String handle;
  final bool isCoach;
  final String? avatarUrl;
}

class _ControllerPickerSheet extends ConsumerWidget {
  const _ControllerPickerSheet({
    required this.challengeId,
    required this.excludeUserId,
  });

  final String challengeId;
  final String? excludeUserId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final creator = ref
        .watch(challengeDetailProvider(challengeId))
        .valueOrNull
        ?.challenge
        .creator;
    final teammates = ref.watch(teammatesProvider).valueOrNull ?? const [];
    final participants = ref.watch(challengeParticipantsProvider(challengeId));

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Padding(
              padding: EdgeInsets.fromLTRB(20, 4, 20, 12),
              child: Text(
                'Who verifies this result?',
                style: TextStyle(
                  color: AppColors.fg,
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            Flexible(
              child: participants.when(
                // Fixed height so the sheet doesn't balloon to full-screen
                // while loading (Flexible + Center would expand to the max).
                loading: () => const SizedBox(
                  height: 96,
                  child: Center(child: CircularProgressIndicator()),
                ),
                error: (_, __) => const SizedBox(
                  height: 96,
                  child: _Empty("Couldn't load participants."),
                ),
                data: (people) {
                  final rows = _candidates(creator, teammates, people);
                  if (rows.isEmpty) {
                    return const SizedBox(
                      height: 96,
                      child: _Empty('No coach or teammates found.'),
                    );
                  }
                  return ListView.separated(
                    shrinkWrap: true,
                    padding: const EdgeInsets.only(bottom: 8),
                    itemCount: rows.length,
                    separatorBuilder: (_, __) =>
                        const Divider(color: AppColors.borderSoft, height: 1),
                    itemBuilder: (_, i) => _CandidateRow(
                      rows[i],
                      onTap: () => Navigator.pop(
                        context,
                        ControllerChoice(
                          handle: rows[i].handle,
                          displayName: rows[i].displayName,
                          avatarUrl: rows[i].avatarUrl,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Order: the creator (labelled Coach), then club-mates, then anyone already
  /// on the challenge — deduped by user id, minus the signed-in user and anyone
  /// without a handle (the verify flow keys off `#handle`).
  List<_Candidate> _candidates(
    CreatorSummary? creator,
    List<CreatorSummary> teammates,
    List<Participant> people,
  ) {
    final seen = <String>{};
    final out = <_Candidate>[];

    void add(_Candidate c) {
      if (c.userId == excludeUserId || c.handle.isEmpty) return;
      if (!seen.add(c.userId)) return;
      out.add(c);
    }

    if (creator != null) {
      add(
        _Candidate(
          userId: creator.id,
          displayName: creator.displayName,
          handle: creator.handle,
          avatarUrl: creator.avatarUrl,
          isCoach: true,
        ),
      );
    }
    for (final t in teammates) {
      add(
        _Candidate(
          userId: t.id,
          displayName: t.displayName,
          handle: t.handle,
          avatarUrl: t.avatarUrl,
          isCoach: false,
        ),
      );
    }
    for (final p in people) {
      add(
        _Candidate(
          userId: p.userId,
          displayName: p.displayName,
          handle: p.handle,
          avatarUrl: p.avatarUrl,
          isCoach: false,
        ),
      );
    }
    return out;
  }
}

class _CandidateRow extends StatelessWidget {
  const _CandidateRow(this.c, {required this.onTap});

  final _Candidate c;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
      leading: _Avatar(url: c.avatarUrl),
      title: Text(
        c.displayName,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: const TextStyle(
          color: AppColors.fg,
          fontSize: 15,
          fontWeight: FontWeight.w600,
        ),
      ),
      subtitle: Text(
        c.handle,
        style: const TextStyle(color: AppColors.muted, fontSize: 12),
      ),
      trailing: c.isCoach
          ? Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.14),
                borderRadius: BorderRadius.circular(999),
              ),
              child: const Text(
                'Coach',
                style: TextStyle(
                  color: AppColors.primary,
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                ),
              ),
            )
          : null,
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({this.url});

  final String? url;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(10),
      child: SizedBox(
        width: 40,
        height: 40,
        child: url == null
            ? const _Fallback()
            : Image.network(
                url!,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const _Fallback(),
              ),
      ),
    );
  }
}

class _Fallback extends StatelessWidget {
  const _Fallback();

  @override
  Widget build(BuildContext context) => const ColoredBox(
    color: AppColors.surfaceRaised,
    child: Icon(Icons.person_rounded, color: AppColors.faint, size: 20),
  );
}

class _Empty extends StatelessWidget {
  const _Empty(this.message);

  final String message;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.all(24),
    child: Text(
      message,
      textAlign: TextAlign.center,
      style: const TextStyle(color: AppColors.muted),
    ),
  );
}
