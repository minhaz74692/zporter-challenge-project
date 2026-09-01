import 'package:challenge/features/challenges/application/submit_result.dart';
import 'package:challenge/features/challenges/domain/challenge_enums.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../support/fake_challenges_repository.dart';

void main() {
  late FakeChallengesRepository repo;
  late SubmitResult submit;

  setUp(() {
    repo = FakeChallengesRepository();
    submit = SubmitResult(repo);
  });

  Future<void> run({
    ResultType type = ResultType.count,
    String rawValue = '25',
    bool toggle = false,
    String videoUrl = 'https://v.test/x.mp4',
    String controller = '#Ref123',
    bool shareToFeed = false,
  }) =>
      submit(
        challengeId: 'c1',
        resultType: type,
        rawValue: rawValue,
        toggleValue: toggle,
        videoUrl: videoUrl,
        controllerRef: controller,
        performedAt: DateTime.utc(2026, 8, 30, 9),
        arena: 'Malmo IP',
        shareToFeed: shareToFeed,
      );

  test('happy path submits the parsed value + trimmed fields', () async {
    await run();

    expect(repo.submitted, hasLength(1));
    final req = repo.submitted.single;
    expect(req.value, 25);
    expect(req.controllerRef, '#Ref123');
    expect(req.arena, 'Malmo IP');
  });

  test('missing video → the exact Figma copy', () async {
    expect(
      run(videoUrl: ''),
      throwsA(
        isA<ResultValidationException>().having(
          (e) => e.message,
          'message',
          'Video must be added to report Challenge',
        ),
      ),
    );
  });

  test('missing controller → the exact Figma copy', () async {
    expect(
      run(controller: '  '),
      throwsA(
        isA<ResultValidationException>().having(
          (e) => e.message,
          'message',
          'Controller must be added to report Challenge',
        ),
      ),
    );
  });

  test('an invalid value is rejected before any API call', () async {
    await expectLater(
      run(rawValue: 'not-a-number'),
      throwsA(isA<ResultValidationException>()),
    );
    expect(repo.submitted, isEmpty);
  });

  test('a boolean challenge submits the toggle', () async {
    await run(type: ResultType.boolean, toggle: true);
    expect(repo.submitted.single.value, true);
  });

  test('the shareToFeed flag reaches the request', () async {
    await run(shareToFeed: true);
    expect(repo.submitted.single.shareToFeed, isTrue);
  });
}
