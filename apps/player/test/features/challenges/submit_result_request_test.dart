import 'package:challenge/features/challenges/domain/submit_result_request.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  SubmitResultRequest build({Object value = 25, String? arena, String? note}) =>
      SubmitResultRequest(
        value: value,
        videoUrl: 'https://storage.test/v.mp4',
        performedAt: DateTime.utc(2026, 1, 2, 10, 30),
        controllerRef: '#CoachRef',
        arena: arena,
        note: note,
      );

  test('serialises the required fields with performedAt as a UTC ISO-8601 string', () {
    expect(build().toJson(), {
      'value': 25,
      'videoUrl': 'https://storage.test/v.mp4',
      'performedAt': '2026-01-02T10:30:00.000Z',
      'controllerRef': '#CoachRef',
    });
  });

  test('normalises a local performedAt to UTC', () {
    final local = DateTime(2026, 1, 2, 10, 30);
    final json = SubmitResultRequest(
      value: 1,
      videoUrl: 'v',
      performedAt: local,
      controllerRef: '#c',
    ).toJson();
    expect(json['performedAt'], local.toUtc().toIso8601String());
    expect((json['performedAt'] as String).endsWith('Z'), isTrue);
  });

  test('omits arena / note when null or empty, includes them when set', () {
    expect(build().toJson().containsKey('arena'), isFalse);
    expect(build(arena: '', note: '').toJson().containsKey('note'), isFalse);
    expect(build(arena: '', note: '').toJson().containsKey('arena'), isFalse);

    final full = build(arena: 'Camp Nou', note: 'windy').toJson();
    expect(full['arena'], 'Camp Nou');
    expect(full['note'], 'windy');
  });

  test('passes a boolean value through unchanged', () {
    expect(build(value: true).toJson()['value'], true);
  });
}
