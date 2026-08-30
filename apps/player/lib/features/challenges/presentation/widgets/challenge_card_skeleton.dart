import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/widgets/shimmer.dart';

/// Placeholder list shown while the first page of challenges loads. Each item
/// mirrors [ChallengeCard] section by section — full-bleed cover with the
/// check / date / headline placeholders, then the stat row, dates, two pill
/// rows, the description divider, the rating row and the Open button — so the
/// layout doesn't jump when the real data arrives.
class ChallengeListSkeleton extends StatelessWidget {
  const ChallengeListSkeleton({this.count = 3, super.key});

  final int count;

  @override
  Widget build(BuildContext context) {
    return Shimmer(
      child: ListView(
        physics: const NeverScrollableScrollPhysics(),
        padding: const EdgeInsets.only(top: 8, bottom: 24),
        children: [for (var i = 0; i < count; i++) const _CardSkeleton()],
      ),
    );
  }
}

class _CardSkeleton extends StatelessWidget {
  const _CardSkeleton();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [AppColors.cardTop, AppColors.cardBottom],
        ),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _CoverSkeleton(),
          Padding(
            padding: EdgeInsets.fromLTRB(16, 14, 16, 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _StatRowSkeleton(),
                SizedBox(height: 14),
                _StartEndSkeleton(),
                SizedBox(height: 14),
                _PillRowSkeleton(widths: [70, 58, 46]),
                SizedBox(height: 8),
                _PillRowSkeleton(widths: [74, 64, 60, 44]),
                SizedBox(height: 12),
                _DividerSkeleton(),
                SizedBox(height: 14),
                _RatingRowSkeleton(),
                SizedBox(height: 14),
                SkeletonBox(height: 46, radius: 10),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _CoverSkeleton extends StatelessWidget {
  const _CoverSkeleton();

  @override
  Widget build(BuildContext context) {
    return const AspectRatio(
      aspectRatio: 16 / 9,
      child: Stack(
        fit: StackFit.expand,
        children: [
          SkeletonBox(radius: 0, height: double.infinity, color: AppColors.surface),
          Positioned(
            left: 14,
            top: 14,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonBox(width: 40, height: 40, radius: 999),
                SizedBox(height: 10),
                SkeletonBox(width: 46, height: 11),
                SizedBox(height: 5),
                SkeletonBox(width: 34, height: 11),
              ],
            ),
          ),
          Positioned(
            right: 14,
            top: 14,
            child: SkeletonBox(width: 4, height: 18, radius: 2),
          ),
          Positioned(
            left: 16,
            right: 16,
            bottom: 16,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SkeletonBox(width: 210, height: 18),
                SizedBox(height: 8),
                SkeletonBox(width: 150),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatRowSkeleton extends StatelessWidget {
  const _StatRowSkeleton();

  @override
  Widget build(BuildContext context) {
    return const Row(
      children: [
        Expanded(child: _StatCellSkeleton()),
        SizedBox(width: 12),
        Expanded(child: _StatCellSkeleton()),
        SizedBox(width: 12),
        Expanded(child: _StatCellSkeleton()),
      ],
    );
  }
}

class _StatCellSkeleton extends StatelessWidget {
  const _StatCellSkeleton();

  @override
  Widget build(BuildContext context) {
    return const Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SkeletonBox(width: 44, height: 14),
        SizedBox(height: 6),
        SkeletonBox(width: 30, height: 10),
      ],
    );
  }
}

class _StartEndSkeleton extends StatelessWidget {
  const _StartEndSkeleton();

  @override
  Widget build(BuildContext context) {
    return const Row(
      children: [
        SkeletonBox(width: 130, height: 10),
        Spacer(),
        SkeletonBox(width: 130, height: 10),
      ],
    );
  }
}

class _PillRowSkeleton extends StatelessWidget {
  const _PillRowSkeleton({required this.widths});

  final List<double> widths;

  @override
  Widget build(BuildContext context) {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: [
        for (final w in widths)
          SkeletonBox(width: w, height: 24, radius: 999),
      ],
    );
  }
}

class _DividerSkeleton extends StatelessWidget {
  const _DividerSkeleton();

  @override
  Widget build(BuildContext context) {
    return const Row(
      children: [
        Expanded(child: SkeletonBox(height: 1, radius: 0)),
        SizedBox(width: 12),
        SkeletonBox(width: 86, height: 10),
        SizedBox(width: 12),
        Expanded(child: SkeletonBox(height: 1, radius: 0)),
      ],
    );
  }
}

class _RatingRowSkeleton extends StatelessWidget {
  const _RatingRowSkeleton();

  @override
  Widget build(BuildContext context) {
    return const Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            SkeletonBox(width: 16, height: 16, radius: 4),
            SizedBox(width: 4),
            SkeletonBox(width: 16, height: 16, radius: 4),
            SizedBox(width: 4),
            SkeletonBox(width: 16, height: 16, radius: 4),
            SizedBox(width: 4),
            SkeletonBox(width: 16, height: 16, radius: 4),
            SizedBox(width: 4),
            SkeletonBox(width: 16, height: 16, radius: 4),
          ],
        ),
        SkeletonBox(width: 18, height: 18, radius: 4),
      ],
    );
  }
}
