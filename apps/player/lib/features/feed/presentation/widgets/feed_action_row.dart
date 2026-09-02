import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

/// The ❤ · 💬 · 🔖 row under a feed post (Figma). Heart fills green when liked,
/// bookmark fills when saved; the comment icon is display-only in this slice
/// (no comment thread UI yet).
class FeedActionRow extends StatelessWidget {
  const FeedActionRow({
    required this.liked,
    required this.saved,
    required this.likeCount,
    required this.commentCount,
    required this.onLike,
    required this.onSave,
    super.key,
  });

  final bool liked;
  final bool saved;
  final int likeCount;
  final int commentCount;
  final VoidCallback onLike;
  final VoidCallback onSave;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        _Action(
          icon: liked ? Icons.favorite_rounded : Icons.favorite_border_rounded,
          color: liked ? AppColors.success : AppColors.muted,
          count: likeCount,
          onTap: onLike,
        ),
        const SizedBox(width: 18),
        _Action(
          icon: Icons.mode_comment_outlined,
          color: AppColors.muted,
          count: commentCount,
          onTap: null,
        ),
        const SizedBox(width: 18),
        _Action(
          icon: saved
              ? Icons.bookmark_rounded
              : Icons.bookmark_border_rounded,
          color: saved ? AppColors.accent : AppColors.muted,
          onTap: onSave,
        ),
      ],
    );
  }
}

class _Action extends StatelessWidget {
  const _Action({
    required this.icon,
    required this.color,
    required this.onTap,
    this.count,
  });

  final IconData icon;
  final Color color;
  final VoidCallback? onTap;
  final int? count;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Row(
        children: [
          Icon(icon, size: 22, color: color),
          if (count != null && count! > 0) ...[
            const SizedBox(width: 5),
            Text(
              '$count',
              style: const TextStyle(color: AppColors.muted, fontSize: 13),
            ),
          ],
        ],
      ),
    );
  }
}
