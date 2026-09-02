import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/util/formatters.dart';
import '../../../../core/widgets/play_button.dart';
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
    this.showDateBadge = true,
    this.showOverflow = true,
    this.topRadius = 0,
    this.overlayFooter,
    super.key,
  });

  final Challenge challenge;
  final CoverStatus coverStatus;
  final bool showMeta;

  /// Card only: the top-left start day/time (+ optional status disc). The feed's
  /// "Public Challenge" card drops it — just the photo, headline, ingress, dots.
  final bool showDateBadge;

  /// Card only: the top-right `⋮`. The feed card carries its own in the post
  /// header, so it suppresses this one.
  final bool showOverflow;

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

  /// Index of the slide currently playing inline (a raw-video slide the viewer
  /// tapped). `null` = every slide shows its poster + play button. YouTube never
  /// plays here — it still opens the in-app iframe page.
  int? _playingIndex;

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

  /// A play tap on slide [i]: raw video plays inline in place; YouTube opens the
  /// in-app iframe page (it can't render in a `VideoPlayer`).
  void _play(int i) {
    final item = _items[i];
    if (item.type == MediaKind.youtube) {
      _openVideo(item);
    } else {
      setState(() => _playingIndex = i);
    }
  }

  void _stopInline() => setState(() => _playingIndex = null);

  bool get _isPlayingVideo =>
      _playingIndex != null &&
      _playingIndex! < _items.length &&
      _items[_playingIndex!].type == MediaKind.video;

  /// The two full-bleed layers that replace the cover while a video plays: the
  /// poster (so there's never a blank gap / it's the fallback where the platform
  /// can't decode) and the player itself, tap-to-pause with a ✕ to collapse.
  List<Widget> _inlinePlayerLayers() {
    final item = _items[_playingIndex!];
    return [
      Positioned.fill(
        child: _CoverImage(
          url: item.resolvedThumbnail,
          fallbackUrl: item.fallbackThumbnail,
        ),
      ),
      Positioned.fill(
        child: ResultVideoPlayer(
          url: item.url,
          autoPlay: true,
          tapTogglesPlayback: true,
          dimBackground: false,
        ),
      ),
      Positioned(top: 8, right: 8, child: _CollapseButton(onTap: _stopInline)),
    ];
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
        MaterialPageRoute<void>(builder: (_) => YoutubePlayerPage(videoId: id)),
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
  double get _imageBandFraction => widget.challenge.hasVideoCover ? 0.35 : 0.33;

  @override
  Widget build(BuildContext context) {
    final items = _items;
    final showMeta = widget.showMeta;
    final radius = BorderRadius.vertical(
      top: Radius.circular(widget.topRadius),
    );

    // The inline video is layered *over* the PageView (see `_inlinePlayerLayers`),
    // not inside it — a `PageView` child fights the tap-to-pause gesture with its
    // own horizontal drag recogniser. While it plays, the PageView is frozen.
    final Widget media = items.isEmpty
        ? const _CoverPlaceholder()
        : PageView.builder(
            controller: _controller,
            physics: _playingIndex != null
                ? const NeverScrollableScrollPhysics()
                : null,
            onPageChanged: (i) => setState(() => _index = i),
            itemCount: items.length,
            itemBuilder: (context, i) => _Slide(
              item: items[i],
              onPlay: () => _play(i),
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
              if (dots != null && !_isPlayingVideo)
                // The detail panel is pulled up ~24px over the image bottom, so
                // lift the dots clear of it.
                Positioned(left: 0, right: 0, bottom: 30, child: dots),
              if (_isPlayingVideo) ..._inlinePlayerLayers(),
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
            if (widget.showDateBadge && !_isPlayingVideo)
              Positioned(
                left: 21,
                top: 24,
                child: _DateBadge(
                  challenge: widget.challenge,
                  status: widget.coverStatus,
                ),
              ),
            if (widget.showOverflow && !_isPlayingVideo)
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
            if (items.isNotEmpty &&
                items[_index].type != MediaKind.image &&
                !_isPlayingVideo)
              Positioned(
                // Nudged 20px below the band's centre line, per the Figma.
                top: 24,
                left: 0,
                right: 0,
                height: c.maxWidth * _imageBandFraction,
                child: Center(child: PlayButton(onTap: () => _play(_index))),
              ),
            // While a video plays it takes the whole card (over the scrim), with
            // a ✕ to return to the cover.
            if (_isPlayingVideo) ..._inlinePlayerLayers(),
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
          if (showPlayIcon) const Center(child: PlayButton()),
        ],
      ),
    );
  }
}

/// The small dark ✕ that returns an inline-playing cover to its poster. It sits
/// where the `⋮` overflow would be, so tapping it never collides with the
/// video's own control layer.
class _CollapseButton extends StatelessWidget {
  const _CollapseButton({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.black.withValues(alpha: 0.55),
      shape: const CircleBorder(),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: const Padding(
          padding: EdgeInsets.all(6),
          child: Icon(Icons.close_rounded, color: Colors.white, size: 18),
        ),
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
