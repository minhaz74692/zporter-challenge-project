import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// The dark content panel used by every challenge-detail tab: the Figma
/// `#13161A → #0D0F12` vertical gradient with a rounded top, clipped so
/// scrolled content stays inside the corners.
class GradientPanel extends StatelessWidget {
  const GradientPanel({
    required this.child,
    this.padding,
    this.topRadius = 24,
    super.key,
  });

  final Widget child;
  final EdgeInsetsGeometry? padding;
  final double topRadius;

  @override
  Widget build(BuildContext context) {
    return Container(
      clipBehavior: Clip.antiAlias,
      padding: padding,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [AppColors.cardTop, AppColors.cardBottom],
        ),
        borderRadius: BorderRadius.vertical(top: Radius.circular(topRadius)),
      ),
      child: child,
    );
  }
}
