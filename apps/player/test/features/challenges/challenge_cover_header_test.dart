import 'package:challenge/features/challenges/domain/challenge.dart';
import 'package:challenge/features/challenges/presentation/widgets/challenge_cover_header.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../support/fixtures.dart';

void main() {
  setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);

  Challenge withMedia(List<MediaItem> media) =>
      Challenge.fromJson({...challengeJson(), 'media': media.map((m) => {
            'url': m.url,
            'type': m.type.apiValue,
            if (m.thumbnailUrl != null) 'thumbnailUrl': m.thumbnailUrl,
          }).toList()});

  Future<void> pump(WidgetTester tester, Challenge c, {bool showMeta = true}) =>
      tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ChallengeCoverHeader(challenge: c, showMeta: showMeta),
          ),
        ),
      );

  testWidgets('renders a PageView with one dot per media item', (tester) async {
    await pump(
      tester,
      withMedia(const [
        MediaItem(url: 'https://img/a.jpg', type: MediaKind.image),
        MediaItem(url: 'https://img/b.jpg', type: MediaKind.image),
        MediaItem(url: 'https://youtu.be/b1Dp2Yl3ARw', type: MediaKind.youtube),
      ]),
    );
    await tester.pump();

    expect(find.byType(PageView), findsOneWidget);
    // One 11×11 circular dot per media item.
    final dots = tester.widgetList<Container>(find.byType(Container)).where((c) {
      final d = c.decoration;
      return d is BoxDecoration &&
          d.shape == BoxShape.circle &&
          c.constraints == const BoxConstraints.tightFor(width: 11, height: 11);
    });
    expect(dots.length, 3);
  });

  testWidgets('tapping a dot animates to that slide', (tester) async {
    await pump(
      tester,
      withMedia(const [
        MediaItem(url: 'https://img/a.jpg', type: MediaKind.image),
        MediaItem(url: 'https://img/b.jpg', type: MediaKind.image),
        MediaItem(url: 'https://img/c.jpg', type: MediaKind.image),
      ]),
      showMeta: false,
    );
    await tester.pump();

    // Tap the last dot (GestureDetector wrapping an 11×11 circle).
    final dot = find.byWidgetPredicate((w) {
      return w is Container &&
          w.constraints == const BoxConstraints.tightFor(width: 11, height: 11);
    });
    await tester.tap(dot.last, warnIfMissed: false);
    await tester.pumpAndSettle();

    expect(tester.widget<PageView>(find.byType(PageView)).controller!.page, 2.0);
  });

  testWidgets('a video / YouTube slide shows the play button', (tester) async {
    await pump(
      tester,
      withMedia(const [
        MediaItem(
          url: 'https://youtu.be/b1Dp2Yl3ARw',
          type: MediaKind.youtube,
          thumbnailUrl: 'https://img.youtube.com/vi/b1Dp2Yl3ARw/hqdefault.jpg',
        ),
      ]),
    );
    await tester.pump();

    expect(find.byIcon(Icons.play_arrow_rounded), findsOneWidget);
  });

  testWidgets('no media → a placeholder, no PageView, no dots', (tester) async {
    final json = {...challengeJson(), 'media': const []}
      ..remove('mediaImageUrl')
      ..remove('mediaVideoUrl');
    await pump(tester, Challenge.fromJson(json));
    await tester.pump();

    expect(find.byType(PageView), findsNothing);
    expect(find.byIcon(Icons.emoji_events_outlined), findsOneWidget);
  });
}
