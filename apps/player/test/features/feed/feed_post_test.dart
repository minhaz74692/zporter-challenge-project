import 'package:challenge/features/feed/domain/feed_post.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../support/fixtures.dart';

Map<String, dynamic> challengePostJson() => {
  'id': 'p1',
  'type': 'challenge_published',
  'author': {
    'id': 'u_coach',
    'displayName': 'Nicklas Jönsson',
    'handle': '#NicJon680305C',
    'country': 'SE',
    'city': 'Stockholm',
    'club': 'Maj FC',
  },
  'audience': 'public',
  'challenge': challengeJson(),
  'likeCount': 3,
  'commentCount': 1,
  'likedByMe': true,
  'savedByMe': false,
  'createdAt': '2026-09-01T12:00:00.000Z',
};

Map<String, dynamic> resultPostJson() => {
  'id': 'p2',
  'type': 'result_update',
  'author': {
    'id': 'u_player1',
    'displayName': 'Neo Jönsson',
    'handle': '#NeoJon070119',
  },
  'audience': 'public',
  'challenge': challengeJson(title: 'Bench Press Max'),
  'result': {
    'value': 120,
    'unit': 'kg',
    'videoUrl': 'https://v.test/clip.mp4',
    'arena': 'SATS Häggvik',
    'performedAt': '2026-01-31T18:15:00.000Z',
    'awardedBadge': {'id': 'b1', 'name': 'Iron Lifter', 'icon': '🏋️'},
  },
  'likeCount': 0,
  'commentCount': 0,
  'likedByMe': false,
  'savedByMe': true,
  'createdAt': '2026-09-02T08:00:00.000Z',
};

void main() {
  group('FeedPost.fromJson', () {
    test('parses a challenge_published post with its embedded challenge', () {
      final post = FeedPost.fromJson(challengePostJson());

      expect(post.kind, FeedPostKind.challengePublished);
      expect(post.isResultUpdate, isFalse);
      expect(post.challenge.id, 'c_1');
      expect(post.author.location, 'SE/Stockholm');
      expect(post.likedByMe, isTrue);
      expect(post.result, isNull);
    });

    test('parses a result_update post with value, arena and badge', () {
      final post = FeedPost.fromJson(resultPostJson());

      expect(post.kind, FeedPostKind.resultUpdate);
      expect(post.isResultUpdate, isTrue);
      expect(post.result!.display, '120 kg');
      expect(post.result!.arena, 'SATS Häggvik');
      expect(post.result!.awardedBadge!.name, 'Iron Lifter');
      expect(post.savedByMe, isTrue);
    });

    test('unknown type falls back to FeedPostKind.unknown', () {
      final post = FeedPost.fromJson({...challengePostJson(), 'type': 'weird'});
      expect(post.kind, FeedPostKind.unknown);
    });
  });

  group('optimistic copies', () {
    final base = FeedPost.fromJson(challengePostJson()); // liked, count 3

    test('withLike(false) decrements the count and clears the flag', () {
      final next = base.withLike(liked: false);
      expect(next.likedByMe, isFalse);
      expect(next.likeCount, 2);
    });

    test('withLike never drives the count below zero', () {
      final zero = FeedPost.fromJson({
        ...challengePostJson(),
        'likeCount': 0,
        'likedByMe': false,
      });
      expect(zero.withLike(liked: false).likeCount, 0);
    });

    test('withSave toggles only the save flag', () {
      final next = base.withSave(saved: true);
      expect(next.savedByMe, isTrue);
      expect(next.likeCount, base.likeCount);
    });
  });
}
