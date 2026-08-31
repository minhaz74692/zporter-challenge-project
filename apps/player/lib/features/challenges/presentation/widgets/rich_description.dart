import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

/// Renders the challenge instructions text.
///
/// The web creator writes plain text with light Markdown from the formatting
/// bar; this renders it: whole heading lines (short, ending in `:`) and
/// `**bold**` bold + bright, `*italic*` italic, `~~strike~~` struck,
/// `<u>underline</u>` underlined, and `- ` / `N. ` lines as list items.
class RichDescription extends StatelessWidget {
  const RichDescription(this.text, {super.key});

  final String text;

  static final _headingLine = RegExp(r'^.{1,48}:\s*$');
  static final _bullet = RegExp(r'^\s*[-*]\s+(.*)$');
  static final _numbered = RegExp(r'^\s*(\d+)\.\s+(.*)$');
  static final _inline = RegExp(
    r'\*\*(.+?)\*\*|~~(.+?)~~|<u>(.+?)</u>|\*(.+?)\*',
    dotAll: true,
  );

  static const _muted = TextStyle(
    color: AppColors.muted,
    fontSize: 14,
    height: 1.5,
  );
  static const _heading = TextStyle(
    color: AppColors.fg,
    fontSize: 14,
    fontWeight: FontWeight.w700,
    height: 1.5,
  );

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final line in text.split('\n'))
          if (line.trim().isEmpty)
            const SizedBox(height: 12)
          else
            _line(line),
      ],
    );
  }

  Widget _line(String line) {
    final bullet = _bullet.firstMatch(line);
    if (bullet != null) return _listRow('•  ', bullet.group(1)!);

    final numbered = _numbered.firstMatch(line);
    if (numbered != null) {
      return _listRow('${numbered.group(1)}.  ', numbered.group(2)!);
    }

    final base = _headingLine.hasMatch(line) ? _heading : _muted;
    return Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Text.rich(TextSpan(children: _spans(line, base)), style: base),
    );
  }

  Widget _listRow(String marker, String content) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 4, left: 2),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(marker, style: _muted),
          Expanded(
            child: Text.rich(
              TextSpan(children: _spans(content, _muted)),
              style: _muted,
            ),
          ),
        ],
      ),
    );
  }

  List<InlineSpan> _spans(String input, TextStyle base) {
    final spans = <InlineSpan>[];
    var cursor = 0;

    for (final m in _inline.allMatches(input)) {
      if (m.start > cursor) {
        spans.add(TextSpan(text: input.substring(cursor, m.start)));
      }
      if (m.group(1) != null) {
        spans.add(TextSpan(
          text: m.group(1),
          style: base.copyWith(
            color: AppColors.fg,
            fontWeight: FontWeight.w700,
          ),
        ));
      } else if (m.group(2) != null) {
        spans.add(TextSpan(
          text: m.group(2),
          style: base.copyWith(decoration: TextDecoration.lineThrough),
        ));
      } else if (m.group(3) != null) {
        spans.add(TextSpan(
          text: m.group(3),
          style: base.copyWith(decoration: TextDecoration.underline),
        ));
      } else if (m.group(4) != null) {
        spans.add(TextSpan(
          text: m.group(4),
          style: base.copyWith(fontStyle: FontStyle.italic),
        ));
      }
      cursor = m.end;
    }

    if (cursor < input.length) {
      spans.add(TextSpan(text: input.substring(cursor)));
    }
    return spans;
  }
}
