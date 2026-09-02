import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../auth/domain/user.dart';

/// The row of external social links at the foot of the Biography screen
/// (Figma). Brand-coloured rounded tiles; only platforms with a URL show.
/// Tapping opens the link in the browser / app.
///
/// (Real multi-colour brand logos would need bundled assets — out of scope for
/// this concept screen; the tiles use the brand colour + a short glyph.)
class BioSocialRow extends StatelessWidget {
  const BioSocialRow({required this.socials, super.key});

  final SocialLinks socials;

  static const _order = <_Brand>[
    _Brand('instagram', 'IG', Color(0xFFE1306C)),
    _Brand('facebook', 'f', Color(0xFF1877F2)),
    _Brand('twitter', 'X', Color(0xFF1DA1F2)),
    _Brand('whatsapp', 'W', Color(0xFF25D366)),
    _Brand('youtube', '▶', Color(0xFFFF0000)),
    _Brand('tiktok', '♪', Color(0xFFEE1D52)),
    _Brand('veo', 'veo', Color(0xFF2C6CF5)),
  ];

  @override
  Widget build(BuildContext context) {
    final tiles = [
      for (final b in _order)
        if ((socials[b.key] ?? '').isNotEmpty)
          _Tile(brand: b, url: socials[b.key]!),
    ];
    if (tiles.isEmpty) return const SizedBox.shrink();

    return Wrap(
      alignment: WrapAlignment.center,
      spacing: 12,
      runSpacing: 12,
      children: tiles,
    );
  }
}

class _Brand {
  const _Brand(this.key, this.glyph, this.color);

  final String key;
  final String glyph;
  final Color color;
}

class _Tile extends StatelessWidget {
  const _Tile({required this.brand, required this.url});

  final _Brand brand;
  final String url;

  Future<void> _open() async {
    final uri = Uri.tryParse(url);
    if (uri != null) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: _open,
      child: Container(
        width: 40,
        height: 40,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: brand.color,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Text(
          brand.glyph,
          style: const TextStyle(
            color: AppColors.fgStrong,
            fontSize: 15,
            fontWeight: FontWeight.w800,
          ),
        ),
      ),
    );
  }
}
