import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/network_providers.dart';
import '../domain/challenge.dart';

/// The signed-in player's club-mates — the prototype's stand-in for "friends",
/// so a result controller can be "your coach or your friend". From
/// `GET /users/teammates`.
///
/// Best-effort: any failure yields an empty list, and the controller picker
/// still works with just the creator + challenge participants.
final teammatesProvider = FutureProvider<List<CreatorSummary>>((ref) async {
  try {
    final res = await ref
        .watch(dioProvider)
        .get<List<dynamic>>('/users/teammates');
    return (res.data ?? const [])
        .map((e) => CreatorSummary.fromJson(e as Map<String, dynamic>))
        .toList(growable: false);
  } catch (_) {
    return const [];
  }
});
