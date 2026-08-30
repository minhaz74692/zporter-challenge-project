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

/// `8-12Y`, `8+`, `≤12`, or `All` — the age-range stat.
String formatAgeRange(int? from, int? to) {
  if (from == null && to == null) return 'All';
  if (from != null && to != null) return '$from-${to}Y';
  if (from != null) return '$from+';
  return '≤$to';
}
