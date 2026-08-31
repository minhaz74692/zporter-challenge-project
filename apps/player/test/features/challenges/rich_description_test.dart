import 'package:challenge/features/challenges/presentation/widgets/rich_description.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_fonts/google_fonts.dart';

void main() {
  setUpAll(() => GoogleFonts.config.allowRuntimeFetching = false);

  Future<List<Text>> pumpTexts(WidgetTester tester, String src) async {
    await tester.pumpWidget(
      MaterialApp(home: Scaffold(body: RichDescription(src))),
    );
    return tester
        .widgetList<Text>(find.byType(Text))
        .toList(growable: false);
  }

  testWidgets('a "Heading:" line renders bold', (tester) async {
    final texts = await pumpTexts(tester, 'Equipment:\nA ball.');

    final heading = texts.firstWhere((t) => t.textSpan?.toPlainText() == 'Equipment:');
    expect(heading.style?.fontWeight, FontWeight.w700);
  });

  testWidgets('inline **bold** becomes a bold span', (tester) async {
    await pumpTexts(tester, 'Keep your back **straight** always.');

    final richText = tester.widget<RichText>(find.byType(RichText).first);
    final bold = _find(richText.text as TextSpan, 'straight');
    expect(bold?.style?.fontWeight, FontWeight.w700);
  });

  testWidgets('a "- " line renders with a bullet', (tester) async {
    await pumpTexts(tester, '- first\n- second');

    expect(find.textContaining('•'), findsNWidgets(2));
  });

  testWidgets('*italic* and ~~strike~~ get their decorations', (tester) async {
    await pumpTexts(tester, 'This is *slanted* and ~~gone~~.');
    final span = tester.widget<RichText>(find.byType(RichText).first).text as TextSpan;

    expect(_find(span, 'slanted')?.style?.fontStyle, FontStyle.italic);
    expect(_find(span, 'gone')?.style?.decoration, TextDecoration.lineThrough);
  });
}

TextSpan? _find(TextSpan root, String text) {
  TextSpan? hit;
  root.visitChildren((span) {
    if (span is TextSpan && span.text == text) {
      hit = span;
      return false;
    }
    return true;
  });
  return hit;
}
