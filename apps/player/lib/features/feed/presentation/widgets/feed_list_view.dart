import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/network/api_exception.dart';
import '../../../../core/router/app_routes.dart';
import '../../../../core/widgets/async_view.dart';
import '../../application/feed_provider.dart';
import '../../domain/feed_post.dart';
import 'feed_list_skeleton.dart';
import 'feed_post_card.dart';

/// One feed tab: pull-to-refresh over a list of [FeedPostCard]s. Like / save
/// are optimistic (handled by [FeedNotifier]); a failed write shows a snackbar.
class FeedListView extends ConsumerWidget {
  const FeedListView({required this.tab, super.key});

  final FeedTab tab;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final value = ref.watch(feedProvider(tab));
    final notifier = ref.read(feedProvider(tab).notifier);

    return RefreshIndicator(
      onRefresh: () => ref.refresh(feedProvider(tab).future),
      child: AsyncView<List<FeedPost>>(
        value: value,
        loading: const FeedListSkeleton(),
        onRetry: () => ref.invalidate(feedProvider(tab)),
        emptyMessage: switch (tab) {
          FeedTab.saved => 'Nothing saved yet.\nTap the bookmark on a post to keep it here.',
          FeedTab.team => 'No posts from your squad yet.',
          FeedTab.yours => 'Your feed is quiet.\nPublished challenges and shared results show up here.',
        },
        data: (posts) => ListView.builder(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(vertical: 6),
          itemCount: posts.length,
          itemBuilder: (context, i) {
            final post = posts[i];
            return FeedPostCard(
              post: post,
              onLike: () => _guard(context, () => notifier.toggleLike(post.id)),
              onSave: () => _guard(context, () => notifier.toggleSave(post.id)),
              onOpen: () =>
                  context.push(AppRoutes.challengeDetail(post.challenge.id)),
            );
          },
        ),
      ),
    );
  }

  Future<void> _guard(BuildContext context, Future<void> Function() action) async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      await action();
    } on ApiException catch (e) {
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(e.message)));
    }
  }
}
