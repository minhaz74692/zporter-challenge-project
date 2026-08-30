import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

/// Read-only 5-star rating in Zporter green, with half-star support.
class StarRating extends StatelessWidget {
  const StarRating(this.value, {this.size = 18, this.max = 5, super.key});

  final double value;
  final double size;
  final int max;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(max, (i) {
        final filled = value - i;
        final IconData icon;
        if (filled >= 0.75) {
          icon = Icons.star_rounded;
        } else if (filled >= 0.25) {
          icon = Icons.star_half_rounded;
        } else {
          icon = Icons.star_outline_rounded;
        }
        return Icon(icon, size: size, color: AppColors.success);
      }),
    );
  }
}
