import 'package:flutter/material.dart';

/// The Zporter wordmark (`assets/images/logo.png`) — orange mark + white
/// lettering, sized by [height]. The artwork already carries its own colours,
/// so it renders as-is on dark surfaces.
class AppLogo extends StatelessWidget {
  const AppLogo({this.height = 28, super.key});

  final double height;

  @override
  Widget build(BuildContext context) {
    return Image.asset(
      'assets/images/logo.png',
      height: height,
      fit: BoxFit.contain,
      semanticLabel: 'Zporter',
    );
  }
}
