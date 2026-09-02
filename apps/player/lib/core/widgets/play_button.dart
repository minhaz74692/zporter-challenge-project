import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// The video play affordance used everywhere a video can be started from a
/// still — the challenge-card cover and the feed's result card.
///
/// Figma "play_circle_outline": a ring + triangle in `#09E099`, no disc, no
/// shadow. When [onTap] is set the button owns its taps; otherwise an ancestor
/// `GestureDetector` does.
class PlayButton extends StatelessWidget {
  const PlayButton({this.onTap, this.size = 62, super.key});

  final VoidCallback? onTap;
  final double size;

  @override
  Widget build(BuildContext context) {
    final button = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.completed, width: 3),
      ),
      child: Icon(
        Icons.play_arrow_rounded,
        color: AppColors.completed,
        size: size * 0.55,
      ),
    );
    if (onTap == null) return button;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: button,
    );
  }
}
