import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/router/app_routes.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../auth/application/auth_notifier.dart';
import '../../../auth/domain/user.dart';

/// The main navigation drawer (Figma "Menu"). Full-bleed over a black ground:
/// a close button, a bottom-anchored menu list with the current destination in
/// orange, a utility icon row, and the signed-in user card.
///
/// Only the destinations this prototype ships (`Feed`, `Challenges`) navigate;
/// the rest are shown for parity and report that they're out of scope.
class AppDrawer extends ConsumerWidget {
  const AppDrawer({super.key});

  static const _menu = <_MenuEntry>[
    _MenuEntry('Biographies', route: AppRoutes.biography),
    _MenuEntry('Dashboard'),
    _MenuEntry('Feed', route: AppRoutes.feed),
    _MenuEntry('Challenges', route: AppRoutes.home),
    _MenuEntry('Tests'),
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authNotifierProvider).valueOrNull;
    final location = GoRouterState.of(context).matchedLocation;

    return Drawer(
      width: MediaQuery.sizeOf(context).width,
      backgroundColor: AppColors.bg,
      elevation: 0,
      shape: const RoundedRectangleBorder(),
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
              child: Align(
                alignment: Alignment.centerLeft,
                child: _CircleButton(
                  icon: Icons.close_rounded,
                  onTap: () => Navigator.of(context).pop(),
                ),
              ),
            ),
            // The list sits at the bottom of the free space (scroll up for more).
            Expanded(
              child: SingleChildScrollView(
                reverse: true,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    for (final entry in _menu)
                      _MenuRow(
                        label: entry.label,
                        active: entry.route != null && entry.route == location,
                        // Only Feed / Challenges are live in this slice; the
                        // rest are shown for parity but inert.
                        onTap: entry.route == null
                            ? null
                            : () {
                                Navigator.of(context).pop();
                                context.go(entry.route!);
                              },
                      ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 18),
            _UtilityBar(
              onLogout: () => ref.read(authNotifierProvider.notifier).logout(),
              onBell: () {
                Navigator.of(context).pop();
                context.push(AppRoutes.notifications);
              },
            ),
            const SizedBox(height: 16),
            if (user != null) _ProfileCard(user: user),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }
}

class _MenuEntry {
  const _MenuEntry(this.label, {this.route});

  final String label;
  final String? route;
}

/// One large menu line. The active row gets a faint raised band with hairline
/// rules top and bottom and an orange label; the rest are dim grey.
class _MenuRow extends StatelessWidget {
  const _MenuRow({required this.label, required this.active, this.onTap});

  final String label;
  final bool active;

  /// `null` → the row is shown but not interactive.
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Container(
        height: 62,
        alignment: Alignment.centerLeft,
        padding: const EdgeInsets.only(left: 40),
        decoration: active
            ? const BoxDecoration(
                color: AppColors.surface,
                border: Border(
                  top: BorderSide(color: AppColors.border),
                  bottom: BorderSide(color: AppColors.border),
                ),
              )
            : null,
        child: Text(
          label,
          style: TextStyle(
            color: active ? AppColors.tabActive : AppColors.faint,
            fontSize: 22,
            fontWeight: FontWeight.w400,
            letterSpacing: 0.2,
          ),
        ),
      ),
    );
  }
}

/// The grey disc holding the close (X).
class _CircleButton extends StatelessWidget {
  const _CircleButton({required this.icon, required this.onTap});

  final IconData icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white.withValues(alpha: 0.16),
      shape: const CircleBorder(),
      clipBehavior: Clip.antiAlias,
      child: InkWell(
        onTap: onTap,
        child: SizedBox(
          width: 44,
          height: 44,
          child: Icon(icon, color: AppColors.fgStrong, size: 22),
        ),
      ),
    );
  }
}

/// The utility icon row: power (sign out) on the left, then chat / bell /
/// profile-card / help / settings. Only power + bell are wired in this slice.
class _UtilityBar extends StatelessWidget {
  const _UtilityBar({required this.onLogout, required this.onBell});

  final VoidCallback onLogout;
  final VoidCallback onBell;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 22),
      child: Row(
        children: [
          _BarIcon(Icons.power_settings_new_rounded, onTap: onLogout, size: 26),
          const Spacer(),
          const _BarIcon(Icons.chat_bubble_outline_rounded),
          const SizedBox(width: 22),
          _BarIcon(Icons.notifications_none_rounded, onTap: onBell),
          const SizedBox(width: 22),
          const _BarIcon(Icons.badge_rounded),
          const SizedBox(width: 22),
          const _BarIcon(Icons.help_outline_rounded),
          const SizedBox(width: 22),
          const _BarIcon(Icons.settings_outlined),
        ],
      ),
    );
  }
}

class _BarIcon extends StatelessWidget {
  const _BarIcon(this.icon, {this.onTap, this.size = 23});

  final IconData icon;
  final VoidCallback? onTap;
  final double size;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Icon(icon, color: AppColors.fgStrong, size: size),
    );
  }
}

/// The signed-in user card at the foot of the drawer.
class _ProfileCard extends StatelessWidget {
  const _ProfileCard({required this.user});

  final User user;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: AppColors.surfaceRaised,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: SizedBox(
              width: 64,
              height: 64,
              child: _Avatar(url: user.avatarUrl, name: user.displayName),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.displayName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: AppColors.fgStrong,
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 3),
                Row(
                  children: [
                    Flexible(
                      child: Text(
                        user.handle,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          color: AppColors.faint,
                          fontSize: 13,
                        ),
                      ),
                    ),
                    if (user.position != null && user.position!.isNotEmpty) ...[
                      const SizedBox(width: 10),
                      Text(
                        user.position!,
                        style: const TextStyle(
                          color: AppColors.faint,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          const Icon(
            Icons.chevron_right_rounded,
            color: AppColors.faint,
            size: 26,
          ),
        ],
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  const _Avatar({required this.url, required this.name});

  final String? url;
  final String name;

  @override
  Widget build(BuildContext context) {
    if (url != null && url!.isNotEmpty) {
      return Image.network(url!, fit: BoxFit.cover, errorBuilder: _fallback);
    }
    return _fallback(context, null, null);
  }

  Widget _fallback(BuildContext context, Object? _, StackTrace? __) =>
      ColoredBox(
        color: AppColors.surfaceOverlay,
        child: Center(
          child: Text(
            name.isNotEmpty ? name[0].toUpperCase() : '?',
            style: const TextStyle(
              color: AppColors.fg,
              fontSize: 22,
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
      );
}
