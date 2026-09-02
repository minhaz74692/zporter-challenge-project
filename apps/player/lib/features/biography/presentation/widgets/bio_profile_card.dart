import 'package:flutter/material.dart';
import 'package:share_plus/share_plus.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/star_rating.dart';
import '../../../auth/domain/user.dart';
import 'bio_ring.dart';

/// The Biography identity card (Figma): a member-since date, the name + handle
/// with a share affordance, a stats grid wrapped around the rating ring, the
/// foot / weight row, and the friends / fans / follows counts.
class BioProfileCard extends StatelessWidget {
  const BioProfileCard({required this.user, super.key});

  final User user;

  String _pad(int n) => n.toString().padLeft(2, '0');

  String get _memberSince =>
      '${user.createdAt.year}-${_pad(user.createdAt.month)}-${_pad(user.createdAt.day)}';

  String? get _birthShort {
    final b = user.birthDate;
    if (b == null) return null;
    return '${_pad(b.day)}/${_pad(b.month)}/${_pad(b.year % 100)}';
  }

  String get _joinedYm =>
      '${user.createdAt.year}/${_pad(user.createdAt.month)}';

  static String _flag(String? cc) {
    if (cc == null || cc.length != 2) return '';
    return cc
        .toUpperCase()
        .codeUnits
        .map((c) => String.fromCharCode(0x1F1E6 + c - 65))
        .join();
  }

  void _share() {
    Share.share('Check out ${user.displayName} (${user.handle}) on Zporter');
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 4),
      decoration: const BoxDecoration(
        color: AppColors.surfaceDim,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Member-since — Figma: Gilroy 10 / 400 / 17, #818389.
          Text(
            _memberSince,
            style: const TextStyle(
              color: AppColors.tabInactive,
              fontSize: 10,
              fontWeight: FontWeight.w400,
              height: 17 / 10,
            ),
          ),
          const SizedBox(height: 5),
          // Name — Figma: Gilroy 24 / 800 / 20, #FFFFFF. The share icon sits on
          // the far left of the same line (Figma `left: 34`, `top: 107`).
          Stack(
            children: [
              SizedBox(
                width: double.infinity,
                child: Center(
                  child: Text(
                    user.displayName,
                    style: const TextStyle(
                      color: AppColors.fgStrong,
                      fontSize: 24,
                      fontWeight: FontWeight.w800,
                      height: 20 / 24,
                    ),
                  ),
                ),
              ),
              Positioned(
                left: 18, // 34px from the card edge − 16px content padding
                top: 0,
                bottom: 0,
                child: GestureDetector(
                  behavior: HitTestBehavior.opaque,
                  onTap: _share,
                  // Figma "Icon material-share" — the Material node-graph glyph.
                  child: const Icon(Icons.share,
                      color: AppColors.fgStrong, size: 20),
                ),
              ),
            ],
          ),
          const SizedBox(height: 9),
          // Handle — Figma: Gilroy 14 / 400 / 17, #818389.
          Text(
            user.handle,
            style: const TextStyle(
              color: AppColors.tabInactive,
              fontSize: 14,
              fontWeight: FontWeight.w400,
              height: 17 / 14,
            ),
          ),
          const SizedBox(height: 18),
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _Stat(user.position ?? '—', 'POSITION'),
                      _IconStat(
                        leading: _ClubBadge(user.club),
                        text: _joinedYm,
                      ),
                      _Stat(user.marketValue ?? '—', 'VALUE'),
                    ],
                  ),
                ),
                _RatingRing(user: user),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _Stat(user.age?.toString() ?? '—', 'AGE', end: true),
                      _IconStat(
                        leading: _FlagBadge(user.country),
                        text: _birthShort ?? '—',
                        end: true,
                      ),
                      _Stat(
                        user.heightCm != null ? '${user.heightCm}cm' : '—',
                        'HEIGHT',
                        end: true,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _Stat(user.foot?.label ?? '—', 'FOOT'),
              _Stat(
                user.weightKg != null ? '${user.weightKg}kg' : '—',
                'WEIGHT',
                end: true,
              ),
            ],
          ),
          const SizedBox(height: 14),
          const Divider(color: AppColors.border, height: 1),
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _Count(Icons.people_outline, user.friendsCount ?? 0, 'Friends'),
                _Count(Icons.favorite_border, user.fansCount ?? 0, 'Fans'),
                _Count(Icons.remove_red_eye_outlined, user.followsCount ?? 0,
                    'Follows'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RatingRing extends StatelessWidget {
  const _RatingRing({required this.user});

  final User user;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 2),
      child: BioRing(
        avatar: _Avatar(url: user.avatarUrl, name: user.displayName),
        overlay: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Figma "Group 616" — 4-star two-layer row (white behind, green front).
            StarRating(user.ratingStars, max: 4, size: 14, spacing: 3),
            const SizedBox(height: 1),
            // Figma "75%" — Gilroy 16 / 400 / 30, #FFFFFF, centred.
            Text(
              '${user.ratingPercent ?? 0}%',
              style: const TextStyle(
                color: AppColors.fgStrong,
                fontSize: 16,
                fontWeight: FontWeight.w400,
                height: 30 / 16,
              ),
            ),
          ],
        ),
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

  Widget _fallback(BuildContext context, Object? _, StackTrace? __) => ColoredBox(
    color: AppColors.surfaceOverlay,
    child: Center(
      child: Text(
        name.isNotEmpty ? name[0].toUpperCase() : '?',
        style: const TextStyle(
          color: AppColors.fg,
          fontSize: 34,
          fontWeight: FontWeight.w700,
        ),
      ),
    ),
  );
}

/// A value over a small caps label — the recurring Biography stat.
/// Figma: value Gilroy 18 / 700 / 22 #FFFFFF; label Gilroy 11 / 700 / 17 #818389.
class _Stat extends StatelessWidget {
  const _Stat(this.value, this.label, {this.end = false});

  final String value;
  final String label;
  final bool end;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment:
          end ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [
        Text(
          value,
          style: const TextStyle(
            color: AppColors.fgStrong,
            fontSize: 18,
            fontWeight: FontWeight.w700,
            height: 22 / 18,
          ),
        ),
        Text(
          label,
          style: const TextStyle(
            color: AppColors.tabInactive,
            fontSize: 11,
            fontWeight: FontWeight.w700,
            height: 17 / 11,
          ),
        ),
      ],
    );
  }
}

/// A leading glyph (club crest / flag) above a small value — the "since" /
/// birth-date cells beside the ring. Value: Gilroy 11 / 700 / 17 #818389.
class _IconStat extends StatelessWidget {
  const _IconStat({required this.leading, required this.text, this.end = false});

  final Widget leading;
  final String text;
  final bool end;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment:
          end ? CrossAxisAlignment.end : CrossAxisAlignment.start,
      children: [
        leading,
        const SizedBox(height: 4),
        Text(
          text,
          style: const TextStyle(
            color: AppColors.tabInactive,
            fontSize: 11,
            fontWeight: FontWeight.w700,
            height: 17 / 11,
          ),
        ),
      ],
    );
  }
}

/// A 28px round club crest — an initials disc (we have no logo asset).
class _ClubBadge extends StatelessWidget {
  const _ClubBadge(this.club);

  final String? club;

  String get _initials {
    final words = (club ?? '').trim().split(RegExp(r'\s+'));
    final letters = words.where((w) => w.isNotEmpty).map((w) => w[0]).take(2);
    return letters.join().toUpperCase();
  }

  @override
  Widget build(BuildContext context) => Container(
    width: 28,
    height: 28,
    alignment: Alignment.center,
    decoration: const BoxDecoration(
      color: AppColors.surfaceOverlay,
      shape: BoxShape.circle,
    ),
    child: Text(
      _initials.isEmpty ? '—' : _initials,
      style: const TextStyle(
        color: AppColors.fg,
        fontSize: 10,
        fontWeight: FontWeight.w800,
      ),
    ),
  );
}

/// A 28px round country flag from an ISO code (emoji — no round-crop asset).
class _FlagBadge extends StatelessWidget {
  const _FlagBadge(this.code);

  final String? code;

  @override
  Widget build(BuildContext context) {
    final flag = BioProfileCard._flag(code);
    return SizedBox(
      width: 28,
      height: 28,
      child: Center(
        child: Text(flag, style: const TextStyle(fontSize: 22)),
      ),
    );
  }
}

/// Figma social counts: number Gilroy 16 / 400 / 22 #FFFFFF; label 14 / 400 / 17
/// #818389; icon 24px #818389.
class _Count extends StatelessWidget {
  const _Count(this.icon, this.count, this.label);

  final IconData icon;
  final int count;
  final String label;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: AppColors.tabInactive, size: 24),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '$count',
              style: const TextStyle(
                color: AppColors.fgStrong,
                fontSize: 16,
                fontWeight: FontWeight.w400,
                height: 22 / 16,
              ),
            ),
            Text(
              label,
              style: const TextStyle(
                color: AppColors.tabInactive,
                fontSize: 14,
                fontWeight: FontWeight.w400,
                height: 17 / 14,
              ),
            ),
          ],
        ),
      ],
    );
  }
}
