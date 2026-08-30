import 'package:flutter/material.dart';

import 'core/theme/app_colors.dart';
import 'core/theme/app_spacing.dart';
import 'core/theme/app_theme.dart';

/// Root widget. Owns the [MaterialApp] and the app-wide theme.
///
/// Routing (go_router) and the auth gate are added in a later step; for now
/// this boots to a placeholder so the theme can be verified on device.
class ZporterChallengeApp extends StatelessWidget {
  const ZporterChallengeApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Zporter Challenges',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.dark,
      home: const _FoundationPlaceholder(),
    );
  }
}

class _FoundationPlaceholder extends StatelessWidget {
  const _FoundationPlaceholder();

  @override
  Widget build(BuildContext context) {
    final text = Theme.of(context).textTheme;
    return Scaffold(
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xxl),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Zporter Challenges', style: text.headlineMedium),
              const SizedBox(height: AppSpacing.sm),
              Text(
                'Foundation ready — theme, fonts, tokens.',
                style: text.bodyMedium?.copyWith(color: AppColors.muted),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
