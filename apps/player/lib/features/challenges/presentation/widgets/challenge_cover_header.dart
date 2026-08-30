import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/util/formatters.dart';
import '../../domain/challenge.dart';

/// The hero section of a challenge card: cover photo, dark scrim, the date /
/// time badge and optional completion check (top-left), the overflow menu
/// (top-right), an optional video play button (centre), and the
/// headline + ingress + carousel dots (bottom).
class ChallengeCoverHeader extends StatelessWidget {
  const ChallengeCoverHeader({
    required this.challenge,
    this.showCheck = false,
    super.key,
  });

  final Challenge challenge;
  final bool showCheck;

  int get _mediaCount =>
      (challenge.mediaImageUrl != null ? 1 : 0) +
      (challenge.mediaVideoUrl != null ? 1 : 0);

  @override
  Widget build(BuildContext context) {
    return AspectRatio(
      aspectRatio: 16 / 9,
      child: Stack(
        fit: StackFit.expand,
        children: [
          _CoverImage(url: challenge.mediaImageUrl),
          const DecoratedBox(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
                colors: [Colors.black87, Colors.transparent],
                stops: [0.0, 0.7],
              ),
            ),
          ),
          Positioned(
            left: 12,
            top: 12,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (showCheck) const _CompletionCheck(),
                if (showCheck) const SizedBox(height: 10),
                Text(
                  formatDayMonth(challenge.startAt),
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                Text(
                  formatTime(challenge.startAt),
                  style: const TextStyle(
                    color: AppColors.success,
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
          const Positioned(
            right: 6,
            top: 8,
            child: Icon(Icons.more_vert, color: Colors.white, size: 22),
          ),
          if (challenge.mediaVideoUrl != null) const Center(child: _PlayButton()),
          Positioned(
            left: 16,
            right: 16,
            bottom: 12,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  challenge.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    height: 1.15,
                  ),
                ),
                if (challenge.ingress != null &&
                    challenge.ingress!.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    challenge.ingress!,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                ],
                if (_mediaCount >= 2) ...[
                  const SizedBox(height: 10),
                  Center(child: _CarouselDots(count: _mediaCount)),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CoverImage extends StatelessWidget {
  const _CoverImage({this.url});

  final String? url;

  @override
  Widget build(BuildContext context) {
    if (url == null) return const _CoverPlaceholder();
    return Image.network(
      url!,
      fit: BoxFit.cover,
      loadingBuilder: (context, child, progress) =>
          progress == null ? child : const _CoverPlaceholder(),
      errorBuilder: (_, __, ___) => const _CoverPlaceholder(),
    );
  }
}

class _CoverPlaceholder extends StatelessWidget {
  const _CoverPlaceholder();

  @override
  Widget build(BuildContext context) => const ColoredBox(
    color: AppColors.surfaceRaised,
    child: Center(
      child: Icon(Icons.emoji_events_outlined, color: AppColors.faint, size: 44),
    ),
  );
}

class _CompletionCheck extends StatelessWidget {
  const _CompletionCheck();

  @override
  Widget build(BuildContext context) => Container(
    width: 40,
    height: 40,
    decoration: const BoxDecoration(
      color: AppColors.success,
      shape: BoxShape.circle,
    ),
    child: const Icon(Icons.check_rounded, color: Colors.white, size: 24),
  );
}

class _PlayButton extends StatelessWidget {
  const _PlayButton();

  @override
  Widget build(BuildContext context) => Container(
    width: 54,
    height: 54,
    decoration: BoxDecoration(
      color: Colors.black.withValues(alpha: 0.25),
      shape: BoxShape.circle,
      border: Border.all(color: AppColors.success, width: 3),
    ),
    child: const Icon(Icons.play_arrow_rounded, color: AppColors.success, size: 30),
  );
}

class _CarouselDots extends StatelessWidget {
  const _CarouselDots({required this.count});

  final int count;

  /// The image is always slide 0; if a video exists it's slide 1 and shown as
  /// active to hint "there's more here".
  int get active => count - 1;

  @override
  Widget build(BuildContext context) => Row(
    mainAxisAlignment: MainAxisAlignment.center,
    children: List.generate(count, (i) {
      return Container(
        margin: const EdgeInsets.symmetric(horizontal: 3),
        width: 7,
        height: 7,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: i == active
              ? AppColors.success
              : Colors.white.withValues(alpha: 0.4),
        ),
      );
    }),
  );
}
