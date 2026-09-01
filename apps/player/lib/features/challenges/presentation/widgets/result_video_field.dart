import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/network/api_exception.dart';
import '../../../../core/theme/app_colors.dart';
import '../../data/challenges_providers.dart';
import 'result_video_player.dart';

/// The Figma "Video documentation" box: tap to pick a video from the gallery,
/// which uploads to the API and reports the stored URL via [onChanged] (null
/// while empty / uploading / failed).
class ResultVideoField extends ConsumerStatefulWidget {
  const ResultVideoField({
    required this.challengeId,
    required this.onChanged,
    super.key,
  });

  final String challengeId;
  final ValueChanged<String?> onChanged;

  @override
  ConsumerState<ResultVideoField> createState() => _ResultVideoFieldState();
}

enum _Phase { empty, uploading, uploaded, error }

class _ResultVideoFieldState extends ConsumerState<ResultVideoField> {
  _Phase _phase = _Phase.empty;
  String? _uploadedUrl;
  String? _error;

  Future<void> _start() async {
    if (_phase == _Phase.uploading) return;
    final source = await _chooseSource();
    if (source != null) await _pick(source);
  }

  Future<ImageSource?> _chooseSource() {
    return showModalBottomSheet<ImageSource>(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.videocam_rounded, color: AppColors.fg),
              title: const Text(
                'Record a video',
                style: TextStyle(color: AppColors.fg),
              ),
              onTap: () => Navigator.pop(context, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(
                Icons.photo_library_rounded,
                color: AppColors.fg,
              ),
              title: const Text(
                'Choose from gallery',
                style: TextStyle(color: AppColors.fg),
              ),
              onTap: () => Navigator.pop(context, ImageSource.gallery),
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Future<void> _pick(ImageSource source) async {
    final XFile? picked;
    try {
      picked = await ImagePicker().pickVideo(source: source);
    } catch (_) {
      setState(() {
        _phase = _Phase.error;
        _error = source == ImageSource.camera
            ? 'Could not open the camera'
            : 'Could not open the gallery';
      });
      return;
    }
    if (picked == null) return;

    setState(() {
      _phase = _Phase.uploading;
      _uploadedUrl = null;
      _error = null;
    });
    widget.onChanged(null);

    try {
      final url = await ref
          .read(challengesRepositoryProvider)
          .uploadResultVideo(widget.challengeId, picked.path);
      if (!mounted) return;
      setState(() {
        _phase = _Phase.uploaded;
        _uploadedUrl = url;
      });
      widget.onChanged(url);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _phase = _Phase.error;
        _error = e.message;
      });
      widget.onChanged(null);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text(
          'Video documentation',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppColors.tabInactive, fontSize: 16),
        ),
        const SizedBox(height: 12),
        if (_phase == _Phase.uploaded && _uploadedUrl != null)
          _preview(_uploadedUrl!)
        else
          InkWell(
            onTap: _start,
            borderRadius: BorderRadius.circular(4),
            child: Container(
              height: 160,
              width: double.infinity,
              decoration: BoxDecoration(
                color: AppColors.discFill,
                borderRadius: BorderRadius.circular(4),
                border: _phase == _Phase.error
                    ? Border.all(color: AppColors.danger)
                    : null,
              ),
              child: Center(child: _content()),
            ),
          ),
      ],
    );
  }

  /// After upload: an actual playable preview + a "replace" affordance (the
  /// player owns its own taps, so it can't sit inside the pick-InkWell).
  Widget _preview(String url) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ResultVideoPlayer(url: url, height: 160),
        Align(
          alignment: Alignment.centerRight,
          child: TextButton.icon(
            onPressed: _start,
            icon: const Icon(Icons.refresh_rounded, size: 18),
            label: const Text('Replace video'),
            style: TextButton.styleFrom(
              foregroundColor: AppColors.muted,
              padding: EdgeInsets.zero,
              minimumSize: const Size(0, 36),
              tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
          ),
        ),
      ],
    );
  }

  Widget _content() {
    switch (_phase) {
      case _Phase.empty:
        // Figma: a 30x24 movie-camera glyph.
        return const SizedBox(
          width: 40,
          height: 40,
          child: FittedBox(
            fit: BoxFit.fill,
            child: Icon(Icons.video_call_rounded, color: AppColors.tabInactive),
          ),
        );
      case _Phase.uploading:
        return const Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: 26,
              height: 26,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            SizedBox(height: 10),
            Text('Uploading…', style: TextStyle(color: AppColors.muted)),
          ],
        );
      case _Phase.uploaded:
        // Rendered as a playable preview by `_preview()`, not here.
        return const SizedBox.shrink();
      case _Phase.error:
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.error_outline_rounded,
              size: 40,
              color: AppColors.danger,
            ),
            const SizedBox(height: 8),
            Text(
              _error ?? 'Upload failed',
              textAlign: TextAlign.center,
              style: const TextStyle(color: AppColors.muted, fontSize: 12),
            ),
            const SizedBox(height: 2),
            const Text(
              'Tap to try again',
              style: TextStyle(color: AppColors.muted, fontSize: 12),
            ),
          ],
        );
    }
  }
}
