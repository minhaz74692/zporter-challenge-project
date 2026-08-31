// Small date/number formatters. Kept hand-rolled (no `intl` dependency) — the
// app needs only these few shapes.

const _months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

String _pad2(int n) => n.toString().padLeft(2, '0');

/// `2023-12-01 at 18:00` — the challenge start/end row.
String formatDateAtTime(DateTime dt) {
  final d = dt.toLocal();
  return '${d.year}-${_pad2(d.month)}-${_pad2(d.day)} at ${_pad2(d.hour)}:${_pad2(d.minute)}';
}

/// `21-Feb` — the compact date badge on the cover.
String formatDayMonth(DateTime dt) {
  final d = dt.toLocal();
  return '${_pad2(d.day)}-${_months[d.month - 1]}';
}

/// `19:07` — the time under the date badge.
String formatTime(DateTime dt) {
  final d = dt.toLocal();
  return '${_pad2(d.hour)}:${_pad2(d.minute)}';
}

/// `01 / 12 / 2023` — the Add-result date field.
String formatDate(DateTime dt) {
  final d = dt.toLocal();
  return '${_pad2(d.day)} / ${_pad2(d.month)} / ${d.year}';
}

/// `05/12/2023` — the leaderboard "Last updated" line.
String formatDmy(DateTime dt) {
  final d = dt.toLocal();
  return '${_pad2(d.day)}/${_pad2(d.month)}/${d.year}';
}

/// `just now` / `12m` / `3h` / `5d` / `05/12/2023` — compact relative time.
String formatRelative(DateTime dt, {DateTime? now}) {
  final diff = (now ?? DateTime.now()).difference(dt);
  if (diff.inMinutes < 1) return 'just now';
  if (diff.inMinutes < 60) return '${diff.inMinutes}m';
  if (diff.inHours < 24) return '${diff.inHours}h';
  if (diff.inDays < 7) return '${diff.inDays}d';
  return formatDmy(dt);
}

/// `1 903` — a leaderboard score, space-grouped thousands.
String formatScore(num value) {
  final digits = value == value.roundToDouble()
      ? value.toInt().toString()
      : value.toString();
  final buffer = StringBuffer();
  final neg = digits.startsWith('-');
  final body = neg ? digits.substring(1) : digits;
  final dot = body.indexOf('.');
  final intPart = dot == -1 ? body : body.substring(0, dot);
  for (var i = 0; i < intPart.length; i++) {
    if (i != 0 && (intPart.length - i) % 3 == 0) buffer.write(' ');
    buffer.write(intPart[i]);
  }
  if (dot != -1) buffer.write(body.substring(dot));
  return '${neg ? '-' : ''}$buffer';
}

/// `8-12Y`, `8+`, `≤12`, or `All` — the age-range stat.
String formatAgeRange(int? from, int? to) {
  if (from == null && to == null) return 'All';
  if (from != null && to != null) return '$from-${to}Y';
  if (from != null) return '$from+';
  return '≤$to';
}
