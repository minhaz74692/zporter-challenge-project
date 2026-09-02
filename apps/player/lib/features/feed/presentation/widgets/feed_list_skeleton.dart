import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/shimmer.dart';

/// Placeholder shown while a feed tab's first page loads. Each item mirrors
/// [FeedPostCard] — poster header, cover, two meta lines, an action row — so
/// the layout doesn't jump when the real posts arrive.
class FeedListSkeleton extends StatelessWidget {
  const FeedListSkeleton({this.count = 3, super.key});

  final int count;

  @override
  Widget build(BuildContext context) {
    return Shimmer(
      child: ListView(
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(vertical: 6),
        children: [for (var i = 0; i < count; i++) const _PostSkeleton()],
      ),
    );
  }
}

class _PostSkeleton extends StatelessWidget {
  const _PostSkeleton();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(12, 6, 12, 10),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSoft),
      ),
      clipBehavior: Clip.antiAlias,
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Poster header.
          Padding(
            padding: EdgeInsets.fromLTRB(14, 14, 14, 12),
            child: Row(
              children: [
                SkeletonBox(width: 40, height: 40, radius: 10),
                SizedBox(width: 10),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SkeletonBox(width: 140, height: 13),
                    SizedBox(height: 6),
                    SkeletonBox(width: 180, height: 10),
                  ],
                ),
              ],
            ),
          ),
          // Cover.
          AspectRatio(
            aspectRatio: 16 / 10,
            child: SkeletonBox(radius: 0),
          ),
          // Meta + action row.
          Padding(
            padding: EdgeInsets.fromLTRB(14, 12, 14, 14),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonBox(width: 200, height: 13),
                SizedBox(height: 8),
                SkeletonBox(width: 120, height: 10),
                SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    SkeletonBox(width: 22, height: 22, radius: 11),
                    SizedBox(width: 18),
                    SkeletonBox(width: 22, height: 22, radius: 11),
                    SizedBox(width: 18),
                    SkeletonBox(width: 22, height: 22, radius: 11),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
