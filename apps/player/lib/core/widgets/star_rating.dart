import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// Read-only star rating in the Figma "two-layer" style: a solid white star
/// with a Zporter-green star of the same size nudged down-and-right on top of
/// it, so a full star shows white poking out top-left and green poking out
/// bottom-right. The green star's *outline* is always drawn — so the two-layer
/// silhouette reads the same in every tab, even at a 0 rating — while its solid
/// fill is clipped left-to-right by the fractional value, making any partial
/// rating (not just halves) exact.
class StarRating extends StatelessWidget {
  const StarRating(
    this.value, {
    this.size = 24,
    this.max = 5,
    this.spacing = 5,
    super.key,
  });

  final double value;
  final double size;
  final int max;

  /// Gap between stars (Figma pitch is 29px for a 24px star).
  final double spacing;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var i = 0; i < max; i++) ...[
          if (i > 0) SizedBox(width: spacing),
          _Star(fill: (value - i).clamp(0.0, 1.0), size: size),
        ],
      ],
    );
  }
}

class _Star extends StatelessWidget {
  const _Star({required this.fill, required this.size});

  /// 0 → green outline only, 1 → full green, in between → partial fill.
  final double fill;
  final double size;

  /// How far the green star is offset from the white outline, as a fraction of
  /// [size] (Figma ≈ 15%).
  static const _offsetFraction = 0.15;

  @override
  Widget build(BuildContext context) {
    final offset = size * _offsetFraction;
    return SizedBox(
      width: size + offset,
      height: size + offset,
      child: Stack(
        children: [
          // Layer 1 — solid white star, anchored top-left.
          Icon(Icons.star, size: size, color: AppColors.fgStrong),
          // Layer 2 — the green star, nudged down-and-right. Its outline is
          // always drawn so the two-layer look holds at a 0 rating; the solid
          // green fill on top is revealed left-to-right by [fill].
          Positioned(
            left: offset,
            top: offset,
            child: Stack(
              children: [
                Icon(
                  Icons.star_border,
                  size: size,
                  color: AppColors.completed,
                ),
                ClipRect(
                  clipper: _FractionClipper(fill),
                  child: Icon(
                    Icons.star,
                    size: size,
                    color: AppColors.completed,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FractionClipper extends CustomClipper<Rect> {
  const _FractionClipper(this.fraction);

  final double fraction;

  @override
  Rect getClip(Size size) =>
      Rect.fromLTWH(0, 0, size.width * fraction, size.height);

  @override
  bool shouldReclip(_FractionClipper oldClipper) =>
      oldClipper.fraction != fraction;
}
