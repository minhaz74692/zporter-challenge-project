import 'package:flutter/material.dart';

import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

enum PillTone { grey, primary }

/// A rounded tag chip — the Figma challenge-card tag rows. Grey = equipment
/// tags, solid blue = skill / collection tags. A 10px white label in a 20px-tall
/// fully-rounded chip with a soft drop shadow.
class Pill extends StatelessWidget {
  const Pill(this.label, {this.tone = PillTone.grey, super.key});

  final String label;
  final PillTone tone;

  @override
  Widget build(BuildContext context) {
    final background =
        tone == PillTone.primary ? AppColors.pillSkill : AppColors.pillEquipment;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 1.5),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(AppRadii.pill),
        boxShadow: const [
          // Figma: 0 1px 3px rgba(0, 0, 0, 0.2).
          BoxShadow(color: Color(0x33000000), offset: Offset(0, 1), blurRadius: 3),
        ],
      ),
      child: Text(
        label,
        style: const TextStyle(
          color: AppColors.fgStrong,
          fontSize: 10,
          fontWeight: FontWeight.w400,
          height: 17 / 10,
        ),
      ),
    );
  }
}
