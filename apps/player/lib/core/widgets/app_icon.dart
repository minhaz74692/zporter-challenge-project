import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../theme/app_colors.dart';

/// The bundled SVG glyphs in `assets/icon/`. Referencing the enum instead of a
/// raw string keeps call sites typo-proof and the asset list in one place.
enum AppIconAsset {
  people('people'),
  alarm('alarm'),
  trophy('trophy'),
  order('order'), // sort-direction ⇅ in the filter bar
  sort('sort'); // filter ☰ in the filter bar

  const AppIconAsset(this._name);

  final String _name;

  String get path => 'assets/icon/$_name.svg';
}

/// A design-token-tinted SVG icon.
///
/// The asset's own `fill` is overridden with a [ColorFilter] so colour stays
/// owned by [AppColors] — the default is the blue badge accent Figma uses for
/// the challenge stat glyphs. [size] constrains the height; width follows the
/// glyph's own aspect ratio (so non-square glyphs like `order` aren't stretched).
class AppIcon extends StatelessWidget {
  const AppIcon(
    this.asset, {
    this.size = 20,
    this.color = AppColors.badge,
    super.key,
  });

  final AppIconAsset asset;
  final double size;
  final Color color;

  @override
  Widget build(BuildContext context) => SvgPicture.asset(
    asset.path,
    height: size,
    colorFilter: ColorFilter.mode(color, BlendMode.srcIn),
  );
}
