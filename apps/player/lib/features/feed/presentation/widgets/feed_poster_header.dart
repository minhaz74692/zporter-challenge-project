import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/util/formatters.dart';
import '../../../challenges/domain/challenge.dart';

/// The post header (Figma "Feed" card): 40px rounded-square avatar, the poster's
/// name, and a `12m · SE/Stockholm` meta line, with an overflow affordance on
/// the right.
class FeedPosterHeader extends StatelessWidget {
  const FeedPosterHeader({
    required this.author,
    required this.postedAt,
    super.key,
  });

  final CreatorSummary author;
  final DateTime postedAt;

  @override
  Widget build(BuildContext context) {
    final metaParts = [
      formatRelative(postedAt),
      if (author.location != null) author.location!,
    ];

    return Row(
      children: [
        _Avatar(url: author.avatarUrl, name: author.displayName),
        const SizedBox(width: 10),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                author.displayName,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.fgStrong,
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 2),
              Row(
                children: [
                  const Icon(Icons.schedule_rounded,
                      size: 12, color: AppColors.muted),
                  const SizedBox(width: 4),
                  Flexible(
                    child: Text(
                      metaParts.join(' · '),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.muted,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const Icon(Icons.more_vert_rounded, color: AppColors.muted, size: 20),
      ],
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({required this.url, required this.name});

  final String? url;
  final String name;

  @override
  Widget build(BuildContext context) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(10),
      child: SizedBox(
        width: 40,
        height: 40,
        child: url != null && url!.isNotEmpty
            ? Image.network(url!, fit: BoxFit.cover, errorBuilder: _fallback)
            : _fallback(context, null, null),
      ),
    );
  }

  Widget _fallback(BuildContext context, Object? _, StackTrace? __) => ColoredBox(
    color: AppColors.surfaceOverlay,
    child: Center(
      child: Text(
        name.isNotEmpty ? name[0].toUpperCase() : '?',
        style: const TextStyle(color: AppColors.fg, fontWeight: FontWeight.w700),
      ),
    ),
  );
}
