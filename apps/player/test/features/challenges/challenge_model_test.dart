import 'package:challenge/features/challenges/domain/challenge.dart';
import 'package:challenge/features/challenges/domain/challenge_enums.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../support/fixtures.dart';

void main() {
  group('Challenge.fromJson', () {
    test('parses the full list-row body from fixtures', () {
      final c = Challenge.fromJson(challengeJson());
      expect(c.id, 'c_1');
      expect(c.mainCategory, ChallengeMainCategory.technical);
      expect(c.resultType, ResultType.count);
      expect(c.scoringDirection, ScoringDirection.higherBetter);
      expect(c.collections, ['ballcontrol', 'shooting']);
      expect(c.equipmentTags, ['#Balls', '#Cones']);
      expect(c.creator, isNotNull);
      expect(c.creator!.displayName, 'Nicklas Jönsson');
    });

    test('defaults the soft fields when the API omits them', () {
      final c = Challenge.fromJson({
        'id': 'c_x',
        'title': 'Bare',
        'startAt': '2026-01-01T00:00:00.000Z',
        'deadline': '2026-02-01T00:00:00.000Z',
        'createdBy': 'u_coach',
        'createdAt': '2026-01-01T00:00:00.000Z',
      });
      expect(c.description, '');
      expect(c.collections, isEmpty);
      expect(c.equipmentTags, isEmpty);
      expect(c.durationMinutes, 0);
      expect(c.pointsToParticipate, 0);
      expect(c.likeCount, 0);
      expect(c.participantCount, 0);
      expect(c.creator, isNull);
      expect(c.mainCategory, ChallengeMainCategory.other);
    });

    test('coerces numeric strings/doubles to int where the field is an int', () {
      final c = Challenge.fromJson({
        ...challengeJson(),
        'durationMinutes': 15.0,
        'rewardPoints': 50.0,
      });
      expect(c.durationMinutes, 15);
      expect(c.rewardPoints, 50);
    });
  });

  group('hasEnded', () {
    test('is true when status is ended even if the deadline is in the future', () {
      final c = Challenge.fromJson({
        ...challengeJson(status: 'ended'),
        'deadline': '2999-01-01T00:00:00.000Z',
      });
      expect(c.hasEnded, isTrue);
    });

    test('is true when the deadline has passed regardless of status', () {
      final c = Challenge.fromJson({
        ...challengeJson(),
        'deadline': '2000-01-01T00:00:00.000Z',
      });
      expect(c.hasEnded, isTrue);
    });

    test('is false for an active challenge with a future deadline', () {
      final c = Challenge.fromJson({
        ...challengeJson(),
        'deadline': '2999-01-01T00:00:00.000Z',
      });
      expect(c.hasEnded, isFalse);
    });
  });

  test('Challenge equality is value-based (Equatable)', () {
    expect(Challenge.fromJson(challengeJson()), Challenge.fromJson(challengeJson()));
    expect(
      Challenge.fromJson(challengeJson(id: 'a')),
      isNot(Challenge.fromJson(challengeJson(id: 'b'))),
    );
  });

  group('media gallery', () {
    test('parses a media array with tolerant kind decoding', () {
      final c = Challenge.fromJson({
        ...challengeJson(),
        'media': [
          {'url': 'https://img/a.jpg', 'type': 'image'},
          {'url': 'https://v/b.mp4', 'type': 'video'},
          {'url': 'https://youtu.be/b1Dp2Yl3ARw', 'type': 'youtube', 'thumbnailUrl': 't'},
          {'url': 'https://x/c', 'type': 'weird'},
        ],
      });
      expect(c.media.map((m) => m.type).toList(), [
        MediaKind.image,
        MediaKind.video,
        MediaKind.youtube,
        MediaKind.image, // unknown → image
      ]);
      expect(c.galleryItems, c.media);
    });

    test('galleryItems falls back to the legacy fields when media is empty', () {
      final c = Challenge.fromJson({
        ...challengeJson(),
        'media': const [],
        'mediaImageUrl': 'https://img/cover.jpg',
        'mediaVideoUrl': 'https://v/clip.mp4',
      });
      expect(c.media, isEmpty);
      expect(c.galleryItems.map((m) => m.type).toList(),
          [MediaKind.image, MediaKind.video]);
      expect(c.galleryItems.first.url, 'https://img/cover.jpg');
    });

    test('a YouTube item derives an img.youtube.com thumbnail when none is sent', () {
      const item = MediaItem(
        url: 'https://www.youtube.com/watch?v=b1Dp2Yl3ARw',
        type: MediaKind.youtube,
      );
      expect(item.resolvedThumbnail,
          'https://img.youtube.com/vi/b1Dp2Yl3ARw/hqdefault.jpg');
    });
  });

  test('CreatorSummary.fromJson reads the trimmed creator shape', () {
    final creator = CreatorSummary.fromJson({
      'id': 'u_coach',
      'displayName': 'Coach',
      'handle': '#Coach1',
      'club': 'Maj FC',
    });
    expect(creator.club, 'Maj FC');
    expect(creator.avatarUrl, isNull);
    expect(creator.position, isNull);
  });
}
