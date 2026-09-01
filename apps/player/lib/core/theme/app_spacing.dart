/// A 4-point spacing scale. Every gap, pad and inset in the app is one of
/// these — do not hand-pick pixel values in widgets.
abstract final class AppSpacing {
  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 16.0;
  static const xl = 20.0;
  static const xxl = 24.0;
  static const xxxl = 32.0;

  /// Standard horizontal screen inset (matches the Figma app frames).
  static const screenH = 16.0;
}

/// Corner radii, mirrored from the web tokens (`--radius-*`).
abstract final class AppRadii {
  static const button = 4.0; // primary CTA (Figma)
  static const control = 10.0; // inputs
  static const card = 14.0; // challenge cards
  static const panel = 20.0; // sheets, large containers
  static const pill = 999.0;
}
