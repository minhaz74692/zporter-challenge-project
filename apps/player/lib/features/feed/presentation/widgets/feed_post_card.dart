import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/util/formatters.dart';
import '../../../../core/widgets/inline_video.dart';
import '../../../challenges/presentation/widgets/challenge_cover_header.dart';
import '../../../challenges/presentation/widgets/challenge_meta.dart';
import '../../domain/feed_post.dart';
import 'feed_action_row.dart';
import 'feed_poster_header.dart';

/// One post in the feed. Dispatches on [FeedPost.kind]:
/// - `challenge_published` → the embedded challenge card + an **Open** button
/// - `result_update` → headline + value + arena/date + the result video
class FeedPostCard extends StatelessWidget {
  const FeedPostCard({
    required this.post,
    required this.onLike,
    required this.onSave,
    required this.onOpen,
    super.key,
  });

  final FeedPost post;
  final VoidCallback onLike;
  final VoidCallback onSave;
  final VoidCallback onOpen;

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
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 14, 10, 12),
            child: FeedPosterHeader(author: post.author, postedAt: post.createdAt),
          ),
          if (post.isResultUpdate)
            _ResultBody(post: post)
          else
            _ChallengeBody(post: post, onOpen: onOpen),
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 12, 14, 14),
            child: FeedActionRow(
              liked: post.likedByMe,
              saved: post.savedByMe,
              likeCount: post.likeCount,
              commentCount: post.commentCount,
              onLike: onLike,
              onSave: onSave,
            ),
          ),
        ],
      ),
    );
  }
}

/// `challenge_published` — reuses the challenge card's own cover + meta rows.
class _ChallengeBody extends StatelessWidget {
  const _ChallengeBody({required this.post, required this.onOpen});

  final FeedPost post;
  final VoidCallback onOpen;

  @override
  Widget build(BuildContext context) {
    final c = post.challenge;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Feed variant: photo + headline + ingress + dots only — no date badge,
        // no cover ⋮ (that lives in the post header).
        ChallengeCoverHeader(
          challenge: c,
          showDateBadge: false,
          showOverflow: false,
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 12, 14, 0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              ChallengeStatsRow(c),
              const SizedBox(height: 12),
              ChallengeDatesRow(c),
              if (c.equipmentTags.isNotEmpty || c.collections.isNotEmpty) ...[
                const SizedBox(height: 12),
                ChallengePillRows(c),
              ],
              const SizedBox(height: 6),
              _DescriptionLink(onTap: onOpen),
              const SizedBox(height: 8),
              SizedBox(
                height: 44,
                child: ElevatedButton(onPressed: onOpen, child: const Text('Open')),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// The centred "Description ›" divider on the challenge card (Figma). Tapping
/// it opens the full challenge.
class _DescriptionLink extends StatelessWidget {
  const _DescriptionLink({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: const Padding(
        padding: EdgeInsets.symmetric(vertical: 8),
        child: Row(
          children: [
            Spacer(),
            Text(
              'Description',
              style: TextStyle(color: AppColors.muted, fontSize: 14),
            ),
            Spacer(),
            Icon(Icons.chevron_right_rounded, color: AppColors.muted, size: 20),
          ],
        ),
      ),
    );
  }
}

/// `result_update` — headline, the reported value, the arena / date, the video.
class _ResultBody extends StatelessWidget {
  const _ResultBody({required this.post});

  final FeedPost post;

  @override
  Widget build(BuildContext context) {
    final r = post.result;
    // Figma: "Location, 31/01/2023 at 18:15".
    final meta = r == null
        ? null
        : '${r.arena?.isNotEmpty == true ? r.arena : 'Location'}, '
              '${formatDmy(r.performedAt)} at ${formatTime(r.performedAt)}';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(14, 0, 14, 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.baseline,
                textBaseline: TextBaseline.alphabetic,
                children: [
                  Expanded(
                    child: Text(
                      post.challenge.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: AppColors.fgStrong,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  if (r != null) ...[
                    const SizedBox(width: 12),
                    Text(
                      r.display,
                      style: const TextStyle(
                        color: AppColors.fgStrong,
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ],
              ),
              if (meta != null) ...[
                const SizedBox(height: 4),
                Text(
                  meta,
                  style: const TextStyle(color: AppColors.muted, fontSize: 11),
                ),
              ],
              if (r?.awardedBadge != null) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Text(r!.awardedBadge!.icon,
                        style: const TextStyle(fontSize: 14)),
                    const SizedBox(width: 6),
                    Text(
                      'Earned ${r.awardedBadge!.name}',
                      style: const TextStyle(
                        color: AppColors.success,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
        if (r != null && r.videoUrl.isNotEmpty)
          Padding(
            padding: const EdgeInsets.fromLTRB(14, 6, 14, 4),
            child: InlineVideo(url: r.videoUrl),
          ),
      ],
    );
  }
}
