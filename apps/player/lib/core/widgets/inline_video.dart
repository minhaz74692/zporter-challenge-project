import 'package:flutter/material.dart';

import '../../features/challenges/presentation/widgets/result_video_player.dart';
import '../theme/app_colors.dart';
import 'play_button.dart';

/// A rounded [aspectRatio] video frame that shows the shared green [PlayButton]
/// over a dark still; tapping it swaps in a [ResultVideoPlayer] that starts
/// playing **in place** — no new screen, no layout jump. Uploaded clips have no
/// generated poster (transcoding is out of scope), so the still is a plain
/// dark panel.
///
/// Used by the feed's result card and the Biography "Challenges" tab.
class InlineVideo extends StatefulWidget {
  const InlineVideo({
    required this.url,
    this.aspectRatio = 16 / 10,
    this.borderRadius = 12,
    super.key,
  });

  final String url;
  final double aspectRatio;
  final double borderRadius;

  @override
  State<InlineVideo> createState() => _InlineVideoState();
}

class _InlineVideoState extends State<InlineVideo> {
  bool _playing = false;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final height = constraints.maxWidth / widget.aspectRatio;
        return ClipRRect(
          borderRadius: BorderRadius.circular(widget.borderRadius),
          child: SizedBox(
            height: height,
            width: double.infinity,
            child: _playing
                ? ResultVideoPlayer(
                    url: widget.url,
                    height: height,
                    autoPlay: true,
                  )
                : ColoredBox(
                    color: AppColors.surfaceRaised,
                    child: Center(
                      child: PlayButton(
                        onTap: () => setState(() => _playing = true),
                      ),
                    ),
                  ),
          ),
        );
      },
    );
  }
}
