import 'dart:async';

import 'package:challenge/features/challenges/domain/challenge.dart';
import 'package:challenge/features/challenges/domain/challenge_detail.dart';
import 'package:challenge/features/challenges/domain/challenge_enums.dart';
import 'package:challenge/features/challenges/domain/challenges_repository.dart';
import 'package:challenge/features/challenges/domain/leaderboard_entry.dart';
import 'package:challenge/features/challenges/domain/participant.dart';
import 'package:challenge/features/challenges/domain/submit_result_request.dart';

/// Scriptable [ChallengesRepository] for `application/` + widget tests.
class FakeChallengesRepository implements ChallengesRepository {
  /// Rows returned per tab. Missing keys yield an empty list.
  final Map<ChallengeCategory, List<Challenge>> lists = {};
  Object? listError;

  /// When set, `list()` waits on this before returning — lets a test observe
  /// the loading state.
  Completer<void>? listGate;

  ChallengeDetail? detail;
  final List<String> accepted = [];
  final List<String> declined = [];

  /// When set, `accept()` / `decline()` throw it instead of recording.
  Object? respondError;

  List<Participant> participantRows = const [];
  List<LeaderboardEntry> leaderboardRows = const [];

  /// Recorded (challengeId, filePath); `uploadResultVideo` returns [videoUrl].
  final List<(String, String)> videoUploads = [];
  String videoUrl = 'https://videos.test/result.mp4';
  Object? videoUploadError;

  /// Recorded submitted requests; `submitResult` returns [submittedParticipant]
  /// or throws [submitError].
  final List<SubmitResultRequest> submitted = [];
  Object? submitError;
  Participant? submittedParticipant;

  @override
  Future<List<Challenge>> list(ChallengeCategory category) async {
    if (listGate != null) await listGate!.future;
    if (listError != null) throw listError!;
    return lists[category] ?? const [];
  }

  @override
  Future<ChallengeDetail> getById(String id) async => detail!;

  @override
  Future<void> accept(String id) async {
    if (respondError != null) throw respondError!;
    accepted.add(id);
  }

  @override
  Future<void> decline(String id) async {
    if (respondError != null) throw respondError!;
    declined.add(id);
  }

  @override
  Future<List<Participant>> participants(String id) async => participantRows;

  @override
  Future<List<LeaderboardEntry>> leaderboard(String id) async => leaderboardRows;

  @override
  Future<String> uploadResultVideo(String id, String filePath) async {
    if (videoUploadError != null) throw videoUploadError!;
    videoUploads.add((id, filePath));
    return videoUrl;
  }

  @override
  Future<Participant> submitResult(String id, SubmitResultRequest request) async {
    if (submitError != null) throw submitError!;
    submitted.add(request);
    return submittedParticipant ??
        Participant(
          userId: 'u1',
          displayName: 'Priya',
          handle: '#Pri',
          inviteState: InviteState.accepted,
          resultState: ResultState.submitted,
          joinedAt: DateTime.utc(2026),
        );
  }

  /// Recorded (challengeId, subjectUserId, approved) verify calls.
  final List<(String, String, bool)> verified = [];

  @override
  Future<void> verifyResult({
    required String challengeId,
    required String subjectUserId,
    required bool approved,
  }) async {
    verified.add((challengeId, subjectUserId, approved));
  }
}
