import 'package:flutter/material.dart';

import '../theme/app_colors.dart';

enum PillTone { grey, primary }

/// A rounded tag chip. Grey = equipment tags, solid blue = skill / collection
/// tags (matches the two pill rows on the Figma challenge card).
class Pill extends StatelessWidget {
  const Pill(this.label, {this.tone = PillTone.grey, super.key});

  final String label;
  final PillTone tone;

  @override
  Widget build(BuildContext context) {
    final background =
        tone == PillTone.primary ? AppColors.primary : AppColors.pillEquipment;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: AppColors.fg,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
