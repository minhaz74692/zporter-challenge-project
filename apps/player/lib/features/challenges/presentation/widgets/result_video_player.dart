import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:video_player/video_player.dart';

import '../../../../core/theme/app_colors.dart';

const _speeds = <double>[1.0, 1.5, 2.0, 0.5];

String _fmtTime(Duration d) {
  final m = d.inMinutes.remainder(60);
  final s = d.inSeconds.remainder(60).toString().padLeft(2, '0');
  return '$m:$s';
}

String _fmtSpeed(double v) => v % 1 == 0 ? v.toStringAsFixed(0) : '$v';

/// Inline preview of a reported result video with a full control layer
/// (play/pause, scrub bar, elapsed/total time, mute, speed, fullscreen).
///
/// The frame is a fixed height and — when [fullBleed] — spans the full screen
/// width, ignoring the parent's horizontal padding. The video is
/// `BoxFit.cover`-scaled so there are never letterbox bars on the sides. Any
/// load failure degrades to a small "unavailable" placeholder.
class ResultVideoPlayer extends StatefulWidget {
  const ResultVideoPlayer({
    required this.url,
    this.height = 220,
    this.fullBleed = false,
    super.key,
  });

  final String url;
  final double height;
  final bool fullBleed;

  @override
  State<ResultVideoPlayer> createState() => _ResultVideoPlayerState();
}

class _ResultVideoPlayerState extends State<ResultVideoPlayer> {
  VideoPlayerController? _controller;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final controller = VideoPlayerController.networkUrl(Uri.parse(widget.url));
    try {
      await controller.initialize();
      await controller.setLooping(true);
      if (!mounted) {
        await _safeDispose(controller);
        return;
      }
      setState(() => _controller = controller);
    } catch (_) {
      // Codec failure, an unreachable URL, or (on an emulator) the platform
      // plugin never connecting — all degrade to the "unavailable" placeholder.
      await _safeDispose(controller);
      if (mounted) setState(() => _failed = true);
    }
  }

  /// `dispose()` on a controller that never finished initialising can itself
  /// throw a channel error — swallow it.
  static Future<void> _safeDispose(VideoPlayerController controller) async {
    try {
      await controller.dispose();
    } catch (_) {
      /* nothing left to clean up */
    }
  }

  @override
  void dispose() {
    final controller = _controller;
    if (controller != null) _safeDispose(controller);
    super.dispose();
  }

  Future<void> _openFullscreen(VideoPlayerController c) async {
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => _FullscreenVideoPage(controller: c),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final Widget inner;
    if (_failed) {
      inner = const Center(
        child: Text(
          'Video unavailable',
          style: TextStyle(color: AppColors.muted, fontSize: 13),
        ),
      );
    } else if (_controller == null) {
      inner = const Center(child: CircularProgressIndicator());
    } else {
      final c = _controller!;
      inner = _VideoSurface(
        controller: c,
        fit: BoxFit.cover,
        onFullscreen: () => _openFullscreen(c),
      );
    }

    final frame = ClipRRect(
      borderRadius:
          widget.fullBleed ? BorderRadius.zero : BorderRadius.circular(12),
      child: ColoredBox(color: Colors.black, child: inner),
    );

    if (!widget.fullBleed) {
      return SizedBox(
        height: widget.height,
        width: double.infinity,
        child: frame,
      );
    }

    // Break out of the parent's horizontal padding so the video touches both
    // screen edges. OverflowBox centres the wider child, so the bleed is
    // symmetric regardless of how much padding the parent applied.
    final screenWidth = MediaQuery.of(context).size.width;
    return SizedBox(
      height: widget.height,
      child: OverflowBox(
        minWidth: screenWidth,
        maxWidth: screenWidth,
        minHeight: widget.height,
        maxHeight: widget.height,
        child: frame,
      ),
    );
  }
}

/// The video texture + the tap-to-reveal control layer. Reused by the inline
/// player and the fullscreen page.
class _VideoSurface extends StatefulWidget {
  const _VideoSurface({
    required this.controller,
    required this.fit,
    this.onFullscreen,
    this.isFullscreen = false,
  });

  final VideoPlayerController controller;
  final BoxFit fit;
  final VoidCallback? onFullscreen;
  final bool isFullscreen;

  @override
  State<_VideoSurface> createState() => _VideoSurfaceState();
}

class _VideoSurfaceState extends State<_VideoSurface> {
  bool _visible = true;
  Timer? _hideTimer;

  @override
  void initState() {
    super.initState();
    _scheduleHide();
  }

  @override
  void dispose() {
    _hideTimer?.cancel();
    super.dispose();
  }

  void _scheduleHide() {
    _hideTimer?.cancel();
    _hideTimer = Timer(const Duration(seconds: 3), () {
      if (mounted && widget.controller.value.isPlaying) {
        setState(() => _visible = false);
      }
    });
  }

  /// Called after every control interaction: keep the bar up, and re-arm the
  /// auto-hide only while the video is playing.
  void _bump() {
    setState(() => _visible = true);
    if (widget.controller.value.isPlaying) {
      _scheduleHide();
    } else {
      _hideTimer?.cancel();
    }
  }

  void _toggle() {
    setState(() => _visible = !_visible);
    if (_visible) _scheduleHide();
  }

  @override
  Widget build(BuildContext context) {
    final c = widget.controller;
    final size = c.value.size;

    return GestureDetector(
      onTap: _toggle,
      behavior: HitTestBehavior.opaque,
      child: Stack(
        fit: StackFit.expand,
        children: [
          FittedBox(
            fit: widget.fit,
            clipBehavior: Clip.hardEdge,
            child: SizedBox(
              width: size.width <= 0 ? 16 : size.width,
              height: size.height <= 0 ? 9 : size.height,
              child: VideoPlayer(c),
            ),
          ),
          IgnorePointer(
            ignoring: !_visible,
            child: AnimatedOpacity(
              opacity: _visible ? 1 : 0,
              duration: const Duration(milliseconds: 150),
              child: _VideoControls(
                controller: c,
                onInteraction: _bump,
                onFullscreen: widget.onFullscreen,
                isFullscreen: widget.isFullscreen,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Stateless control bar — every button acts directly on [controller], so the
/// controller's value is the single source of truth for play state, volume and
/// speed. [onInteraction] lets the host re-arm its auto-hide timer.
class _VideoControls extends StatelessWidget {
  const _VideoControls({
    required this.controller,
    required this.onInteraction,
    this.onFullscreen,
    this.isFullscreen = false,
  });

  final VideoPlayerController controller;
  final VoidCallback onInteraction;
  final VoidCallback? onFullscreen;
  final bool isFullscreen;

  void _playPause() {
    controller.value.isPlaying ? controller.pause() : controller.play();
    onInteraction();
  }

  void _toggleMute() {
    controller.setVolume(controller.value.volume == 0 ? 1 : 0);
    onInteraction();
  }

  void _cycleSpeed() {
    final i = _speeds.indexOf(controller.value.playbackSpeed);
    controller.setPlaybackSpeed(_speeds[(i < 0 ? 0 : i + 1) % _speeds.length]);
    onInteraction();
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<VideoPlayerValue>(
      valueListenable: controller,
      builder: (context, value, _) {
        final muted = value.volume == 0;
        return ColoredBox(
          color: Colors.black.withValues(alpha: 0.32),
          child: Column(
            children: [
              Expanded(
                child: Center(
                  child: IconButton(
                    iconSize: 52,
                    color: Colors.white,
                    icon: Icon(
                      value.isPlaying
                          ? Icons.pause_circle_filled_rounded
                          : Icons.play_circle_fill_rounded,
                    ),
                    onPressed: _playPause,
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(12, 0, 4, 4),
                child: Row(
                  children: [
                    Text(
                      _fmtTime(value.position),
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                    ),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        child: VideoProgressIndicator(
                          controller,
                          allowScrubbing: true,
                          colors: const VideoProgressColors(
                            playedColor: AppColors.primary,
                            bufferedColor: Colors.white30,
                            backgroundColor: Colors.white24,
                          ),
                        ),
                      ),
                    ),
                    Text(
                      _fmtTime(value.duration),
                      style: const TextStyle(color: Colors.white, fontSize: 12),
                    ),
                    IconButton(
                      visualDensity: VisualDensity.compact,
                      color: Colors.white,
                      icon: Icon(
                        muted
                            ? Icons.volume_off_rounded
                            : Icons.volume_up_rounded,
                        size: 20,
                      ),
                      onPressed: _toggleMute,
                    ),
                    TextButton(
                      style: TextButton.styleFrom(
                        foregroundColor: Colors.white,
                        minimumSize: const Size(36, 36),
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                      ),
                      onPressed: _cycleSpeed,
                      child: Text(
                        '${_fmtSpeed(value.playbackSpeed)}×',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    if (onFullscreen != null)
                      IconButton(
                        visualDensity: VisualDensity.compact,
                        color: Colors.white,
                        icon: Icon(
                          isFullscreen
                              ? Icons.fullscreen_exit_rounded
                              : Icons.fullscreen_rounded,
                          size: 22,
                        ),
                        onPressed: onFullscreen,
                      ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

/// Fullscreen route: the same [controller], `contain`-fitted, in landscape.
class _FullscreenVideoPage extends StatefulWidget {
  const _FullscreenVideoPage({required this.controller});

  final VideoPlayerController controller;

  @override
  State<_FullscreenVideoPage> createState() => _FullscreenVideoPageState();
}

class _FullscreenVideoPageState extends State<_FullscreenVideoPage> {
  @override
  void initState() {
    super.initState();
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
    SystemChrome.setPreferredOrientations(const [
      DeviceOrientation.landscapeLeft,
      DeviceOrientation.landscapeRight,
    ]);
  }

  @override
  void dispose() {
    SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
    SystemChrome.setPreferredOrientations(const [DeviceOrientation.portraitUp]);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ratio = widget.controller.value.aspectRatio;
    return Scaffold(
      backgroundColor: Colors.black,
      body: Center(
        child: AspectRatio(
          aspectRatio: ratio <= 0 ? 16 / 9 : ratio,
          child: _VideoSurface(
            controller: widget.controller,
            fit: BoxFit.contain,
            isFullscreen: true,
            onFullscreen: () => Navigator.of(context).maybePop(),
          ),
        ),
      ),
    );
  }
}
