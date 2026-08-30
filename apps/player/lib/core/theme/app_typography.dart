import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

/// Inter text theme — same family as the web app.
///
/// `google_fonts` fetches Inter on first launch and caches it; if that ever
/// needs to be offline-safe for the demo, bundle the `.ttf` files and switch
/// to `TextTheme` with `fontFamily: 'Inter'`.
abstract final class AppTypography {
  static TextTheme textTheme(TextTheme base) {
    final inter = GoogleFonts.interTextTheme(base);
    return inter
        .copyWith(
          headlineLarge: inter.headlineLarge?.copyWith(
            fontWeight: FontWeight.w700,
            letterSpacing: -0.5,
          ),
          headlineMedium: inter.headlineMedium?.copyWith(
            fontWeight: FontWeight.w700,
            letterSpacing: -0.3,
          ),
          titleLarge: inter.titleLarge?.copyWith(fontWeight: FontWeight.w600),
          titleMedium: inter.titleMedium?.copyWith(fontWeight: FontWeight.w600),
          labelLarge: inter.labelLarge?.copyWith(
            fontWeight: FontWeight.w600,
            letterSpacing: 0.2,
          ),
          bodyMedium: inter.bodyMedium?.copyWith(height: 1.45),
        )
        .apply(bodyColor: AppColors.fg, displayColor: AppColors.fg);
  }
}
