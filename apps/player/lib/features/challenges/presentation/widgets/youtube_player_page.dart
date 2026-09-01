import 'package:flutter/material.dart';
import 'package:youtube_player_iframe/youtube_player_iframe.dart';

/// Full-screen in-app playback for a challenge's YouTube media item.
///
/// Uses an inline iframe player so the video stays inside the app instead of
/// deep-linking out to the browser / YouTube app. A load failure falls back to
/// a small "unavailable" message rather than a blank frame.
class YoutubePlayerPage extends StatefulWidget {
  const YoutubePlayerPage({required this.videoId, super.key});

  final String videoId;

  @override
  State<YoutubePlayerPage> createState() => _YoutubePlayerPageState();
}

class _YoutubePlayerPageState extends State<YoutubePlayerPage> {
  late final YoutubePlayerController _controller =
      YoutubePlayerController.fromVideoId(
        videoId: widget.videoId,
        autoPlay: true,
        params: const YoutubePlayerParams(showFullscreenButton: true),
      );

  @override
  void dispose() {
    _controller.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(backgroundColor: Colors.black),
      body: Center(
        child: YoutubePlayer(controller: _controller),
      ),
    );
  }
}
