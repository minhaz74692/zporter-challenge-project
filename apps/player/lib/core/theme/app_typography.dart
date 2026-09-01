import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'app_colors.dart';

/// Inter text theme — same family as the web app.
///
/// `google_fonts` fetches Inter on first launch and caches it; if that ever
/// needs to be offline-safe for the demo, bundle the `.ttf` files and switch
/// to `TextTheme` with `fontFamily: 'Inter'`.
abstract final class AppTypography {
  /// Top app-bar title. Figma spec is Gilroy 20 / 400 / +0.258 tracking;
  /// Gilroy isn't a Google font, so Inter is the substitute (as elsewhere).
  static TextStyle get appBarTitle => GoogleFonts.inter(
    fontSize: 20,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.258,
    height: 24 / 20,
    color: AppColors.fgStrong,
  );

  /// Category tab label — Figma "Text Tab" (Gilroy 14 / 400 / +1.2474 tracking).
  static TextStyle get tabLabel => GoogleFonts.inter(
    fontSize: 14,
    fontWeight: FontWeight.w400,
    letterSpacing: 1.2474,
    height: 17 / 14,
  );

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
