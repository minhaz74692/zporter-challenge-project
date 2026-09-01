import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/util/formatters.dart';
import '../../domain/challenge.dart';
import 'result_video_player.dart';

/// The cover media shared by the challenge card and the detail screen.
///
/// A challenge's [Challenge.galleryItems] render as a swipeable `PageView` with
/// carousel dots. On the **card** ([showMeta] true) it also carries the dark
/// scrim, the date/time badge + optional completion check, the overflow menu
/// and the headline + ingress. On the **detail screen** ([showMeta] false) the
/// title lives in the app bar, so only the media + dots show.
class ChallengeCoverHeader extends StatefulWidget {
  const ChallengeCoverHeader({
    required this.challenge,
    this.showCheck = false,
    this.showMeta = true,
    super.key,
  });

  final Challenge challenge;
  final bool showCheck;
  final bool showMeta;

  @override
  State<ChallengeCoverHeader> createState() => _ChallengeCoverHeaderState();
}

class _ChallengeCoverHeaderState extends State<ChallengeCoverHeader> {
  final _controller = PageController();
  int _index = 0;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  List<MediaItem> get _items => widget.challenge.galleryItems;

  Future<void> _openVideo(MediaItem item) async {
    if (item.type == MediaKind.youtube) {
      await launchUrl(Uri.parse(item.url), mode: LaunchMode.externalApplication);
      return;
    }
    if (!mounted) return;
    await Navigator.of(context).push(
      MaterialPageRoute<void>(
        builder: (_) => Scaffold(
          backgroundColor: Colors.black,
          appBar: AppBar(backgroundColor: Colors.black),
          body: Center(
            child: ResultVideoPlayer(url: item.url, fullBleed: true),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final items = _items;
    final showMeta = widget.showMeta;

    return AspectRatio(
      aspectRatio: 16 / 9,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (items.isEmpty)
            const _CoverPlaceholder()
          else
            PageView.builder(
              controller: _controller,
              onPageChanged: (i) => setState(() => _index = i),
              itemCount: items.length,
              itemBuilder: (context, i) => _Slide(
                item: items[i],
                onPlay: () => _openVideo(items[i]),
              ),
            ),

          if (showMeta)
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

          if (showMeta)
            Positioned(
              left: 12,
              top: 12,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (widget.showCheck) const _CompletionCheck(),
                  if (widget.showCheck) const SizedBox(height: 10),
                  Text(
                    formatDayMonth(widget.challenge.startAt),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  Text(
                    formatTime(widget.challenge.startAt),
                    style: const TextStyle(
                      color: AppColors.success,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),

          if (showMeta)
            const Positioned(
              right: 6,
              top: 8,
              child: Icon(Icons.more_vert, color: Colors.white, size: 22),
            ),

          if (showMeta)
            Positioned(
              left: 16,
              right: 16,
              bottom: 12,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    widget.challenge.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      height: 1.15,
                    ),
                  ),
                  if (widget.challenge.ingress != null &&
                      widget.challenge.ingress!.isNotEmpty) ...[
                    const SizedBox(height: 2),
                    Text(
                      widget.challenge.ingress!,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(color: Colors.white70, fontSize: 13),
                    ),
                  ],
                  if (items.length >= 2) ...[
                    const SizedBox(height: 10),
                    Center(child: _CarouselDots(count: items.length, active: _index)),
                  ],
                ],
              ),
            ),

          if (!showMeta && items.length >= 2)
            Positioned(
              left: 0,
              right: 0,
              bottom: 12,
              child: Center(child: _CarouselDots(count: items.length, active: _index)),
            ),
        ],
      ),
    );
  }
}

/// One media slide: an image, or a poster + play button for a video / YouTube.
class _Slide extends StatelessWidget {
  const _Slide({required this.item, required this.onPlay});

  final MediaItem item;
  final VoidCallback onPlay;

  @override
  Widget build(BuildContext context) {
    if (item.type == MediaKind.image) {
      return _CoverImage(url: item.url);
    }
    return GestureDetector(
      onTap: onPlay,
      child: Stack(
        fit: StackFit.expand,
        children: [
          _CoverImage(url: item.resolvedThumbnail),
          const Center(child: _PlayButton()),
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
    if (url == null || url!.isEmpty) return const _CoverPlaceholder();
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
  const _CarouselDots({required this.count, required this.active});

  final int count;
  final int active;

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
