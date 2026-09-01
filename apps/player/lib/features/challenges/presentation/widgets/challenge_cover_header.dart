import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/util/formatters.dart';
import '../../domain/challenge.dart';
import 'result_video_player.dart';
import 'youtube_player_page.dart';

/// The optional status marker on the card cover: a coloured check disc with the
/// start day/time tinted to match. `completed` (Figma green) on the Done tab,
/// `declined` (Figma red) on the Declined tab; `none` elsewhere — just the
/// green date, no disc.
enum CoverStatus { none, completed, declined }

/// The cover media shared by the challenge card and the detail screen.
///
/// A challenge's [Challenge.galleryItems] render as a swipeable `PageView` with
/// carousel dots. On the **card** ([showMeta] true) it also carries the dark
/// scrim, the date/time badge + optional [coverStatus] disc, the overflow menu
/// and the headline + ingress. On the **detail screen** ([showMeta] false) the
/// title lives in the app bar, so only the media + dots show.
class ChallengeCoverHeader extends StatefulWidget {
  const ChallengeCoverHeader({
    required this.challenge,
    this.coverStatus = CoverStatus.none,
    this.showMeta = true,
    this.topRadius = 0,
    this.overlayFooter,
    super.key,
  });

  final Challenge challenge;
  final CoverStatus coverStatus;
  final bool showMeta;

  /// Rounds the media's top corners (the card wants this; the detail screen,
  /// where the cover is full-bleed under the app bar, leaves it 0).
  final double topRadius;

  /// Extra content laid over the scrimmed bottom of the media, below the
  /// headline / ingress / dots (the card puts the stat row here so it sits on
  /// the image, per Figma). The media grows to make room for it.
  final Widget? overlayFooter;

  @override
  State<ChallengeCoverHeader> createState() => _ChallengeCoverHeaderState();
}

class _ChallengeCoverHeaderState extends State<ChallengeCoverHeader> {
  final _controller = PageController();
  int _index = 0;

  /// Cover proportions (width : height), Figma "360 × 284" — the same shape for
  /// image and video; the media always `BoxFit.cover`s the box.
  static const _coverAspect = 360 / 284;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  List<MediaItem> get _items => widget.challenge.galleryItems;

  void _goTo(int i) {
    _controller.animateToPage(
      i,
      duration: const Duration(milliseconds: 260),
      curve: Curves.easeOut,
    );
  }

  Future<void> _openVideo(MediaItem item) async {
    if (!mounted) return;

    // YouTube items play in-app via an inline iframe player; a raw video URL
    // plays in the shared `ResultVideoPlayer`. Neither leaves the app.
    if (item.type == MediaKind.youtube) {
      final id = MediaItem.youtubeId(item.url);
      if (id == null) {
        ScaffoldMessenger.of(context)
          ..hideCurrentSnackBar()
          ..showSnackBar(
            const SnackBar(content: Text('Could not open the video')),
          );
        return;
      }
      await Navigator.of(context).push(
        MaterialPageRoute<void>(
          builder: (_) => YoutubePlayerPage(videoId: id),
        ),
      );
      return;
    }

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

  /// Fraction of the cover width kept as clear media above the scrimmed content
  /// band on the card. Video covers keep more visible (down to the start/end
  /// dates) than image covers.
  double get _imageBandFraction => widget.challenge.hasVideoCover ? 0.28 : 0.33;

  @override
  Widget build(BuildContext context) {
    final items = _items;
    final showMeta = widget.showMeta;
    final radius = BorderRadius.vertical(
      top: Radius.circular(widget.topRadius),
    );

    final Widget media = items.isEmpty
        ? const _CoverPlaceholder()
        : PageView.builder(
            controller: _controller,
            onPageChanged: (i) => setState(() => _index = i),
            itemCount: items.length,
            itemBuilder: (context, i) => _Slide(
              item: items[i],
              onPlay: () => _openVideo(items[i]),
              // The card floats its own play button above the scrim (below);
              // the detail screen has no scrim, so the slide draws its own.
              showPlayIcon: !showMeta,
            ),
          );

    final dots = items.length >= 2
        ? Center(
            child: _CarouselDots(
              count: items.length,
              active: _index,
              onTap: _goTo,
            ),
          )
        : null;

    // Detail screen — plain aspect-ratio media, nothing overlaid but the dots.
    if (!showMeta) {
      return ClipRRect(
        borderRadius: radius,
        child: AspectRatio(
          aspectRatio: _coverAspect,
          child: Stack(
            fit: StackFit.expand,
            children: [
              media,
              if (dots != null)
                // The detail panel is pulled up ~24px over the image bottom, so
                // lift the dots clear of it.
                Positioned(left: 0, right: 0, bottom: 30, child: dots),
            ],
          ),
        ),
      );
    }

    // Card — the media is a full-bleed background; the headline / ingress / dots
    // / footer sit on its scrimmed lower part, and the cover grows with that
    // content (so an image card, which overlays more, is taller than a video
    // card that only overlays the dates).
    final overlay = Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 14, right: 1),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.challenge.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: AppColors.fgStrong,
                  fontSize: 20,
                  fontWeight: FontWeight.w400,
                  height: 30 / 20,
                ),
              ),
              if (widget.challenge.ingress != null &&
                  widget.challenge.ingress!.isNotEmpty) ...[
                const SizedBox(height: 2),
                Text(
                  widget.challenge.ingress!,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.tabInactive,
                    fontSize: 14,
                    fontWeight: FontWeight.w400,
                    height: 17 / 14,
                  ),
                ),
              ],
            ],
          ),
        ),
        if (dots != null) ...[const SizedBox(height: 7), dots],
        if (widget.overlayFooter != null) ...[
          const SizedBox(height: 16),
          widget.overlayFooter!,
        ],
      ],
    );

    return ClipRRect(
      borderRadius: radius,
      child: LayoutBuilder(
        builder: (context, c) => Stack(
          children: [
            Positioned.fill(child: media),
            // Figma "Linear Gradient": #030405 from transparent at the top,
            // fully opaque by 83.14% and held solid to the bottom.
            Positioned.fill(
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      AppColors.bg.withValues(alpha: 0),
                      AppColors.bg,
                      AppColors.bg,
                    ],
                    stops: const [0.0, 0.8314, 1.0],
                  ),
                ),
              ),
            ),
            Positioned(
              left: 21,
              top: 24,
              child: _DateBadge(
                challenge: widget.challenge,
                status: widget.coverStatus,
              ),
            ),
            const Positioned(
              right: 6,
              top: 8,
              child: Icon(Icons.more_vert, color: Colors.white, size: 22),
            ),
            // Sizing child: reserve a minimum image band, then flow the overlay.
            Padding(
              padding: EdgeInsets.only(top: c.maxWidth * _imageBandFraction),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(15, 0, 15, 12),
                child: overlay,
              ),
            ),
            // Play button floats above the scrim and every overlay, centred in
            // the clear poster band, so it reads crisply and a tap plays the
            // current video in-app.
            if (items.isNotEmpty && items[_index].type != MediaKind.image)
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                height: c.maxWidth * _imageBandFraction,
                child: Center(
                  child: _PlayButton(
                    onTap: () => _openVideo(items[_index]),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// One media slide: an image, or a poster (optionally with a centred play
/// button) for a video / YouTube. [showPlayIcon] is off on the card, which
/// floats its own play button above the scrim instead.
class _Slide extends StatelessWidget {
  const _Slide({
    required this.item,
    required this.onPlay,
    this.showPlayIcon = true,
  });

  final MediaItem item;
  final VoidCallback onPlay;
  final bool showPlayIcon;

  @override
  Widget build(BuildContext context) {
    if (item.type == MediaKind.image) {
      return _CoverImage(url: item.url);
    }
    return GestureDetector(
      // Opaque so a tap anywhere on the poster plays it — a bare `Image`
      // doesn't hit-test itself, so `deferToChild` would only catch the 54px
      // play button.
      behavior: HitTestBehavior.opaque,
      onTap: onPlay,
      child: Stack(
        fit: StackFit.expand,
        children: [
          _CoverImage(
            url: item.resolvedThumbnail,
            fallbackUrl: item.fallbackThumbnail,
          ),
          if (showPlayIcon) const Center(child: _PlayButton()),
        ],
      ),
    );
  }
}

class _CoverImage extends StatelessWidget {
  const _CoverImage({this.url, this.fallbackUrl});

  final String? url;

  /// Tried if [url] fails to load (e.g. a YouTube `hq720.jpg` that doesn't
  /// exist for that video).
  final String? fallbackUrl;

  @override
  Widget build(BuildContext context) {
    if (url == null || url!.isEmpty) return const _CoverPlaceholder();
    return Image.network(
      url!,
      fit: BoxFit.cover,
      loadingBuilder: (context, child, progress) =>
          progress == null ? child : const _CoverPlaceholder(),
      errorBuilder: (_, __, ___) => fallbackUrl == null || fallbackUrl!.isEmpty
          ? const _CoverPlaceholder()
          : Image.network(
              fallbackUrl!,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => const _CoverPlaceholder(),
            ),
    );
  }
}

class _CoverPlaceholder extends StatelessWidget {
  const _CoverPlaceholder();

  @override
  Widget build(BuildContext context) => const ColoredBox(
    color: AppColors.surfaceRaised,
    child: Center(
      child: Icon(
        Icons.emoji_events_outlined,
        color: AppColors.faint,
        size: 44,
      ),
    ),
  );
}

/// Top-left overlay: the optional [status] check disc, then the start day +
/// time — green normally, red when the challenge was declined (Figma).
class _DateBadge extends StatelessWidget {
  const _DateBadge({required this.challenge, required this.status});

  final Challenge challenge;
  final CoverStatus status;

  @override
  Widget build(BuildContext context) {
    final color = status == CoverStatus.declined
        ? AppColors.declined
        : AppColors.completed;
    final style = TextStyle(
      color: color,
      fontSize: 14,
      fontWeight: FontWeight.w400,
      height: 17 / 14,
    );
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (status != CoverStatus.none) ...[
          _CheckDisc(color: color),
          const SizedBox(height: 9),
        ],
        Text(formatDayMonth(challenge.startAt), style: style),
        Text(formatTime(challenge.startAt), style: style),
      ],
    );
  }
}

/// A 40px filled disc with a check — the cover's completed / declined marker.
class _CheckDisc extends StatelessWidget {
  const _CheckDisc({required this.color});

  final Color color;

  @override
  Widget build(BuildContext context) => Container(
    width: 40,
    height: 40,
    decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    // Figma check colour #1E1F24 ≈ borderSoft.
    child: const Icon(
      Icons.check_rounded,
      color: AppColors.borderSoft,
      size: 24,
    ),
  );
}

class _PlayButton extends StatelessWidget {
  const _PlayButton({this.onTap});

  /// When set, the button handles its own taps (the card uses this so the
  /// floating button is what triggers playback); otherwise an ancestor
  /// `GestureDetector` owns the tap.
  final VoidCallback? onTap;

  // Figma "play_circle_outline" — 62px ring + triangle in #09E099. A darker
  // disc + drop shadow keep it legible over a bright poster or the scrim.
  @override
  Widget build(BuildContext context) {
    final button = Container(
      width: 62,
      height: 62,
      decoration: BoxDecoration(
        color: Colors.black.withValues(alpha: 0.45),
        shape: BoxShape.circle,
        border: Border.all(color: AppColors.completed, width: 3),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.35),
            blurRadius: 12,
          ),
        ],
      ),
      child: const Icon(
        Icons.play_arrow_rounded,
        color: AppColors.completed,
        size: 34,
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

class _CarouselDots extends StatelessWidget {
  const _CarouselDots({
    required this.count,
    required this.active,
    required this.onTap,
  });

  final int count;
  final int active;
  final ValueChanged<int> onTap;

  @override
  Widget build(BuildContext context) => Row(
    mainAxisAlignment: MainAxisAlignment.center,
    children: List.generate(count, (i) {
      return GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () => onTap(i),
        child: Padding(
          // 11px dot on a ~23px pitch (Figma) + a transparent hit area.
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
          child: Container(
            width: 11,
            height: 11,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: i == active ? AppColors.completed : AppColors.fgStrong,
            ),
          ),
        ),
      );
    }),
  );
}
