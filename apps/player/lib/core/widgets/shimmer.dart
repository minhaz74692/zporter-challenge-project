import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// Sweeps a soft highlight band across its subtree. Because the band is a
/// mostly-transparent gradient composited with `srcATop`, every descendant
/// keeps its own colour and just picks up the moving sheen — so a skeleton
/// built from differently-shaded [SkeletonBox]es stays readable.
class Shimmer extends StatefulWidget {
  const Shimmer({required this.child, super.key});

  final Widget child;

  @override
  State<Shimmer> createState() => _ShimmerState();
}

class _ShimmerState extends State<Shimmer> with SingleTickerProviderStateMixin {
  late final AnimationController _controller = AnimationController(
    vsync: this,
    duration: const Duration(milliseconds: 1500),
  )..repeat();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      child: widget.child,
      builder: (context, child) {
        return ShaderMask(
          blendMode: BlendMode.srcATop,
          shaderCallback: (bounds) => LinearGradient(
            colors: [
              Colors.transparent,
              Colors.white.withValues(alpha: 0.09),
              Colors.transparent,
            ],
            stops: const [0.30, 0.5, 0.70],
            transform: _SlideGradient(_controller.value),
          ).createShader(bounds),
          child: child,
        );
      },
    );
  }
}

/// Slides the highlight band from fully off the left edge to fully off the right.
class _SlideGradient extends GradientTransform {
  const _SlideGradient(this.progress);

  final double progress;

  @override
  Matrix4 transform(Rect bounds, {TextDirection? textDirection}) =>
      Matrix4.translationValues(bounds.width * (progress * 3 - 1.5), 0, 0);
}

/// A single opaque placeholder block. Keeps its own [color] (the [Shimmer]
/// only adds a passing sheen), so stacking a lighter box on a darker one reads.
class SkeletonBox extends StatelessWidget {
  const SkeletonBox({
    this.width,
    this.height = 12,
    this.radius = 6,
    this.color = AppColors.surfaceRaised,
    super.key,
  });

  final double? width;
  final double height;
  final double radius;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(radius),
      ),
    );
  }
}
