import 'package:challenge/features/challenges/domain/challenge_enums.dart';
import 'package:challenge/features/challenges/domain/participant.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  Map<String, dynamic> submittedJson() => {
        'value': 1903,
        'unit': 'reps',
        'videoUrl': 'https://v/x.mp4',
        'performedAt': '2026-01-01T10:00:00.000Z',
        'controllerRef': '#Ref',
        'arena': 'Camp Nou',
        'submittedAt': '2026-01-01T11:00:00.000Z',
      };

  group('Participant.fromJson', () {
    test('parses states via the tolerant enum decoders', () {
      final p = Participant.fromJson({
        'userId': 'u1',
        'displayName': 'Neo',
        'handle': '#Neo1',
        'inviteState': 'accepted',
        'resultState': 'submitted',
        'rank': 2,
        'joinedAt': '2026-01-01T00:00:00.000Z',
        'submittedResult': submittedJson(),
        'respondedAt': '2026-01-02T00:00:00.000Z',
      });
      expect(p.inviteState, InviteState.accepted);
      expect(p.resultState, ResultState.submitted);
      expect(p.rank, 2);
      expect(p.submittedResult, isNotNull);
      expect(p.respondedAt, DateTime.utc(2026, 1, 2));
    });

    test('tolerates missing optional fields', () {
      final p = Participant.fromJson({
        'userId': 'u1',
        'displayName': 'Neo',
        'inviteState': 'invited',
        'resultState': 'pending',
        'joinedAt': '2026-01-01T00:00:00.000Z',
      });
      expect(p.handle, '');
      expect(p.club, isNull);
      expect(p.rank, isNull);
      expect(p.submittedResult, isNull);
      expect(p.respondedAt, isNull);
    });
  });

  test('SubmittedResult.fromJson keeps the raw value and omitted note stays null', () {
    final r = SubmittedResult.fromJson(submittedJson());
    expect(r.value, 1903);
    expect(r.unit, ResultUnit.reps);
    expect(r.arena, 'Camp Nou');
    expect(r.note, isNull);
    expect(r.shareToFeed, isFalse);
  });

  test('SubmittedResult.fromJson reads shareToFeed when present', () {
    final r = SubmittedResult.fromJson({...submittedJson(), 'shareToFeed': true});
    expect(r.shareToFeed, isTrue);
  });

  test('Participant.fromJson parses the awarded badge when present', () {
    final p = Participant.fromJson({
      'userId': 'u1',
      'displayName': 'Neo',
      'inviteState': 'accepted',
      'resultState': 'completed',
      'joinedAt': '2026-01-01T00:00:00.000Z',
      'awardedBadge': {
        'id': 'sharp-shooter',
        'name': 'Sharp Shooter',
        'icon': '🎯',
        'description': 'Nailed it',
      },
    });
    expect(p.awardedBadge?.name, 'Sharp Shooter');
    expect(p.awardedBadge?.icon, '🎯');
  });

  group('ParticipantSummary', () {
    ParticipantSummary summary(InviteState invite, ResultState result) =>
        ParticipantSummary(inviteState: invite, resultState: result);

    test('convenience getters reflect the two state machines', () {
      expect(summary(InviteState.accepted, ResultState.pending).hasAccepted, isTrue);
      expect(summary(InviteState.declined, ResultState.pending).hasDeclined, isTrue);
      expect(summary(InviteState.accepted, ResultState.pending).hasSubmitted, isFalse);
      expect(summary(InviteState.accepted, ResultState.submitted).hasSubmitted, isTrue);
      expect(summary(InviteState.accepted, ResultState.completed).hasSubmitted, isTrue);
    });

    test('copyWith overrides only the given fields and preserves rank/result', () {
      const base = ParticipantSummary(
        inviteState: InviteState.invited,
        resultState: ResultState.pending,
        rank: 5,
      );
      final next = base.copyWith(inviteState: InviteState.accepted);
      expect(next.inviteState, InviteState.accepted);
      expect(next.resultState, ResultState.pending);
      expect(next.rank, 5);
    });

    test('is value-equal for the same states', () {
      expect(
        summary(InviteState.accepted, ResultState.pending),
        summary(InviteState.accepted, ResultState.pending),
      );
    });
  });
}
