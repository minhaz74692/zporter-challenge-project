import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

/// The Biography display-picture circle. The Figma gradient ring is disabled for
/// now; this is just the round [avatar] with [overlay] (the stars + "NN%") over
/// a bottom scrim.
class BioRing extends StatelessWidget {
  const BioRing({
    required this.avatar,
    this.overlay,
    this.diameter = 184,
    super.key,
  });

  final Widget avatar;
  final Widget? overlay;
  final double diameter;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: diameter,
      height: diameter,
      child: ClipOval(
        child: Stack(
          fit: StackFit.expand,
          children: [
            ColoredBox(color: AppColors.borderSoft, child: avatar),
            if (overlay != null) ...[
              // Figma: rgba(3,4,5,0) → #000 over the lower half.
              const Align(alignment: Alignment.bottomCenter, child: _Scrim()),
              Align(alignment: const Alignment(0, 0.8), child: overlay),
            ],
          ],
        ),
      ),
    );
  }
}

class _Scrim extends StatelessWidget {
  const _Scrim();

  @override
  Widget build(BuildContext context) => Container(
    height: 84,
    decoration: const BoxDecoration(
      gradient: LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [Color(0x00030405), Color(0xFF000000)],
      ),
    ),
  );
}
